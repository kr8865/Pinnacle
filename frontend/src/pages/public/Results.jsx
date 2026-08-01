import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAward, FiTrendingUp } from 'react-icons/fi';
import Avatar from '../../components/Avatar';

const toppers = [
  { name: 'Aarav Gupta', classLevel: '12', percentage: '98.4%', subject: 'Science', year: '2026' },
  { name: 'Ishita Sharma', classLevel: '12', percentage: '97.8%', subject: 'Commerce', year: '2026' },
  { name: 'Kabir Malhotra', classLevel: '10', percentage: '98.2%', subject: 'All Subjects', year: '2026' },
  { name: 'Sneha Reddy', classLevel: '11', percentage: '96.5%', subject: 'Science', year: '2025' },
  { name: 'Dev Patel', classLevel: '10', percentage: '97.6%', subject: 'All Subjects', year: '2025' },
  { name: 'Ananya Iyer', classLevel: '12', percentage: '97.1%', subject: 'Science', year: '2025' },
  { name: 'Rohan Kapoor', classLevel: '11', percentage: '95.9%', subject: 'Commerce', year: '2025' },
  { name: 'Meera Joshi', classLevel: '10', percentage: '96.8%', subject: 'All Subjects', year: '2024' },
  { name: 'Vivaan Singh', classLevel: '12', percentage: '96.3%', subject: 'Science', year: '2024' },
];

const classFilters = [
  { label: 'All', value: '' },
  { label: 'Class 10', value: '10' },
  { label: 'Class 11', value: '11' },
  { label: 'Class 12', value: '12' },
];

const yearlyStats = [
  { year: '2026', avg: '92.4%', toppers: 12 },
  { year: '2025', avg: '91.1%', toppers: 15 },
  { year: '2024', avg: '90.6%', toppers: 9 },
];

export default function Results() {
  const [filter, setFilter] = useState('');

  const filtered = useMemo(
    () => (filter ? toppers.filter((t) => t.classLevel === filter) : toppers),
    [filter]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl">
        <div className="bg-blob-field absolute inset-0 -z-10">
          <div className="blob h-80 w-80 -top-16 -right-16" />
        </div>
        <div className="mx-auto max-w-2xl py-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-4xl"
          >
            Board Results &amp; Toppers
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-3 text-ink-muted dark:text-ink-lightMuted"
          >
            A glimpse of the achievements our students have earned in recent board examinations.
          </motion.p>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {yearlyStats.map((y, i) => (
          <motion.div
            key={y.year}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card flex items-center justify-between p-6"
          >
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-ink-lightMuted">
                {y.year} Batch
              </div>
              <div className="mt-1 font-display text-2xl font-extrabold text-ink dark:text-ink-light">
                {y.avg} <span className="text-sm font-medium text-ink-muted dark:text-ink-lightMuted">avg. score</span>
              </div>
              <div className="mt-1 text-xs text-ink-muted dark:text-ink-lightMuted">{y.toppers} rank holders</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
              <FiTrendingUp className="h-6 w-6" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-2">
        {classFilters.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              filter === f.value
                ? 'bg-brand-gradient text-white shadow-soft'
                : 'bg-black/5 text-ink-muted hover:bg-black/10 dark:bg-white/5 dark:text-ink-lightMuted dark:hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((t, i) => (
            <motion.div
              key={t.name}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="card flex items-center gap-4 p-6"
            >
              <Avatar name={t.name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-display font-bold text-ink dark:text-ink-light">{t.name}</h3>
                  <FiAward className="h-4 w-4 shrink-0 text-warning" />
                </div>
                <p className="text-xs text-ink-muted dark:text-ink-lightMuted">
                  Class {t.classLevel} &middot; {t.subject} &middot; {t.year}
                </p>
                <p className="mt-1 font-display text-lg font-extrabold text-brand-600 dark:text-brand-300">
                  {t.percentage}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
