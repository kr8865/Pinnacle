import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';

function NavItems({ items, layoutId, onNavigate }) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className="relative flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium outline-none"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-2xl bg-brand-gradient shadow-soft"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span
                className={`relative z-10 flex items-center gap-3 ${
                  isActive
                    ? 'text-white'
                    : 'text-ink-muted dark:text-ink-lightMuted group-hover:text-ink'
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badge ? (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive ? 'bg-white/25 text-white' : 'bg-danger/10 text-danger'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Sidebar({ items, brand, footer, mobileOpen, onMobileClose }) {
  // Lock page scroll while the mobile drawer is open, and always release it
  // on close/unmount — otherwise a stuck scroll-lock from a previous
  // open/close cycle can leave the page in a state where touches/clicks
  // behave inconsistently on the next open.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Desktop floating sidebar */}
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col gap-6 rounded-3xl border border-surface-border bg-surface-card p-5 shadow-soft dark:border-surface-darkBorder dark:bg-surface-darkCard dark:shadow-darkGlow lg:m-4 lg:mr-0 lg:flex">
        {brand}
        <NavItems items={items} layoutId="sidebar-active-pill-desktop" />
        {footer}
      </aside>

      {/*
        Mobile drawer — always mounted (never conditionally rendered) and
        purely CSS-driven via `mobileOpen`. Deliberately NOT using
        AnimatePresence's mount/unmount + exit-animation lifecycle here:
        that pattern can get out of sync when the drawer is opened and
        closed repeatedly in quick succession, leaving it stuck after the
        first close. Keeping the nodes permanently in the DOM and just
        toggling classes means every open/close is a plain, independent
        state flip with nothing to get out of sync.
      */}
      <div
        onClick={onMobileClose}
        aria-hidden={!mobileOpen}
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        aria-hidden={!mobileOpen}
        className={`fixed inset-y-4 left-4 right-4 z-[70] flex w-auto max-w-xs flex-col gap-6 rounded-3xl border border-surface-border bg-surface-card p-5 shadow-softLg transition-transform duration-300 ease-out dark:border-surface-darkBorder dark:bg-surface-darkCard sm:right-auto sm:w-64 lg:hidden ${
          mobileOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-[120%] pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          {brand}
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close menu"
            className="btn-ghost !h-11 !w-11 shrink-0 touch-manipulation"
            style={{ touchAction: 'manipulation' }}
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <NavItems items={items} layoutId="sidebar-active-pill-mobile" onNavigate={onMobileClose} />
        {footer}
      </aside>
    </>
  );
}
