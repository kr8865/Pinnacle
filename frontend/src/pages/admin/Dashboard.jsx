import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiUsers, FiCheckSquare, FiClock, FiFileText, FiBookOpen, FiDollarSign,
  FiAlertCircle, FiUserCheck, FiUserPlus, FiCreditCard, FiEdit3,
} from 'react-icons/fi';
import analyticsService from '../../services/analytics.service';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import { SkeletonCard } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import StatusPill from '../../components/Badge';
import RevenueChart from '../../components/charts/RevenueChart';
import AdmissionsChart from '../../components/charts/AdmissionsChart';

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function RecentAdmissionRow({ item }) {
  const name = item.studentName || item.name || item.student?.name || 'Unknown Student';
  const status = item.admissionStatus || item.status;
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink dark:text-ink-light">{name}</p>
        <p className="truncate text-xs text-ink-muted dark:text-ink-lightMuted">
          {item.course?.name || item.selectedCourse?.name || 'Course not set'} · {formatDateTime(item.createdAt)}
        </p>
      </div>
      {status && <StatusPill status={status} />}
    </div>
  );
}

function RecentPaymentRow({ item }) {
  const name = item.student?.name || item.studentName || 'Student';
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink dark:text-ink-light">{name}</p>
        <p className="truncate text-xs text-ink-muted dark:text-ink-lightMuted">
          {formatCurrency(item.amount)} · {formatDateTime(item.createdAt)}
        </p>
      </div>
      {item.status && <StatusPill status={item.status} />}
    </div>
  );
}

function RecentAssignmentRow({ item }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink dark:text-ink-light">{item.title || 'Assignment'}</p>
        <p className="truncate text-xs text-ink-muted dark:text-ink-lightMuted">
          {item.course?.name || 'General'} · Due {formatDateTime(item.dueDate)}
        </p>
      </div>
      {item.status && <StatusPill status={item.status} />}
    </div>
  );
}

function ActivityCard({ title, icon: Icon, items, renderRow, emptyLabel }) {
  return (
    <div className="card p-5">
      <div className="mb-1 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-semibold text-ink dark:text-ink-light">{title}</h3>
      </div>
      {items?.length ? (
        <div className="divide-y divide-surface-border dark:divide-surface-darkBorder">
          {items.map((item, i) => (
            <React.Fragment key={item._id || item.id || i}>{renderRow(item)}</React.Fragment>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-ink-muted dark:text-ink-lightMuted">{emptyLabel}</p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Admin';

  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [totals, setTotals] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [admissionsData, setAdmissionsData] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setErrored(false);
        const [dashRes, revRes, admRes] = await Promise.all([
          analyticsService.dashboard(),
          analyticsService.graphs('revenue'),
          analyticsService.graphs('admissions'),
        ]);
        if (!active) return;
        setTotals(dashRes?.data?.data || null);
        setRevenueData(revRes?.data?.data || []);
        setAdmissionsData(admRes?.data?.data || []);
      } catch (err) {
        if (!active) return;
        setErrored(true);
        toast.error(err?.response?.data?.message || 'Failed to load dashboard');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const stats = totals
    ? [
        { icon: FiUsers, label: 'Total Students', value: totals.totals?.students ?? 0, tone: 'brand' },
        {
          icon: FiCheckSquare,
          label: "Today's Attendance",
          value: `${totals.todayAttendance?.present ?? 0}/${totals.todayAttendance?.total ?? 0} (${totals.todayAttendance?.percentage ?? 0}%)`,
          tone: 'success',
        },
        { icon: FiClock, label: 'Assignments Published', value: totals.assignments?.published ?? 0, tone: 'warning' },
        { icon: FiFileText, label: 'Assignments Submitted', value: totals.assignments?.submitted ?? 0, tone: 'info' },
        { icon: FiBookOpen, label: 'Active Courses', value: totals.totals?.courses ?? 0, tone: 'brand' },
        { icon: FiDollarSign, label: 'Revenue', value: formatCurrency(totals.revenue), tone: 'success' },
        { icon: FiAlertCircle, label: 'Fee Due', value: formatCurrency(totals.feeDue), tone: 'danger' },
        { icon: FiUserCheck, label: 'Active Students', value: totals.totals?.activeStudents ?? 0, tone: 'coral' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl px-1 pb-2 pt-6 sm:px-2">
        <div className="pointer-events-none absolute -top-16 left-10 h-64 w-64 rounded-full bg-warm-glow opacity-40 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-3xl">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted dark:text-ink-lightMuted">
            Here's what's happening across Pinnacle today.
          </p>
        </motion.div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}

        {!loading && errored && (
          <div className="col-span-full">
            <EmptyState
              icon={FiAlertCircle}
              title="Couldn't load dashboard data"
              description="Please refresh the page or try again in a moment."
            />
          </div>
        )}

        {!loading &&
          !errored &&
          stats.map((s, i) => <StatCard key={s.label} {...s} index={i} />)}
      </div>

      {/* Charts */}
      {!loading && !errored && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                <FiDollarSign className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-ink dark:text-ink-light">Revenue Trend</h3>
            </div>
            <RevenueChart data={revenueData} dataKey="total" labelKey="date" />
          </div>
          <div className="card p-5">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent-coral/10 text-accent-coral">
                <FiUserPlus className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-ink dark:text-ink-light">Admissions Trend</h3>
            </div>
            <AdmissionsChart data={admissionsData} dataKey="count" labelKey="date" />
          </div>
        </div>
      )}

      {/* Recent activity */}
      {!loading && !errored && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ActivityCard
            title="Recent Admissions"
            icon={FiUserPlus}
            items={totals?.recentAdmissions}
            renderRow={(item) => <RecentAdmissionRow item={item} />}
            emptyLabel="No recent admissions"
          />
          <ActivityCard
            title="Recent Payments"
            icon={FiCreditCard}
            items={totals?.recentPayments}
            renderRow={(item) => <RecentPaymentRow item={item} />}
            emptyLabel="No recent payments"
          />
          <ActivityCard
            title="Recent Assignments"
            icon={FiEdit3}
            items={totals?.recentAssignments}
            renderRow={(item) => <RecentAssignmentRow item={item} />}
            emptyLabel="No recent assignments"
          />
        </div>
      )}
    </div>
  );
}
