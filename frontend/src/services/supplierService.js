import api from './api';

export const supplierService = {
  getAll: async () => {
    return await api.get('/suppliers');
  },
  create: async (data) => {
    return await api.post('/suppliers', data);
  },
  update: async (id, data) => {
    return await api.put(`/suppliers/${id}`, data);
  },
  delete: async (id) => {
    return await api.delete(`/suppliers/${id}`);
  }
};
