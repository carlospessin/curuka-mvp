const fs = require('fs');
const http = require('http');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const preferredPort = Number(process.env.PORT || 3000);
const maxPort = Number(process.env.MAX_PORT || preferredPort + 10);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function resolvePublicPath(urlPath) {
  if (urlPath === '/' || urlPath === '') {
    return path.join(publicDir, 'index.html');
  }

  const candidate = path.join(publicDir, urlPath);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }

  return path.join(publicDir, 'index.html');
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const filePath = resolvePublicPath(decodeURIComponent(url.pathname));

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = contentTypes[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

function listenOnPort(port) {
  server.listen(port, () => {
    console.log(`Landing local em http://localhost:${port}`);
    console.log('O botao Entrar redireciona para http://localhost:8081/app/login');
  });
}

function tryListen(port) {
  server.once('error', (error) => {
    if (error && error.code === 'EADDRINUSE') {
      if (port >= maxPort) {
        console.error(`Nenhuma porta livre encontrada entre ${preferredPort} e ${maxPort}.`);
        process.exit(1);
      }

      const nextPort = port + 1;
      console.log(`Porta ${port} ocupada. Tentando http://localhost:${nextPort}`);
      tryListen(nextPort);
      return;
    }

    throw error;
  });

  listenOnPort(port);
}

tryListen(preferredPort);
