import React, { useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiCalendar, FiSave, FiUsers, FiFilter, FiCheck, FiX, FiClock } from 'react-icons/fi';
import attendanceService from '../../services/attendance.service';
import studentsService from '../../services/students.service';
import coursesService from '../../services/courses.service';
import DataTable from '../../components/DataTable';
import EmptyState from '../../components/EmptyState';
import StatusPill from '../../components/Badge';
import { Skeleton, SkeletonTable } from '../../components/Skeleton';
import AttendanceChart, { AttendanceDonut } from '../../components/charts/AttendanceChart';

const todayIso = () => new Date().toISOString().slice(0, 10);

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', icon: FiCheck, tone: 'success' },
  { value: 'absent', label: 'Absent', icon: FiX, tone: 'danger' },
  { value: 'leave', label: 'Leave', icon: FiClock, tone: 'warning' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function courseLabel(course) {
  if (!course) return '';
  return [course.name, course.subject].filter(Boolean).join(' · ');
}

export default function Attendance() {
  const now = new Date();

  // ---- Shared course list ----
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await coursesService.list({ limit: 200 });
        if (active) setCourses(data?.data || []);
      } catch {
        toast.error('Could not load courses');
      } finally {
        if (active) setCoursesLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // ---- Mark attendance grid ----
  const [markCourse, setMarkCourse] = useState('');
  const [markDate, setMarkDate] = useState(todayIso());
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [records, setRecords] = useState({}); // { studentId: 'present'|'absent'|'leave' }
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!markCourse || !markDate) {
      setRoster([]);
      setRecords({});
      return;
    }

    let active = true;
    setRosterLoading(true);

    (async () => {
      try {
        const [{ data: studentsRes }, { data: attendanceRes }] = await Promise.all([
          studentsService.list({ course: markCourse, status: 'approved', limit: 200 }),
          attendanceService.list({
            course: markCourse,
            month: Number(markDate.slice(5, 7)),
            year: Number(markDate.slice(0, 4)),
            limit: 200,
          }),
        ]);

        if (!active) return;

        const students = studentsRes?.data || [];
        setRoster(students);

        const existingForDate = new Map(
          (attendanceRes?.data || [])
            .filter((rec) => String(rec.date).slice(0, 10) === markDate)
            .map((rec) => [String(rec.student?._id || rec.student), rec.status])
        );

        const initial = {};
        students.forEach((s) => {
          initial[s._id] = existingForDate.get(String(s._id)) || 'present';
        });
        setRecords(initial);
      } catch {
        if (active) toast.error('Could not load roster for this course');
      } finally {
        if (active) setRosterLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [markCourse, markDate]);

  const setStatus = (studentId, status) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    setRecords((prev) => {
      const next = { ...prev };
      roster.forEach((s) => {
        next[s._id] = status;
      });
      return next;
    });
  };

  const handleSaveAttendance = async () => {
    if (!markCourse || !markDate) {
      toast.error('Select a course and date first');
      return;
    }
    if (!roster.length) {
      toast.error('No students found for this course');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        course: markCourse,
        date: markDate,
        records: roster.map((s) => ({ student: s._id, status: records[s._id] || 'present' })),
      };
      await attendanceService.mark(payload);
      toast.success('Attendance saved successfully');
      setHistoryRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  // ---- Historical filter + table + chart ----
  const [filterStudent, setFilterStudent] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [filterStudents, setFilterStudents] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await studentsService.list({
          course: filterCourse || undefined,
          status: 'approved',
          limit: 200,
        });
        if (active) setFilterStudents(data?.data || []);
      } catch {
        // non-fatal — student filter dropdown just stays empty
      }
    })();
    return () => {
      active = false;
    };
  }, [filterCourse]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { data } = await attendanceService.list({
        student: filterStudent || undefined,
        course: filterCourse || undefined,
        month: filterMonth || undefined,
        year: filterYear || undefined,
        limit: 200,
      });
      setHistory(data?.data || []);
    } catch {
      toast.error('Could not load attendance records');
    } finally {
      setHistoryLoading(false);
    }
  }, [filterStudent, filterCourse, filterMonth, filterYear]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, historyRefreshKey]);

  const chartData = useMemo(() => {
    const byDate = new Map();
    history.forEach((rec) => {
      const day = String(rec.date).slice(0, 10);
      if (!byDate.has(day)) byDate.set(day, { label: day.slice(8, 10), present: 0, absent: 0, leave: 0 });
      const entry = byDate.get(day);
      entry[rec.status] = (entry[rec.status] || 0) + 1;
    });
    return Array.from(byDate.entries())
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .map(([, v]) => v);
  }, [history]);

  const totals = useMemo(() => {
    return history.reduce(
      (acc, rec) => {
        acc[rec.status] = (acc[rec.status] || 0) + 1;
        return acc;
      },
      { present: 0, absent: 0, leave: 0 }
    );
  }, [history]);

  const historyColumns = [
    {
      key: 'date',
      label: 'Date',
      render: (row) => new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      key: 'student',
      label: 'Student',
      render: (row) => row.student?.user?.name || row.student?.studentId || '—',
    },
    {
      key: 'course',
      label: 'Course',
      render: (row) => courseLabel(row.course) || '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusPill status={row.status} />,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink dark:text-ink-light">Attendance</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-lightMuted">
          Mark daily attendance and review historical records by course, student and month.
        </p>
      </div>

      {/* Mark attendance */}
      <div className="card p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <FiUsers className="h-5 w-5 text-brand-500" />
          <h2 className="text-lg font-semibold text-ink dark:text-ink-light">Mark Attendance</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label-text">Course</label>
            <select
              className="input-field"
              value={markCourse}
              onChange={(e) => setMarkCourse(e.target.value)}
              disabled={coursesLoading}
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {courseLabel(c)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">Date</label>
            <div className="relative">
              <FiCalendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-lightMuted" />
              <input
                type="date"
                className="input-field pl-11"
                value={markDate}
                max={todayIso()}
                onChange={(e) => setMarkDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => markAll('present')} disabled={!roster.length}>
              Mark all present
            </button>
          </div>
        </div>

        {!markCourse || !markDate ? (
          <EmptyState
            icon={FiUsers}
            title="Select a course and date"
            description="Choose a course and date above to load the student roster for marking attendance."
          />
        ) : rosterLoading ? (
          <SkeletonTable rows={5} cols={2} />
        ) : !roster.length ? (
          <EmptyState title="No students found" description="No approved students are enrolled in this course." />
        ) : (
          <>
            <div className="divide-y divide-surface-border overflow-hidden rounded-2xl border border-surface-border dark:divide-surface-darkBorder dark:border-surface-darkBorder">
              {roster.map((s) => (
                <div key={s._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink dark:text-ink-light">{s.user?.name || 'Unnamed'}</p>
                    <p className="truncate text-xs text-ink-muted dark:text-ink-lightMuted">{s.studentId || s.registrationNumber || '—'}</p>
                  </div>
                  <div className="inline-flex rounded-full border border-surface-border bg-black/[0.02] p-1 dark:border-surface-darkBorder dark:bg-white/[0.03]">
                    {STATUS_OPTIONS.map((opt) => {
                      const active = (records[s._id] || 'present') === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setStatus(s._id, opt.value)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                            active
                              ? opt.tone === 'success'
                                ? 'bg-success text-white'
                                : opt.tone === 'danger'
                                ? 'bg-danger text-white'
                                : 'bg-warning text-white'
                              : 'text-ink-muted dark:text-ink-lightMuted hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          <opt.icon className="h-3.5 w-3.5" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button type="button" className="btn-primary" onClick={handleSaveAttendance} disabled={saving}>
                <FiSave className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Historical filter + chart */}
      <div className="card p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <FiFilter className="h-5 w-5 text-brand-500" />
          <h2 className="text-lg font-semibold text-ink dark:text-ink-light">Attendance History</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="label-text">Course</label>
            <select className="input-field" value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {courseLabel(c)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">Student</label>
            <select className="input-field" value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)}>
              <option value="">All students</option>
              {filterStudents.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.user?.name || s.studentId}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">Month</label>
            <select className="input-field" value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">Year</label>
            <select className="input-field" value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}>
              {Array.from({ length: 5 }).map((_, i) => {
                const y = now.getFullYear() - 3 + i;
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {historyLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AttendanceChart data={chartData} />
            </div>
            <div className="flex flex-col items-center justify-center gap-2">
              <AttendanceDonut present={totals.present} absent={totals.absent} leave={totals.leave} />
              <div className="flex gap-4 text-xs text-ink-muted dark:text-ink-lightMuted">
                <span>Present: {totals.present}</span>
                <span>Absent: {totals.absent}</span>
                <span>Leave: {totals.leave}</span>
              </div>
            </div>
          </div>
        )}

        <DataTable
          columns={historyColumns}
          data={history}
          loading={historyLoading}
          rowKey="_id"
          emptyTitle="No attendance records"
          emptyDescription="No records match the selected filters."
        />
      </div>
    </div>
  );
}
