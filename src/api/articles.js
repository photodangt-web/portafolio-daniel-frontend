import { apiClient } from './client'

export const articlesApi = {
  list: (params = {}) => apiClient.get('/articles', { params }),
  get: (slug) => apiClient.get(`/articles/${encodeURIComponent(slug)}`),
  view: (slug) => apiClient.post(`/articles/${encodeURIComponent(slug)}/view`, undefined, { headers: visitorHeaders() }),
  like: (slug) => apiClient.post(`/articles/${encodeURIComponent(slug)}/like`, undefined, { headers: visitorHeaders() }),
  share: (slug, network) => apiClient.post(`/articles/${encodeURIComponent(slug)}/share`, { network }, { headers: visitorHeaders() }),
  categories: () => apiClient.get('/categories'),
  tags: () => apiClient.get('/tags'),
}

const visitorKey = 'portfolio-visitor-id'

function createVisitorId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16)
  })
}

export function visitorHeaders() {
  try {
    let visitorId = localStorage.getItem(visitorKey)
    if (!visitorId) {
      visitorId = createVisitorId()
      localStorage.setItem(visitorKey, visitorId)
    }
    return { 'X-Visitor-Id': visitorId }
  } catch {
    return { 'X-Visitor-Id': createVisitorId() }
  }
}

export const adminArticlesApi = {
  list: (params = {}) => apiClient.get('/admin/articles', { params }),
  get: (id) => apiClient.get(`/admin/articles/${id}`),
  create: (data) => apiClient.post('/admin/articles', data),
  update: (id, data) => apiClient.patch(`/admin/articles/${id}`, data),
  remove: (id) => apiClient.delete(`/admin/articles/${id}`),
  categories: {
    list: () => apiClient.get('/admin/categories'),
    create: (data) => apiClient.post('/admin/categories', data),
    remove: (id) => apiClient.delete(`/admin/categories/${id}`),
  },
  tags: {
    list: () => apiClient.get('/admin/tags'),
    create: (data) => apiClient.post('/admin/tags', data),
    remove: (id) => apiClient.delete(`/admin/tags/${id}`),
  },
}

export function pageData(response) {
  if (Array.isArray(response)) return { items: response, page: 1, totalPages: 1, total: response.length }
  const items = response?.items || response?.articles || response?.data || []
  const meta = response?.meta || response?.pagination || response || {}
  return {
    items: Array.isArray(items) ? items : [],
    page: Number(meta.page || meta.currentPage || 1),
    totalPages: Number(meta.totalPages || Math.ceil((meta.total || items.length) / (meta.limit || items.length || 1)) || 1),
    total: Number(meta.total || meta.totalItems || items.length),
  }
}

export const idOf = (item) => item?.id || item?._id
