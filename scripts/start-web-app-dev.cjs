const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const landingPath = path.join(publicDir, 'index.html');
const landingBackupPath = path.join(publicDir, '__landing_index__.html');

function hideLanding() {
  if (fs.existsSync(landingPath) && !fs.existsSync(landingBackupPath)) {
    fs.renameSync(landingPath, landingBackupPath);
  }
}

function restoreLanding() {
  if (fs.existsSync(landingBackupPath) && !fs.existsSync(landingPath)) {
    fs.renameSync(landingBackupPath, landingPath);
  }
}

hideLanding();

let child;

try {
  child = process.platform === 'win32'
    ? spawn('cmd.exe', ['/c', 'npx expo start --web --port 8081'], {
        cwd: rootDir,
        stdio: 'inherit',
      })
    : spawn('npx', ['expo', 'start', '--web', '--port', '8081'], {
        cwd: rootDir,
        stdio: 'inherit',
      });
} catch (error) {
  restoreLanding();
  throw error;
}

const cleanup = () => {
  restoreLanding();
};

process.on('SIGINT', () => {
  cleanup();
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  cleanup();
  child.kill('SIGTERM');
});

child.on('exit', (code) => {
  cleanup();
  process.exit(code ?? 0);
});
