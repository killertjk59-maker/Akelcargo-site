const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { get, persist, uid, hash } = require('./database');

const app = express();
const PORT = process.env.PORT || 5173;

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(cors());
app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg') || '.jpg';
    cb(null, Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

function digits(p) {
  return String(p || '').replace(/\D/g, '');
}

function normPhone(p) {
  let d = digits(p);
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 9) d = '992' + d;
  if (d.length === 12 && d.startsWith('992')) return d;
  return d;
}

function publicUser(u) {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
}

function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : req.query.token;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  const db = get();
  const row = db.tokens.find((t) => t.token === token);
  if (!row) return res.status(401).json({ error: 'unauthorized' });
  const user = db.users.find((u) => u.id === row.userId);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  req.user = user;
  req.token = token;
  next();
}

function adminOnly(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ error: 'admin_only' });
  next();
}

function issueToken(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  const db = get();
  db.tokens.push({ token, userId, createdAt: new Date().toISOString() });
  persist();
  return token;
}

function genCode() {
  return String(crypto.randomInt(1000, 10000));
}

// ---------- SMS (EasySendSMS REST API v1) ----------
const SMS_SEND_URL = 'https://restapi.easysendsms.app/v1/rest/sms/send';
const SMS_BALANCE_URL = 'https://restapi.easysendsms.app/v1/rest/sms/balance';

function smsConfig(settings) {
  const c = (settings && settings.sms) || {};
  return {
    apiKey: String(c.apiKey || process.env.EASYSENDSMS_API_KEY || '').trim(),
    from: String(c.from || process.env.EASYSENDSMS_FROM || 'Akelcargo').trim()
  };
}

async function easyFetch(url, options) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const resp = await fetch(url, { ...options, signal: ctrl.signal });
    const data = await resp.json().catch(() => ({}));
    return { resp, data };
  } finally {
    clearTimeout(timer);
  }
}

async function sendSms(phone, code, settings, customText) {
  const { apiKey, from } = smsConfig(settings);
  if (!apiKey) return { ok: false, error: 'sms_not_configured', detail: 'API key not set' };
  const to = normPhone(phone);
  const text = customText || `Akelcargo: рамзи воридшавӣ ${code}. 5 дақиқа амал мекунад.`;
  // type 0 = plain GSM text, type 1 = Unicode (Cyrillic etc.)
  const type = /[^\x00-\x7F]/.test(text) ? '1' : '0';
  try {
    const { resp, data } = await easyFetch(SMS_SEND_URL, {
      method: 'POST',
      headers: { apikey: apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ from, to, text, type })
    });
    const first = Array.isArray(data.messageIds) ? String(data.messageIds[0] || '') : '';
    const ok = resp.ok && data.status === 'OK' && first.startsWith('OK');
    if (ok) return { ok: true };
    const detail = data.description
      ? `${data.error}: ${data.description}`
      : first || `HTTP ${resp.status}`;
    console.error('EasySendSMS send failed:', detail);
    return { ok: false, error: 'sms_failed', detail };
  } catch (e) {
    console.error('EasySendSMS request error:', String(e));
    return { ok: false, error: 'sms_failed', detail: String(e) };
  }
}

// ---------- OTP protection (SMS costs money) ----------
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    hits.set(key, arr);
    return true;
  }
  arr.push(now);
  hits.set(key, arr);
  return false;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, arr] of hits) {
    const alive = arr.filter((t) => now - t < 3600 * 1000);
    if (alive.length) hits.set(k, alive);
    else hits.delete(k);
  }
}, 10 * 60 * 1000).unref();

function otpBlocked(req, phone) {
  return (
    limited('p1:' + phone, 1, 60 * 1000) ||
    limited('p5:' + phone, 5, 3600 * 1000) ||
    limited('ip:' + req.ip, 15, 3600 * 1000)
  );
}

function checkOtp(db, phone, code) {
  const otp = db.otps.find((o) => o.phone === phone);
  if (!otp || otp.expiresAt < Date.now()) return false;
  if (otp.code !== code) {
    otp.attempts = (otp.attempts || 0) + 1;
    if (otp.attempts >= 5) db.otps = db.otps.filter((o) => o.phone !== phone);
    persist();
    return false;
  }
  return true;
}

function publicSettings(db) {
  const s = { ...db.settings };
  const c = smsConfig(db.settings);
  s.sms = { configured: !!c.apiKey, from: c.from };
  delete s.whatsapp;
  return s;
}

function notify(userId, payload) {
  const db = get();
  db.notifications.unshift({
    id: uid(),
    userId,
    read: false,
    createdAt: new Date().toISOString(),
    ...payload
  });
}

function broadcast(payload) {
  const db = get();
  for (const u of db.users) {
    if (u.isAdmin) continue;
    notify(u.id, payload);
  }
}

function calcPrice(weight, volume, tariffs) {
  const w = Number(weight) || 0;
  const v = Number(volume) || 0;
  const volCost = v * (tariffs.perM3 || 240);
  let kgRate = tariffs.perKg || 2.5;
  const tier = (tariffs.tiers || []).find((t) => w >= t.min && w <= t.max);
  if (tier) kgRate = tier.usd;
  const wCost = w * kgRate;
  const used = wCost >= volCost ? 'weight' : 'volume';
  const usd = Math.max(wCost, volCost);
  const tjsRate = tier ? tier.tjs / (tier.usd || 1) : 10;
  return {
    usd: Math.round(usd * 100) / 100,
    tjs: Math.round(usd * tjsRate * 100) / 100,
    used,
    kgRate,
    perM3: tariffs.perM3
  };
}

function parcelPublic(p) {
  return p;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'Akelcargo' }));

app.get('/api/settings', (_req, res) => res.json(publicSettings(get())));

app.post('/api/auth/request-otp', async (req, res) => {
  const phone = normPhone(req.body.phone);
  if (!phone || phone.length < 11) {
    return res.status(400).json({ error: 'invalid_phone' });
  }
  if (otpBlocked(req, phone)) return res.status(429).json({ error: 'too_many_requests' });
  const db = get();
  const code = genCode();
  db.otps = db.otps.filter((o) => o.phone !== phone);
  db.otps.push({
    phone,
    code,
    attempts: 0,
    expiresAt: Date.now() + 5 * 60 * 1000
  });
  persist();
  const sent = await sendSms(phone, code, db.settings);
  if (!sent.ok) {
    db.otps = db.otps.filter((o) => o.phone !== phone);
    persist();
    return res.status(503).json({
      error: sent.error === 'sms_not_configured' ? 'sms_not_configured' : 'sms_failed'
    });
  }
  res.json({ ok: true });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const phone = normPhone(req.body.phone);
  const code = String(req.body.code || '').trim();
  const db = get();
  if (!checkOtp(db, phone, code)) {
    return res.status(400).json({ error: 'invalid_code' });
  }
  db.otps = db.otps.filter((o) => o.phone !== phone);
  let user = db.users.find((u) => u.phone === phone);
  if (!user) {
    user = {
      id: uid(),
      phone,
      name: 'Клиент',
      email: '',
      language: 'ru',
      theme: 'light',
      branchId: 'istaravshan',
      isAdmin: false,
      bonusPoints: 0,
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
  }
  persist();
  const token = issueToken(user.id);
  res.json({ token, user: publicUser(user) });
});

app.post('/api/auth/admin-login', (req, res) => {
  const phone = normPhone(req.body.phone);
  const password = String(req.body.password || '');
  const db = get();
  const user = db.users.find(
    (u) => u.isAdmin && (u.phone === phone || req.body.phone === 'admin')
  );
  const admin = user || db.users.find((u) => u.isAdmin);
  if (!admin || admin.passwordHash !== hash(password)) {
    return res.status(400).json({ error: 'invalid_credentials' });
  }
  const token = issueToken(admin.id);
  res.json({ token, user: publicUser(admin) });
});

app.get('/api/me', auth, (req, res) => res.json(publicUser(req.user)));

app.put('/api/me', auth, (req, res) => {
  const db = get();
  const u = db.users.find((x) => x.id === req.user.id);
  const allow = ['name', 'email', 'language', 'theme', 'branchId'];
  for (const k of allow) {
    if (req.body[k] !== undefined) u[k] = req.body[k];
  }
  persist();
  res.json(publicUser(u));
});

app.post('/api/me/phone', auth, async (req, res) => {
  const phone = normPhone(req.body.phone);
  const code = String(req.body.code || '').trim();
  const db = get();
  if (!code) {
    if (!phone || phone.length < 11) return res.status(400).json({ error: 'invalid_phone' });
    if (otpBlocked(req, phone)) return res.status(429).json({ error: 'too_many_requests' });
    const c = genCode();
    db.otps = db.otps.filter((o) => o.phone !== phone);
    db.otps.push({ phone, code: c, attempts: 0, expiresAt: Date.now() + 5 * 60 * 1000 });
    persist();
    const sent = await sendSms(phone, c, db.settings);
    if (!sent.ok) {
      db.otps = db.otps.filter((o) => o.phone !== phone);
      persist();
      return res.status(503).json({ error: sent.error === 'sms_not_configured' ? 'sms_not_configured' : 'sms_failed' });
    }
    return res.json({ ok: true });
  }
  if (!checkOtp(db, phone, code)) return res.status(400).json({ error: 'invalid_code' });
  const u = db.users.find((x) => x.id === req.user.id);
  u.phone = phone;
  db.otps = db.otps.filter((o) => o.phone !== phone);
  persist();
  res.json(publicUser(u));
});

app.post('/api/logout', auth, (req, res) => {
  const db = get();
  db.tokens = db.tokens.filter((t) => t.token !== req.token);
  persist();
  res.json({ ok: true });
});

app.post('/api/me/delete', auth, (req, res) => {
  const db = get();
  if (req.user.isAdmin) return res.status(400).json({ error: 'admin_locked' });
  db.users = db.users.filter((u) => u.id !== req.user.id);
  db.tokens = db.tokens.filter((t) => t.userId !== req.user.id);
  persist();
  res.json({ ok: true });
});

app.get('/api/parcels', auth, (req, res) => {
  const db = get();
  const q = String(req.query.q || '').toLowerCase();
  let list = db.parcels.filter((p) => p.userId === req.user.id || p.userPhone === req.user.phone);
  if (req.user.isAdmin && req.query.all === '1') list = db.parcels.slice();
  if (q) {
    list = list.filter(
      (p) =>
        p.trackCode.toLowerCase().includes(q) ||
        (p.title || '').toLowerCase().includes(q)
    );
  }
  list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  res.json(list.map(parcelPublic));
});

app.get('/api/parcels/:id', auth, (req, res) => {
  const db = get();
  const p = db.parcels.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'not_found' });
  if (!req.user.isAdmin && p.userId !== req.user.id && p.userPhone !== req.user.phone) {
    return res.status(403).json({ error: 'forbidden' });
  }
  res.json(p);
});

app.get('/api/track/:code', auth, (req, res) => {
  const db = get();
  const code = String(req.params.code || '').trim();
  const p = db.parcels.find(
    (x) => x.trackCode.toLowerCase() === code.toLowerCase()
  );
  if (!p) return res.status(404).json({ error: 'not_found' });
  if (!req.user.isAdmin && p.userId !== req.user.id && p.userPhone !== req.user.phone) {
    return res.status(404).json({ error: 'not_found' });
  }
  res.json(p);
});

app.get('/api/news', auth, (_req, res) => {
  res.json(get().news);
});

app.get('/api/notifications', auth, (req, res) => {
  const db = get();
  const list = db.notifications.filter((n) => n.userId === req.user.id);
  res.json(list);
});

app.post('/api/notifications/read', auth, (req, res) => {
  const db = get();
  const id = req.body.id;
  db.notifications.forEach((n) => {
    if (n.userId === req.user.id && (!id || n.id === id)) n.read = true;
  });
  persist();
  res.json({ ok: true });
});

app.get('/api/lessons', auth, (_req, res) => res.json(get().lessons));

app.get('/api/stats', auth, (req, res) => {
  const db = get();
  const list = req.user.isAdmin
    ? db.parcels
    : db.parcels.filter((p) => p.userId === req.user.id || p.userPhone === req.user.phone);
  const sum = (k) => list.reduce((a, p) => a + (Number(p[k]) || 0), 0);
  const by = (st) => list.filter((p) => p.status === st).length;
  res.json({
    count: list.length,
    weight: sum('weight'),
    volume: sum('volume'),
    amount: sum('price'),
    deliveries: list.filter((p) => p.status === 'received').length,
    warehouse: by('warehouse'),
    istaravshan: list.filter((p) => p.branch === 'istaravshan' && p.status === 'warehouse').length,
    nijoni: list.filter((p) => p.branch === 'nijoni' && p.status === 'warehouse').length,
    delivery: by('delivery'),
    received: by('received'),
    inTransit: by('in_transit'),
    accepted: by('accepted')
  });
});

app.post('/api/calculate', (req, res) => {
  const tariffs = get().settings.tariffs;
  res.json(calcPrice(req.body.weight, req.body.volume, tariffs));
});

app.get('/api/bonuses', auth, (req, res) => {
  res.json({ points: req.user.bonusPoints || 0, rulesRu: get().settings.bonusRulesRu, rulesTg: get().settings.bonusRulesTg });
});

/* ---------- ADMIN ---------- */

app.get('/api/admin/overview', auth, adminOnly, (_req, res) => {
  const db = get();
  res.json({
    users: db.users.filter((u) => !u.isAdmin).length,
    parcels: db.parcels.length,
    news: db.news.length,
    unread: db.notifications.filter((n) => !n.read).length
  });
});

app.get('/api/admin/users', auth, adminOnly, (_req, res) => {
  res.json(get().users.map(publicUser));
});

app.put('/api/admin/users/:id', auth, adminOnly, (req, res) => {
  const db = get();
  const u = db.users.find((x) => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: 'not_found' });
  const allow = ['name', 'email', 'isAdmin', 'bonusPoints', 'branchId', 'language'];
  for (const k of allow) if (req.body[k] !== undefined) u[k] = req.body[k];
  if (req.body.password) u.passwordHash = hash(req.body.password);
  persist();
  res.json(publicUser(u));
});

app.delete('/api/admin/users/:id', auth, adminOnly, (req, res) => {
  const db = get();
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'self' });
  db.users = db.users.filter((u) => u.id !== req.params.id);
  db.tokens = db.tokens.filter((t) => t.userId !== req.params.id);
  persist();
  res.json({ ok: true });
});

app.get('/api/admin/parcels', auth, adminOnly, (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  let list = get().parcels.slice();
  if (q) {
    list = list.filter(
      (p) =>
        p.trackCode.toLowerCase().includes(q) ||
        (p.userPhone || '').includes(q) ||
        (p.title || '').toLowerCase().includes(q)
    );
  }
  list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  res.json(list);
});

app.post('/api/admin/parcels', auth, adminOnly, (req, res) => {
  const db = get();
  const trackCode = String(req.body.trackCode || '').trim();
  if (!trackCode) return res.status(400).json({ error: 'track_required' });
  const phone = normPhone(req.body.userPhone);
  const owner = db.users.find((u) => u.phone === phone);
  const now = new Date().toISOString();
  const receivedDate = req.body.receivedDate || now.slice(0, 10);
  const status = req.body.status || 'accepted';
  const p = {
    id: uid(),
    trackCode,
    userPhone: phone,
    userId: owner?.id || null,
    status,
    branch: req.body.branch || 'istaravshan',
    receivedDate,
    weight: Number(req.body.weight) || 0,
    volume: Number(req.body.volume) || 0,
    price: Number(req.body.price) || 0,
    title: req.body.title || 'Посылка',
    comment: req.body.comment || '',
    history: [
      {
        status: 'accepted',
        date: receivedDate,
        noteRu: `Бор санаи ${receivedDate} қабул карда шуд`,
        noteTg: `Бор санаи ${receivedDate} қабул карда шуд`
      }
    ],
    createdAt: now,
    updatedAt: now
  };
  if (status !== 'accepted') {
    p.history.push({ status, date: now.slice(0, 10), noteRu: req.body.comment || '', noteTg: req.body.comment || '' });
  }
  db.parcels.unshift(p);
  if (owner) {
    notify(owner.id, {
      type: 'parcel',
      title: 'Посылка принята',
      body: `Трек ${trackCode}: бор санаи ${receivedDate} қабул карда шуд`,
      parcelId: p.id
    });
  }
  persist();
  res.json(p);
});

app.put('/api/admin/parcels/:id', auth, adminOnly, (req, res) => {
  const db = get();
  const p = db.parcels.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'not_found' });
  const prev = p.status;
  const fields = ['trackCode', 'status', 'receivedDate', 'weight', 'volume', 'price', 'title', 'comment', 'branch'];
  for (const k of fields) if (req.body[k] !== undefined) p[k] = req.body[k];
  if (req.body.userPhone) {
    p.userPhone = normPhone(req.body.userPhone);
    const owner = db.users.find((u) => u.phone === p.userPhone);
    p.userId = owner?.id || p.userId;
  }
  if (req.body.status && req.body.status !== prev) {
    p.history = p.history || [];
    p.history.push({
      status: p.status,
      date: new Date().toISOString().slice(0, 10),
      noteRu: req.body.note || '',
      noteTg: req.body.note || ''
    });
    const owner = db.users.find((u) => u.id === p.userId || u.phone === p.userPhone);
    if (owner) {
      notify(owner.id, {
        type: 'parcel',
        title: 'Статус посылки обновлён',
        body: `${p.trackCode}: ${p.status}`,
        parcelId: p.id
      });
    }
  }
  p.updatedAt = new Date().toISOString();
  persist();
  res.json(p);
});

app.delete('/api/admin/parcels/:id', auth, adminOnly, (req, res) => {
  const db = get();
  db.parcels = db.parcels.filter((p) => p.id !== req.params.id);
  persist();
  res.json({ ok: true });
});

app.post('/api/admin/news', auth, adminOnly, (req, res) => {
  const db = get();
  const item = {
    id: uid(),
    title: req.body.title || '',
    body: req.body.body || '',
    createdAt: new Date().toISOString()
  };
  db.news.unshift(item);
  broadcast({ type: 'news', title: item.title, body: item.body });
  persist();
  res.json(item);
});

app.delete('/api/admin/news/:id', auth, adminOnly, (req, res) => {
  const db = get();
  db.news = db.news.filter((n) => n.id !== req.params.id);
  persist();
  res.json({ ok: true });
});

app.put('/api/admin/settings', auth, adminOnly, (req, res) => {
  const db = get();
  const incoming = { ...(req.body || {}) };
  if (incoming.sms) {
    incoming.sms = { ...incoming.sms };
    // empty / masked key = keep the stored one
    if (!incoming.sms.apiKey || /^\*+$/.test(incoming.sms.apiKey)) delete incoming.sms.apiKey;
    delete incoming.sms.configured;
  }
  delete incoming.whatsapp;
  db.settings = deepMerge(db.settings, incoming);
  persist();
  res.json(publicSettings(db));
});

app.post('/api/admin/sms-test', auth, adminOnly, async (req, res) => {
  const phone = normPhone(req.body.phone);
  if (!phone || phone.length < 11) return res.status(400).json({ error: 'invalid_phone' });
  const r = await sendSms(phone, '', get().settings, 'Akelcargo: SMS кор мекунад. Тест бомуваффақият!');
  res.json({ ok: r.ok, error: r.ok ? '' : r.detail });
});

app.get('/api/admin/sms-balance', auth, adminOnly, async (_req, res) => {
  const { apiKey } = smsConfig(get().settings);
  if (!apiKey) return res.json({ ok: false, error: 'API key not set' });
  try {
    const { resp, data } = await easyFetch(SMS_BALANCE_URL, {
      method: 'POST',
      headers: { APIKEY: apiKey }
    });
    if (resp.ok && data.balance !== undefined) return res.json({ ok: true, balance: data.balance });
    res.json({ ok: false, error: data.description ? `${data.error}: ${data.description}` : `HTTP ${resp.status}` });
  } catch (e) {
    res.json({ ok: false, error: String(e) });
  }
});

app.post('/api/admin/lessons', auth, adminOnly, (req, res) => {
  const db = get();
  const item = {
    id: uid(),
    course: req.body.course || 'Pinduoduo',
    title: req.body.title || '',
    duration: req.body.duration || '0:00',
    youtubeId: req.body.youtubeId || '',
    description: req.body.description || '',
    createdAt: new Date().toISOString()
  };
  db.lessons.unshift(item);
  persist();
  res.json(item);
});

app.put('/api/admin/lessons/:id', auth, adminOnly, (req, res) => {
  const db = get();
  const item = db.lessons.find((x) => x.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'not_found' });
  Object.assign(item, req.body, { id: item.id });
  persist();
  res.json(item);
});

app.delete('/api/admin/lessons/:id', auth, adminOnly, (req, res) => {
  const db = get();
  db.lessons = db.lessons.filter((x) => x.id !== req.params.id);
  persist();
  res.json({ ok: true });
});

app.post('/api/admin/upload', auth, adminOnly, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file' });
  res.json({ url: '/uploads/' + req.file.filename });
});

app.post('/api/admin/broadcast', auth, adminOnly, (req, res) => {
  broadcast({
    type: 'news',
    title: req.body.title || 'Хабар',
    body: req.body.body || ''
  });
  persist();
  res.json({ ok: true, users: get().users.filter((u) => !u.isAdmin).length });
});

function deepMerge(a, b) {
  if (Array.isArray(b)) return b;
  if (b && typeof b === 'object') {
    const out = { ...(a || {}) };
    for (const k of Object.keys(b)) out[k] = deepMerge(a ? a[k] : undefined, b[k]);
    return out;
  }
  return b;
}

const dist = path.join(__dirname, 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log('Akelcargo API on http://0.0.0.0:' + PORT);
});
