/**
 * routes/statistics.js — Статистикаи хонанда ва умумӣ
 *
 *   GET /api/statistics/me     — dashboard-и худи хонанда
 *   GET /api/statistics/global — статистикаи умумӣ (кӯдак: бе маҳдудият)
 *   GET /api/statistics/streak — силсилаи рӯзҳои фаъол
 */
'use strict';

const express = require('express');
const H = require('../utils/helpers');
const analytics = require('../services/analyticsService');
const db = require('../database/database');

const router = express.Router();

/** Dashboard ҳатмист, ки корбар маълум бошад */
function needUser(req, res, next) {
  if (!req.user) return next(H.unauthorized('Барои статистика бояд ворид шавед'));
  next();
}

/* ---------- Dashboard-и ман ---------- */
router.get('/me', needUser, function (req, res) {
  const s = analytics.summary(req.user.id);
  res.json({
    ok: true,
    knowledge: s.overall,
    subjects: s.subjects,
    weakTopics: s.weakTopics,
    strongTopics: s.strongTopics,
    recommendations: s.recommendations,
    accuracy: s.accuracy,
    total: s.total,
    correct: s.correct,
    streak: analytics.streakDays(req.user.id),
    level: db.repos.subjectState.byUser(req.user.id)
  });
});

/* ---------- Силсилаи рӯзҳо ---------- */
router.get('/streak', needUser, function (req, res) {
  res.json({
    ok: true,
    streak: analytics.streakDays(req.user.id),
    days: db.repos.events.activeDays(req.user.id).slice(-30)
  });
});

/* ---------- Умумӣ ---------- */
router.get('/global', function (req, res) {
  res.json({ ok: true, stats: analytics.globalStats() });
});

module.exports = router;
