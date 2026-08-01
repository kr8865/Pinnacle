import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiHelpCircle, FiArrowRight } from 'react-icons/fi';

const faqs = [
  {
    question: 'What classes and subjects does Pinnacle offer coaching for?',
    answer: 'We offer coaching for Classes 10, 11 and 12 across Mathematics, Physics, Chemistry, Biology, English, Hindi, Social Science and Computer Science, following CBSE, ICSE and State Board curricula.',
  },
  {
    question: 'How do I apply for admission?',
    answer: 'You can apply directly through our Admission page. Fill in your personal, academic and course details, upload the required documents, and submit your application. Our admissions team will review it within 2-3 working days.',
  },
  {
    question: 'Is my seat confirmed as soon as I submit the admission form?',
    answer: 'No. Submitting the form creates a pending application. Our team verifies your documents and details before approving admission. You will be notified by email/SMS once approved, after which you can log in to your student portal.',
  },
  {
    question: 'What are the fees for each course?',
    answer: 'Fees vary by class and subject combination. Please contact our admissions office via the Contact page or call us directly for a detailed fee structure and available installment plans.',
  },
  {
    question: 'What is the batch size and class timing?',
    answer: 'We maintain small batches (typically 20-25 students) to ensure personal attention. Weekday batches run in the evenings after school hours, and weekend batches are available for students who need flexibility.',
  },
  {
    question: 'Do you provide study material and notes?',
    answer: 'Yes. Every enrolled student gets access to our online LMS portal with chapter-wise notes, video lectures, previous year question papers, worksheets and formula sheets for their enrolled courses.',
  },
  {
    question: 'How are tests and assessments conducted?',
    answer: 'We conduct regular chapter-wise tests, monthly assessments and full-length mock exams. Results and detailed performance analytics, including weak and strong chapters, are available on the student portal.',
  },
  {
    question: 'What documents are required at the time of admission?',
    answer: 'You will need a passport-size photo, a valid ID proof (Aadhar card or birth certificate), previous marksheets (10th/11th, if applicable), and a parent photo. All documents can be uploaded directly during the online application.',
  },
  {
    question: 'Can I change my course or batch after enrolling?',
    answer: 'Yes, course or batch changes can be requested by contacting the admissions office. Changes are subject to seat availability in the desired batch.',
  },
  {
    question: 'What is the fee refund policy if I discontinue?',
    answer: 'Refunds are processed as per our official refund policy, which accounts for the number of classes attended and administrative charges. Please refer to our Terms & Conditions page for the complete policy.',
  },
  {
    question: 'How can parents track their child\'s progress?',
    answer: 'Parents receive regular updates via SMS/email for attendance, test results and fee reminders. Parent-teacher meetings are also scheduled periodically throughout the academic year.',
  },
];

function AccordionItem({ item, isOpen, onToggle, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="card overflow-hidden"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-display font-semibold text-ink dark:text-ink-light">{item.question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300"
        >
          <FiChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm text-ink-muted dark:text-ink-lightMuted">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl">
        <div className="bg-blob-field absolute inset-0 -z-10">
          <div className="blob h-72 w-72 -top-16 -left-16" />
        </div>
        <div className="mx-auto max-w-2xl py-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-600 dark:text-brand-300"
          >
            <FiHelpCircle className="h-7 w-7" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-3xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-4xl"
          >
            Frequently Asked Questions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-ink-muted dark:text-ink-lightMuted"
          >
            Everything you need to know about admissions, fees, courses and timings.
          </motion.p>
        </div>
      </section>

      <div className="mt-8 space-y-4">
        {faqs.map((item, i) => (
          <AccordionItem
            key={item.question}
            item={item}
            index={i}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-12 flex flex-col items-center gap-3 rounded-3xl bg-brand-500/5 p-8 text-center dark:bg-white/5"
      >
        <p className="text-sm text-ink-muted dark:text-ink-lightMuted">Still have questions?</p>
        <Link to="/contact" className="btn-primary">
          Contact Our Team <FiArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
}
