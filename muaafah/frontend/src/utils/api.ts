import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('muaafah_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('muaafah_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Lab Reports
export const labsApi = {
  upload: (formData: FormData) =>
    api.post('/labs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadDemo: () =>
    api.post('/labs/upload?use_demo=true'),
  getAll: () => api.get('/labs/'),
  getOne: (id: string) => api.get(`/labs/${id}`),
  getAnalysis: (id: string) => api.get(`/labs/${id}/analysis`),
};

// Providers
export const providersApi = {
  search: (params: {specialty?: string; insurance?: string; city?: string}) =>
    api.get('/providers/', { params }),
  getOne: (id: string) => api.get(`/providers/${id}`),
};

// Appointments
export const appointmentsApi = {
  book: (data: {
    provider_id: string;
    scheduled_date: string;
    scheduled_time: string;
    slot_id?: string;
    lab_report_id?: string;
    reason?: string;
  }) => api.post('/appointments/', data),
  getAll: () => api.get('/appointments/'),
  getUpcoming: () => api.get('/appointments/upcoming'),
  getOne: (id: string) => api.get(`/appointments/${id}`),
  cancel: (id: string, reason?: string) =>
    api.delete(`/appointments/${id}`, { params: { reason } }),
};

// Insurance
export const insuranceApi = {
  addPolicy: (data: object) => api.post('/insurance/policies', data),
  getPolicies: () => api.get('/insurance/policies'),
  verify: (id: string) => api.get(`/insurance/verify/${id}`),
  getNetworks: () => api.get('/insurance/networks'),
};

// Chat
export const chatApi = {
  sendMessage: (message: string, language: string, context?: string) =>
    api.post('/chat/', { message, language, report_context: context }),
};

// Admin
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: object) => api.get('/admin/users', { params }),
  suspendUser: (id: string) => api.put(`/admin/users/${id}/suspend`),
  activateUser: (id: string) => api.put(`/admin/users/${id}/activate`),
  getClinicalRules: () => api.get('/admin/clinical-rules'),
  getAnalytics: () => api.get('/admin/analytics'),
};
