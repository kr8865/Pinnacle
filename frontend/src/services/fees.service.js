import api from './api';

const feesService = {
  generate: (payload) => api.post('/fees/generate', payload),
  due: () => api.get('/fees/due'),
  list: (params) => api.get('/fees', { params }),
  revenueReport: (params) => api.get('/fees/reports/revenue', { params }),
};

export default feesService;
