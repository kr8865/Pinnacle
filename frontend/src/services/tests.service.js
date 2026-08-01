import api from './api';

const testsService = {
  list: (params) => api.get('/tests', { params }),
  create: (payload) => api.post('/tests', payload),
  start: (id) => api.post(`/tests/${id}/start`),
  submit: (id, payload) => api.post(`/tests/${id}/submit`, payload),
  leaderboard: (id) => api.get(`/tests/${id}/leaderboard`),
  myResults: () => api.get('/results/my'),
  studentResults: (studentId) => api.get(`/results/${studentId}`),
};

export default testsService;
