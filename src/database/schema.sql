-- ============================================================
--  DONO AI — схемаи маълумотҳо
--  Ин файл схемаи каноникии релятсионии лоиҳа аст.
--  Дар Node >= 22.5 бо `node:sqlite` (SQLite-и воқеӣ) иҷро мешавад.
--  Барои PostgreSQL ин ҳамон DDL (бо сабри каме) кор мекунад —
--  танҳо `database.js`-ро иваз кардан лозим аст (repository API устувор аст).
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  telegram_id   TEXT UNIQUE,
  username      TEXT DEFAULT '',
  name          TEXT DEFAULT '',
  grade         TEXT DEFAULT '',
  city          TEXT DEFAULT '',
  lang          TEXT DEFAULT 'tj',
  token         TEXT DEFAULT '',
  created_at    TEXT NOT NULL,
  last_active   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  platform    TEXT DEFAULT 'web',
  created_at  TEXT NOT NULL,
  expires_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS login_codes (
  code         TEXT PRIMARY KEY,
  user_id      TEXT,
  telegram_id  TEXT,
  created_at   TEXT NOT NULL,
  consumed     INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS messages (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  platform     TEXT DEFAULT 'web',
  subject      TEXT DEFAULT '',
  mode         TEXT DEFAULT 'ask',
  question     TEXT DEFAULT '',
  answer       TEXT DEFAULT '',
  difficulty   INTEGER DEFAULT 1,
  correct      INTEGER DEFAULT 0,
  created_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id, created_at);

CREATE TABLE IF NOT EXISTS progress (
  user_id    TEXT NOT NULL,
  subject    TEXT NOT NULL,
  topic      TEXT DEFAULT '',
  score      INTEGER DEFAULT 0,
  attempts   INTEGER DEFAULT 0,
  correct    INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, subject, topic)
);

CREATE TABLE IF NOT EXISTS events (
  id         TEXT PRIMARY KEY,
  user_id    TEXT,
  type       TEXT NOT NULL,
  meta       TEXT DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id, created_at);

CREATE TABLE IF NOT EXISTS olympiad_attempts (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  level      TEXT DEFAULT 'beginner',
  subject    TEXT DEFAULT '',
  score      INTEGER DEFAULT 0,
  total      INTEGER DEFAULT 0,
  answers    TEXT DEFAULT '[]',
  created_at TEXT NOT NULL,
  finished   INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_olympiad_user ON olympiad_attempts(user_id, created_at);

CREATE TABLE IF NOT EXISTS subject_state (
  user_id    TEXT NOT NULL,
  subject    TEXT NOT NULL,
  level      TEXT DEFAULT 'easy',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, subject)
);
