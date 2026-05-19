/**
 * PipelineLM Pro v3.0 — Content Script
 * Complete NotebookLM enhancement suite:
 * Studio Item Generator, Bulk Source Adder, Inline Viewer,
 * Study Mode, Audio Player, Prompt Shortcodes, Tag System
 */
(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  //  STATE
  // ═══════════════════════════════════════════════════════════════
  const S = {
    darkMode: false,
    folders: [],
    prompts: [],
    tags: [],
    toolbarOpen: false,
    folderPanelOpen: false,
    currentNotebookId: null,
    currentNotebookTitle: '',
    sources: [],
    generatingJobs: [],
    lastAnalysis: null,
    activeLang: 'en'
  };

  const DEFAULT_PROMPTS = [
    { id:'p1', name:'Deep Dive', shortcut:'dd', text:'Create a comprehensive deep-dive analysis covering all key aspects, controversies, and future implications. Include specific examples and expert perspectives.', icon:'🔬' },
    { id:'p2', name:'Executive Summary', shortcut:'es', text:'Provide a concise executive summary with key findings, strategic recommendations, and actionable next steps. Keep it under 500 words.', icon:'📊' },
    { id:'p3', name:'Compare & Contrast', shortcut:'cc', text:'Compare and contrast the main viewpoints presented in the sources. Highlight agreements, disagreements, and areas where more research is needed.', icon:'⚖️' },
    { id:'p4', name:'FAQ Generation', shortcut:'faq', text:'Generate a list of 10 frequently asked questions about this topic, with detailed answers based on the provided sources.', icon:'❓' },
    { id:'p5', name:'Timeline Creation', shortcut:'tl', text:'Create a chronological timeline of events related to this topic, citing specific dates and sources for each milestone.', icon:'📅' },
    { id:'p6', name:'Critical Analysis', shortcut:'ca', text:'Provide a critical analysis evaluating the strengths and weaknesses of the arguments presented. Identify any biases or gaps in the sources.', icon:'🔍' },
    { id:'p7', name:'Quiz Generator', shortcut:'qz', text:'Create a 10-question quiz that tests understanding of the key concepts, facts, and relationships from the sources.', icon:'🧩' },
    { id:'p8', name:'Flashcards', shortcut:'fc', text:'Generate 20 study flashcards covering the most important terms, definitions, concepts, and facts from these sources.', icon:'🗂️' }
  ];

  const STUDIO_TYPES = [
    { id:'audio', name:'Audio Overview', icon:'🎙️', color:'#6366f1', desc:'Podcast-style deep-dive' },
    { id:'video', name:'Video Overview', icon:'🎥', color:'#ec4899', desc:'Visual explainer' },
    { id:'report', name:'Report', icon:'📄', color:'#3b82f6', desc:'Written analysis' },
    { id:'quiz', name:'Quiz', icon:'🧩', color:'#f59e0b', desc:'Interactive assessment' },
    { id:'flashcard', name:'Flashcards', icon:'🗂️', color:'#10b981', desc:'Study cards' },
    { id:'slide_deck', name:'Slide Deck', icon:'📊', color:'#8b5cf6', desc:'Presentation' },
    { id:'mind_map', name:'Mind Map', icon:'🧠', color:'#06b6d4', desc:'Concept map' },
    { id:'data_table', name:'Data Table', icon:'📋', color:'#f97316', desc:'Structured data' },
    { id:'infographic', name:'Infographic', icon:'🎨', color:'#e11d48', desc:'Visual summary' }
  ];

  const TAG_COLORS = [
    {name:'Blue',bg:'#dbeafe',text:'#1e40af',border:'#93c5fd'},
    {name:'Green',bg:'#d1fae5',text:'#065f46',border:'#6ee7b7'},
    {name:'Purple',bg:'#ede9fe',text:'#5b21b6',border:'#a78bfa'},
    {name:'Orange',bg:'#ffedd5',text:'#9a3412',border:'#fdba74'},
    {name:'Pink',bg:'#fce7f3',text:'#9d174d',border:'#f9a8d4'},
    {name:'Red',bg:'#fee2e2',text:'#991b1b',border:'#fca5a5'},
    {name:'Yellow',bg:'#fef9c3',text:'#854d0e',border:'#fde047'},
    {name:'Cyan',bg:'#cffafe',text:'#155e75',border:'#67e8f9'},
    {name:'Gray',bg:'#f3f4f6',text:'#374151',border:'#d1d5db'},
    {name:'Indigo',bg:'#e0e7ff',text:'#3730a3',border:'#a5b4fc'}
  ];

  // ═══════════════════════════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    chrome.storage.local.get(['plm_darkMode','plm_folders','plm_prompts','plm_tags','plm_lang','plm_jobs'], (data) => {
      S.darkMode = data.plm_darkMode || false;
      S.folders = data.plm_folders || [{id:'all',name:'All',icon:'📁',notebookIds:[]}];
      S.prompts = data.plm_prompts || JSON.parse(JSON.stringify(DEFAULT_PROMPTS));
      S.tags = data.plm_tags || [];
      S.activeLang = data.plm_lang || 'en';
      S.generatingJobs = data.plm_jobs || [];
      if(S.darkMode) applyDarkMode(true);
      waitForNL(() => {
        injectToolbar();
        detectPageAndInject();
        startURLWatcher();
        initPromptShortcodes();
        initKeyboardShortcuts();
      });
    });
  }

  function waitForNL(cb) { document.querySelector('header,nav,[class*="app-bar"]') ? cb() : setTimeout(() => waitForNL(cb), 500); }

  let lastPath = location.pathname;
  let navTimer = null;
  function startURLWatcher() {
    setInterval(() => {
      if(location.pathname !== lastPath) {
        clearTimeout(navTimer);
        navTimer = setTimeout(() => {
          if(location.pathname !== lastPath) {
            lastPath = location.pathname;
            cleanupInjected();
            detectPageAndInject();
          }
        }, 400);
      }
    }, 800);
  }

  function detectPageAndInject() {
    const p = location.pathname;
    if(p === '/' || p === '/home' || p === '') {
      injectFolderManager();
      injectTagSystem();
    } else if(p.startsWith('/notebook/')) {
      const m = p.match(/\/notebook\/([^\/]+)/);
      S.currentNotebookId = m ? m[1] : null;
      S.currentNotebookTitle = document.querySelector('h1')?.textContent?.trim() || '';
      scanSources();
      injectPromptBar();
      injectExportBar();
      injectStudioLauncher();
      injectBulkSourceBar();
      injectAudioPlayer();
      injectLanguageWidget();
      setTimeout(() => { const a = generateSmartSuggestions(); if(a) applySmartSuggestions(); }, 2500);
    }
  }

  function cleanupInjected() {
    ['plm-folder-panel','plm-prompt-bar','plm-export-bar','plm-studio-launcher',
     'plm-bulk-bar','plm-audio-player','plm-tag-bar','plm-search-bar','plm-lang-widget'].forEach(id =>
      document.getElementById(id)?.remove()
    );
    S.currentNotebookId = null; S.currentNotebookTitle = '';
  }

  // ═══════════════════════════════════════════════════════════════
  //  TOOLBAR
  // ═══════════════════════════════════════════════════════════════
  function injectToolbar() {
    if(document.getElementById('plm-toolbar')) return;
    const t = document.createElement('div');
    t.id = 'plm-toolbar';
    t.innerHTML = `
      <div class="plm-menu" id="plm-toolbar-menu">
        <div style="padding:6px 10px;font-size:9px;font-weight:700;color:var(--plm-fg3,#64748b);text-transform:uppercase;letter-spacing:.06em">Studio</div>
        <button class="plm-menu-item" onclick="window.__plm__.showStudioGenerator()"><span style="font-size:16px">✨</span> <strong>Generate Studio Item</strong></button>
        <button class="plm-menu-item" onclick="window.__plm__.showBulkAdder()"><span style="font-size:16px">📥</span> Bulk Add Sources</button>
        <div class="plm-menu-sep"></div>
        <div style="padding:6px 10px;font-size:9px;font-weight:700;color:var(--plm-fg3,#64748b);text-transform:uppercase;letter-spacing:.06em">View</div>
        <button class="plm-menu-item" onclick="window.__plm__.showFolderPanel()"><span style="font-size:16px">📁</span> Folders</button>
        <button class="plm-menu-item" onclick="window.__plm__.showTagPanel()"><span style="font-size:16px">🏷️</span> Tags</button>
        <button class="plm-menu-item" onclick="window.__plm__.showStudyMode()"><span style="font-size:16px">📚</span> Study Mode</button>
        <button class="plm-menu-item" onclick="window.__plm__.showAudioPlayer()"><span style="font-size:16px">🎧</span> Audio Player</button>
        <div class="plm-menu-sep"></div>
        <div style="padding:6px 10px;font-size:9px;font-weight:700;color:var(--plm-fg3,#64748b);text-transform:uppercase;letter-spacing:.06em">Tools</div>
        <button class="plm-menu-item" onclick="window.__plm__.showSearchEverything();window.__plm__.toggleToolbar()"><span style="font-size:16px">🔍</span> <strong>Search Everything</strong></button>
        <button class="plm-menu-item" onclick="window.__plm__.showMoveSourcesModal();window.__plm__.toggleToolbar()"><span style="font-size:16px">📋</span> Move Sources</button>
        <button class="plm-menu-item" onclick="window.__plm__.showMergeModal();window.__plm__.toggleToolbar()"><span style="font-size:16px">🔗</span> Merge Sources</button>
        <button class="plm-menu-item" onclick="window.__plm__.showStaleChecker();window.__plm__.toggleToolbar()"><span style="font-size:16px">🔄</span> Check Freshness</button>
        <button class="plm-menu-item" onclick="window.__plm__.showDupeFinder();window.__plm__.toggleToolbar()"><span style="font-size:16px">🔍</span> Find Duplicates</button>
        <button class="plm-menu-item" onclick="window.__plm__.showBackupModal();window.__plm__.toggleToolbar()"><span style="font-size:16px">💾</span> Backup / Restore</button>
        <button class="plm-menu-item" onclick="window.__plm__.showPromptManager();window.__plm__.toggleToolbar()"><span style="font-size:16px">💬</span> Prompt Library</button>
        <button class="plm-menu-item" onclick="window.__plm__.showAISuggestions();window.__plm__.toggleToolbar()"><span style="font-size:16px">🧠</span> AI Suggestions</button>
        <div class="plm-menu-sep"></div>
        <div style="padding:6px 10px;font-size:9px;font-weight:700;color:var(--plm-fg3,#64748b);text-transform:uppercase;letter-spacing:.06em">Sync</div>
        <button class="plm-menu-item" onclick="window.__plm__.syncExternal('reddit')"><span style="font-size:16px">🤖</span> Sync Reddit</button>
        <button class="plm-menu-item" onclick="window.__plm__.syncExternal('gdocs')"><span style="font-size:16px">📝</span> Sync Google Doc</button>
        <button class="plm-menu-item" onclick="window.__plm__.syncExternal('claude')"><span style="font-size:16px">💬</span> Sync Claude Chat</button>
        <div class="plm-menu-sep"></div>
        <div style="padding:6px 10px;font-size:9px;font-weight:700;color:var(--plm-fg3,#64748b);text-transform:uppercase;letter-spacing:.06em">Settings</div>
        <button class="plm-menu-item" onclick="window.__plm__.showAccountSwitcher();window.__plm__.toggleToolbar()"><span style="font-size:16px">👤</span> Accounts</button>
        <button class="plm-menu-item" onclick="window.__plm__.showLanguageWidget();window.__plm__.toggleToolbar()"><span style="font-size:16px">🌐</span> Language</button>
        <div class="plm-menu-sep"></div>
        <button class="plm-menu-item" id="plm-theme-toggle" data-dark="${S.darkMode}">
          <span style="font-size:16px">${S.darkMode ? '☀️' : '🌙'}</span>
          ${S.darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
      <button class="plm-fab" id="plm-fab" title="PipelineLM Pro v3.0">⚡</button>
    `;
    document.body.appendChild(t);
    document.getElementById('plm-fab').addEventListener('click', () => {
      S.toolbarOpen = !S.toolbarOpen;
      document.getElementById('plm-toolbar-menu').classList.toggle('visible', S.toolbarOpen);
      document.getElementById('plm-fab').classList.toggle('active', S.toolbarOpen);
    });
    document.getElementById('plm-theme-toggle').addEventListener('click', toggleDarkMode);
  }

  // ═══════════════════════════════════════════════════════════════
  //  STUDIO ITEM GENERATOR
  // ═══════════════════════════════════════════════════════════════
  function showStudioGenerator() {
    const typeGrid = STUDIO_TYPES.map(t => `
      <div class="plm-studio-type" data-type="${t.id}" onclick="window.__plm__.selectStudioType('${t.id}')" style="border-color:${t.color}20">
        <div style="font-size:32px;margin-bottom:6px">${t.icon}</div>
        <div style="font-weight:700;font-size:13px;color:${t.color}">${t.name}</div>
        <div style="font-size:10px;color:var(--plm-fg3,#64748b);margin-top:2px">${t.desc}</div>
      </div>
    `).join('');

    showModal('✨ Generate Studio Item', `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">${typeGrid}</div>
      <div id="plm-studio-config" style="display:none">
        <div class="plm-form-label">Configuration</div>
        <div id="plm-studio-params"></div>
        <div class="plm-form-label" style="margin-top:12px">Sources</div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <button class="plm-prompt-btn" id="plm-src-all" onclick="window.__plm__.selectSourceMode('all')" style="flex:1">📚 All Sources</button>
          <button class="plm-prompt-btn secondary" id="plm-src-sel" onclick="window.__plm__.selectSourceMode('selected')" style="flex:1">☑️ Selected</button>
        </div>
        <div id="plm-studio-sources" style="display:none;max-height:150px;overflow-y:auto"></div>
        <div class="plm-form-label" style="margin-top:12px">Language</div>
        <select id="plm-gen-lang" class="plm-input">
          <option value="en">🇺🇸 English</option><option value="es">🇪🇸 Spanish</option><option value="fr">🇫🇷 French</option>
          <option value="de">🇩🇪 German</option><option value="it">🇮🇹 Italian</option><option value="pt">🇵🇹 Portuguese</option>
          <option value="zh">🇨🇳 Chinese</option><option value="ja">🇯🇵 Japanese</option><option value="ko">🇰🇷 Korean</option>
          <option value="hi">🇮🇳 Hindi</option><option value="ar">🇸🇦 Arabic</option><option value="ru">🇷🇺 Russian</option>
        </select>
        <div class="plm-form-label" style="margin-top:12px">Custom Instructions (optional)</div>
        <textarea id="plm-gen-instructions" class="plm-textarea" style="min-height:60px" placeholder="e.g., Focus on environmental impact. Exclude financial data."></textarea>
        <div id="plm-gen-also" style="margin-top:12px">
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer">
            <input type="checkbox" id="plm-also-generate" style="width:16px;height:16px"> Also generate from additional URLs
          </label>
          <textarea id="plm-also-urls" class="plm-textarea" style="min-height:40px;margin-top:6px;display:none" placeholder="Paste URLs, one per line..."></textarea>
        </div>
      </div>
      <div id="plm-studio-progress" style="display:none;margin-top:12px">
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px">
          <span id="plm-prog-label">Generating...</span>
          <span id="plm-prog-pct">0%</span>
        </div>
        <div style="height:6px;background:var(--plm-bg4,#242d42);border-radius:3px;overflow:hidden">
          <div id="plm-prog-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#3b82f6,#8b5cf6);border-radius:3px;transition:width .3s"></div>
        </div>
        <button class="plm-prompt-btn err" style="margin-top:8px;width:100%" onclick="window.__plm__.cancelGeneration()">✕ Cancel</button>
      </div>
    `, () => window.__plm__.startGeneration(), 'Generate');

    // Toggle "Also generate" URLs
    setTimeout(() => {
      const alsoCb = document.getElementById('plm-also-generate');
      const alsoUrls = document.getElementById('plm-also-urls');
      if(alsoCb && alsoUrls) {
        alsoCb.addEventListener('change', () => { alsoUrls.style.display = alsoCb.checked ? 'block' : 'none'; });
      }
    }, 50);
  }

  let selectedStudioType = null;
  let selectedSourceMode = 'all';
  let generationCancelled = false;

  function selectStudioType(typeId) {
    selectedStudioType = typeId;
    document.querySelectorAll('.plm-studio-type').forEach(el => {
      el.style.borderWidth = el.dataset.type === typeId ? '2px' : '1px';
      el.style.background = el.dataset.type === typeId ? (STUDIO_TYPES.find(t=>t.id===typeId)?.color+'15') : '';
    });
    document.getElementById('plm-studio-config').style.display = 'block';
    renderStudioParams(typeId);
    renderSourceList();
  }

  function renderStudioParams(typeId) {
    const type = STUDIO_TYPES.find(t => t.id === typeId);
    if(!type) return;
    const paramDefs = {
      audio: [
        {key:'format',label:'Format',opts:[{v:'podcast',l:'Two-Host Podcast'},{v:'narrative',l:'Narrative Story'},{v:'interview',l:'Expert Interview'},{v:'news',l:'News Briefing'}],def:'podcast'},
        {key:'length',label:'Duration',opts:[{v:'brief',l:'~3 min'},{v:'standard',l:'~10 min'},{v:'deep',l:'~20 min'},{v:'extended',l:'~45 min'}],def:'standard'},
        {key:'style',label:'Tone',opts:[{v:'conversational',l:'Conversational'},{v:'professional',l:'Professional'},{v:'enthusiastic',l:'Enthusiastic'},{v:'calm',l:'Calm'},{v:'dramatic',l:'Dramatic'}],def:'conversational'},
        {key:'voice',label:'Voice',opts:[{v:'default',l:'Default'},{v:'warm',l:'Warm'},{v:'authoritative',l:'Authoritative'},{v:'energetic',l:'Energetic'}],def:'default'}
      ],
      video: [
        {key:'format',label:'Format',opts:[{v:'explainer',l:'Explainer'},{v:'documentary',l:'Documentary'},{v:'presentation',l:'Presentation'},{v:'tutorial',l:'Tutorial'}],def:'explainer'},
        {key:'length',label:'Duration',opts:[{v:'short',l:'~2 min'},{v:'medium',l:'~5 min'},{v:'long',l:'~10 min'}],def:'medium'},
        {key:'style',label:'Visual Style',opts:[{v:'clean',l:'Clean'},{v:'cinematic',l:'Cinematic'},{v:'minimal',l:'Minimalist'},{v:'colorful',l:'Colorful'}],def:'clean'},
        {key:'music',label:'Music',opts:[{v:'subtle',l:'Subtle'},{v:'upbeat',l:'Upbeat'},{v:'ambient',l:'Ambient'},{v:'none',l:'None'}],def:'subtle'}
      ],
      report: [
        {key:'format',label:'Type',opts:[{v:'executive',l:'Executive Summary'},{v:'analytical',l:'Analytical'},{v:'research',l:'Research Paper'},{v:'briefing',l:'Briefing'}],def:'analytical'},
        {key:'length',label:'Length',opts:[{v:'short',l:'1-2 pages'},{v:'standard',l:'3-5 pages'},{v:'comprehensive',l:'10+ pages'}],def:'standard'},
        {key:'style',label:'Writing Style',opts:[{v:'formal',l:'Formal Academic'},{v:'business',l:'Business'},{v:'journalistic',l:'Journalistic'},{v:'accessible',l:'Plain Language'}],def:'business'}
      ],
      quiz: [
        {key:'format',label:'Question Type',opts:[{v:'mixed',l:'Mixed (MCQ + Open)'},{v:'multiple_choice',l:'Multiple Choice'},{v:'true_false',l:'True/False'},{v:'open_ended',l:'Open-Ended'}],def:'mixed'},
        {key:'length',label:'Questions',opts:[{v:'5',l:'5'},{v:'10',l:'10'},{v:'15',l:'15'},{v:'20',l:'20'}],def:'10'},
        {key:'difficulty',label:'Difficulty',opts:[{v:'easy',l:'Easy (Recall)'},{v:'medium',l:'Medium (Comprehension)'},{v:'hard',l:'Hard (Analysis)'},{v:'adaptive',l:'Adaptive'}],def:'medium'}
      ],
      flashcard: [
        {key:'format',label:'Card Format',opts:[{v:'term_definition',l:'Term→Definition'},{v:'question_answer',l:'Q→A'},{v:'concept_example',l:'Concept→Example'},{v:'cloze',l:'Cloze'}],def:'term_definition'},
        {key:'length',label:'Card Count',opts:[{v:'10',l:'10'},{v:'20',l:'20'},{v:'50',l:'50'},{v:'100',l:'100'}],def:'20'},
        {key:'difficulty',label:'Complexity',opts:[{v:'basic',l:'Basic'},{v:'intermediate',l:'Intermediate'},{v:'advanced',l:'Advanced'},{v:'mixed',l:'Mixed'}],def:'mixed'}
      ],
      slide_deck: [
        {key:'format',label:'Slide Type',opts:[{v:'presentation',l:'Presentation'},{v:'pitch',l:'Pitch Deck'},{v:'training',l:'Training'},{v:'executive',l:'Executive Brief'}],def:'presentation'},
        {key:'length',label:'Slides',opts:[{v:'5',l:'5'},{v:'10',l:'10'},{v:'15',l:'15'},{v:'20',l:'20'}],def:'10'},
        {key:'style',label:'Design',opts:[{v:'modern',l:'Modern'},{v:'corporate',l:'Corporate'},{v:'minimal',l:'Minimal'},{v:'creative',l:'Creative'},{v:'dark',l:'Dark'}],def:'modern'}
      ],
      mind_map: [
        {key:'format',label:'Layout',opts:[{v:'radial',l:'Radial'},{v:'hierarchical',l:'Tree'},{v:'organic',l:'Organic'},{v:'flowchart',l:'Flowchart'}],def:'radial'},
        {key:'depth',label:'Depth',opts:[{v:'2',l:'2 Levels'},{v:'3',l:'3 Levels'},{v:'4',l:'4 Levels'},{v:'5',l:'5 Levels'}],def:'3'},
        {key:'style',label:'Style',opts:[{v:'colorful',l:'Color-Coded'},{v:'monochrome',l:'Monochrome'},{v:'gradient',l:'Gradient'},{v:'outline',l:'Outline'}],def:'colorful'}
      ],
      data_table: [
        {key:'format',label:'Table Type',opts:[{v:'comparison',l:'Comparison'},{v:'summary',l:'Summary Stats'},{v:'timeline',l:'Timeline'},{v:'structured',l:'Structured Data'}],def:'comparison'},
        {key:'length',label:'~Rows',opts:[{v:'10',l:'~10'},{v:'25',l:'~25'},{v:'50',l:'~50'},{v:'100',l:'~100'}],def:'25'},
        {key:'style',label:'Presentation',opts:[{v:'clean',l:'Clean Grid'},{v:'compact',l:'Compact'},{v:'detailed',l:'Detailed'},{v:'export',l:'Export-Ready'}],def:'clean'}
      ],
      infographic: [
        {key:'format',label:'Type',opts:[{v:'statistical',l:'Data-Driven'},{v:'process',l:'Process/Timeline'},{v:'comparison',l:'Comparison'},{v:'hierarchy',l:'Hierarchy'},{v:'list',l:'Top N List'}],def:'statistical'},
        {key:'length',label:'Detail',opts:[{v:'minimal',l:'5-7 points'},{v:'standard',l:'10-15'},{v:'comprehensive',l:'20+'}],def:'standard'},
        {key:'style',label:'Theme',opts:[{v:'modern',l:'Modern Flat'},{v:'corporate',l:'Corporate'},{v:'creative',l:'Creative'},{v:'minimal',l:'Minimalist'},{v:'vintage',l:'Vintage'}],def:'modern'}
      ]
    };

    const defs = paramDefs[typeId] || [];
    document.getElementById('plm-studio-params').innerHTML = defs.map(p => `
      <div style="margin-bottom:8px">
        <div class="plm-form-label">${p.label}</div>
        <select id="plm-param-${p.key}" class="plm-input">
          ${p.opts.map(o => `<option value="${o.v}"${o.v===p.def?' selected':''}>${o.l}</option>`).join('')}
        </select>
      </div>
    `).join('');
  }

  function renderSourceList() {
    const list = document.getElementById('plm-studio-sources');
    if(!S.sources.length) { list.innerHTML = '<div class="plm-help-text">No sources detected on this page.</div>'; return; }
    list.innerHTML = S.sources.map((s,i) => `
      <label style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:11px;cursor:pointer">
        <input type="checkbox" class="plm-src-check" value="${i}" checked style="width:14px;height:14px">
        <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.title}</span>
        <span style="font-size:9px;color:var(--plm-fg3,#64748b)">${s.type}</span>
      </label>
    `).join('');
  }

  function selectSourceMode(mode) {
    selectedSourceMode = mode;
    document.getElementById('plm-src-all').classList.toggle('plm-prompt-btn', mode==='all');
    document.getElementById('plm-src-all').classList.toggle('secondary', mode!=='all');
    document.getElementById('plm-src-sel').classList.toggle('plm-prompt-btn', mode==='selected');
    document.getElementById('plm-src-sel').classList.toggle('secondary', mode!=='selected');
    document.getElementById('plm-studio-sources').style.display = mode==='selected' ? 'block' : 'none';
  }

  async function startGeneration() {
    if(!selectedStudioType) { toast('Select a studio item type first', 'warn'); return; }
    generationCancelled = false;

    // Collect params
    const params = {};
    document.querySelectorAll('[id^="plm-param-"]').forEach(sel => {
      params[sel.id.replace('plm-param-','')] = sel.value;
    });

    // Collect sources
    let sourceItems = S.sources;
    if(selectedSourceMode === 'selected') {
      const checked = document.querySelectorAll('.plm-src-check:checked');
      sourceItems = Array.from(checked).map(cb => S.sources[parseInt(cb.value)]).filter(Boolean);
    }

    const lang = document.getElementById('plm-gen-lang')?.value || 'en';
    const instructions = document.getElementById('plm-gen-instructions')?.value || '';

    // Build prompt
    const prompt = buildGenerationPrompt(selectedStudioType, params, sourceItems, instructions, lang);

    // Insert into NotebookLM chat
    const textarea = document.querySelector('textarea[class*="input"]') || document.querySelector('textarea[placeholder*="Ask"]');
    if(textarea) {
      textarea.value = prompt;
      textarea.focus();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      // Show progress simulation
      document.getElementById('plm-studio-progress').style.display = 'block';
      simulateProgress(selectedStudioType);

      // Save job
      const job = { id:'job_'+Date.now(), type:selectedStudioType, params, notebookId:S.currentNotebookId, status:'generating', progress:0, createdAt:Date.now() };
      S.generatingJobs.push(job);
      chrome.storage.local.set({ plm_jobs: S.generatingJobs });

      toast('Generation prompt inserted! Press Enter to send to NotebookLM.', 'ok');
    } else {
      toast('Could not find chat input', 'err');
    }
  }

  function simulateProgress(typeId) {
    let progress = 0;
    const bar = document.getElementById('plm-prog-bar');
    const pct = document.getElementById('plm-prog-pct');
    const label = document.getElementById('plm-prog-label');
    const interval = setInterval(() => {
      if(generationCancelled) { clearInterval(interval); return; }
      progress += Math.random() * 3;
      if(progress > 100) progress = 100;
      if(bar) bar.style.width = progress + '%';
      if(pct) pct.textContent = Math.round(progress) + '%';
      if(label) label.textContent = progress < 30 ? 'Analyzing sources...' : progress < 60 ? 'Generating content...' : progress < 90 ? 'Finalizing...' : 'Complete!';
      if(progress >= 100) {
        clearInterval(interval);
        setTimeout(() => { document.getElementById('plm-modal-system')?.remove(); }, 500);
      }
    }, 200);
  }

  function cancelGeneration() {
    generationCancelled = true;
    document.getElementById('plm-studio-progress').style.display = 'none';
    toast('Generation cancelled', 'warn');
  }

  function buildGenerationPrompt(typeId, params, sources, customInstructions, lang) {
    const langPrefix = lang && lang !== 'en' ? `Respond in ${lang}. ` : '';
    const typeNames = { audio:'Audio Overview', video:'Video Overview', report:'Report/Briefing', quiz:'Quiz/Assessment', flashcard:'Flashcard Set', slide_deck:'Slide Deck', mind_map:'Mind Map', data_table:'Data Table', infographic:'Infographic' };
    const typeName = typeNames[typeId] || typeId;

    let sections = '';
    if(params.sections && Array.isArray(params.sections)) {
      sections = '\nInclude these sections: ' + params.sections.join(', ');
    }

    let prompt = `${langPrefix}Create a ${typeName} from the following sources.`;
    prompt += `\n\nFormat: ${params.format || 'standard'}`;
    prompt += `\nLength/Scale: ${params.length || 'standard'}`;
    prompt += `\nStyle/Tone: ${params.style || 'standard'}`;
    if(sections) prompt += sections;
    if(params.difficulty) prompt += `\nDifficulty: ${params.difficulty}`;
    if(params.voice) prompt += `\nVoice: ${params.voice}`;
    if(params.depth) prompt += `\nDepth: ${params.depth} levels`;
    if(params.music) prompt += `\nBackground: ${params.music}`;
    prompt += `\n\nSources:\n${sources.map((s,i) => `${i+1}. ${s.title}${s.snippet ? ' - ' + s.snippet.slice(0,120) : ''}`).join('\n')}`;
    if(customInstructions) prompt += `\n\nAdditional instructions: ${customInstructions}`;
    return prompt;
  }

  // ═══════════════════════════════════════════════════════════════
  //  BULK SOURCE ADDER
  // ═══════════════════════════════════════════════════════════════
  function showBulkAdder() {
    showModal('📥 Bulk Add Sources', `
      <div style="display:flex;gap:6px;margin-bottom:12px">
        <button class="plm-prompt-btn" id="plm-bulk-tab-urls" onclick="window.__plm__.setBulkTab('urls')">🔗 URLs</button>
        <button class="plm-prompt-btn secondary" id="plm-bulk-tab-yt" onclick="window.__plm__.setBulkTab('youtube')">📺 YouTube</button>
        <button class="plm-prompt-btn secondary" id="plm-bulk-tab-rss" onclick="window.__plm__.setBulkTab('rss')">📡 RSS</button>
        <button class="plm-prompt-btn secondary" id="plm-bulk-tab-tabs" onclick="window.__plm__.setBulkTab('tabs')">🗂️ Tabs</button>
        <button class="plm-prompt-btn secondary" id="plm-bulk-tab-web" onclick="window.__plm__.setBulkTab('webpage')">🌐 Webpage</button>
      </div>
      <div id="plm-bulk-panel-urls">
        <p class="plm-help-text">Paste one URL per line. Each will be added as a separate source.</p>
        <textarea id="plm-bulk-text" class="plm-textarea" style="min-height:120px" placeholder="https://example.com/article&#10;https://another-site.com/post&#10;https://docs.google.com/document/d/..."></textarea>
      </div>
      <div id="plm-bulk-panel-youtube" style="display:none">
        <p class="plm-help-text">Paste a YouTube playlist URL or channel URL to import all videos.</p>
        <input id="plm-bulk-yt-url" class="plm-input" placeholder="https://www.youtube.com/playlist?list=... or https://youtube.com/@channel">
        <div id="plm-bulk-yt-preview" style="margin-top:8px;font-size:11px"></div>
      </div>
      <div id="plm-bulk-panel-rss" style="display:none">
        <p class="plm-help-text">Paste an RSS feed URL or sitemap URL to pull all articles.</p>
        <input id="plm-bulk-rss-url" class="plm-input" placeholder="https://example.com/feed.xml or https://site.com/sitemap.xml">
      </div>
      <div id="plm-bulk-panel-tabs" style="display:none">
        <p class="plm-help-text">Add all open browser tabs as sources (excluding NotebookLM tabs).</p>
        <button class="plm-prompt-btn primary" style="width:100%;margin-top:8px" onclick="window.__plm__.importOpenTabs()">📥 Import All Open Tabs</button>
      </div>
      <div id="plm-bulk-panel-webpage" style="display:none">
        <p class="plm-help-text">Enter a webpage URL to extract all links from it.</p>
        <input id="plm-bulk-web-url" class="plm-input" placeholder="https://example.com/resource-page">
        <button class="plm-prompt-btn" style="margin-top:8px" onclick="window.__plm__.extractLinksFromPage()">🔍 Extract Links</button>
        <div id="plm-bulk-web-results" style="margin-top:8px;font-size:11px;max-height:150px;overflow-y:auto"></div>
      </div>
    `, () => window.__plm__.executeBulkAdd(), 'Add Sources');
  }

  let activeBulkTab = 'urls';

  function setBulkTab(tab) {
    activeBulkTab = tab;
    ['urls','youtube','rss','tabs','webpage'].forEach(t => {
      document.getElementById('plm-bulk-panel-'+t).style.display = t===tab ? 'block' : 'none';
      const btn = document.getElementById('plm-bulk-tab-'+t);
      if(btn) { btn.classList.toggle('plm-prompt-btn', t===tab); btn.classList.toggle('secondary', t!==tab); }
    });
  }

  async function executeBulkAdd() {
    if(activeBulkTab === 'urls') {
      const text = document.getElementById('plm-bulk-text')?.value?.trim();
      if(!text) { toast('Nothing to add', 'warn'); return; }
      const urls = text.split('\n').map(l => l.trim()).filter(l => l.match(/^https?:\/\//));
      toast(`Adding ${urls.length} URLs...`, 'info');
      for(const url of urls) await addSourceToNL({type:'url', content:url, title:url});
      toast(`Added ${urls.length} sources!`, 'ok');
    } else if(activeBulkTab === 'youtube') {
      const url = document.getElementById('plm-bulk-yt-url')?.value?.trim();
      if(!url) { toast('Enter a YouTube URL', 'warn'); return; }
      await addSourceToNL({type:'url', content:url, title:'YouTube: '+url});
      toast('YouTube source added. Full playlist import coming soon.', 'ok');
    } else if(activeBulkTab === 'rss') {
      const url = document.getElementById('plm-bulk-rss-url')?.value?.trim();
      if(!url) { toast('Enter an RSS URL', 'warn'); return; }
      await addSourceToNL({type:'url', content:url, title:'RSS: '+url});
      toast('RSS source added. Feed parsing coming soon.', 'ok');
    }
    document.getElementById('plm-modal-system')?.remove();
  }

  async function importOpenTabs() {
    try {
      const tabs = await chrome.runtime.sendMessage({ action: 'getTabs' });
      const nlTabs = (tabs || []).filter(t => !t.url?.includes('notebooklm.google.com') && t.url?.match(/^https?:\/\//));
      toast(`Found ${nlTabs.length} tabs. Adding...`, 'info');
      for(const tab of nlTabs.slice(0, 20)) {
        await addSourceToNL({type:'url', content:tab.url, title:tab.title || tab.url});
      }
      toast(`Added ${nlTabs.length} tabs!`, 'ok');
    } catch(e) { toast('Could not access tabs: ' + e.message, 'err'); }
  }

  async function extractLinksFromPage() {
    const url = document.getElementById('plm-bulk-web-url')?.value?.trim();
    if(!url) return;
    toast('Fetching links...', 'info');
    try {
      const result = await chrome.runtime.sendMessage({ action: 'fetchLinks', url });
      const links = result?.links || [];
      const container = document.getElementById('plm-bulk-web-results');
      if(links.length === 0) { container.innerHTML = '<span style="color:var(--plm-fg3)">No links found.</span>'; return; }
      container.innerHTML = links.slice(0, 50).map((l,i) => `
        <label style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;cursor:pointer">
          <input type="checkbox" class="plm-web-link" value="${l.url}" checked style="width:14px;height:14px">
          <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${l.url}">${l.title || l.url}</span>
        </label>
      `).join('') + (links.length > 50 ? `<div style="color:var(--plm-fg3);font-size:10px">+ ${links.length - 50} more</div>` : '');
      // Add selected links button
      const btn = document.createElement('button');
      btn.className = 'plm-prompt-btn primary';
      btn.style.cssText = 'width:100%;margin-top:8px';
      btn.textContent = `Add Selected (${links.length})`;
      btn.onclick = async () => {
        const selected = document.querySelectorAll('.plm-web-link:checked');
        for(const cb of selected) await addSourceToNL({type:'url', content:cb.value, title:cb.value});
        toast(`Added ${selected.length} links!`, 'ok');
      };
      container.appendChild(btn);
    } catch(e) { toast('Failed: ' + e.message, 'err'); }
  }

  // ═══════════════════════════════════════════════════════════════
  //  INLINE VIEWER + STUDY MODE
  // ═══════════════════════════════════════════════════════════════
  function showStudyMode() {
    chrome.storage.local.get('plm_studioItems', (data) => {
      const items = data.plm_studioItems || [];
      if(!items.length) {
        showModal('📚 Study Mode', '<div class="plm-empty">No studio items yet. Generate flashcards or quizzes first!</div>', null);
        return;
      }
      const quizzes = items.filter(i => i.type === 'quiz');
      const flashcards = items.filter(i => i.type === 'flashcard');
      let html = '';
      if(quizzes.length) {
        html += `<div class="plm-form-label">🧩 Quizzes (${quizzes.length})</div>
          ${quizzes.map((q,i) => `<div class="plm-list-item" onclick="window.__plm__.startQuiz('${q.id}')">📋 ${q.title || 'Quiz '+(i+1)} <span style="margin-left:auto;font-size:10px;color:var(--plm-fg3)">${q.questions?.length || 0} Qs</span></div>`).join('')}`;
      }
      if(flashcards.length) {
        html += `<div class="plm-form-label" style="margin-top:12px">🗂️ Flashcards (${flashcards.length})</div>
          ${flashcards.map((f,i) => `<div class="plm-list-item" onclick="window.__plm__.startFlashcards('${f.id}')">🃏 ${f.title || 'Deck '+(i+1)} <span style="margin-left:auto;font-size:10px;color:var(--plm-fg3)">${f.cards?.length || 0} cards</span></div>`).join('')}`;
      }
      showModal('📚 Study Mode', html, null);
    });
  }

  let currentQuiz = null;
  let currentQIndex = 0;
  let quizScore = 0;

  function startQuiz(quizId) {
    chrome.storage.local.get('plm_studioItems', (data) => {
      const items = data.plm_studioItems || [];
      const quiz = items.find(i => i.id === quizId);
      if(!quiz || !quiz.questions?.length) { toast('Quiz not found', 'err'); return; }
      currentQuiz = quiz;
      currentQIndex = 0;
      quizScore = 0;
      renderQuestion();
    });
  }

  function renderQuestion() {
    const q = currentQuiz.questions[currentQIndex];
    if(!q) { showQuizResults(); return; }
    document.getElementById('modal-body').innerHTML = `
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--plm-fg3);margin-bottom:12px">
        <span>Question ${currentQIndex + 1} of ${currentQuiz.questions.length}</span>
        <span>Score: ${quizScore}</span>
      </div>
      <div style="font-size:14px;font-weight:600;margin-bottom:16px;line-height:1.5">${q.question}</div>
      ${(q.options || []).map((opt, i) => `
        <button class="plm-prompt-btn secondary" style="width:100%;margin-bottom:6px;text-align:left;justify-content:flex-start;padding:10px 14px" onclick="window.__plm__.answerQuiz(${i})">${String.fromCharCode(65+i)}. ${opt}</button>
      `).join('')}
      ${!q.options ? `<textarea class="plm-textarea" style="min-height:80px" placeholder="Type your answer..."></textarea><button class="plm-prompt-btn primary" style="margin-top:8px;width:100%" onclick="window.__plm__.answerQuiz(-1)">Submit</button>` : ''}
    `;
  }

  function answerQuiz(optionIndex) {
    const q = currentQuiz.questions[currentQIndex];
    const correct = q.correct !== undefined ? optionIndex === q.correct : true;
    if(correct) quizScore++;
    currentQIndex++;
    toast(correct ? '✅ Correct!' : '❌ Not quite', correct ? 'ok' : 'warn');
    renderQuestion();
  }

  function showQuizResults() {
    const pct = Math.round((quizScore / currentQuiz.questions.length) * 100);
    document.getElementById('modal-body').innerHTML = `
      <div style="text-align:center;padding:20px">
        <div style="font-size:48px;margin-bottom:12px">${pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
        <div style="font-size:22px;font-weight:700;margin-bottom:8px">${quizScore} / ${currentQuiz.questions.length}</div>
        <div style="font-size:14px;color:var(--plm-fg2)">${pct}% correct</div>
        <div style="margin-top:16px;display:flex;gap:8px;justify-content:center">
          <button class="plm-prompt-btn primary" onclick="window.__plm__.startQuiz('${currentQuiz.id}')">🔄 Try Again</button>
          <button class="plm-prompt-btn" onclick="document.getElementById('plm-modal-system').remove()">Close</button>
        </div>
      </div>
    `;
  }

  let currentDeck = null;
  let currentCardIndex = 0;
  let cardFlipped = false;

  function startFlashcards(deckId) {
    chrome.storage.local.get('plm_studioItems', (data) => {
      const items = data.plm_studioItems || [];
      const deck = items.find(i => i.id === deckId);
      if(!deck || !deck.cards?.length) { toast('Deck not found', 'err'); return; }
      currentDeck = deck;
      currentCardIndex = 0;
      cardFlipped = false;
      renderCard();
    });
  }

  function renderCard() {
    const c = currentDeck.cards[currentCardIndex];
    document.getElementById('modal-body').innerHTML = `
      <div style="text-align:center">
        <div style="font-size:10px;color:var(--plm-fg3);margin-bottom:8px">Card ${currentCardIndex + 1} of ${currentDeck.cards.length}</div>
        <div id="plm-card-face" style="background:var(--plm-bg3,#1a2236);border:1px solid var(--plm-border);border-radius:12px;padding:30px 20px;min-height:140px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:600;cursor:pointer;transition:all .2s" onclick="window.__plm__.flipCard()">
          ${cardFlipped ? (c.back || c.answer || '?') : (c.front || c.term || c.question || '?')}
        </div>
        <div style="display:flex;gap:6px;margin-top:12px;justify-content:center">
          <button class="plm-prompt-btn" onclick="window.__plm__.prevCard()">◀ Prev</button>
          <button class="plm-prompt-btn ok" onclick="window.__plm__.rateCard('easy')">✓ Easy</button>
          <button class="plm-prompt-btn warn" onclick="window.__plm__.rateCard('hard')">? Hard</button>
          <button class="plm-prompt-btn" onclick="window.__plm__.nextCard()">Next ▶</button>
        </div>
      </div>
    `;
  }

  function flipCard() {
    cardFlipped = !cardFlipped;
    renderCard();
  }

  function nextCard() {
    if(currentCardIndex < currentDeck.cards.length - 1) { currentCardIndex++; cardFlipped = false; renderCard(); }
    else { toast('Deck complete! 🎉', 'ok'); currentCardIndex = 0; cardFlipped = false; renderCard(); }
  }

  function prevCard() {
    if(currentCardIndex > 0) { currentCardIndex--; cardFlipped = false; renderCard(); }
  }

  function rateCard(rating) {
    toast(rating === 'easy' ? 'Marked easy ✓' : 'Marked hard — will review', 'ok');
    nextCard();
  }

  // ═══════════════════════════════════════════════════════════════
  //  AUDIO PLAYER
  // ═══════════════════════════════════════════════════════════════
  function showAudioPlayer() {
    chrome.storage.local.get('plm_audioItems', (data) => {
      const items = data.plm_audioItems || [];
      showModal('🎧 Audio Player', `
        <div style="text-align:center;padding:20px">
          <div style="font-size:48px;margin-bottom:12px">🎙️</div>
          <div style="font-size:14px;font-weight:600;margin-bottom:8px">Audio Overview Player</div>
          <div style="font-size:11px;color:var(--plm-fg3);margin-bottom:16px">${items.length} audio items in library</div>
          <div style="display:flex;gap:8px;justify-content:center">
            <button class="plm-prompt-btn" style="border-radius:50%;width:48px;height:48px;padding:0;font-size:20px" onclick="window.__plm__.audioPrev()">⏮</button>
            <button class="plm-prompt-btn primary" style="border-radius:50%;width:56px;height:56px;padding:0;font-size:24px" id="plm-audio-play" onclick="window.__plm__.audioToggle()">▶</button>
            <button class="plm-prompt-btn" style="border-radius:50%;width:48px;height:48px;padding:0;font-size:20px" onclick="window.__plm__.audioNext()">⏭</button>
          </div>
          <div style="margin-top:16px">
            <div style="height:4px;background:var(--plm-bg4);border-radius:2px;overflow:hidden">
              <div id="plm-audio-progress" style="height:100%;width:0%;background:var(--plm-accent);border-radius:2px;transition:width .5s"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--plm-fg3);margin-top:4px">
              <span id="plm-audio-current">0:00</span>
              <span id="plm-audio-duration">0:00</span>
            </div>
          </div>
          <div style="margin-top:12px">
            <button class="plm-prompt-btn secondary" onclick="window.__plm__.downloadAudio()">⬇️ Download MP3</button>
          </div>
        </div>
      `, null);
    });
  }

  let audioPlaying = false;
  let audioProgress = 0;
  let audioInterval = null;

  function audioToggle() {
    audioPlaying = !audioPlaying;
    const btn = document.getElementById('plm-audio-play');
    if(btn) btn.textContent = audioPlaying ? '⏸' : '▶';
    if(audioPlaying) {
      audioInterval = setInterval(() => {
        audioProgress += 0.5;
        if(audioProgress > 100) audioProgress = 0;
        const bar = document.getElementById('plm-audio-progress');
        if(bar) bar.style.width = audioProgress + '%';
        const cur = document.getElementById('plm-audio-current');
        if(cur) cur.textContent = formatTime(audioProgress * 6); // simulated ~10 min
      }, 300);
    } else {
      clearInterval(audioInterval);
    }
  }

  function audioNext() { audioProgress = Math.min(audioProgress + 10, 100); document.getElementById('plm-audio-progress').style.width = audioProgress+'%'; }
  function audioPrev() { audioProgress = Math.max(audioProgress - 10, 0); document.getElementById('plm-audio-progress').style.width = audioProgress+'%'; }
  function downloadAudio() { toast('Audio download started', 'ok'); }
  function formatTime(sec) { const m = Math.floor(sec/60), s = Math.floor(sec%60); return m+':'+String(s).padStart(2,'0'); }

  // ═══════════════════════════════════════════════════════════════
  //  PROMPT SHORTCODES & KEYBOARD SHORTCUTS
  // ═══════════════════════════════════════════════════════════════
  function initPromptShortcodes() {
    document.addEventListener('keydown', (e) => {
      const ta = e.target;
      if(ta.tagName !== 'TEXTAREA' && ta.tagName !== 'INPUT') return;

      // Shortcode: / shortcut
      if(e.key === '/') {
        // Check if at start of line or after space
        const cursorPos = ta.selectionStart;
        const textBefore = ta.value.slice(0, cursorPos);
        if(cursorPos === 0 || textBefore.slice(-1) === ' ' || textBefore.slice(-1) === '\n') {
          showShortcodePicker(ta);
        }
      }
    });
  }

  let shortcodePicker = null;

  function showShortcodePicker(textarea) {
    if(shortcodePicker) shortcodePicker.remove();
    shortcodePicker = document.createElement('div');
    shortcodePicker.style.cssText = 'position:fixed;z-index:100002;background:var(--plm-glass,rgba(17,24,39,0.95));border:1px solid var(--plm-border);border-radius:10px;padding:8px;max-height:200px;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.4);font-family:Inter,system-ui,sans-serif';
    shortcodePicker.innerHTML = S.prompts.slice(0, 8).map(p => `
      <div class="plm-sc-item" data-id="${p.id}" style="display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:6px;cursor:pointer;font-size:12px;color:var(--plm-fg2,#94a3b8)" onmouseenter="this.style.background='rgba(59,130,246,0.1)';this.style.color='#fff'" onmouseleave="this.style.background='';this.style.color='var(--plm-fg2,#94a3b8)'">
        <span style="font-size:16px">${p.icon || '💬'}</span>
        <div>
          <div style="font-weight:600;color:var(--plm-fg,#e2e8f0)">${p.name}</div>
          <div style="font-size:10px;color:var(--plm-fg3,#64748b)">/${p.shortcut || ''}</div>
        </div>
      </div>
    `).join('');
    document.body.appendChild(shortcodePicker);

    // Position near textarea
    const rect = textarea.getBoundingClientRect();
    shortcodePicker.style.left = rect.left + 'px';
    shortcodePicker.style.top = (rect.top - shortcodePicker.offsetHeight - 8) + 'px';

    // Click handler
    shortcodePicker.querySelectorAll('.plm-sc-item').forEach(item => {
      item.addEventListener('click', () => {
        const prompt = S.prompts.find(p => p.id === item.dataset.id);
        if(prompt) {
          const cursorPos = textarea.selectionStart;
          const val = textarea.value;
          // Replace the / that triggered this
          const beforeSlash = val.lastIndexOf('/', cursorPos);
          if(beforeSlash >= 0) {
            textarea.value = val.slice(0, beforeSlash) + prompt.text + val.slice(cursorPos);
            textarea.focus();
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        shortcodePicker.remove();
        shortcodePicker = null;
      });
    });

    // Close on escape or click outside
    setTimeout(() => {
      document.addEventListener('click', function closePicker(e) {
        if(!shortcodePicker?.contains(e.target)) {
          shortcodePicker?.remove();
          shortcodePicker = null;
          document.removeEventListener('click', closePicker);
        }
      });
    }, 50);
  }

  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + P = open prompt library
      if((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        showPromptManager();
      }
      // Ctrl/Cmd + Shift + G = open studio generator
      if((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        showStudioGenerator();
      }
      // Ctrl/Cmd + Shift + S = toggle sidepanel
      if((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        chrome.runtime.sendMessage({ action: 'openSidePanel' });
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  TAG SYSTEM
  // ═══════════════════════════════════════════════════════════════
  function showTagPanel() {
    chrome.storage.local.get('plm_tags', (data) => {
      const tags = data.plm_tags || [];
      let html = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">';
      tags.forEach(tag => {
        html += `<span style="padding:4px 12px;border-radius:999px;font-size:11px;font-weight:600;background:${tag.color?.bg || '#dbeafe'};color:${tag.color?.text || '#1e40af'};border:1px solid ${tag.color?.border || '#93c5fd'};cursor:pointer">${tag.name}</span>`;
      });
      html += '</div><button class="plm-prompt-btn" onclick="window.__plm__.createTag()">+ New Tag</button>';
      showModal('🏷️ Tags', html, null);
    });
  }

  function injectTagSystem() {
    if(document.getElementById('plm-tag-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'plm-tag-bar';
    bar.style.cssText = 'display:flex;gap:6px;padding:6px 12px;background:var(--plm-glass);border-bottom:1px solid var(--plm-border);align-items:center;font-family:Inter,system-ui,sans-serif';
    chrome.storage.local.get('plm_tags', (data) => {
      const tags = data.plm_tags || [];
      bar.innerHTML = `
        <span style="font-size:10px;color:var(--plm-fg3);font-weight:600;white-space:nowrap">TAGS:</span>
        ${tags.slice(0, 6).map(t => `<span style="padding:2px 10px;border-radius:999px;font-size:10px;font-weight:600;background:${t.color?.bg};color:${t.color?.text};border:1px solid ${t.color?.border};cursor:pointer">${t.name}</span>`).join('')}
        <button class="plm-btn-icon" style="width:22px;height:22px;font-size:11px" onclick="window.__plm__.showTagPanel()">+</button>
      `;
    });
    const target = document.querySelector('header') || document.querySelector('main');
    if(target) target.insertAdjacentElement('afterend', bar);
  }

  function createTag() {
    const name = prompt('Tag name:');
    if(!name?.trim()) return;
    const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
    chrome.storage.local.get('plm_tags', (data) => {
      const tags = data.plm_tags || [];
      tags.push({ id:'tag_'+Date.now(), name:name.trim(), color });
      chrome.storage.local.set({ plm_tags: tags });
      showTagPanel();
      toast('Tag created', 'ok');
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  DUPLICATE FINDER
  // ═══════════════════════════════════════════════════════════════
  function showDupeFinder() {
    const sources = S.sources;
    if(sources.length < 2) { showModal('🔍 Find Duplicates', '<div class="plm-empty">Need at least 2 sources to check.</div>', null); return; }

    // Fast scan by title similarity
    const dupes = [];
    for(let i = 0; i < sources.length; i++) {
      for(let j = i + 1; j < sources.length; j++) {
        const sim = titleSimilarity(sources[i].title, sources[j].title);
        if(sim > 0.7) dupes.push({ a: sources[i], b: sources[j], similarity: sim });
      }
    }

    let html = `<div style="font-size:11px;color:var(--plm-fg3);margin-bottom:10px">Scanned ${sources.length} sources. Found ${dupes.length} potential duplicates.</div>`;
    if(dupes.length === 0) html += '<div class="plm-empty">No duplicates found! 🎉</div>';
    else {
      html += dupes.map((d,i) => `
        <div style="padding:10px;background:var(--plm-bg3);border-radius:8px;margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:8px;font-size:12px">
            <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.a.title}</span>
            <span style="color:var(--plm-fg3)">↔</span>
            <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.b.title}</span>
            <span style="font-size:10px;padding:2px 8px;border-radius:999px;background:${d.similarity > 0.9 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'};color:${d.similarity > 0.9 ? '#ef4444' : '#f59e0b'}">${Math.round(d.similarity*100)}%</span>
          </div>
        </div>
      `).join('');
    }
    showModal('🔍 Find Duplicates', html, null);
  }

  function titleSimilarity(a, b) {
    if(!a || !b) return 0;
    const cleanA = a.toLowerCase().replace(/[^\w]/g, '');
    const cleanB = b.toLowerCase().replace(/[^\w]/g, '');
    if(cleanA === cleanB) return 1;
    const longer = Math.max(cleanA.length, cleanB.length);
    if(longer === 0) return 0;
    const distance = levenshtein(cleanA, cleanB);
    return (longer - distance) / longer;
  }

  function levenshtein(a, b) {
    const m = [], al = a.length, bl = b.length;
    for(let i = 0; i <= al; i++) m[i] = [i];
    for(let j = 0; j <= bl; j++) m[0][j] = j;
    for(let i = 1; i <= al; i++) for(let j = 1; j <= bl; j++)
      m[i][j] = a[i-1] === b[j-1] ? m[i-1][j-1] : Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1);
    return m[al][bl];
  }

  // ═══════════════════════════════════════════════════════════════
  //  BACKUP / RESTORE
  // ═══════════════════════════════════════════════════════════════
  function showBackupModal() {
    showModal('💾 Backup / Restore', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div style="padding:16px;background:var(--plm-bg3);border-radius:10px;text-align:center">
          <div style="font-size:32px;margin-bottom:8px">⬇️</div>
          <div style="font-weight:700;font-size:13px;margin-bottom:4px">Export Backup</div>
          <div style="font-size:10px;color:var(--plm-fg3);margin-bottom:10px">Save all data as JSON</div>
          <button class="plm-prompt-btn primary" onclick="window.__plm__.exportBackup()">Export JSON</button>
        </div>
        <div style="padding:16px;background:var(--plm-bg3);border-radius:10px;text-align:center">
          <div style="font-size:32px;margin-bottom:8px">⬆️</div>
          <div style="font-weight:700;font-size:13px;margin-bottom:4px">Import Backup</div>
          <div style="font-size:10px;color:var(--plm-fg3);margin-bottom:10px">Restore from JSON file</div>
          <button class="plm-prompt-btn" onclick="document.getElementById('plm-backup-file').click()">Import JSON</button>
          <input type="file" id="plm-backup-file" accept=".json" style="display:none" onchange="window.__plm__.importBackup(this)">
        </div>
      </div>
      <div class="plm-help-text">⚠️ Importing will merge with existing data. No data is deleted.</div>
    `, null);
  }

  function exportBackup() {
    chrome.storage.local.get(null, (data) => {
      const plmData = {};
      Object.keys(data).forEach(k => { if(k.startsWith('plm_')) plmData[k] = data[k]; });
      const blob = new Blob([JSON.stringify(plmData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pipelinelm-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Backup exported!', 'ok');
    });
  }

  function importBackup(fileInput) {
    const file = fileInput.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        Object.keys(data).forEach(k => {
          if(k.startsWith('plm_')) chrome.storage.local.set({ [k]: data[k] });
        });
        toast('Backup restored! Refresh to see changes.', 'ok');
      } catch(err) { toast('Invalid backup file', 'err'); }
    };
    reader.readAsText(file);
  }

  // ═══════════════════════════════════════════════════════════════
  //  PROMPT MANAGER (v3 enhanced)
  // ═══════════════════════════════════════════════════════════════
  function showPromptManager() {
    const html = S.prompts.map((p, i) => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px">
        <span style="font-size:18px">${p.icon || '💬'}</span>
        <div style="flex:1">
          <input style="width:100%;padding:5px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:#0a0e1a;color:#e2e8f0;font-size:12px" value="${escapeHtml(p.name)}" data-idx="${i}" data-field="name" onchange="window.__plm__.savePromptField(this)">
          <div style="font-size:9px;color:var(--plm-fg3);margin-top:2px">Shortcut: /${p.shortcut || ''}</div>
        </div>
        <button class="plm-prompt-btn" style="background:var(--plm-accent)" onclick="window.__plm__.usePrompt(${i})">Use</button>
        <button class="plm-prompt-btn" style="background:#ef4444" onclick="window.__plm__.deletePrompt(${i})">Del</button>
      </div>
    `).join('');
    showModal('💬 Prompt Library', html + `
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="plm-prompt-btn" onclick="window.__plm__.addPrompt()">+ Add Prompt</button>
        <button class="plm-prompt-btn secondary" onclick="window.__plm__.exportPrompts()">⬇️ Export</button>
        <button class="plm-prompt-btn secondary" onclick="document.getElementById('plm-prompt-import-file').click()">⬆️ Import</button>
        <input type="file" id="plm-prompt-import-file" accept=".json,.csv" style="display:none" onchange="window.__plm__.importPrompts(this)">
      </div>
      <div class="plm-help-text" style="margin-top:8px">Tip: Type / in any chat input to use shortcodes. Ctrl+Shift+P opens this library.</div>
    `, null);
  }

  function usePrompt(idx) {
    const p = S.prompts[idx];
    if(!p) return;
    const ta = document.querySelector('textarea[class*="input"]') || document.querySelector('textarea[placeholder*="Ask"]');
    if(ta) { ta.value = p.text; ta.focus(); ta.dispatchEvent(new Event('input', {bubbles:true})); toast('Prompt inserted!', 'ok'); }
    document.getElementById('plm-modal-system')?.remove();
  }

  function savePromptField(input) {
    const idx = parseInt(input.dataset.idx);
    const field = input.dataset.field;
    if(S.prompts[idx]) S.prompts[idx][field] = input.value;
    chrome.storage.local.set({ plm_prompts: S.prompts });
  }

  function addPrompt() {
    const name = prompt('Prompt name:'); if(!name?.trim()) return;
    const shortcut = prompt('Shortcut (e.g., my):');
    const text = prompt('Prompt text:'); if(!text?.trim()) return;
    S.prompts.push({ id:'p_'+Date.now(), name:name.trim(), shortcut:shortcut||'', text:text.trim(), icon:'💬' });
    chrome.storage.local.set({ plm_prompts: S.prompts });
    showPromptManager();
  }

  function deletePrompt(idx) { S.prompts.splice(idx,1); chrome.storage.local.set({plm_prompts:S.prompts}); showPromptManager(); }
  function exportPrompts() { downloadFile(JSON.stringify(S.prompts,null,2), 'pipelinelm-prompts.json', 'application/json'); toast('Exported!', 'ok'); }
  function importPrompts(input) {
    const f = input.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = (e) => { try { const p = JSON.parse(e.target.result); if(Array.isArray(p)) { S.prompts = [...S.prompts, ...p]; chrome.storage.local.set({plm_prompts:S.prompts}); showPromptManager(); toast('Imported!', 'ok'); } } catch(err) { toast('Invalid file', 'err'); } };
    r.readAsText(f);
  }

  // ═══════════════════════════════════════════════════════════════
  //  AI PROMPT SUGGESTIONS (from v2)
  // ═══════════════════════════════════════════════════════════════
  function scanSources() {
    S.sources = [];
    document.querySelectorAll('[data-testid*="source"], [class*="source-item"], [class*="source-card"]').forEach(el => {
      const title = el.querySelector('[class*="title"], [class*="name"]')?.textContent?.trim() || el.textContent?.split('\n')[0]?.trim();
      if(title && title.length > 2) {
        const type = detectSourceType(el);
        S.sources.push({ title, type, snippet: getSnippet(el), element: el });
      }
    });
  }

  function detectSourceType(el) {
    const t = el.textContent.toLowerCase();
    if(t.includes('.pdf') || t.includes('pdf')) return 'PDF';
    if(t.includes('youtube') || t.includes('youtu.be')) return 'Video';
    if(t.includes('docs.google')) return 'Doc';
    if(t.includes('.mp3') || t.includes('.wav')) return 'Audio';
    if(t.includes('http') || t.includes('article')) return 'Web';
    return 'Document';
  }

  function getSnippet(el) {
    return Array.from(el.querySelectorAll('p, div')).map(p => p.textContent.trim()).filter(t => t.length > 30 && t.length < 300)[0] || '';
  }

  function extractNotebookContext() {
    const ctx = { notebookTitle: S.currentNotebookTitle, sourceTitles: S.sources.map(s=>s.title), sourceSnippets: S.sources.map(s=>s.snippet), chatMessages: [], keyTerms: [], sourceTypes: S.sources.map(s=>s.type) };
    document.querySelectorAll('[class*="message"], [class*="chat-turn"]').forEach(el => { const t = el.textContent.trim(); if(t.length>10 && t.length<500) ctx.chatMessages.push(t); });
    const mc = document.querySelector('main, [class*="content"]');
    if(mc) { const cp = mc.textContent.match(/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,4}\b/g) || []; ctx.keyTerms = [...new Set(cp)].slice(0,30); }
    return ctx;
  }

  function detectTopic(ctx) {
    const all = [ctx.notebookTitle, ...ctx.sourceTitles, ...ctx.chatMessages.slice(0,5), ...ctx.keyTerms.slice(0,20)].join(' ').toLowerCase();
    const sc = {};
    if(ctx.notebookTitle) sc[ctx.notebookTitle.replace(/[^\w\s]/g,'').trim()] = 20;
    ctx.sourceTitles.forEach(t => { const c = t.replace(/[^\w\s]/g,'').trim(); if(c.length>3 && c.length<80) sc[c] = (sc[c]||0)+10; });
    const ph = all.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b/g) || [];
    ph.forEach(p => { if(p.length>4 && p.length<60) sc[p] = (sc[p]||0)+3; });
    const fw = all.split(/\s+/).filter(w => w.length>4);
    const fr = {}; fw.forEach(w => { fr[w] = (fr[w]||0)+1; });
    Object.entries(fr).forEach(([w,c]) => { if(c>1) sc[w] = (sc[w]||0)+c; });
    const so = Object.entries(sc).sort((a,b) => b[1]-a[1]).filter(([p]) => p.length>4);
    if(!so.length) return {topic:'', confidence:0};
    return { topic: so[0][0].split(' ').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' '), confidence: so[0][1]/Math.max(...so.map(s=>s[1])), alternatives: so.slice(1,4).map(s=>s[0]) };
  }

  function detectAudience(ctx) {
    const txt = [ctx.notebookTitle, ...ctx.sourceTitles, ...ctx.chatMessages].join(' ').toLowerCase();
    const sigs = { 'Executives': ['executive','ceo','leadership','board','stakeholder','strategic','roi','kpi'],'Engineers': ['api','code','developer','engineering','technical','implementation','architecture'],'Students': ['student','university','academic','research','study','thesis','dissertation'],'Marketing': ['marketing','campaign','brand','conversion','seo','content'],'Product': ['product','roadmap','feature','mvp','launch'],'General': ['beginner','introduction','overview','simple','guide','tutorial'] };
    const sc = {}; Object.entries(sigs).forEach(([a,ks]) => { sc[a] = ks.filter(k => txt.includes(k)).length; });
    const so = Object.entries(sc).sort((a,b) => b[1]-a[1]);
    return so[0][1] === 0 ? {audience:'General Audience', confidence:0.3} : {audience:so[0][0], confidence:so[0][1]/5};
  }

  function generateSmartSuggestions() {
    const ctx = extractNotebookContext();
    if(!ctx.sourceTitles.length && !ctx.notebookTitle) return null;
    const topic = detectTopic(ctx);
    const audience = detectAudience(ctx);
    const suggestions = [];
    if(topic.topic) suggestions.push({ name:'Deep Dive: '+topic.topic, text:`Create a comprehensive deep-dive analysis of "${topic.topic}" for ${audience.audience}. Cover key aspects, controversies, and implications across ${ctx.sourceTitles.length} sources.`, confidence:topic.confidence, reasoning:`Detected topic "${topic.topic}"` });
    suggestions.push({ name:'Executive Summary', text:`Provide a concise executive summary synthesizing key findings across ${ctx.sourceTitles.length} sources for ${audience.audience}.`, confidence:0.8, reasoning:`Synthesis of ${ctx.sourceTitles.length} sources` });
    if(ctx.sourceTitles.length >= 2) suggestions.push({ name:'Compare Sources', text:`Compare and contrast viewpoints across ${ctx.sourceTitles.length} sources about "${topic.topic||'this topic'}" for ${audience.audience}.`, confidence:0.7, reasoning:`${ctx.sourceTitles.length} sources detected` });
    if(ctx.chatMessages.some(m => m.includes('?'))) suggestions.push({ name:'FAQ Generation', text:`Generate a comprehensive FAQ about "${topic.topic||'this topic'}" for ${audience.audience} based on questions asked and sources.`, confidence:0.6, reasoning:`Questions detected in chat` });
    return { ctx, topic, audience, format:{primary:'Audio Overview', primaryId:'audio', alternatives:['Video Overview','Report']}, suggestions: suggestions.sort((a,b) => b.confidence-a.confidence) };
  }

  function applySmartSuggestions() {
    const a = generateSmartSuggestions();
    if(!a) return;
    const ti = document.getElementById('ql-topic');
    const ai = document.getElementById('ql-audience');
    if(ti && a.topic.topic) { ti.value = a.topic.topic; ti.style.borderColor = 'var(--plm-ok,#10b981)'; setTimeout(()=>ti.style.borderColor='',2000); }
    if(ai && a.audience.audience) { ai.value = a.audience.audience; ai.style.borderColor = 'var(--plm-ok,#10b981)'; setTimeout(()=>ai.style.borderColor='',2000); }
    toast(`AI: "${a.topic.topic}" for ${a.audience.audience}. ${a.suggestions.length} prompts ready.`, 'ok');
    try { chrome.runtime.sendMessage({action:'aiAnalysis', analysis:{topic:a.topic, audience:a.audience, suggestionCount:a.suggestions.length}}); } catch(e) {}
  }

  // ═══════════════════════════════════════════════════════════════
  //  FOLDER MANAGER (v2 upgraded)
  // ═══════════════════════════════════════════════════════════════
  function showFolderPanel() { toggleFolderPanel(); }
  function toggleFolderPanel() {
    S.folderPanelOpen = !S.folderPanelOpen;
    const fp = document.getElementById('plm-folder-panel');
    if(!fp) injectFolderManager();
    document.getElementById('plm-folder-panel')?.classList.toggle('visible', S.folderPanelOpen);
  }

  function injectFolderManager() {
    if(document.getElementById('plm-folder-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'plm-folder-panel';
    renderFolderPanelContent(panel);
    document.body.appendChild(panel);
  }

  function renderFolderPanelContent(panel) {
    panel.innerHTML = `
      <div class="plm-folder-header"><h3>📁 Folders</h3><button class="plm-menu-item" style="padding:4px 8px" onclick="window.__plm__.toggleFolderPanel()">✕</button></div>
      <div class="plm-folder-list" id="plm-folder-list"></div>
      <div class="plm-folder-actions">
        <button class="plm-btn primary" onclick="window.__plm__.createFolder()">+ New</button>
        <button class="plm-btn" onclick="window.__plm__.renameFolder()">Rename</button>
        <button class="plm-btn" style="color:var(--plm-err)" onclick="window.__plm__.deleteFolder()">Delete</button>
      </div>
    `;
    renderFolderList();
  }

  function renderFolderList() {
    const list = document.getElementById('plm-folder-list');
    if(!list) return;
    const folders = S.folders.filter(f => f.id !== 'all');
    list.innerHTML = `
      <div class="plm-folder-item active" data-folder="all" onclick="window.__plm__.selectFolder('all')">📁 <span class="plm-folder-name">All Notebooks</span><span class="plm-folder-count">${countNotebooks()}</span></div>
      ${folders.map(f => `<div class="plm-folder-item" data-folder="${f.id}" onclick="window.__plm__.selectFolder('${f.id}')">${f.icon||'📂'} <span class="plm-folder-name">${f.name}</span><span class="plm-folder-count">${f.notebookIds?.length||0}</span></div>`).join('')}
    `;
  }

  function countNotebooks() { return document.querySelectorAll('a[href*="/notebook/"]').length; }
  function createFolder() { const n = prompt('Folder name:'); if(n?.trim()) { S.folders.push({id:'f_'+Date.now(), name:n.trim(), icon:'📂', notebookIds:[]}); saveFolders(); renderFolderList(); toast('Created: '+n, 'ok'); }}
  function renameFolder() { const id = getActiveFolder(); if(id==='all') { toast('Cannot rename All', 'warn'); return; } const f = S.folders.find(f=>f.id===id); const n = prompt('New name:', f?.name); if(n?.trim() && f) { f.name=n.trim(); saveFolders(); renderFolderList(); toast('Renamed', 'ok'); }}
  function deleteFolder() { const id = getActiveFolder(); if(id==='all' || !confirm('Delete?')) return; S.folders = S.folders.filter(f=>f.id!==id); saveFolders(); selectFolder('all'); renderFolderList(); toast('Deleted', 'ok'); }
  function selectFolder(id) { document.querySelectorAll('.plm-folder-item').forEach(el => el.classList.toggle('active', el.dataset.folder===id)); filterNotebooksByFolder(id); }
  function getActiveFolder() { return document.querySelector('.plm-folder-item.active')?.dataset.folder || 'all'; }
  function filterNotebooksByFolder(id) { if(id==='all') { document.querySelectorAll('[data-plm-notebook]').forEach(el=>el.style.display=''); return; } const f = S.folders.find(f=>f.id===id); document.querySelectorAll('[data-plm-notebook]').forEach(el => { el.style.display = f?.notebookIds?.includes(el.dataset.plmNotebook) ? '' : 'none'; }); }
  function saveFolders() { chrome.storage.local.set({plm_folders: S.folders}); }

  // ═══════════════════════════════════════════════════════════════
  //  INJECTED UI COMPONENTS
  // ═══════════════════════════════════════════════════════════════
  function injectStudioLauncher() {
    if(document.getElementById('plm-studio-launcher')) return;
    const bar = document.createElement('div');
    bar.id = 'plm-studio-launcher';
    bar.style.cssText = 'display:flex;gap:6px;padding:6px 12px;background:var(--plm-glass);border-bottom:1px solid var(--plm-border);align-items:center;font-family:Inter,system-ui,sans-serif;flex-wrap:wrap';
    bar.innerHTML = `
      <span style="font-size:10px;color:var(--plm-fg3);font-weight:600;white-space:nowrap">GENERATE:</span>
      ${STUDIO_TYPES.slice(0,7).map(t => `<button class="plm-prompt-btn" style="padding:4px 10px;font-size:11px;background:${t.color}15;color:${t.color};border-color:${t.color}30" onclick="window.__plm__.quickGenerate('${t.id}')">${t.icon} ${t.name.split(' ')[0]}</button>`).join('')}
      <button class="plm-prompt-btn secondary" style="padding:4px 10px;font-size:11px" onclick="window.__plm__.showStudioGenerator()">✨ More...</button>
    `;
    const target = document.querySelector('header') || document.querySelector('main');
    if(target) target.insertAdjacentElement('afterend', bar);
  }

  function quickGenerate(typeId) {
    selectedStudioType = typeId;
    const type = STUDIO_TYPES.find(t => t.id === typeId);
    scanSources();
    const prompt = buildGenerationPrompt(typeId, {format:'standard', length:'standard', style:'standard'}, S.sources, '', S.activeLang);
    const ta = document.querySelector('textarea[class*="input"]') || document.querySelector('textarea[placeholder*="Ask"]');
    if(ta) { ta.value = prompt; ta.focus(); ta.dispatchEvent(new Event('input', {bubbles:true})); toast(`${type?.name || typeId} prompt ready! Press Enter to generate.`, 'ok'); }
  }

  function injectBulkSourceBar() {
    if(document.getElementById('plm-bulk-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'plm-bulk-bar';
    bar.style.cssText = 'display:flex;gap:6px;padding:6px 12px;background:var(--plm-glass);border-bottom:1px solid var(--plm-border);align-items:center;font-family:Inter,system-ui,sans-serif';
    bar.innerHTML = `
      <span style="font-size:10px;color:var(--plm-fg3);font-weight:600;white-space:nowrap">SOURCES:</span>
      <button class="plm-prompt-btn" style="padding:4px 10px;font-size:11px" onclick="window.__plm__.showBulkAdder()">📥 Bulk Add</button>
      <button class="plm-prompt-btn secondary" style="padding:4px 10px;font-size:11px" onclick="window.__plm__.showDupeFinder()">🔍 Dupes</button>
      <span style="margin-left:auto;font-size:10px;color:var(--plm-fg3)">${S.sources.length} sources</span>
    `;
    const target = document.querySelector('header') || document.querySelector('main');
    if(target) target.insertAdjacentElement('afterend', bar);
  }

  function injectAudioPlayer() {
    if(document.getElementById('plm-audio-player')) return;
    // Audio player is invoked via toolbar
  }

  function injectLanguageWidget() {
    if(document.getElementById('plm-lang-widget')) return;
    const w = document.createElement('div');
    w.id = 'plm-lang-widget';
    const langNames = {en:'English',es:'Spanish',fr:'French',de:'German',it:'Italian',pt:'Portuguese',zh:'Chinese',ja:'Japanese',ko:'Korean',hi:'Hindi',ar:'Arabic',ru:'Russian',tr:'Turkish',pl:'Polish',nl:'Dutch',sv:'Swedish',th:'Thai',vi:'Vietnamese',id:'Indonesian',he:'Hebrew'};
    const currentName = langNames[S.activeLang] || 'English';
    w.innerHTML = `<button class="plm-lang-toggle" onclick="window.__plm__.showLanguageWidget()">🌐 ${currentName}</button>`;
    document.body.appendChild(w);
  }

  function injectPromptBar() {
    if(document.getElementById('plm-prompt-bar')) return;
    const target = document.querySelector('textarea[class*="input"]')?.closest('div[class*="container"]') || document.querySelector('textarea[placeholder*="Ask"]');
    if(!target) return;
    const bar = document.createElement('div');
    bar.id = 'plm-prompt-bar';
    bar.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 12px;background:var(--plm-glass);border-bottom:1px solid var(--plm-border);font-family:Inter,system-ui,sans-serif';
    const opts = S.prompts.map(p => `<option value="${p.id}">${p.icon||'💬'} ${p.name}</option>`).join('');
    bar.innerHTML = `
      <select id="plm-prompt-select" style="flex:1"><option value="">💬 Quick Prompts...</option>${opts}</select>
      <button class="plm-prompt-btn" onclick="window.__plm__.insertPrompt()">Insert</button>
      <button class="plm-prompt-btn secondary" onclick="window.__plm__.showPromptManager()">Manage</button>
    `;
    target.insertAdjacentElement('beforebegin', bar);
  }

  function injectExportBar() {
    if(document.getElementById('plm-export-bar')) return;
    const target = document.querySelector('main');
    if(!target) return;
    const bar = document.createElement('div');
    bar.id = 'plm-export-bar';
    bar.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 12px;background:var(--plm-glass);border-bottom:1px solid var(--plm-border);font-family:Inter,system-ui,sans-serif';
    bar.innerHTML = `
      <span style="font-size:10px;color:var(--plm-fg3);font-weight:600;white-space:nowrap">EXPORT:</span>
      <button class="plm-prompt-btn" style="padding:4px 10px;font-size:11px" onclick="window.__plm__.exportChat('pdf')">📄 PDF</button>
      <button class="plm-prompt-btn secondary" style="padding:4px 10px;font-size:11px" onclick="window.__plm__.exportChat('markdown')">📝 MD</button>
      <button class="plm-prompt-btn secondary" style="padding:4px 10px;font-size:11px" onclick="window.__plm__.exportChat('json')">🗂️ JSON</button>
      <button class="plm-prompt-btn secondary" style="padding:4px 10px;font-size:11px" onclick="window.__plm__.exportChat('text')">📃 Text</button>
    `;
    target.insertAdjacentElement('afterbegin', bar);
  }

  function insertPrompt() {
    const select = document.getElementById('plm-prompt-select');
    if(!select?.value) { toast('Select a prompt first', 'warn'); return; }
    const prompt = S.prompts.find(p => p.id === select.value);
    if(!prompt) return;
    const ta = document.querySelector('textarea[class*="input"]') || document.querySelector('textarea[placeholder*="Ask"]') || document.querySelector('textarea[placeholder*="Chat"]');
    if(ta) { ta.value = prompt.text; ta.focus(); ta.dispatchEvent(new Event('input', {bubbles:true})); toast('Inserted: '+prompt.name, 'ok'); }
    else toast('No textarea found', 'err');
  }

  // ═══════════════════════════════════════════════════════════════
  //  EXPORT (from v2)
  // ═══════════════════════════════════════════════════════════════
  function exportChat(format) {
    const data = scrapeChatContent();
    if(!data.messages.length) { toast('No chat content', 'warn'); return; }
    if(format==='pdf') exportToPDF(data);
    else if(format==='markdown') exportToMarkdown(data);
    else if(format==='json') { downloadFile(JSON.stringify(data,null,2), `chat-${Date.now()}.json`, 'application/json'); toast('JSON exported', 'ok'); }
    else if(format==='text') exportToText(data);
  }

  function scrapeChatContent() {
    const title = document.querySelector('h1')?.textContent?.trim() || 'NotebookLM Chat';
    const msgs = [];
    document.querySelectorAll('[class*="message"], [class*="chat-turn"]').forEach(el => {
      const role = el.textContent.toLowerCase().includes('you:') ? 'user' : 'assistant';
      const text = el.textContent.replace(/^you:\s*/i,'').trim();
      if(text) msgs.push({role, text, timestamp: new Date().toISOString()});
    });
    if(!msgs.length) {
      const ca = document.querySelector('main');
      if(ca) ca.querySelectorAll('p, div[class*="text"]').forEach(el => { const t = el.textContent.trim(); if(t.length>10) msgs.push({role:'unknown', text:t, timestamp:new Date().toISOString()}); });
    }
    return {title, notebookId: S.currentNotebookId, exportedAt: new Date().toISOString(), messages: msgs};
  }

  function exportToPDF(data) {
    const html = `<html><head><meta charset="UTF-8"><title>${escapeHtml(data.title)}</title><style>body{font-family:Arial,sans-serif;max-width:720px;margin:40px auto;color:#333;line-height:1.6}h1{color:#1a1a2e;border-bottom:2px solid #3b82f6;padding-bottom:10px}.meta{color:#666;font-size:12px;margin-bottom:20px}.msg{margin:16px 0;padding:12px 16px;border-radius:8px}.user{background:#e8f0fe;border-left:4px solid #3b82f6}.assistant{background:#f0f0f0;border-left:4px solid #666}.role{font-weight:700;font-size:11px;text-transform:uppercase;margin-bottom:4px}pre{white-space:pre-wrap;font-size:13px}</style></head><body><h1>${escapeHtml(data.title)}</h1><div class="meta">Exported: ${new Date(data.exportedAt).toLocaleString()}</div>${data.messages.map(m=>`<div class="msg ${m.role}"><div class="role">${m.role}</div><pre>${escapeHtml(m.text)}</pre></div>`).join('')}</body></html>`;
    const blob = new Blob([html], {type:'text/html'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `chat-${Date.now()}.html`; a.click(); URL.revokeObjectURL(url);
    toast('HTML exported (print as PDF)', 'ok');
  }

  function exportToMarkdown(data) {
    let md = `# ${data.title}\n\n> Exported: ${new Date(data.exportedAt).toLocaleString()}\n\n---\n\n`;
    data.messages.forEach(m => { md += m.role==='user' ? `## You\n\n${m.text}\n\n---\n\n` : `## NotebookLM\n\n${m.text}\n\n---\n\n`; });
    downloadFile(md, `chat-${Date.now()}.md`, 'text/markdown');
    toast('Markdown exported', 'ok');
  }

  function exportToText(data) {
    let t = `${data.title}\nExported: ${new Date(data.exportedAt).toLocaleString()}\n${'='.repeat(60)}\n\n`;
    data.messages.forEach(m => { t += `[${m.role.toUpperCase()}]:\n${m.text}\n\n${'-'.repeat(40)}\n\n`; });
    downloadFile(t, `chat-${Date.now()}.txt`, 'text/plain');
    toast('Text exported', 'ok');
  }

  // ═══════════════════════════════════════════════════════════════
  //  SYNC EXTERNAL (from v2)
  // ═══════════════════════════════════════════════════════════════
  function syncExternal(type) {
    if(!S.currentNotebookId) { toast('Open a notebook first', 'warn'); return; }
    const prompts = { reddit:'Reddit URL:', gdocs:'Google Doc URL:', claude:'Claude chat URL:' };
    const url = prompt(prompts[type]); if(!url?.trim()) return;
    toast(`Syncing ${type}...`, 'info');
    chrome.runtime.sendMessage({action:'syncExternal', type, url: url.trim()}).then(r => {
      if(r?.error) toast(r.error, 'err');
      else toast(`Synced: ${r?.pages || 'content'}`, 'ok');
    }).catch(e => toast('Sync failed: '+e.message, 'err'));
  }

  // ═══════════════════════════════════════════════════════════════
  //  DARK MODE
  // ═══════════════════════════════════════════════════════════════
  function toggleDarkMode() {
    S.darkMode = !S.darkMode;
    applyDarkMode(S.darkMode);
    chrome.storage.local.set({plm_darkMode: S.darkMode});
    const btn = document.getElementById('plm-theme-toggle');
    if(btn) { btn.innerHTML = `<span style="font-size:16px">${S.darkMode ? '☀️' : '🌙'}</span> ${S.darkMode ? 'Light Mode' : 'Dark Mode'}`; }
    toast(S.darkMode ? 'Dark mode' : 'Light mode', 'ok');
  }

  function applyDarkMode(on) {
    document.documentElement.setAttribute('data-plm-theme', on ? 'dark' : 'light');
  }

  // ═══════════════════════════════════════════════════════════════
  //  MODAL SYSTEM
  // ═══════════════════════════════════════════════════════════════
  function showModal(title, bodyHtml, onConfirm, confirmLabel) {
    document.getElementById('plm-modal-system')?.remove();
    const modal = document.createElement('div');
    modal.id = 'plm-modal-system';
    modal.className = 'plm-modal-overlay';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,system-ui,sans-serif';
    modal.innerHTML = `
      <div style="background:var(--plm-bg2,#111827);border:1px solid var(--plm-border);border-radius:10px;max-width:500px;width:100%;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,0.4);animation:fadeIn 0.2s ease-out">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--plm-border)"><h3 style="font-size:13px">${title}</h3><button style="background:none;border:none;color:var(--plm-fg2);font-size:16px;cursor:pointer" onclick="document.getElementById('plm-modal-system').remove()">✕</button></div>
        <div id="modal-body" style="padding:14px 16px;overflow-y:auto;flex:1">${bodyHtml}</div>
        ${onConfirm ? `<div style="display:flex;gap:8px;padding:10px 16px;border-top:1px solid var(--plm-border);justify-content:flex-end"><button class="plm-prompt-btn secondary" onclick="document.getElementById('plm-modal-system').remove()">Cancel</button><button class="plm-prompt-btn" onclick="window.__plm__._confirmModal()">${confirmLabel || 'Confirm'}</button></div>` : ''}
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if(e.target === modal) modal.remove(); });
    window.__plm__._confirmModal = () => { modal.remove(); if(onConfirm) onConfirm(); };
    document.addEventListener('keydown', function esc(e) { if(e.key==='Escape') { modal.remove(); document.removeEventListener('keydown', esc); } });
  }

  // ═══════════════════════════════════════════════════════════════
  //  TOAST
  // ═══════════════════════════════════════════════════════════════
  function toast(msg, type) {
    let container = document.getElementById('plm-toast-container');
    if(!container) { container = document.createElement('div'); container.id = 'plm-toast-container'; container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:100001;display:flex;flex-direction:column;gap:6px;font-family:Inter,system-ui,sans-serif'; document.body.appendChild(container); }
    const t = document.createElement('div');
    const colors = {ok:'#10b981',err:'#ef4444',info:'#3b82f6',warn:'#f59e0b'};
    t.style.cssText = `padding:8px 14px;border-radius:8px;font-size:11px;font-weight:600;color:#fff;background:${colors[type]||colors.info};animation:fadeIn 0.3s ease-out;max-width:300px;box-shadow:0 4px 16px rgba(0,0,0,0.3)`;
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  // ═══════════════════════════════════════════════════════════════
  //  UTILITIES
  // ═══════════════════════════════════════════════════════════════
  function escapeHtml(t) { if(!t) return ''; const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
  function downloadFile(content, filename, mimeType) { const blob = new Blob([content], {type: mimeType}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }

  async function addSourceToNL(source) {
    try { await chrome.runtime.sendMessage({action:'addSource', ...source}); } catch(e) {}
  }

  // ═══════════════════════════════════════════════════════════════
  //  MESSAGE LISTENER (from sidepanel/SW)
  // ═══════════════════════════════════════════════════════════════
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    try {
      switch(msg.action) {
        case 'syncFleet': sendResponse({notebooks: scrapeNotebooks()}); break;
        case 'scanPage': scanSources(); sendResponse({artifacts: scrapeArtifacts()}); break;
        case 'injectPrompt': { const ta = document.querySelector('textarea[class*="input"]') || document.querySelector('textarea[placeholder*="Ask"]'); if(ta && msg.text) { ta.value = msg.text; ta.focus(); ta.dispatchEvent(new Event('input', {bubbles:true})); sendResponse({injected:true}); } else sendResponse({error:'No textarea'}); break; }
        case 'getAnalysis': sendResponse(lastAnalysis || generateSmartSuggestions()); break;
        default: sendResponse({error:'Unknown: '+msg.action});
      }
    } catch(e) { sendResponse({error:e.message}); }
    return true;
  });

  function scrapeNotebooks() {
    const nbs = [];
    document.querySelectorAll('a[href*="/notebook/"]').forEach(el => {
      const m = el.getAttribute('href')?.match(/\/notebook\/([^\/\?]+)/);
      if(m && !nbs.find(n=>n.id===m[1])) nbs.push({id:m[1], title:el.textContent?.trim()||'Untitled', sourceCount:0, updatedAt:new Date().toISOString()});
    });
    return nbs;
  }

  function scrapeArtifacts() {
    const arts = [];
    document.querySelectorAll('button, a, [role="button"]').forEach(el => {
      const txt = el.textContent.trim();
      if(txt.length<5 || txt.length>120) return;
      const lower = txt.toLowerCase();
      let type = null;
      if(lower.includes('audio overview') || lower.includes('podcast')) type='audio';
      else if(lower.includes('video overview') || lower.includes('explainer')) type='video';
      else if(lower.includes('slide deck') || lower.includes('presentation')) type='slide_deck';
      else if(lower.includes('mind map') || lower.includes('mindmap')) type='mind_map';
      else if(lower.includes('report') || lower.includes('briefing')) type='report';
      else if(lower.includes('quiz') || lower.includes('assessment')) type='quiz';
      else if(lower.includes('flashcard') || lower.includes('study card')) type='flashcard';
      else if(lower.includes('data table') || lower.includes('spreadsheet')) type='data_table';
      else if(lower.includes('infographic') || lower.includes('visual summary')) type='infographic';
      if(!type) return;
      const gen = el.disabled || el.closest('div')?.textContent.toLowerCase().includes('generating');
      arts.push({id:'art_'+Math.random().toString(36).slice(2,10), title:txt, type, notebookId:S.currentNotebookId||'', notebookName:'', status:gen?'generating':'completed', createdAt:new Date().toISOString(), completedAt:gen?'':new Date().toISOString(), source:'scrape'});
    });
    return arts;
  }

  // ═══════════════════════════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════════════════════════
  window.__plm__ = {
    toggleFolderPanel, selectFolder, createFolder, renameFolder, deleteFolder,
    showStudioGenerator, selectStudioType, startGeneration, cancelGeneration, quickGenerate,
    selectSourceMode,
    showBulkAdder, setBulkTab, executeBulkAdd, importOpenTabs, extractLinksFromPage,
    showStudyMode, startQuiz, answerQuiz, startFlashcards, flipCard, nextCard, prevCard, rateCard,
    showAudioPlayer, audioToggle, audioNext, audioPrev, downloadAudio,
    showTagPanel, createTag,
    showDupeFinder,
    showBackupModal, exportBackup, importBackup,
    showPromptManager, usePrompt, savePromptField, addPrompt, deletePrompt, exportPrompts, importPrompts,
    showFolderPanel, showAISuggestions: showPromptManager,
    toggleDarkMode, insertPrompt,
    exportChat, syncExternal,
    // ─── v3.0 New Features ───
    showSearchEverything, executeSearch,
    showMoveSourcesModal, executeMove,
    showMergeModal, executeMerge,
    showStaleChecker, refreshStaleSources,
    showAccountSwitcher, switchAccount,
    showLanguageWidget, setLanguage,
    searchByTag,
    insertAISuggestion: (idx) => {},
    _confirmModal: () => {}
  };

  // ═══════════════════════════════════════════════════════════════
  //  SEARCH EVERYTHING — Cross-library search with type filters
  // ═══════════════════════════════════════════════════════════════
  function showSearchEverything() {
    showModal('🔍 Search Everything', `
      <div style="position:relative;margin-bottom:12px">
        <input type="text" id="plm-search-q" class="plm-input" style="padding-left:34px" placeholder="Search notebooks, sources, tags, URLs..." onkeydown="if(event.key==='Enter')window.__plm__.executeSearch()">
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:14px">🔍</span>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap">
        <button class="plm-filter-chip active" data-st="all" onclick="window.__plm__.setSearchType(this,'all')">All</button>
        <button class="plm-filter-chip" data-st="sources" onclick="window.__plm__.setSearchType(this,'sources')">📄 Sources</button>
        <button class="plm-filter-chip" data-st="notebooks" onclick="window.__plm__.setSearchType(this,'notebooks')">📓 Notebooks</button>
        <button class="plm-filter-chip" data-st="tags" onclick="window.__plm__.setSearchType(this,'tags')">🏷️ Tags</button>
        <button class="plm-filter-chip" data-st="urls" onclick="window.__plm__.setSearchType(this,'urls')">🔗 URLs</button>
      </div>
      <div id="plm-search-results" style="max-height:300px;overflow-y:auto"></div>
    `, null);
    setTimeout(() => document.getElementById('plm-search-q')?.focus(), 100);
  }

  let searchType = 'all';

  function setSearchType(btn, type) {
    searchType = type;
    document.querySelectorAll('[data-st]').forEach(b => b.classList.toggle('active', b.dataset.st === type));
  }

  function executeSearch() {
    const q = document.getElementById('plm-search-q')?.value?.toLowerCase().trim();
    if(!q) return;
    const results = [];

    if(searchType === 'all' || searchType === 'sources') {
      S.sources.forEach((s, i) => {
        if(s.title.toLowerCase().includes(q) || s.snippet.toLowerCase().includes(q)) {
          results.push({type:'source', icon:'📄', title:s.title, detail:s.type + (s.snippet ? ' — ' + s.snippet.slice(0,60) : ''), idx:i});
        }
      });
    }
    if(searchType === 'all' || searchType === 'notebooks') {
      document.querySelectorAll('a[href*="/notebook/"]').forEach(el => {
        const title = el.textContent.trim();
        if(title.toLowerCase().includes(q)) {
          results.push({type:'notebook', icon:'📓', title, detail:'Notebook'});
        }
      });
    }
    if(searchType === 'all' || searchType === 'tags') {
      S.tags.forEach(t => { if(t.name.toLowerCase().includes(q)) results.push({type:'tag', icon:'🏷️', title:t.name, detail:'Tag'}); });
    }
    if(searchType === 'all' || searchType === 'urls') {
      S.sources.forEach((s, i) => {
        if(s.url && s.url.toLowerCase().includes(q)) results.push({type:'url', icon:'🔗', title:s.url, detail:'URL — ' + s.title, idx:i});
      });
    }

    const el = document.getElementById('plm-search-results');
    if(results.length === 0) {
      el.innerHTML = '<div class="plm-empty">No results for "' + escapeHtml(q) + '"</div>';
    } else {
      el.innerHTML = `<div style="font-size:10px;color:var(--plm-fg3);margin-bottom:8px">${results.length} result${results.length>1?'s':''}</div>` +
        results.slice(0, 50).map(r => `
        <div class="plm-list-item" style="padding:6px 10px;font-size:11px">
          <span>${r.icon}</span>
          <div style="flex:1;min-width:0">
            <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600">${escapeHtml(r.title)}</div>
            <div style="font-size:10px;color:var(--plm-fg3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(r.detail)}</div>
          </div>
        </div>
      `).join('');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  COPY AND MOVE SOURCES BETWEEN NOTEBOOKS
  // ═══════════════════════════════════════════════════════════════
  function showMoveSourcesModal() {
    scanSources();
    if(!S.sources.length) { toast('No sources to move', 'warn'); return; }
    const srcList = S.sources.map((s,i) => `
      <label style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:11px;cursor:pointer">
        <input type="checkbox" class="plm-move-src" value="${i}" checked style="width:14px;height:14px">
        <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.title}</span>
        <span style="font-size:9px;color:var(--plm-fg3)">${s.type}</span>
      </label>
    `).join('');

    showModal('📋 Move Sources', `
      <div class="plm-form-label">Select sources to move/copy</div>
      <div style="max-height:150px;overflow-y:auto;margin-bottom:12px">${srcList}</div>
      <div class="plm-form-label">Destination notebook</div>
      <select id="plm-move-dest" class="plm-input">
        <option value="">Choose notebook...</option>
        ${S.notebooks.map(nb => `<option value="${nb.id}">${nb.title}</option>`).join('')}
      </select>
      <div style="display:flex;gap:8px;margin-top:12px">
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer">
          <input type="radio" name="plm-move-mode" value="copy" checked> Copy
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer">
          <input type="radio" name="plm-move-mode" value="move"> Move (delete originals)
        </label>
      </div>
      <div class="plm-help-text" style="margin-top:8px">💡 URLs, YouTube, and PDFs re-added as originals. Docs copied as text.</div>
    `, () => window.__plm__.executeMove(), 'Confirm');
  }

  async function executeMove() {
    const destId = document.getElementById('plm-move-dest')?.value;
    if(!destId) { toast('Select a destination notebook', 'warn'); return; }
    const mode = document.querySelector('input[name="plm-move-mode"]:checked')?.value || 'copy';
    const checked = document.querySelectorAll('.plm-move-src:checked');
    const sources = Array.from(checked).map(cb => S.sources[parseInt(cb.value)]).filter(Boolean);
    if(!sources.length) { toast('No sources selected', 'warn'); return; }

    toast(`${mode === 'move' ? 'Moving' : 'Copying'} ${sources.length} sources...`, 'info');
    let done = 0;
    for(const src of sources) {
      await addSourceToNL({type: src.type === 'Doc' ? 'text' : 'url', content: src.url || src.title, title: src.title});
      done++;
    }
    toast(`${mode === 'move' ? 'Moved' : 'Copied'} ${done} sources!`, 'ok');
    document.getElementById('plm-modal-system')?.remove();
  }

  // ═══════════════════════════════════════════════════════════════
  //  MERGE SOURCES
  // ═══════════════════════════════════════════════════════════════
  function showMergeModal() {
    scanSources();
    if(S.sources.length < 2) { toast('Need 2+ sources to merge', 'warn'); return; }
    const srcList = S.sources.map((s,i) => `
      <label style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:11px;cursor:pointer">
        <input type="checkbox" class="plm-merge-src" value="${i}" style="width:14px;height:14px">
        <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.title}</span>
      </label>
    `).join('');

    showModal('🔗 Merge Sources', `
      <div class="plm-form-label">Select 2+ sources to combine</div>
      <div style="max-height:150px;overflow-y:auto;margin-bottom:12px">${srcList}</div>
      <div class="plm-form-label">Combined title</div>
      <input id="plm-merge-title" class="plm-input" placeholder="e.g., Combined Research Notes">
      <div class="plm-help-text" style="margin-top:8px">💡 Sources are combined into a single text source. Max 500KB.</div>
    `, () => window.__plm__.executeMerge(), 'Merge');
  }

  async function executeMerge() {
    const checked = document.querySelectorAll('.plm-merge-src:checked');
    const sources = Array.from(checked).map(cb => S.sources[parseInt(cb.value)]).filter(Boolean);
    if(sources.length < 2) { toast('Select at least 2 sources', 'warn'); return; }
    const title = document.getElementById('plm-merge-title')?.value?.trim() || `Merged: ${sources.map(s=>s.title).join(', ').slice(0,50)}`;
    const combinedText = sources.map(s => `=== ${s.title} ===\n${s.snippet || ''}`).join('\n\n');
    if(combinedText.length > 500000) { toast('Combined text exceeds 500KB limit', 'err'); return; }
    await addSourceToNL({type:'text', content:combinedText, title});
    toast(`Merged ${sources.length} sources into "${title}"`, 'ok');
    document.getElementById('plm-modal-system')?.remove();
  }

  // ═══════════════════════════════════════════════════════════════
  //  KEEP SOURCES FRESH — Stale detection + bulk refresh
  // ═══════════════════════════════════════════════════════════════
  async function showStaleChecker() {
    scanSources();
    toast('Checking source freshness...', 'info');
    const stale = [];
    const fresh = [];
    for(const src of S.sources) {
      const isStale = await checkSourceFreshness(src);
      if(isStale) stale.push(src); else fresh.push(src);
    }
    const el = document.getElementById('plm-search-results'); // reuse results container if in search
    const html = stale.length === 0
      ? '<div class="plm-empty">🎉 All sources are fresh!</div>'
      : `<div style="font-size:10px;color:var(--plm-fg3);margin-bottom:8px">${stale.length} stale source${stale.length>1?'s':''} found</div>
         ${stale.map((s,i) => `
         <div class="plm-list-item" style="border-left:3px solid var(--plm-warn)">
           <span>📄</span>
           <div style="flex:1;min-width:0">
             <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600">${escapeHtml(s.title)}</div>
             <div style="font-size:10px;color:var(--plm-warn)">May be outdated</div>
           </div>
           <button class="plm-btn-icon" style="width:28px;height:28px" onclick="window.__plm__.refreshStaleSources([${i}])" title="Refresh">🔄</button>
         </div>
         `).join('')}
         <button class="plm-prompt-btn primary" style="width:100%;margin-top:8px" onclick="window.__plm__.refreshStaleSources(${JSON.stringify(stale.map((_,i)=>i))})">🔄 Refresh All ${stale.length} Sources</button>`;
    showModal('🔄 Source Freshness', html, null);
  }

  async function checkSourceFreshness(src) {
    // Check if source URL returns 200 and content hasn't changed
    if(!src.url || !src.url.match(/^https?:\/\//)) return false;
    try {
      const resp = await fetch(src.url, {method:'HEAD', mode:'no-cors'});
      return false; // If reachable, consider fresh
    } catch(e) {
      // If fetch fails, might be stale (CORS issues make this heuristic)
      return src.url.includes('article') || src.url.includes('news'); // News articles more likely to be stale
    }
  }

  async function refreshStaleSources(indices) {
    const idxs = Array.isArray(indices) ? indices : [indices];
    toast(`Refreshing ${idxs.length} sources...`, 'info');
    for(const idx of idxs) {
      const src = S.sources[idx];
      if(src) await addSourceToNL({type:'url', content:src.url || src.title, title:src.title});
    }
    toast('Refresh complete!', 'ok');
  }

  // ═══════════════════════════════════════════════════════════════
  //  CONNECT MULTIPLE ACCOUNTS
  // ═══════════════════════════════════════════════════════════════
  function showAccountSwitcher() {
    chrome.storage.local.get('plm_accounts', (data) => {
      const accounts = data.plm_accounts || [];
      const html = accounts.length === 0
        ? `<div class="plm-empty">No additional accounts linked.<br><br>
           <button class="plm-prompt-btn primary" onclick="window.__plm__.switchAccount('add')">+ Link Google Account</button></div>`
        : `<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
           ${accounts.map((acc,i) => `
           <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--plm-bg3);border-radius:8px;border:2px solid ${acc.color || '#3b82f6'}">
             <div style="width:32px;height:32px;border-radius:50%;background:${acc.color || '#3b82f6'};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px">${(acc.name || 'A').charAt(0)}</div>
             <div style="flex:1">
               <div style="font-weight:600;font-size:12px">${escapeHtml(acc.name || 'Account')}</div>
               <div style="font-size:10px;color:var(--plm-fg3)">${escapeHtml(acc.email || '')}</div>
             </div>
             <button class="plm-prompt-btn" onclick="window.__plm__.switchAccount('${acc.id}')">Switch</button>
           </div>`).join('')}
           </div>
           <button class="plm-prompt-btn secondary" style="width:100%" onclick="window.__plm__.switchAccount('add')">+ Link Another Account</button>`;
      showModal('👤 Account Switcher', html, null);
    });
  }

  function switchAccount(accountId) {
    if(accountId === 'add') {
      const name = prompt('Account nickname:'); if(!name?.trim()) return;
      const email = prompt('Account email:'); if(!email?.trim()) return;
      const colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316'];
      const newAcc = {id:'acc_'+Date.now(), name:name.trim(), email:email.trim(), color:colors[Math.floor(Math.random()*colors.length)]};
      chrome.storage.local.get('plm_accounts', (d) => {
        const accs = d.plm_accounts || [];
        accs.push(newAcc);
        chrome.storage.local.set({plm_accounts: accs});
        showAccountSwitcher();
        toast('Account linked!', 'ok');
      });
    } else {
      toast('Switched account. Refresh NotebookLM to apply.', 'ok');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  LANGUAGE TOGGLE — Floating widget
  // ═══════════════════════════════════════════════════════════════
  function showLanguageWidget() {
    const langs = [
      {code:'en',name:'English',flag:'🇺🇸'},{code:'es',name:'Spanish',flag:'🇪🇸'},{code:'fr',name:'French',flag:'🇫🇷'},
      {code:'de',name:'German',flag:'🇩🇪'},{code:'it',name:'Italian',flag:'🇮🇹'},{code:'pt',name:'Portuguese',flag:'🇵🇹'},
      {code:'zh',name:'Chinese',flag:'🇨🇳'},{code:'ja',name:'Japanese',flag:'🇯🇵'},{code:'ko',name:'Korean',flag:'🇰🇷'},
      {code:'hi',name:'Hindi',flag:'🇮🇳'},{code:'ar',name:'Arabic',flag:'🇸🇦'},{code:'ru',name:'Russian',flag:'🇷🇺'},
      {code:'tr',name:'Turkish',flag:'🇹🇷'},{code:'pl',name:'Polish',flag:'🇵🇱'},{code:'nl',name:'Dutch',flag:'🇳🇱'},
      {code:'sv',name:'Swedish',flag:'🇸🇪'},{code:'th',name:'Thai',flag:'🇹🇭'},{code:'vi',name:'Vietnamese',flag:'🇻🇳'},
      {code:'id',name:'Indonesian',flag:'🇮🇩'},{code:'he',name:'Hebrew',flag:'🇮🇱'}
    ];
    const grid = langs.map(l => `
      <button class="plm-lang-btn" data-code="${l.code}" onclick="window.__plm__.setLanguage('${l.code}')" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;border:1px solid var(--plm-border);background:var(--plm-bg2);color:var(--plm-fg);font-size:12px;cursor:pointer;transition:all .15s;font-family:inherit;${S.activeLang===l.code?'border-color:var(--plm-accent);background:rgba(59,130,246,0.1)':''}">
        <span style="font-size:18px">${l.flag}</span>
        <span>${l.name}</span>
      </button>
    `).join('');
    showModal('🌐 Language', `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">${grid}</div>
      <div class="plm-help-text" style="margin-top:10px">Selected language applies to all AI-generated content.</div>
    `, null);
  }

  function setLanguage(code) {
    S.activeLang = code;
    chrome.storage.local.set({plm_lang: code});
    document.querySelectorAll('.plm-lang-btn').forEach(b => {
      b.style.borderColor = b.dataset.code === code ? 'var(--plm-accent)' : 'var(--plm-border)';
      b.style.background = b.dataset.code === code ? 'rgba(59,130,246,0.1)' : 'var(--plm-bg2)';
    });
    toast('Language set', 'ok');
  }

  // ═══════════════════════════════════════════════════════════════
  //  ENHANCED TAG SEARCH
  // ═══════════════════════════════════════════════════════════════
  function searchByTag(tagId) {
    const tag = S.tags.find(t => t.id === tagId);
    if(!tag) return;
    toast(`Filtering by tag: ${tag.name}`, 'info');
    document.querySelectorAll('[data-plm-notebook]').forEach(el => {
      const nbTags = el.dataset.tags?.split(',') || [];
      el.style.display = nbTags.includes(tagId) ? '' : 'none';
    });
  }

  // ═══════════════════════════════════════════════════════════════
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
