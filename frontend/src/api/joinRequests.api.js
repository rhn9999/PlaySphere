import api from './axios.js';
import { mockJoinRequests } from './mockData.js';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export const joinRequestsApi = {
  // Existing: POST /api/matches/:id/join
  requestJoin: async (matchId, message = '') => {
    if (USE_MOCKS) {
      const newReq = {
        _id: `jr_${Date.now()}`,
        match: matchId,
        message,
        status: 'PENDING',
        player: { fullName: 'You', username: 'you', reliabilityScore: 92 }
      };
      mockJoinRequests.push(newReq);
      return newReq;
    }
    const res = await api.post(`/matches/${matchId}/join`, { message });
    return res.data.data;
  },

  // Alias for requestJoin
  requestToJoin: async (matchId, message) => {
    return joinRequestsApi.requestJoin(matchId, message);
  },

  // Existing: GET /api/matches/:id/join-requests
  getMatchJoinRequests: async (matchId) => {
    if (USE_MOCKS) {
      return mockJoinRequests.filter((r) => r.match === matchId || true);
    }
    const res = await api.get(`/matches/${matchId}/join-requests`);
    return res.data.data;
  },

  // Alias for getMatchJoinRequests
  getRequestsForMatch: async (matchId) => {
    return joinRequestsApi.getMatchJoinRequests(matchId);
  },

  // Existing: POST /api/matches/requests/:requestId/respond
  respondToRequest: async (requestId, action) => {
    if (USE_MOCKS) {
      const r = mockJoinRequests.find((x) => x._id === requestId);
      if (r) r.status = action;
      return { success: true, action };
    }
    const res = await api.post(`/matches/requests/${requestId}/respond`, { action });
    return res.data.data;
  },

  // Convenience helpers
  acceptRequest: async (requestId) => {
    return joinRequestsApi.respondToRequest(requestId, 'ACCEPTED');
  },

  declineRequest: async (requestId) => {
    return joinRequestsApi.respondToRequest(requestId, 'REJECTED');
  }
};
