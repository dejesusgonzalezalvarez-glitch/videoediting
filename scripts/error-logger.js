// ============================================================================
// scripts/error-logger.js
// Sistema de registro de errores del estudio audiovisual.
// Registra errores estructurados en temp/errors.log y permite reintentos.
// ============================================================================

import { existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { PATHS } from '../config/paths.config.js';

const LOG_FILE = join(PATHS.temp, 'errors.log');
let errorCount = 0;
let warningCount = 0;

export const LOG_LEVEL = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
};

function ensureLogDir() {
  if (!existsSync(PATHS.temp)) {
    mkdirSync(PATHS.temp, { recursive: true });
  }
}

function formatEntry(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const ctx = Object.keys(context).length ? ` | ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level}] ${message}${ctx}\n`;
}

export function error(message, context = {}) {
  errorCount += 1;
  ensureLogDir();
  const err = message instanceof Error ? message : new Error(message);
  appendFileSync(LOG_FILE, formatEntry(LOG_LEVEL.ERROR, err.message, { ...context, stack: err.stack }));
  console.error(`[${LOG_LEVEL.ERROR}] ${message}`, context);
  return err;
}

export function warn(message, context = {}) {
  warningCount += 1;
  ensureLogDir();
  appendFileSync(LOG_FILE, formatEntry(LOG_LEVEL.WARN, message, context));
  console.warn(`[${LOG_LEVEL.WARN}] ${message}`, context);
}

export function info(message, context = {}) {
  ensureLogDir();
  appendFileSync(LOG_FILE, formatEntry(LOG_LEVEL.INFO, message, context));
  console.info(`[${LOG_LEVEL.INFO}] ${message}`, context);
}

export function stats() {
  return { errors: errorCount, warnings: warningCount };
}

export async function withRetry(fn, { retries = 3, delayMs = 1000, label = 'operación' } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      warn(`${label} falló (intento ${attempt}/${retries}): ${err.message}`, { label, attempt });
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
  }
  throw lastErr;
}

export default { error, warn, info, stats, withRetry, LOG_LEVEL };
