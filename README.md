# DONO AI — Омӯз. Фаҳм. Пешравӣ кун.

> **Ёвари зеҳни сунъии ту барои химия, биология, математика ва физика.**

Низоми зеҳни сунъӣ барои донишҷӯён, ки **як backend, як пойгоҳи додаҳо ва як AI**-ро
барои **Website** ва **Telegram Bot** истифода мебарад. Саволҳо, натиҷаҳо ва
статистикаи хонанда ҳар ду ҷо (сайт ва бот) якхела намоиш дода мешаванд.

---

## 1. Имкониятҳо

| Қисмат | Тавсиҳ |
|---|---|
| 💬 **AI Chat** | Саволу ҷавоб бо интихоби фан, таърих, эффекти машинӣ, нусхагирӣ, пок кардан |
| 🧪🧬📐⚡ **4 фан** | Химия, Биология, Математика, Физика |
| 🔍 **Таҳлили хато** | Ҷавоби хонанда таҳлил карда мешавад → `{correct, subject, topic, difficulty, mistake, explanation, correctAnswer, nextQuestion}` |
| 📈 **Омӯзиши адаптивӣ** | Осон → Миёна → Душвор → Олимпиада (бо ҳар хатогӣ сатҳ паст мешавад), холати ҳар фан ва ҳар мавзӯъ |
| 📊 **Кабинети хонанда** | Диаграммаи дониш, мавзӯъҳои заиф/қави, силсилаи рӯзҳо (streak), тавсияҳо |
| 🏆 **Олимпиада** | 4 сатҳ: 🟢 Осон · 🟡 Миёна · 🔴 Душвор · 🏆 Олимпиада |
| 📷 **Масъала бо акс** | Акс → AI Vision → матн + ҳал |
| ✈️ **Telegram Bot** | `/start /help /subjects /chemistry /biology /math /physics /olympiad /profile /stats /login` |
| 🔗 **Пайвастшавӣ** | Аккаунти сайт ↔ Telegram (рамзи 6-рақама ё Telegram Login) |

**Технология:** HTML5 · CSS3 · Vanilla JS (mobile-first) · Node.js · Express ·
SQLite (бо имкони гузаштан ба PostgreSQL) · Telegram Bot API (webhook) · OpenAI **Responses API** (калид танҳо дар backend).

---

## 2. Сохтори лоиҳа

```
dono-ai/
├── package.json            # боғландаҳо ва скриптҳо
├── .env.example            # намунаи танзимот
├── .env                    # танзимоти ҳақиқӣ (ба Git намеравад)
├── .gitignore
├── .node-version           # 22 (барои node:sqlite)
├── railway.json            # танзимоти Railway
├── README.md
├── public/                 # сайт (mobile-first)
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── manifest.json
│   └── assets/logo.svg
└── src/
    ├── server.js           # сервери ягона (API + сайт + webhook)
    ├── bot-poll.js         # реҷаи маҳаллӣ (polling) барои бот
    ├── database/
    │   ├── schema.sql      # схемаи SQL
    │   └── database.js     # SqliteStore / JsonStore + repository-ҳо
    ├── services/
    │   ├── aiService.js    # OpenAI Responses API + демо-режим
    │   ├── telegramService.js
    │   └── analyticsService.js
    ├── routes/
    │   ├── ai.js           # 4 ё 5 ниқоби AI
    │   ├── auth.js         # воридшавӣ / рамз
    │   ├── users.js        # профил, прогресс, таърих
    │   └── statistics.js   # статистика
    └── utils/
        ├── helpers.js
        └── logger.js
```

---

## 3. Оғоз (маҳаллӣ)

### 3.1. Лозим аст
* **Node.js ≥ 18.17** (барои `node:sqlite` → **Node ≥ 22.5**, дар ҳолати дигар пойгоҳи JSON-и дохилӣ кор мекунад)
* npm
* (ихтиёрӣ) Токени бот аз [@BotFather](https://t.me/BotFather)
* (ихтиёрӣ) Калиди OpenAI — `https://platform.openai.com/api-keys`

### 3.2. Насб

```bash
cd dono-ai
npm install
```

### 3.3. Танзимоти муҳит

```bash
cp .env.example .env
```

`.env`-ро кушоед ва пур намоед:

```env
PORT=3000
PUBLIC_URL=http://localhost:3000

OPENAI_API_KEY=sk-...          # холӣ ҳам кор мекунад → демо-режим
OPENAI_MODEL=gpt-4o-mini

TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_WEBHOOK_SECRET=калиди_тахмина_дароз

DATABASE_URL=./data/dono.sqlite
FORCE_JSON_DB=false
```

> **Демо-режим:** агар `OPENAI_API_KEY` холӣ бошад, низом бо ҷавобҳои
> дохилӣ (дар `src/services/aiService.js`) кор мекунад — барои тести UI
> ва санҷиши сервер бе маблағ хуб аст. Ҳамон ҳолат барои бот низ дуруст аст.

### 3.4. Оғози сервер

```bash
npm start          # ё npm run dev (бо --watch)
```

Сайт: **http://localhost:3000**

Санҷиши саломатӣ:

```bash
curl http://localhost:3000/health
```

---

## 4. Тести API (13 нуқта)

| # | Усул | Роҳ | Маъно |
|---|---|---|---|
| 1 | GET | `/health` | саломатии сервер |
| 2 | GET | `/api/status` | ҳолати AI, фанҳо, бот |
| 3 | POST | `/api/ai/ask` | саволу ҷавоб |
| 4 | POST | `/api/ai/analyze` | таҳлили хато |
| 5 | POST | `/api/ai/image` | ҳали масъала бо акс (base64) |
| 6 | POST | `/api/ai/olympiad` | масъалаҳои олимпиада |
| 7 | POST | `/api/ai/olympiad/finish` | сабти натиҷаи тест |
| 8 | POST | `/api/auth/telegram` | ворид бо Telegram |
| 9 | POST | `/api/auth/code` | гирифтани рамзи пайвасткунӣ |
| 10 | POST | `/api/auth/verify` | ворид бо рамз |
| 11 | GET | `/api/auth/me` | корбари ҳозира |
| 12 | GET | `/api/user/profile` · `/api/user/progress` · `/api/user/history` · `PATCH /api/user/profile` | профил |
| 13 | GET | `/api/statistics/me` · `/api/statistics/streak` · `/api/statistics/global` | статистика |

Мисол:

```bash
curl -X POST http://localhost:3000/api/ai/ask \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: test-1" \
  -d '{"question":"Кислота ва асос чист?","subject":"chemistry"}'
```

Ҳар дархост `X-Device-Id` мегирад (меҳмон) ё `Authorization: Bearer <token>`
(пас аз воридшавӣ).

---

## 5. Telegram Bot

### 5.1. Сохтани бот
1. Дар Telegram [@BotFather](https://t.me/BotFather)-ро кушоед → `/newbot`
2. Ном ва username-ро ворид кунед
3. Токенро (`123456789:AAE...`) ба `.env` дар `TELEGRAM_BOT_TOKEN` гузоред

### 5.2. Реҷаи маҳаллӣ (polling)

```bash
npm run bot
```

Бот дар ҳолати маҳаллӣ webhook талаб намекунад.

### 5.3. Реҷаи webhook (production)

Агар сайт бо домени дастрас (`PUBLIC_URL`) кор кунад:

```bash
WEBHOOK_URL=https://your-app.up.railway.app npm run bot
```

Ин фармон webhook-ро ба `https://your-app.up.railway.app/telegram/webhook`
гузошта мешавад. `server.js` ҳар навсозиро бо
`X-Telegram-Bot-Api-Secret-Token` (агар дар `.env` гузошта бошад) санҷида,
ба `services/telegramService.js` мегузаронад — **ҳамон AI, ҳамон пойгоҳи додаҳо**.

### 5.4. Фармонҳои бот

```
/start       → салом ва маълумот
/help        → ёрӣ
/subjects    → интихоби фан
/chemistry /biology /math /physics   → савол дар фан
/olympiad    → олимпиада (🟢 🟡 🔴 🏆)
/profile     → профил ва сатҳи адаптивӣ
/stats       → статистика ва streak
/login       → рамзи пайвасткунии Website ↔ Telegram
```

---

## 6. Пайвасткунии Website ↔ Telegram

1. Дар сайт → **Кабинети ман → Пайваст кунии Telegram → Рамз гир** (рамзи 6-рақама)
2. Дар бот: `/login 123456`
3. Аккаунтҳо пайваст мешаванд → саволҳо, натиҷаҳо ва статистика якхела мешаванд

Дар сайти Telegram WebApp (`Telegram.Login`) тугмаи **«Ворид бо Telegram»** низ кор мекунад.

---

## 7. Railway (deploy)

1. Лоиҳаро дар GitHub гузоред: `git push`
2. Дар [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
3. Дар **Variables** ин арзишҳоро илова кунед:

| Калид | Арзиш |
|---|---|
| `OPENAI_API_KEY` | `sk-...` (калиди OpenAI) |
| `TELEGRAM_BOT_TOKEN` | токени бот аз BotFather |
| `DATABASE_URL` | `./data/dono.sqlite` (SQLite) ё `postgres://user:pass@host:5432/db` |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `PORT` | `3000` (Railway худаш низ мегузорад) |

4. **Settings → Networking → Generate Domain** → домени озод (`https://...up.railway.app`)
5. Дар **Variables** ҳамчунин илова кунед: `PUBLIC_URL` ва `TELEGRAM_WEBHOOK_SECRET`
6. Webhook-ро гузоред:

```bash
WEBHOOK_URL=https://your-app.up.railway.app npm run bot
```

7. Санҷиш: `https://your-app.up.railway.app/health` → `{"ok":true,...}`

> **Пойгоҳи додаҳо:** дар Railway ҳар гуна диск (`Volume`) барои SQLite лозим
> аст, агар додаҳо бо deployments тоза нашаванд. Барои маҳаллӣ `data/` кӯшиш
> карда мешавад; ҳангоми гузаштан ба PostgreSQL танҳо `src/database/database.js`
> иваз карда мешавад (repository-ҳо ҳамон мемонданд).

---

## 8. Амният

* **helmet** — сарлавҳаҳои бехатарии HTTP
* **CORS** — танзимшаванда (`CORS_ORIGINS`)
* **express-rate-limit** — ҳадди дархостҳо (умумӣ ва AI)
* **Санҷиши маълумот** — ҳар дархост бо `helpers.js` тоза карда мешавад (`cleanText`, `cleanString`, `cleanInt`, ...)
* **Паролҳои вебхук** — `X-Telegram-Bot-Api-Secret-Token`
* **Калиди OpenAI** танҳо дар backend кор мекунад, ба frontport ҳеҷ гоҳ фистода намешавад
* **Корбари ҳозира** — `Bearer token` (сессияи 30 рӯза) ё `X-Device-Id` (меҳмон)

---

## 9. Қадами навбатӣ (ихтиёрӣ)

* Панели админ (ихтиёрӣ, дар ҳоли ҳозир ғайрифаъол)
* Пойгоҳи додаҳои PostgreSQL барои ҳисобҳои калон
* Овозҳо (TTS) барои саволҳо
* Омӯзиши ҳамгурӯҳӣ ва рейтинг
* PWA пурра (offline) ва Push

**DONO AI** — Омӯз. Фаҳм. Пешравӣ кун. 🎓
