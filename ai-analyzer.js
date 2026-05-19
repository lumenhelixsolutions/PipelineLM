/* ═══════════════════════════════════════════════════════════════
   PipelineLM Pro — Side Panel Styles
   ═══════════════════════════════════════════════════════════════ */

:root {
  --bg: #f8f9fc;
  --bg2: #ffffff;
  --bg3: #eef0f5;
  --bg4: #e4e7ee;
  --fg: #1a1a2e;
  --fg2: #4a5568;
  --fg3: #a0aec0;
  --accent: #3b82f6;
  --accent2: #60a5fa;
  --accent3: rgba(59,130,246,0.1);
  --ok: #10b981;
  --ok-bg: rgba(16,185,129,0.1);
  --warn: #f59e0b;
  --warn-bg: rgba(245,158,11,0.1);
  --err: #ef4444;
  --err-bg: rgba(239,68,68,0.1);
  --border: rgba(0,0,0,0.06);
  --radius: 10px;
  --radius2: 8px;
  --shadow: 0 1px 3px rgba(0,0,0,0.04);
  --shadow2: 0 4px 16px rgba(0,0,0,0.08);
}

[data-theme="dark"] {
  --bg: #0a0e1a;
  --bg2: #111827;
  --bg3: #1a2236;
  --bg4: #242d42;
  --fg: #e2e8f0;
  --fg2: #94a3b8;
  --fg3: #64748b;
  --accent3: rgba(59,130,246,0.15);
  --border: rgba(255,255,255,0.06);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--fg);
  width: 400px;
  min-height: 100vh;
  overflow-x: hidden;
  font-size: 13px;
  line-height: 1.5;
}

/* ═══ HEADER ═══ */
.sp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
}
.sp-brand { display: flex; align-items: center; gap: 8px; }
.sp-logo { width: 24px; height: 24px; border-radius: 6px; }
.sp-title { font-size: 14px; font-weight: 700; letter-spacing: -0.01em; }
.sp-version { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: var(--accent); color: #fff; text-transform: uppercase; }
.sp-actions { display: flex; gap: 4px; }
.sp-btn-icon {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid var(--border); background: var(--bg3);
  color: var(--fg2); cursor: pointer; transition: all .15s;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
}
.sp-btn-icon:hover { background: var(--accent3); color: var(--accent); }

/* ═══ TABS ═══ */
.sp-tabs {
  display: flex;
  gap: 2px;
  padding: 6px 10px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  scrollbar-width: none;
}
.sp-tabs::-webkit-scrollbar { display: none; }
.sp-tab {
  padding: 6px 12px;
  border-radius: var(--radius2);
  border: none;
  background: transparent;
  color: var(--fg2);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all .15s;
  font-family: inherit;
}
.sp-tab:hover { background: var(--bg3); color: var(--fg); }
.sp-tab.active { background: var(--accent3); color: var(--accent); }

/* ═══ TAB CONTENT ═══ */
.sp-tab-content { display: none; padding: 12px; }
.sp-tab-content.active { display: block; }

/* ═══ STATS GRID ═══ */
.sp-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.sp-stat-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 10px;
  text-align: center;
  cursor: pointer;
  transition: all .15s;
}
.sp-stat-card:hover { border-color: var(--accent); transform: translateY(-1px); box-shadow: var(--shadow2); }
.sp-stat-card:active { transform: translateY(0); }
.sp-stat-value { font-size: 22px; font-weight: 700; }
.sp-stat-label { font-size: 9px; color: var(--fg2); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 2px; }

/* ═══ SECTION ═══ */
.sp-section { margin-bottom: 16px; }
.sp-section-title {
  font-size: 11px; font-weight: 700; color: var(--fg2);
  text-transform: uppercase; letter-spacing: 0.04em;
  margin-bottom: 8px; display: flex; align-items: center; gap: 6px;
}

/* ═══ TOOLBAR ═══ */
.sp-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
  align-items: center;
}
.sp-bulk-actions {
  display: flex;
  gap: 4px;
  padding: 6px;
  background: var(--bg3);
  border-radius: var(--radius2);
  width: 100%;
}

/* ═══ FILTER CHIPS ═══ */
.sp-filter-chips { display: flex; gap: 4px; flex-wrap: wrap; }
.sp-chip {
  padding: 4px 10px; border-radius: 999px;
  border: 1px solid var(--border); background: var(--bg2);
  color: var(--fg2); font-size: 10px; font-weight: 600;
  cursor: pointer; transition: all .15s; font-family: inherit;
}
.sp-chip:hover { background: var(--bg3); color: var(--fg); }
.sp-chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }

/* ═══ BUTTONS ═══ */
.sp-btn {
  padding: 7px 14px; border-radius: var(--radius2);
  border: 1px solid var(--border); background: var(--bg3);
  color: var(--fg2); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all .15s; font-family: inherit;
  display: inline-flex; align-items: center; gap: 6px;
}
.sp-btn:hover { background: var(--bg4); color: var(--fg); }
.sp-btn.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
.sp-btn.primary:hover { background: #2563eb; }
.sp-btn.ok { background: var(--ok); color: #fff; border-color: var(--ok); }
.sp-btn.err { background: var(--err); color: #fff; border-color: var(--err); }
.sp-btn.sm { padding: 5px 10px; font-size: 11px; }
.sp-btn.ghost { background: transparent; border-color: transparent; }

/* ═══ LISTS ═══ */
.sp-list { display: flex; flex-direction: column; gap: 4px; }
.sp-list-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: var(--radius2);
  background: var(--bg2); border: 1px solid var(--border);
  cursor: pointer; transition: all .15s; font-size: 12px;
}
.sp-list-item:hover { border-color: var(--accent); transform: translateX(2px); }
.sp-list-item .sp-item-title { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sp-list-item .sp-item-meta { font-size: 10px; color: var(--fg3); flex-shrink: 0; }

/* ═══ VAULT GRID ═══ */
.sp-vault-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
.sp-artifact-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 10px;
  cursor: pointer; transition: all .15s; position: relative;
}
.sp-artifact-card:hover { border-color: var(--accent); box-shadow: var(--shadow2); }
.sp-artifact-card.selected { border-color: var(--accent); background: var(--accent3); }
.sp-artifact-card .sp-card-icon { font-size: 20px; margin-bottom: 6px; }
.sp-artifact-card .sp-card-title { font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
.sp-artifact-card .sp-card-meta { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--fg3); }
.sp-artifact-card .sp-card-actions {
  display: none; gap: 3px; position: absolute; top: 6px; right: 6px;
}
.sp-artifact-card:hover .sp-card-actions { display: flex; }

/* ═══ BADGES ═══ */
.sp-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 999px; font-size: 9px;
  font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em;
}
.sp-badge.ok { background: var(--ok-bg); color: var(--ok); }
.sp-badge.err { background: var(--err-bg); color: var(--err); }
.sp-badge.warn { background: var(--warn-bg); color: #b45309; }
.sp-badge.info { background: var(--accent3); color: var(--accent); }
.sp-badge.neutral { background: var(--bg3); color: var(--fg3); }

/* ═══ PIPELINE ═══ */
.sp-pipeline-status {
  display: flex; align-items: center; gap: 12px;
  padding: 10px; background: var(--bg2);
  border-radius: var(--radius); margin-bottom: 10px;
  border: 1px solid var(--border);
}
.sp-status-item { display: flex; align-items: center; gap: 6px; font-size: 11px; }
.sp-status-dot { width: 8px; height: 8px; border-radius: 50%; }
.sp-status-dot.generating { background: var(--warn); }
.sp-status-dot.completed { background: var(--ok); }
.sp-status-dot.failed { background: var(--err); }

.sp-columns { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.sp-column { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.sp-column-title { padding: 8px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid var(--border); }
.sp-column-title.generating { background: var(--warn-bg); color: #b45309; }
.sp-column-title.completed { background: var(--ok-bg); color: var(--ok); }
.sp-column-title.failed { background: var(--err-bg); color: var(--err); }
.sp-column-content { padding: 6px; max-height: 400px; overflow-y: auto; }
.sp-pipeline-card {
  padding: 8px; border-radius: var(--radius2); background: var(--bg3);
  margin-bottom: 4px; font-size: 11px; cursor: pointer; transition: all .15s;
  border-left: 3px solid transparent;
}
.sp-pipeline-card:hover { background: var(--bg4); }
.sp-pipeline-card.generating { border-left-color: var(--warn); }
.sp-pipeline-card.completed { border-left-color: var(--ok); }
.sp-pipeline-card.failed { border-left-color: var(--err); }

/* ═══ FOLDERS GRID ═══ */
.sp-folders-grid { display: flex; flex-direction: column; gap: 6px; }
.sp-folder-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: var(--radius);
  background: var(--bg2); border: 1px solid var(--border);
  cursor: pointer; transition: all .15s;
}
.sp-folder-row:hover { border-color: var(--accent); }
.sp-folder-row.active { border-color: var(--accent); background: var(--accent3); }
.sp-folder-icon { font-size: 18px; }
.sp-folder-name { flex: 1; font-weight: 600; }
.sp-folder-count { font-size: 10px; color: var(--fg3); background: var(--bg3); padding: 2px 8px; border-radius: 999px; }

/* ═══ PROMPTS LIST ═══ */
.sp-prompts-list { display: flex; flex-direction: column; gap: 6px; }
.sp-prompt-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 12px;
  cursor: pointer; transition: all .15s;
}
.sp-prompt-card:hover { border-color: var(--accent); }
.sp-prompt-card .sp-prompt-name { font-weight: 700; margin-bottom: 4px; }
.sp-prompt-card .sp-prompt-text { font-size: 11px; color: var(--fg2); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.sp-prompt-card .sp-prompt-actions { display: none; gap: 4px; margin-top: 8px; }
.sp-prompt-card:hover .sp-prompt-actions { display: flex; }

/* ═══ SYNC CARDS ═══ */
.sp-sync-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.sp-sync-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 14px 8px; border-radius: var(--radius);
  background: var(--bg2); border: 1px solid var(--border);
  cursor: pointer; transition: all .15s; text-align: center;
}
.sp-sync-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: var(--shadow2); }
.sp-sync-icon { font-size: 28px; }
.sp-sync-name { font-size: 11px; font-weight: 700; }
.sp-sync-desc { font-size: 9px; color: var(--fg3); line-height: 1.3; }

/* ═══ SETTINGS ═══ */
.sp-setting-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 0; border-bottom: 1px solid var(--border);
}
.sp-setting-label { font-weight: 600; font-size: 12px; }
.sp-toggle { position: relative; display: inline-block; width: 40px; height: 22px; }
.sp-toggle input { opacity: 0; width: 0; height: 0; }
.sp-toggle-slider {
  position: absolute; cursor: pointer; inset: 0;
  background: var(--bg4); border-radius: 22px; transition: .2s;
}
.sp-toggle-slider:before {
  content: ""; position: absolute; height: 16px; width: 16px;
  left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: .2s;
}
.sp-toggle input:checked + .sp-toggle-slider { background: var(--accent); }
.sp-toggle input:checked + .sp-toggle-slider:before { transform: translateX(18px); }

.sp-text-muted { font-size: 11px; color: var(--fg3); line-height: 1.5; }

/* ═══ MODAL ═══ */
.sp-modal {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
  z-index: 1000; align-items: center; justify-content: center; padding: 20px;
}
.sp-modal.visible { display: flex; }
.sp-modal-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius); max-width: 360px; width: 100%;
  max-height: 80vh; display: flex; flex-direction: column;
  box-shadow: var(--shadow2); animation: modalIn .2s ease-out;
}
@keyframes modalIn { from { transform: scale(.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.sp-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid var(--border);
}
.sp-modal-header h3 { font-size: 13px; }
.sp-modal-body { padding: 14px 16px; overflow-y: auto; flex: 1; }
.sp-modal-footer { display: flex; gap: 8px; padding: 10px 16px; border-top: 1px solid var(--border); justify-content: flex-end; }

/* ═══ FORMS ═══ */
.sp-input {
  width: 100%; padding: 8px 12px; border-radius: var(--radius2);
  border: 1px solid var(--border); background: var(--bg3);
  color: var(--fg); font-size: 12px; font-family: inherit; outline: none;
}
.sp-input:focus { border-color: var(--accent); }
.sp-textarea {
  width: 100%; min-height: 100px; padding: 8px 12px;
  border-radius: var(--radius2); border: 1px solid var(--border);
  background: var(--bg3); color: var(--fg); font-size: 12px;
  font-family: 'Fira Code', monospace; outline: none; resize: vertical;
}
.sp-textarea:focus { border-color: var(--accent); }
.sp-form-label { font-size: 11px; font-weight: 600; color: var(--fg2); margin-bottom: 4px; display: block; }

/* ═══ TOAST ═══ */
#toast-container { position: fixed; bottom: 14px; right: 14px; z-index: 1001; display: flex; flex-direction: column; gap: 6px; }
.sp-toast {
  padding: 8px 14px; border-radius: var(--radius2); font-size: 11px;
  font-weight: 600; color: #fff; animation: toastIn .3s ease-out;
  max-width: 280px; box-shadow: var(--shadow2);
}
@keyframes toastIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.sp-toast.ok { background: var(--ok); }
.sp-toast.err { background: var(--err); }
.sp-toast.info { background: var(--accent); }
.sp-toast.warn { background: var(--warn); color: #000; }

/* ═══ EMPTY STATE ═══ */
.sp-empty {
  text-align: center; padding: 30px 20px; color: var(--fg3); font-size: 11px;
}

/* ═══ AI CARD ═══ */
.sp-ai-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px;
  transition: all .15s;
}
#ai-section { animation: fadeIn 0.3s ease-out; }

/* ═══ SCROLLBAR ═══ */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bg4); border-radius: 2px; }

/* ═══ DRAG & DROP ═══ */
.sp-drag-over { border-color: var(--ok) !important; background: var(--ok-bg) !important; }
