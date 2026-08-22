const API_BASE = '/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP Error ${response.status}`);
  }
  return response.json();
}

// Auth API
export const apiAuth = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
};

// User API
export const apiUsers = {
  list: () => request('/users/'),
  getProfile: (userId) => request(`/users/${userId}`),
  getHeatmap: (userId) => request(`/users/${userId}/heatmap`),
  create: (data) => request('/users/', { method: 'POST', body: JSON.stringify(data) }),
};

// Group API
export const apiGroups = {
  list: () => request('/groups/'),
  create: (data) => request('/groups/', { method: 'POST', body: JSON.stringify(data) }),
  join: (data) => request('/groups/join', { method: 'POST', body: JSON.stringify(data) }),
};

// Messages API
export const apiMessages = {
  listGroupMessages: (groupId) => request(`/messages/group/${groupId}`),
  sendGroupMessage: (groupId, data) => request(`/messages/group/${groupId}`, { method: 'POST', body: JSON.stringify(data) }),
};

// Leaderboard API
export const apiLeaderboard = {
  get: (timeframe = 'all_time', groupId = null) => {
    let query = `?timeframe=${timeframe}`;
    if (groupId) query += `&group_id=${groupId}`;
    return request(`/leaderboard/${query}`);
  },
};

// Submissions API
export const apiSubmissions = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/submissions/${query ? `?${query}` : ''}`);
  },
};

// Notifications API
export const apiNotifications = {
  getUserFeed: (userId) => request(`/notifications/user/${userId}`),
  registerToken: (data) => request('/notifications/register-token', { method: 'POST', body: JSON.stringify(data) }),
};

// AI Insights API
export const apiAI = {
  getInsights: (userId, insightType = 'weak_topics') =>
    request(`/ai/insights/${userId}?insight_type=${insightType}`),
  refreshInsights: (userId, insightType = 'weak_topics') =>
    request(`/ai/insights/${userId}/refresh?insight_type=${insightType}`, { method: 'POST' }),
};

// Sync API
export const apiSync = {
  syncUser: (userId) => request(`/sync/user/${userId}`, { method: 'POST' }),
};
