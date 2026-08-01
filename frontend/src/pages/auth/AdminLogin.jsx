import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield } from 'react-icons/fi';
import AuthShell from './AuthShell';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: '', password: '', remember: true } });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const user = await adminLogin(values);
      toast.success(`Welcome back, ${user?.name?.split(' ')[0] || 'Admin'}!`);
      navigate(location.state?.from?.pathname || '/admin/dashboard', { replace: true });
    } catch (err) {
      const message = err?.response?.data?.message || 'Invalid credentials';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Admin Login"
      subtitle="Sign in to manage students, courses, fees and analytics."
      side={{ heading: 'Run the institute from one console.', text: 'Admissions, attendance, fee collection and reports — all in real time.' }}
      footer={
        <p className="flex items-center justify-center gap-1.5 text-xs text-ink-lightMuted">
          <FiShield className="h-3.5 w-3.5" /> Restricted access — authorized staff only
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label-text">Email address</label>
          <div className="relative">
            <FiMail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-lightMuted" />
            <input
              type="email"
              className="input-field pl-11"
              placeholder="admin@pinnacletuition.com"
              {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })}
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label-text">Password</label>
          <div className="relative">
            <FiLock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-lightMuted" />
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field pl-11 pr-11"
              placeholder="••••••••"
              {...register('password', { required: 'Password is required' })}
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

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-ink-muted dark:text-ink-lightMuted">
            <input type="checkbox" className="h-4 w-4 rounded border-surface-border text-brand-500 focus:ring-brand-500" {...register('remember')} />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-brand-600 dark:text-brand-300">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-ink-muted dark:text-ink-lightMuted">
        Are you a student?{' '}
        <Link to="/student-login" className="font-semibold text-brand-600 dark:text-brand-300">
          Student login
        </Link>
      </div>
    </AuthShell>
  );
}
