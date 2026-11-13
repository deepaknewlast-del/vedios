// Tiny static server with HTTP Range support so the browser can stream and seek
// the MP4 inside the preview iframe.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT || 4173);

const TYPES = {
  '.mp4': 'video/mp4',
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.json': 'application/json',
  '.vtt': 'text/vtt',
  '.mp3': 'audio/mpeg',
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let file = url === '/' ? '/preview/index.html' : url;
  const full = path.join(ROOT, path.normalize(file).replace(/^(\.\.[/\\])+/, ''));

  if (!full.startsWith(ROOT) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }

  const stat = fs.statSync(full);
  const type = TYPES[path.extname(full).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;

  const headers = {
    'content-type': type,
    'accept-ranges': 'bytes',
    'cache-control': 'public, max-age=60',
    // allow embedding in the Arena preview iframe
    'access-control-allow-origin': '*',
  };

  if (range) {
    const [startRaw, endRaw] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(startRaw, 10) || 0;
    const end = endRaw ? parseInt(endRaw, 10) : stat.size - 1;
    res.writeHead(206, {
      ...headers,
      'content-range': `bytes ${start}-${end}/${stat.size}`,
      'content-length': end - start + 1,
    });
    fs.createReadStream(full, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { ...headers, 'content-length': stat.size });
    fs.createReadStream(full).pipe(res);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[preview] serving ${ROOT} on http://0.0.0.0:${PORT}`);
});
