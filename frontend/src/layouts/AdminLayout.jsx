import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { NotificationModal } from '../components/NotificationModal.jsx';
import {
  ShieldCheck,
  LayoutDashboard,
  CheckCircle2,
  Building,
  AlertTriangle,
  Award,
  MessageSquare,
  Activity,
  ScrollText,
  Radio,
  LogOut,
  Bell,
  Menu,
  X
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { label: 'Platform Overview', path: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Verification Queue', path: '/admin/verification', icon: CheckCircle2 },
    { label: 'Listing Moderation', path: '/admin/listings', icon: Building },
    { label: 'Reports & Disputes', path: '/admin/reports', icon: AlertTriangle },
    { label: 'Reliability Override', path: '/admin/reliability', icon: Award },
    { label: 'Review Moderation', path: '/admin/reviews', icon: MessageSquare },
    { label: 'Match Monitor', path: '/admin/matches', icon: Activity },
    { label: 'Broadcasts & Alerts', path: '/admin/broadcasts', icon: Radio },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 md:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800
          md:static md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center font-bold text-white shadow-lg shadow-rose-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block">
                PlaySphere Admin
              </span>
              <span className="text-xs text-rose-400 font-medium">Control Center</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-rose-600/15 text-rose-400 border border-rose-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Admin User info footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-sm font-semibold text-white truncate">
                {user?.fullName || 'Super Admin'}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'admin@playsphere.com'}</p>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 hidden sm:block">
              Operations & Platform Administration
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Cluster
            </span>

            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Admin Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {showNotifications && (
        <NotificationModal
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};
