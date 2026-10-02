/**
 * database.js — қабати нигоҳдории маълумот + repository-ҳои DONO AI.
 *
 * Драйверҳо (ҳар ду ҳамон repository API-ро медиҳанд):
 *   1) `sqlite` — node:sqlite (Node >= 22.5), SQLite-и воқеӣ, бе пакети ҷарӣ
 *   2) `json`   — файли JSON-и содда (ҳамон схема), дар ҳар гуна Node кор мекунад
 *
 * Барои гузаштан ба PostgreSQL танҳо ин файл иваз карда мешавад:
 * ҳар repository-метод як дархест corresponding дар schema.sql дорад.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const log = require('../utils/logger');
const H = require('../utils/helpers');

const DATA_DIR = path.resolve(process.cwd(), 'data');
const JSON_FILE = path.join(DATA_DIR, 'dono-db.json');
const SQLITE_FILE = process.env.DATABASE_URL
  ? path.resolve(process.cwd(), process.env.DATABASE_URL)
  : path.join(DATA_DIR, 'dono.sqlite');

/* ============================================================
   Драйверҳои заминавӣ (primitive)
   ============================================================ */

function normalizeValue(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

class SqliteStore {
  constructor(file) {
    const { DatabaseSync } = require('node:sqlite');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    try { this.db.exec('PRAGMA journal_mode = WAL;'); } catch (e) { /* номуайян */ }
    this.kind = 'sqlite';
  }
  exec(sql) { this.db.exec(sql); }
  close() { try { this.db.close(); } catch (e) { /* номуайян */ } }

  insert(table, row) {
    const keys = Object.keys(row);
    const sql = 'INSERT INTO ' + table + ' (' + keys.join(', ') + ') VALUES (' +
      keys.map(function () { return '?'; }).join(', ') + ')';
    const args = keys.map(function (k) { return normalizeValue(row[k]); });
    this.db.prepare(sql).run.apply(this.db, args);
    return row;
  }
  _where(where) {
    const keys = Object.keys(where || {});
    if (!keys.length) return { sql: '', args: [] };
    return {
      sql: ' WHERE ' + keys.map(function (k) { return k + ' = ?'; }).join(' AND '),
      args: keys.map(function (k) { return normalizeValue(where[k]); })
    };
  }
  select(table, where, opts) {
    const o = opts || {};
    const w = this._where(where);
    let sql = 'SELECT * FROM ' + table + w.sql;
    if (o.orderBy) sql += ' ORDER BY ' + o.orderBy;
    if (o.limit) sql += ' LIMIT ' + parseInt(o.limit, 10);
    if (o.offset) sql += ' OFFSET ' + parseInt(o.offset, 10);
    const stmt = this.db.prepare(sql);
    const rows = stmt.all.apply(stmt, w.args);
    return rows.map(revive);
  }
  update(table, where, patch) {
    const keys = Object.keys(patch);
    if (!keys.length) return 0;
    const w = this._where(where);
    const sql = 'UPDATE ' + table + ' SET ' + keys.map(function (k) { return k + ' = ?'; }).join(', ') + w.sql;
    const args = keys.map(function (k) { return normalizeValue(patch[k]); }).concat(w.args);
    return this.db.prepare(sql).run.apply(this.db, args).changes;
  }
  remove(table, where) {
    const w = this._where(where);
    const sql = 'DELETE FROM ' + table + w.sql;
    return this.db.prepare(sql).run.apply(this.db, w.args).changes;
  }
}

class JsonStore {
  constructor(file) {
    this.file = file;
    this.tables = {};
    this.dirty = false;
    this.kind = 'json';
    this.load();
    this._flush = this._flush.bind(this);
    process.on('exit', this._flush);
    setInterval(this._flush, 2000).unref();
  }
  load() {
    try { this.tables = JSON.parse(fs.readFileSync(this.file, 'utf8')) || {}; }
    catch (e) { this.tables = {}; }
  }
  _flush() {
    if (!this.dirty) return;
    this.dirty = false;
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const tmp = this.file + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(this.tables));
      fs.renameSync(tmp, this.file);
    } catch (e) { log.warn('Навиштани DB нашуд:', e.message); }
  }
  _t(name) { if (!this.tables[name]) this.tables[name] = []; return this.tables[name]; }
  _match(row, where) {
    return Object.keys(where || {}).every(function (k) {
      return String(normalizeValue(where[k])) === String(normalizeValue(row[k]));
    });
  }
  exec() { /* схема дар JSON заминавӣ аст */ }
  close() { this._flush(); }
  insert(table, row) { this._t(table).push(row); this.dirty = true; return row; }
  select(table, where, opts) {
    const o = opts || {};
    let rows = this._t(table).filter((r) => this._match(r, where));
    if (o.orderBy) {
      const parts = String(o.orderBy).split(/\s+/);
      const key = parts[0];
      const dir = (parts[1] || 'asc').toLowerCase() === 'desc' ? -1 : 1;
      rows = rows.slice().sort((a, b) => {
        const av = a[key], bv = b[key];
        if (av === bv) return 0;
        return (av > bv ? 1 : -1) * dir;
      });
    }
    const off = o.offset ? parseInt(o.offset, 10) : 0;
    const lim = o.limit ? parseInt(o.limit, 10) : rows.length;
    return rows.slice(off, off + lim).map(revive);
  }
  update(table, where, patch) {
    const rows = this._t(table);
    let n = 0;
    for (let i = 0; i < rows.length; i++) {
      if (this._match(rows[i], where)) {
        Object.keys(patch).forEach((k) => { rows[i][k] = normalizeValue(patch[k]); });
        n++;
      }
    }
    if (n) this.dirty = true;
    return n;
  }
  remove(table, where) {
    const before = this._t(table).length;
    this.tables[table] = this._t(table).filter((r) => !this._match(r, where));
    const n = before - this._t(table).length;
    if (n) this.dirty = true;
    return n;
  }
}

/** Арзишҳои JSON-ро аз сатр бармегардонед */
function revive(row) {
  const out = {};
  Object.keys(row).forEach(function (k) {
    const v = row[k];
    if (typeof v === 'string' && v.length > 1 && (v[0] === '{' || v[0] === '[')) {
      try { out[k] = JSON.parse(v); return; } catch (e) { /* сатри оддӣ */ }
    }
    out[k] = v;
  });
  return out;
}

/* ============================================================
   Интихоби драйвер
   ============================================================ */

let store = null;

function initStore() {
  if (store) return store;
  const forceJson = String(process.env.FORCE_JSON_DB || '').toLowerCase() === 'true';
  if (!forceJson) {
    try {
      store = new SqliteStore(SQLITE_FILE);
      const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      store.exec(schema);
      log.info('Database: SQLite (' + SQLITE_FILE + ')');
      return store;
    } catch (e) {
      log.warn('node:sqlite дастнорас (' + e.message + ') — ба файли JSON мегузарем');
    }
  }
  store = new JsonStore(JSON_FILE);
  log.info('Database: JSON (' + JSON_FILE + ')');
  return store;
}

/* ============================================================
   Repository-ҳо
   ============================================================ */

const repos = {
  /* Дастрасии мустақим ба store (барои ҳазф/таҳлил) */
  store: function () { return store; },

  /* ---------- users ---------- */
  users: {
    create(data) {
      const row = {
        id: H.id('usr'),
        telegram_id: data.telegram_id || null,
        username: H.cleanString(data.username, 60) || '',
        name: H.cleanString(data.name, 80) || 'Меҳмон',
        grade: H.cleanString(data.grade, 20) || '',
        city: H.cleanString(data.city, 60) || '',
        lang: H.cleanString(data.lang, 5) || 'tj',
        /* Токени меҳмон (X-Device-Id) ҳам қабул карда мешавад */
        token: H.cleanString(data.token, 120) || H.token(),
        created_at: H.nowIso(),
        last_active: H.nowIso()
      };
      return store.insert('users', row);
    },
    byId(uid) { return store.select('users', { id: uid }, { limit: 1 })[0] || null; },
    byTelegram(tgId) {
      if (!tgId) return null;
      return store.select('users', { telegram_id: String(tgId) }, { limit: 1 })[0] || null;
    },
    byToken(tk) {
      if (!tk) return null;
      return store.select('users', { token: tk }, { limit: 1 })[0] || null;
    },
    update(uid, patch) {
      const clean = {};
      ['name', 'username', 'grade', 'city', 'lang', 'telegram_id', 'token'].forEach(function (k) {
        if (patch[k] !== undefined) clean[k] = patch[k];
      });
      return store.update('users', { id: uid }, clean);
    },
    touch(uid) { return store.update('users', { id: uid }, { last_active: H.nowIso() }); },
    list(limit) { return store.select('users', {}, { orderBy: 'created_at DESC', limit: limit || 100 }); },
    count() { return store.select('users', {}, {}).length; }
  },

  /* ---------- sessions ---------- */
  sessions: {
    create(userId, platform) {
      const row = {
        token: H.token(32),
        user_id: userId,
        platform: H.cleanString(platform, 20) || 'web',
        created_at: H.nowIso(),
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
      };
      store.insert('sessions', row);
      return row;
    },
    byToken(tk) {
      if (!tk) return null;
      const s = store.select('sessions', { token: tk }, { limit: 1 })[0];
      if (!s) return null;
      if (s.expires_at && new Date(s.expires_at).getTime() < Date.now()) return null;
      return s;
    },
    remove(tk) { return store.remove('sessions', { token: tk }); }
  },

  /* ---------- login_codes (пайвасткунии Website ↔ Telegram) ---------- */
  loginCodes: {
    create(userId, telegramId) {
      const row = {
        code: H.numericCode(6),
        user_id: userId || null,
        telegram_id: telegramId || null,
        created_at: H.nowIso(),
        consumed: 0
      };
      store.insert('login_codes', row);
      return row;
    },
    active(code) {
      if (!code) return null;
      const row = store.select('login_codes', { code: String(code), consumed: 0 }, { limit: 1 })[0];
      if (!row) return null;
      if (new Date(row.created_at).getTime() < Date.now() - 10 * 60 * 1000) return null;
      return row;
    },
    consume(code) { return store.update('login_codes', { code: String(code) }, { consumed: 1 }); }
  },

  /* ---------- messages (таърихи саволҳо) ---------- */
  messages: {
    create(data) {
      const row = {
        id: H.id('msg'),
        user_id: data.user_id,
        platform: H.cleanString(data.platform, 20) || 'web',
        subject: H.cleanString(data.subject, 40) || '',
        mode: H.cleanString(data.mode, 20) || 'ask',
        question: H.cleanText(data.question, 4000),
        answer: H.cleanText(data.answer, 12000),
        difficulty: H.cleanInt(data.difficulty, 1, 1, 5),
        correct: data.correct === true ? 1 : 0,
        created_at: H.nowIso()
      };
      store.insert('messages', row);
      return row;
    },
    byUser(userId, limit, offset) {
      return store.select('messages', { user_id: userId },
        { orderBy: 'created_at DESC', limit: limit || 50, offset: offset || 0 });
    },
    countByUser(userId) { return store.select('messages', { user_id: userId }, {}).length; },
    correctByUser(userId) { return store.select('messages', { user_id: userId, correct: 1 }, {}).length; },
    bySubject(userId, subject) { return store.select('messages', { user_id: userId, subject: subject }, {}); }
  },

  /* ---------- progress (дониши ҳар мавзӯъ) ---------- */
  progress: {
    get(userId, subject, topic) {
      return store.select('progress',
        { user_id: userId, subject: subject, topic: topic || '' }, { limit: 1 })[0] || null;
    },
    byUser(userId) { return store.select('progress', { user_id: userId }, { orderBy: 'updated_at DESC' }); },
    /** Натиҷаи навро бо миёнаи ҳаракатнок ҳисоб мекунад */
    upsert(data) {
      const key = { user_id: data.user_id, subject: data.subject, topic: data.topic || '' };
      const prev = this.get(data.user_id, data.subject, data.topic);
      if (!prev) {
        const row = {
          user_id: data.user_id, subject: data.subject, topic: data.topic || '',
          score: H.clamp(Math.round(data.score), 0, 100),
          attempts: 1, correct: data.score >= 60 ? 1 : 0,
          updated_at: H.nowIso()
        };
        store.insert('progress', row);
        return row;
      }
      const attempts = prev.attempts + 1;
      const score = Math.round((prev.score * prev.attempts + H.clamp(data.score, 0, 100)) / attempts);
      const patch = {
        score: score, attempts: attempts,
        correct: prev.correct + (data.score >= 60 ? 1 : 0),
        updated_at: H.nowIso()
      };
      store.update('progress', key, patch);
      return Object.assign({}, prev, patch);
    }
  },

  /* ---------- events (барои streak ва статистика) ---------- */
  events: {
    create(userId, type, meta) {
      const row = {
        id: H.id('evt'), user_id: userId || null, type: H.cleanString(type, 40),
        meta: meta || {}, created_at: H.nowIso()
      };
      store.insert('events', row);
      return row;
    },
    byUser(userId, limit) {
      return store.select('events', { user_id: userId },
        { orderBy: 'created_at DESC', limit: limit || 100 });
    },
    activeDays(userId) {
      const rows = store.select('events', { user_id: userId }, {});
      const set = {};
      rows.forEach(function (r) { set[String(r.created_at).slice(0, 10)] = true; });
      return Object.keys(set).sort();
    }
  },

  /* ---------- olympiad_attempts ---------- */
  olympiad: {
    create(userId, level, subject) {
      const row = {
        id: H.id('olm'), user_id: userId, level: H.cleanString(level, 20) || 'beginner',
        subject: H.cleanString(subject, 40) || '', score: 0, total: 0, answers: [],
        created_at: H.nowIso(), finished: 0
      };
      store.insert('olympiad_attempts', row);
      return row;
    },
    byId(aid) { return store.select('olympiad_attempts', { id: aid }, { limit: 1 })[0] || null; },
    finish(aid, data) {
      const patch = {
        score: H.cleanInt(data.score, 0, 0, 1000),
        total: H.cleanInt(data.total, 0, 0, 1000),
        answers: data.answers || [],
        finished: 1
      };
      store.update('olympiad_attempts', { id: aid }, patch);
      return Object.assign({}, this.byId(aid), patch);
    },
    byUser(userId, limit) {
      return store.select('olympiad_attempts', { user_id: userId },
        { orderBy: 'created_at DESC', limit: limit || 50 });
    }
  },

  /* ---------- subject_state (сатҳи адаптивӣ) ---------- */
  subjectState: {
    get(userId, subject) {
      return store.select('subject_state', { user_id: userId, subject: subject }, { limit: 1 })[0] || null;
    },
    set(userId, subject, level) {
      const prev = this.get(userId, subject);
      if (prev) {
        store.update('subject_state', { user_id: userId, subject: subject },
          { level: level, updated_at: H.nowIso() });
      } else {
        store.insert('subject_state',
          { user_id: userId, subject: subject, level: level, updated_at: H.nowIso() });
      }
      return this.get(userId, subject);
    },
    byUser(userId) { return store.select('subject_state', { user_id: userId }, {}); }
  }
};

module.exports = {
  /** Барои драйвери оянда (мисол: PostgreSQL, ки асинхрон аст) → ҳамеша Promise */
  init: function () {
    try { return Promise.resolve(initStore()); }
    catch (e) { return Promise.reject(e); }
  },
  repos: repos,
  store: function () { return store; },
  driver: function () { return store ? store.kind : 'none'; },
  files: { json: JSON_FILE, sqlite: SQLITE_FILE }
};
