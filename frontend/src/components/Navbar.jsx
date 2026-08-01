import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiMenu, FiX, FiBell, FiSearch, FiChevronDown, FiLogOut, FiUser } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/courses', label: 'Courses' },
  { to: '/faculty', label: 'Faculty' },
  { to: '/results', label: 'Results' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? 'glass-panel shadow-soft' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-gradient font-display text-lg font-extrabold text-white">
            P
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-ink dark:text-ink-light">
            Pinnacle
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {publicLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
                    : 'text-ink-muted hover:text-ink dark:text-ink-lightMuted dark:hover:text-ink-light'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Link to="/student-login" className="btn-secondary !px-5 !py-2 text-sm">
            Login
          </Link>
          <Link to="/admission" className="btn-primary !px-5 !py-2 text-sm">
            Apply Now
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button type="button" className="btn-ghost" onClick={() => setOpen(true)} aria-label="Open menu">
            <FiMenu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col gap-1 bg-surface-card p-5 shadow-softLg dark:bg-surface-darkCard lg:hidden"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-lg font-bold">Menu</span>
                <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              {publicLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-2.5 text-sm font-medium ${
                      isActive
                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
                        : 'text-ink-muted dark:text-ink-lightMuted'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              <div className="mt-4 flex flex-col gap-2 border-t border-surface-border pt-4 dark:border-surface-darkBorder">
                <Link to="/student-login" className="btn-secondary w-full" onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link to="/admission" className="btn-primary w-full" onClick={() => setOpen(false)}>
                  Apply Now
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

export function DashboardTopbar({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket() || {};
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const notifPath = user?.role === 'admin' ? '/admin/announcements' : '/student/notifications';
  const profilePath = user?.role === 'admin' ? '/admin/dashboard' : '/student/profile';

  const handleLogout = async () => {
    await logout();
    navigate(user?.role === 'admin' ? '/admin-login' : '/student-login');
  };

  return (
    <header className="sticky top-4 z-30 mx-4 mb-6 flex items-center justify-between gap-3 rounded-3xl border border-surface-border bg-surface-card/90 px-4 py-3 shadow-soft backdrop-blur-xl dark:border-surface-darkBorder dark:bg-surface-darkCard/80 sm:px-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onMenuClick} className="btn-ghost lg:hidden" aria-label="Open menu">
          <FiMenu className="h-5 w-5" />
        </button>
        {title && (
          <h2 className="hidden font-display text-lg font-bold text-ink dark:text-ink-light sm:block">
            {title}
          </h2>
        )}
      </div>

      <div className="hidden max-w-md flex-1 items-center gap-2 rounded-full border border-surface-border bg-white px-4 py-2 dark:border-surface-darkBorder dark:bg-surface-dark sm:flex">
        <FiSearch className="h-4 w-4 text-ink-lightMuted" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-lightMuted dark:text-ink-light"
        />
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <ThemeToggle />
        <Link to={notifPath} className="btn-ghost relative" aria-label="Notifications">
          <FiBell className="h-5 w-5" />
          {!!unreadCount && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Avatar name={user?.name} src={user?.photo} size="sm" />
            <span className="hidden text-sm font-medium text-ink dark:text-ink-light sm:block">
              {user?.name?.split(' ')[0] || 'User'}
            </span>
            <FiChevronDown className="hidden h-4 w-4 text-ink-lightMuted sm:block" />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-surface-border bg-surface-card py-1 shadow-softLg dark:border-surface-darkBorder dark:bg-surface-darkCard"
                >
                  <Link
                    to={profilePath}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-black/5 dark:text-ink-light dark:hover:bg-white/5"
                  >
                    <FiUser className="h-4 w-4" /> Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-danger hover:bg-danger/5"
                  >
                    <FiLogOut className="h-4 w-4" /> Logout
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

export default PublicNavbar;
