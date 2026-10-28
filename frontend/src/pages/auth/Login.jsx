import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../api/auth.api.js';
import { Button } from '../../components/Button.jsx';
import { Trophy, Mail, Lock, ShieldAlert, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user: currentUser, loading: authLoading } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (!authLoading && isAuthenticated && currentUser) {
    if (currentUser.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (currentUser.role === 'VENUE_OWNER') return <Navigate to="/owner" replace />;
    return <Navigate to="/app" replace />;
  }

  const validate = () => {
    const errs = {};
    const trimmed = emailOrUsername.trim();
    if (!trimmed) {
      errs.emailOrUsername = 'Email or username is required';
    } else if (trimmed.length < 3) {
      errs.emailOrUsername = 'Must be at least 3 characters';
    }

    if (!password) {
      errs.password = 'Password is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    try {
      const data = await authApi.login({
        identifier: emailOrUsername.trim(),
        login: emailOrUsername.trim(),
        emailOrUsername: emailOrUsername.trim(),
        password
      });

      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name || data.user.fullName || 'Athlete'}!`);

      // Redirect by role
      if (data.user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (data.user.role === 'VENUE_OWNER') {
        navigate('/owner', { replace: true });
      } else {
        navigate('/app', { replace: true });
      }
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      const fieldErrors = {};
      let firstMsg = null;

      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        backendErrors.forEach((issue) => {
          const field = issue.path === 'login' ? 'emailOrUsername' : issue.path;
          fieldErrors[field] = issue.message;
          if (!firstMsg) firstMsg = issue.message;
        });
      }

      const msg =
        firstMsg ||
        err.response?.data?.message ||
        err.message ||
        'Login failed. Please check your credentials.';

      toast.error(msg);
      setErrors({ ...fieldErrors, form: msg });
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Logins
  const handleQuickDemo = (role) => {
    if (role === 'PLAYER') {
      setEmailOrUsername('rohan@example.com');
      setPassword('password123');
    } else if (role === 'VENUE_OWNER') {
      setEmailOrUsername('arena_owner@example.com');
      setPassword('password123');
    } else if (role === 'ADMIN') {
      setEmailOrUsername('admin@playsphere.com');
      setPassword('Admin@123');
    }
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 shadow-xl shadow-primary-500/20 mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          PlaySphere
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Find sports venues, assemble open squads, play today.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 border border-slate-700/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {errors.form && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-400 text-sm">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errors.form}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => {
                    setEmailOrUsername(e.target.value);
                    if (errors.emailOrUsername || errors.form) {
                      setErrors((prev) => ({ ...prev, emailOrUsername: null, form: null }));
                    }
                  }}
                  placeholder="e.g. rohan or athlete@playsphere.com"
                  className={`block w-full pl-11 pr-4 py-3 bg-slate-900 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all ${
                    errors.emailOrUsername ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
              </div>
              {errors.emailOrUsername && (
                <p className="mt-1 text-xs text-rose-400 font-medium">{errors.emailOrUsername}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    toast('Password reset link demo ready.');
                  }}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password || errors.form) {
                      setErrors((prev) => ({ ...prev, password: null, form: null }));
                    }
                  }}
                  placeholder="••••••••"
                  className={`block w-full pl-11 pr-4 py-3 bg-slate-900 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all ${
                    errors.password ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-400 font-medium">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full justify-center shadow-lg shadow-primary-600/30"
              loading={loading}
            >
              Sign In to PlaySphere
            </Button>
          </form>

          {/* Quick Demo Logins Pill Selector */}
          <div className="mt-6 pt-5 border-t border-slate-700/80">
            <p className="text-xs text-slate-400 text-center font-medium mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Demo Quick Credentials
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('PLAYER')}
                className="py-2 px-2 text-xs font-semibold rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/50 transition-colors"
              >
                Player
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('VENUE_OWNER')}
                className="py-2 px-2 text-xs font-semibold rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/50 transition-colors"
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                className="py-2 px-2 text-xs font-semibold rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 border border-slate-600/50 transition-colors"
              >
                Admin
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-primary-400 hover:text-primary-300 font-semibold underline underline-offset-2"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
