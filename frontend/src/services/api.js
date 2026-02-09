const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('datapulse_token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getProfile: () => request('/auth/me'),

  // Dashboards
  listDashboards: () => request('/dashboards'),
  createDashboard: (body) => request('/dashboards', { method: 'POST', body: JSON.stringify(body) }),
  getDashboard: (id) => request(`/dashboards/${encodeURIComponent(id)}`),
  updateDashboard: (id, body) => request(`/dashboards/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDashboard: (id) => request(`/dashboards/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Analytics
  ingestEvents: (events) => request('/analytics/events', { method: 'POST', body: JSON.stringify({ events }) }),
  queryAnalytics: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/analytics/query?${qs}`);
  },
  getInsights: () => request('/analytics/insights'),

  // Data Sources
  listDatasources: () => request('/datasources'),
  createDatasource: (body) => request('/datasources', { method: 'POST', body: JSON.stringify(body) }),
  deleteDatasource: (id) => request(`/datasources/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
