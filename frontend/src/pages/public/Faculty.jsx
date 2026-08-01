import React from 'react';
import { motion } from 'framer-motion';
import { FiBookOpen, FiAward, FiClock } from 'react-icons/fi';
import Avatar from '../../components/Avatar';

const faculty = [
  { name: 'Dr. Rajesh Kumar', subject: 'Physics', qualification: 'Ph.D. Physics, IIT Delhi', experience: '18 years' },
  { name: 'Mrs. Sunita Malhotra', subject: 'Mathematics', qualification: 'M.Sc. Mathematics, DU', experience: '15 years' },
  { name: 'Mr. Anil Verma', subject: 'Chemistry', qualification: 'M.Sc. Chemistry, BHU', experience: '12 years' },
  { name: 'Ms. Priyanka Rao', subject: 'Biology', qualification: 'M.Sc. Zoology, JNU', experience: '10 years' },
  { name: 'Mr. Vikram Singh', subject: 'English', qualification: 'M.A. English, DU', experience: '14 years' },
  { name: 'Mrs. Kavita Joshi', subject: 'Social Science', qualification: 'M.A. History, JNU', experience: '11 years' },
  { name: 'Mr. Arjun Mehta', subject: 'Computer Science', qualification: 'M.Tech CSE, NIT', experience: '9 years' },
  { name: 'Mrs. Neha Kapoor', subject: 'Hindi', qualification: 'M.A. Hindi, DU', experience: '13 years' },
];

export default function Faculty() {
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
            Meet Our Faculty
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-3 text-ink-muted dark:text-ink-lightMuted"
          >
            Learn from experienced educators who have guided hundreds of students to top board
            results — passionate about teaching, invested in every student's success.
          </motion.p>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {faculty.map((f, i) => (
          <motion.div
            key={f.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="card flex flex-col items-center gap-3 p-6 text-center"
          >
            <Avatar name={f.name} size="lg" />
            <div>
              <h3 className="font-display font-bold text-ink dark:text-ink-light">{f.name}</h3>
              <p className="text-sm font-medium text-brand-600 dark:text-brand-300">{f.subject}</p>
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-ink-muted dark:text-ink-lightMuted">
              <span className="flex items-center justify-center gap-1.5">
                <FiAward className="h-3.5 w-3.5 shrink-0" /> {f.qualification}
              </span>
              <span className="flex items-center justify-center gap-1.5">
                <FiClock className="h-3.5 w-3.5 shrink-0" /> {f.experience} experience
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-16 flex flex-col items-center gap-3 rounded-3xl bg-brand-500/5 p-10 text-center dark:bg-white/5"
      >
        <FiBookOpen className="h-8 w-8 text-brand-500" />
        <h2 className="font-display text-xl font-bold text-ink dark:text-ink-light">
          Handpicked educators, rigorously trained
        </h2>
        <p className="max-w-xl text-sm text-ink-muted dark:text-ink-lightMuted">
          Every Pinnacle faculty member goes through a structured hiring and training process,
          continuous performance reviews, and regular pedagogy workshops to keep teaching methods
          sharp and student-friendly.
        </p>
      </motion.div>
    </div>
  );
}
