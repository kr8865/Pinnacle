import api from './api';

const coursesService = {
  list: (params) => api.get('/courses', { params }),
  get: (id) => api.get(`/courses/${id}`),
  create: (payload) => api.post('/courses', payload),
  update: (id, payload) => api.patch(`/courses/${id}`, payload),
  remove: (id) => api.delete(`/courses/${id}`),
  addChapter: (id, payload) => api.post(`/courses/${id}/chapters`, payload),
};

export default coursesService;
