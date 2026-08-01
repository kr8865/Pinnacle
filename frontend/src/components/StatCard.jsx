import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

const tints = {
  brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
  coral: 'bg-accent-coral/10 text-accent-coral',
};

export default function StatCard({ icon: Icon, label, value, trend, tone = 'brand', index = 0 }) {
  const positive = trend != null ? trend >= 0 : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="card p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tints[tone]}`}>
          {Icon && <Icon className="h-5 w-5" />}
        </div>
        {trend != null && (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
              positive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
            }`}
          >
            {positive ? <FiArrowUp className="h-3 w-3" /> : <FiArrowDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight text-ink dark:text-ink-light">
          {value}
        </div>
        <div className="text-sm text-ink-muted dark:text-ink-lightMuted">{label}</div>
      </div>
    </motion.div>
  );
}
