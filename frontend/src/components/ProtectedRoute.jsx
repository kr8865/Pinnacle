import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ role }) {
  const { isAuthenticated, initializing, role: userRole } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <LoadingSpinner fullPage size="lg" />;
  }

  if (!isAuthenticated) {
    const loginPath = role === 'admin' ? '/admin-login' : '/student-login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (role && userRole !== role) {
    const redirectPath = userRole === 'admin' ? '/admin/dashboard' : '/student/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}
