/**
 * telegramService.js — Telegram Bot-и DONO AI.
 *
 * Муҳим: бот backend ва AI Service-и ҳамон сайтро истифода мебарад —
 * як база, як корбар, як AI. (ONE BACKEND • ONE DATABASE • ONE AI)
 */
'use strict';

const H = require('../utils/helpers');
const log = require('../utils/logger');
const db = require('../database/database');
const ai = require('./aiService');
const analytics = require('./analyticsService');

const TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const API = 'https://api.telegram.org/bot' + TOKEN;
const SECRET = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim();
const MAX_LEN = 3500;

/* Ҳолати муваққатии чатҳо (режим: савол / таҳлили хато / олимпиада) */
const chatState = {};

function state(chatId) {
  if (!chatState[chatId]) chatState[chatId] = { subject: null, mode: 'ask', pending: null, olympiad: null };
  return chatState[chatId];
}

/* ============================================================
   Даъвати Telegram Bot API
   ============================================================ */

async function call(method, payload, timeoutMs) {
  if (!TOKEN) { const e = new Error('TELEGRAM_BOT_TOKEN гузошта нашудааст'); e.code = 'no_token'; throw e; }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || 20000);
  try {
    const res = await fetch(API + '/' + method, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
      signal: controller.signal
    });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) {
      const err = new Error('Telegram: ' + (data.description || res.status));
      err.code = 'tg_' + res.status;
      throw err;
    }
    return data.result;
  } finally { clearTimeout(timer); }
}

async function sendMessage(chatId, text, extra) {
  const parts = ai.chunk(text, MAX_LEN);
  let last = null;
  for (const part of parts) {
    last = await call('sendMessage', Object.assign({ chat_id: chatId, text: part }, extra || {}));
  }
  return last;
}

async function sendTyping(chatId) {
  try { await call('sendChatAction', { chat_id: chatId, action: 'typing' }); }
  catch (e) { /* муҳим нест */ }
}

async function setWebhook(url, secret) {
  if (!url) return null;
  return call('setWebhook', {
    url: url,
    secret_token: secret || undefined,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: false
  });
}

async function getMe() {
  try { return await call('getMe', {}); } catch (e) { return null; }
}

/* ============================================================
   Санҷиши webhook
   ============================================================ */

function verify(req) {
  if (!SECRET) return true; // агар парол гузошта набошад, санҷиш намешавад
  return req.get('X-Telegram-Bot-Api-Secret-Token') === SECRET;
}

/* ============================================================
   Корбар (як база бо сайт)
   ============================================================ */

function userFor(tgUser) {
  let u = db.repos.users.byTelegram(tgUser.id);
  if (!u) {
    u = db.repos.users.create({
      telegram_id: String(tgUser.id),
      username: tgUser.username || '',
      name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'Меҳмон'
    });
    log.info('Корбари нав аз Telegram:', u.id, tgUser.id);
  }
  db.repos.users.touch(u.id);
  return u;
}

/* ============================================================
   Фармонҳо
   ============================================================ */

const COMMANDS = [
  { cmd: 'start', desc: 'Оғоз ва пайваст бо аккаунти сайт' },
  { cmd: 'help', desc: 'Рӯйхати фармонҳо' },
  { cmd: 'subjects', desc: 'Интихоби фан' },
  { cmd: 'chemistry', desc: '🧪 Режими химия' },
  { cmd: 'biology', desc: '🧬 Режими биология' },
  { cmd: 'math', desc: '📐 Режими математика' },
  { cmd: 'physics', desc: '⚡ Режими физика' },
  { cmd: 'analyze', desc: '🔍 Таҳлили хатои ҷавоб' },
  { cmd: 'olympiad', desc: '🏆 Режими олимпиада' },
  { cmd: 'profile', desc: '👤 Профил ва сатҳи дониш' },
  { cmd: 'stats', desc: '📊 Статистика' },
  { cmd: 'login', desc: '🔗 Рамзи пайвасткунӣ бо сайт' }
];

const MENU = {
  reply_markup: {
    keyboard: [
      [{ text: '🧪 Химия' }, { text: '🧬 Биология' }],
      [{ text: '📐 Математика' }, { text: '⚡ Физика' }],
      [{ text: '🔍 Таҳлили хато' }, { text: '🏆 Олимпиада' }],
      [{ text: '👤 Профил' }, { text: '📊 Статистика' }]
    ],
    resize_keyboard: true,
    is_persistent: true
  }
};

function helpText() {
  return [
    '🧠 <b>DONO AI</b> — ёрирасони таълимии ту',
    '',
    'Саволи худро ҳамчун матн фиристед — ман қадам ба қадам шарҳ медиҳам.',
    '',
    '<b>Фармонҳо:</b>',
    COMMANDS.map((c) => '/' + c.cmd + ' — ' + c.desc).join('\n'),
    '',
    '📷 Акси масъала фиристед — матнро мехонам ва ҳал мекунам.',
    '',
    'Ҳар саволе ки дар Telegram мепурсед, дар сайт низ дар профили шумо пайдо мешавад.'
  ].join('\n');
}

function subjectsText() {
  return [
    '📚 <b>Интихоби фан</b>',
    '',
    'Фанро интихоб кунед (ё аз тугмаҳо):',
    ai.subjectList().map((s) => '/' + s.id + ' — ' + s.emoji + ' ' + s.name).join('\n'),
    '',
    'Баъд саволи худро фиристед.'
  ].join('\n');
}

/* ============================================================
   Ҷавобдиҳӣ ба савол (ҳамон AI Service)
   ============================================================ */

async function answerQuestion(user, chatId, text) {
  const st = state(chatId);
  await sendTyping(chatId);
  const history = db.repos.messages.byUser(user.id, 6);
  try {
    const result = await ai.ask({
      question: text, subject: st.subject, level: analytics.currentLevel(user.id, st.subject || 'mixed'),
      history: history.map((m) => ({ question: m.question, answer: m.answer }))
    });
    analytics.recordAnswer(user.id, {
      subject: st.subject || 'general', topic: result.topic || 'Умумӣ',
      correct: true, difficulty: result.difficulty, platform: 'telegram',
      question: text, answer: result.answer
    });
    await sendMessage(chatId, '🧠 <b>DONO AI</b>' +
      (st.subject ? ' · ' + ai.subjectOf(st.subject).emoji + ' ' + ai.subjectOf(st.subject).name : '') +
      '\n\n' + result.answer +
      (result.demo ? '\n\n⚙️ Демо-режим: OPENAI_API_KEY гузошта нашудааст.' : ''),
      { parse_mode: 'HTML' });
  } catch (e) {
    log.warn('AI хато (telegram):', e.message);
    await sendMessage(chatId, '⚠️ Хато ҳангоми ҷавобдиҳӣ: ' + e.message +
      '\n\nДубора кӯшиш кунед ё саволро кӯтоҳтар нависед.');
  }
}

/* ============================================================
   Таҳлили хато
   ============================================================ */

async function analyzeFlow(user, chatId, text) {
  const st = state(chatId);
  if (st.mode === 'analyze_problem') {
    st.pending = { question: text };
    st.mode = 'analyze_answer';
    await sendMessage(chatId,
      '✍️ Ҳоло <b>ҷавоби худро</b> фиристед (масалан: <code>3 mol</code>).\n' +
      'Ман ҷавобро санҷида, хатогиро ёфта, сабабашро шарҳ медиҳам.',
      { parse_mode: 'HTML' });
    return;
  }
  if (st.mode === 'analyze_answer') {
    const question = st.pending ? st.pending.question : '';
    st.mode = 'ask';
    st.pending = null;
    await sendTyping(chatId);
    try {
      const r = await ai.analyze({ question: question, studentAnswer: text, subject: st.subject });
      analytics.recordAnswer(user.id, {
        subject: r.subject || st.subject || 'general', topic: r.topic,
        correct: r.correct, difficulty: r.difficulty, platform: 'telegram',
        question: question, answer: JSON.stringify(r), mode: 'analyze'
      });
      const lines = [
        '🔍 <b>Таҳлили хато</b>',
        '',
        (r.correct ? '✅ <b>Ҷавоб дуруст аст!</b>' : '❌ <b>Ҷавоб нодуруст аст.</b>'),
        '',
        '📘 Мавзӯ: ' + r.topic,
        '⚡ Душворӣ: ' + '★'.repeat(r.difficulty) + '☆'.repeat(5 - r.difficulty)
      ];
      if (r.mistake) lines.push('', '🐞 <b>Хатогӣ:</b> ' + r.mistake);
      if (r.explanation) lines.push('', '📖 <b>Шарҳ:</b>\n' + r.explanation);
      if (r.correctAnswer) lines.push('', '✅ <b>Ҷавоби дуруст:</b> ' + r.correctAnswer);
      if (r.nextQuestion) lines.push('', '🎯 <b>Машқи нав:</b> ' + r.nextQuestion);
      await sendMessage(chatId, lines.join('\n'), { parse_mode: 'HTML' });
    } catch (e) {
      log.warn('AI analyze хато:', e.message);
      await sendMessage(chatId, '⚠️ Таҳлил нашуд: ' + e.message);
    }
  }
}

/* ============================================================
   Олимпиада
   ============================================================ */

async function olympiadFlow(user, chatId, level) {
  const st = state(chatId);
  await sendTyping(chatId);
  try {
    const set = await ai.olympiadQuestions({
      level: level || 'intermediate', subject: st.subject, count: 3
    });
    st.olympiad = { level: set.level, questions: set.questions, index: 0, score: 0 };
    st.mode = 'olympiad';
    await sendMessage(chatId,
      '🏆 <b>Олимпиада — ' + ai.levelOf(set.level).name + '</b>\n\n' +
      set.questions.length + ' масъала. Ҷавобро ҳамчун матн фиристед.\n\n' +
      '<b>Масъалаи 1:</b>\n' + set.questions[0].question + '\n\n' +
      set.questions[0].options.map((o, i) => String.fromCharCode(65 + i) + ') ' + o).join('\n'),
      { parse_mode: 'HTML' });
  } catch (e) {
    await sendMessage(chatId, '⚠️ ' + e.message);
  }
}

async function olympiadAnswer(user, chatId, text) {
  const st = state(chatId);
  const o = st.olympiad;
  if (!o) { st.mode = 'ask'; return; }
  const q = o.questions[o.index];
  const given = H.cleanString(text, 200).toUpperCase();
  const ok = given === H.cleanString(q.answer, 200).toUpperCase() ||
    given === String.fromCharCode(65 + q.options.indexOf(q.answer));
  if (ok) o.score++;

  let msg = (ok ? '✅ Дуруст!' : '❌ Нодуруст.') + '\n' + (q.explanation || '');
  o.index++;
  if (o.index < o.questions.length) {
    const nq = o.questions[o.index];
    msg += '\n\n<b>Масъалаи ' + (o.index + 1) + ':</b>\n' + nq.question + '\n\n' +
      nq.options.map((op, i) => String.fromCharCode(65 + i) + ') ' + op).join('\n');
    await sendMessage(chatId, msg, { parse_mode: 'HTML' });
  } else {
    st.mode = 'ask';
    const pct = Math.round(o.score / o.questions.length * 100);
    analytics.recordAnswer(user.id, {
      subject: st.subject || 'olympiad', topic: 'Олимпиада ' + ai.levelOf(o.level).name,
      correct: pct >= 60, difficulty: 4, platform: 'telegram',
      question: 'Олимпиада ' + ai.levelOf(o.level).name, answer: pct + '%', mode: 'olympiad'
    });
    db.repos.olympiad.finish(st.olympiad.id, { score: o.score, total: o.questions.length, answers: [] });
    await sendMessage(chatId, msg + '\n\n🏁 <b>Натиҷа: ' + o.score + '/' + o.questions.length +
      ' (' + pct + '%)</b>\n\n' + (pct >= 80 ? 'Аъло! Сатҳи зиёдтарро кӯшиш кунед: /olympiad'
        : pct >= 50 ? 'Хуб. Мавзӯъҳои заифро такрор кунед: /stats'
          : 'Мавзӯъҳои асосиро такрор кун: /subjects'),
      { parse_mode: 'HTML' });
    st.olympiad = null;
  }
}

/* ============================================================
   Профил ва статистика
   ============================================================ */

function profileText(user, s) {
  const subj = s.subjects.map((x) => {
    const meta = ai.subjectOf(x.subject);
    return (meta ? meta.emoji + ' ' + meta.name : x.subject) + ': ' + H.bar(x.score) + ' ' + x.score + '%';
  }).join('\n') || '— ҳанӯз маълумот нест';

  return [
    '👤 <b>' + (user.name || 'Меҳмон') + '</b>',
    user.username ? '@' + user.username : '',
    '',
    '🧠 Умумии дониш: ' + H.bar(s.overall) + ' ' + s.overall + '%',
    '✅ Дурустӣ: ' + s.accuracy + '% (' + s.correctAnswers + '/' + s.questionsSolved + ')',
    '🔥 Streak: ' + s.streak + ' рӯз',
    '',
    '<b>Фанҳо:</b>',
    subj,
    '',
    '💡 <b>Тавсияи DONO AI:</b> ' + s.recommendation
  ].filter(Boolean).join('\n');
}

/* ============================================================
   Пайвасткунии аккаунт (Website ↔ Telegram)
   ============================================================ */

async function linkByCode(tgUser, code) {
  const row = db.repos.loginCodes.active(code);
  if (!row) return false;
  db.repos.loginCodes.consume(code);
  let user = row.user_id ? db.repos.users.byId(row.user_id) : db.repos.users.byTelegram(tgUser.id);
  if (!user) user = userFor(tgUser);
  db.repos.users.update(user.id, { telegram_id: String(tgUser.id) });
  log.info('Аккаунт пайваст шуд:', user.id, tgUser.id);
  return true;
}

/* ============================================================
   Диспетчери асосӣ
   ============================================================ */

async function handleUpdate(update) {
  const msg = update.message || (update.edited_message);
  if (!msg) return;

  const chatId = msg.chat.id;
  const from = msg.from || {};
  const text = (msg.text || msg.caption || '').trim();
  const user = userFor(from);
  const st = state(chatId);

  /* ---- /start (бо ё бе рамзи пайваст) ---- */
  if (text === '/start' || text.indexOf('/start ') === 0) {
    const payload = text.split(' ')[1] || '';
    if (payload && /^\d{6}$/.test(payload)) {
      const ok = await linkByCode(from, payload);
      await sendMessage(chatId, ok
        ? '🔗 <b>Аккаунт пайваст шуд!</b>\n\nАкнун ҳамаи саволҳо, натиҷаҳо ва статистикаи шумо дар сайт низ дида мешаванд.\n\nСаволи худро фиристед 🧠'
        : '⚠️ Рамз ёфт нашуд ё мӯҳлаташ гузаштааст. Рамзи нав дар сайт гиред.', { parse_mode: 'HTML' });
      return;
    }
    st.mode = 'ask';
    await sendMessage(chatId,
      '🧠 <b>DONO AI</b> — хуш омадед, ' + (from.first_name || 'дӯсти мо') + '!\n\n' +
      'Ман ёрирасони таълимӣ барои химия, биология, математика ва физика ҳастам.\n\n' +
      'Саволи худро фиристед, акс гузоред ё /help-ро бубинед.', MENU);
    return;
  }

  if (text === '/help' || text === '/commands') {
    await sendMessage(chatId, helpText(), { parse_mode: 'HTML' });
    return;
  }

  if (text === '/subjects') {
    st.mode = 'ask';
    await sendMessage(chatId, subjectsText(), { parse_mode: 'HTML' });
    return;
  }

  /* ---- Интихоби фан ---- */
  const subj = ai.subjectOf(text.replace(/^\//, '').split(' ')[0]);
  if (subj) {
    st.subject = subj.id;
    st.mode = 'ask';
    await sendMessage(chatId,
      subj.emoji + ' <b>' + subj.name + ' Mode</b>\n\nСаволи худро фиристед.',
      { parse_mode: 'HTML' });
    return;
  }
  /* тугмаҳои клавиатура */
  const byButton = ai.subjectList().find((s) => text.indexOf(s.emoji) === 0 || text === s.name);
  if (byButton) {
    st.subject = byButton.id;
    st.mode = 'ask';
    await sendMessage(chatId, byButton.emoji + ' <b>' + byButton.name + ' Mode</b>\n\nСаволи худро фиристед.', { parse_mode: 'HTML' });
    return;
  }
  if (text.indexOf('🔍') === 0 || text === '/analyze') {
    st.mode = 'analyze_problem';
    await sendMessage(chatId,
      '🔍 <b>Таҳлили хато</b>\n\nМасъаларо фиристед (масалан: <code>36 грамм об чанд мол аст?</code>)',
      { parse_mode: 'HTML' });
    return;
  }
  if (text.indexOf('🏆') === 0 || text.indexOf('/olympiad') === 0) {
    const lvl = text.split(' ')[1] || 'intermediate';
    await olympiadFlow(user, chatId, lvl);
    return;
  }
  if (text.indexOf('👤') === 0 || text === '/profile') {
    await sendMessage(chatId, profileText(user, analytics.summary(user.id)), { parse_mode: 'HTML' });
    return;
  }
  if (text.indexOf('📊') === 0 || text === '/stats') {
    const s = analytics.summary(user.id);
    const weak = s.weakTopics.map((w) => '• ' + w.topic + ' — ' + w.score + '%').join('\n') || '—';
    await sendMessage(chatId,
      '📊 <b>Статистика</b>\n\n' +
      '🧠 Дониш: ' + s.overall + '%\n' +
      '✅ Дурустӣ: ' + s.accuracy + '%\n' +
      '📝 Масаъалаҳо: ' + s.questionsSolved + '\n' +
      '🔥 Streak: ' + s.streak + ' рӯз\n\n' +
      '<b>Мавзӯъҳои заиф:</b>\n' + weak + '\n\n' +
      '💡 ' + s.recommendation, { parse_mode: 'HTML' });
    return;
  }
  if (text === '/login' || text.indexOf('🔗') === 0) {
    const code = db.repos.loginCodes.create(user.id, String(from.id));
    const me = await getMe();
    const link = me && me.username ? 'https://t.me/' + me.username + '?start=' + code.code : '';
    await sendMessage(chatId,
      '🔗 <b>Пайваст бо аккаунти сайт</b>\n\n' +
      'Рамзи шумо: <code>' + code.code + '</code>\n\n' +
      'Дар сайт: Профил → «Пайваст бо Telegram» → рамзро ворид кунед.\n' +
      (link ? 'Ё ин сӯроқаро кушоед: ' + link : '') +
      '\n\nРамз 10 дақиқа фаъол аст.', { parse_mode: 'HTML' });
    return;
  }

  /* ---- Акс ---- */
  if (msg.photo && msg.photo.length) {
    await solveImageFlow(user, chatId, msg.photo);
    return;
  }

  /* ---- Режимҳо ---- */
  if (st.mode === 'analyze_problem' || st.mode === 'analyze_answer') {
    await analyzeFlow(user, chatId, text);
    return;
  }
  if (st.mode === 'olympiad' && st.olympiad) {
    await olympiadAnswer(user, chatId, text);
    return;
  }

  /* ---- Саволи оддӣ ---- */
  if (!text) {
    await sendMessage(chatId, 'Саволи худро ҳамчун матн фиристед, ё акси масъала гузоред 📷');
    return;
  }
  await answerQuestion(user, chatId, text);
}

async function solveImageFlow(user, chatId, photos) {
  const st = state(chatId);
  const best = photos[photos.length - 1];
  await sendTyping(chatId);
  try {
    const file = await call('getFile', { file_id: best.file_id });
    const url = 'https://api.telegram.org/file/bot' + TOKEN + '/' + file.file_path;
    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    const r = await ai.solveImage({
      imageBase64: buf.toString('base64'),
      mime: 'image/jpeg',
      subject: st.subject,
      question: ''
    });
    analytics.recordAnswer(user.id, {
      subject: st.subject || 'general', topic: 'Масъала бо акс',
      correct: true, difficulty: r.difficulty, platform: 'telegram',
      question: '[акс] ' + (file.file_path || ''), answer: r.solution, mode: 'image'
    });
    await sendMessage(chatId, '📷 <b>Масъала бо акс</b>\n\n' + r.solution +
      (r.demo ? '\n\n⚙️ Демо-режим: OPENAI_API_KEY гузошта нашудааст.' : ''),
      { parse_mode: 'HTML' });
  } catch (e) {
    log.warn('AI image хато:', e.message);
    await sendMessage(chatId, '⚠️ Акc хонда нашуд: ' + e.message);
  }
}

module.exports = {
  handleUpdate, verify, setWebhook, getMe, sendMessage, call,
  commands: COMMANDS,
  isConfigured: function () { return !!TOKEN; }
};
