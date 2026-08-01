import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiBookOpen, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import coursesService from '../../services/courses.service';
import useDebounce from '../../hooks/useDebounce';
import { SkeletonCard } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

const classFilters = [
  { label: 'All', value: '' },
  { label: 'Class 10', value: '10' },
  { label: 'Class 11', value: '11' },
  { label: 'Class 12', value: '12' },
];

function CourseCard({ course, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="card flex flex-col gap-4 p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
          <FiBookOpen className="h-6 w-6" />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {course.classLevel && (
            <span className="rounded-full bg-accent-peach/10 px-3 py-1 text-xs font-semibold text-accent-coral">
              Class {course.classLevel}
            </span>
          )}
          {course.subject && (
            <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-300">
              {course.subject}
            </span>
          )}
        </div>
      </div>
      <div>
        <h3 className="font-display text-lg font-bold text-ink dark:text-ink-light">
          {course.name || course.subject || 'Course'}
        </h3>
        <p className="mt-1.5 line-clamp-3 text-sm text-ink-muted dark:text-ink-lightMuted">
          {course.description ||
            `A structured ${course.subject || ''} program with chapter-wise study material, weekly tests and personal doubt support.`}
        </p>
      </div>
      {Array.isArray(course.chapters) && course.chapters.length > 0 && (
        <div className="text-xs font-medium text-ink-lightMuted">
          {course.chapters.length} chapter{course.chapters.length > 1 ? 's' : ''}
        </div>
      )}
      <Link
        to="/admission"
        className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300"
      >
        Enroll Now <FiArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}

export default function Courses() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [currentClass, setCurrentClass] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setErrored(false);
        const params = { search: debouncedSearch || undefined };
        if (currentClass) params.currentClass = currentClass;
        const res = await coursesService.list(params);
        if (!active) return;
        setCourses(res?.data?.data || []);
      } catch (err) {
        console.warn('Failed to load courses:', err?.message || err);
        if (active) setErrored(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [debouncedSearch, currentClass]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl">
        <div className="bg-blob-field absolute inset-0 -z-10">
          <div className="blob h-72 w-72 -top-16 -left-16" />
        </div>
        <div className="mx-auto max-w-2xl py-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-display text-3xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-4xl"
          >
            Our Courses
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="mt-3 text-ink-muted dark:text-ink-lightMuted"
          >
            Explore expertly designed programs across Classes 10, 11 and 12 — pick the course
            that fits your goals.
          </motion.p>
        </div>
      </section>

      {/* Filters */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {classFilters.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => setCurrentClass(f.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                currentClass === f.value
                  ? 'bg-brand-gradient text-white shadow-soft'
                  : 'bg-black/5 text-ink-muted hover:bg-black/10 dark:bg-white/5 dark:text-ink-lightMuted dark:hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-lightMuted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

        {!loading && errored && (
          <div className="col-span-full">
            <EmptyState
              icon={FiAlertCircle}
              title="Couldn't load courses"
              description="We ran into an issue fetching our course catalogue. Please try again in a moment or reach out to us directly."
            />
          </div>
        )}

        {!loading && !errored && courses.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={FiBookOpen}
              title="No courses found"
              description="Try a different search term or class filter."
            />
          </div>
        )}

        {!loading &&
          !errored &&
          courses.map((course, i) => (
            <CourseCard key={course._id || course.id || i} course={course} index={i} />
          ))}
      </div>
    </div>
  );
}
