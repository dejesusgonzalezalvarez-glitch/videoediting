// ============================================================================
// scripts/http_server.js
// Servidor HTTP simple para servir las escenas HTML a Playwright.
// Evita problemas de CORS con módulos ES desde file://.
// ============================================================================

import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const PORT = 8765;
const ROOT = process.cwd();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.json': 'application/json',
  '.wav': 'audio/wav',
  '.srt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  let url = new URL(req.url, `http://localhost:${PORT}`);
  let filePath = join(ROOT, url.pathname === '/' ? 'index.html' : url.pathname.slice(1));

  // Evitar path traversal.
  const normalized = filePath.replace(/\\/g, '/');
  if (!normalized.startsWith(ROOT.replace(/\\/g, '/'))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
    res.end(content);
  } catch (err) {
    res.writeHead(500);
    res.end(err.message);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Servidor HTTP en http://127.0.0.1:${PORT}`);
});

process.on('SIGINT', () => {
  server.close();
  process.exit(0);
});
