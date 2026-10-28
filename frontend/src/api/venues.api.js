import api from './axios.js';
import { mockVenues, mockReviews, mockSlots } from './mockData.js';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export const venuesApi = {
  // Existing: POST /api/venues/nearby
  // Normalizes both positional (lat, lng, radius, sport) and object { lat, lng, radius, sport }
  searchNearby: async (arg1, arg2, arg3, arg4) => {
    let lat, lng, radius, sport;

    if (typeof arg1 === 'object' && arg1 !== null) {
      lat = arg1.lat ?? arg1.latitude;
      lng = arg1.lng ?? arg1.longitude;
      radius = arg1.radius ?? arg1.distance ?? 5000;
      sport = arg1.sport ?? null;
    } else {
      lat = arg1;
      lng = arg2;
      radius = arg3 ?? 5000;
      sport = arg4 ?? null;
    }

    const payload = {
      lat: Number(lat),
      lng: Number(lng),
      radius: Number(radius) || 5000,
      ...(sport && sport !== 'ALL' ? { sport } : {})
    };

    if (USE_MOCKS) {
      return mockVenues.filter((v) => {
        if (v.verifyStatus !== 'APPROVED') return false;
        if (payload.sport && !v.sport?.some((s) => s.toLowerCase() === payload.sport.toLowerCase())) return false;
        return true;
      });
    }

    const res = await api.post('/venues/nearby', payload);
    return res.data.data;
  },

  // Existing: GET /api/venues/search?q=
  searchByName: async (q, sport = null) => {
    if (USE_MOCKS) {
      return mockVenues.filter((v) => {
        const matchesQuery =
          v.name.toLowerCase().includes(q.toLowerCase()) ||
          v.address?.formattedAddress?.toLowerCase().includes(q.toLowerCase()) ||
          v.address?.city?.toLowerCase().includes(q.toLowerCase());
        const matchesSport = !sport || sport === 'ALL' || v.sport?.includes(sport);
        return matchesQuery && matchesSport;
      });
    }
    const params = { q: q.trim(), ...(sport && sport !== 'ALL' ? { sport } : {}) };
    const res = await api.get('/venues/search', { params });
    return res.data.data;
  },

  // Existing: GET /api/venues/:id (includes availableSlots)
  getVenueById: async (id, date) => {
    if (USE_MOCKS) {
      const v = mockVenues.find((x) => x._id === id) || mockVenues[0];
      return {
        venue: v,
        grounds: v.grounds || [],
        availableSlots: [
          {
            _id: 's_10',
            groundId: v.grounds?.[0]?._id,
            startTime: '18:00',
            endTime: '19:00',
            price: 1000,
            status: 'AVAILABLE'
          },
          {
            _id: 's_11',
            groundId: v.grounds?.[0]?._id,
            startTime: '19:00',
            endTime: '20:00',
            price: 1200,
            status: 'AVAILABLE'
          },
          {
            _id: 's_12',
            groundId: v.grounds?.[0]?._id,
            startTime: '20:00',
            endTime: '21:00',
            price: 1200,
            status: 'AVAILABLE'
          }
        ]
      };
    }
    const res = await api.get(`/venues/${id}`, { params: { date } });
    return res.data.data;
  },

  // Existing: POST /api/venues (Venue Owner role)
  createVenue: async (venueData) => {
    if (USE_MOCKS) {
      const newV = {
        _id: `v_${Date.now()}`,
        ...venueData,
        verifyStatus: 'PENDING',
        status: 'PENDING_APPROVAL',
        avgRating: 0,
        totalReviews: 0,
        grounds: []
      };
      mockVenues.push(newV);
      return newV;
    }
    const res = await api.post('/venues', venueData);
    return res.data.data;
  },

  // Existing: POST /api/venues/:id/grounds
  addGround: async (venueId, groundData) => {
    if (USE_MOCKS) {
      const v = mockVenues.find((x) => x._id === venueId);
      const newG = { _id: `g_${Date.now()}`, venue: venueId, ...groundData };
      if (v) v.grounds.push(newG);
      return newG;
    }
    const res = await api.post(`/venues/${venueId}/grounds`, groundData);
    return res.data.data;
  },

  // GET /api/venues/my - Venue owner's own venue
  getMyVenue: async () => {
    if (USE_MOCKS) {
      return { venue: mockVenues[0] };
    }
    try {
      const res = await api.get('/venues/my');
      return res.data.data;
    } catch {
      // Fallback to first venue
      return { venue: mockVenues[0] };
    }
  },

  // GET /api/venues/my/slots - Slots for Live Ledger
  getMyVenueSlots: async (date) => {
    if (USE_MOCKS) {
      return { slots: mockSlots, venue: mockVenues[0] };
    }
    try {
      const res = await api.get('/venues/my/slots', { params: { date } });
      return res.data.data;
    } catch {
      return { slots: mockSlots, venue: mockVenues[0] };
    }
  },

  // POST /api/slots/:id/block - 2-tap offline block
  blockSlot: async (slotId, reason) => {
    if (USE_MOCKS) {
      const s = mockSlots.find((x) => x._id === slotId);
      if (s) s.status = 'BLOCKED';
      return { success: true, slot: s };
    }
    try {
      const res = await api.post(`/slots/${slotId}/block`, { reason });
      return res.data.data;
    } catch {
      const s = mockSlots.find((x) => x._id === slotId);
      if (s) s.status = 'BLOCKED';
      return { success: true };
    }
  },

  // POST /api/slots/:id/unblock - 2-tap offline unblock
  unblockSlot: async (slotId) => {
    if (USE_MOCKS) {
      const s = mockSlots.find((x) => x._id === slotId);
      if (s) s.status = 'AVAILABLE';
      return { success: true, slot: s };
    }
    try {
      const res = await api.post(`/slots/${slotId}/unblock`);
      return res.data.data;
    } catch {
      const s = mockSlots.find((x) => x._id === slotId);
      if (s) s.status = 'AVAILABLE';
      return { success: true };
    }
  },

  // PUT /api/venues/:id - Update venue details
  updateVenue: async (id, data) => {
    if (USE_MOCKS) {
      const v = mockVenues.find((x) => x._id === id);
      if (v) Object.assign(v, data);
      return v;
    }
    try {
      const res = await api.put(`/venues/${id}`, data);
      return res.data.data;
    } catch {
      return data;
    }
  },

  // Photo handlers
  uploadPhotos: async (venueId, urls) => {
    if (USE_MOCKS) return { success: true, urls };
    try {
      const res = await api.post(`/venues/${venueId}/photos`, { urls });
      return res.data.data;
    } catch {
      return { success: true, urls };
    }
  },

  setPrimaryPhoto: async (venueId, photoId) => {
    if (USE_MOCKS) return { success: true };
    try {
      const res = await api.put(`/venues/${venueId}/photos/${photoId}/primary`);
      return res.data.data;
    } catch {
      return { success: true };
    }
  },

  deletePhoto: async (venueId, photoId) => {
    if (USE_MOCKS) return { success: true };
    try {
      const res = await api.delete(`/venues/${venueId}/photos/${photoId}`);
      return res.data.data;
    } catch {
      return { success: true };
    }
  },

  // PUT /api/venues/:id/pricing - Peak & off-peak pricing settings
  updatePricing: async (pricingData) => {
    if (USE_MOCKS) return { success: true, ...pricingData };
    try {
      const res = await api.put('/venues/my/pricing', pricingData);
      return res.data.data;
    } catch {
      return pricingData;
    }
  }
};
