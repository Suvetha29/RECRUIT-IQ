import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
};

export const jobAPI = {
  createJob: (jobData) => api.post('/jobs', jobData),
  getAllJobs: (status = 'open') => api.get(`/jobs?status=${status}`),
  getJobDetail: (jobId) => api.get(`/jobs/${jobId}`),
  updateJob: (jobId, jobData) => api.put(`/jobs/${jobId}`, jobData),
  deleteJob: (jobId) => api.delete(`/jobs/${jobId}`),
  toggleJobStatus: (jobId) => api.patch(`/jobs/${jobId}/status`),
  generateJobDescription: (data) => api.post('/jobs/generate', data),
};

export default api;