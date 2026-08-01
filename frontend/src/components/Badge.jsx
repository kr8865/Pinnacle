import React from 'react';

const tones = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
  brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
  neutral: 'bg-black/5 text-ink-muted dark:bg-white/5 dark:text-ink-lightMuted',
};

const statusToneMap = {
  present: 'success',
  approved: 'success',
  active: 'success',
  paid: 'success',
  published: 'success',
  success: 'success',
  completed: 'success',
  resolved: 'success',
  absent: 'danger',
  rejected: 'danger',
  suspended: 'danger',
  overdue: 'danger',
  failed: 'danger',
  closed: 'danger',
  pending: 'warning',
  leave: 'warning',
  due: 'warning',
  draft: 'warning',
  'in-progress': 'warning',
  open: 'info',
  late: 'warning',
  checked: 'brand',
  submitted: 'info',
  scheduled: 'info',
};

export default function StatusPill({ status, label, tone, className = '' }) {
  const resolvedTone = tone || statusToneMap[String(status).toLowerCase()] || 'neutral';
  const text = label || status;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${tones[resolvedTone]} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {text}
    </span>
  );
}
