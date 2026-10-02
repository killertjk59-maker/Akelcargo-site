/**
 * analyticsService.js — таҳлили дониш: адаптивӣ, dashboard, streak, тавсия.
 * Website ва Telegram Bot ҳар ду аз ин як хидмат истифода мебаранд.
 */
'use strict';

const H = require('../utils/helpers');
const db = require('../database/database');

const LEVELS = ['easy', 'medium', 'hard', 'olympiad'];
const LEVEL_NAMES = {
  easy: 'Осон', medium: 'Миёна', hard: 'Душвор', olympiad: 'Олимпиада'
};

/* ---------------- Сабти ҳодиса ---------------- */

function track(userId, type, meta) {
  try { return db.repos.events.create(userId, type, meta || {}); }
  catch (e) { /* логҳо муҳим нестанд */ return null; }
}

/* ---------------- Сабти ҷавоб ---------------- */

/**
 * Натиҷаи як ҷавобро дар ҳамаи ҷадвалҳо сабт мекунад:
 * messages (таърих), progress (миёнаи мавзӯъ), events (streak), subject_state (адаптивӣ).
 */
function recordAnswer(userId, data) {
  const d = data || {};
  const subject = d.subject || '';
  const topic = H.cleanString(d.topic, 120) || 'Умумӣ';
  const correct = d.correct === true;
  const difficulty = H.clamp(H.cleanInt(d.difficulty, 2, 1, 5), 1, 5);
  const score = H.clamp(
    typeof d.score === 'number' ? d.score : (correct ? (55 + difficulty * 9) : 30),
    0, 100
  );

  try {
    db.repos.messages.create({
      user_id: userId, platform: d.platform || 'web', subject: subject,
      mode: d.mode || 'ask', question: d.question || '', answer: d.answer || '',
      difficulty: difficulty, correct: correct
    });
    db.repos.progress.upsert({ user_id: userId, subject: subject, topic: topic, score: score });
    track(userId, correct ? 'answer_correct' : 'answer_wrong',
      { subject: subject, topic: topic, difficulty: difficulty });
  } catch (e) { /* идома медиҳем */ }

  return adaptLevel(userId, subject);
}

/* ---------------- Сатҳи адаптивӣ ---------------- */

function adaptLevel(userId, subject) {
  const rows = db.repos.progress.byUser(userId).filter((r) => r.subject === subject);
  if (!rows.length) return db.repos.subjectState.set(userId, subject, 'medium');

  const totalAttempts = rows.reduce((a, r) => a + r.attempts, 0);
  const avg = Math.round(rows.reduce((a, r) => a + r.score * r.attempts, 0) / Math.max(1, totalAttempts));

  const recent = db.repos.messages.byUser(userId, 8).filter((m) => m.subject === subject);
  const recentCorrect = recent.length
    ? recent.filter((m) => Number(m.correct) === 1).length / recent.length
    : 0.5;

  let level;
  if (avg >= 88 && recentCorrect >= 0.7) level = 'olympiad';
  else if (avg >= 76) level = 'hard';
  else if (avg >= 55) level = 'medium';
  else level = 'easy';

  db.repos.subjectState.set(userId, subject, level);
  return level;
}

function currentLevel(userId, subject) {
  const s = db.repos.subjectState.get(userId, subject);
  return s ? s.level : 'medium';
}

/* ---------------- Streak ---------------- */

function streakDays(userId) {
  const days = db.repos.events.activeDays(userId);
  if (!days.length) return 0;
  const set = {};
  days.forEach((d) => { set[d] = true; });
  let streak = 0;
  const cur = new Date();
  for (let i = 0; i < 400; i++) {
    const key = cur.toISOString().slice(0, 10);
    if (set[key]) { streak++; cur.setDate(cur.getDate() - 1); }
    else if (i === 0) { cur.setDate(cur.getDate() - 1); } // имрӯз ҳанӯз фаъол набуд
    else break;
  }
  return streak;
}

/* ---------------- Dashboard ---------------- */

function summary(userId) {
  const progress = db.repos.progress.byUser(userId);
  const messages = db.repos.messages.byUser(userId, 200);
  const total = messages.length;
  const correct = messages.filter((m) => Number(m.correct) === 1).length;
  const accuracy = total ? Math.round(correct / total * 100) : 0;

  /* Умумӣ */
  const overall = progress.length
    ? Math.round(progress.reduce((a, r) => a + r.score, 0) / progress.length)
    : 0;

  /* Бо фан */
  const bySubject = {};
  progress.forEach((r) => {
    if (!bySubject[r.subject]) bySubject[r.subject] = { total: 0, weight: 0, topics: [] };
    bySubject[r.subject].total += r.score * Math.max(1, r.attempts);
    bySubject[r.subject].weight += Math.max(1, r.attempts);
    bySubject[r.subject].topics.push(r);
  });
  const subjects = Object.keys(bySubject).map((k) => ({
    subject: k,
    score: Math.round(bySubject[k].total / Math.max(1, bySubject[k].weight)),
    topics: bySubject[k].topics.slice().sort((a, b) => a.score - b.score)
  })).sort((a, b) => b.score - a.score);

  /* Мавзӯъҳои заиф ва қавӣ */
  const all = progress.slice().sort((a, b) => a.score - b.score);
  const weak = all.filter((r) => r.score < 65).slice(0, 5);
  const strong = all.slice().reverse().filter((r) => r.score >= 80).slice(0, 5);

  /* Тавсия */
  const recommendation = buildRecommendation(subjects, weak, streakDays(userId));

  return {
    overall: overall,
    accuracy: accuracy,
    questionsSolved: total,
    correctAnswers: correct,
    streak: streakDays(userId),
    subjects: subjects,
    weakTopics: weak,
    strongTopics: strong,
    levels: db.repos.subjectState.byUser(userId).reduce((a, s) => {
      a[s.subject] = s.level; return a;
    }, {}),
    recent: messages.slice(0, 8).map((m) => ({
      subject: m.subject, question: m.question.slice(0, 140),
      correct: Number(m.correct) === 1, created_at: m.created_at
    })),
    olympiad: db.repos.olympiad.byUser(userId, 5),
    recommendation: recommendation
  };
}

function buildRecommendation(subjects, weak, streak) {
  if (!subjects.length) {
    return 'Оғоз кунед: якум саволи худро дар чат диҳед ё режими олимпиадаро кушоед.';
  }
  const worst = subjects[subjects.length - 1];
  const best = subjects[0];
  const parts = [];
  if (weak.length) {
    parts.push('Беҳтарин сармоя — мавзӯи «' + weak[0].topic + '» (' + weak[0].subject +
      ', ' + weak[0].score + '%): имрӯз 3–5 масъалаи ин мавзӯъро ҳал кунед.');
  }
  parts.push('Қавӣ ҷой: «' + best.topics[0].topic + '» — ' + best.score + '%.');
  if (worst.score < 60) {
    parts.push('Фани «' + worst.subject + '»-ро такрор кунед (сатҳ: ' + LEVEL_NAMES.easy + ').');
  }
  if (streak >= 3) parts.push('Streak-и шумо ' + streak + ' рӯз аст — ҳамчунӣ нигоҳ доред!');
  return parts.join(' ');
}

/* ---------------- Статистикаи умумӣ (admin) ---------------- */

function globalStats() {
  const users = db.repos.users.list(500);
  const messages = db.repos.store().select('messages', {}, {});
  const perSubject = {};
  messages.forEach((m) => {
    if (!perSubject[m.subject]) perSubject[m.subject] = { total: 0, correct: 0 };
    perSubject[m.subject].total++;
    if (Number(m.correct) === 1) perSubject[m.subject].correct++;
  });
  return {
    users: users.length,
    questions: messages.length,
    telegramUsers: users.filter((u) => u.telegram_id).length,
    perSubject: perSubject,
    byDay: countByDay(messages)
  };
}

function countByDay(rows) {
  const out = {};
  rows.forEach((r) => {
    const k = String(r.created_at).slice(0, 10);
    out[k] = (out[k] || 0) + 1;
  });
  return out;
}

module.exports = {
  track, recordAnswer, adaptLevel, currentLevel, streakDays, summary, globalStats,
  LEVELS, LEVEL_NAMES
};
