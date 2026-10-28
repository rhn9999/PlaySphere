import api from './axios.js';
import { mockReviews } from './mockData.js';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export const reviewsApi = {
  // Existing: POST /api/social/reviews (sportsmanship 1-5, skillRating 1-5, comment)
  createPlayerReview: async (reviewData) => {
    if (USE_MOCKS) {
      const newRev = { _id: `pr_${Date.now()}`, ...reviewData, reviewer: { fullName: 'You' }, createdAt: new Date().toISOString() };
      mockReviews.player.unshift(newRev);
      return { updatedReliabilityScore: 94, review: newRev };
    }
    const res = await api.post('/social/reviews', reviewData);
    return res.data.data;
  },

  // Alias for createPlayerReview
  submitPlayerReview: async (targetPlayerId, reviewData) => {
    return reviewsApi.createPlayerReview({
      targetPlayerId,
      ...reviewData
    });
  },

  // GET /api/players/:id/reviews - Peer reviews for a player
  getPlayerReviews: async (playerId) => {
    if (USE_MOCKS) return mockReviews.player;
    try {
      const res = await api.get(`/players/${playerId}/reviews`);
      return res.data.data;
    } catch {
      return mockReviews.player;
    }
  },

  // GET /api/venues/:id/reviews - Reviews for a venue
  getVenueReviews: async (venueId) => {
    if (USE_MOCKS) return { reviews: mockReviews.venue };
    try {
      const res = await api.get(`/venues/${venueId}/reviews`);
      return res.data.data;
    } catch {
      return { reviews: mockReviews.venue };
    }
  },

  // POST /api/venues/:id/reviews - Submit venue review
  submitVenueReview: async (venueId, reviewData) => {
    if (USE_MOCKS) {
      const newR = {
        _id: `vr_${Date.now()}`,
        ...reviewData,
        player: { fullName: 'You' },
        createdAt: new Date().toISOString()
      };
      mockReviews.venue.unshift(newR);
      return newR;
    }
    try {
      const res = await api.post(`/venues/${venueId}/reviews`, reviewData);
      return res.data.data;
    } catch {
      return reviewData;
    }
  }
};
