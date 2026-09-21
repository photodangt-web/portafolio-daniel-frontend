import { apiClient } from './client'

const resource = (name) => ({
  list: () => apiClient.get(`/admin/${name}`),
  create: (data) => apiClient.post(`/admin/${name}`, data),
  update: (id, data) => apiClient.patch(`/admin/${name}/${id}`, data),
  remove: (id) => apiClient.delete(`/admin/${name}/${id}`),
  reorder: (ids) => apiClient.patch(`/admin/${name}/order`, { ids }),
})

export const adminApi = {
  profile: {
    get: () => apiClient.get('/profile'),
    update: (data) => apiClient.patch('/admin/profile', data),
  },
  skills: resource('skills'),
  experience: resource('experience'),
  education: resource('education'),
  projects: resource('projects'),
  media: {
    list: () => apiClient.get('/admin/media'),
    get: (id) => apiClient.get(`/admin/media/${id}`),
    upload: (file, alt, onUploadProgress) => {
      const data = new FormData()
      data.append('file', file)
      if (alt) data.append('alt', alt)
      return apiClient.post('/admin/media', data, { onUploadProgress })
    },
    duplicate: (id) => apiClient.post(`/admin/media/${id}/duplicate`),
    remove: (id) => apiClient.delete(`/admin/media/${id}`),
  },
  sectionHeaders: {
    list: () => apiClient.get('/admin/section-headers'),
    update: (section, data) => apiClient.patch(`/admin/section-headers/${section}`, data),
  },
  leadFields: {
    list: () => apiClient.get('/admin/lead-form/fields'),
    create: (data) => apiClient.post('/admin/lead-form/fields', data),
    update: (id, data) => apiClient.patch(`/admin/lead-form/fields/${id}`, data),
    remove: (id) => apiClient.delete(`/admin/lead-form/fields/${id}`),
    reorder: (ids) => apiClient.patch('/admin/lead-form/fields/order', { ids }),
  },
  leads: {
    list: (params) => apiClient.get('/admin/leads', { params }),
    get: (id) => apiClient.get(`/admin/leads/${id}`),
    create: (data) => apiClient.post('/admin/leads', data),
    update: (id, data) => apiClient.patch(`/admin/leads/${id}`, data),
    remove: (id) => apiClient.delete(`/admin/leads/${id}`),
  },
  leadWebhooks: {
    list: () => apiClient.get('/admin/lead-webhooks'),
    create: (data) => apiClient.post('/admin/lead-webhooks', data),
    update: (id, data) => apiClient.patch(`/admin/lead-webhooks/${id}`, data),
    remove: (id) => apiClient.delete(`/admin/lead-webhooks/${id}`),
  },
  leadInboundWebhooks: {
    list: () => apiClient.get('/admin/lead-inbound-webhooks'),
    create: (data) => apiClient.post('/admin/lead-inbound-webhooks', data),
    update: (id, data) => apiClient.patch(`/admin/lead-inbound-webhooks/${id}`, data),
    remove: (id) => apiClient.delete(`/admin/lead-inbound-webhooks/${id}`),
  },
}
