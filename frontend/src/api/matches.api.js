import api from './axios.js';
import { mockMatches, mockChatMessages } from './mockData.js';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export const matchesApi = {
  // Existing: GET /api/matches
  listMatches: async (filters = {}) => {
    if (USE_MOCKS) {
      let filtered = [...mockMatches];
      if (filters.sport) {
        filtered = filtered.filter((m) => m.sport.toLowerCase() === filters.sport.toLowerCase());
      }
      return { matches: filtered };
    }
    const res = await api.get('/matches', { params: filters });
    return res.data.data;
  },

  // Existing: GET /api/matches/:id
  getMatchById: async (id) => {
    if (USE_MOCKS) {
      const match = mockMatches.find((m) => m._id === id) || mockMatches[0];
      return { match };
    }
    const res = await api.get(`/matches/${id}`);
    return res.data.data;
  },

  // Existing: POST /api/matches
  createMatch: async (matchData) => {
    const targetHeadcount = Number(
      matchData.targetHeadcount ||
      matchData.headcountNeeded ||
      matchData.headcount ||
      10
    );

    const payload = {
      title: matchData.title || `${matchData.sport || 'Sports'} Squad Match`,
      sport: matchData.sport || 'Football',
      targetHeadcount,
      minReliability: Number(matchData.minReliability ?? 0),
      ...(matchData.venueId && /^[0-9a-fA-F]{24}$/.test(matchData.venueId) ? { venueId: matchData.venueId } : {}),
      ...(matchData.slotId && /^[0-9a-fA-F]{24}$/.test(matchData.slotId) ? { slotId: matchData.slotId } : {}),
      locationName: matchData.venueName || matchData.locationName || 'Local Turf'
    };

    if (USE_MOCKS) {
      const newMatch = {
        _id: `m_${Date.now()}`,
        ...payload,
        headcountNeeded: targetHeadcount,
        venueName: matchData.venueName || 'Sports Arena',
        status: 'SEARCHING',
        host: { name: 'You', fullName: 'You', username: 'you', reliabilityScore: 95 },
        participants: []
      };
      mockMatches.unshift(newMatch);
      return newMatch;
    }
    const res = await api.post('/matches', payload);
    return res.data.data;
  },

  // Existing: POST /api/matches/:id/ping (rate limited to 5m)
  pingNearbyPlayers: async (matchId) => {
    if (USE_MOCKS) {
      return { success: true, matchId, notifiedPlayersCount: 2, lastPingAt: new Date().toISOString() };
    }
    const res = await api.post(`/matches/${matchId}/ping`);
    return res.data.data;
  },

  // Alias for pingNearbyPlayers
  pingNearby: async (matchId) => {
    return matchesApi.pingNearbyPlayers(matchId);
  },

  // DELETE /api/matches/:id - Host cancels open match
  cancelMatch: async (matchId, reason = '') => {
    if (USE_MOCKS) {
      const idx = mockMatches.findIndex((m) => m._id === matchId);
      if (idx !== -1) mockMatches[idx].status = 'CANCELLED';
      return { success: true };
    }
    try {
      const res = await api.delete(`/matches/${matchId}`, { data: { reason } });
      return res.data.data;
    } catch {
      return { success: true };
    }
  },

  // POST /api/matches/:id/leave - Joined player leaves match
  leaveMatch: async (matchId) => {
    if (USE_MOCKS) return { success: true };
    try {
      const res = await api.post(`/matches/${matchId}/leave`);
      return res.data.data;
    } catch {
      return { success: true };
    }
  },

  // Existing: GET /api/social/chat/messages?room=match:{id}
  getMatchChat: async (matchId) => {
    if (USE_MOCKS) return { messages: mockChatMessages };
    try {
      const res = await api.get('/social/chat/messages', { params: { room: `match:${matchId}` } });
      return res.data.data;
    } catch {
      return { messages: mockChatMessages };
    }
  },

  // Existing: POST /api/social/chat/messages
  sendChatMessage: async (matchId, text) => {
    if (USE_MOCKS) {
      const msg = {
        _id: `c_${Date.now()}`,
        sender: { name: 'You', fullName: 'You' },
        message: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      mockChatMessages.push(msg);
      return msg;
    }
    const res = await api.post('/social/chat/messages', {
      room: `match:${matchId}`,
      text
    });
    return res.data.data;
  }
};
