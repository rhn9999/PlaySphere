import api from './axios.js';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

let localNotifications = [
  {
    _id: 'notif_1',
    title: 'Spot Open: Football Match!',
    message: 'Ahmedabad Techies Friday 7v7 Clash pinged players near Navrangpura. Tap to join!',
    read: false,
    timestamp: '10 mins ago',
    type: 'MATCH_PING'
  },
  {
    _id: 'notif_2',
    title: 'Join Request Accepted',
    message: 'Your join request for Badminton Doubles Clash was accepted by Sneha Joshi.',
    read: false,
    timestamp: '2 hours ago',
    type: 'JOIN_ACCEPTED'
  },
  {
    _id: 'notif_3',
    title: 'Booking Confirmed',
    message: 'Sardar Patel Field Alpha (7v7) slot is confirmed. Your QR pass is ready.',
    read: true,
    timestamp: 'Yesterday',
    type: 'BOOKING_CONFIRMED'
  }
];

export const notificationsApi = {
  // TODO backend: GET /api/notifications
  getNotifications: async () => {
    if (USE_MOCKS) return [...localNotifications];
    try {
      const res = await api.get('/notifications');
      return res.data.data;
    } catch {
      return [...localNotifications];
    }
  },

  // TODO backend: PATCH /api/notifications/:id/read
  markAsRead: async (id) => {
    const item = localNotifications.find((n) => n._id === id);
    if (item) item.read = true;
    if (!USE_MOCKS) {
      try {
        await api.patch(`/notifications/${id}/read`);
      } catch {}
    }
    return { success: true };
  },

  // TODO backend: PATCH /api/notifications/read-all
  markAllAsRead: async () => {
    localNotifications.forEach((n) => (n.read = true));
    if (!USE_MOCKS) {
      try {
        await api.patch('/notifications/read-all');
      } catch {}
    }
    return { success: true };
  }
};
