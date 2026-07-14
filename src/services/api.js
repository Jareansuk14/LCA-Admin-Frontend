import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  }
};

// Users API
export const usersAPI = {
  // Get all users
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Get user by ID
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create new user
  create: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update user
  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Reset HWID
  resetHwid: async (id) => {
    const response = await api.post(`/users/${id}/reset-hwid`);
    return response.data;
  },

  // Set account enabled/disabled (for LineAPIBot login)
  setEnabled: async (id, enabled) => {
    const response = await api.patch(`/users/${id}/enabled`, { enabled });
    return response.data;
  },

  // Set feature Farm (แสดง/ซ่อนปุ่ม "จัดการไลน์ไก่" ใน LineAPIBot)
  setFeatureFarm: async (id, enabled) => {
    const response = await api.patch(`/users/${id}/feature-farm`, { enabled });
    return response.data;
  },

  // Set feature Board (แสดง/ซ่อนปุ่ม "+เพิ่มบัญชี" ใน LineAPIBot)
  setFeatureBoard: async (id, enabled) => {
    const response = await api.patch(`/users/${id}/feature-board`, { enabled });
    return response.data;
  },

  // Set feature Local DATA (แสดง/ซ่อนปุ่มอัพโหลดไฟล์ Local ใน LineAPIBot)
  setFeatureLocalData: async (id, enabled) => {
    const response = await api.patch(`/users/${id}/feature-local-data`, { enabled });
    return response.data;
  },

  // Toggle shutdown command (set or cancel)
  toggleShutdown: async (id) => {
    const response = await api.post(`/users/${id}/shutdown`);
    return response.data;
  }
};

// Teams API
export const teamsAPI = {
  // Get all teams
  getAll: async () => {
    const response = await api.get('/teams');
    return response.data;
  },

  // Get team by ID
  getById: async (id) => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  // Create new team
  create: async (teamData) => {
    const response = await api.post('/teams', teamData);
    return response.data;
  },

  // Update team
  update: async (id, teamData) => {
    const response = await api.put(`/teams/${id}`, teamData);
    return response.data;
  },

  // Delete team
  delete: async (id) => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  }
};

// Stats API
export const statsAPI = {
  // Get daily stats
  getDaily: async (date) => {
    const params = date ? { date } : {};
    const response = await api.get('/stats/daily', { params });
    return response.data;
  },

  // Get stats history
  getHistory: async (startDate, endDate, userId) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (userId) params.userId = userId;
    const response = await api.get('/stats/history', { params });
    return response.data;
  },

  // Get summary stats
  getSummary: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/stats/summary', { params });
    return response.data;
  },

  // Get team summary for image generation
  getTeamSummary: async (date) => {
    const response = await api.get('/stats/team-summary', { params: { date } });
    return response.data;
  },

  // Get my stats (user's own stats)
  getMyStats: async (date) => {
    const params = date ? { date } : {};
    const response = await api.get('/stats/my-stats', { params });
    return response.data;
  }
};

// Health check API
export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  }
};

export const onlyDevAPI = {
  verify: async (password) => {
    const response = await api.post('/only-dev/verify', { password });
    return response.data;
  }
};

export const hookDataAPI = {
  getAll: async () => {
    const response = await api.get('/hook-data');
    return response.data;
  },

  download: async (id) => {
    const response = await api.get(`/hook-data/${id}/download`, { responseType: 'blob' });
    return response.data;
  }
};

// Phone Data API
export const phoneDataAPI = {
  // Get team members (for Head/Admin)
  getTeamMembers: async (teamId = null) => {
    const params = teamId ? { teamId } : {};
    const response = await api.get('/phone-data/team-members', { params });
    return response.data;
  },

  // Validate phone numbers
  validate: async (phoneNumbers) => {
    const response = await api.post('/phone-data/validate', { phoneNumbers });
    return response.data;
  },

  // Upload phone data to target user
  upload: async (targetUserId, phoneNumbers, fileName) => {
    const response = await api.post('/phone-data/upload', { targetUserId, phoneNumbers, fileName });
    return response.data;
  },

  // Get upload history for a user
  getHistory: async (userId) => {
    const response = await api.get(`/phone-data/history/${userId}`);
    return response.data;
  },

  // Get pending phone data (for LineAPIBot)
  getPending: async () => {
    const response = await api.get('/phone-data/pending');
    return response.data;
  },

  // Mark phone data as downloaded
  markDownloaded: async (id) => {
    const response = await api.post(`/phone-data/mark-downloaded/${id}`);
    return response.data;
  },

  // Delete phone data
  delete: async (id) => {
    const response = await api.delete(`/phone-data/${id}`);
    return response.data;
  }
};

export default api;
