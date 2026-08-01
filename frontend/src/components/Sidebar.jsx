import React from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
  return (
    <>
      {/* Desktop floating sidebar */}
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col gap-6 rounded-3xl border border-surface-border bg-surface-card p-5 shadow-soft dark:border-surface-darkBorder dark:bg-surface-darkCard dark:shadow-darkGlow lg:m-4 lg:mr-0 lg:flex">
        {brand}
        <NavItems items={items} layoutId="sidebar-active-pill-desktop" />
        {footer}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-4 left-4 right-4 z-[70] flex w-auto max-w-xs flex-col gap-6 rounded-3xl border border-surface-border bg-surface-card p-5 shadow-softLg dark:border-surface-darkBorder dark:bg-surface-darkCard sm:right-auto sm:w-64 lg:hidden"
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
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
