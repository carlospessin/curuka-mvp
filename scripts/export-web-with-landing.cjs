const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');
const landingSource = path.join(publicDir, 'index.html');
const landingBackup = path.join(publicDir, '__landing_index__.html');
const distIndex = path.join(distDir, 'index.html');
const distAppDir = path.join(distDir, 'app');
const distAppIndex = path.join(distAppDir, 'index.html');
const distLegacyAppHtml = path.join(distDir, 'app.html');
const distLandingBackup = path.join(distDir, '__landing_index__.html');

function restoreLandingSource() {
  if (fs.existsSync(landingBackup)) {
    fs.renameSync(landingBackup, landingSource);
  }
}

try {
  if (!fs.existsSync(landingSource)) {
    throw new Error('Landing page nao encontrada em public/index.html.');
  }

  if (fs.existsSync(landingBackup)) {
    fs.rmSync(landingBackup, { force: true });
  }

  fs.renameSync(landingSource, landingBackup);

  execSync('npx expo export --platform web', {
    cwd: rootDir,
    stdio: 'inherit',
  });

  if (!fs.existsSync(distIndex)) {
    throw new Error('O build web nao gerou dist/index.html.');
  }

  fs.mkdirSync(distAppDir, { recursive: true });

  if (fs.existsSync(distAppIndex)) {
    fs.rmSync(distAppIndex, { force: true });
  }

  fs.renameSync(distIndex, distAppIndex);
  fs.copyFileSync(landingBackup, distIndex);

  if (fs.existsSync(distLegacyAppHtml)) {
    fs.rmSync(distLegacyAppHtml, { force: true });
  }

  if (fs.existsSync(distLandingBackup)) {
    fs.rmSync(distLandingBackup, { force: true });
  }
} finally {
  restoreLandingSource();
}
