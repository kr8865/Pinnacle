import React from 'react';

const colors = [
  'bg-brand-500', 'bg-accent-coral', 'bg-info', 'bg-success', 'bg-warning', 'bg-accent-peach',
];

function initials(name = '') {
  const parts = name.trim().split(' ').filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function hashColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, src, size = 'md', className = '' }) {
  const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-base' };
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ring-2 ring-white dark:ring-surface-darkCard ${sizes[size]} ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-white dark:ring-surface-darkCard ${hashColor(
        name
      )} ${sizes[size]} ${className}`}
    >
      {initials(name)}
    </div>
  );
}

export function AvatarStack({ people = [], max = 4, size = 'sm' }) {
  const visible = people.slice(0, max);
  const remaining = people.length - visible.length;
  return (
    <div className="flex -space-x-2">
      {visible.map((p, i) => (
        <Avatar key={p.id || i} name={p.name} src={p.avatar} size={size} />
      ))}
      {remaining > 0 && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10 dark:bg-white/10 text-xs font-semibold ring-2 ring-white dark:ring-surface-darkCard">
          +{remaining}
        </div>
      )}
    </div>
  );
}

export default Avatar;
