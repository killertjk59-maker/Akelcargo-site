const TOKEN_KEY = 'akel_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function req(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const t = getToken();
  if (t) headers.Authorization = 'Bearer ' + t;
  const res = await fetch(path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'error');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  health: () => req('/api/health'),
  settings: () => req('/api/settings'),
  requestOtp: (phone) => req('/api/auth/request-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (phone, code) => req('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code }) }),
  adminLogin: (phone, password) =>
    req('/api/auth/admin-login', { method: 'POST', body: JSON.stringify({ phone, password }) }),
  me: () => req('/api/me'),
  updateMe: (body) => req('/api/me', { method: 'PUT', body: JSON.stringify(body) }),
  changePhone: (body) => req('/api/me/phone', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => req('/api/logout', { method: 'POST', body: '{}' }),
  deleteMe: () => req('/api/me/delete', { method: 'POST', body: '{}' }),
  parcels: (q) => req('/api/parcels' + (q ? '?q=' + encodeURIComponent(q) : '')),
  parcel: (id) => req('/api/parcels/' + id),
  track: (code) => req('/api/track/' + encodeURIComponent(code)),
  news: () => req('/api/news'),
  notifications: () => req('/api/notifications'),
  readNotif: (id) => req('/api/notifications/read', { method: 'POST', body: JSON.stringify({ id }) }),
  lessons: () => req('/api/lessons'),
  stats: () => req('/api/stats'),
  calculate: (weight, volume) =>
    req('/api/calculate', { method: 'POST', body: JSON.stringify({ weight, volume }) }),
  bonuses: () => req('/api/bonuses'),
  admin: {
    overview: () => req('/api/admin/overview'),
    users: () => req('/api/admin/users'),
    saveUser: (id, body) => req('/api/admin/users/' + id, { method: 'PUT', body: JSON.stringify(body) }),
    delUser: (id) => req('/api/admin/users/' + id, { method: 'DELETE' }),
    parcels: (q) => req('/api/admin/parcels' + (q ? '?q=' + encodeURIComponent(q) : '')),
    addParcel: (body) => req('/api/admin/parcels', { method: 'POST', body: JSON.stringify(body) }),
    saveParcel: (id, body) => req('/api/admin/parcels/' + id, { method: 'PUT', body: JSON.stringify(body) }),
    delParcel: (id) => req('/api/admin/parcels/' + id, { method: 'DELETE' }),
    addNews: (body) => req('/api/admin/news', { method: 'POST', body: JSON.stringify(body) }),
    delNews: (id) => req('/api/admin/news/' + id, { method: 'DELETE' }),
    settings: (body) => req('/api/admin/settings', { method: 'PUT', body: JSON.stringify(body) }),
    addLesson: (body) => req('/api/admin/lessons', { method: 'POST', body: JSON.stringify(body) }),
    saveLesson: (id, body) => req('/api/admin/lessons/' + id, { method: 'PUT', body: JSON.stringify(body) }),
    delLesson: (id) => req('/api/admin/lessons/' + id, { method: 'DELETE' }),
    broadcast: (body) => req('/api/admin/broadcast', { method: 'POST', body: JSON.stringify(body) }),
    smsTest: (phone) => req('/api/admin/sms-test', { method: 'POST', body: JSON.stringify({ phone }) }),
    smsBalance: () => req('/api/admin/sms-balance'),
    upload: async (file) => {
      const fd = new FormData();
      fd.append('file', file);
      return req('/api/admin/upload', { method: 'POST', body: fd });
    }
  }
};
