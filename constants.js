<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PipelineLM Pro</title>
<link rel="stylesheet" href="sidepanel.css">
</head>
<body>

<!-- Header -->
<header class="sp-header">
  <div class="sp-brand">
    <img src="../icons/icon32.png" alt="PLM" class="sp-logo">
    <span class="sp-title">PipelineLM</span>
    <span class="sp-version">Pro</span>
  </div>
  <div class="sp-actions">
    <button class="sp-btn-icon" id="btn-theme" title="Toggle Dark Mode">🌙</button>
    <button class="sp-btn-icon" id="btn-sync" title="Sync Fleet">🔄</button>
    <button class="sp-btn-icon" id="btn-scan" title="Scan Current Page">📡</button>
  </div>
</header>

<!-- Tabs -->
<nav class="sp-tabs">
  <button class="sp-tab active" data-tab="dashboard">Dashboard</button>
  <button class="sp-tab" data-tab="vault">Vault</button>
  <button class="sp-tab" data-tab="pipeline">Pipeline</button>
  <button class="sp-tab" data-tab="folders">Folders</button>
  <button class="sp-tab" data-tab="prompts">Prompts</button>
  <button class="sp-tab" data-tab="sync">Sync</button>
  <button class="sp-tab" data-tab="settings">⚙️</button>
</nav>

<!-- Dashboard Tab -->
<section class="sp-tab-content active" id="tab-dashboard">
  <div class="sp-stats-grid" id="stats-grid"></div>
  <div class="sp-section" id="ai-section" style="display:none">
    <h3 class="sp-section-title">🤖 AI Insights</h3>
    <div id="ai-insights" class="sp-ai-card"></div>
  </div>
  <div class="sp-section">
    <h3 class="sp-section-title">Recent Activity</h3>
    <div id="recent-list" class="sp-list"></div>
  </div>
  <div class="sp-section">
    <h3 class="sp-section-title">Notebook Fleet</h3>
    <div id="notebook-list" class="sp-list"></div>
  </div>
</section>

<!-- Vault Tab -->
<section class="sp-tab-content" id="tab-vault">
  <div class="sp-toolbar">
    <div class="sp-filter-chips" id="vault-filters">
      <button class="sp-chip active" data-filter="all">All</button>
      <button class="sp-chip" data-filter="audio">🎙️ Audio</button>
      <button class="sp-chip" data-filter="video">🎥 Video</button>
      <button class="sp-chip" data-filter="slide_deck">📊 Slides</button>
      <button class="sp-chip" data-filter="report">📄 Reports</button>
      <button class="sp-chip" data-filter="mind_map">🧠 Mind Maps</button>
    </div>
    <div class="sp-bulk-actions" id="vault-bulk" style="display:none">
      <button class="sp-btn sm" onclick="bulkStore()">💾 Store</button>
      <button class="sp-btn sm" onclick="bulkDownload()">⬇️ Download</button>
      <button class="sp-btn sm err" onclick="bulkDelete()">🗑️ Delete</button>
      <button class="sp-btn sm" onclick="clearSelection()">Clear</button>
    </div>
  </div>
  <div id="vault-grid" class="sp-vault-grid"></div>
</section>

<!-- Pipeline Tab -->
<section class="sp-tab-content" id="tab-pipeline">
  <div class="sp-pipeline-status">
    <div class="sp-status-item">
      <span class="sp-status-dot generating"></span>
      <span id="p-generating">0</span> Generating
    </div>
    <div class="sp-status-item">
      <span class="sp-status-dot completed"></span>
      <span id="p-completed">0</span> Completed
    </div>
    <div class="sp-status-item">
      <span class="sp-status-dot failed"></span>
      <span id="p-failed">0</span> Failed
    </div>
    <button class="sp-btn sm" onclick="pollStatus()">Check Now</button>
  </div>
  <div class="sp-columns" id="pipeline-columns">
    <div class="sp-column">
      <h4 class="sp-column-title generating">⚙️ Generating</h4>
      <div id="col-generating" class="sp-column-content"></div>
    </div>
    <div class="sp-column">
      <h4 class="sp-column-title completed">✅ Completed</h4>
      <div id="col-completed" class="sp-column-content"></div>
    </div>
    <div class="sp-column">
      <h4 class="sp-column-title failed">❌ Failed</h4>
      <div id="col-failed" class="sp-column-content"></div>
    </div>
  </div>
</section>

<!-- Folders Tab -->
<section class="sp-tab-content" id="tab-folders">
  <div class="sp-toolbar">
    <button class="sp-btn primary" onclick="createFolder()">+ New Folder</button>
  </div>
  <div id="folders-list" class="sp-folders-grid"></div>
</section>

<!-- Prompts Tab -->
<section class="sp-tab-content" id="tab-prompts">
  <div class="sp-toolbar">
    <button class="sp-btn primary" onclick="addPrompt()">+ New Prompt</button>
    <button class="sp-btn" onclick="resetPrompts()">Reset Defaults</button>
  </div>
  <div id="prompts-list" class="sp-prompts-list"></div>
</section>

<!-- Sync Tab -->
<section class="sp-tab-content" id="tab-sync">
  <div class="sp-section">
    <h3 class="sp-section-title">Sync External Content</h3>
    <div class="sp-sync-grid">
      <button class="sp-sync-card" onclick="syncExternal('reddit')">
        <span class="sp-sync-icon">🤖</span>
        <span class="sp-sync-name">Reddit Thread</span>
        <span class="sp-sync-desc">Sync entire threads, discussions, and comments</span>
      </button>
      <button class="sp-sync-card" onclick="syncExternal('gdocs')">
        <span class="sp-sync-icon">📝</span>
        <span class="sp-sync-name">Google Doc</span>
        <span class="sp-sync-desc">Import documents for AI analysis</span>
      </button>
      <button class="sp-sync-card" onclick="syncExternal('claude')">
        <span class="sp-sync-icon">🧠</span>
        <span class="sp-sync-name">Claude Chat</span>
        <span class="sp-sync-desc">Save AI chat histories as sources</span>
      </button>
    </div>
  </div>
  <div class="sp-section">
    <h3 class="sp-section-title">Sync Queue</h3>
    <div id="sync-queue" class="sp-list"></div>
  </div>
  <div class="sp-section">
    <h3 class="sp-section-title">Export History</h3>
    <div id="export-history" class="sp-list"></div>
  </div>
</section>

<!-- Settings Tab -->
<section class="sp-tab-content" id="tab-settings">
  <div class="sp-section">
    <h3 class="sp-section-title">Appearance</h3>
    <div class="sp-setting-row">
      <label class="sp-setting-label">Dark Mode</label>
      <label class="sp-toggle">
        <input type="checkbox" id="setting-dark" onchange="toggleTheme(this.checked)">
        <span class="sp-toggle-slider"></span>
      </label>
    </div>
  </div>
  <div class="sp-section">
    <h3 class="sp-section-title">Storage</h3>
    <div class="sp-setting-row">
      <span id="storage-usage">Calculating...</span>
      <button class="sp-btn sm" onclick="clearAllData()">Clear All Data</button>
    </div>
  </div>
  <div class="sp-section">
    <h3 class="sp-section-title">About</h3>
    <p class="sp-text-muted">PipelineLM Pro v2.0.0</p>
    <p class="sp-text-muted">Your data stays local. No information leaves your browser.</p>
    <p class="sp-text-muted">Built for NotebookLM power users.</p>
  </div>
</section>

<!-- Detail Modal -->
<div class="sp-modal" id="detail-modal">
  <div class="sp-modal-card">
    <div class="sp-modal-header">
      <h3 id="modal-title">Artifact Details</h3>
      <button class="sp-btn-icon" onclick="closeModal()">✕</button>
    </div>
    <div class="sp-modal-body" id="modal-body"></div>
    <div class="sp-modal-footer" id="modal-footer"></div>
  </div>
</div>

<!-- Toast -->
<div id="toast-container"></div>

<script type="module" src="sidepanel.js"></script>
</body>
</html>
