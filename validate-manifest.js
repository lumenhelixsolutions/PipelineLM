#!/usr/bin/env node
/**
 * PipelineLM Pro — Build Script
 * Validates, packages, and prepares the extension for distribution.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const RELEASES = path.join(ROOT, 'releases');

// ─── Colors ─────────────────────────────────────────────────────────

const C = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function info(msg)  { console.log(`${C.blue}ℹ${C.reset}  ${msg}`); }
function ok(msg)    { console.log(`${C.green}✔${C.reset}  ${msg}`); }
function warn(msg)  { console.log(`${C.yellow}⚠${C.reset}  ${msg}`); }
function error(msg) { console.log(`${C.red}✖${C.reset}  ${msg}`); }
function section(msg) { console.log(`\n${C.bold}${C.cyan}${msg}${C.reset}\n`); }

// ─── Helpers ────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getVersion() {
  const manifestPath = path.join(SRC, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return manifest.version;
}

function countFiles(dir) {
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countFiles(fullPath);
    } else {
      count++;
    }
  }
  return count;
}

function getTotalSize(dir) {
  let size = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      size += getTotalSize(fullPath);
    } else {
      size += fs.statSync(fullPath).size;
    }
  }
  return size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ─── Build Steps ────────────────────────────────────────────────────

function clean() {
  section('Step 1: Clean');
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true });
    ok('Removed old dist/');
  }
  ensureDir(DIST);
  ok('Created dist/');
}

function validate() {
  section('Step 2: Validate');

  // Run manifest validator
  try {
    execSync('node scripts/validate-manifest.js', { cwd: ROOT, stdio: 'inherit' });
    ok('Manifest validation passed');
  } catch (e) {
    error('Manifest validation failed');
    process.exit(1);
  }

  // Run file reference validator
  try {
    execSync('node scripts/validate-refs.js', { cwd: ROOT, stdio: 'inherit' });
    ok('File reference validation passed');
  } catch (e) {
    error('File reference validation failed');
    process.exit(1);
  }
}

function copySource() {
  section('Step 3: Copy Source');
  copyDir(SRC, DIST);
  ok(`Copied source files to dist/`);
}

function validateManifestFields() {
  section('Step 4: Validate Manifest Fields');
  const manifestPath = path.join(DIST, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // Ensure production values
  if (manifest.name.includes('DEV') || manifest.name.includes('BETA')) {
    warn('Manifest name contains development marker');
  }

  // Check minimum Chrome version for MV3
  if (!manifest.minimum_chrome_version) {
    manifest.minimum_chrome_version = '109';
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    ok('Added minimum_chrome_version: 109');
  }

  ok('Manifest fields validated');
}

function createPackage() {
  section('Step 5: Create Package');
  ensureDir(RELEASES);

  const version = getVersion();
  const zipName = `pipelinelm-pro-v${version}.zip`;
  const zipPath = path.join(RELEASES, zipName);

  // Remove old zip if exists
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  // Create zip using system zip command
  try {
    const distFiles = fs.readdirSync(DIST);
    const files = distFiles.join(' ');
    execSync(`zip -r "${zipPath}" ${files}`, {
      cwd: DIST,
      stdio: 'ignore'
    });
    ok(`Created: releases/${zipName}`);
  } catch (e) {
    warn('zip command not available, trying fallback...');
    // Node.js fallback: just copy to releases as uncompressed
    const releaseDir = path.join(RELEASES, `pipelinelm-pro-v${version}`);
    copyDir(DIST, releaseDir);
    ok(`Created (uncompressed): releases/pipelinelm-pro-v${version}/`);
  }

  return zipName;
}

function generateReport(packageName) {
  section('Build Report');
  const version = getVersion();
  const fileCount = countFiles(DIST);
  const totalSize = getTotalSize(DIST);

  console.log(`${C.bold}PipelineLM Pro v${version}${C.reset}`);
  console.log(`${'─'.repeat(40)}`);
  console.log(`Files:        ${fileCount}`);
  console.log(`Total size:   ${formatBytes(totalSize)}`);
  console.log(`Package:      ${packageName || 'N/A'}`);
  console.log(`Chrome MV3:   ✓`);
  console.log(`Timestamp:    ${new Date().toISOString()}`);
  console.log(`${'─'.repeat(40)}\n`);

  // Warn if too large for CWS
  if (totalSize > 2097152) { // 2MB
    warn('Package > 2MB — consider optimizing images');
  }
}

// ─── Main ───────────────────────────────────────────────────────────

function main() {
  console.log(`\n${C.bold}${C.cyan}PipelineLM Pro — Build${C.reset}\n`);

  if (!fs.existsSync(SRC)) {
    error(`Source directory not found: ${SRC}`);
    process.exit(1);
  }

  clean();
  validate();
  copySource();
  validateManifestFields();
  const packageName = createPackage();
  generateReport(packageName);

  section('Build Complete!');
  console.log(`${C.green}✓${C.reset} Extension ready for distribution.\n`);
}

main();
