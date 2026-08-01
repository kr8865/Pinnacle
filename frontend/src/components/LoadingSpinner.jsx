import React from 'react';

export default function LoadingSpinner({ size = 'md', className = '', fullPage = false }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-12 w-12 border-[3px]' };

  const spinner = (
    <div
      className={`animate-spin rounded-full border-brand-500 border-t-transparent ${sizes[size]} ${className}`}
    />
  );

  if (fullPage) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">{spinner}</div>
    );
  }
  return spinner;
}
