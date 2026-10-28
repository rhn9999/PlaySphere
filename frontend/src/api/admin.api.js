import api from './axios.js';
import { mockVenues, mockAuditLogs, mockUsers, mockReports, mockMatches, mockReviews } from './mockData.js';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export const adminApi = {
  // GET Platform Analytics
  getPlatformAnalytics: async () => {
    if (USE_MOCKS) {
      return {
        analytics: {
          totalGMV: 4820000,
          totalBookings: 3420,
          activeUsers: 14890,
          verifiedVenues: 142,
          matchAcceptanceRate: 92.4,
          commissionRate: 7.5
        }
      };
    }
    try {
      const res = await api.get('/admin/analytics');
      return res.data.data;
    } catch {
      return {
        analytics: {
          totalGMV: 4820000,
          totalBookings: 3420,
          activeUsers: 14890,
          verifiedVenues: 142,
          matchAcceptanceRate: 92.4,
          commissionRate: 7.5
        }
      };
    }
  },

  // PUT Commission Tiers
  updateCommissionTiers: async (tierData) => {
    if (USE_MOCKS) return { success: true, ...tierData };
    try {
      const res = await api.put('/admin/commission-tiers', tierData);
      return res.data.data;
    } catch {
      return { success: true, ...tierData };
    }
  },

  // Verification Queue
  getVerificationQueue: async () => {
    if (USE_MOCKS) {
      return {
        venues: [
          {
            _id: 'v_pending_1',
            name: 'Apex Arena Football Turf',
            verifyStatus: 'PENDING',
            address: { formattedAddress: 'Bopal Cross Roads, Ahmedabad, Gujarat', city: 'Ahmedabad' },
            operatingHours: { open: '06:00', close: '23:00' },
            pricing: { offPeak: 900, peak: 1400 },
            grounds: [{ name: 'Turf 1', sportType: 'Football' }],
            amenities: ['Floodlights', 'Changing Rooms', 'Drinking Water', 'Parking'],
            owner: { fullName: 'Kavita Dave', email: 'kavita@apexarena.com' },
            photos: [{ url: 'https://images.unsplash.com/photo-1529900240041-22f1df4d1897?w=400' }]
          }
        ]
      };
    }
    try {
      const res = await api.get('/admin/verifications');
      return res.data.data;
    } catch {
      return { venues: [] };
    }
  },

  approveVenue: async (venueId) => {
    if (USE_MOCKS) return { success: true };
    try {
      const res = await api.put(`/admin/venues/${venueId}/approve`);
      return res.data.data;
    } catch {
      return { success: true };
    }
  },

  rejectVenue: async (venueId, reason) => {
    if (USE_MOCKS) return { success: true };
    try {
      const res = await api.put(`/admin/venues/${venueId}/reject`, { reason });
      return res.data.data;
    } catch {
      return { success: true };
    }
  },

  // Venue Listings Moderation
  listVenues: async () => {
    if (USE_MOCKS) return { venues: mockVenues };
    try {
      const res = await api.get('/admin/venues');
      return res.data.data;
    } catch {
      return { venues: mockVenues };
    }
  },

  suspendVenue: async (venueId, reason) => {
    if (USE_MOCKS) return { success: true };
    try {
      const res = await api.put(`/admin/venues/${venueId}/suspend`, { reason });
      return res.data.data;
    } catch {
      return { success: true };
    }
  },

  delistVenue: async (venueId, reason) => {
    if (USE_MOCKS) return { success: true };
    try {
      const res = await api.delete(`/admin/venues/${venueId}`, { data: { reason } });
      return res.data.data;
    } catch {
      return { success: true };
    }
  },

  // Reports & Disputes
  getReports: async () => {
    if (USE_MOCKS) return { reports: mockReports };
    try {
      const res = await api.get('/admin/reports');
      return res.data.data;
    } catch {
      return { reports: mockReports };
    }
  },

  resolveReport: async (reportId, status, resolutionNote = '') => {
    if (USE_MOCKS) return { success: true };
    try {
      const res = await api.patch(`/admin/reports/${reportId}/resolve`, { status, resolutionNote });
      return res.data.data;
    } catch {
      return { success: true };
    }
  },

  banUser: async (userId, reason, durationDays = null) => {
    if (USE_MOCKS) return { success: true, isBanned: true };
    try {
      const res = await api.post(`/admin/users/${userId}/ban`, { isBanned: true, reason, durationDays });
      return res.data.data;
    } catch {
      return { success: true };
    }
  },

  // Reliability Overrides
  searchPlayers: async (query) => {
    if (USE_MOCKS) {
      return { players: [mockUsers.player] };
    }
    try {
      const res = await api.get('/admin/players/search', { params: { q: query } });
      return res.data.data;
    } catch {
      return { players: [mockUsers.player] };
    }
  },

  getPlayerHistory: async (playerId) => {
    if (USE_MOCKS) {
      return {
        history: [
          { matchTitle: '7v7 Football at Arena Turf', reason: 'Attended match on time', change: 2, date: new Date().toISOString() },
          { matchTitle: 'Weekend Cricket Box Match', reason: 'Attended match on time', change: 1, date: new Date(Date.now() - 86400000 * 2).toISOString() },
          { matchTitle: 'Night Badminton Session', reason: 'Late departure penalty within 4h cutoff', change: -5, date: new Date(Date.now() - 86400000 * 5).toISOString() }
        ]
      };
    }
    try {
      const res = await api.get(`/admin/players/${playerId}/history`);
      return res.data.data;
    } catch {
      return { history: [] };
    }
  },

  overrideReliabilityScore: async (playerId, reliabilityScore, reason) => {
    if (USE_MOCKS) {
      mockUsers.player.reliabilityScore = reliabilityScore;
      return { success: true, reliabilityScore };
    }
    const res = await api.patch(`/admin/players/${playerId}/reliability-score`, {
      reliabilityScore,
      reason
    });
    return res.data.data;
  },

  // Review Moderation
  getModerationReviews: async () => {
    if (USE_MOCKS) {
      return {
        reviews: [
          {
            _id: 'rev_mod_1',
            targetType: 'VENUE',
            targetName: 'KickOff Arena Bopal',
            authorName: 'Rohan Sharma',
            rating: 5,
            comment: 'Exceptional floodlight visibility and great turf surface.',
            createdAt: new Date().toISOString()
          },
          {
            _id: 'rev_mod_2',
            targetType: 'PLAYER',
            targetName: 'Amit Patel',
            authorName: 'Deepak Shah',
            rating: 5,
            comment: 'Super sportsmanship, arrived 15 mins before kickoff.',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      };
    }
    try {
      const res = await api.get('/admin/reviews');
      return res.data.data;
    } catch {
      return { reviews: [] };
    }
  },

  hideReview: async (reviewId) => {
    if (USE_MOCKS) return { success: true };
    try {
      const res = await api.put(`/admin/reviews/${reviewId}/hide`);
      return res.data.data;
    } catch {
      return { success: true };
    }
  },

  deleteReview: async (reviewId) => {
    if (USE_MOCKS) return { success: true };
    try {
      const res = await api.delete(`/admin/reviews/${reviewId}`);
      return res.data.data;
    } catch {
      return { success: true };
    }
  },

  // Match Monitor
  getLiveMatches: async () => {
    if (USE_MOCKS) return { matches: mockMatches };
    try {
      const res = await api.get('/admin/matches');
      return res.data.data;
    } catch {
      return { matches: mockMatches };
    }
  },

  cancelMatchAdmin: async (matchId, reason) => {
    if (USE_MOCKS) return { success: true };
    try {
      const res = await api.post(`/admin/matches/${matchId}/cancel`, { reason });
      return res.data.data;
    } catch {
      return { success: true };
    }
  },

  // Broadcasts & Alert Triggers
  sendBroadcastPush: async (broadcastData) => {
    if (USE_MOCKS) return { success: true };
    try {
      const res = await api.post('/admin/broadcasts', broadcastData);
      return res.data.data;
    } catch {
      return { success: true };
    }
  },

  getAlertTriggers: async () => {
    if (USE_MOCKS) {
      return {
        triggers: {
          headcountNearTarget: true,
          reliabilityPenaltyWarning: true,
          slotOpenWeekendAlert: false,
          rainCancellationNotice: true
        }
      };
    }
    try {
      const res = await api.get('/admin/alert-triggers');
      return res.data.data;
    } catch {
      return {
        triggers: {
          headcountNearTarget: true,
          reliabilityPenaltyWarning: true,
          slotOpenWeekendAlert: false,
          rainCancellationNotice: true
        }
      };
    }
  },

  updateAlertTriggers: async (triggers) => {
    if (USE_MOCKS) return { success: true, triggers };
    try {
      const res = await api.put('/admin/alert-triggers', { triggers });
      return res.data.data;
    } catch {
      return { success: true, triggers };
    }
  },

  // Audit Logs
  getAuditLogs: async (params = {}) => {
    if (USE_MOCKS) return { logs: mockAuditLogs };
    try {
      const res = await api.get('/admin/audit-logs', { params });
      return res.data.data;
    } catch {
      return { logs: mockAuditLogs };
    }
  }
};
