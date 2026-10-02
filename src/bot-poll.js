/**
 * bot-poll.js — ҳолати маҳаллӣ: бот бе webhook, бо long polling кор мекунад.
 *
 *   npm run bot            → polling (барои тест дар компютер)
 *   WEBHOOK_URL=... npm run bot  → гузоштани webhook барои production
 *
 * Дар production (Railway) ин файн лозим нест: server.js худаш webhook-ро қабул мекунад.
 */
'use strict';

const db = require('./database/database');
const tg = require('./services/telegramService');
const log = require('./utils/logger');

const WEBHOOK = (process.env.WEBHOOK_URL || '').replace(/\/+$/, '');

async function main() {
  await db.init();

  if (!tg.isConfigured()) {
    log.error('TELEGRAM_BOT_TOKEN дар .env гузошта нашудааст.');
    log.error('BotFather → /newbot → токенро гиред ва ба .env илова кунед.');
    process.exit(1);
  }

  const me = await tg.getMe();
  log.info('Бот: @' + (me && me.username ? me.username : '?') + ' — ' + (me && me.first_name));

  if (WEBHOOK) {
    await tg.setWebhook(WEBHOOK + '/telegram/webhook', process.env.TELEGRAM_WEBHOOK_SECRET || undefined);
    log.info('Webhook гузошта шуд: ' + WEBHOOK + '/telegram/webhook');
    return;
  }

  log.info('Реҷаи polling (маҳаллӣ). Барои боздошт Ctrl+C');

  let offset = 0;
  /* Пас аз ҳар даъвати polling, кӯшиш кардан мешавад, ки давом дода шавад */
  for (;;) {
    try {
      const res = await tg.call('getUpdates', {
        offset: offset, timeout: 30,
        allowed_updates: ['message', 'callback_query']
      });
      const updates = (res && res.result) || [];
      for (const up of updates) {
        offset = up.update_id + 1;
        try { await tg.handleUpdate(up); }
        catch (e) { log.error('handleUpdate: ' + e.message); }
      }
    } catch (e) {
      log.error('getUpdates: ' + e.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

process.on('SIGINT', function () {
  log.info('Бот боздошта шуд.');
  process.exit(0);
});

main();
