import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMail, FiCheckCircle } from 'react-icons/fi';
import AuthShell from './AuthShell';
import authService from '../../services/auth.service';

export default function ForgotPassword() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ defaultValues: { email: '' } });

  const onSubmit = async ({ email }) => {
    setSubmitting(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent — check your inbox.');
    } catch (err) {
      const message = err?.response?.data?.message || 'Could not send reset link';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Forgot Password"
      subtitle="Enter your registered email — we'll send you a secure reset link."
      side={{ heading: "Forgot it happens.", text: "We'll get you back into your account in no time." }}
      footer={
        <Link to="/student-login" className="font-semibold text-brand-600 dark:text-brand-300">
          Back to login
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-success/5 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success">
            <FiCheckCircle className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-ink dark:text-ink-light">Check your email</p>
          <p className="text-sm text-ink-muted dark:text-ink-lightMuted">
            We've sent a password reset link to <span className="font-semibold">{getValues('email')}</span>. The link expires in 1 hour.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label-text">Email address</label>
            <div className="relative">
              <FiMail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-lightMuted" />
              <input
                type="email"
                className="input-field pl-11"
                placeholder="you@example.com"
                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
