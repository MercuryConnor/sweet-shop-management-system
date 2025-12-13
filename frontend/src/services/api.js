import axios from "axios"

/**
 * Axios API client with automatic token injection
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
})

/**
 * Add token to Authorization header before each request
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Handle response errors globally
 * If 401, token may be invalid/expired
 */
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state on 401
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      // Optionally dispatch event for AuthContext to update
      window.dispatchEvent(new Event("auth-logout"))
    }
    return Promise.reject(error)
  }
)

export default api
