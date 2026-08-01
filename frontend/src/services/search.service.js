import api from './api';

const searchService = {
  global: (q) => api.get('/search', { params: { q } }),
};

export default searchService;
