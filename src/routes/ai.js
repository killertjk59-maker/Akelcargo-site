/**
 * routes/ai.js — API-и AI (Website ва Telegram Bot ҳар ду аз services/aiService истифода мебаранд)
 *
 *   POST /api/ai/ask              — саволу ҷавоб
 *   POST /api/ai/analyze          — таҳлили хатои хонанда
 *   POST /api/ai/image            — масъала бо акс (vision)
 *   POST /api/ai/olympiad         — масъалаҳои олимпиада
 *   POST /api/ai/olympiad/finish  — сабти натиҷаи тест
 *   GET  /api/ai/subjects         — рӯйхати фанҳо
 */
'use strict';

const express = require('express');
const H = require('../utils/helpers');
const ai = require('../services/aiService');
const analytics = require('../services/analyticsService');
const db = require('../database/database');

const router = express.Router();

/** AI-ро танҳо корбари маълум (сессия ё меҳмони X-Device-Id) истифода метавонад */
function needUser(req, res, next) {
  if (!req.user) return next(H.unauthorized('Барои савол кардан боред ворид шавед ё саҳифаро навсозӣ кунед'));
  next();
}
router.use(needUser);

/** Сабти савол дар таърих + натиҷа дар progress */
function saveAsk(user, subject, question, result) {
  try {
    analytics.recordAnswer(user.id, {
      subject: subject || 'general',
      topic: result.topic || 'Умумӣ',
      correct: true,
      difficulty: result.difficulty,
      platform: 'web',
      question: question,
      answer: result.answer,
      mode: 'ask'
    });
  } catch (e) { /* идома */ }
}

/* ---------- Фанҳо ---------- */
router.get('/subjects', function (req, res) {
  res.json({
    subjects: ai.subjectList(),
    levels: Object.keys(ai.LEVELS).map((k) => ai.LEVELS[k]),
    demo: ai.isDemo(),
    model: ai.model
  });
});

/* ---------- Саволу ҷавоб ---------- */
router.post('/ask', async function (req, res, next) {
  try {
    H.requireFields(req.body, ['question']);
    const question = H.cleanText(req.body.question, 4000);
    H.assert(question.length >= 2, 'Савол хеле кӯтоҳ аст');
    const subject = ai.subjectOf(req.body.subject);
    const level = H.cleanString(req.body.level, 20) || analytics.currentLevel(req.user.id, (subject && subject.id) || 'general');
    const history = Array.isArray(req.body.history) ? req.body.history.slice(0, 6) : [];

    const result = await ai.ask({ question: question, subject: subject, level: level, history: history });
    saveAsk(req.user, subject && subject.id, question, result);

    res.json({
      ok: true,
      answer: result.answer,
      subject: subject ? subject.id : null,
      difficulty: result.difficulty,
      topic: result.topic,
      demo: result.demo,
      model: result.model,
      level: level
    });
  } catch (e) { next(e); }
});

/* ---------- Таҳлили хато ---------- */
router.post('/analyze', async function (req, res, next) {
  try {
    H.requireFields(req.body, ['question', 'studentAnswer']);
    const subject = ai.subjectOf(req.body.subject);
    const r = await ai.analyze({
      question: req.body.question,
      studentAnswer: req.body.studentAnswer,
      subject: subject
    });

    try {
      analytics.recordAnswer(req.user.id, {
        subject: (subject && subject.id) || 'general',
        topic: r.topic, correct: r.correct, difficulty: r.difficulty,
        platform: 'web', question: req.body.question, answer: r.explanation, mode: 'analyze'
      });
    } catch (e) { /* идома */ }

    res.json({ ok: true, analysis: r });
  } catch (e) { next(e); }
});

/* ---------- Масъала бо акс ---------- */
router.post('/image', express.json({ limit: '12mb' }), async function (req, res, next) {
  try {
    H.requireFields(req.body, ['image']);
    const raw = String(req.body.image);
    const m = raw.match(/^data:([^;]+);base64,(.+)$/);
    const imageBase64 = m ? m[2] : raw;
    const mime = m ? m[1] : 'image/jpeg';
    H.assert(imageBase64.length > 100, 'Акси маҳсулот хонда нашуд');
    const subject = ai.subjectOf(req.body.subject);

    const r = await ai.solveImage({
      imageBase64: imageBase64, mime: mime, subject: subject, question: req.body.question
    });

    try {
      analytics.recordAnswer(req.user.id, {
        subject: (subject && subject.id) || 'general', topic: 'Масъала бо акс',
        correct: true, difficulty: r.difficulty, platform: 'web',
        question: '[акс]', answer: r.solution, mode: 'image'
      });
    } catch (e) { /* идома */ }

    res.json({ ok: true, result: r });
  } catch (e) { next(e); }
});

/* ---------- Олимпиада ---------- */
router.post('/olympiad', async function (req, res, next) {
  try {
    const subject = ai.subjectOf(req.body.subject);
    const level = ai.levelOf(req.body.level);
    const count = H.cleanInt(req.body.count, 3, 1, 5);
    const set = await ai.olympiadQuestions({ level: level.id, subject: subject, count: count });
    const attempt = db.repos.olympiad.create(req.user.id, set.level, set.subject);
    res.json({
      ok: true,
      attemptId: attempt.id,
      level: set.level,
      levelName: level.name,
      subject: set.subject,
      questions: set.questions,
      demo: set.demo
    });
  } catch (e) { next(e); }
});

router.post('/olympiad/finish', function (req, res, next) {
  try {
    H.requireFields(req.body, ['attemptId']);
    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    const score = answers.filter((a) => a && a.correct).length;
    const done = db.repos.olympiad.finish(req.body.attemptId, {
      score: score, total: answers.length, answers: answers
    });
    try {
      analytics.recordAnswer(req.user.id, {
        subject: done.subject || 'olympiad',
        topic: 'Олимпиада ' + (ai.levelOf(done.level).name || ''),
        correct: score >= Math.ceil(answers.length * 0.6),
        difficulty: 4, platform: 'web',
        question: 'Олимпиада ' + (done.level || ''), answer: score + '/' + answers.length, mode: 'olympiad'
      });
    } catch (e) { /* идома */ }
    res.json({ ok: true, score: score, total: answers.length, attempt: done });
  } catch (e) { next(e); }
});

module.exports = router;
