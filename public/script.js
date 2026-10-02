/* ============================================================
   DONO AI — script.js (Vanilla JS, mobile-first)
   Ҳар ду платформа (Website + Telegram Bot) як backend-ро истифода мебаранд.
   ============================================================ */
'use strict';

/* ---------------- Кӯмакчиҳо ---------------- */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

const SUBJECTS = [
  { id: 'chemistry', name: 'Химия',   icon: '🧪' },
  { id: 'biology',   name: 'Биология', icon: '🧬' },
  { id: 'math',      name: 'Математика', icon: '📐' },
  { id: 'physics',   name: 'Физика',  icon: '⚡' },
  { id: 'general',   name: 'Умумӣ',   icon: '🎯' }
];

const LEVELS = { easy: 'Осон', medium: 'Миёна', hard: 'Душвор', olympiad: 'Олимпиада' };

const state = {
  subject: localStorage.getItem('dono.subject') || 'general',
  level: localStorage.getItem('dono.level') || 'medium',
  history: [],                       // барои контексти AI
  token: localStorage.getItem('dono.token') || '',
  device: localStorage.getItem('dono.device') || '',
  user: null,
  olympiad: { questions: [], index: 0, score: 0, attemptId: null, locked: false },
  demo: false
};

if (!state.device) {
  state.device = 'd' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem('dono.device', state.device);
}

/* ---------------- API ---------------- */
async function api(path, options) {
  const opt = options || {};
  opt.headers = Object.assign({ 'Content-Type': 'application/json', 'X-Device-Id': state.device }, opt.headers || {});
  if (state.token) opt.headers['Authorization'] = 'Bearer ' + state.token;
  let res;
  try {
    res = await fetch('/api' + path, opt);
  } catch (e) {
    throw new Error('Пайвастшавӣ бо сервер намешавад. Интернетро санҷед.');
  }
  let data = {};
  try { data = await res.json(); } catch (e) { data = {}; }
  if (!res.ok || data.ok === false) throw new Error(data.error || ('Хатогӣ ' + res.status));
  return data;
}

/* ---------------- UI: хабарҳо ---------------- */
let toastTimer = null;
function toast(msg, kind) {
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'toast ' + (kind || '');
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

function showView(name) {
  $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.view === name));
  $$('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'profile') loadDashboard();
}

/* ---------------- UI: интихоби фан ---------------- */
function renderSubjectBar(container, activeId) {
  container.innerHTML = '';
  SUBJECTS.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'subj' + (s.id === activeId ? ' active' : '');
    b.dataset.id = s.id;
    b.innerHTML = '<span class="ico">' + s.icon + '</span><span>' + s.name + '</span>';
    b.addEventListener('click', () => {
      state.subject = s.id;
      localStorage.setItem('dono.subject', s.id);
      renderSubjectBars();
      refreshLevelHint();
    });
    container.appendChild(b);
  });
}
function renderSubjectBars() {
  renderSubjectBar($('#subjectBar'), state.subject);
  renderSubjectBar($('#anSubjectBar'), state.subject);
  renderSubjectBar($('#imgSubjectBar'), state.subject);
  renderSubjectBar($('#olSubjectBar'), state.subject);
}
async function refreshLevelHint() {
  try {
    const r = await api('/user/level?subject=' + state.subject);
    state.level = r.level || state.level;
    localStorage.setItem('dono.level', state.level);
    $('#levelHint').innerHTML = 'Сатҳи ҳозира: <b>' + (LEVELS[state.level] || state.level) + '</b>';
  } catch (e) { /* идома */ }
}

/* ---------------- UI: чат ---------------- */
function bubble(role, text, tools) {
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + (role === 'user' ? 'me' : 'bot');
  const inner = document.createElement('div');
  const who = document.createElement('div');
  who.className = 'who';
  who.textContent = role === 'user' ? 'Ту' : 'DONO AI';
  const b = document.createElement('div');
  b.className = 'bubble';
  b.textContent = text;
  inner.appendChild(who);
  inner.appendChild(b);
  if (tools) {
    const t = document.createElement('div');
    t.className = 'tools';
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'mini';
    copy.textContent = '📋 Нусха';
    copy.addEventListener('click', () => copyText(text, copy));
    t.appendChild(copy);
    inner.appendChild(t);
  }
  wrap.appendChild(inner);
  $('#chatBox').appendChild(wrap);
  $('#chatBox').scrollTop = $('#chatBox').scrollHeight;
  return b;
}

function copyText(text, btn) {
  const done = () => { const o = btn.textContent; btn.textContent = '✓ Нусха шуд'; setTimeout(() => { btn.textContent = o; }, 1400); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { toast('Нусха кардан имкон надошт', 'err'); }
  document.body.removeChild(ta);
}

/** Матнро ҳарф-ба-ҳарф нишон медиҳад (эффекси машинӣ) */
async function typeInto(el, text, speed) {
  el.textContent = '';
  const parts = text.match(/\s+|[^\s]+/g) || [];
  for (let i = 0; i < parts.length; i++) {
    el.textContent += parts[i];
    if (i % 2 === 0) $('#chatBox').scrollTop = $('#chatBox').scrollHeight;
    await new Promise((r) => setTimeout(r, speed));
  }
  el.textContent = text;
}

$('#chatForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const input = $('#chatInput');
  const q = input.value.trim();
  if (q.length < 2) return toast('Саволро пурра нависед', 'err');
  bubble('user', q);
  input.value = '';
  input.style.height = 'auto';
  $('#sendBtn').disabled = true;
  $('#typing').hidden = false;

  try {
    const r = await api('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({
        question: q,
        subject: state.subject,
        level: state.level,
        history: state.history.slice(-6)
      })
    });
    $('#typing').hidden = true;
    const b = bubble('bot', '', true);
    await typeInto(b, r.answer, r.answer.length > 900 ? 4 : 9);
    state.history.push({ role: 'user', content: q });
    state.history.push({ role: 'assistant', content: r.answer });
    if (state.history.length > 12) state.history = state.history.slice(-12);
    if (r.difficulty) state.level = LEVELS[r.difficulty] ? r.difficulty : state.level;
    refreshLevelHint();
    refreshStreak();
  } catch (e) {
    $('#typing').hidden = true;
    bubble('bot', '⚠️ ' + e.message);
    toast(e.message, 'err');
  } finally {
    $('#sendBtn').disabled = false;
    input.focus();
  }
});

$('#clearChat').addEventListener('click', () => {
  if (!confirm('Таърихи чатро пок кунем?')) return;
  $('#chatBox').innerHTML = '';
  state.history = [];
  bubble('bot', 'Таърих пок карда шуд. Саволи навро бипурс 🧠');
});

/* ---------------- UI: таҳлили хато ---------------- */
$('#analyzeForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const q = $('#anQuestion').value.trim();
  const a = $('#anAnswer').value.trim();
  if (q.length < 3) return toast('Масъаларо нависед', 'err');
  if (!a) return toast('Ҷавоби худро нависед', 'err');
  const btn = $('#analyzeForm button[type=submit]');
  btn.disabled = true; btn.textContent = 'Таҳлил мешавад...';
  try {
    const r = await api('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ question: q, studentAnswer: a, subject: state.subject })
    });
    renderAnalysis(r.analysis);
  } catch (e) { toast(e.message, 'err'); }
  finally { btn.disabled = false; btn.textContent = 'Таҳлил кун 🔍'; }
});

function renderAnalysis(a) {
  const box = $('#analyzeResult');
  const ok = a.correct === true;
  box.hidden = false;
  box.innerHTML =
    '<div class="verdict ' + (ok ? 'ok' : 'bad') + '">' + (ok ? '✅ Ҷавоб дуруст аст!' : '❌ Хатогӣ ёфт шуд') + '</div>' +
    '<dl>' +
    '<dt>Фан</dt><dd>' + esc(a.subject) + '</dd>' +
    '<dt>Мавзӯъ</dt><dd>' + esc(a.topic) + '</dd>' +
    '<dt>Душворӣ</dt><dd>' + esc(a.difficulty) + '</dd>' +
    '<dt>Хатогӣ</dt><dd>' + esc(a.mistake || '—') + '</dd>' +
    '</dl>' +
    '<div class="box"><b>Шарҳ:</b>\n' + esc(a.explanation || '') + '</div>' +
    '<div class="box"><b>Ҷавоби дуруст:</b>\n' + esc(a.correctAnswer || '—') + '</div>' +
    (a.nextQuestion ? '<div class="box"><b>Саволи навбатӣ:</b>\n' + esc(a.nextQuestion) + '</div>' : '');
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/* ---------------- UI: масъала бо акс ---------------- */
const drop = $('#dropZone'), fileInput = $('#imageInput'), preview = $('#imagePreview');
$('#pickImage').addEventListener('click', () => fileInput.click());
drop.addEventListener('click', (e) => { if (e.target === drop) fileInput.click(); });
['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('hover'); }));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('hover'); }));
drop.addEventListener('drop', (e) => { if (e.dataTransfer.files[0]) readImage(e.dataTransfer.files[0]); });
fileInput.addEventListener('change', () => { if (fileInput.files[0]) readImage(fileInput.files[0]); });

function readImage(file) {
  if (!/^image\//.test(file.type)) return toast('Файл акс намебошад', 'err');
  if (file.size > 8 * 1024 * 1024) return toast('Акс набояд аз 8 МБ зиёд бошад', 'err');
  const fr = new FileReader();
  fr.onload = () => { preview.src = fr.result; preview.hidden = false; };
  fr.readAsDataURL(file);
}

$('#imageForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  if (!preview.src) return toast('Аввал акс интихоб кун', 'err');
  const btn = $('#imageSubmit');
  btn.disabled = true; btn.textContent = 'AI мехонад...';
  try {
    const r = await api('/ai/image', {
      method: 'POST',
      body: JSON.stringify({
        image: preview.src,
        subject: state.subject,
        question: $('#imgQuestion').value.trim()
      })
    });
    renderImage(r.result);
  } catch (e) { toast(e.message, 'err'); }
  finally { btn.disabled = false; btn.textContent = 'Ҳал кун 🧠'; }
});

function renderImage(r) {
  const box = $('#imageResult');
  box.hidden = false;
  box.innerHTML =
    '<h3>🧠 Ҳалли масъала</h3>' +
    '<div class="box"><b>Матни акс:</b>\n' + esc(r.extracted || '—') + '</div>' +
    '<div class="box"><b>Ҳал:</b>\n' + esc(r.solution || '—') + '</div>' +
    '<div>' +
    (r.subject ? '<span class="badge">' + esc(r.subject) + '</span>' : '') +
    (r.topic ? '<span class="badge">' + esc(r.topic) + '</span>' : '') +
    (r.difficulty ? '<span class="badge">Душворӣ: ' + esc(r.difficulty) + '</span>' : '') +
    '</div>';
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------------- UI: олимпиада ---------------- */
let olLevel = 'beginner';
$$('#levelBar .lvl').forEach((b) => b.addEventListener('click', () => {
  olLevel = b.dataset.level;
  $$('#levelBar .lvl').forEach((x) => x.classList.toggle('active', x === b));
}));
$$('#levelBar .lvl')[0].classList.add('active');

$('#startOlympiad').addEventListener('click', async () => {
  const btn = $('#startOlympiad');
  btn.disabled = true; btn.textContent = 'Масъалаҳо омода мешаванд...';
  try {
    const r = await api('/ai/olympiad', {
      method: 'POST',
      body: JSON.stringify({ level: olLevel, subject: state.subject, count: 3 })
    });
    state.olympiad = { questions: r.questions, index: 0, score: 0, attemptId: r.attemptId, locked: false };
    $('#olympiadBox').hidden = false;
    renderQuestion();
  } catch (e) { toast(e.message, 'err'); }
  finally { btn.disabled = false; btn.textContent = 'Оғоз кун 🚀'; }
});

function renderQuestion() {
  const o = state.olympiad;
  const q = o.questions[o.index];
  if (!q) return finishOlympiad();
  o.locked = false;
  $('#qMeta').innerHTML = '<span>Савол ' + (o.index + 1) + ' / ' + o.questions.length + '</span><span>' + esc(olLevel.toUpperCase()) + '</span>';
  $('#qText').textContent = q.question;
  const box = $('#qOptions');
  box.innerHTML = '';
  (q.options || []).forEach((opt, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt';
    b.textContent = opt;
    b.addEventListener('click', () => answer(b, i, q));
    box.appendChild(b);
  });
  $('#nextQ').hidden = true;
  $('#olScore').hidden = true;
}

function answer(btn, i, q) {
  const o = state.olympiad;
  if (o.locked) return;
  o.locked = true;
  const right = i === q.answerIndex;
  if (right) o.score++;
  $$('#qOptions .opt').forEach((b, idx) => {
    if (idx === q.answerIndex) b.classList.add('correct');
    else if (idx === i) b.classList.add('wrong');
  });
  $('#nextQ').hidden = false;
  $('#nextQ').textContent = o.index + 1 >= o.questions.length ? 'Натиҷа →' : 'Саволӣ дигар →';
  o.answers = o.answers || [];
  o.answers.push({ index: i, correct: right });
}

$('#nextQ').addEventListener('click', () => {
  state.olympiad.index++;
  renderQuestion();
});

async function finishOlympiad() {
  const o = state.olympiad;
  const box = $('#olScore');
  box.hidden = false;
  const pct = Math.round((o.score / Math.max(1, o.questions.length)) * 100);
  box.textContent = 'Натиҷа: ' + o.score + ' / ' + o.questions.length + '  (' + pct + '%)';
  $('#nextQ').hidden = true;
  try {
    await api('/ai/olympiad/finish', {
      method: 'POST',
      body: JSON.stringify({ attemptId: o.attemptId, score: o.score, answers: o.answers || [] })
    });
    refreshStreak();
  } catch (e) { /* идома */ }
  toast(pct >= 60 ? 'Офарин! 🏆' : 'Кӯшиши беҳтар барои маротимаи оянда 💪', pct >= 60 ? 'ok' : '');
}

/* ---------------- UI: кабинет ---------------- */
async function loadDashboard() {
  try {
    const s = await api('/statistics/me');
    $('#stKnowledge').textContent = (s.knowledge || 0) + '%';
    $('#stAccuracy').textContent = (s.accuracy || 0) + '%';
    $('#stTotal').textContent = s.total || 0;
    $('#stStreak').textContent = s.streak || 0;

    const bars = $('#bars');
    bars.innerHTML = '';
    (s.subjects || []).forEach((x) => {
      const name = (SUBJECTS.find((z) => z.id === x.subject) || {}).name || x.subject;
      const icon = (SUBJECTS.find((z) => z.id === x.subject) || {}).icon || '📘';
      const row = document.createElement('div');
      row.className = 'bar-row';
      row.innerHTML = '<div class="lab"><span>' + icon + ' ' + esc(name) + '</span><span>' + x.score + '%</span></div>' +
        '<div class="bar"><i style="width:' + Math.max(2, x.score) + '%"></i></div>';
      bars.appendChild(row);
    });
    if (!bars.children.length) bars.innerHTML = '<p class="hint">Ҳанӯз маълумот нест.</p>';

    fillList('#weakList', s.weakTopics, 'Ҳанӯз маълумот нест.');
    fillList('#strongList', s.strongTopics, 'Ҳанӯз маълумот нест.');
    fillList('#recList', s.recommendations, 'Аввал чанде савол ҳал кун.');

    const h = await api('/user/history?limit=8');
    const hl = $('#historyList');
    hl.innerHTML = '';
    (h.messages || []).forEach((m) => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="v">' + (Number(m.correct) ? '✅' : '❌') + '</span>' +
        esc((m.question || '').slice(0, 90));
      hl.appendChild(li);
    });
    if (!hl.children.length) hl.innerHTML = '<li class="empty">Таърих холӣ аст.</li>';
  } catch (e) {
    if (e.message.indexOf('ворид') >= 0) openAuth();
    else toast(e.message, 'err');
  }
}

function fillList(sel, items, emptyText) {
  const el = $(sel);
  el.innerHTML = '';
  if (!items || !items.length) { el.innerHTML = '<li class="empty">' + emptyText + '</li>'; return; }
  items.forEach((it) => {
    const li = document.createElement('li');
    li.innerHTML = '<span class="v">' + (it.score != null ? it.score + '%' : '') + '</span>' + esc(it.topic || it.text || it);
    el.appendChild(li);
  });
}

async function refreshStreak() {
  try { const r = await api('/statistics/streak'); $('#streakValue').textContent = r.streak || 0; }
  catch (e) { /* идома */ }
}

/* ---------------- UI: воридшавӣ ---------------- */
function openAuth() { $('#authModal').hidden = false; }
function closeAuth() { $('#authModal').hidden = true; }
$('#authBtn').addEventListener('click', () => {
  if (state.token) {
    if (!confirm('Аз аккаунт берӯем?')) return;
    api('/auth/logout', { method: 'POST', body: '{}' }).finally(() => {
      state.token = ''; state.user = null;
      localStorage.removeItem('dono.token');
      updateAuthBtn();
      toast('Шумо берӯдед');
    });
  } else openAuth();
});
$('#authClose').addEventListener('click', closeAuth);
$('#authModal').addEventListener('click', (e) => { if (e.target === $('#authModal')) closeAuth(); });

$('#tgLoginBtn').addEventListener('click', async () => {
  try {
    const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp.initData : '';
    const r = await api('/auth/telegram', { method: 'POST', body: JSON.stringify({ initData: tg, telegram_id: null }) });
    login(r);
  } catch (e) {
    toast('Telegram Login дар ин ҳолат дастрас нест. Рамзро истифода баред.', 'err');
  }
});

$('#codeForm').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const code = $('#codeInput').value.replace(/\D/g, '');
  if (code.length !== 6) return toast('Рамз 6 рақам бояд бошад', 'err');
  try {
    const r = await api('/auth/verify', { method: 'POST', body: JSON.stringify({ code: code }) });
    login(r);
  } catch (e) { toast(e.message, 'err'); }
});

function login(r) {
  state.token = r.token;
  localStorage.setItem('dono.token', r.token);
  state.user = r.user;
  closeAuth();
  updateAuthBtn();
  toast('Хуш омадед, ' + (r.user && r.user.name ? r.user.name : '') + '!', 'ok');
  refreshStreak();
}

function updateAuthBtn() {
  $('#authBtn').textContent = state.token ? 'Аккаунт' : 'Ворид шудан';
}

/* ---------------- UI: пайвасти Telegram ---------------- */
$('#linkBtn').addEventListener('click', async () => {
  try {
    const r = await api('/auth/code', { method: 'POST', body: '{}' });
    const box = $('#linkBox');
    box.hidden = false;
    box.innerHTML = '<div class="card"><b>Рамзи шумо: ' + esc(r.code) + '</b>' +
      '<p class="hint">Дар боти Telegram: <code>/login ' + esc(r.code) + '</code>-ро фиристед.</p></div>';
    const bot = await api('/status');
    if (bot.telegram && bot.telegram.configured) $('#botName').textContent = 'Бот пайваст аст ✅';
  } catch (e) { toast(e.message, 'err'); }
});

/* ---------------- Оғоз ---------------- */
$('#year').textContent = new Date().getFullYear();
$$('.tab').forEach((t) => t.addEventListener('click', () => showView(t.dataset.view)));
$$('.subj').forEach(() => {});
renderSubjectBars();
refreshLevelHint();
updateAuthBtn();
refreshStreak();

/* Telegram WebApp (агар дар дохили бот кушода шавад) */
if (window.Telegram && window.Telegram.WebApp) {
  try { window.Telegram.WebApp.ready(); window.Telegram.WebApp.expand(); } catch (e) { /* идома */ }
}

/* Автонамудани майдони савол */
const ta = $('#chatInput');
ta.addEventListener('input', () => {
  ta.style.height = 'auto';
  ta.style.height = Math.min(120, ta.scrollHeight) + 'px';
});
ta.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#chatForm').dispatchEvent(new Event('submit')); }
});

/* Оғози ҳолати AI (demo ё OpenAI) ва бот */
api('/status').then((r) => {
  state.demo = !!r.demo;
  $('#aiMode').textContent = r.demo ? 'Реҷаи demo (бе OpenAI key)' : ('AI: ' + r.model);
  if (!r.telegram || !r.telegram.configured) {
    /* Боти Telegram танзим нашуда → танҳо рамз */
    const btn = $('#tgLoginBtn');
    if (btn) { btn.hidden = true; }
    const hint = $('#codeForm');
    if (hint) hint.insertAdjacentHTML('afterbegin',
      '<p class="hint">Боти Telegram танзим нашудааст — танҳо рамз кор мекунад.</p>');
    const link = $('#linkBox');
    if (link) $('#botName').textContent = 'Барои пайвастшавӣ TELEGRAM_BOT_TOKEN гузоред.';
  }
}).catch(() => {});
