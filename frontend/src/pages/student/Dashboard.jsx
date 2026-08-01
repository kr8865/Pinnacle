import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiEdit3, FiFileText, FiCheckSquare, FiCreditCard, FiBell,
  FiArrowRight, FiClipboard, FiCalendar,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import { SkeletonCard, SkeletonText } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import { AttendanceDonut } from '../../components/charts/AttendanceChart';
import attendanceService from '../../services/attendance.service';
import feesService from '../../services/fees.service';
import testsService from '../../services/tests.service';
import assignmentsService from '../../services/assignments.service';
import notificationsService from '../../services/notifications.service';

const quickActions = [
  { to: '/student/assignments', label: 'Assignments', description: 'View & submit pending work', icon: FiEdit3, tone: 'brand' },
  { to: '/student/study-material', label: 'Study Material', description: 'Notes, videos & PYQs', icon: FiFileText, tone: 'info' },
  { to: '/student/tests', label: 'Tests', description: 'Attempt tests & view results', icon: FiCheckSquare, tone: 'success' },
  { to: '/student/fees', label: 'Fees', description: 'Pay dues & view receipts', icon: FiCreditCard, tone: 'coral' },
];

const toneBg = {
  brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  coral: 'bg-accent-coral/10 text-accent-coral',
};

export default function Dashboard() {
  const { user } = useAuth();
  const studentProfile = user?.studentProfile;
  const firstName = user?.name?.split(' ')[0] || 'Student';

  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState(null);
  const [feeDue, setFeeDue] = useState(0);
  const [pendingAssignments, setPendingAssignments] = useState(0);
  const [upcomingTests, setUpcomingTests] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const studentId = studentProfile?._id;

      const results = await Promise.allSettled([
        studentId ? attendanceService.summary(studentId) : Promise.resolve(null),
        feesService.due(),
        testsService.list(),
        assignmentsService.list(),
        assignmentsService.mySubmissions(),
        notificationsService.list({ page: 1, limit: 5 }),
      ]);

      if (!mounted) return;

      const [attRes, feesRes, testsRes, assignRes, subsRes, notifRes] = results;

      if (attRes.status === 'fulfilled' && attRes.value) {
        setAttendance(attRes.value.data?.data || null);
      }

      if (feesRes.status === 'fulfilled') {
        const fees = feesRes.value.data?.data || [];
        const total = fees.reduce(
          (sum, f) => sum + (Number(f.amount || 0) - Number(f.discount || 0) - Number(f.scholarship || 0)),
          0
        );
        setFeeDue(total);
      }

      if (testsRes.status === 'fulfilled') {
        setUpcomingTests((testsRes.value.data?.data || []).length);
      }

      if (assignRes.status === 'fulfilled' && subsRes.status === 'fulfilled') {
        const assignments = assignRes.value.data?.data || [];
        const submissions = subsRes.value.data?.data || [];
        const submittedIds = new Set(
          submissions.map((s) => (typeof s.assignment === 'object' ? s.assignment?._id : s.assignment))
        );
        setPendingAssignments(assignments.filter((a) => !submittedIds.has(a._id)).length);
      }

      if (notifRes.status === 'fulfilled') {
        setNotifications(notifRes.value.data?.data || []);
      }

      const failed = results.find((r) => r.status === 'rejected');
      if (failed) toast.error('Some dashboard data could not be loaded');

      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [studentProfile?._id]);

  const attendancePercentage = attendance?.percentage != null ? Math.round(attendance.percentage) : null;

  return (
    <div className="space-y-6 pt-6">
      {/* Greeting header */}
      <div className="relative overflow-hidden rounded-3xl border border-surface-border bg-surface-card p-6 shadow-soft dark:border-surface-darkBorder dark:bg-surface-darkCard sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-warm-glow opacity-30 blur-3xl" />
        <div className="relative">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-3xl">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-lightMuted">
            {studentProfile?.course?.name
              ? `${studentProfile.course.name} · Class ${studentProfile.currentClass}`
              : 'Here is what is happening with your studies today.'}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={FiCalendar}
            label="Attendance"
            value={attendancePercentage != null ? `${attendancePercentage}%` : '—'}
            tone="success"
            index={0}
          />
          <StatCard
            icon={FiClipboard}
            label="Pending Assignments"
            value={pendingAssignments}
            tone="brand"
            index={1}
          />
          <StatCard
            icon={FiCreditCard}
            label="Fee Due"
            value={`₹${Number(feeDue || 0).toLocaleString('en-IN')}`}
            tone="coral"
            index={2}
          />
          <StatCard
            icon={FiCheckSquare}
            label="Upcoming Tests"
            value={upcomingTests}
            tone="info"
            index={3}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Attendance at a glance */}
        <div className="card p-5 lg:col-span-1">
          <h3 className="mb-2 text-sm font-semibold text-ink dark:text-ink-light">Attendance at a glance</h3>
          {loading ? (
            <SkeletonText lines={4} />
          ) : (
            <AttendanceDonut
              present={attendance?.present || 0}
              absent={attendance?.absent || 0}
              leave={attendance?.leave || 0}
            />
          )}
        </div>

        {/* Recent notifications */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink dark:text-ink-light">Recent Announcements</h3>
            <Link
              to="/student/notifications"
              className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-300"
            >
              View all <FiArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <SkeletonText lines={4} />
          ) : notifications.length === 0 ? (
            <EmptyState icon={FiBell} title="No notifications yet" description="You're all caught up." />
          ) : (
            <ul className="divide-y divide-surface-border dark:divide-surface-darkBorder">
              {notifications.slice(0, 5).map((n) => (
                <li key={n._id}>
                  <Link
                    to="/student/notifications"
                    className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        n.isRead ? 'bg-transparent' : 'bg-brand-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm ${
                          n.isRead
                            ? 'font-normal text-ink-muted dark:text-ink-lightMuted'
                            : 'font-semibold text-ink dark:text-ink-light'
                        }`}
                      >
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-0.5 truncate text-xs text-ink-lightMuted">{n.body}</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink dark:text-ink-light">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="card flex flex-col gap-3 p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneBg[action.tone]}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-ink dark:text-ink-light">{action.label}</p>
                <p className="mt-0.5 text-xs text-ink-muted dark:text-ink-lightMuted">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
