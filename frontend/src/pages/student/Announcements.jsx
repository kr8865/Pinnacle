import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiSpeaker } from 'react-icons/fi';
import announcementsService from '../../services/announcements.service';
import EmptyState from '../../components/EmptyState';
import { SkeletonCard } from '../../components/Skeleton';

const AUDIENCE_LABEL = {
  all: 'Everyone',
  class: 'Class',
  course: 'Course',
};

function timeAgo(value) {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const diffSeconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

  const units = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const unit of units) {
    const amount = Math.floor(diffSeconds / unit.seconds);
    if (amount >= 1) {
      return `${amount} ${unit.label}${amount > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}

function audienceLabel(announcement) {
  if (announcement.audience === 'class' && announcement.targetClass) {
    return `Class ${announcement.targetClass}`;
  }
  if (announcement.audience === 'course' && announcement.targetCourse?.name) {
    return announcement.targetCourse.name;
  }
  return AUDIENCE_LABEL[announcement.audience] || 'Everyone';
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await announcementsService.list({ limit: 50 });
      const list = res?.data?.data || [];
      const sorted = [...list].sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.createdAt).getTime();
        const dateB = new Date(b.publishedAt || b.createdAt).getTime();
        return dateB - dateA;
      });
      setAnnouncements(sorted);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl px-1 pb-2 pt-6 sm:px-2">
        <div className="pointer-events-none absolute -top-16 left-10 h-64 w-64 rounded-full bg-warm-glow opacity-40 blur-3xl" />
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-3xl">
            Announcements
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted dark:text-ink-lightMuted">
            Stay up to date with the latest updates from Pinnacle.
          </p>
        </motion.div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && announcements.length === 0 && (
        <EmptyState
          icon={FiSpeaker}
          title="No announcements yet"
          description="Updates from the Pinnacle team will show up here."
        />
      )}

      {!loading && announcements.length > 0 && (
        <div className="space-y-4">
          {announcements.map((announcement, i) => (
            <motion.div
              key={announcement._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i, 6) * 0.05 }}
              className="card p-5"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                  <FiSpeaker className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink dark:text-ink-light">{announcement.title}</h3>
                    <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium text-ink-muted dark:bg-white/5 dark:text-ink-lightMuted">
                      {audienceLabel(announcement)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted dark:text-ink-lightMuted">
                    {announcement.body}
                  </p>
                  <p className="mt-3 text-xs text-ink-lightMuted">
                    Posted {timeAgo(announcement.publishedAt || announcement.createdAt)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
