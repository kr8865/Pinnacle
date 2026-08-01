import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFacebookF, FaInstagram, FaYoutube, FaTwitter, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import { PublicNavbar } from '../components/Navbar';
import WhatsAppButton from '../components/WhatsAppButton';

const footerLinks = {
  Institute: [
    { to: '/about', label: 'About Us' },
    { to: '/faculty', label: 'Our Faculty' },
    { to: '/achievements', label: 'Achievements' },
    { to: '/career', label: 'Careers' },
  ],
  Academics: [
    { to: '/courses', label: 'Courses' },
    { to: '/results', label: 'Results' },
    { to: '/testimonials', label: 'Testimonials' },
    { to: '/gallery', label: 'Gallery' },
  ],
  Support: [
    { to: '/faq', label: 'FAQs' },
    { to: '/contact', label: 'Contact Us' },
    { to: '/admission', label: 'Admissions' },
    { to: '/student-login', label: 'Student Login' },
  ],
  Legal: [
    { to: '/privacy-policy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms & Conditions' },
  ],
};

function Footer() {
  return (
    <footer className="relative mt-20 border-t border-surface-border bg-surface-card dark:border-surface-darkBorder dark:bg-surface-darkCard">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-gradient font-display text-lg font-extrabold text-white">
                P
              </span>
              <span className="font-display text-lg font-extrabold tracking-tight">Pinnacle</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-ink-muted dark:text-ink-lightMuted">
              Premium coaching for Classes 10-12 — building strong foundations, sharper results, and confident futures.
            </p>
            <div className="mt-5 flex items-center gap-2 text-sm text-ink-muted dark:text-ink-lightMuted">
              <FaMapMarkerAlt className="h-4 w-4 shrink-0 text-brand-500" /> Sector 15, Model Town, New Delhi
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-ink-muted dark:text-ink-lightMuted">
              <FaPhoneAlt className="h-4 w-4 shrink-0 text-brand-500" /> +91 99999 99999
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-ink-muted dark:text-ink-lightMuted">
              <FaEnvelope className="h-4 w-4 shrink-0 text-brand-500" /> info@pinnacletuition.com
            </div>
            <div className="mt-5 flex items-center gap-3">
              {[FaFacebookF, FaInstagram, FaYoutube, FaTwitter].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-ink-muted transition-colors hover:bg-brand-500 hover:text-white dark:bg-white/5 dark:text-ink-lightMuted"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="mb-4 text-sm font-semibold text-ink dark:text-ink-light">{section}</h4>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-sm text-ink-muted transition-colors hover:text-brand-600 dark:text-ink-lightMuted dark:hover:text-brand-300"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-surface-border pt-6 text-center text-xs text-ink-lightMuted dark:border-surface-darkBorder">
          © {new Date().getFullYear()} Pinnacle Tuition Classes. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout() {
  const location = useLocation();
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <div className="bg-blob-field fixed inset-0 -z-10">
        <div className="blob h-96 w-96 -top-20 -left-20" />
        <div className="blob h-[28rem] w-[28rem] top-1/3 -right-32" style={{ animationDelay: '4s' }} />
        <div className="blob h-80 w-80 bottom-0 left-1/4" style={{ animationDelay: '8s' }} />
      </div>

      <PublicNavbar />

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
