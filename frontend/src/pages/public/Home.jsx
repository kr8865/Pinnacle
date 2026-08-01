import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowRight, FiBookOpen, FiUsers, FiAward, FiTrendingUp, FiStar, FiCheckCircle,
} from 'react-icons/fi';
import coursesService from '../../services/courses.service';
import { SkeletonCard } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

const stats = [
  { icon: FiUsers, label: 'Students Mentored', value: '500+' },
  { icon: FiTrendingUp, label: 'Years of Excellence', value: '15+' },
  { icon: FiAward, label: 'Board Result Rate', value: '98%' },
  { icon: FiBookOpen, label: 'Expert Faculty', value: '50+' },
];

const testimonialsPreview = [
  {
    name: 'Ananya Sharma',
    course: 'Class 12, Physics',
    quote:
      'Pinnacle turned my weakest subject into my highest scoring one. The faculty explains concepts like nobody else — I finally understood physics instead of memorizing it.',
    rating: 5,
  },
  {
    name: 'Rohan Verma',
    course: 'Class 10, Mathematics',
    quote:
      'The doubt-clearing sessions and weekly tests kept me consistent all year. I went from an average student to a topper in my school.',
    rating: 5,
  },
  {
    name: 'Priya Nair',
    course: 'Class 11, Science',
    quote:
      'Small batches, personal attention, and a genuinely caring faculty team. Pinnacle feels less like a coaching center and more like a second home.',
    rating: 5,
  },
];

function StarRow({ count = 5 }) {
  return (
    <div className="flex items-center gap-0.5 text-warning">
      {Array.from({ length: count }).map((_, i) => (
        <FiStar key={i} className="h-4 w-4 fill-current" />
      ))}
    </div>
  );
}

function CourseCard({ course, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="card flex flex-col gap-4 p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
          <FiBookOpen className="h-6 w-6" />
        </div>
        {course.classLevel && (
          <span className="rounded-full bg-accent-peach/10 px-3 py-1 text-xs font-semibold text-accent-coral">
            Class {course.classLevel}
          </span>
        )}
      </div>
      <div>
        <h3 className="font-display text-lg font-bold text-ink dark:text-ink-light">
          {course.name || course.subject || 'Course'}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-ink-muted dark:text-ink-lightMuted">
          {course.description || `Comprehensive ${course.subject || ''} program with structured chapters, practice tests and doubt support.`}
        </p>
      </div>
      <Link
        to="/admission"
        className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300"
      >
        Enroll Now <FiArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setErrored(false);
        const res = await coursesService.list({ limit: 6 });
        if (!active) return;
        setCourses(res?.data?.data || []);
      } catch (err) {
        console.warn('Failed to load featured courses:', err?.message || err);
        if (active) setErrored(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-blob-field absolute inset-0 -z-10">
          <div className="blob h-96 w-96 -top-24 -left-24" />
          <div className="blob h-[26rem] w-[26rem] top-10 -right-28" style={{ animationDelay: '3s' }} />
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 text-center sm:px-6 lg:px-8 lg:pt-24">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-4 py-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300"
          >
            <FiAward className="h-4 w-4" /> Admissions open for 2026-27
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mx-auto max-w-4xl font-display text-4xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-5xl lg:text-6xl"
          >
            Building sharper minds, <br className="hidden sm:block" />
            <span className="bg-brand-gradient bg-clip-text text-transparent">one topper at a time.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-base text-ink-muted dark:text-ink-lightMuted sm:text-lg"
          >
            Pinnacle Tuition Classes is a premium coaching institute for Classes 10-12, combining
            expert faculty, small batches and result-driven teaching to help every student reach
            their true academic potential.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link to="/courses" className="btn-primary w-full sm:w-auto">
              Explore Courses <FiArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/admission" className="btn-secondary w-full sm:w-auto">
              Apply Now
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="card flex flex-col items-center gap-2 p-6 text-center"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="font-display text-2xl font-extrabold text-ink dark:text-ink-light">
                {s.value}
              </div>
              <div className="text-xs font-medium text-ink-muted dark:text-ink-lightMuted">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured courses */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">
            Our Programs
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-4xl">
            Featured Courses
          </h2>
          <p className="mt-3 text-ink-muted dark:text-ink-lightMuted">
            Structured, chapter-wise programs designed by subject experts for Classes 10, 11 and 12.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

          {!loading && !errored && courses.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={FiBookOpen}
                title="Courses coming soon"
                description="Our course catalogue is being updated. Please check back shortly or contact us for details."
              />
            </div>
          )}

          {!loading && errored && (
            <div className="col-span-full">
              <EmptyState
                icon={FiBookOpen}
                title="Couldn't load courses right now"
                description="We're unable to fetch live course data at the moment. Please explore the Courses page or contact us directly."
                action={
                  <Link to="/courses" className="btn-secondary mt-2">
                    Go to Courses
                  </Link>
                }
              />
            </div>
          )}

          {!loading &&
            !errored &&
            courses.map((course, i) => (
              <CourseCard key={course._id || course.id || i} course={course} index={i} />
            ))}
        </div>
      </section>

      {/* Testimonials preview */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">
            Success Stories
          </span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-4xl">
            What Our Students Say
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonialsPreview.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="card flex flex-col gap-4 p-6"
            >
              <StarRow count={t.rating} />
              <p className="text-sm text-ink-muted dark:text-ink-lightMuted">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-auto flex items-center gap-3 border-t border-surface-border pt-4 dark:border-surface-darkBorder">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                  {t.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink dark:text-ink-light">{t.name}</div>
                  <div className="text-xs text-ink-muted dark:text-ink-lightMuted">{t.course}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to="/testimonials" className="btn-secondary">
            Read More Stories <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Final CTA banner */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-brand-gradient px-6 py-14 text-center shadow-softLg sm:px-16"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
            <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          </div>
          <h2 className="relative font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to begin your journey to the top?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/90">
            Seats for the 2026-27 batch are filling fast. Apply today and secure your place among
            Pinnacle's next generation of achievers.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/admission"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 font-semibold text-brand-600 shadow-soft transition-transform active:scale-[0.97]"
            >
              <FiCheckCircle className="h-4 w-4" /> Start Your Application
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/50 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-white/10"
            >
              Talk to Us
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
