import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from '../components/Spinner.jsx';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && (!user.role || !allowedRoles.includes(user.role))) {
    // Redirect to the appropriate home dashboard for the user's role without causing loops
    if (user.role === 'VENUE_OWNER') {
      if (!location.pathname.startsWith('/owner')) {
        return <Navigate to="/owner" replace />;
      }
    } else if (user.role === 'ADMIN') {
      if (!location.pathname.startsWith('/admin')) {
        return <Navigate to="/admin" replace />;
      }
    } else if (user.role === 'PLAYER') {
      if (!location.pathname.startsWith('/app')) {
        return <Navigate to="/app" replace />;
      }
    }
    // If the role is unknown or user is unauthorized inside their own portal
    return <Navigate to="/login" replace />;
  }

  return children;
};
