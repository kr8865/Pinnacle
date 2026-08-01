import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import AuthShell from './AuthShell';
import authService from '../../services/auth.service';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { password: '', confirmPassword: '' } });

  const password = watch('password');

  const onSubmit = async ({ password: newPassword }) => {
    setSubmitting(true);
    try {
      await authService.resetPassword(token, newPassword);
      setDone(true);
      toast.success('Password reset successfully. Please sign in.');
      setTimeout(() => navigate('/student-login'), 1800);
    } catch (err) {
      const message = err?.response?.data?.message || 'Reset link is invalid or expired';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Reset Password"
      subtitle="Choose a new password for your account."
      side={{ heading: 'Almost there.', text: 'Set a strong new password to secure your Pinnacle account.' }}
      footer={
        <Link to="/student-login" className="font-semibold text-brand-600 dark:text-brand-300">
          Back to login
        </Link>
      }
    >
      {done ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-success/5 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success">
            <FiCheckCircle className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-ink dark:text-ink-light">Password updated</p>
          <p className="text-sm text-ink-muted dark:text-ink-lightMuted">Redirecting you to sign in...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label-text">New Password</label>
            <div className="relative">
              <FiLock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-lightMuted" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field pl-11 pr-11"
                placeholder="••••••••"
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-lightMuted hover:text-ink-muted"
              >
                {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
          </div>

          <div>
            <label className="label-text">Confirm Password</label>
            <div className="relative">
              <FiLock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-lightMuted" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field pl-11"
                placeholder="••••••••"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (v) => v === password || 'Passwords do not match',
                })}
              />
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-danger">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
