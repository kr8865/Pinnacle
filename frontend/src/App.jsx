import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';
import { SkeletonCard } from './components/Skeleton';

// ---- Public / marketing pages ----
const Home = lazy(() => import('./pages/public/Home'));
const About = lazy(() => import('./pages/public/About'));
const Faculty = lazy(() => import('./pages/public/Faculty'));
const Courses = lazy(() => import('./pages/public/Courses'));
const Achievements = lazy(() => import('./pages/public/Achievements'));
const Results = lazy(() => import('./pages/public/Results'));
const Testimonials = lazy(() => import('./pages/public/Testimonials'));
const Gallery = lazy(() => import('./pages/public/Gallery'));
const FAQ = lazy(() => import('./pages/public/FAQ'));
const Contact = lazy(() => import('./pages/public/Contact'));
const Admission = lazy(() => import('./pages/public/Admission'));
const Career = lazy(() => import('./pages/public/Career'));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/public/Terms'));

// ---- Auth pages ----
const StudentLogin = lazy(() => import('./pages/auth/StudentLogin'));
const AdminLogin = lazy(() => import('./pages/auth/AdminLogin'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));

// ---- Admin pages ----
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminStudents = lazy(() => import('./pages/admin/Students'));
const AdminCourses = lazy(() => import('./pages/admin/Courses'));
const AdminStudyMaterials = lazy(() => import('./pages/admin/StudyMaterials'));
const AdminAssignments = lazy(() => import('./pages/admin/Assignments'));
const AdminAttendance = lazy(() => import('./pages/admin/Attendance'));
const AdminFees = lazy(() => import('./pages/admin/Fees'));
const AdminAnnouncements = lazy(() => import('./pages/admin/Announcements'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminTests = lazy(() => import('./pages/admin/Tests'));

// ---- Student pages ----
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const StudentAssignments = lazy(() => import('./pages/student/Assignments'));
const StudentStudyMaterial = lazy(() => import('./pages/student/StudyMaterial'));
const StudentAttendance = lazy(() => import('./pages/student/Attendance'));
const StudentTests = lazy(() => import('./pages/student/Tests'));
const StudentFees = lazy(() => import('./pages/student/Fees'));
const StudentProfile = lazy(() => import('./pages/student/Profile'));
const StudentNotifications = lazy(() => import('./pages/student/Notifications'));
const StudentSupport = lazy(() => import('./pages/student/Support'));
const StudentAnnouncements = lazy(() => import('./pages/student/Announcements'));

function RouteLoadingFallback() {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <span className="font-display text-7xl font-extrabold bg-brand-gradient bg-clip-text text-transparent">
        404
      </span>
      <h1 className="text-xl font-bold text-ink dark:text-ink-light">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-muted dark:text-ink-lightMuted">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <a href="/" className="btn-primary mt-2">Back to Home</a>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Public marketing site */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/results" element={<Results />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admission" element={<Admission />} />
          <Route path="/career" element={<Career />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
        </Route>

        {/* Auth pages (standalone, no shared layout) */}
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Admin (protected) */}
        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="study-materials" element={<AdminStudyMaterials />} />
            <Route path="assignments" element={<AdminAssignments />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="tests" element={<AdminTests />} />
            <Route path="fees" element={<AdminFees />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>
        </Route>

        {/* Student (protected) */}
        <Route element={<ProtectedRoute role="student" />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="assignments" element={<StudentAssignments />} />
            <Route path="study-material" element={<StudentStudyMaterial />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="tests" element={<StudentTests />} />
            <Route path="fees" element={<StudentFees />} />
            <Route path="announcements" element={<StudentAnnouncements />} />
            <Route path="notifications" element={<StudentNotifications />} />
            <Route path="support" element={<StudentSupport />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
