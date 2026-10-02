/**
 * server.js — Сервери ягонаи DONO AI (Express)
 *
 * ҲАМЧУН як backend барои Website ва Telegram Bot хидмат мекунад:
 *   • REST API  → /api/*
 *   • Сайт      → public/ (HTML/CSS/JS, mobile-first)
 *   • Webhook   → /telegram/webhook (бо санҷиши signature)
 *
 * Оғоз: npm install && npm start
 */
'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const H = require('./utils/helpers');
const log = require('./utils/logger');
const db = require('./database/database');
const aiService = require('./services/aiService');
const analytics = require('./services/analyticsService');
const tg = require('./services/telegramService');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

/* ================= АМНИЯТ ================= */

app.use(helmet({
  contentSecurityPolicy: false, // HTML-и дохилӣ (inline CSS/JS) бояд кор кунад
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: function (origin, cb) {
    /* дар Telegram WebApp ё приложение origin мавҷуд нест */
    if (!origin || origin === 'null') return cb(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
    if ((process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || '').split(',')
      .map((s) => s.trim()).filter(Boolean).includes(origin)) return cb(null, true);
    if (/\.(railway\.app|github\.io|vercel\.app|netlify\.app)$/.test(origin)) return cb(null, true);
    return cb(null, true); // платформаи кушода, AI-и берунӣ нест
  },
  credentials: false
}));

app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

/* Маҳдудияти дархостҳо */
const RATE_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const apiLimiter = rateLimit({
  windowMs: RATE_WINDOW,
  max: parseInt(process.env.RATE_LIMIT_MAX || process.env.RATE_LIMIT_PER_MIN || '120', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Дархостҳо хеле зиёд буданд. Каме интизор шавед.' }
});
const aiLimiter = rateLimit({
  windowMs: RATE_WINDOW,
  max: parseInt(process.env.AI_RATE_LIMIT_PER_MIN || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Шумо хеле савол зиёд додед. Каме сипас савол диҳед.' }
});
app.use('/api/', apiLimiter);
app.use('/api/ai/', aiLimiter);

/* ================= КОРБАР (Bearer token ё X-Device-Id) ================= */

function resolveUser(req, _res, next) {
  try {
    const auth = String(req.headers.authorization || '');
    let user = null;

    if (/^Bearer\s+\S+/i.test(auth)) {
      const tk = auth.replace(/^Bearer\s+/i, '').trim();
      const s = db.repos.sessions.byToken(tk);
      user = s ? db.repos.users.byId(s.user_id) : db.repos.users.byToken(tk);
    }
    if (!user && req.headers['x-device-id']) {
      const device = H.cleanString(req.headers['x-device-id'], 80);
      const deviceToken = 'dev:' + device;
      user = db.repos.users.byToken(deviceToken);
      if (!user) user = db.repos.users.create({ token: deviceToken, name: 'Меҳмон' });
    }
    req.user = user;
    req.token = user ? user.token : null;
    next();
  } catch (e) {
    log.error('resolveUser: ' + e.message);
    req.user = null;
    next();
  }
}
app.use('/api/', resolveUser);

/* ================= САЛОМАТӢ ================= */

function health(req, res) {
  res.json({
    ok: true,
    service: 'dono-ai',
    time: new Date().toISOString(),
    db: db.driver(),
    ai: aiService.isDemo() ? 'demo' : 'openai',
    model: aiService.model,
    telegram: tg.isConfigured()
  });
}

/* ================= САЛОМАТӢ ================= */

app.get('/health', health);
app.get('/api/health', health);

/* ================= API ================= */

app.use('/api/ai', require('./routes/ai'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/users'));
app.use('/api/statistics', require('./routes/statistics'));

/* Тести зуд: ба OpenAI бе API-key ҳам низом кор мекунад (реҷаи demo) */
app.get('/api/status', function (req, res) {
  res.json({
    ok: true,
    demo: aiService.isDemo(),
    model: aiService.model,
    subjects: aiService.subjectList(),
    db: db.driver(),
    users: db.repos.users.count(),
    telegram: { configured: tg.isConfigured(), commands: botCommandList() }
  });
});

/* ================= TELEGRAM WEBHOOK ================= */

app.post('/telegram/webhook', async function (req, res) {
  try {
    if (process.env.TELEGRAM_WEBHOOK_SECRET) {
      const got = String(req.headers['x-telegram-bot-api-secret-token'] || '');
      if (got !== process.env.TELEGRAM_WEBHOOK_SECRET) {
        return res.status(403).json({ ok: false, error: 'Signature нодуруст аст' });
      }
    }
    const update = req.body;
    if (!update || typeof update !== 'object') return res.sendStatus(400);
    /* ҳар WEBHOOK мебошад: ҷавоб зуд, кор дар фона */
    setImmediate(function () {
      tg.handleUpdate(update).catch(function (e) { log.error('webhook: ' + e.message); });
    });
    res.sendStatus(200);
  } catch (e) {
    log.error('webhook: ' + e.message);
    res.sendStatus(500);
  }
});

app.get('/telegram/webhook', function (req, res) {
  res.json({ ok: true, bot: tg.isConfigured(), commands: botCommandList() });
});

/** Рӯйхати фармонҳои бот дар шакли ҳамвор */
function botCommandList() {
  return (tg.commands || []).map((c) => '/' + c.cmd + ' — ' + c.desc);
}

/* ================= САЙТ ================= */

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir, { maxAge: '1h', extensions: ['html'] }));

/* SPA: ҳар роҳи номаълум → index.html */
app.get(/^\/(?!api\/|telegram\/|health).*/, function (req, res, next) {
  res.sendFile(path.join(publicDir, 'index.html'), function (err) {
    if (err) next(err);
  });
});

/* ================= ХАТОҲО ================= */

app.use(function (req, res) {
  res.status(404).json({ ok: false, error: 'Роҳ ёфт нашуд: ' + req.method + ' ' + req.originalUrl });
});

/* eslint-disable no-unused-vars */
app.use(function (err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const isHttp = status < 500;
  if (!isHttp) log.error(err.stack || err.message);
  res.status(status).json({
    ok: false,
    error: isHttp ? err.message : 'Хатогии дохилӣ. Дубора кӯшиш кунед.',
    code: err.code || 'error'
  });
});
/* eslint-enable no-unused-vars */

/* ================= ОҒОЗ ================= */

function start() {
  db.init().then(function () {
    const port = parseInt(process.env.PORT || '3000', 10);
    app.listen(port, '0.0.0.0', function () {
      log.info('═══════════════════════════════════════');
      log.info(' DONO AI оғоз ёфт → http://localhost:' + port);
      log.info(' Пойгоҳи додаҳо: ' + db.driver());
      log.info(' AI: ' + (aiService.isDemo() ? 'реҷаи demo (бе OpenAI key)' : aiService.model));
      log.info(' Telegram Bot: ' + (tg.isConfigured() ? 'фаъол' : 'танзим нашуда'));
      log.info('═══════════════════════════════════════');
    });
  }).catch(function (e) {
    log.error('Пойгоҳи додаҳо оғоз нашуд: ' + e.message);
    process.exit(1);
  });
}

if (require.main === module) start();

module.exports = { app: app, start: start };
