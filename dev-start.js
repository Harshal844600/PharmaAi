/**
 * dev-start.js — Runs both backend + frontend in one command.
 * Usage: node dev-start.js
 */
const { spawn } = require('child_process');
const path = require('path');

const ROOT = __dirname;
const BACKEND_DIR = path.join(ROOT, 'backend');

console.log('');
console.log('  PharmaGuard - Starting both servers...');
console.log('');

// Start backend
const backend = spawn('node', ['server.js'], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    shell: true,
});

// Start frontend after backend has time to bind port
setTimeout(() => {
    const frontend = spawn('npx', ['vite'], {
        cwd: ROOT,
        stdio: 'inherit',
        shell: true,
    });

    frontend.on('error', (err) => {
        console.error('[Frontend] Error:', err.message);
    });
}, 4000);

// Keep process alive
process.on('SIGINT', () => {
    backend.kill();
    process.exit(0);
});
