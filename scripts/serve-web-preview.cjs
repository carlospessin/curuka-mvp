const fs = require('fs');
const http = require('http');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const port = Number(process.env.PORT || 3000);

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

function ensureBuild() {
  if (!fs.existsSync(path.join(distDir, 'index.html')) || !fs.existsSync(path.join(distDir, 'app', 'index.html'))) {
    execSync('node scripts/export-web-with-landing.cjs', {
      cwd: rootDir,
      stdio: 'inherit',
    });
  }
}

function resolveRequestPath(urlPath) {
  if (urlPath === '/' || urlPath === '') {
    return path.join(distDir, 'index.html');
  }

  if (urlPath === '/app' || urlPath.startsWith('/app/')) {
    const candidate = path.join(distDir, urlPath);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
    return path.join(distDir, 'app', 'index.html');
  }

  if (urlPath.startsWith('/c-')) {
    return path.join(distDir, 'app', 'index.html');
  }

  const candidate = path.join(distDir, urlPath);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }

  return path.join(distDir, 'index.html');
}

ensureBuild();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const filePath = resolveRequestPath(decodeURIComponent(url.pathname));

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

server.listen(port, () => {
  console.log(`Preview local em http://localhost:${port}`);
  console.log(`Landing: http://localhost:${port}/`);
  console.log(`App login: http://localhost:${port}/app/login`);
});
