import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';

// Layouts
import { PlayerLayout } from './layouts/PlayerLayout.jsx';
import { OwnerLayout } from './layouts/OwnerLayout.jsx';
import { AdminLayout } from './layouts/AdminLayout.jsx';

// Auth Pages
import { Login } from './pages/auth/Login.jsx';
import { Signup } from './pages/auth/Signup.jsx';

// Player Pages
import { VenueDiscovery } from './pages/player/VenueDiscovery.jsx';
import { VenueDetail } from './pages/player/VenueDetail.jsx';
import { OpenMatchFeed } from './pages/player/OpenMatchFeed.jsx';
import { MatchDetail } from './pages/player/MatchDetail.jsx';
import { PlayerProfile } from './pages/player/PlayerProfile.jsx';
import { MyBookings } from './pages/player/MyBookings.jsx';

// Owner Pages
import { LiveLedger } from './pages/owner/LiveLedger.jsx';
import { OwnerListings } from './pages/owner/OwnerListings.jsx';
import { OwnerRequests } from './pages/owner/OwnerRequests.jsx';
import { OwnerPricing } from './pages/owner/OwnerPricing.jsx';
import { OwnerAnalytics } from './pages/owner/OwnerAnalytics.jsx';
import { OwnerReviews } from './pages/owner/OwnerReviews.jsx';

// Admin Pages
import { AdminOverview } from './pages/admin/AdminOverview.jsx';
import { AdminVerification } from './pages/admin/AdminVerification.jsx';
import { AdminListings } from './pages/admin/AdminListings.jsx';
import { AdminReports } from './pages/admin/AdminReports.jsx';
import { AdminReliability } from './pages/admin/AdminReliability.jsx';
import { AdminReviewModeration } from './pages/admin/AdminReviewModeration.jsx';
import { AdminMatchMonitor } from './pages/admin/AdminMatchMonitor.jsx';
import { AdminBroadcasts } from './pages/admin/AdminBroadcasts.jsx';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs.jsx';

// Root redirector based on auth and role
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'VENUE_OWNER') return <Navigate to="/owner" replace />;
  if (user.role === 'PLAYER') return <Navigate to="/app" replace />;
  return <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Toast Notifications Provider */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0f172a',
              color: '#fff',
              fontSize: '13px',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff'
              }
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff'
              }
            }
          }}
        />

        <Routes>
          {/* Root */}
          <Route path="/" element={<RootRedirect />} />

          {/* Public Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Player App (Mobile-First, Tab Bar) */}
          <Route
            path="/app"
            element={
              <ProtectedRoute allowedRoles={['PLAYER', 'ADMIN']}>
                <PlayerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<VenueDiscovery />} />
            <Route path="venues/:id" element={<VenueDetail />} />
            <Route path="matches" element={<OpenMatchFeed />} />
            <Route path="matches/:id" element={<MatchDetail />} />
            <Route path="profile" element={<PlayerProfile />} />
            <Route path="bookings" element={<MyBookings />} />
          </Route>

          {/* Venue Owner Dashboard (Desktop & Tablet Sidebar) */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={['VENUE_OWNER', 'ADMIN']}>
                <OwnerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<LiveLedger />} />
            <Route path="listings" element={<OwnerListings />} />
            <Route path="requests" element={<OwnerRequests />} />
            <Route path="pricing" element={<OwnerPricing />} />
            <Route path="analytics" element={<OwnerAnalytics />} />
            <Route path="reviews" element={<OwnerReviews />} />
          </Route>

          {/* Admin Panel (Full Platform Control) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="verification" element={<AdminVerification />} />
            <Route path="listings" element={<AdminListings />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="reliability" element={<AdminReliability />} />
            <Route path="reviews" element={<AdminReviewModeration />} />
            <Route path="matches" element={<AdminMatchMonitor />} />
            <Route path="broadcasts" element={<AdminBroadcasts />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
