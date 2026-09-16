import { apiClient } from './client'

export const analyticsApi = {
  track: (events) => apiClient.post('/analytics/events', { events }, { skipAuthRefresh: true }),
  heartbeat: (event) => apiClient.post('/analytics/heartbeat', event, { skipAuthRefresh: true }),
  overview: (params) => apiClient.get('/admin/analytics/overview', { params }),
  timeseries: (params) => apiClient.get('/admin/analytics/timeseries', { params }),
  breakdown: (params) => apiClient.get('/admin/analytics/breakdowns', { params }),
  active: () => apiClient.get('/admin/analytics/active'),
  events: (params) => apiClient.get('/admin/analytics/events', { params }),
  sessions: (params) => apiClient.get('/admin/analytics/sessions', { params }),
}
