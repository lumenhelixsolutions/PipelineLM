#!/usr/bin/env node
/**
 * PipelineLM Pro — Health Check Script
 * Usage: node scripts/health-check.js [url]
 * Default: http://localhost:8080
 * Exit code: 0 = healthy, 1 = degraded, 2 = down
 */
const BASE = process.argv[2] || 'http://localhost:8080';

async function check() {
  const results = [];
  let allOk = true;

  const get = async (path, label) => {
    const start = Date.now();
    try {
      const resp = await fetch(BASE + path);
      const ms = Date.now() - start;
      const body = await resp.json();
      results.push({ label, status: resp.status, ms, ok: resp.ok, error: null, body });
      if(!resp.ok) allOk = false;
    } catch(e) {
      results.push({ label, status: 0, ms: Date.now() - start, ok: false, error: e.message });
      allOk = false;
    }
  };

  console.log(`\n  PipelineLM Pro Health Check — ${BASE}\n`);
  console.log('  ' + '='.repeat(50));

  await get('/api/status', 'Status');
  await get('/api/health', 'Health Detail');
  await get('/api/prefabs', 'Prefabs');
  await get('/api/projects', 'Projects');
  await get('/api/queue', 'Queue');
  await get('/api/artifacts', 'Artifacts');
  await get('/api/vault/files', 'Vault Files');
  await get('/api/fleet', 'Fleet');

  console.log('');
  for(const r of results) {
    const icon = r.ok ? '✅' : r.status === 0 ? '💀' : '❌';
    const ms = r.ms < 1000 ? `${r.ms}ms` : `${(r.ms/1000).toFixed(1)}s`;
    const extra = r.body?.status ? ` | status=${r.body.status}` : r.body?.error ? ` | error=${r.body.error}` : '';
    console.log(`  ${icon} ${r.label.padEnd(20)} ${String(r.status).padEnd(4)} ${ms.padEnd(8)}${extra}`);
  }

  const totalMs = results.reduce((s, r) => s + r.ms, 0);
  const ok = results.filter(r => r.ok).length;
  const fail = results.filter(r => !r.ok).length;

  console.log('');
  console.log(`  ${'='.repeat(50)}`);
  console.log(`  ${ok}/${results.length} endpoints OK | ${totalMs}ms total | ${fail} failures`);
  console.log('');

  if(fail > 0 && ok === 0) process.exit(2);
  if(fail > 0) process.exit(1);
  process.exit(0);
}

check().catch(e => {
  console.error('Health check crashed:', e.message);
  process.exit(2);
});
