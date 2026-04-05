const rawBaseUrl = import.meta.env.VITE_API_BASE_URL|| 'http://localhost:5000/api'

export const API_BASE_URL = rawBaseUrl.replace(/\/$/, '')

export const apiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}
