import api from './api';

const studyMaterialsService = {
  list: (params) => api.get('/study-materials', { params }),
  create: (formData) =>
    api.post('/study-materials', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  remove: (id) => api.delete(`/study-materials/${id}`),
  toggleBookmark: (id) => api.post(`/study-materials/${id}/bookmark`),
  bookmarked: () => api.get('/study-materials/bookmarked'),
};

export default studyMaterialsService;
