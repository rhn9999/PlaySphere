import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../api/auth.api.js';
import { Button } from '../../components/Button.jsx';
import { Trophy, Mail, Lock, User, AtSign, Building2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export const Signup = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user: currentUser, loading: authLoading } = useAuth();

  const [role, setRole] = useState('PLAYER'); // PLAYER or VENUE_OWNER
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [venueName, setVenueName] = useState('');
  const [selectedSports, setSelectedSports] = useState(['Football']);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (!authLoading && isAuthenticated && currentUser) {
    if (currentUser.role === 'VENUE_OWNER') return <Navigate to="/owner" replace />;
    if (currentUser.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/app" replace />;
  }

  const availableSports = ['Football', 'Cricket', 'Badminton', 'Tennis', 'Basketball', 'Pickleball'];

  const toggleSport = (sport) => {
    if (selectedSports.includes(sport)) {
      if (selectedSports.length > 1) {
        setSelectedSports(selectedSports.filter((s) => s !== sport));
      }
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const validate = () => {
    const errs = {};
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      errs.fullName = 'Full name is required';
    } else if (trimmedName.length < 2) {
      errs.fullName = 'Name must be at least 2 characters';
    }

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      errs.username = 'Unique username is required';
    } else if (trimmedUsername.length < 3) {
      errs.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]{3,30}$/.test(trimmedUsername)) {
      errs.username = 'Username can only contain letters, numbers, and underscores';
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      errs.email = 'Enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (role === 'VENUE_OWNER' && !venueName.trim()) {
      errs.venueName = 'Facility or organization name is required';
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
      const payload = {
        role,
        name: fullName.trim(),
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
        ...(role === 'PLAYER'
          ? {
              sports: selectedSports,
              preferredSports: selectedSports
            }
          : {
              businessName: venueName.trim(),
              venueName: venueName.trim()
            })
      };

      const data = await authApi.signup(payload);
      login(data.token, data.user);
      toast.success('Account created successfully! Welcome to PlaySphere.');

      if (data.user.role === 'VENUE_OWNER') {
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
          let field = issue.path;
          if (field === 'name') field = 'fullName';
          if (field === 'businessName') field = 'venueName';
          if (field === 'sports') field = 'preferredSports';
          fieldErrors[field] = issue.message;
          if (!firstMsg) firstMsg = issue.message;
        });
      }

      // Check conflict messages (e.g. email/username duplicate)
      const respMsg = err.response?.data?.message;
      if (respMsg?.toLowerCase().includes('email')) {
        fieldErrors.email = respMsg;
      } else if (respMsg?.toLowerCase().includes('username')) {
        fieldErrors.username = respMsg;
      }

      const msg = firstMsg || respMsg || err.message || 'Registration failed.';
      toast.error(msg);
      setErrors({ ...fieldErrors, form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 shadow-xl shadow-primary-500/20 mb-4">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Join PlaySphere
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Create your athlete or venue manager account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 border border-slate-700/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {/* Role Tabs */}
          <div className="flex rounded-xl bg-slate-900 p-1 mb-6 border border-slate-700">
            <button
              type="button"
              onClick={() => {
                setRole('PLAYER');
                setErrors({});
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                role === 'PLAYER'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Player / Host
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('VENUE_OWNER');
                setErrors({});
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                role === 'VENUE_OWNER'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Venue Manager
            </button>
          </div>

          {errors.form && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-400 text-sm">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{errors.form}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName || errors.form) {
                      setErrors((prev) => ({ ...prev, fullName: null, form: null }));
                    }
                  }}
                  placeholder="e.g. Rahul Sharma"
                  className={`block w-full pl-10 pr-3 py-2.5 bg-slate-900 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.fullName ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
              </div>
              {errors.fullName && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <AtSign className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username || errors.form) {
                      setErrors((prev) => ({ ...prev, username: null, form: null }));
                    }
                  }}
                  placeholder="e.g. rahul_striker"
                  className={`block w-full pl-10 pr-3 py-2.5 bg-slate-900 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.username ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
              </div>
              {errors.username && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.username}</p>}
            </div>

            {role === 'VENUE_OWNER' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Venue / Business Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => {
                      setVenueName(e.target.value);
                      if (errors.venueName || errors.form) {
                        setErrors((prev) => ({ ...prev, venueName: null, form: null }));
                      }
                    }}
                    placeholder="e.g. KickOff Arena & Turf"
                    className={`block w-full pl-10 pr-3 py-2.5 bg-slate-900 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.venueName ? 'border-rose-500' : 'border-slate-700'
                    }`}
                  />
                </div>
                {errors.venueName && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.venueName}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email || errors.form) {
                      setErrors((prev) => ({ ...prev, email: null, form: null }));
                    }
                  }}
                  placeholder="e.g. rahul@example.com"
                  className={`block w-full pl-10 pr-3 py-2.5 bg-slate-900 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.email ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
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
                  placeholder="Minimum 6 characters"
                  className={`block w-full pl-10 pr-3 py-2.5 bg-slate-900 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.password ? 'border-rose-500' : 'border-slate-700'
                  }`}
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-400 font-medium">{errors.password}</p>}
            </div>

            {role === 'PLAYER' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Sports You Play
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableSports.map((sport) => {
                    const active = selectedSports.includes(sport);
                    return (
                      <button
                        type="button"
                        key={sport}
                        onClick={() => toggleSport(sport)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                          active
                            ? 'bg-primary-500 text-white shadow-xs'
                            : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
                        }`}
                      >
                        {sport}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full justify-center shadow-lg shadow-primary-600/30"
                loading={loading}
              >
                Create Account
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary-400 hover:text-primary-300 font-semibold underline underline-offset-2"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
