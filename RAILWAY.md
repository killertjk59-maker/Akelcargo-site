# Чӣ тавр Akelcargo-ро ба Railway гузоред

Файли боргирӣ: **Akelcargo-railway.zip** (ҳамаи лоиҳа). Як файлро ҷудо карда бор накунед.

## Қадами 1. Zip-ро кушоед
Дар компютер `Akelcargo-railway.zip`-ро Extract кунед. Папкаи `akelcargo` пайдо мешавад.

## Қадами 2. Ба GitHub гузоред
Railway бевосита zip қабул намекунад — аввал GitHub.

1. https://github.com ворид шавед (ё аккаунт созед).
2. **New repository** → ном: `akelcargo` → **Create repository**.
3. **uploading an existing file** / **Add file → Upload files**.
4. Ҳамаи файлҳои даруни папкаи `akelcargo`-ро кашола карда партоед
   (`package.json`, `server.js`, `src`, `public`, …).
5. Папкаҳои `node_modules` ва `dist`-ро нафиристед.
6. **Commit changes**.

## Қадами 3. Railway
1. https://railway.app → **Login with GitHub**.
2. **New Project** → **Deploy from GitHub repo** → `akelcargo`.
3. Агар пурсад: Build = `npm run build`, Start = `node server.js`.
4. **Settings → Networking → Generate Domain**.
5. Суроға мебарояд, масалан: `https://akelcargo-production.up.railway.app`

## Қадами 4. Кушодан
- Муштарӣ: ҳамон суроғаро дар телефон кушоед.
- Админ: `https://СУРОҒАИ-ШУМО/admin`
- Дар Chrome: меню → **Add to Home screen** = мисли барнома.

## SMS (ҳатмист барои рамзи воридшавӣ)
Рамз ба рақами муштарӣ бо SMS тавассути EasySendSMS меравад (WhatsApp истифода намешавад).

Railway → лоиҳа → **Variables** → илова кунед:
- `EASYSENDSMS_API_KEY` = калиди API-и шумо аз https://my.easysendsms.app (Account Settings → REST API)
- `EASYSENDSMS_FROM` = `Akelcargo` (ихтиёрӣ; Sender ID, то 11 ҳарф)

Баъд Redeploy кунед. Ё дар барнома: **/admin → SMS** → калидро гузоред → Захира.
Сипас «Фиристодани SMS-и тест»-ро пахш кунед ва «Санҷиши баланс»-ро бинед.

Калидро ҳеҷ гоҳ дар GitHub нагузоред — танҳо дар Railway Variables.

## Муҳим
- GitHub Pages НЕ — он ҷо админ кор намекунад.
- Railway = сервер. Админ, треккод ва хабарҳо ҳамин ҷо нигоҳ дошта мешаванд.
- Баъди ҳар Deploy-и нав базаи JSON аз нав сабз мешавад. Барои нигоҳ доштани додаҳо: Railway → Volume ба `/app/data`.
