import React from 'react';
import { FiCheck } from 'react-icons/fi';

export default function StepProgress({ steps, current }) {
  return (
    <div className="flex items-center w-full overflow-x-auto pb-2">
      {steps.map((step, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-2 min-w-[80px]">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                  isDone
                    ? 'bg-brand-gradient text-white'
                    : isActive
                    ? 'bg-brand-gradient text-white ring-4 ring-brand-500/20'
                    : 'bg-black/5 dark:bg-white/10 text-ink-muted dark:text-ink-lightMuted'
                }`}
              >
                {isDone ? <FiCheck className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-xs font-medium text-center ${
                  isActive ? 'text-brand-600 dark:text-brand-300' : 'text-ink-muted dark:text-ink-lightMuted'
                }`}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 min-w-[24px] mx-1 rounded-full transition-all duration-300 ${
                  isDone ? 'bg-brand-gradient' : 'bg-black/5 dark:bg-white/10'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
