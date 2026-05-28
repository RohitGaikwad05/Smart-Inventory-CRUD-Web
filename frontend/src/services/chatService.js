import api from './api';

export const chatService = {
  sendMessage: (message, sessionId, lang) => api.post('/chat/chat', { message, sessionId, lang }),
  clearChat: (sessionId) => api.post('/chat/clear', { sessionId })
};
