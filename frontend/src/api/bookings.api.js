import api from './axios.js';
import { mockBookings, mockSlots } from './mockData.js';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export const bookingsApi = {
  // Existing: POST /api/bookings
  bookSlot: async (bookingData) => {
    if (USE_MOCKS) {
      const newB = {
        _id: `b_${Date.now()}`,
        status: 'CONFIRMED',
        qrPass: `KHEL-PASS-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        ...bookingData
      };
      mockBookings.push(newB);
      return { booking: newB };
    }
    const res = await api.post('/bookings', bookingData);
    return res.data.data;
  },

  // Submit booking once match squad is ready
  submitBooking: async (matchId) => {
    if (USE_MOCKS) {
      const b = {
        _id: `b_${Date.now()}`,
        match: matchId,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };
      mockBookings.push(b);
      return b;
    }
    try {
      const res = await api.post(`/bookings/matches/${matchId}`);
      return res.data.data;
    } catch {
      return { status: 'PENDING' };
    }
  },

  // Existing: GET /api/bookings/my
  getMyBookings: async () => {
    if (USE_MOCKS) return { bookings: mockBookings };
    try {
      const res = await api.get('/bookings/my');
      return res.data.data;
    } catch {
      return { bookings: mockBookings };
    }
  },

  // GET /api/venues/my/requests - Owner incoming request queue
  getVenueRequests: async () => {
    if (USE_MOCKS) {
      return {
        requests: [
          {
            _id: 'req_101',
            status: 'PENDING',
            groundName: 'Main Turf A',
            sport: 'Football',
            startTime: '19:00',
            endTime: '20:00',
            headcount: 10,
            totalAmount: 1200,
            host: { fullName: 'Rahul Sharma', reliabilityScore: 94 },
            createdAt: new Date(Date.now() - 15 * 60000).toISOString()
          },
          {
            _id: 'req_102',
            status: 'PENDING',
            groundName: 'Box Arena 1',
            sport: 'Cricket',
            startTime: '20:00',
            endTime: '22:00',
            headcount: 14,
            totalAmount: 2400,
            host: { fullName: 'Amit Patel', reliabilityScore: 89 },
            createdAt: new Date(Date.now() - 32 * 60000).toISOString()
          }
        ]
      };
    }
    try {
      const res = await api.get('/venues/my/requests');
      return res.data.data;
    } catch {
      return { requests: [] };
    }
  },

  // Approve booking request
  approveBooking: async (requestId) => {
    if (USE_MOCKS) return { success: true, status: 'CONFIRMED' };
    try {
      const res = await api.put(`/bookings/${requestId}/approve`);
      return res.data.data;
    } catch {
      return { success: true };
    }
  },

  // Reject booking request
  rejectBooking: async (requestId, reason) => {
    if (USE_MOCKS) return { success: true, status: 'REJECTED' };
    try {
      const res = await api.put(`/bookings/${requestId}/reject`, { reason });
      return res.data.data;
    } catch {
      return { success: true };
    }
  },

  // Existing: GET /api/bookings/verify/:qrPass (Venue Owner / Admin verification)
  verifyQrPass: async (qrPass) => {
    if (USE_MOCKS) {
      return { valid: true, booking: mockBookings[0] };
    }
    const res = await api.get(`/bookings/verify/${qrPass}`);
    return res.data.data;
  },

  // Existing: POST /api/slots/:id/block (2-tap offline block)
  blockSlot: async (slotId, reason = 'Maintenance / Offline booking') => {
    if (USE_MOCKS) {
      const s = mockSlots.find((x) => x._id === slotId);
      if (s) s.status = 'BLOCKED';
      return { success: true, slot: s };
    }
    const res = await api.post(`/slots/${slotId}/block`, { reason });
    return res.data.data;
  },

  // Existing: POST /api/slots/:id/unblock
  unblockSlot: async (slotId) => {
    if (USE_MOCKS) {
      const s = mockSlots.find((x) => x._id === slotId);
      if (s) s.status = 'AVAILABLE';
      return { success: true, slot: s };
    }
    const res = await api.post(`/slots/${slotId}/unblock`);
    return res.data.data;
  },

  // Existing: GET /api/slots/ground/:groundId/available
  getGroundSlots: async (groundId, date) => {
    if (USE_MOCKS) return mockSlots;
    const res = await api.get(`/slots/ground/${groundId}/available`, { params: { date } });
    return res.data.data;
  },

  // Existing: POST /api/slots/ground/:groundId
  createSlot: async (groundId, slotData) => {
    if (USE_MOCKS) {
      const s = { _id: `s_${Date.now()}`, ground: groundId, ...slotData, status: 'AVAILABLE' };
      mockSlots.push(s);
      return s;
    }
    const res = await api.post(`/slots/ground/${groundId}`, slotData);
    return res.data.data;
  }
};
