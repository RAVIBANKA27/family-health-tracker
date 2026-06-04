const BASE =
  import.meta.env.VITE_API_URL ||
  'https://family-health-tracker-production-dff9.up.railway.app/api';

function getToken() {
  return localStorage.getItem('health_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

async function upload(path, formData) {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload failed: ${res.status}`);
  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),

  // Members
  getMembers: () => request('/members'),
  addMember: (body) => request('/members', { method: 'POST', body: JSON.stringify(body) }),
  updateMember: (id, body) => request(`/members/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteMember: (id) => request(`/members/${id}`, { method: 'DELETE' }),

  // Reports
  getReports: (memberId) => request(`/reports/member/${memberId}`),
  getReport: (id) => request(`/reports/${id}`),
  uploadReport: (formData) => upload('/reports/upload', formData),
  deleteReport: (id) => request(`/reports/${id}`, { method: 'DELETE' }),

  // Shares
  createShare: (body) => request('/shares', { method: 'POST', body: JSON.stringify(body) }),
  getShares: () => request('/shares'),
  deleteShare: (id) => request(`/shares/${id}`, { method: 'DELETE' }),
  getSharedReport: (token) =>
  fetch(`${BASE}/shares/view/${token}`).then(r => r.json()),
};
