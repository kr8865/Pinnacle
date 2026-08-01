import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiTarget, FiEye, FiHeart, FiAward, FiUsers, FiBookOpen, FiTrendingUp, FiArrowRight,
} from 'react-icons/fi';

const values = [
  {
    icon: FiTarget,
    title: 'Result-Driven Teaching',
    description: 'Every lesson is designed around measurable outcomes — clear concepts, strong fundamentals and consistent scores.',
  },
  {
    icon: FiHeart,
    title: 'Genuine Mentorship',
    description: 'Our faculty knows every student by name, not roll number — personal attention is at the heart of what we do.',
  },
  {
    icon: FiEye,
    title: 'Transparent Progress',
    description: 'Regular tests, attendance tracking and parent updates keep everyone aligned on where a student stands.',
  },
  {
    icon: FiAward,
    title: 'Proven Track Record',
    description: 'Fifteen years of consistent board results and hundreds of students placed in top schools and colleges.',
  },
];

const timeline = [
  { year: '2011', title: 'Pinnacle Founded', description: 'Started as a single-room Mathematics coaching class in Model Town with 12 students.' },
  { year: '2015', title: 'Expanded to Sciences', description: 'Added Physics, Chemistry and Biology faculty as demand grew across Class 10-12.' },
  { year: '2019', title: 'New Campus', description: 'Moved into a larger, purpose-built campus with smart classrooms and a dedicated library.' },
  { year: '2023', title: 'Digital Learning Launch', description: 'Introduced our student LMS portal for study material, assignments and online test series.' },
  { year: '2026', title: '500+ Students Strong', description: 'Now mentoring over 500 students every year with a 98% board result rate.' },
];

export default function About() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="bg-blob-field absolute inset-0 -z-10">
          <div className="blob h-96 w-96 -top-24 -left-24" />
        </div>
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-5xl"
          >
            About Pinnacle
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mx-auto mt-5 max-w-2xl text-ink-muted dark:text-ink-lightMuted"
          >
            For over 15 years, Pinnacle Tuition Classes has been a trusted name in academic
            excellence — helping students in Classes 10, 11 and 12 build strong foundations,
            achieve top board results, and grow into confident, capable learners.
          </motion.p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card p-8"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
              <FiTarget className="h-6 w-6" />
            </div>
            <h2 className="font-display text-xl font-bold text-ink dark:text-ink-light">Our Mission</h2>
            <p className="mt-3 text-sm text-ink-muted dark:text-ink-lightMuted">
              To provide every student with structured, high-quality coaching that builds genuine
              subject mastery — not just exam scores — through expert teaching, continuous
              assessment and personalised guidance.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="card p-8"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-coral/10 text-accent-coral">
              <FiEye className="h-6 w-6" />
            </div>
            <h2 className="font-display text-xl font-bold text-ink dark:text-ink-light">Our Vision</h2>
            <p className="mt-3 text-sm text-ink-muted dark:text-ink-lightMuted">
              To be the most trusted coaching institute in the region — recognised not just for
              results, but for the character, confidence and curiosity we help build in every
              student who walks through our doors.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">
            Why Pinnacle
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink dark:text-ink-light">
            What We Stand For
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card flex flex-col gap-3 p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-ink dark:text-ink-light">{v.title}</h3>
              <p className="text-sm text-ink-muted dark:text-ink-lightMuted">{v.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">
            Our Journey
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink dark:text-ink-light">
            15 Years of Growth
          </h2>
        </div>
        <div className="mt-12 space-y-6">
          {timeline.map((t, i) => (
            <motion.div
              key={t.year}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="card flex gap-5 p-6"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient font-display text-sm font-extrabold text-white">
                {t.year}
              </div>
              <div>
                <h3 className="font-display font-bold text-ink dark:text-ink-light">{t.title}</h3>
                <p className="mt-1 text-sm text-ink-muted dark:text-ink-lightMuted">{t.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-6 rounded-3xl bg-brand-gradient p-10 text-center text-white sm:grid-cols-3 sm:text-left"
        >
          <div className="flex items-center gap-4">
            <FiUsers className="h-8 w-8 shrink-0" />
            <div>
              <div className="font-display text-2xl font-extrabold">500+</div>
              <div className="text-sm text-white/80">Students Mentored</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <FiBookOpen className="h-8 w-8 shrink-0" />
            <div>
              <div className="font-display text-2xl font-extrabold">50+</div>
              <div className="text-sm text-white/80">Expert Faculty</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <FiTrendingUp className="h-8 w-8 shrink-0" />
            <div>
              <div className="font-display text-2xl font-extrabold">98%</div>
              <div className="text-sm text-white/80">Board Result Rate</div>
            </div>
          </div>
        </motion.div>
        <div className="mt-10 text-center">
          <Link to="/admission" className="btn-primary">
            Join Pinnacle Today <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
