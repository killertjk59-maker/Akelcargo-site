/**
 * routes/auth.js — Саҳифаи даромад/пайвастшавӣ (Telegram Login + рамзи 6-рақама)
 *
 *   POST /api/auth/telegram   — верификацияи Telegram WebApp initData ё {id, username}
 *   POST /api/auth/code       — гирифтани рамзи пайвасткунӣ (рӯйи сайт дода мешавад)
 *   POST /api/auth/verify     — ворид шутан бо рамз (Website ↔ Telegram)
 *   GET  /api/auth/me         — маълумоти корбари ҳозира
 *   POST /api/auth/logout     — баромадан
 */
'use strict';

const express = require('express');
const H = require('../utils/helpers');
const db = require('../database/database');
const tg = require('../services/telegramService');
const log = require('../utils/logger');

const router = express.Router();

/* ---------- Созед ё гиред ---------- */
function upsertUser(data) {
  let user = db.repos.users.byTelegram(data.telegram_id);
  if (!user) user = db.repos.users.create(data);
  else db.repos.users.update(user.id, data);
  const session = db.repos.sessions.create(user.id, data.platform || 'web');
  db.repos.users.touch(user.id);
  return { user: db.repos.users.byId(user.id), session: session };
}

/* ---------- Telegram ---------- */
router.post('/telegram', function (req, res, next) {
  try {
    const body = req.body || {};

    if (!tg.isConfigured()) {
      throw H.badRequest('TELEGRAM_BOT_TOKEN дар .env гузошта нашудааст — воридшавӣ бо Telegram дастрас нест. Рамзи 6-рақамаро истифода баред.');
    }

    let tgData = null;
    if (body.initData) {
      const ok = H.verifyTelegramInitData(body.initData, process.env.TELEGRAM_BOT_TOKEN);
      H.assert(ok, 'Имзои Telegram нодуруст аст');
      const params = new URLSearchParams(body.initData);
      tgData = JSON.parse(params.get('user') || '{}');
    } else if (body.telegram_id || body.id) {
      tgData = {
        id: body.telegram_id || body.id,
        first_name: body.first_name || body.name,
        last_name: body.last_name,
        username: body.username
      };
    } else {
      throw H.badRequest('Маълумоти Telegram дархост нашудааст');
    }

    H.assert(tgData && tgData.id, 'Telegram ID ёфт нашуд');
    const r = upsertUser({
      telegram_id: String(tgData.id),
      username: tgData.username || '',
      name: [tgData.first_name, tgData.last_name].filter(Boolean).join(' ') || tgData.username || 'Донишҷӯ',
      platform: 'web'
    });
    log.info('Воридшавӣ тавассути Telegram: ' + r.user.name);
    res.json({
      ok: true,
      token: r.session.token,
      user: H.publicUser(r.user)
    });
  } catch (e) { next(e); }
});

/* ---------- Рамзи пайвасткунӣ ---------- */
router.post('/code', function (req, res, next) {
  try {
    let telegramId = req.body && req.body.telegram_id;
    if (req.user && req.user.telegram_id) telegramId = req.user.telegram_id;

    /* Агар корбари сайт ворид шуда бошад, рамз ба ҳисоби ӯ вобаста мешавад —
       дар бот /login <рамз> ҳисобҳоро пайваст мекунад. */
    if (!telegramId && req.user) {
      const row = db.repos.loginCodes.create(req.user.id, null);
      return res.json({
        ok: true,
        code: row.code,
        expiresIn: 600,
        hint: 'Дар боти Telegram: /login ' + row.code
      });
    }

    H.assert(telegramId, 'Telegram ID лозим аст');
    const code = db.repos.loginCodes.create(req.user ? req.user.id : null, String(telegramId));
    log.info('Рамзи пайвасткунӣ сохта шуд: ' + code.code);
    res.json({
      ok: true,
      code: code.code,
      expiresIn: 600,
      hint: 'Дар Telegram бот /login ' + code.code + '-ро фиристед'
    });
  } catch (e) { next(e); }
});

/* ---------- Ворид шутан бо рамз ---------- */
router.post('/verify', function (req, res, next) {
  try {
    H.requireFields(req.body, ['code']);
    const code = String(req.body.code).replace(/\D+/g, '').slice(0, 6);
    const row = db.repos.loginCodes.active(code);
    H.assert(row, 'Рамз нодуруст ё мӯҳлаташ гузаштааст');
    db.repos.loginCodes.consume(row.code);

    let user = null;
    if (row.telegram_id) user = db.repos.users.byTelegram(row.telegram_id);
    if (!user && row.user_id) user = db.repos.users.byId(row.user_id);
    if (!user) {
      user = db.repos.users.create({
        telegram_id: row.telegram_id || null,
        name: (req.body && req.body.name) || 'Донишҷӯ'
      });
    }
    if (row.telegram_id && String(user.telegram_id || '') !== String(row.telegram_id)) {
      db.repos.users.update(user.id, { telegram_id: String(row.telegram_id) });
    }

    const session = db.repos.sessions.create(user.id, 'web');
    db.repos.users.touch(user.id);
    log.info('Пайвасткунии Website ↔ Telegram анҷом ёфт: ' + user.name);
    res.json({ ok: true, token: session.token, user: H.publicUser(db.repos.users.byId(user.id)) });
  } catch (e) { next(e); }
});

/* ---------- Корбари ҳозира ---------- */
router.get('/me', function (req, res) {
  if (!req.user) return res.json({ ok: true, user: null, demo: true });
  res.json({
    ok: true,
    user: H.publicUser(req.user),
    telegramLinked: !!req.user.telegram_id,
    bot: tg.isConfigured() ? (process.env.TELEGRAM_BOT_USERNAME || '') : '',
    aiDemo: require('../services/aiService').isDemo()
  });
});

/* ---------- Баромадан ---------- */
router.post('/logout', function (req, res) {
  if (req.token) db.repos.sessions.remove(req.token);
  res.json({ ok: true });
});

module.exports = router;
