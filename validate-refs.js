#!/usr/bin/env node
/**
 * PipelineLM Pro — Manifest Validator
 * Validates manifest.json against Chrome Web Store requirements
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '../src');
const MANIFEST_PATH = path.join(SRC_DIR, 'manifest.json');

const REQUIRED_FIELDS = [
  'manifest_version',
  'name',
  'version',
  'description',
  'permissions',
  'host_permissions',
  'background',
  'content_scripts',
  'side_panel',
  'default_locale',
  'icons',
  'action'
];

const VALID_PERMISSIONS = [
  'activeTab',
  'storage',
  'sidePanel',
  'downloads',
  'contextMenus',
  'scripting',
  'tabs',
  'unlimitedStorage'
];

const ICON_SIZES = [16, 32, 48, 128];

let errors = 0;
let warnings = 0;

function log(level, message) {
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
  console.log(`${prefix} ${message}`);
  if (level === 'error') errors++;
  if (level === 'warn') warnings++;
}

// ─── Main ───────────────────────────────────────────────────────────

function validate() {
  console.log('🔍 PipelineLM Pro — Manifest Validator\n');

  // 1. File exists
  if (!fs.existsSync(MANIFEST_PATH)) {
    log('error', `manifest.json not found at ${MANIFEST_PATH}`);
    printSummary();
    process.exit(1);
  }
  log('ok', 'manifest.json exists');

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (e) {
    log('error', `Invalid JSON: ${e.message}`);
    printSummary();
    process.exit(1);
  }
  log('ok', 'Valid JSON');

  // 2. Required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in manifest)) {
      log('error', `Missing required field: "${field}"`);
    } else {
      log('ok', `"${field}" present`);
    }
  }

  // 3. Manifest version
  if (manifest.manifest_version !== 3) {
    log('error', `Expected manifest_version: 3, got: ${manifest.manifest_version}`);
  } else {
    log('ok', 'Manifest version 3');
  }

  // 4. Version format (semver)
  const semverRegex = /^\d+\.\d+\.\d+$/;
  if (!semverRegex.test(manifest.version)) {
    log('warn', `Version "${manifest.version}" should follow semver (x.y.z)`);
  } else {
    log('ok', `Version "${manifest.version}" is valid semver`);
  }

  // 5. Name length (Chrome Web Store limit: 75 chars)
  if (manifest.name.length > 75) {
    log('error', `Name too long: ${manifest.name.length}/75 chars`);
  } else if (manifest.name.length < 3) {
    log('error', 'Name too short (min 3 chars)');
  } else {
    log('ok', `Name length: ${manifest.name.length}/75`);
  }

  // 6. Description length (CWS limit: 132 chars for search results)
  if (manifest.description.length > 132) {
    log('warn', `Description >132 chars — may be truncated in search`);
  }
  log('ok', `Description: ${manifest.description.length} chars`);

  // 7. Permissions validation
  if (Array.isArray(manifest.permissions)) {
    for (const perm of manifest.permissions) {
      if (!VALID_PERMISSIONS.includes(perm)) {
        log('warn', `Unknown permission: "${perm}"`);
      }
    }
    log('ok', `${manifest.permissions.length} permissions`);
  } else {
    log('error', '"permissions" should be an array');
  }

  // 8. Host permissions
  const hasNotebookLM = manifest.host_permissions?.some(h =>
    h.includes('notebooklm.google.com')
  );
  if (!hasNotebookLM) {
    log('error', 'Missing host permission for notebooklm.google.com');
  } else {
    log('ok', 'Host permission for notebooklm.google.com present');
  }

  // 9. Background script
  if (manifest.background?.service_worker) {
    const swPath = path.join(SRC_DIR, manifest.background.service_worker);
    if (!fs.existsSync(swPath)) {
      log('error', `Service worker not found: ${manifest.background.service_worker}`);
    } else {
      log('ok', `Service worker: ${manifest.background.service_worker}`);
    }
  }

  // 10. Content scripts
  if (Array.isArray(manifest.content_scripts)) {
    for (const cs of manifest.content_scripts) {
      if (cs.js) {
        for (const js of cs.js) {
          const jsPath = path.join(SRC_DIR, js);
          if (!fs.existsSync(jsPath)) {
            log('error', `Content script JS not found: ${js}`);
          }
        }
      }
      if (cs.css) {
        for (const css of cs.css) {
          const cssPath = path.join(SRC_DIR, css);
          if (!fs.existsSync(cssPath)) {
            log('error', `Content script CSS not found: ${css}`);
          }
        }
      }
    }
    log('ok', `${manifest.content_scripts.length} content script(s)`);
  }

  // 11. Side panel
  if (manifest.side_panel?.default_path) {
    const spPath = path.join(SRC_DIR, manifest.side_panel.default_path);
    if (!fs.existsSync(spPath)) {
      log('error', `Side panel HTML not found: ${manifest.side_panel.default_path}`);
    } else {
      log('ok', `Side panel: ${manifest.side_panel.default_path}`);
    }
  }

  // 12. Icons
  if (manifest.icons) {
    for (const size of ICON_SIZES) {
      const iconPath = manifest.icons[String(size)];
      if (!iconPath) {
        log('warn', `Missing icon: ${size}x${size}`);
        continue;
      }
      const fullPath = path.join(SRC_DIR, iconPath);
      if (!fs.existsSync(fullPath)) {
        log('error', `Icon file not found: ${iconPath}`);
      } else {
        const stats = fs.statSync(fullPath);
        if (stats.size > 102400) { // 100KB limit
          log('warn', `Icon ${size}x${size} > 100KB (${Math.round(stats.size / 1024)}KB)`);
        }
      }
    }
    log('ok', `${Object.keys(manifest.icons).length} icon(s) defined`);
  }

  // 13. Default locale
  if (manifest.default_locale) {
    const localePath = path.join(SRC_DIR, '_locales', manifest.default_locale, 'messages.json');
    if (!fs.existsSync(localePath)) {
      log('error', `Default locale messages not found: ${localePath}`);
    } else {
      log('ok', `Default locale: ${manifest.default_locale}`);
    }
  }

  // 14. No forbidden fields for MV3
  if (manifest.background?.scripts) {
    log('error', 'MV3 does not support background.scripts — use background.service_worker');
  }
  if (manifest.browser_action) {
    log('error', 'MV3 uses "action" not "browser_action"');
  }
  if (manifest.page_action) {
    log('error', 'MV3 uses "action" not "page_action"');
  }

  printSummary();
  process.exit(errors > 0 ? 1 : 0);
}

function printSummary() {
  console.log(`\n${'─'.repeat(50)}`);
  if (errors === 0 && warnings === 0) {
    console.log('✅ All checks passed!');
  } else {
    console.log(`Errors: ${errors} | Warnings: ${warnings}`);
  }
  console.log(`${'─'.repeat(50)}\n`);
}

validate();
