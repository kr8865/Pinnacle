import React from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiUsers, FiTrendingUp, FiStar, FiBookOpen, FiTarget } from 'react-icons/fi';

const highlightStats = [
  { icon: FiUsers, label: 'Students Mentored', value: '500+', tone: 'brand' },
  { icon: FiTrendingUp, label: 'Board Result Rate', value: '98%', tone: 'success' },
  { icon: FiAward, label: 'State/District Toppers', value: '35+', tone: 'warning' },
  { icon: FiStar, label: 'Google Rating', value: '4.9/5', tone: 'info' },
];

const tints = {
  brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
};

const achievements = [
  {
    icon: FiAward,
    title: 'Best Coaching Institute Award 2025',
    description: 'Recognised by the Regional Education Excellence Board for outstanding board exam results and teaching quality.',
  },
  {
    icon: FiTarget,
    title: '35+ District & State Rank Holders',
    description: 'Our students have consistently secured top ranks in CBSE and State Board examinations over the past 5 years.',
  },
  {
    icon: FiBookOpen,
    title: '100% Pass Rate, 5 Years Running',
    description: 'Every single Pinnacle student who appeared for board examinations in the last five years has passed.',
  },
  {
    icon: FiUsers,
    title: 'Alumni in Top Colleges',
    description: 'Our alumni now study at IITs, NITs, AIIMS, and other premier institutions across the country.',
  },
  {
    icon: FiStar,
    title: 'Highest Rated Institute in the City',
    description: 'Rated 4.9/5 by parents and students on Google Reviews, based on over 400 verified reviews.',
  },
  {
    icon: FiTrendingUp,
    title: 'Consistent Year-on-Year Growth',
    description: 'Grown from 12 students in 2011 to over 500 students annually, driven entirely by word-of-mouth referrals.',
  },
];

export default function Achievements() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl">
        <div className="bg-blob-field absolute inset-0 -z-10">
          <div className="blob h-80 w-80 -top-16 -left-16" />
        </div>
        <div className="mx-auto max-w-2xl py-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-4xl"
          >
            Our Achievements
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-3 text-ink-muted dark:text-ink-lightMuted"
          >
            Fifteen years of dedication reflected in the numbers, awards and success stories of
            our students.
          </motion.p>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {highlightStats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="card flex flex-col items-center gap-2 p-6 text-center"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tints[s.tone]}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="font-display text-2xl font-extrabold text-ink dark:text-ink-light">{s.value}</div>
            <div className="text-xs font-medium text-ink-muted dark:text-ink-lightMuted">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a, i) => (
          <motion.div
            key={a.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="card flex flex-col gap-3 p-6"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-peach/10 text-accent-coral">
              <a.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display font-bold text-ink dark:text-ink-light">{a.title}</h3>
            <p className="text-sm text-ink-muted dark:text-ink-lightMuted">{a.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
