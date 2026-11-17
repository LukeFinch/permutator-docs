// Dev-only server for the brand lab. Serves /lab and /site, and saves configs.
// Run: node lab/server.mjs  →  http://localhost:4322/lab/brand/
import http from 'node:http';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAVED_DIR = path.join(root, 'lab/brand/saved');
const SHIPPED = path.join(root, 'site/brand/config.json');
const PORT = Number(process.env.PORT || 4322);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };

const send = (res, code, body, type = 'application/json') => { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); res.end(body); };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method === 'POST' && url.pathname === '/__save') {
      let raw = ''; for await (const chunk of req) raw += chunk;
      const config = JSON.parse(raw);
      const json = JSON.stringify(config, null, 2) + '\n';
      await mkdir(SAVED_DIR, { recursive: true });
      const name = `${new Date().toISOString().replace(/[:.]/g, '-')}-${config.mode}-${config.seed}.json`;
      await writeFile(path.join(SAVED_DIR, name), json);
      await writeFile(SHIPPED, json);
      return send(res, 200, JSON.stringify({ saved: `lab/brand/saved/${name}`, shipped: 'site/brand/config.json' }));
    }
    if (url.pathname === '/__saved') {
      await mkdir(SAVED_DIR, { recursive: true });
      const files = (await readdir(SAVED_DIR)).filter(f => f.endsWith('.json')).sort().reverse();
      const list = await Promise.all(files.map(async f => ({ file: f, config: JSON.parse(await readFile(path.join(SAVED_DIR, f), 'utf8')) })));
      return send(res, 200, JSON.stringify(list));
    }
    let p = decodeURIComponent(url.pathname);
    if (p === '/') { res.writeHead(302, { location: '/lab/brand/' }); return res.end(); }
    if (p.endsWith('/')) p += 'index.html';
    const file = path.normalize(path.join(root, p));
    if (!(file.startsWith(path.join(root, 'lab')) || file.startsWith(path.join(root, 'site')))) return send(res, 403, 'forbidden', 'text/plain');
    const body = await readFile(file);
    send(res, 200, body, TYPES[path.extname(file)] || 'application/octet-stream');
  } catch (e) {
    send(res, e.code === 'ENOENT' ? 404 : 500, String(e.message || e), 'text/plain');
  }
}).listen(PORT, () => console.log(`brand lab → http://localhost:${PORT}/lab/brand/`));
