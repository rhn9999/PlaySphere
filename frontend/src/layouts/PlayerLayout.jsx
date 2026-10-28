import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { NotificationModal } from '../components/NotificationModal.jsx';
import {
  Compass,
  Trophy,
  CalendarCheck,
  User,
  Bell,
  LogOut,
  MapPin
} from 'lucide-react';

export const PlayerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { label: 'Venues', path: '/app', icon: Compass, end: true },
    { label: 'Matches', path: '/app/matches', icon: Trophy },
    { label: 'Bookings', path: '/app/bookings', icon: CalendarCheck },
    { label: 'Profile', path: '/app/profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20 md:pb-0">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-emerald-400 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-primary-500/30">
              P
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                Play<span className="text-primary-600">Sphere</span>
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <MapPin className="w-3 h-3 text-primary-500 shrink-0" />
                <span className="truncate max-w-[140px] md:max-w-none">
                  {user?.currentLocation ? 'Ahmedabad (Active)' : 'Detecting Location...'}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                  ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }
                `}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-500 ring-2 ring-white"></span>
            </button>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors ml-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6">
        <Outlet />
      </main>

      {/* Mobile-First Bottom Tab Bar (Touch-friendly 44px+ targets) */}
      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 md:hidden"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `
                flex flex-col items-center justify-center min-w-[56px] min-h-[44px] rounded-xl transition-all
                ${
                  isActive
                    ? 'text-primary-600 font-semibold'
                    : 'text-slate-400 hover:text-slate-600 font-medium'
                }
              `}
            >
              <item.icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
};
