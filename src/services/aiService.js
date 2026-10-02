/**
 * aiService.js — як манбаи ягонаи AI барои Website ва Telegram Bot.
 *
 * • OpenAI Responses API (POST /v1/responses)
 * • Калид ТАНҘО дар ин файл (backend) кор мекунад — ба frontend ҳеҷ гоҳ намеравад.
 * • Агар OPENAI_API_KEY холӣ бошад → «демо-режим» (сайт ва бот кор мекунанд,
 *   вале ҷавобҳо намунавӣ мебошанд).
 */
'use strict';

const log = require('../utils/logger');
const H = require('../utils/helpers');

const API_URL = 'https://api.openai.com/v1/responses';
const API_KEY = (process.env.OPENAI_API_KEY || '').trim();
const MODEL = (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim();
const DEMO = String(process.env.AI_DEMO_MODE || 'true').toLowerCase() !== 'false' && !API_KEY;

/* ============================================================
   Фанҳо (марказӣ — Website ва Telegram аз ин рӯйхат истифода мебаранд)
   ============================================================ */

const SUBJECTS = {
  chemistry: { id: 'chemistry', name: 'Химия', emoji: '🧪', en: 'Chemistry', icon: 'flask' },
  biology: { id: 'biology', name: 'Биология', emoji: '🧬', en: 'Biology', icon: 'dna' },
  math: { id: 'math', name: 'Математика', emoji: '📐', en: 'Mathematics', icon: 'ruler' },
  physics: { id: 'physics', name: 'Физика', emoji: '⚡', en: 'Physics', icon: 'bolt' }
};

function subjectOf(raw) {
  const s = H.cleanString(raw, 40).toLowerCase();
  if (!s) return null;
  if (SUBJECTS[s]) return SUBJECTS[s];
  const byEn = Object.keys(SUBJECTS).find((k) => SUBJECTS[k].en.toLowerCase() === s);
  return byEn ? SUBJECTS[byEn] : null;
}

function subjectList() { return Object.keys(SUBJECTS).map((k) => SUBJECTS[k]); }

/* ============================================================
   System prompt (қоидаҳои 12-гона аз ТЗ)
   ============================================================ */

function buildSystemPrompt(subject, extra) {
  const s = subjectOf(subject);
  const lines = [
    'Ту DONO AI ҳастӣ — ёвари зеҳни сунъии таълимӣ барои хонандагон.',
    'Ҳадафи ту танҳо додани ҷавоб нест: ту бояд ба хонанда кӯмак кунӣ, ки мавзӯъро ФАҲМАД.',
    '',
    'Қоидаҳо:',
    '1. Ба забони тоҷикӣ ҷавоб деҳ (ҳарфи кириллӣ).',
    '2. Агар корбар забони дигар талаб кунад, ба ҳамон забон ҷавоб деҳ.',
    '3. Барои масъалаҳо қадам ба қадам кор кун ва ҳар қадамро шарҳ деҳ.',
    '4. Формулаҳоро нишон деҳ ва арзишҳои ҳар як ишораро фаҳмон деҳ.',
    '5. Хатои хонандаро муайян кун.',
    '6. Сабаби хатогиро шарҳ деҳ.',
    '7. Барои омӯзиш саволи нав пешниҳод кун.',
    '8. Душвории саволро муайян кун (1 — сахт не, 5 — олимпиадавӣ).',
    '9. Барои олимпиада масъалаҳои мураккаб пешниҳод кун.',
    '10. Маълумоти сохта (галлюцинатсия) пешниҳод накун.',
    '11. Агар ҷавобро аниқ надонӣ, инро равшан бигӯй.',
    '12. Нақши омӯзгорро иваз накун; танҳо барои фанҳои табиӣ ва риёзӣ ҷавоб деҳ.',
    '',
    'Шакли ҷавоб:',
    '• Аввал ҷавоби кӯтоҳ, баъд қадамҳои ҳал, баъд шарҳи ҳосил.',
    '• Аз emoji ва рамзҳои зиёд истифода накун.',
    '• Дар охир як саволи наздик (машқ) пешниҳод кун.'
  ];
  if (s) lines.push('', 'Фаъолияти ҳозира: ' + s.name + ' (' + s.en + ').');
  if (extra) lines.push('', extra);
  return lines.join('\n');
}

const ANALYZE_SCHEMA = {
  type: 'object',
  properties: {
    correct: { type: 'boolean', description: 'Ҷавоби хонанда дуруст аст?' },
    subject: { type: 'string' },
    topic: { type: 'string', description: 'Мавзӯи масъала' },
    difficulty: { type: 'integer', description: '1 то 5' },
    mistake: { type: 'string', description: 'Хатогии муайяншуда (агар ҳаст)' },
    explanation: { type: 'string', description: 'Шарҳи қадам ба қадам' },
    correctAnswer: { type: 'string', description: 'Ҷавоби дуруст' },
    nextQuestion: { type: 'string', description: 'Машқи нав барои ҳамон мавзӯъ' }
  },
  required: ['correct', 'subject', 'topic', 'difficulty', 'mistake', 'explanation',
    'correctAnswer', 'nextQuestion'],
  additionalProperties: false
};

/* ============================================================
   Даъвати Responses API
   ============================================================ */

async function callResponses(payload, timeoutMs) {
  if (!API_KEY) {
    const err = new Error('OPENAI_API_KEY гузошта нашудааст');
    err.code = 'no_key';
    throw err;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || 45000);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const text = await res.text();
    if (!res.ok) {
      let msg = 'OpenAI ' + res.status;
      try { msg = (JSON.parse(text).error && JSON.parse(text).error.message) || msg; } catch (e) { /* оддӣ */ }
      const err = new Error(msg);
      err.code = 'openai_' + res.status;
      throw err;
    }
    const data = JSON.parse(text);
    let out = data.output_text;
    if (!out && Array.isArray(data.output)) {
      out = data.output
        .filter((b) => b && b.type === 'message' && Array.isArray(b.content))
        .map((b) => b.content.filter((c) => c && c.type === 'output_text').map((c) => c.text).join(''))
        .join('\n');
    }
    return (out || '').trim();
  } finally {
    clearTimeout(timer);
  }
}

/** JSON-ро аз ҷавоби AI мебардорад (агал model онро дар ```json гузошта бошад) */
function extractJson(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  let s = String(raw).trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start > -1 && end > start) s = s.slice(start, end + 1);
  try { return JSON.parse(s); } catch (e) { return null; }
}

/** Матнро ба порсияҳои 3500 аломатӣ ҷудо мекунад (барои Telegram) */
function chunk(text, size) {
  const out = [];
  let s = String(text || '');
  const n = size || 3500;
  while (s.length > n) {
    let cut = s.lastIndexOf('\n', n);
    if (cut < n * 0.5) cut = s.lastIndexOf(' ', n);
    if (cut < 1) cut = n;
    out.push(s.slice(0, cut));
    s = s.slice(cut);
  }
  if (s) out.push(s);
  return out;
}

/* ============================================================
   1) Саволу ҷавоб
   ============================================================ */

async function ask(opts) {
  const o = opts || {};
  const question = H.cleanText(o.question, 4000);
  H.assert(question, 'Савол холӣ аст');
  const subject = subjectOf(o.subject);
  const level = H.cleanString(o.level, 20) || 'medium';
  const history = Array.isArray(o.history) ? o.history.slice(-6) : [];

  const input = [];
  history.forEach(function (h) {
    if (h && h.question) input.push({ role: 'user', content: h.question });
    if (h && h.answer) input.push({ role: 'assistant', content: h.answer });
  });
  input.push({
    role: 'user',
    content: 'Савол (' + (subject ? subject.name : 'Умумӣ') + ', сатҳ: ' + level + '):\n' + question
  });

  if (DEMO) {
    return {
      answer: demoAsk(question, subject),
      difficulty: 2,
      topic: subject ? subject.name : 'Умумӣ',
      model: 'demo',
      demo: true
    };
  }

  const out = await callResponses({
    model: MODEL,
    instructions: buildSystemPrompt(subject && subject.id,
      'Сатҳи дархости хонанда: ' + level + '. Агар савол норавшан бошад, аввал саоли равшанкунӣ пурс.'),
    input: input,
    temperature: 0.4,
    max_output_tokens: 1400
  });

  H.assert(out, 'AI ҷавоб надод');
  return {
    answer: out,
    difficulty: estimateDifficulty(question),
    topic: subject ? subject.name : 'Умумӣ',
    model: MODEL,
    demo: false
  };
}

/* ============================================================
   2) Таҳлили хато (Error Analyzer)
   ============================================================ */

async function analyze(opts) {
  const o = opts || {};
  const question = H.cleanText(o.question, 4000);
  const studentAnswer = H.cleanText(o.studentAnswer, 2000);
  H.assert(question, 'Масъала холӣ аст');
  H.assert(studentAnswer, 'Ҷавоби хонанда холӣ аст');
  const subject = subjectOf(o.subject);

  const prompt = [
    'Масъала:',
    question,
    '',
    'Ҷавоби хонанда:',
    studentAnswer,
    '',
    'Ин ҷавобро санҷ кун, хатогиро ёб, сабабашро шарҳ деҳ ва машқи нав деҳ.'
  ].join('\n');

  if (DEMO) {
    return Object.assign({
      demo: true, model: 'demo',
      subject: subject ? subject.en : 'General',
      difficulty: 2, topic: '—'
    }, demoAnalyze(question, studentAnswer));
  }

  const out = await callResponses({
    model: MODEL,
    instructions: buildSystemPrompt(subject && subject.id,
      'Ту ҳоло дар режими «Таҳлили хато» ҳастӣ. ҶавобРО ТАНҲО бо JSON (schema-и додашуда) деҳ.'),
    input: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_output_tokens: 1200,
    text: {
      format: {
        type: 'json_schema',
        name: 'dono_error_analysis',
        schema: ANALYZE_SCHEMA,
        strict: true
      }
    }
  });

  const parsed = extractJson(out);
  H.assert(parsed, 'Ҷавоби AI хонда нашуд');
  return {
    correct: !!parsed.correct,
    subject: parsed.subject || (subject ? subject.en : 'General'),
    topic: parsed.topic || '—',
    difficulty: H.clamp(H.cleanInt(parsed.difficulty, 2, 1, 5), 1, 5),
    mistake: parsed.mistake || '',
    explanation: parsed.explanation || '',
    correctAnswer: parsed.correctAnswer || '',
    nextQuestion: parsed.nextQuestion || '',
    model: MODEL,
    demo: false
  };
}

/* ============================================================
   3) Масъала бо акс (Vision)
   ============================================================ */

async function solveImage(opts) {
  const o = opts || {};
  const base64 = H.cleanString(o.imageBase64, 12 * 1024 * 1024);
  H.assert(base64, 'Акси масъала нест');
  const mime = H.cleanString(o.mime, 60) || 'image/jpeg';
  const subject = subjectOf(o.subject);
  const note = H.cleanText(o.question, 1000);

  if (DEMO) {
    return {
      extracted: '(демо-режим) Матни акс хонда нашуд — OPENAI_API_KEY гузошта нашудааст.',
      solution: demoImage(),
      difficulty: 3, topic: subject ? subject.name : '—', model: 'demo', demo: true
    };
  }

  const prompt = [
    'Акси масъалаи китоб ё дафтар гирифта шудааст.',
    '1) Матни масъаларо дақиқ хон ва навис (агар ҳарфҳои дастӣ хунок ҳастанд, ҳадди аксарро фаҳм).',
    '2) Масъаларо қадам ба қадам ҳал кун.',
    '3) Формулаҳоро нишон деҳ.',
    note ? ('Шарҳи иловагии хонанда: ' + note) : ''
  ].filter(Boolean).join('\n');

  const out = await callResponses({
    model: MODEL,
    instructions: buildSystemPrompt(subject && subject.id,
      'Режими «Масъала бо акс». Аввал матни акс, баъд ҳол.'),
    input: [{
      role: 'user',
      content: [
        { type: 'input_text', text: prompt },
        { type: 'input_image', image_url: 'data:' + mime + ';base64,' + base64 }
      ]
    }],
    temperature: 0.2,
    max_output_tokens: 1600
  });

  H.assert(out, 'AI ҷавоб надод');
  return {
    extracted: out,
    solution: out,
    difficulty: 3,
    topic: subject ? subject.name : '—',
    model: MODEL,
    demo: false
  };
}

/* ============================================================
   4) Олимпиада — масъалаҳо мувофиқи сатҳ
   ============================================================ */

const LEVELS = {
  beginner: { id: 'beginner', name: 'Навомад', emoji: '🟢', en: 'Beginner' },
  intermediate: { id: 'intermediate', name: 'Миёна', emoji: '🟡', en: 'Intermediate' },
  advanced: { id: 'advanced', name: 'Мураккаб', emoji: '🔴', en: 'Advanced' },
  olympiad: { id: 'olympiad', name: 'Олимпиада', emoji: '🏆', en: 'Olympiad' }
};

function levelOf(raw) {
  const s = H.cleanString(raw, 20).toLowerCase();
  /* Алиасҳо: сатҳҳои UI ва бот → сатҳҳои дохилӣ */
  const alias = {
    easy: 'beginner', beginner: 'beginner', green: 'beginner',
    medium: 'intermediate', intermediate: 'intermediate', normal: 'intermediate',
    hard: 'advanced', advanced: 'advanced', difficult: 'advanced',
    olympiad: 'olympiad', champion: 'olympiad'
  };
  const key = alias[s] || s;
  return LEVELS[key] ? LEVELS[key] : LEVELS.beginner;
}

async function olympiadQuestions(opts) {
  const o = opts || {};
  const level = levelOf(o.level);
  const subject = subjectOf(o.subject);
  const count = H.cleanInt(o.count, 3, 1, 5);
  const prompt = [
    level.count ? '' : '',
    count + ' масъалаи ' + level.name + ' барои ' + (subject ? subject.name : 'фанҳои табиӣ') + ' соз.',
    'Ҳар масъала бояд: матн, 4 варианти ҷавоб (A/B/C/D), ҷавоби дуруст ва шарҳи кӯтоҳ дошта бошад.',
    'Фақат JSON дар шакли рӯйхат: [{"question":"...","options":["A","B","C","D"],"answer":"B","explanation":"..."}]'
  ].filter(Boolean).join('\n');

  if (DEMO) {
    return {
      level: level.id,
      subject: subject ? subject.id : 'mixed',
      questions: demoOlympiad(subject, level, count).map(normalizeQuestion),
      demo: true
    };
  }

  const out = await callResponses({
    model: MODEL,
    instructions: buildSystemPrompt(subject && subject.id,
      'Режими «Олимпиада». Масъалаҳо бояд мувофиқи сатҳи ' + level.name + ' бошанд. ТАНҲО JSON.'),
    input: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    max_output_tokens: 1800,
    text: {
      format: {
        type: 'json_schema',
        name: 'dono_olympiad_set',
        schema: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  options: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
                  answer: { type: 'string' },
                  explanation: { type: 'string' }
                },
                required: ['question', 'options', 'answer', 'explanation'],
                additionalProperties: false
              }
            }
          },
          required: ['questions'],
          additionalProperties: false
        },
        strict: true
      }
    }
  });

  const parsed = extractJson(out);
  const list = parsed && Array.isArray(parsed.questions) ? parsed.questions : (Array.isArray(parsed) ? parsed : []);
  H.assert(list.length, 'Масъалаҳо ҳосил нашуд');
  return {
    level: level.id, subject: subject ? subject.id : 'mixed',
    questions: list.slice(0, count).map(normalizeQuestion), demo: false
  };
}

function normalizeQuestion(q) {
  const options = (q.options || []).slice(0, 4).map((x) => H.cleanText(x, 200));
  const answer = H.cleanText(q.answer, 200);
  let answerIndex = -1;

  if (options[Number(q.answerIndex)] !== undefined) {
    answerIndex = Number(q.answerIndex);
  } else {
    const letter = answer.toUpperCase().match(/^([A-D])[\).:\-\s]/);
    if (letter) answerIndex = letter[1].charCodeAt(0) - 65;
    else {
      const found = options.findIndex((o) => o.trim().toLowerCase() === answer.trim().toLowerCase());
      answerIndex = found;
    }
  }
  if (answerIndex < 0 || answerIndex > 3) answerIndex = 0;

  return {
    question: H.cleanText(q.question, 800),
    options: options,
    answer: answer || options[answerIndex] || '',
    answerIndex: answerIndex,
    explanation: H.cleanText(q.explanation, 900)
  };
}

/* ============================================================
   Демо-режим (агар калид нест)
   ============================================================ */

function demoAsk(question, subject) {
  return [
    '⚠️ ДЕМО-РЕЖИМ: OPENAI_API_KEY дар .env гузошта нашудааст.',
    '',
    'Ман саволи шуморо қабул кардам:',
    '«' + question.slice(0, 200) + '»',
    '',
    'Барои ҷавоби воқеӣ:',
    '1. https://platform.openai.com/api-keys — калид гиред',
    '2. Дар .env бинависед: OPENAI_API_KEY=sk-...',
    '3. Серверро дубора оғоз кунед (npm start)',
    '',
    'Мавзӯи интихобшуда: ' + (subject ? subject.name : 'умумӣ') + '.',
    'Ҳар ду канали (Website ва Telegram Bot) аз ҳамин AI Service истифода мебаранд —',
    'як мавзӯъ, як база, як ҷавоб.'
  ].join('\n');
}

function demoAnalyze(question, studentAnswer) {
  return {
    correct: false,
    topic: 'Демо (бе AI)',
    difficulty: 2,
    mistake: 'AI санҷиш накард — OPENAI_API_KEY гузошта нашудааст.',
    explanation: [
      'Дар демо-режим таҳлили воқеӣ имконпазир нест.',
      'Ҳангоми гузоштани калид, ин ҷо қадамҳои пурраи таҳлил пайдо мешавад:',
      '• ҷойи хатогӣ • сабаб • ҷавоби дуруст • машқи нав'
    ].join('\n'),
    correctAnswer: '— (бо AI ҳисоб мешавад)',
    nextQuestion: 'Масъалаи монанд ба ин масъала (бо AI сохта мешавад)'
  };
}

function demoImage() {
  return [
    '⚠️ ДЕМО-РЕЖИМ: барои хондани акс OPENAI_API_KEY лозим аст (модели vision, масалан gpt-4o-mini).',
    '',
    'Қадамҳо:',
    '1. OPENAI_API_KEY-ро дар .env гузоред',
    '2. OPENAI_MODEL=gpt-4o-mini (ё дигар модели vision)',
    '3. npm start'
  ].join('\n');
}

function demoOlympiad(subject, level, count) {
  const bank = {
    chemistry: [
      { question: 'Молекулаи об (H₂O) чанд ҳосили элемент дорад?', options: ['1', '2', '3', '4'], answer: '2', explanation: 'Об аз 2 атоми ҳидроген ва 1 атоми оксиген иборат аст.' },
      { question: 'Массаи моларии H₂SO₄ чанд аст? (H=1, S=32, O=16)', options: ['96 г/мол', '98 г/мол', '100 г/мол', '94 г/мол'], answer: '98 г/мол', explanation: '2·1 + 32 + 4·16 = 2 + 32 + 64 = 98 г/мол.' },
      { question: 'pH-и ҳал набуда (нейтралӣ) дар 25°C чанд аст?', options: ['0', '7', '10', '14'], answer: '7', explanation: 'Дар 25°C об [H⁺] = 10⁻⁷ мол/л, бинобар ин pH = 7.' }
    ],
    physics: [
      { question: 'Қонуни дуюми Ньютонро интихоб кунед.', options: ['F = ma', 'E = mc²', 'P = UI', 'v = s/t'], answer: 'F = ma', explanation: 'Қувват = масса × шитоб (F = ma).' },
      { question: 'Суръати рӯшноӣ дар холӣ тақрибан чанд аст?', options: ['3·10⁶ м/с', '3·10⁸ м/с', '3·10¹⁰ м/с', '3·10⁴ м/с'], answer: '3·10⁸ м/с', explanation: 'c ≈ 299 792 458 м/с ≈ 3·10⁸ м/с.' }
    ],
    math: [
      { question: 'Асоси квадратӣ: x² − 5x + 6 = 0. Решаҳо?', options: ['x = 2, 3', 'x = −2, −3', 'x = 1, 6', 'x = −1, −6'], answer: 'x = 2, 3', explanation: 'D = 25 − 24 = 1; x = (5 ± 1)/2 → 3 ва 2.' },
      { question: 'sin 30° чанд аст?', options: ['1/2', '√2/2', '√3/2', '1'], answer: '1/2', explanation: 'sin 30° = 0.5.' }
    ],
    biology: [
      { question: 'Органеллаи «қуввати» ҳуҷайраро интихоб кунед.', options: ['Митохондрия', 'Рибосома', 'Ядро', 'Апарати Голҷӣ'], answer: 'Митохондрия', explanation: 'Митохондрия АТФ-ро ҳосил мекунад.' },
      { question: 'ДНО-и ҳуҷайраи инсон дар куҷо ҷойгир аст?', options: ['Дар ядро', 'Дар ситоплазма', 'Дар мембрана', 'Дар рибосома'], answer: 'Дар ядро', explanation: 'ДНО дар ядро, дар шакли хромосомаҳо ҷойгир аст.' }
    ]
  };
  const key = subject ? subject.id : 'chemistry';
  const src = bank[key] || bank.chemistry;
  const out = [];
  for (let i = 0; i < count; i++) out.push(Object.assign({}, src[i % src.length]));
  return out;
}

/* ============================================================
   Душвории тахминӣ (барои progress)
   ============================================================ */

function estimateDifficulty(question) {
  const q = String(question || '');
  let d = 1;
  if (q.length > 120) d++;
  if (/\b(докажите|докаж|оллимпи|олимпиад|производн|интеграл|равновеси|термодинам|органическ|генетик)/i.test(q)) d += 2;
  if (/\d/.test(q)) d++;
  return H.clamp(d, 1, 5);
}

module.exports = {
  SUBJECTS, subjectOf, subjectList,
  LEVELS, levelOf,
  ask, analyze, solveImage, olympiadQuestions,
  buildSystemPrompt, extractJson, chunk,
  isDemo: function () { return DEMO; },
  model: MODEL
};
