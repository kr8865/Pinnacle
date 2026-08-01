import api from './api';

const studentsService = {
  list: (params) => api.get('/students', { params }),
  get: (id) => api.get(`/students/${id}`),
  update: (id, payload) => api.patch(`/students/${id}`, payload),
  approve: (id) => api.patch(`/students/${id}/approve`),
  reject: (id, reason) => api.patch(`/students/${id}/reject`, { reason }),
  suspend: (id) => api.patch(`/students/${id}/suspend`),
  remove: (id) => api.delete(`/students/${id}`),
  bulkUpload: (formData) =>
    api.post('/students/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  bulkDelete: (ids) => api.post('/students/bulk-delete', { ids }),
  exportExcel: (params) => api.get('/students/export/excel', { params, responseType: 'blob' }),
  exportPdf: (params) => api.get('/students/export/pdf', { params, responseType: 'blob' }),
  documents: (id) => api.get(`/students/${id}/documents`),
  idCard: (id) => api.get(`/students/${id}/id-card`),
  verify: (studentId) => api.get(`/students/verify/${studentId}`),
};

export default studentsService;
