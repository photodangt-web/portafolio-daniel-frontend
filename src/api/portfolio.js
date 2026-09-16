import { apiClient } from './client'

export const portfolioApi = {
  getProfile: () => apiClient.get('/profile'),
  getSkills: () => apiClient.get('/skills'),
  getExperience: () => apiClient.get('/experience'),
  getProjects: () => apiClient.get('/projects'),
}
