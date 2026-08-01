import api from './api';

const assignmentsService = {
  list: (params) => api.get('/assignments', { params }),
  create: (payload) => api.post('/assignments', payload),
  update: (id, payload) => api.patch(`/assignments/${id}`, payload),
  publish: (id) => api.patch(`/assignments/${id}/publish`),
  close: (id) => api.patch(`/assignments/${id}/close`),
  remove: (id) => api.delete(`/assignments/${id}`),
  submit: (id, formData) =>
    api.post(`/assignments/${id}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  submissions: (id, params) => api.get(`/assignments/${id}/submissions`, { params }),
  grade: (submissionId, payload) =>
    api.patch(`/assignments/submissions/${submissionId}/grade`, payload),
  mySubmissions: () => api.get('/assignments/my-submissions'),
};

export default assignmentsService;
