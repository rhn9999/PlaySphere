import api from './axios.js';
import { mockReports } from './mockData.js';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export const reportsApi = {
  // Existing: POST /api/admin/reports (authenticated player or user)
  fileReport: async (reportData) => {
    if (USE_MOCKS) {
      const rep = { _id: `rep_${Date.now()}`, ...reportData, status: 'PENDING', createdAt: new Date().toISOString() };
      mockReports.push(rep);
      return rep;
    }
    const res = await api.post('/admin/reports', reportData);
    return res.data.data;
  },

  // Alias for fileReport
  submitReport: async (reportData) => {
    return reportsApi.fileReport(reportData);
  },

  // Existing: GET /api/admin/reports (admin)
  listReports: async () => {
    if (USE_MOCKS) return mockReports;
    const res = await api.get('/admin/reports');
    return res.data.data;
  },

  // Existing: PATCH /api/admin/reports/:id/resolve (admin)
  resolveReport: async (id, status, notes = '') => {
    if (USE_MOCKS) {
      const r = mockReports.find((x) => x._id === id);
      if (r) r.status = status;
      return { success: true };
    }
    const res = await api.patch(`/admin/reports/${id}/resolve`, { status, notes });
    return res.data.data;
  },

  // Existing: POST /api/admin/users/:id/ban (admin)
  banUser: async (userId, reason = 'Administrative sanction', durationDays = null) => {
    if (USE_MOCKS) return { success: true, isBanned: true };
    const res = await api.post(`/admin/users/${userId}/ban`, { reason, durationDays });
    return res.data.data;
  }
};
