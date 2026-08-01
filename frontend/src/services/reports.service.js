import api from './api';

const reportsService = {
  export: (type, format) =>
    api.get(`/reports/${type}/export`, { params: { format }, responseType: 'blob' }),
};

export default reportsService;
