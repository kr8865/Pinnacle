import api from './api';

const analyticsService = {
  dashboard: () => api.get('/analytics/dashboard'),
  graphs: (type, range) => api.get('/analytics/graphs', { params: { type, range } }),
};

export default analyticsService;
