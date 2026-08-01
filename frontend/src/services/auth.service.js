import api from './api';

const authService = {
  register: (formData) =>
    api.post('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  login: (payload) => api.post('/auth/login', payload),

  adminLogin: (payload) => api.post('/auth/admin-login', payload),

  refresh: () => api.post('/auth/refresh'),

  logout: () => api.post('/auth/logout'),

  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),

  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),

  changePassword: (payload) => api.post('/auth/change-password', payload),

  me: () => api.get('/auth/me'),
};

export default authService;
