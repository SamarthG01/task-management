import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401, clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),

  // FastAPI OAuth2PasswordRequestForm expects form data (not JSON)
  login: (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
}

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectsAPI = {
  getAll: () => api.get('/projects/'),
  create: (data) => api.post('/projects/', data),
  getMembers: (projectId) => api.get(`/projects/${projectId}/members`),
  addMember: (projectId, data) => api.post(`/projects/${projectId}/members`, data),
  removeMember: (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`),
  getTasks: (projectId) => api.get(`/projects/${projectId}/tasks`),
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasksAPI = {
  create: (data) => api.post('/tasks/', data),
  getMyTasks: () => api.get('/tasks/my-tasks'),
  update: (taskId, data) => api.patch(`/tasks/${taskId}`, data),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  get: (projectId) => api.get(`/dashboard/${projectId}`),
}

export default api
