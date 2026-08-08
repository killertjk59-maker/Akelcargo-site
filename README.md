# 🚀 Akel Cargo - Хизматрасонии боркашонӣ

Сайти замонавии барои ширкати боркашонии Akel Cargo аз Чин ба Тоҷикистон.

## ✨ Хусусиятҳо

- 🌐 3 забон (Тоҷикӣ, Русӣ, Англисӣ)
- 🌙 Dark/Light mode
- 👥 Регистратсия бо логин ва парол
- 📦 Пайгирии бор (трекинг)
- 👑 Админ панел пурра
- 📱 Мобил адаптив

## 🛠 Технологияҳо

- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **Frontend:** HTML, CSS, JavaScript

## 🚀 Ба Railway deploy кардан

### 1. GitHub репозитория созед

```bash
cd akelcargo
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/akelcargo.git
git push -u origin main
```

### 2. Ба Railway ворид шавед

1. Ба [railway.app](https://railway.app) равед
2. Бо GitHub аккаунт ворид шавед
3. Кнопкаи **"New Project"**-ро пахш кунед
4. **"Deploy from GitHub repo"**-ро интихоб кунед
5. Репозитории `akelcargo`-ро интихоб кунед

### 3. Deploy кунед

Railway автоматӣ deploy мекунад! Шумо URL мегиред:
```
https://akelcargo-production.up.railway.app
```

## 🔑 Маълумоти пешфарз

| Маълумот | Қиммат |
|----------|--------|
| Admin Login | `admin` |
| Admin Password | `admin123` |

## 📁 Структура

```
akelcargo/
├── server.js          # Сервери асосӣ
├── package.json       # Зависимостҳо
├── Procfile           # Railway конфигуратсия
├── railway.json       # Railway конфигуратсия
├── .gitignore
└── public/
    ├── index.html     # Саҳифаи асосӣ
    ├── js/
    │   ├── app.js     # Логикаи асосӣ
    │   └── i18n.js    # Тарҷума
    └── pages/
        ├── login.html
        ├── register.html
        ├── tracking.html
        ├── dashboard.html
        └── admin.html
```

## 📞 Тамос

- **Telegram:** [@akelcargo](https://t.me/akelcargo)
- **Телефон:** +992 71 555 50 00

## 📄 License

MIT
