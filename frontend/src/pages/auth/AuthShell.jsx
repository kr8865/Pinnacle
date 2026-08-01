import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AuthShell({ title, subtitle, children, footer, side }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="bg-blob-field fixed inset-0 -z-10">
        <div className="blob h-96 w-96 -top-20 -left-20" />
        <div className="blob h-[28rem] w-[28rem] top-1/3 -right-32" style={{ animationDelay: '4s' }} />
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-4xl border border-surface-border bg-surface-card shadow-softLg dark:border-surface-darkBorder dark:bg-surface-darkCard lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between bg-brand-gradient p-10 text-white lg:flex">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15 font-display text-lg font-extrabold">
              P
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight">Pinnacle</span>
          </Link>
          <div>
            <h2 className="font-display text-3xl font-extrabold leading-tight">
              {side?.heading || 'Premium coaching, one login away.'}
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/80">
              {side?.text || 'Access study material, assignments, tests and fee payments — all in one place.'}
            </p>
          </div>
          <p className="text-xs text-white/60">© {new Date().getFullYear()} Pinnacle Tuition Classes</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col justify-center p-8 sm:p-10"
        >
          <div className="mb-2 flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-brand-gradient font-display text-sm font-extrabold text-white">
              P
            </span>
            <span className="font-display text-base font-extrabold">Pinnacle</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-ink-light">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-muted dark:text-ink-lightMuted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
        </motion.div>
      </div>
    </div>
  );
}
