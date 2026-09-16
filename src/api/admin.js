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
}
