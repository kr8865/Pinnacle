import React from 'react';
import { FiInbox } from 'react-icons/fi';

export default function EmptyState({ icon: Icon = FiInbox, title = 'Nothing here yet', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-500">
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="font-semibold text-ink dark:text-ink-light">{title}</p>
        {description && (
          <p className="mt-1 max-w-sm text-sm text-ink-muted dark:text-ink-lightMuted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
