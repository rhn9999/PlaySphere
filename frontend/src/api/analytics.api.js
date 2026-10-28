import api from './axios.js';
import { mockSlots } from './mockData.js';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export const analyticsApi = {
  // TODO backend: GET /api/owner/analytics - Live Ledger stats & Recharts graphs
  getOwnerAnalytics: async () => {
    if (USE_MOCKS) {
      return {
        hourlyRequests: [
          { hour: '06:00', requests: 4 },
          { hour: '07:00', requests: 8 },
          { hour: '08:00', requests: 12 },
          { hour: '16:00', requests: 15 },
          { hour: '17:00', requests: 22 },
          { hour: '18:00', requests: 35 },
          { hour: '19:00', requests: 48 },
          { hour: '20:00', requests: 42 },
          { hour: '21:00', requests: 28 },
          { hour: '22:00', requests: 14 }
        ],
        sportBreakdown: [
          { name: 'Football', value: 58, color: '#10b981' },
          { name: 'Cricket', value: 24, color: '#f97316' },
          { name: 'Badminton', value: 12, color: '#06b6d4' },
          { name: 'Tennis', value: 6, color: '#8b5cf6' }
        ],
        repeatHostIndex: 78.4,
        avgResponseTimeMinutes: 6.2,
        acceptanceRatePercent: 91.5,
        unmetDemandSlots: [
          { day: 'Friday', time: '19:00 - 20:00', inquiries: 18 },
          { day: 'Saturday', time: '18:00 - 19:00', inquiries: 24 },
          { day: 'Sunday', time: '07:00 - 08:00', inquiries: 15 }
        ]
      };
    }
    try {
      const res = await api.get('/owner/analytics');
      return res.data.data;
    } catch {
      return {
        hourlyRequests: [
          { hour: '06:00', requests: 4 },
          { hour: '07:00', requests: 8 },
          { hour: '17:00', requests: 22 },
          { hour: '18:00', requests: 35 },
          { hour: '19:00', requests: 48 },
          { hour: '20:00', requests: 42 }
        ],
        sportBreakdown: [
          { name: 'Football', value: 60, color: '#10b981' },
          { name: 'Cricket', value: 25, color: '#f97316' },
          { name: 'Badminton', value: 15, color: '#06b6d4' }
        ],
        repeatHostIndex: 78.4,
        avgResponseTimeMinutes: 6.2,
        acceptanceRatePercent: 91.5,
        unmetDemandSlots: []
      };
    }
  },

  // TODO backend: GET /api/owner/ledger - Live Ledger day/week slot calendar
  getLiveLedger: async (date) => {
    if (USE_MOCKS) return mockSlots;
    try {
      const res = await api.get('/owner/ledger', { params: { date } });
      return res.data.data;
    } catch {
      return mockSlots;
    }
  },

  // TODO backend: GET /api/admin/analytics - Platform level metrics
  getAdminAnalytics: async () => {
    if (USE_MOCKS) {
      return {
        grossMerchandiseValue: 1845000,
        bookingVolume: 924,
        dauMauRatio: 0.64,
        avgAcceptanceRate: 93.2,
        activeVenuesCount: 48,
        activeMatchesToday: 32,
        userActivityTrends: [
          { month: 'May', dau: 1200, mau: 3400, gmv: 320000 },
          { month: 'Jun', dau: 1800, mau: 4800, gmv: 540000 },
          { month: 'Jul', dau: 2400, mau: 6200, gmv: 780000 },
          { month: 'Aug', dau: 3100, mau: 7900, gmv: 1120000 },
          { month: 'Sep', dau: 4200, mau: 9800, gmv: 1450000 },
          { month: 'Oct', dau: 5400, mau: 12400, gmv: 1845000 }
        ],
        cityHotspots: [
          { name: 'Ahmedabad', activeVenues: 28, matches: 142, coordinates: [72.5714, 23.0225] },
          { name: 'Gandhinagar', activeVenues: 12, matches: 48, coordinates: [72.6840, 23.2156] },
          { name: 'Vadodara', activeVenues: 8, matches: 31, coordinates: [73.1812, 22.3072] }
        ]
      };
    }
    try {
      const res = await api.get('/admin/analytics');
      return res.data.data;
    } catch {
      return {
        grossMerchandiseValue: 1845000,
        bookingVolume: 924,
        dauMauRatio: 0.64,
        avgAcceptanceRate: 93.2,
        userActivityTrends: [
          { month: 'Aug', dau: 3100, mau: 7900, gmv: 1120000 },
          { month: 'Sep', dau: 4200, mau: 9800, gmv: 1450000 },
          { month: 'Oct', dau: 5400, mau: 12400, gmv: 1845000 }
        ],
        cityHotspots: []
      };
    }
  }
};
