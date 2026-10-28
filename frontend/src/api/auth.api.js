import api from './axios.js';
import { mockUsers } from './mockData.js';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export const authApi = {
  // Existing: POST /api/auth/signup
  signup: async (userData) => {
    const payload = {
      name: (userData.name || userData.fullName || '').trim(),
      fullName: (userData.fullName || userData.name || '').trim(),
      username: (userData.username || '').trim().toLowerCase(),
      email: (userData.email || '').trim().toLowerCase(),
      password: userData.password,
      role: userData.role || 'PLAYER',
      bio: userData.bio || '',
      ...(userData.role === 'VENUE_OWNER'
        ? {
            businessName: (userData.businessName || userData.venueName || '').trim(),
            venueName: (userData.venueName || userData.businessName || '').trim()
          }
        : {
            sports: userData.sports || userData.preferredSports || [],
            preferredSports: userData.preferredSports || userData.sports || []
          })
    };

    if (USE_MOCKS) {
      const mockBase = payload.role === 'VENUE_OWNER' ? mockUsers.owner : mockUsers.player;
      return { token: 'mock_jwt_token', user: { ...mockBase, ...payload } };
    }

    const res = await api.post('/auth/signup', payload);
    return res.data.data;
  },

  // Alias for signup
  register: async (userData) => {
    return authApi.signup(userData);
  },

  // Existing: POST /api/auth/login
  login: async (credentials) => {
    const loginIdentifier = (
      credentials.login ||
      credentials.emailOrUsername ||
      credentials.email ||
      credentials.username ||
      ''
    ).trim();

    const payload = {
      identifier: loginIdentifier,
      login: loginIdentifier,
      emailOrUsername: loginIdentifier,
      password: credentials.password
    };

    if (USE_MOCKS) {
      const role =
        credentials.role ||
        (loginIdentifier.includes('admin')
          ? 'ADMIN'
          : loginIdentifier.includes('owner') || loginIdentifier.includes('arena')
          ? 'VENUE_OWNER'
          : 'PLAYER');
      const user =
        role === 'ADMIN' ? mockUsers.admin : role === 'VENUE_OWNER' ? mockUsers.owner : mockUsers.player;
      return { token: 'mock_jwt_token', user };
    }

    const res = await api.post('/auth/login', payload);
    return res.data.data;
  },

  // Existing: GET /api/auth/me
  getMe: async () => {
    if (USE_MOCKS) {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : mockUsers.player;
    }
    const res = await api.get('/auth/me');
    return res.data.data;
  }
};
