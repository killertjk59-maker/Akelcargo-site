/**
 * routes/users.js — Профил, прогресс, таърих
 *
 *   GET   /api/user/profile
 *   PATCH /api/user/profile
 *   GET   /api/user/progress
 *   GET   /api/user/history?limit=&offset=
 *   GET   /api/user/level?subject=
 */
'use strict';

const express = require('express');
const H = require('../utils/helpers');
const db = require('../database/database');
const analytics = require('../services/analyticsService');
const ai = require('../services/aiService');

const router = express.Router();

router.use(function (req, res, next) {
  if (!req.user) return next(H.unauthorized('Барои ин саҳифа бояд ворид шавед'));
  next();
});

/* ---------- Профил ---------- */
router.get('/profile', function (req, res) {
  const levels = {};
  db.repos.subjectState.byUser(req.user.id).forEach((s) => { levels[s.subject] = s.level; });
  res.json({
    ok: true,
    user: H.publicUser(req.user),
    levels: levels,
    streak: analytics.streakDays(req.user.id),
    olympiads: db.repos.olympiad.byUser(req.user.id, 10)
  });
});

router.patch('/profile', function (req, res, next) {
  try {
    const patch = {};
    ['name', 'grade', 'city', 'lang'].forEach((k) => {
      if (req.body && req.body[k] !== undefined) {
        patch[k] = k === 'name' ? H.cleanString(req.body.name, 80) : H.cleanString(req.body[k], 60);
      }
    });
    H.assert(Object.keys(patch).length, 'Чизе барои навсозӣ фиристода нашуд');
    if (patch.name !== undefined && patch.name.length < 2) throw H.badRequest('Ном хеле кӯтоҳ аст');
    db.repos.users.update(req.user.id, patch);
    db.repos.users.touch(req.user.id);
    res.json({ ok: true, user: H.publicUser(db.repos.users.byId(req.user.id)) });
  } catch (e) { next(e); }
});

/* ---------- Прогресс ---------- */
router.get('/progress', function (req, res) {
  res.json({
    ok: true,
    progress: db.repos.progress.byUser(req.user.id),
    levels: db.repos.subjectState.byUser(req.user.id)
  });
});

/* ---------- Таърих ---------- */
router.get('/history', function (req, res) {
  const limit = H.cleanInt(req.query.limit, 30, 1, 100);
  const offset = H.cleanInt(req.query.offset, 0, 0, 10000);
  res.json({
    ok: true,
    total: db.repos.messages.countByUser(req.user.id),
    messages: db.repos.messages.byUser(req.user.id, limit, offset)
  });
});

/* ---------- Сатҳи ҳозираи фан ---------- */
router.get('/level', function (req, res) {
  const subject = ai.subjectOf(req.query.subject);
  const id = (subject && subject.id) || 'general';
  res.json({ ok: true, subject: id, level: analytics.currentLevel(req.user.id, id) });
});

/* ---------- Тоза кардани таърих ---------- */
router.delete('/history', function (req, res) {
  const rows = db.repos.messages.byUser(req.user.id, 1000, 0);
  rows.forEach((m) => db.repos.store().remove('messages', { id: m.id }));
  res.json({ ok: true, removed: rows.length });
});

module.exports = router;
