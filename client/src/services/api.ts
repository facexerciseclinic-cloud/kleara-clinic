import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await api.post('/auth/refresh');
        if (res.data?.data?.token) {
          const newToken = res.data.data.token;
          localStorage.setItem('token', newToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          
          processQueue(null, newToken);
          isRefreshing = false;
          
          return api(originalRequest);
        }
        throw error;
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        
        // Clear auth and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Use setTimeout to prevent multiple redirects
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }, 100);
        
        return Promise.reject(err);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle API responses
export const handleApiResponse = <T>(response: any): T => {
  if (response.data.success) {
    return response.data.data;
  }
  throw new Error(response.data.message || 'API request failed');
};

// Auth API
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  
  getProfile: () => api.get('/auth/me'),
  
  updateProfile: (data: any) => api.put('/auth/profile', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
};

// Patients API
export const patientsAPI = {
  getAll: (params?: any) => api.get('/patients', { params }),
  
  getPatient: (id: string) => api.get(`/patients/${id}`),
  
  getPatientByHN: (hn: string) => api.get(`/patients/hn/${hn}`),
  
  createPatient: (data: any) => api.post('/patients', data),
  
  updatePatient: (id: string, data: any) => api.put(`/patients/${id}`, data),
  
  addTags: (id: string, tags: string[]) => api.post(`/patients/${id}/tags`, { tags }),
  
  removeTags: (id: string, tags: string[]) => api.delete(`/patients/${id}/tags`, { data: { tags } }),
  
  updateLoyaltyPoints: (id: string, points: number, action: 'add' | 'redeem') =>
    api.put(`/patients/${id}/loyalty-points`, { points, action }),
  
  deletePatient: (id: string) => api.delete(`/patients/${id}`),
};

// Appointments API
export const appointmentsAPI = {
  getAll: (params?: any) => api.get('/appointments', { params }),
  
  getByDateRange: (params: any) => api.get('/appointments/date-range', { params }),
  
  getAppointment: (id: string) => api.get(`/appointments/${id}`),
  
  create: (data: any) => api.post('/appointments', data),
  
  update: (id: string, data: any) => api.put(`/appointments/${id}`, data),
  
  delete: (id: string) => api.delete(`/appointments/${id}`),
  
  updateStatus: (id: string, status: string, reason?: string) =>
    api.put(`/appointments/${id}/status`, { status, reason }),
  
  checkAvailability: (params: any) => api.get('/appointments/availability/check', { params }),
};

// Treatments API
export const treatmentsAPI = {
  getAll: (params?: any) => api.get('/treatments', { params }),
  
  getTreatment: (id: string) => api.get(`/treatments/${id}`),
  
  create: (data: any) => api.post('/treatments', data),
  
  update: (id: string, data: any) => api.put(`/treatments/${id}`, data),
  
  delete: (id: string) => api.delete(`/treatments/${id}`),
  
  addPhotos: (id: string, type: string, photos: any[]) =>
    api.post(`/treatments/${id}/photos`, { type, photos }),
  
  updateStatus: (id: string, status: string) =>
    api.put(`/treatments/${id}/status`, { status }),
  
  getPatientTreatments: (patientId: string) => api.get(`/treatments/patient/${patientId}`),
};

// Services API
export const servicesAPI = {
  getAll: (params?: any) => api.get('/services', { params }),
  
  getService: (id: string) => api.get(`/services/${id}`),
  
  createService: (data: any) => api.post('/services', data),
  
  updateService: (id: string, data: any) => api.put(`/services/${id}`, data),
  
  deleteService: (id: string) => api.delete(`/services/${id}`),
  
  getCategories: () => api.get('/services/categories'),
};

// Products API  
export const productsAPI = {
  getAll: (params?: any) => api.get('/products', { params }),
  
  getProduct: (id: string) => api.get(`/products/${id}`),
  
  createProduct: (data: any) => api.post('/products', data),
  
  updateProduct: (id: string, data: any) => api.put(`/products/${id}`, data),
  
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
  
  getCategories: () => api.get('/products/categories'),
};

// Billing API
export const billingAPI = {
  getAll: (params?: any) => api.get('/billing', { params }),
  
  getBill: (id: string) => api.get(`/billing/${id}`),
  
  create: (data: any) => api.post('/billing', data),
  
  addPayment: (id: string, payment: any) => api.post(`/billing/${id}/payment`, payment),
  
  processRefund: (id: string, refund: any) => api.post(`/billing/${id}/refund`, refund),
  
  markAsPrinted: (id: string) => api.put(`/billing/${id}/print`),
  
  getDailyReport: (date?: string) => api.get('/billing/reports/daily', { params: { date } }),
};

// Inventory API
export const inventoryAPI = {
  getProducts: (params?: any) => api.get('/inventory/products', { params }),
  
  getProduct: (id: string) => api.get(`/inventory/products/${id}`),
  
  createProduct: (data: any) => api.post('/inventory/products', data),
  
  updateProduct: (id: string, data: any) => api.put(`/inventory/products/${id}`, data),
  
  stockIn: (id: string, data: any) => api.post(`/inventory/products/${id}/stock-in`, data),
  
  stockOut: (id: string, data: any) => api.post(`/inventory/products/${id}/stock-out`, data),
  
  getAlerts: () => api.get('/inventory/alerts'),
  
  updateLotStatus: (productId: string, lotId: string, status: string) =>
    api.put(`/inventory/lots/${productId}/${lotId}/status`, { status }),
};

// Staff API
export const staffAPI = {
  getStaff: (params?: any) => api.get('/staff', { params }),
  
  getStaffMember: (id: string) => api.get(`/staff/${id}`),
  
  updateStaff: (id: string, data: any) => api.put(`/staff/${id}`, data),
  
  updatePermissions: (id: string, permissions: any[]) =>
    api.put(`/staff/${id}/permissions`, { permissions }),
  
  updateStatus: (id: string, isActive: boolean) =>
    api.put(`/staff/${id}/status`, { isActive }),
  
  updateSchedule: (id: string, schedule: any) =>
    api.put(`/staff/${id}/schedule`, { schedule }),
  
  getAvailableDoctors: (params: any) => api.get('/staff/doctors/available', { params }),
  
  getPerformance: (id: string, params?: any) => api.get(`/staff/performance/${id}`, { params }),
};

// Reports API
export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  
  getSalesReport: (params?: any) => api.get('/reports/sales', { params }),
  
  getPatientsReport: (params?: any) => api.get('/reports/patients', { params }),
  
  getTreatmentsReport: (params?: any) => api.get('/reports/treatments', { params }),
  
  getInventoryReport: (params?: any) => api.get('/reports/inventory', { params }),
};

// Audit API
export const auditAPI = {
  // Get recent audit logs. limit default 50
  getRecent: (limit = 50) => api.get('/audit', { params: { limit } }),
};

// Integrations API
export const integrationsAPI = {
  sendLineMessage: (data: any) => api.post('/integrations/line/send-message', data),
  
  sendSMS: (data: any) => api.post('/integrations/sms/send', data),
  
  sendEmail: (data: any) => api.post('/integrations/email/send', data),
  
  processPayment: (data: any) => api.post('/integrations/payment/process', data),
  
  exportAccounting: (params: any) => api.get('/integrations/accounting/export', { params }),
  
  sendAppointmentReminder: (data: any) => api.post('/integrations/appointments/reminder', data),
};