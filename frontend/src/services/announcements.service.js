import api from './api';

const announcementsService = {
  list: (params) => api.get('/announcements', { params }),
  create: (payload) => api.post('/announcements', payload),
  update: (id, payload) => api.patch(`/announcements/${id}`, payload),
  remove: (id) => api.delete(`/announcements/${id}`),
};

export default announcementsService;
