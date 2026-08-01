import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiBriefcase, FiMapPin, FiClock, FiArrowRight, FiHeart, FiTrendingUp,
  FiUsers, FiCoffee, FiMail,
} from 'react-icons/fi';

const openings = [
  {
    title: 'Senior Physics Faculty (Class 11-12)',
    type: 'Full-time',
    location: 'Model Town Campus',
    experience: '5+ years',
    description: 'Teach board and competitive-level Physics, design chapter tests and mentor students on problem-solving techniques.',
  },
  {
    title: 'Mathematics Faculty (Class 10)',
    type: 'Full-time',
    location: 'Model Town Campus',
    experience: '3+ years',
    description: 'Own the Class 10 Mathematics curriculum, build practice worksheets and track student performance closely.',
  },
  {
    title: 'Front Office / Admissions Executive',
    type: 'Full-time',
    location: 'Model Town Campus',
    experience: '1-3 years',
    description: 'Handle walk-in enquiries, admission processing, parent communication and day-to-day front-desk operations.',
  },
  {
    title: 'Content Developer — Study Material',
    type: 'Part-time / Freelance',
    location: 'Remote',
    experience: '2+ years',
    description: 'Create chapter-wise notes, worksheets and previous-year question banks for our student LMS portal.',
  },
  {
    title: 'Digital Marketing Associate',
    type: 'Full-time',
    location: 'Model Town Campus',
    experience: '1-2 years',
    description: 'Manage social media, run local admission campaigns and support the marketing calendar for each academic session.',
  },
];

const perks = [
  { icon: FiHeart, title: 'Meaningful Work', description: 'Directly shape the academic future of hundreds of students every year.' },
  { icon: FiTrendingUp, title: 'Growth & Training', description: 'Regular training workshops, teaching-tool access and career growth paths.' },
  { icon: FiUsers, title: 'Collaborative Culture', description: 'Work alongside experienced faculty and a supportive administrative team.' },
  { icon: FiCoffee, title: 'Work-Life Balance', description: 'Structured academic-year schedules with reasonable working hours.' },
];

export default function Career() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="bg-blob-field absolute inset-0 -z-10">
          <div className="blob h-96 w-96 -top-24 -left-24" />
        </div>
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-600 dark:text-brand-300"
          >
            <FiBriefcase className="h-7 w-7" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-4xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-5xl"
          >
            Careers at Pinnacle
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-5 max-w-2xl text-ink-muted dark:text-ink-lightMuted"
          >
            Join a team that's passionate about teaching, mentorship and helping students reach
            their pinnacle. We're always looking for talented faculty and staff who share our
            commitment to academic excellence.
          </motion.p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card flex flex-col gap-3 p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold text-ink dark:text-ink-light">{p.title}</h3>
              <p className="text-sm text-ink-muted dark:text-ink-lightMuted">{p.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">
            Open Positions
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink dark:text-ink-light">
            Current Openings
          </h2>
        </div>

        <div className="space-y-4">
          {openings.map((job, i) => (
            <motion.div
              key={job.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold text-ink dark:text-ink-light">{job.title}</h3>
                <p className="mt-1 text-sm text-ink-muted dark:text-ink-lightMuted">{job.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium text-ink-muted dark:text-ink-lightMuted">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-brand-600 dark:text-brand-300">
                    <FiBriefcase className="h-3 w-3" /> {job.type}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <FiMapPin className="h-3 w-3" /> {job.location}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <FiClock className="h-3 w-3" /> {job.experience}
                  </span>
                </div>
              </div>
              <a
                href={`mailto:careers@pinnacletuition.com?subject=${encodeURIComponent(`Application for ${job.title}`)}`}
                className="btn-secondary shrink-0 !px-5 !py-2 text-sm"
              >
                Apply Now <FiArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-4 rounded-3xl bg-brand-gradient p-10 text-center text-white"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/15">
            <FiMail className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl font-extrabold">Don't See a Role That Fits?</h2>
          <p className="max-w-md text-sm text-white/80">
            We're always happy to hear from talented educators and staff. Send us your resume and
            we'll reach out when a suitable opening comes up.
          </p>
          <a
            href="mailto:careers@pinnacletuition.com?subject=General%20Application%20-%20Resume"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 font-semibold text-brand-600 shadow-soft hover:brightness-95 active:scale-[0.97] transition-all duration-200"
          >
            <FiMail className="h-4 w-4" /> Send Your Resume
          </a>
          <p className="text-xs text-white/70">careers@pinnacletuition.com</p>
        </motion.div>
        <div className="mt-8 text-center">
          <Link to="/contact" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300">
            Or reach out via our Contact page &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}
