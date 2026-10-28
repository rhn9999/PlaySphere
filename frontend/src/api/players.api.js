import api from './axios.js';
import { mockUsers, mockSkills } from './mockData.js';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export const playersApi = {
  // Existing: GET /api/players/me
  getMe: async () => {
    if (USE_MOCKS) return mockUsers.player;
    const res = await api.get('/players/me');
    return res.data.data;
  },

  // Alias for getMe
  getMyProfile: async () => {
    return playersApi.getMe();
  },

  // Existing: POST /api/players/update-location
  // Validates with updateLocationSchema: { lng, lat }
  updateLocation: async (arg1, arg2) => {
    let lat, lng;
    if (typeof arg1 === 'number' && typeof arg2 === 'number') {
      lat = arg1;
      lng = arg2;
    } else if (typeof arg1 === 'object' && arg1 !== null) {
      lat = arg1.lat ?? arg1.latitude;
      lng = arg1.lng ?? arg1.longitude;
    } else {
      lat = arg1;
      lng = arg2;
    }

    const payload = {
      lat: Number(lat),
      lng: Number(lng)
    };

    if (USE_MOCKS) {
      mockUsers.player.currentLocation = { type: 'Point', coordinates: [payload.lng, payload.lat] };
      return mockUsers.player;
    }
    const res = await api.post('/players/update-location', payload);
    return res.data.data;
  },

  // Existing: POST /api/players/fcm-token
  updateFcmToken: async (fcmToken) => {
    if (USE_MOCKS) return { fcmToken };
    const res = await api.post('/players/fcm-token', { fcmToken });
    return res.data.data;
  },

  // TODO backend: PUT /api/players/me - Update profile fields (bio, sports, avatarUrl)
  updateProfile: async (profileData) => {
    if (USE_MOCKS) {
      Object.assign(mockUsers.player, profileData);
      return mockUsers.player;
    }
    try {
      const res = await api.put('/players/me', profileData);
      return res.data.data;
    } catch {
      // Fallback: update local storage copy
      return profileData;
    }
  },

  // TODO backend: GET /api/players/:id - Get other player's public profile (without sensitive location)
  getPlayerById: async (id) => {
    if (USE_MOCKS) {
      return {
        _id: id,
        name: 'Deepak Shah',
        fullName: 'Deepak Shah',
        username: 'deepak_striker',
        reliabilityScore: 88,
        gamesPlayed: 24,
        sports: ['Football'],
        bio: 'Striker ready for 7v7 matches in Ahmedabad',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      };
    }
    const res = await api.get(`/players/${id}`);
    return res.data.data;
  },

  // Existing: GET /api/social/skills/:playerId
  getSkills: async (playerId) => {
    if (USE_MOCKS) return mockSkills;
    const res = await api.get(`/social/skills/${playerId}`);
    return res.data.data;
  },

  // Existing: POST /api/social/skills/endorse
  endorseSkill: async (playerId, skillName) => {
    if (USE_MOCKS) {
      const found = mockSkills.find((s) => s.name.toLowerCase() === skillName.toLowerCase());
      if (found) {
        found.endorsementCount = (found.endorsementCount || 0) + 1;
        found.endorsed = true;
        return found;
      }
      const newSkill = { _id: `sk_${Date.now()}`, name: skillName, endorsementCount: 1, endorsed: true };
      mockSkills.push(newSkill);
      return newSkill;
    }
    const res = await api.post('/social/skills/endorse', { playerId, skillName });
    return res.data.data;
  },

  // Add skill tag
  addSkillTag: async (playerId, skillName) => {
    if (USE_MOCKS) {
      const newSkill = { _id: `sk_${Date.now()}`, name: skillName, endorsementCount: 1, endorsed: true };
      mockSkills.push(newSkill);
      return newSkill;
    }
    try {
      const res = await api.post(`/players/${playerId}/skills`, { skillName });
      return res.data.data;
    } catch {
      return { _id: `sk_${Date.now()}`, name: skillName, endorsementCount: 0 };
    }
  }
};
