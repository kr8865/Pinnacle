import React from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiMapPin, FiPhone, FiMail, FiClock, FiSend } from 'react-icons/fi';

const contactDetails = [
  { icon: FiMapPin, label: 'Address', value: 'Sector 15, Model Town, New Delhi, 110009' },
  { icon: FiPhone, label: 'Phone', value: '+91 99999 99999' },
  { icon: FiMail, label: 'Email', value: 'info@pinnacletuition.com' },
  { icon: FiClock, label: 'Office Hours', value: 'Mon - Sat, 9:00 AM - 7:00 PM' },
];

export default function Contact() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: '', email: '', phone: '', subject: '', message: '' },
  });

  const onSubmit = async () => {
    // No backend endpoint exists for contact form submissions yet — handled client-side only.
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.success("Thanks for reaching out! We'll get back to you shortly.");
    reset();
  };

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
            Get in Touch
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-3 text-ink-muted dark:text-ink-lightMuted"
          >
            Have questions about admissions, courses or fees? We'd love to hear from you.
          </motion.p>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Contact form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 sm:p-8 lg:col-span-3"
        >
          <h2 className="font-display text-lg font-bold text-ink dark:text-ink-light">Send us a message</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="label-text">Full Name *</label>
              <input className="input-field" {...register('name', { required: 'Name is required' })} />
              {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label-text">Email *</label>
              <input
                type="email"
                className="input-field"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
              />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label-text">Phone *</label>
              <input
                className="input-field"
                {...register('phone', {
                  required: 'Phone number is required',
                  pattern: { value: /^[0-9]{10}$/, message: 'Enter a valid 10-digit number' },
                })}
              />
              {errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="label-text">Subject *</label>
              <input className="input-field" {...register('subject', { required: 'Subject is required' })} />
              {errors.subject && <p className="mt-1 text-xs text-danger">{errors.subject.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="label-text">Message *</label>
              <textarea
                rows={5}
                className="input-field"
                {...register('message', { required: 'Message is required' })}
              />
              {errors.message && <p className="mt-1 text-xs text-danger">{errors.message.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full sm:w-auto">
                <FiSend className="h-4 w-4" /> {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Details + map */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="card p-6"
          >
            <h2 className="font-display text-lg font-bold text-ink dark:text-ink-light">Contact Information</h2>
            <div className="mt-5 space-y-4">
              {contactDetails.map((c) => (
                <div key={c.label} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                    <c.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-lightMuted">{c.label}</p>
                    <p className="text-sm font-medium text-ink dark:text-ink-light">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="card overflow-hidden p-2"
          >
            <iframe
              title="Pinnacle Tuition Classes Location"
              src="https://maps.google.com/maps?q=New+Delhi&t=&z=13&ie=UTF8&iwloc=&output=embed"
              className="h-72 w-full rounded-2xl border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
