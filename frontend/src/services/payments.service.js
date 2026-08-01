import api from './api';

const paymentsService = {
  createOrder: (feeId) => api.post('/payments/create-order', { feeId }),
  verify: (payload) => api.post('/payments/verify', payload),
  approve: (id) => api.post(`/payments/${id}/approve`),
  reject: (id, reason) => api.post(`/payments/${id}/reject`, { reason }),
  history: () => api.get('/payments/history'),
  receipt: (id) => api.get(`/payments/${id}/receipt`),
};

export default paymentsService;
