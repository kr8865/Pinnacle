import React from 'react';
import { motion } from 'framer-motion';
import { FiStar } from 'react-icons/fi';
import Avatar from '../../components/Avatar';

const testimonials = [
  {
    name: 'Ananya Sharma',
    course: 'Class 12, Physics',
    quote: 'Pinnacle turned my weakest subject into my highest scoring one. The faculty explains concepts like nobody else — I finally understood physics instead of memorizing it.',
    rating: 5,
  },
  {
    name: 'Rohan Verma',
    course: 'Class 10, Mathematics',
    quote: 'The doubt-clearing sessions and weekly tests kept me consistent all year. I went from an average student to a topper in my school.',
    rating: 5,
  },
  {
    name: 'Priya Nair',
    course: 'Class 11, Science',
    quote: 'Small batches, personal attention, and a genuinely caring faculty team. Pinnacle feels less like a coaching center and more like a second home.',
    rating: 5,
  },
  {
    name: 'Arjun Kapoor',
    course: 'Class 12, Chemistry',
    quote: 'The structured chapter-wise notes and PYQ practice sets made my board prep so much easier. I always knew exactly what to study next.',
    rating: 5,
  },
  {
    name: 'Diya Malhotra',
    course: 'Class 10, English',
    quote: 'My daughter\'s confidence has grown tremendously since joining Pinnacle. The teachers genuinely care about each student\'s progress.',
    rating: 4,
  },
  {
    name: 'Karan Mehta',
    course: 'Class 11, Mathematics',
    quote: 'Regular tests and detailed feedback helped me identify my weak chapters early. My scores improved by over 20% in one semester.',
    rating: 5,
  },
  {
    name: 'Simran Kaur',
    course: 'Class 12, Biology',
    quote: 'The faculty here don\'t just teach — they mentor. I got into my dream college thanks to the strong foundation Pinnacle gave me.',
    rating: 5,
  },
  {
    name: 'Aditya Rao',
    course: 'Class 10, Science',
    quote: 'Online study material and recorded lectures meant I could revise anytime. The LMS portal is genuinely well thought out.',
    rating: 4,
  },
  {
    name: 'Neha Singh',
    course: 'Class 11, Computer Science',
    quote: 'Coming from a non-technical background, I was intimidated by CS. My teacher broke everything down so clearly that it became my favourite subject.',
    rating: 5,
  },
];

function StarRow({ count = 5 }) {
  return (
    <div className="flex items-center gap-0.5 text-warning">
      {Array.from({ length: 5 }).map((_, i) => (
        <FiStar key={i} className={`h-4 w-4 ${i < count ? 'fill-current' : 'opacity-30'}`} />
      ))}
    </div>
  );
}

export default function Testimonials() {
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
            What Our Students Say
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-3 text-ink-muted dark:text-ink-lightMuted"
          >
            Real stories from students and parents who have been part of the Pinnacle family.
          </motion.p>
        </div>
      </section>

      <div className="mt-8 columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6 [&>*]:break-inside-avoid">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
            className="card flex flex-col gap-4 p-6"
          >
            <StarRow count={t.rating} />
            <p className="text-sm text-ink-muted dark:text-ink-lightMuted">&ldquo;{t.quote}&rdquo;</p>
            <div className="mt-auto flex items-center gap-3 border-t border-surface-border pt-4 dark:border-surface-darkBorder">
              <Avatar name={t.name} size="md" />
              <div>
                <div className="text-sm font-semibold text-ink dark:text-ink-light">{t.name}</div>
                <div className="text-xs text-ink-muted dark:text-ink-lightMuted">{t.course}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
