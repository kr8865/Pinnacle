import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCamera } from 'react-icons/fi';

const categories = ['All', 'Campus', 'Classrooms', 'Events', 'Awards'];

const photos = Array.from({ length: 16 }).map((_, i) => ({
  id: i,
  src: `https://picsum.photos/seed/pinnacle-${i}/600/400`,
  category: categories[(i % 4) + 1],
  caption: [
    'Annual Day Celebrations',
    'Smart Classroom Session',
    'Science Lab Practical',
    'Award Ceremony',
    'Campus Library',
    'Group Study Session',
    'Sports Day',
    'Guest Lecture',
  ][i % 8],
}));

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightbox, setLightbox] = useState(null);

  const filtered = activeCategory === 'All' ? photos : photos.filter((p) => p.category === activeCategory);

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
            Campus Gallery
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-3 text-ink-muted dark:text-ink-lightMuted"
          >
            A look inside life at Pinnacle — classrooms, events, celebrations and everything in between.
          </motion.p>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActiveCategory(c)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeCategory === c
                ? 'bg-brand-gradient text-white shadow-soft'
                : 'bg-black/5 text-ink-muted hover:bg-black/10 dark:bg-white/5 dark:text-ink-lightMuted dark:hover:bg-white/10'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((p, i) => (
          <motion.button
            key={p.id}
            type="button"
            onClick={() => setLightbox(p)}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: (i % 8) * 0.05 }}
            whileHover={{ scale: 1.03 }}
            className="group relative aspect-[4/3] overflow-hidden rounded-3xl shadow-soft"
          >
            <img
              src={p.src}
              alt={p.caption}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="text-left text-xs font-medium text-white">{p.caption}</span>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl overflow-hidden rounded-3xl bg-surface-card shadow-softLg dark:bg-surface-darkCard"
            >
              <img src={lightbox.src} alt={lightbox.caption} className="max-h-[70vh] w-full object-cover" />
              <div className="flex items-center gap-2 p-4">
                <FiCamera className="h-4 w-4 text-brand-500" />
                <span className="text-sm font-medium text-ink dark:text-ink-light">{lightbox.caption}</span>
              </div>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="btn-ghost absolute right-3 top-3 bg-black/40 text-white hover:bg-black/60"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
