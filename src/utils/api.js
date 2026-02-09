import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:8000'),
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(cfg=>{
  const token = localStorage.getItem('token')
  if(token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res,
  err => {
    const status = err?.response?.status
    if (status === 401) {
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// Servicios de catálogos
export const catalogService = {
  getPropertyTypes: () => api.get('/catalog/property-types'),
  getOperationTypes: () => api.get('/catalog/operation-types'),
  getMarketStatuses: () => api.get('/catalog/market-statuses'),
  getAmenities: () => api.get('/catalog/amenities'),
  getTags: () => api.get('/catalog/tags'),
  getProvinces: () => api.get('/catalog/provinces'),
  getCities: (province) => api.get(`/catalog/provinces/${province}/cities`),
  getNeighborhoods: (city) => api.get(`/catalog/cities/${city}/neighborhoods`)
}

export default api
