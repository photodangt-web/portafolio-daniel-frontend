import { apiClient } from './client'

export const portfolioApi = {
  getProfile: () => apiClient.get('/profile'),
  getSkills: () => apiClient.get('/skills'),
  getExperience: () => apiClient.get('/experience'),
  getProjects: () => apiClient.get('/projects'),
  getProject: (slug) => apiClient.get(`/projects/${slug}`),
  getSectionHeaders: () => apiClient.get('/section-headers'),
  getLeadFields: () => apiClient.get('/lead-form/fields'),
  submitLead: (data) => apiClient.post('/leads', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
}
