import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiFileText, FiUserCheck, FiBookOpen, FiCreditCard, FiRefreshCw,
  FiAlertTriangle, FiUpload, FiMail,
} from 'react-icons/fi';

const sections = [
  {
    icon: FiUserCheck, title: '1. Admission & Eligibility',
    body: (
      <>
        <p>
          Submitting the admission form does not guarantee a confirmed seat. All applications are
          subject to review and verification of the details and documents provided. Pinnacle
          Tuition Classes reserves the right to approve, reject or place an application on hold
          (<span className="font-medium text-ink dark:text-ink-light">admissionStatus: pending / approved / rejected</span>)
          based on seat availability, eligibility criteria and document verification. Login access
          to the student portal is granted only after an admission is approved and a Student ID and
          Registration Number are issued.
        </p>
      </>
    ),
  },
  {
    icon: FiBookOpen, title: '2. Classes, Attendance & Conduct',
    body: (
      <>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Students are expected to maintain regular attendance; a minimum attendance percentage may be required to sit for internal tests.</li>
          <li>Batch timings, faculty allocation and class schedules may be revised by the institute as needed, with reasonable prior notice.</li>
          <li>Students and parents are expected to maintain respectful conduct towards faculty, staff and fellow students, both on campus and on the online portal.</li>
          <li>Any form of misconduct, indiscipline or misuse of the student portal may result in suspension or termination of enrollment without a fee refund.</li>
        </ul>
      </>
    ),
  },
  {
    icon: FiCreditCard, title: '3. Fees & Payments',
    body: (
      <>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Course fees must be paid as per the schedule/installment plan communicated at the time of admission.</li>
          <li>Online payments are processed securely via Razorpay. A payment is considered successful only after signature verification is completed on our servers and a receipt is generated.</li>
          <li>Late payment beyond the due date may attract a late fee and/or temporary suspension of portal access until dues are cleared.</li>
          <li>Fees once paid are non-transferable to another student or course, except at the sole discretion of the institute.</li>
          <li>Offline/manual payments (cash, cheque) are subject to verification and approval by the accounts team before being reflected on the student portal.</li>
        </ul>
      </>
    ),
  },
  {
    icon: FiRefreshCw, title: '4. Refund & Cancellation Policy',
    body: (
      <>
        <p>If a student wishes to discontinue their course, the following refund slabs apply, calculated from the date of admission approval:</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>Within 7 days of admission approval and before classes commence: 90% of course fee refunded (10% processing charge applies).</li>
          <li>Within 30 days, having attended less than 15% of scheduled classes: 50% of course fee refunded.</li>
          <li>After 30 days or having attended 15% or more of scheduled classes: no refund is applicable.</li>
          <li>Registration fee, exam fee and any payment-gateway charges are strictly non-refundable under all circumstances.</li>
        </ul>
        <p className="mt-3">
          All refund requests must be submitted in writing via the Support section of the student
          portal along with the reason for discontinuation. Approved refunds are processed to the
          original payment method within 7-14 working days.
        </p>
      </>
    ),
  },
  {
    icon: FiUpload, title: '5. Study Material & Intellectual Property',
    body: (
      <>
        <p>
          All notes, video lectures, worksheets, previous year question papers, formula sheets and
          test content made available on the student portal are the intellectual property of
          Pinnacle Tuition Classes and are licensed solely for the personal academic use of the
          enrolled student. Reproduction, redistribution, resale or public sharing of this content
          in any form, physical or digital, is strictly prohibited and may result in disciplinary
          action and/or legal proceedings.
        </p>
      </>
    ),
  },
  {
    icon: FiAlertTriangle, title: '6. Assignments, Tests & Academic Integrity',
    body: (
      <>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Assignments must be submitted before the stated due date through the portal; late submissions may be marked accordingly and could affect evaluation.</li>
          <li>Timed online tests are auto-submitted when the countdown timer reaches zero; students are responsible for ensuring a stable internet connection during a test.</li>
          <li>Any form of malpractice, plagiarism or impersonation during assignments or tests will result in disqualification of that submission and may lead to further disciplinary action.</li>
          <li>Marks, grades and rank/leaderboard positions generated by the system are provisional until reviewed and finalised by faculty where applicable.</li>
        </ul>
      </>
    ),
  },
  {
    icon: FiFileText, title: '7. Limitation of Liability',
    body: (
      <>
        <p>
          Pinnacle Tuition Classes strives to maintain uninterrupted access to the student portal
          but does not guarantee that the service will always be available, error-free or secure.
          We are not liable for any loss or damage arising from temporary unavailability of the
          portal, delays in payment gateway processing, or events beyond our reasonable control.
          Academic outcomes such as board results or competitive exam performance depend on
          multiple factors and are not guaranteed by enrollment alone.
        </p>
      </>
    ),
  },
  {
    icon: FiFileText, title: '8. Changes to These Terms',
    body: (
      <>
        <p>
          We may update these Terms &amp; Conditions from time to time to reflect changes in our
          services, fee structure or applicable law. Continued use of the student portal after any
          such update constitutes acceptance of the revised terms. We encourage students and
          parents to review this page periodically.
        </p>
      </>
    ),
  },
];

export default function Terms() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl">
        <div className="bg-blob-field absolute inset-0 -z-10">
          <div className="blob h-72 w-72 -top-16 -right-16" />
        </div>
        <div className="mx-auto max-w-2xl py-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-600 dark:text-brand-300"
          >
            <FiFileText className="h-7 w-7" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-3xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-4xl"
          >
            Terms &amp; Conditions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-ink-muted dark:text-ink-lightMuted"
          >
            Last updated: 1 April 2026 &middot; Please read these terms carefully before applying
            for admission or using the Pinnacle Tuition Classes student portal.
          </motion.p>
        </div>
      </section>

      <div className="mt-8 space-y-5">
        {sections.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
            className="card p-6 sm:p-8"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                <s.icon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg font-bold text-ink dark:text-ink-light">{s.title}</h2>
            </div>
            <div className="text-sm leading-relaxed text-ink-muted dark:text-ink-lightMuted">{s.body}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-8 flex flex-col items-center gap-3 rounded-3xl bg-brand-500/5 p-8 text-center dark:bg-white/5"
      >
        <p className="text-sm text-ink-muted dark:text-ink-lightMuted">
          Have a question about our policies? See our{' '}
          <Link to="/privacy-policy" className="font-semibold text-brand-600 dark:text-brand-300">Privacy Policy</Link>{' '}
          or get in touch.
        </p>
        <Link to="/contact" className="btn-primary">
          <FiMail className="h-4 w-4" /> Contact Us
        </Link>
      </motion.div>
    </div>
  );
}
