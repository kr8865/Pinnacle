import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiBell, FiCheckCircle } from 'react-icons/fi';
import { SkeletonTable } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import notificationsService from '../../services/notifications.service';

const typeTone = {
  assignment: 'text-brand-600 dark:text-brand-300',
  exam: 'text-info',
  fee: 'text-accent-coral',
  attendance: 'text-warning',
  announcement: 'text-success',
  message: 'text-info',
  system: 'text-ink-muted dark:text-ink-lightMuted',
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const { data } = await notificationsService.list({ page: targetPage, limit: 10 });
      setNotifications(data?.data || []);
      setPage(data?.meta?.page || targetPage);
      setPages(data?.meta?.pages || 1);
      setTotal(data?.meta?.total || 0);
      setUnreadCount(data?.meta?.unreadCount || 0);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const handleMarkRead = async (notification) => {
    if (notification.isRead) return;
    try {
      await notificationsService.markRead(notification._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink dark:text-ink-light">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-lightMuted">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'You are all caught up'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={markingAll || unreadCount === 0}
          className="btn-secondary"
        >
          <FiCheckCircle className="h-4 w-4" /> {markingAll ? 'Marking...' : 'Mark all as read'}
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-4">
            <SkeletonTable rows={6} cols={1} />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState icon={FiBell} title="No notifications" description="New announcements and alerts will show up here." />
        ) : (
          <ul className="divide-y divide-surface-border dark:divide-surface-darkBorder">
            {notifications.map((n) => (
              <li key={n._id}>
                <button
                  type="button"
                  onClick={() => handleMarkRead(n)}
                  className={`flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03] ${
                    !n.isRead ? 'bg-brand-500/[0.03]' : ''
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.isRead ? 'bg-transparent' : 'bg-brand-500'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className={`truncate text-sm ${
                          n.isRead
                            ? 'font-normal text-ink-muted dark:text-ink-lightMuted'
                            : 'font-semibold text-ink dark:text-ink-light'
                        }`}
                      >
                        {n.title}
                      </p>
                      <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide ${typeTone[n.type] || 'text-ink-lightMuted'}`}>
                        {n.type}
                      </span>
                    </div>
                    {n.body && (
                      <p className="mt-1 text-sm text-ink-muted dark:text-ink-lightMuted">{n.body}</p>
                    )}
                    <p className="mt-1.5 text-xs text-ink-lightMuted">{formatDate(n.createdAt)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!loading && notifications.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-surface-border px-4 py-3 dark:border-surface-darkBorder">
            <span className="text-xs text-ink-muted dark:text-ink-lightMuted">
              Page {page} of {pages || 1} · {total} total
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => load(page - 1)}
                className="btn-ghost h-9 w-9 border border-surface-border disabled:opacity-40 dark:border-surface-darkBorder"
              >
                &lt;
              </button>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => load(page + 1)}
                className="btn-ghost h-9 w-9 border border-surface-border disabled:opacity-40 dark:border-surface-darkBorder"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
