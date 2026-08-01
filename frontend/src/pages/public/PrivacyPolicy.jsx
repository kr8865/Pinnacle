import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiShield, FiDatabase, FiSettings, FiLock, FiCreditCard, FiRefreshCw,
  FiUserCheck, FiMail, FiShare2,
} from 'react-icons/fi';

const sections = [
  {
    icon: FiDatabase,
    title: '1. Information We Collect',
    body: (
      <>
        <p>
          When you apply for admission, enrol in a course, or use the Pinnacle Tuition Classes
          student portal, we collect the following categories of information:
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>Personal details: name, date of birth, gender, blood group, address, city, state and pincode.</li>
          <li>Contact details: your mobile number, parent/guardian mobile number, email address and emergency contact.</li>
          <li>Academic details: school name, board, current class, previous academic percentages, course and batch enrolled.</li>
          <li>Identity and verification documents: Aadhar number, ID proof, photographs, signature and marksheets uploaded during admission.</li>
          <li>Payment information: fee amount, payment method, transaction IDs and receipts (we do not store your card, UPI or net-banking credentials — these are handled directly by Razorpay).</li>
          <li>Usage data: attendance records, test scores, assignment submissions, study material downloads, login activity and device/browser information.</li>
        </ul>
      </>
    ),
  },
  {
    icon: FiSettings,
    title: '2. How We Use Your Information',
    body: (
      <>
        <p>We use the information we collect to:</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>Process admission applications and verify eligibility for the selected course.</li>
          <li>Provide access to classes, study material, assignments, tests and academic progress tracking.</li>
          <li>Communicate important updates — class schedules, announcements, fee reminders and results — via email, SMS or WhatsApp.</li>
          <li>Process fee payments and issue receipts for services rendered.</li>
          <li>Maintain attendance and academic records as required for institutional and regulatory purposes.</li>
          <li>Improve our teaching methods, portal features and overall student experience.</li>
          <li>Respond to support tickets, queries and grievances raised by students or parents.</li>
        </ul>
      </>
    ),
  },
  {
    icon: FiShare2,
    title: '3. Sharing & Disclosure of Information',
    body: (
      <>
        <p>
          We do not sell or rent your personal information to third parties. We may share limited
          information with:
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>Payment partners (Razorpay) to process fee payments securely.</li>
          <li>Cloud storage providers (Cloudinary) to host uploaded documents, photos, study material and receipts.</li>
          <li>Email/SMS service providers to deliver transactional and academic notifications.</li>
          <li>Parents or legal guardians, where information relates to a minor student's academic or fee status.</li>
          <li>Government or regulatory authorities, only where required by applicable law.</li>
        </ul>
      </>
    ),
  },
  {
    icon: FiLock,
    title: '4. Data Security',
    body: (
      <>
        <p>
          We take reasonable technical and organisational measures to protect your data, including:
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>Encrypted password storage and secure authentication tokens (JWT access tokens, httpOnly refresh cookies).</li>
          <li>Sensitive identifiers such as your Aadhar number are masked wherever displayed in the portal.</li>
          <li>All file uploads (photos, marksheets, ID proofs) are stored on access-controlled cloud storage.</li>
          <li>Role-based access control ensures staff can only view data relevant to their responsibilities.</li>
          <li>Regular security reviews of our systems and infrastructure.</li>
        </ul>
        <p className="mt-3">
          While we strive to protect your information, no method of transmission or storage over
          the internet is 100% secure. We encourage you to keep your login credentials confidential
          and notify us immediately of any suspected unauthorised access to your account.
        </p>
      </>
    ),
  },
  {
    icon: FiCreditCard,
    title: '5. Payments',
    body: (
      <>
        <p>
          All online fee payments are processed through Razorpay, a PCI-DSS compliant payment
          gateway. Pinnacle Tuition Classes does not store your card number, CVV, UPI PIN or
          net-banking credentials at any point — these details are entered directly on Razorpay's
          secure checkout and never pass through our servers. We only receive and store the
          payment status, transaction/order ID and amount, which we use to update your fee record
          and generate a receipt.
        </p>
      </>
    ),
  },
  {
    icon: FiRefreshCw,
    title: '6. Refunds & Cancellations',
    body: (
      <>
        <p>
          Fee refunds, where applicable, are governed by our official refund policy communicated
          at the time of admission. In general:
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>Refund requests must be raised in writing through the Support section of the student portal or by contacting our admissions office.</li>
          <li>Refunds are calculated after deducting charges for classes already attended and applicable administrative/processing fees.</li>
          <li>Approved refunds are processed to the original payment method within 7-14 working days.</li>
          <li>Payment gateway charges levied by Razorpay, if any, are non-refundable.</li>
        </ul>
        <p className="mt-3">
          Please refer to our <Link to="/terms" className="font-semibold text-brand-600 dark:text-brand-300">Terms &amp; Conditions</Link> for the complete refund and cancellation policy.
        </p>
      </>
    ),
  },
  {
    icon: FiUserCheck,
    title: '7. Your Rights & Choices',
    body: (
      <>
        <p>You may, at any time:</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>Request access to, or a copy of, the personal information we hold about you.</li>
          <li>Request correction of inaccurate or outdated information via your Profile page or by contacting us.</li>
          <li>Request deletion of your account and associated data, subject to any academic or legal record-keeping obligations.</li>
          <li>Opt out of non-essential promotional communication (transactional messages related to fees, attendance and academics will continue).</li>
        </ul>
      </>
    ),
  },
  {
    icon: FiShield,
    title: '8. Cookies & Local Storage',
    body: (
      <>
        <p>
          Our student and admin portals use a small number of cookies and browser storage entries
          strictly necessary for authentication (a secure httpOnly refresh-token cookie) and to
          remember your theme preference (light/dark mode). We do not use third-party advertising
          or tracking cookies.
        </p>
      </>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl">
        <div className="bg-blob-field absolute inset-0 -z-10">
          <div className="blob h-72 w-72 -top-16 -left-16" />
        </div>
        <div className="mx-auto max-w-2xl py-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-600 dark:text-brand-300"
          >
            <FiShield className="h-7 w-7" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-3xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-4xl"
          >
            Privacy Policy
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-ink-muted dark:text-ink-lightMuted"
          >
            Last updated: 1 April 2026 &middot; This policy explains how Pinnacle Tuition Classes
            collects, uses and protects your personal information.
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
          Questions about this policy or your data?
        </p>
        <Link to="/contact" className="btn-primary">
          <FiMail className="h-4 w-4" /> Contact Our Privacy Team
        </Link>
      </motion.div>
    </div>
  );
}
