/**
 * PipelineLM Pro — Side Panel Controller
 * Tabs: Dashboard, Vault, Pipeline, Folders, Prompts, Sync, Settings
 */

// ═══════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════
const S = {
  tab: 'dashboard',
  artifacts: [],
  notebooks: [],
  folders: [],
  prompts: [],
  syncQueue: [],
  selectedIds: new Set(),
  darkMode: false,
  vaultFilter: 'all',
  lastAIAnalysis: null
};

const TYPE_ICONS = {
  audio: '🎙️', video: '🎥', slide_deck: '📊',
  report: '📄', mind_map: '🧠', unknown: '📎'
};

const STATUS_LABELS = {
  completed: 'Done',
  generating: 'Working',
  failed: 'Failed',
  processing: 'Processing',
  scraped: 'Scanned'
};

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════
function init() {
  // Tab switching
  document.querySelectorAll('.sp-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Vault filters
  document.querySelectorAll('.sp-chip').forEach(chip => {
    chip.addEventListener('click', () => setVaultFilter(chip.dataset.filter));
  });

  // Header buttons
  document.getElementById('btn-sync').addEventListener('click', syncFleet);
  document.getElementById('btn-scan').addEventListener('click', scanPage);
  document.getElementById('btn-theme').addEventListener('click', toggleThemeBtn);

  // Listen for AI analysis from content script
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if(msg.action === 'aiAnalysis' && msg.analysis) {
      S.lastAIAnalysis = msg.analysis;
      renderAIInsights(msg.analysis);
      sendResponse({ received: true });
    }
    return true;
  });

  // Load stored data
  loadData().then(() => {
    renderAll();
    startPolling();
    // Check for cached AI analysis
    chrome.storage.local.get('plm_lastAIAnalysis', (d) => {
      if(d.plm_lastAIAnalysis) {
        S.lastAIAnalysis = d.plm_lastAIAnalysis;
        renderAIInsights(d.plm_lastAIAnalysis);
      }
    });
  });
}

async function loadData() {
  const data = await chrome.storage.local.get([
    'plm_artifacts', 'plm_notebooks', 'plm_folders',
    'plm_prompts', 'plm_syncQueue', 'plm_darkMode'
  ]);
  S.artifacts = data.plm_artifacts || [];
  S.notebooks = data.plm_notebooks || [];
  S.folders = data.plm_folders || getDefaultFolders();
  S.prompts = data.plm_prompts || getDefaultPrompts();
  S.syncQueue = data.plm_syncQueue || [];
  S.darkMode = data.plm_darkMode || false;
  applyTheme(S.darkMode);
}

function getDefaultFolders() {
  return [
    { id:'all', name:'All Notebooks', icon:'📁', notebookIds:[] },
    { id:'f1', name:'Research', icon:'🔬', notebookIds:[] },
    { id:'f2', name:'Work Projects', icon:'💼', notebookIds:[] },
    { id:'f3', name:'Personal', icon:'🏠', notebookIds:[] }
  ];
}

function getDefaultPrompts() {
  return [
    { id:'p1', name:'Deep Dive', text:'Create a comprehensive deep-dive analysis covering all key aspects, controversies, and future implications. Include specific examples and expert perspectives.' },
    { id:'p2', name:'Executive Summary', text:'Provide a concise executive summary with key findings, strategic recommendations, and actionable next steps. Keep it under 500 words.' },
    { id:'p3', name:'Compare & Contrast', text:'Compare and contrast the main viewpoints presented in the sources. Highlight agreements, disagreements, and areas where more research is needed.' },
    { id:'p4', name:'FAQ Generation', text:'Generate a list of 10 frequently asked questions about this topic, with detailed answers based on the provided sources.' },
    { id:'p5', name:'Timeline Creation', text:'Create a chronological timeline of events related to this topic, citing specific dates and sources for each milestone.' },
    { id:'p6', name:'Critical Analysis', text:'Provide a critical analysis evaluating the strengths and weaknesses of the arguments presented. Identify any biases or gaps in the sources.' }
  ];
}

// ═══════════════════════════════════════════════════════════════
//  TAB SWITCHING
// ═══════════════════════════════════════════════════════════════
function switchTab(tab) {
  S.tab = tab;
  document.querySelectorAll('.sp-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.sp-tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${tab}`));
  renderAll();
}

// ═══════════════════════════════════════════════════════════════
//  RENDER ALL
// ═══════════════════════════════════════════════════════════════
function renderAll() {
  renderDashboard();
  renderVault();
  renderPipeline();
  renderFolders();
  renderPrompts();
  renderSync();
  renderSettings();
}

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════
function renderAIInsights(analysis) {
  chrome.storage.local.set({ plm_lastAIAnalysis: analysis });
  S.lastAIAnalysis = analysis;
  if(S.tab === 'dashboard') renderDashboard();
}

function renderDashboard() {
  const artifacts = S.artifacts;
  const generating = artifacts.filter(a => a.status === 'generating' || a.status === 'processing').length;
  const completed = artifacts.filter(a => a.status === 'completed').length;
  const stored = artifacts.filter(a => a.localPath).length;
  const failed = artifacts.filter(a => a.status === 'failed').length;

  document.getElementById('stats-grid').innerHTML = `
    <div class="sp-stat-card" onclick="switchTab('vault')">
      <div class="sp-stat-value" style="color:var(--accent)">${artifacts.length}</div>
      <div class="sp-stat-label">Artifacts</div>
    </div>
    <div class="sp-stat-card" onclick="switchTab('pipeline')">
      <div class="sp-stat-value" style="color:var(--warn)">${generating}</div>
      <div class="sp-stat-label">Generating</div>
    </div>
    <div class="sp-stat-card" onclick="switchTab('vault')">
      <div class="sp-stat-value" style="color:var(--ok)">${completed}</div>
      <div class="sp-stat-label">Completed</div>
    </div>
    <div class="sp-stat-card" onclick="switchTab('vault')">
      <div class="sp-stat-value">${stored}</div>
      <div class="sp-stat-label">Stored</div>
    </div>
    <div class="sp-stat-card" onclick="switchTab('folders')">
      <div class="sp-stat-value">${S.folders.length - 1}</div>
      <div class="sp-stat-label">Folders</div>
    </div>
    <div class="sp-stat-card">
      <div class="sp-stat-value" style="color:var(--err)">${failed}</div>
      <div class="sp-stat-label">Failed</div>
    </div>
  `;

  // AI Insights (if available)
  const aiSection = document.getElementById('ai-section');
  const aiEl = document.getElementById('ai-insights');
  if(aiSection && aiEl && S.lastAIAnalysis) {
    aiSection.style.display = 'block';
    const a = S.lastAIAnalysis;
    aiEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <span style="font-size:14px">🤖</span>
        <span style="font-weight:700;font-size:11px">AI Analysis</span>
        <span style="margin-left:auto;font-size:9px;color:var(--fg3)">${formatDate(Date.now())}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:10px">
        <div style="padding:6px;background:var(--bg3);border-radius:6px">
          <div style="color:var(--fg3);margin-bottom:2px">Topic</div>
          <div style="font-weight:600;color:var(--accent)">${escape(a.topic.topic || '?')}</div>
        </div>
        <div style="padding:6px;background:var(--bg3);border-radius:6px">
          <div style="color:var(--fg3);margin-bottom:2px">Audience</div>
          <div style="font-weight:600">${escape(a.audience.audience)}</div>
        </div>
      </div>
      <div style="margin-top:6px;padding:6px;background:var(--accent3);border-radius:6px;font-size:10px">
        <span style="font-weight:600">Suggested:</span> ${escape(a.format.primary)}
        ${a.suggestionCount > 0 ? `<span style="float:right" class="sp-badge ok">${a.suggestionCount} prompts</span>` : ''}
      </div>
    `;
    aiEl.style.display = 'block';
  } else if(aiEl) {
    aiEl.style.display = 'none';
  }

  // Recent artifacts
  const recentEl = document.getElementById('recent-list');
  if(artifacts.length === 0) {
    recentEl.innerHTML = '<div class="sp-empty">No artifacts yet. Visit a notebook and scan to discover content.</div>';
  } else {
    recentEl.innerHTML = artifacts.slice(0, 6).map(a => `
      <div class="sp-list-item" onclick="inspectArtifact('${a.id}')">
        <span>${TYPE_ICONS[a.type] || '📎'}</span>
        <span class="sp-item-title">${escape(a.title || 'Untitled')}</span>
        <span class="sp-badge ${a.status === 'completed' ? 'ok' : a.status === 'failed' ? 'err' : a.status === 'generating' ? 'warn' : 'info'}">${STATUS_LABELS[a.status] || a.status || '?'}</span>
      </div>
    `).join('');
  }

  // Notebooks
  const nbEl = document.getElementById('notebook-list');
  if(S.notebooks.length === 0) {
    nbEl.innerHTML = '<div class="sp-empty">No notebooks synced. Click 🔄 to sync your NotebookLM fleet.</div>';
  } else {
    nbEl.innerHTML = S.notebooks.slice(0, 8).map(nb => `
      <div class="sp-list-item" onclick="pullFromNotebook('${nb.id}')" title="Click to pull artifacts">
        <span>📓</span>
        <span class="sp-item-title">${escape(nb.title || 'Untitled')}</span>
        <span class="sp-item-meta">${nb.sourceCount || 0} sources</span>
      </div>
    `).join('');
  }
}

// ═══════════════════════════════════════════════════════════════
//  VAULT
// ═══════════════════════════════════════════════════════════════
function renderVault() {
  const grid = document.getElementById('vault-grid');
  let filtered = S.vaultFilter === 'all' ? S.artifacts : S.artifacts.filter(a => a.type === S.vaultFilter);

  if(filtered.length === 0) {
    grid.innerHTML = '<div class="sp-empty" style="grid-column:1/-1">No artifacts match this filter.</div>';
    return;
  }

  grid.innerHTML = filtered.map(a => `
    <div class="sp-artifact-card ${S.selectedIds.has(a.id) ? 'selected' : ''}" onclick="toggleSelect('${a.id}')" ondblclick="inspectArtifact('${a.id}')">
      <div class="sp-card-actions">
        <button class="sp-btn-icon sm" onclick="event.stopPropagation();storeArtifact('${a.id}')" title="Store">💾</button>
        <button class="sp-btn-icon sm" onclick="event.stopPropagation();downloadArtifact('${a.id}')" title="Download">⬇️</button>
      </div>
      <div class="sp-card-icon">${TYPE_ICONS[a.type] || '📎'}</div>
      <div class="sp-card-title">${escape(a.title || 'Untitled')}</div>
      <div class="sp-card-meta">
        <span class="sp-badge ${a.status === 'completed' ? 'ok' : a.status === 'failed' ? 'err' : a.status === 'generating' ? 'warn' : 'info'}">${STATUS_LABELS[a.status] || '?'}</span>
        <span>${a.notebookName || '?'}</span>
      </div>
    </div>
  `).join('');

  document.getElementById('vault-bulk').style.display = S.selectedIds.size > 0 ? 'flex' : 'none';
}

function setVaultFilter(filter) {
  S.vaultFilter = filter;
  document.querySelectorAll('.sp-chip').forEach(c => c.classList.toggle('active', c.dataset.filter === filter));
  renderVault();
}

// ═══════════════════════════════════════════════════════════════
//  PIPELINE
// ═══════════════════════════════════════════════════════════════
function renderPipeline() {
  const artifacts = S.artifacts;
  const generating = artifacts.filter(a => a.status === 'generating' || a.status === 'processing');
  const completed = artifacts.filter(a => a.status === 'completed');
  const failed = artifacts.filter(a => a.status === 'failed');

  document.getElementById('p-generating').textContent = generating.length;
  document.getElementById('p-completed').textContent = completed.length;
  document.getElementById('p-failed').textContent = failed.length;

  renderPipelineColumn('col-generating', generating, 'generating');
  renderPipelineColumn('col-completed', completed, 'completed');
  renderPipelineColumn('col-failed', failed, 'failed');
}

function renderPipelineColumn(elId, items, statusClass) {
  const el = document.getElementById(elId);
  if(items.length === 0) {
    el.innerHTML = '<div class="sp-empty">No items</div>';
    return;
  }
  el.innerHTML = items.map(a => `
    <div class="sp-pipeline-card ${statusClass}" onclick="inspectArtifact('${a.id}')">
      <div style="font-weight:600;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escape(a.title || 'Untitled')}</div>
      <div style="font-size:10px;color:var(--fg3);display:flex;gap:6px">
        <span>${TYPE_ICONS[a.type] || '📎'}</span>
        <span>${a.notebookName || '?'}</span>
        ${a.progress ? `<span>${a.progress}%</span>` : ''}
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════════════
//  FOLDERS
// ═══════════════════════════════════════════════════════════════
function renderFolders() {
  const list = document.getElementById('folders-list');
  const folders = S.folders.filter(f => f.id !== 'all');
  if(folders.length === 0) {
    list.innerHTML = '<div class="sp-empty">No custom folders. Click + New to create one.</div>';
    return;
  }
  list.innerHTML = folders.map(f => `
    <div class="sp-folder-row" data-folder="${f.id}">
      <span class="sp-folder-icon">${f.icon || '📂'}</span>
      <span class="sp-folder-name">${escape(f.name)}</span>
      <span class="sp-folder-count">${f.notebookIds?.length || 0}</span>
      <button class="sp-btn-icon sm" onclick="event.stopPropagation();renameFolder('${f.id}')" title="Rename">✏️</button>
      <button class="sp-btn-icon sm" onclick="event.stopPropagation();deleteFolder('${f.id}')" title="Delete">🗑️</button>
    </div>
  `).join('');
}

window.createFolder = function() {
  const name = prompt('Folder name:');
  if(!name?.trim()) return;
  const folder = { id:'f_'+Date.now(), name:name.trim(), icon:'📂', notebookIds:[] };
  S.folders.push(folder);
  saveFolders();
  renderFolders();
  toast('Folder created', 'ok');
};

window.renameFolder = function(id) {
  const folder = S.folders.find(f => f.id === id);
  if(!folder) return;
  const name = prompt('New name:', folder.name);
  if(name?.trim()) { folder.name = name.trim(); saveFolders(); renderFolders(); toast('Renamed', 'ok'); }
};

window.deleteFolder = function(id) {
  if(!confirm('Delete this folder?')) return;
  S.folders = S.folders.filter(f => f.id !== id);
  saveFolders();
  renderFolders();
  toast('Folder deleted', 'ok');
};

function saveFolders() { chrome.storage.local.set({ plm_folders: S.folders }); }

// ═══════════════════════════════════════════════════════════════
//  PROMPTS
// ═══════════════════════════════════════════════════════════════
function renderPrompts() {
  const list = document.getElementById('prompts-list');
  if(S.prompts.length === 0) {
    list.innerHTML = '<div class="sp-empty">No custom prompts. Click + New to add one.</div>';
    return;
  }
  list.innerHTML = S.prompts.map((p, i) => `
    <div class="sp-prompt-card" onclick="editPrompt(${i})">
      <div class="sp-prompt-name">${escape(p.name)}</div>
      <div class="sp-prompt-text">${escape(p.text)}</div>
      <div class="sp-prompt-actions">
        <button class="sp-btn sm" onclick="event.stopPropagation();injectPrompt(${i})">Insert</button>
        <button class="sp-btn sm err" onclick="event.stopPropagation();deletePrompt(${i})">Delete</button>
      </div>
    </div>
  `).join('');
}

window.addPrompt = function() {
  const name = prompt('Prompt name:');
  if(!name?.trim()) return;
  const text = prompt('Prompt template (use {topic} and {audience} as variables):');
  if(!text?.trim()) return;
  S.prompts.push({ id:'p_'+Date.now(), name:name.trim(), text:text.trim() });
  savePrompts();
  renderPrompts();
  toast('Prompt added', 'ok');
};

window.editPrompt = function(idx) {
  const p = S.prompts[idx];
  if(!p) return;
  const name = prompt('Name:', p.name);
  if(name?.trim()) p.name = name.trim();
  const text = prompt('Template:', p.text);
  if(text?.trim()) p.text = text.trim();
  savePrompts();
  renderPrompts();
};

window.deletePrompt = function(idx) {
  if(!confirm('Delete this prompt?')) return;
  S.prompts.splice(idx, 1);
  savePrompts();
  renderPrompts();
  toast('Prompt deleted', 'ok');
};

window.resetPrompts = function() {
  if(!confirm('Reset to default prompts? This will overwrite custom prompts.')) return;
  S.prompts = getDefaultPrompts();
  savePrompts();
  renderPrompts();
  toast('Reset to defaults', 'ok');
};

window.injectPrompt = async function(idx) {
  const p = S.prompts[idx];
  if(!p) return;
  try {
    const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
    if(!tab?.url?.includes('notebooklm.google.com')) {
      toast('Open NotebookLM to insert a prompt', 'warn');
      return;
    }
    await chrome.tabs.sendMessage(tab.id, { action: 'injectPrompt', text: p.text });
    toast('Prompt sent to NotebookLM', 'ok');
  } catch(e) { toast('Could not send prompt: ' + e.message, 'err'); }
};

function savePrompts() { chrome.storage.local.set({ plm_prompts: S.prompts }); }

// ═══════════════════════════════════════════════════════════════
//  SYNC
// ═══════════════════════════════════════════════════════════════
function renderSync() {
  const queueEl = document.getElementById('sync-queue');
  if(S.syncQueue.length === 0) {
    queueEl.innerHTML = '<div class="sp-empty">No sync jobs in queue.</div>';
  } else {
    queueEl.innerHTML = S.syncQueue.slice(-10).map(q => `
      <div class="sp-list-item">
        <span>${q.sourceType === 'reddit' ? '🤖' : q.sourceType === 'gdoc' ? '📝' : '🧠'}</span>
        <span class="sp-item-title">${escape(q.title || q.sourceType)}</span>
        <span class="sp-badge ${q.status === 'done' ? 'ok' : q.status === 'failed' ? 'err' : 'warn'}">${q.status || 'pending'}</span>
      </div>
    `).join('');
  }
}

window.syncExternal = async function(type) {
  const url = prompt(type === 'reddit' ? 'Reddit thread URL:' : type === 'gdocs' ? 'Google Doc URL:' : 'Claude chat URL:');
  if(!url?.trim()) return;
  toast(`Syncing from ${type}...`, 'info');
  try {
    const result = await chrome.runtime.sendMessage({ action: 'syncExternal', type, url: url.trim() });
    if(result?.error) { toast(result.error, 'err'); return; }
    toast(`Synced: ${result?.pages || 'content'} items`, 'ok');
    // Refresh queue
    const data = await chrome.storage.local.get('plm_syncQueue');
    S.syncQueue = data.plm_syncQueue || [];
    renderSync();
  } catch(e) { toast('Sync failed: ' + e.message, 'err'); }
};

// ═══════════════════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════════════════
function renderSettings() {
  document.getElementById('setting-dark').checked = S.darkMode;
  // Calculate storage
  chrome.storage.local.getBytesInUse(null, (bytes) => {
    const mb = bytes ? (bytes / 1024 / 1024).toFixed(2) : '0';
    document.getElementById('storage-usage').textContent = `${mb} MB used`;
  });
}

window.toggleTheme = function(on) {
  S.darkMode = on;
  applyTheme(on);
  chrome.storage.local.set({ plm_darkMode: on });
  toast(on ? 'Dark mode enabled' : 'Light mode enabled', 'ok');
};

function toggleThemeBtn() {
  S.darkMode = !S.darkMode;
  applyTheme(S.darkMode);
  chrome.storage.local.set({ plm_darkMode: S.darkMode });
  document.getElementById('btn-theme').textContent = S.darkMode ? '☀️' : '🌙';
  document.getElementById('setting-dark').checked = S.darkMode;
  toast(S.darkMode ? 'Dark mode enabled' : 'Light mode enabled', 'ok');
}

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

window.clearAllData = async function() {
  if(!confirm('Clear ALL PipelineLM data? This cannot be undone.')) return;
  await chrome.storage.local.remove([
    'plm_artifacts','plm_notebooks','plm_folders','plm_prompts',
    'plm_syncQueue','plm_pendingSources','plm_exportHistory'
  ]);
  S.artifacts = []; S.notebooks = []; S.folders = getDefaultFolders();
  S.prompts = getDefaultPrompts(); S.syncQueue = [];
  renderAll();
  toast('All data cleared', 'ok');
};

// ═══════════════════════════════════════════════════════════════
//  ACTIONS
// ═══════════════════════════════════════════════════════════════
window.inspectArtifact = function(id) {
  const a = S.artifacts.find(x => x.id === id);
  if(!a) return;
  const modal = document.getElementById('detail-modal');
  document.getElementById('modal-title').textContent = a.title || 'Untitled';
  document.getElementById('modal-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div><div class="sp-form-label">Type</div><div>${a.type || '?'}</div></div>
      <div><div class="sp-form-label">Status</div><span class="sp-badge ${a.status==='completed'?'ok':a.status==='failed'?'err':a.status==='generating'?'warn':'info'}">${a.status || '?'}</span></div>
      <div><div class="sp-form-label">Notebook</div><div>${escape(a.notebookName || '?')}</div></div>
      <div><div class="sp-form-label">Created</div><div>${formatDate(a.createdAt)}</div></div>
      <div><div class="sp-form-label">Size</div><div>${formatBytes(a.size)}</div></div>
      <div><div class="sp-form-label">Stored</div><div>${a.localPath ? 'Yes' : 'No'}</div></div>
    </div>
    ${a.prompt ? `<div class="sp-form-label">Prompt</div><div class="sp-textarea" style="min-height:60px" readonly>${escape(a.prompt)}</div>` : ''}
    ${a.error ? `<div class="sp-form-label" style="color:var(--err)">Error</div><div style="color:var(--err);font-size:11px">${escape(a.error)}</div>` : ''}
  `;
  document.getElementById('modal-footer').innerHTML = `
    <button class="sp-btn" onclick="closeModal()">Close</button>
    ${a.localPath ? '' : `<button class="sp-btn ok" onclick="storeArtifact('${a.id}');closeModal()">Store</button>`}
    <button class="sp-btn primary" onclick="downloadArtifact('${a.id}');closeModal()">Download</button>
    <button class="sp-btn err" onclick="deleteArtifact('${a.id}');closeModal()">Delete</button>
  `;
  modal.classList.add('visible');
};

window.closeModal = function() {
  document.getElementById('detail-modal').classList.remove('visible');
};

window.toggleSelect = function(id) {
  S.selectedIds.has(id) ? S.selectedIds.delete(id) : S.selectedIds.add(id);
  renderVault();
};

window.clearSelection = function() {
  S.selectedIds.clear();
  renderVault();
};

window.bulkStore = async function() {
  const ids = Array.from(S.selectedIds);
  toast(`Storing ${ids.length} artifacts...`, 'info');
  // Send to background
  for(const id of ids) {
    try { await chrome.runtime.sendMessage({ action: 'storeArtifact', artifactId: id }); }
    catch(e) {}
  }
  S.selectedIds.clear();
  renderVault();
  toast('Store complete', 'ok');
};

window.bulkDownload = function() {
  S.selectedIds.forEach(id => downloadArtifact(id));
  toast(`Queued ${S.selectedIds.size} downloads`, 'ok');
};

window.bulkDelete = function() {
  if(!confirm(`Delete ${S.selectedIds.size} artifacts?`)) return;
  S.artifacts = S.artifacts.filter(a => !S.selectedIds.has(a.id));
  chrome.storage.local.set({ plm_artifacts: S.artifacts });
  S.selectedIds.clear();
  renderAll();
  toast('Deleted', 'ok');
};

window.storeArtifact = async function(id) {
  try {
    await chrome.runtime.sendMessage({ action: 'storeArtifact', artifactId: id });
    toast('Stored', 'ok');
  } catch(e) { toast('Store failed', 'err'); }
};

window.downloadArtifact = function(id) {
  const a = S.artifacts.find(x => x.id === id);
  if(!a) return;
  const url = a.downloadUrl || a.localPath;
  if(url) {
    chrome.downloads.download({ url, filename: `pipelinelm/${a.type}/${(a.title||'artifact').replace(/[^a-z0-9]/gi,'_').slice(0,40)}.${a.type==='video'?'mp4':a.type==='slide_deck'?'pdf':a.type==='report'?'md':a.type==='mind_map'?'json':'mp3'}` });
    toast('Download started', 'ok');
  } else {
    toast('No download URL', 'warn');
  }
};

window.deleteArtifact = function(id) {
  if(!confirm('Delete this artifact?')) return;
  S.artifacts = S.artifacts.filter(a => a.id !== id);
  S.selectedIds.delete(id);
  chrome.storage.local.set({ plm_artifacts: S.artifacts });
  renderAll();
  toast('Deleted', 'ok');
};

// ═══════════════════════════════════════════════════════════════
//  SYNC & SCAN
// ═══════════════════════════════════════════════════════════════
window.syncFleet = async function() {
  toast('Syncing fleet...', 'info');
  try {
    const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
    const notebooks = await chrome.tabs.sendMessage(tab.id, { action: 'syncFleet' });
    if(notebooks) {
      S.notebooks = notebooks;
      chrome.storage.local.set({ plm_notebooks: notebooks });
      renderDashboard();
      toast(`Synced ${notebooks.length} notebooks`, 'ok');
    }
  } catch(e) { toast('Sync failed', 'err'); }
};

window.scanPage = async function() {
  toast('Scanning page...', 'info');
  try {
    const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
    const artifacts = await chrome.tabs.sendMessage(tab.id, { action: 'scanPage' });
    if(artifacts?.length) {
      S.artifacts = [...artifacts, ...S.artifacts];
      chrome.storage.local.set({ plm_artifacts: S.artifacts });
      renderAll();
      toast(`Found ${artifacts.length} artifacts`, 'ok');
    } else {
      toast('No artifacts found', 'warn');
    }
  } catch(e) { toast('Scan failed', 'err'); }
};

window.pullFromNotebook = async function(notebookId) {
  toast('Pulling artifacts...', 'info');
  try {
    const result = await chrome.runtime.sendMessage({ action: 'pullArtifacts', notebookId });
    if(result?.artifacts?.length) {
      S.artifacts = [...result.artifacts, ...S.artifacts];
      chrome.storage.local.set({ plm_artifacts: S.artifacts });
      renderAll();
      toast(`Pulled ${result.artifacts.length} artifacts`, 'ok');
    }
  } catch(e) { toast('Pull failed', 'err'); }
};

window.pollStatus = async function() {
  toast('Checking status...', 'info');
  try {
    const generating = S.artifacts.filter(a => a.status === 'generating' || a.status === 'processing');
    if(!generating.length) { toast('Nothing generating', 'ok'); return; }
    const result = await chrome.runtime.sendMessage({ action: 'pollArtifacts', ids: generating.map(a => a.id) });
    if(result?.results) {
      let changed = false;
      for(const r of result.results) {
        const idx = S.artifacts.findIndex(a => a.id === r.id);
        if(idx !== -1 && S.artifacts[idx].status !== r.status) {
          S.artifacts[idx].status = r.status;
          changed = true;
        }
      }
      if(changed) {
        chrome.storage.local.set({ plm_artifacts: S.artifacts });
        renderAll();
        toast('Status updated', 'ok');
      } else {
        toast('No changes', 'info');
      }
    }
  } catch(e) { toast('Poll failed', 'err'); }
};

// ═══════════════════════════════════════════════════════════════
//  POLLING
// ═══════════════════════════════════════════════════════════════
function startPolling() {
  // Poll every 30 seconds for generating artifacts
  setInterval(async () => {
    const generating = S.artifacts.filter(a => a.status === 'generating' || a.status === 'processing');
    if(!generating.length) return;
    try {
      const result = await chrome.runtime.sendMessage({
        action: 'pollArtifacts',
        ids: generating.map(a => a.id)
      });
      if(result?.results) {
        let changed = false;
        for(const r of result.results) {
          const idx = S.artifacts.findIndex(a => a.id === r.id);
          if(idx !== -1 && S.artifacts[idx].status !== r.status) {
            S.artifacts[idx] = { ...S.artifacts[idx], ...r };
            changed = true;
          }
        }
        if(changed) {
          chrome.storage.local.set({ plm_artifacts: S.artifacts });
          renderAll();
        }
      }
    } catch(e) {}
  }, 30000);
}

// ═══════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════
function escape(t) {
  if(!t) return '';
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

function formatDate(ts) {
  if(!ts) return '-';
  const d = new Date(ts);
  return isNaN(d.getTime()) ? ts : d.toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

function formatBytes(b) {
  if(!b || b === 0) return '0 B';
  const u = ['B','KB','MB','GB'];
  let i = 0;
  while(b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
  return b.toFixed(1) + ' ' + u[i];
}

function toast(msg, type) {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'sp-toast ' + type;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ─── Start ───
document.addEventListener('DOMContentLoaded', init);
