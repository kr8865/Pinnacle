import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiCalendar, FiCheckCircle, FiXCircle, FiPercent, FiTrendingUp } from 'react-icons/fi';
import attendanceService from '../../services/attendance.service';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import EmptyState from '../../components/EmptyState';
import StatusPill from '../../components/Badge';
import { SkeletonCard } from '../../components/Skeleton';
import AttendanceChart, { AttendanceDonut } from '../../components/charts/AttendanceChart';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

/**
 * Adapts whatever shape `summary.monthly` comes back as into the
 * [{ label, present, absent, leave }] shape AttendanceChart expects.
 * Assumption: each monthly entry has some combination of
 * month/label/name + present/absent/leave counts — we fall back
 * gracefully if a field is missing.
 */
function toChartSeries(monthly) {
  if (!Array.isArray(monthly)) return [];
  return monthly.map((m, i) => ({
    label: m.label || m.month || m.name || MONTHS[(m.monthIndex ?? i) % 12]?.slice(0, 3) || `#${i + 1}`,
    present: Number(m.present || 0),
    absent: Number(m.absent || 0),
    leave: Number(m.leave || 0),
  }));
}

export default function Attendance() {
  const { user } = useAuth();
  const studentId = user?.studentProfile?._id;

  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  const [recordsLoading, setRecordsLoading] = useState(true);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    if (!studentId) {
      setSummaryLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        setSummaryLoading(true);
        const res = await attendanceService.summary(studentId);
        if (!active) return;
        setSummary(res?.data?.data || null);
      } catch (err) {
        if (!active) return;
        toast.error(err?.response?.data?.message || 'Failed to load attendance summary');
      } finally {
        if (active) setSummaryLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [studentId]);

  useEffect(() => {
    if (!studentId) {
      setRecordsLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        setRecordsLoading(true);
        const res = await attendanceService.list({ student: studentId, month, year });
        if (!active) return;
        const data = res?.data?.data;
        setRecords(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!active) return;
        toast.error(err?.response?.data?.message || 'Failed to load attendance records');
      } finally {
        if (active) setRecordsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [studentId, month, year]);

  const chartData = useMemo(() => toChartSeries(summary?.monthly), [summary]);

  const years = useMemo(() => {
    const current = now.getFullYear();
    return [current, current - 1, current - 2];
  }, [now]);

  const columns = [
    { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
    {
      key: 'course',
      label: 'Course',
      render: (row) => row.course?.name || row.course?.title || '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusPill status={row.status} />,
    },
  ];

  if (!studentId) {
    return (
      <EmptyState
        icon={FiCalendar}
        title="Attendance unavailable"
        description="We couldn't find your student profile. Please contact the administrator."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl px-1 pb-2 pt-6 sm:px-2">
        <div className="pointer-events-none absolute -top-16 left-10 h-64 w-64 rounded-full bg-warm-glow opacity-40 blur-3xl" />
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-3xl">
            My Attendance
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted dark:text-ink-lightMuted">
            Track your presence, leaves and monthly attendance trend.
          </p>
        </motion.div>
      </div>

      {summaryLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={FiCheckCircle} label="Present" value={summary?.present ?? 0} tone="success" index={0} />
          <StatCard icon={FiXCircle} label="Absent" value={summary?.absent ?? 0} tone="danger" index={1} />
          <StatCard
            icon={FiPercent}
            label="Attendance %"
            value={`${Number(summary?.percentage ?? 0).toFixed(1)}%`}
            tone="brand"
            index={2}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
              <FiPercent className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-ink dark:text-ink-light">Overall Split</h3>
          </div>
          {summaryLoading ? (
            <div className="flex h-[220px] items-center justify-center">
              <SkeletonCard className="h-40 w-40 rounded-full" />
            </div>
          ) : (
            <AttendanceDonut present={summary?.present ?? 0} absent={summary?.absent ?? 0} leave={summary?.leave ?? 0} />
          )}
        </div>

        <div className="card p-5">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent-coral/10 text-accent-coral">
              <FiTrendingUp className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-ink dark:text-ink-light">Monthly Trend</h3>
          </div>
          {summaryLoading ? (
            <div className="flex h-[220px] items-center justify-center">
              <SkeletonCard className="h-40 w-full" />
            </div>
          ) : (
            <AttendanceChart data={chartData} />
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-ink dark:text-ink-light">Daily Log</h3>
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="input-field w-auto py-2 text-sm"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="input-field w-auto py-2 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={records}
          loading={recordsLoading}
          rowKey={(row) => row._id || row.id}
          emptyTitle="No attendance records"
          emptyDescription="No attendance has been marked for this month yet."
        />
      </div>
    </div>
  );
}
