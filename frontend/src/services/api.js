import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/'; 
// IMPORTANT: ending slash here

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ================= AUTH =================

export const authAPI = {
  register: (userData) => api.post('auth/register', userData),
  login: (credentials) => api.post('auth/login', credentials),
};

// ================= JOBS =================

export const jobAPI = {
  createJob: (jobData) => api.post('jobs/', jobData),

  getAllJobs: () => api.get('jobs/'),

  getJobDetail: (jobId) => api.get(`jobs/${jobId}/`),

  updateJob: (jobId, jobData) => api.put(`jobs/${jobId}/`, jobData),

  deleteJob: (jobId) => api.delete(`jobs/${jobId}/`),

  toggleJobStatus: (jobId) => api.patch(`jobs/${jobId}/status/`),

  generateJobDescription: (data) => api.post('jobs/generate/', data),
};

//-----------------------------------------------------


export default api;
