/**
 * logger.js — логҳои содда (ба ҷойи console.log-и бесамар).
 */
'use strict';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const current = LEVELS[process.env.LOG_LEVEL || 'info'];

function ts() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function fmt(level, args) {
  const parts = args.map(function (a) {
    if (a instanceof Error) return a.message + (a.stack ? '\n' + a.stack.split('\n').slice(1, 3).join('\n') : '');
    if (typeof a === 'object') { try { return JSON.stringify(a); } catch (e) { return String(a); } }
    return String(a);
  });
  return ts() + ' [' + level.toUpperCase() + '] ' + parts.join(' ');
}

module.exports = {
  error: function () { if (current >= 0) console.error(fmt('error', [].slice.call(arguments))); },
  warn: function () { if (current >= 1) console.warn(fmt('warn', [].slice.call(arguments))); },
  info: function () { if (current >= 2) console.log(fmt('info', [].slice.call(arguments))); },
  debug: function () { if (current >= 3) console.log(fmt('debug', [].slice.call(arguments))); }
};
