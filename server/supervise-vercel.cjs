// Supervisor: relaunches `vercel dev` on crash.
// Edge runtime on Windows can libuv-assert mid-SSE; this respawns within 2s.
// Usage:  node supervise-vercel.js
const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || '3000';
const MAX_RESTARTS_PER_MIN = 10;
const RESTART_DELAY_MS = 2000;

let restarts = [];

function start() {
  const now = Date.now();
  restarts = restarts.filter(t => now - t < 60_000);
  if (restarts.length >= MAX_RESTARTS_PER_MIN) {
    console.error(`[supervisor] ${MAX_RESTARTS_PER_MIN} restarts in last 60s — bailing out`);
    process.exit(1);
  }
  restarts.push(now);

  console.log(`[supervisor] starting vercel dev on :${PORT}`);
  const proc = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vercel', 'dev', '--listen', PORT, '--yes'],
    { cwd: __dirname, stdio: 'inherit', shell: true },
  );

  proc.on('exit', (code, signal) => {
    console.log(`[supervisor] vercel exited code=${code} signal=${signal} — restarting in ${RESTART_DELAY_MS}ms`);
    setTimeout(start, RESTART_DELAY_MS);
  });

  proc.on('error', (e) => {
    console.error('[supervisor] spawn error', e);
  });

  const shutdown = (sig) => {
    console.log(`[supervisor] caught ${sig}, terminating child`);
    try { proc.kill(sig); } catch {}
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
