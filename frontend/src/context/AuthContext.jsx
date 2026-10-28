import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth.api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('token');
    if (!saved || saved === '[object Object]') {
      localStorage.removeItem('token');
      return null;
    }
    return saved;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken && storedToken !== '[object Object]') {
        try {
          const profile = await authApi.getMe();
          if (profile) {
            setUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));
          }
        } catch {
          // Token invalid or expired
          logout();
        }
      } else if (storedToken === '[object Object]') {
        logout();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (first, second) => {
    let authUser = null;
    let authToken = null;

    if (typeof first === 'object' && first !== null) {
      authUser = first;
      authToken = second;
    } else if (typeof second === 'object' && second !== null) {
      authToken = first;
      authUser = second;
    } else {
      authToken = first;
      authUser = second;
    }

    setToken(authToken);
    setUser(authUser);

    if (authToken && typeof authToken === 'string') {
      localStorage.setItem('token', authToken);
    }
    if (authUser && typeof authUser === 'object') {
      localStorage.setItem('user', JSON.stringify(authUser));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  const role = user?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        loading,
        isAuthenticated: Boolean(token && user && user.role),
        login,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
