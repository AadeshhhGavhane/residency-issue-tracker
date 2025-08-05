import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api', // Use relative path for proxy
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for handling FormData
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (formData: FormData) => api.post('/auth/register', formData),
  login: (credentials: { email: string; password: string }) => api.post('/auth/login', credentials),
  logout: () => api.get('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (formData: FormData) => api.put('/auth/profile', formData),
  deleteAccount: () => api.delete('/auth/account'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, newPassword: password }),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  resendVerification: (email: string) => api.post('/auth/resend-verification', { email }),
  sendMobileVerification: (phoneNumber: string) => api.post('/auth/send-mobile-verification', { phoneNumber }),
  verifyMobile: (token: string) => api.post('/auth/verify-mobile-public', { token })
};

// Issues API
export const issuesAPI = {
  getIssues: (params?: any) =>
    api.get('/issues', { params }),
  
  getAllIssues: (params?: any) =>
    api.get('/issues/admin/all', { params }),
  
  getIssue: (id: string) =>
    api.get(`/issues/${id}`),
  
  createIssue: (issueData: FormData) =>
    api.post('/issues', issueData),
  
  updateIssue: (id: string, data: any) =>
    api.put(`/issues/${id}`, data),
  
  deleteIssue: (id: string) =>
    api.delete(`/issues/${id}`),
  
  assignIssue: (issueId: string, data: any) =>
    api.post(`/issues/${issueId}/assign`, data),
  
  getAssignments: (params?: any) =>
    api.get('/assignments', { params }),
  
  getAssignment: (id: string) =>
    api.get(`/assignments/${id}`),
  
  updateAssignment: (id: string, action: string, data?: any) => {
    switch (action) {
      case 'accept':
        return api.post(`/assignments/${id}/accept`);
      case 'reject':
        return api.post(`/assignments/${id}/reject`, data);
      case 'start':
        return api.post(`/assignments/${id}/start`);
      case 'complete':
        return api.post(`/assignments/${id}/complete`, data);
      default:
        return api.post(`/assignments/${id}/${action}`, data);
    }
  },
  
  getTechnicians: (params?: any) =>
    api.get('/assignments/technicians', { params }),
  
  getAnalytics: (params?: any) =>
    api.get('/issues/analytics', { params }),
  
  getAssignmentAnalytics: (params?: any) =>
    api.get('/assignments/analytics', { params }),
};

// User API
export const userAPI = {
  getCurrentUser: () => api.get('/user/me'),
  updateProfile: (formData: FormData) => api.put('/user/me', formData),
  deleteAccount: () => api.delete('/user/me'),
  updateLanguage: (language: string) => api.put('/user/language', { language })
};

// Feedback API
export const feedbackAPI = {
  submitFeedback: (data: any) => api.post('/feedback', data),
  getTechnicianFeedback: (params?: any) => api.get('/feedback/technicians', { params })
};

// Recurring Alerts API
export const recurringAlertsAPI = {
  getRecurringAlerts: (params?: any) => api.get('/recurring-alerts', { params }),
  detectRecurringProblems: () => api.post('/recurring-alerts/detect')
};

export default api;