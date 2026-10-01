/**
 * Ошхона Маркет — сервери статикии содда (Node, бе ҳеҷ гуна пакет/зависимость).
 * Барои Railway: PORT аз муҳит (env) хонда мешавад.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'off'
};

function send(res, status, body, headers) {
  const h = Object.assign({}, SECURITY, headers || {});
  res.writeHead(status, h);
  if (res.req && res.req.method === 'HEAD') return res.end();
  res.end(body);
}

function resolveSafe(target) {
  const decoded = decodeURIComponent(target.split('?')[0]);
  const joined = path.normalize(path.join(ROOT, decoded));
  if (joined !== ROOT && !joined.startsWith(ROOT + path.sep)) return null;
  return joined;
}

function isAsset(p) {
  return /\.(css|js|mjs|svg|png|jpe?g|webp|gif|ico|avif|woff2?|ttf|otf)$/i.test(p);
}

const server = http.createServer(function (req, res) {
  const parsed = new URL(req.url, 'http://localhost');
  let pathname = parsed.pathname || '/';

  /* Healthcheck барои Railway */
  if (pathname === '/health' || pathname === '/healthz' || pathname === '/ping') {
    return send(res, 200, 'ok', { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  }

  if (pathname.endsWith('/')) pathname += 'index.html';

  const filePath = resolveSafe(pathname);
  if (!filePath) {
    return send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });
  }

  fs.stat(filePath, function (err, stat) {
    var target = filePath;

    if (!err && stat.isDirectory()) target = path.join(filePath, 'index.html');

    fs.readFile(target, function (err2, data) {
      if (err2) {
        /* Саҳифаҳои SPA → index.html; файлҳои гумшуда → 404 */
        var looksLikeAsset = /\.[a-z0-9]{1,8}$/i.test(pathname);
        if (looksLikeAsset) {
          return send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
        }
        return fs.readFile(path.join(ROOT, 'index.html'), function (err3, html) {
          if (err3) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
          send(res, 200, html, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' });
        });
      }
      const ext = path.extname(target).toLowerCase();
      const type = MIME[ext] || 'application/octet-stream';
      const cache = isAsset(pathname)
        ? 'public, max-age=604800, immutable'
        : (ext === '.html' ? 'no-cache' : 'public, max-age=3600');
      send(res, 200, data, { 'Content-Type': type, 'Cache-Control': cache });
    });
  });
});

server.listen(PORT, HOST, function () {
  console.log('Ошхона Маркет дастгоҳ дар http://' + HOST + ':' + PORT + ' оғоз ёфт');
});

['SIGINT', 'SIGTERM'].forEach(function (sig) {
  process.on(sig, function () {
    server.close(function () { process.exit(0); });
    setTimeout(function () { process.exit(0); }, 2000);
  });
});
