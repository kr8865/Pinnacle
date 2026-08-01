import api from './api';

const messagesService = {
  thread: (withUserId) => api.get(`/messages/${withUserId}`),
  send: (payload) => api.post('/messages', payload),
};

export default messagesService;
