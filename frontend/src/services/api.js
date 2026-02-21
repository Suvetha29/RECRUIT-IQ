import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

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
  register: (userData) => api.post('/api/auth/register', userData),
  login: (credentials) => api.post('/api/auth/login', credentials),
};

// ================= JOBS =================

export const jobAPI = {
  createJob: (jobData) => api.post('/api/jobs/', jobData),
  getAllJobs: () => api.get('/api/jobs/'),
  getJobDetail: (jobId) => api.get(`/api/jobs/${jobId}`),
  updateJob: (jobId, jobData) => api.put(`/api/jobs/${jobId}/`, jobData),
  deleteJob: (jobId) => api.delete(`/api/jobs/${jobId}/`),
  toggleJobStatus: (jobId) => api.patch(`/api/jobs/${jobId}/status/`),
  generateJobDescription: (data) => api.post('/api/jobs/generate', data),
};

// ================= APPLICATIONS =================

export const applicationAPI = {
  // Candidate: apply for a job (multipart form with resume file)
  applyForJob: (formData) => api.post('/api/applications/apply', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Candidate: view all their applications + status + ATS score
  getMyApplications: () => api.get('/api/applications/my'),

  // HR: view all applicants for a specific job
  getJobApplicants: (jobId) => api.get(`/api/applications/job/${jobId}`),

  // HR: update application status (shortlist / reject / interview / hired)
  updateStatus: (applicationId, status) =>
    api.patch(`/api/applications/${applicationId}/status`, { status }),
};

export default api;
