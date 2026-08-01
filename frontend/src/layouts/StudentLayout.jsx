import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiEdit3, FiFileText, FiCalendar, FiCheckSquare,
  FiCreditCard, FiUser, FiBell, FiHelpCircle, FiSpeaker, FiLogOut,
} from 'react-icons/fi';
import Sidebar from '../components/Sidebar';
import { DashboardTopbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/student/dashboard', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/student/assignments', label: 'Assignments', icon: FiEdit3 },
  { to: '/student/study-material', label: 'Study Material', icon: FiFileText },
  { to: '/student/attendance', label: 'Attendance', icon: FiCalendar },
  { to: '/student/tests', label: 'Tests', icon: FiCheckSquare },
  { to: '/student/fees', label: 'Fees', icon: FiCreditCard },
  { to: '/student/announcements', label: 'Announcements', icon: FiSpeaker },
  { to: '/student/notifications', label: 'Notifications', icon: FiBell },
  { to: '/student/support', label: 'Support', icon: FiHelpCircle },
  { to: '/student/profile', label: 'Profile', icon: FiUser },
];

const pageTitles = navItems.reduce((acc, i) => ({ ...acc, [i.to]: i.label }), {});

export default function StudentLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, user } = useAuth();
  const location = useLocation();

  const matchedPath = Object.keys(pageTitles)
    .filter((path) => location.pathname.startsWith(path))
    .sort((a, b) => b.length - a.length)[0];
  const activeTitle = matchedPath ? pageTitles[matchedPath] : undefined;

  const brand = (
    <Link to="/student/dashboard" className="flex items-center gap-2 px-1">
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-gradient font-display text-lg font-extrabold text-white">
        P
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight text-ink dark:text-ink-light">
        Pinnacle
      </span>
    </Link>
  );

  const footer = (
    <div className="space-y-3 border-t border-surface-border pt-4 dark:border-surface-darkBorder">
      <div className="flex items-center gap-3 rounded-2xl bg-black/5 px-3 py-2.5 dark:bg-white/5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
          {user?.name?.[0]?.toUpperCase() || 'S'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink dark:text-ink-light">{user?.name || 'Student'}</p>
          <p className="truncate text-xs text-ink-muted dark:text-ink-lightMuted">{user?.email}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger/5"
      >
        <FiLogOut className="h-5 w-5" /> Logout
      </button>
    </div>
  );

  return (
    <div className="relative flex min-h-screen">
      <div className="bg-blob-field fixed inset-0 -z-10">
        <div className="blob h-96 w-96 -top-32 -right-20 opacity-20" />
        <div className="blob h-80 w-80 bottom-0 -left-20 opacity-10" style={{ animationDelay: '5s' }} />
      </div>

      <Sidebar
        items={navItems}
        brand={brand}
        footer={footer}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar onMenuClick={() => setMobileOpen(true)} title={activeTitle} />
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex-1 px-4 pb-10 sm:px-6"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
