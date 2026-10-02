/**
 * helpers.js — ёрдамчиҳои умумӣ: санҷиш, тозакунӣ, формат, ID.
 * Ҳеҷ гуна зависимость надорад.
 */
'use strict';

const crypto = require('crypto');

/* ---------------- ID ва паролҳо ---------------- */

function id(prefix) {
  return (prefix || 'id') + '_' + crypto.randomBytes(9).toString('base64url');
}

function token(bytes) {
  return crypto.randomBytes(bytes || 24).toString('base64url');
}

/** Коди 6-рақама барои воридшавӣ тавассути Telegram */
function numericCode(len) {
  let out = '';
  for (let i = 0; i < (len || 6); i++) out += crypto.randomInt(0, 10);
  return out;
}

/* ---------------- Тозакунӣ (sanitize) ---------------- */

/** Хатҳои идоракуниро ва character-ҳои хатарнокро ҳазф мекунад */
function cleanText(value, maxLen) {
  if (value === null || value === undefined) return '';
  let s = String(value);
  // character-ҳои идоракунӣ (ғайр аз \n ва \t)
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  // zero-width ва character-ҳои пинҳон
  s = s.replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, '');
  s = s.trim();
  if (maxLen && s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

/** Сатрро ба ҳадди муайян меоварад ва тоза мекунад */
function cleanString(value, maxLen) {
  const s = cleanText(value, maxLen);
  return s.replace(/\s+/g, ' ').slice(0, maxLen || 500);
}

/** Рақамро бехатар мехонад */
function cleanInt(value, fallback, min, max) {
  let n = parseInt(value, 10);
  if (Number.isNaN(n)) n = fallback;
  if (min !== undefined && n < min) n = min;
  if (max !== undefined && n > max) n = max;
  return n;
}

function cleanFloat(value, fallback, min, max) {
  let n = parseFloat(value);
  if (Number.isNaN(n)) n = fallback;
  if (min !== undefined && n < min) n = min;
  if (max !== undefined && n > max) n = max;
  return n;
}

/** Массивро бо арзишҳои иҷозатшуда маҳдуд мекунад */
function cleanEnum(value, allowed, fallback) {
  const s = cleanString(value, 40).toLowerCase();
  return allowed.indexOf(s) > -1 ? s : (fallback || allowed[0]);
}

/** Телефони тоҷикиро ба формати +992... меоварад */
function normalizePhone(value) {
  let d = String(value || '').replace(/\D/g, '');
  if (d.startsWith('992')) d = d.slice(3);
  else if (d.length === 9 && d.startsWith('9')) { /* already local */ }
  return d.length === 9 ? '+992' + d : (d ? '+' + d : '');
}

/* ---------------- Санҷиш (validation) ---------------- */

class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code || 'error';
  }
}

function badRequest(message) { return new HttpError(400, message, 'bad_request'); }
function unauthorized(message) { return new HttpError(401, message || 'Дастрасӣ рад шуд', 'unauthorized'); }
function notFound(message) { return new HttpError(404, message || 'Ёфт нашуд', 'not_found'); }

function requireFields(body, fields) {
  const missing = [];
  fields.forEach(function (f) {
    const v = body ? body[f] : undefined;
    if (v === undefined || v === null || (typeof v === 'string' && !v.trim())) missing.push(f);
  });
  if (missing.length) {
    throw badRequest('Майдони ҳатмӣ холӣ аст: ' + missing.join(', '));
  }
}

function assert(condition, message, status) {
  if (!condition) throw new HttpError(status || 400, message, 'assert');
}

/* ---------------- Вақт ---------------- */

function nowIso() { return new Date().toISOString(); }

/** Санаи имрӯз ба формати YYYY-MM-DD (барои streak) */
function todayKey(tzOffsetMinutes) {
  const d = new Date(Date.now() - (tzOffsetMinutes || 0) * 60000);
  return d.toISOString().slice(0, 10);
}

function timeAgo(iso) {
  const t = new Date(iso).getTime();
  if (!t) return '';
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ҳозир';
  if (m < 60) return m + ' дақиқа пеш';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' соат пеш';
  const d = Math.floor(h / 24);
  if (d < 30) return d + ' рӯз пеш';
  return new Date(iso).toLocaleDateString('ru-RU');
}

/* ---------------- Формат ---------------- */

function num(n) {
  return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function pct(n) {
  return Math.round(n || 0) + '%';
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

/** Барграфи матнӣ: 82% → ████████░░ */
function bar(value, width) {
  const w = width || 10;
  const filled = Math.round(clamp(value, 0, 100) / 100 * w);
  return '█'.repeat(filled) + '░'.repeat(w - filled);
}

/* ---------------- Санҷиши Telegram Login ---------------- */

/**
 * Санҷиши имзои Telegram Login Widget.
 * Алгоритми расмӣ: data_check_string = ҳамаи майдонҳо (ғайр аз hash), ба тартиб, бо \n.
 */
function verifyTelegramInitData(initData, botToken) {
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const pairs = [];
  for (const [k, v] of params.entries()) pairs.push(k + '=' + v);
  pairs.sort();
  const dataCheckString = pairs.join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  // Санҷиши қадимӣ (24 соат)
  const authDate = parseInt(params.get('auth_date') || '0', 10);
  if (authDate && Date.now() / 1000 - authDate > 86400) return null;
  try {
    const user = JSON.parse(params.get('user') || 'null');
    return user || null;
  } catch (e) {
    return null;
  }
}

/** Маълумоти корбарро объекти мустаҳкам мегардонед */
function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    username: u.username || '',
    grade: u.grade || '',
    city: u.city || '',
    telegram_id: u.telegram_id || null,
    linked_telegram: !!u.telegram_id,
    created_at: u.created_at,
    last_active: u.last_active
  };
}

module.exports = {
  id, token, numericCode,
  cleanText, cleanString, cleanInt, cleanFloat, cleanEnum, normalizePhone,
  HttpError, badRequest, unauthorized, notFound, requireFields, assert,
  nowIso, todayKey, timeAgo,
  num, pct, clamp, bar,
  verifyTelegramInitData, publicUser
};
