import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { NotificationModal } from '../components/NotificationModal.jsx';
import {
  CalendarDays,
  Building2,
  Inbox,
  BadgePercent,
  BarChart3,
  Star,
  LogOut,
  Bell,
  Menu,
  X
} from 'lucide-react';

export const OwnerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { label: 'Live Ledger', path: '/owner', icon: CalendarDays, end: true },
    { label: 'Listings & Grounds', path: '/owner/listings', icon: Building2 },
    { label: 'Requests Queue', path: '/owner/requests', icon: Inbox },
    { label: 'Pricing Settings', path: '/owner/pricing', icon: BadgePercent },
    { label: 'Analytics', path: '/owner/analytics', icon: BarChart3 },
    { label: 'Venue Reviews', path: '/owner/reviews', icon: Star }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 ease-in-out
          md:static md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center font-bold text-white shadow-lg shadow-primary-500/20">
              V
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block">
                Venue Ledger
              </span>
              <span className="text-xs text-slate-400 truncate block max-w-[140px]">
                {user?.businessName || 'Owner Portal'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }
              `}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="px-3.5 py-2.5 mb-2">
            <p className="text-xs text-slate-400">Logged in as</p>
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 hidden sm:block">
              Facility Management Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-500"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <NotificationModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
};
