import api from './api';

const attendanceService = {
  mark: (payload) => api.post('/attendance/mark', payload),
  list: (params) => api.get('/attendance', { params }),
  summary: (studentId, params) => api.get(`/attendance/summary/${studentId}`, { params }),
};

export default attendanceService;
