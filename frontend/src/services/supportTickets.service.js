import api from './api';

const supportTicketsService = {
  create: (payload) => api.post('/support-tickets', payload),
  list: (params) => api.get('/support-tickets', { params }),
  update: (id, payload) => api.patch(`/support-tickets/${id}`, payload),
};

export default supportTicketsService;
