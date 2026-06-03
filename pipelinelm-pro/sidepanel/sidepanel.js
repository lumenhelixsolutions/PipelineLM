import{ARTIFACT_TYPES,MSG_ACTIONS,STORAGE_KEYS}from'../shared/constants.js';
import{formatDate,escapeHtml}from'../shared/utils.js';

// Onboarding router
const od=await chrome.storage.local.get('plm:onboarded');
if(od['plm:onboarded']!==true)window.location.replace('onboard.html');

let artifacts=[],notebooks=[],settings={},session={filterType:'all',activeNotebookId:''},selId=null;

async function loadState(){
  const d=await chrome.storage.local.get([STORAGE_KEYS.artifacts,STORAGE_KEYS.notebooks,STORAGE_KEYS.settings,STORAGE_KEYS.session]);
  artifacts=d[STORAGE_KEYS.artifacts]||[];
  notebooks=d[STORAGE_KEYS.notebooks]||[];
  settings=d[STORAGE_KEYS.settings]||{vaultPath:'',autoSync:true,licenseKey:''};
  session=d[STORAGE_KEYS.session]||{filterType:'all',activeNotebookId:''};
}

// ─── TABS ───
function setTab(name){
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===name));
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.id==='tab-'+name));
  if(name==='dash')renderDashboard();
  if(name==='vault')renderVault();
  if(name==='pipeline')renderPipeline();
  if(name==='storage')renderStorage();
}
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>setTab(t.dataset.tab)));

// ─── DASHBOARD ───
function renderDashboard(){
  const total=artifacts.length;
  const stored=artifacts.filter(a=>a.localPath).length;
  const gen=artifacts.filter(a=>a.status==='generating'||a.status==='processing').length;
  const nb=notebooks.length;
  const el=id=>document.getElementById(id);
  if(el('st-total'))el('st-total').textContent=total;
  if(el('st-stored'))el('st-stored').textContent=stored;
  if(el('st-gen'))el('st-gen').textContent=gen;
  if(el('st-nb'))el('st-nb').textContent=nb;

  // Server connection check
  const serverStatus = el('server-status');
  if(serverStatus) {
    const url = settings.serverUrl || 'http://localhost:8080';
    fetch(url + '/api/status')
      .then(r => r.json())
      .then(s => {
        serverStatus.innerHTML = `<span class="badge ok">● Server Online</span> <span class="small">v${s.sdkVersion}</span>`;
        serverStatus.onclick = () => chrome.tabs.create({ url: url });
      })
      .catch(() => {
        serverStatus.innerHTML = `<span class="badge err">● Server Offline</span> <span class="small">${url}</span>`;
      });
  }

  // Recent artifacts (last 10)
  const recent=el('recent-list');
  if(!recent)return;
  const sorted=[...artifacts].sort((a,b)=>new Date(b.discoveredAt)-new Date(a.discoveredAt)).slice(0,10);
  if(sorted.length===0){recent.innerHTML='<div class="empty" style="padding:16px"><div class="empty-icon">&#128229;</div><div class="empty-title">No artifacts yet</div><div class="empty-desc">Sync to discover your artifacts</div></div>';}
  else{recent.innerHTML=sorted.map(a=>renderRecentItem(a)).join('');}

  // Notebook list
  const nbList=el('dash-nb-list');
  if(!nbList)return;
  if(notebooks.length===0){nbList.innerHTML='<div class="empty" style="padding:16px"><div class="empty-desc">Visit notebooklm.google.com to discover notebooks</div></div>';}
  else{nbList.innerHTML=notebooks.map(n=>`<div class="nb-item" data-id="${n.id}"><span class="nb-dot"></span><span class="nb-name">${escapeHtml(n.title)}</span><span style="font-size:10px;color:var(--fg3)">${artifacts.filter(a=>a.notebookId===n.id).length} files</span></div>`).join('');
    nbList.querySelectorAll('.nb-item').forEach(item=>{
      item.addEventListener('click',()=>{session.activeNotebookId=item.dataset.id;setTab('vault');});
    });
  }
}

function renderRecentItem(a){
  const ti=ARTIFACT_TYPES[a.type]||ARTIFACT_TYPES.audio;
  let status=a.status||'completed';
  if(a.localPath)status='stored';
  const statusClass=status==='generating'||status==='processing'?'gen':status==='stored'?'stored':'comp';
  const statusLabel=status==='generating'?'Generating':status==='stored'?'Stored':'Done';
  return`<div class="recent-item" data-id="${a.id}"><span class="recent-icon" style="color:${ti.color}">${ti.icon}</span><div class="recent-info"><div class="recent-title">${escapeHtml(a.title)}</div><div class="recent-meta">${escapeHtml(a.notebookName||'Unknown')} &middot; ${formatDate(a.discoveredAt)}</div></div><span class="recent-status ${statusClass}">${statusLabel}</span></div>`;
}

// ─── VAULT ───
function renderVault(){
  const v=document.getElementById('vault');
  const empty=document.getElementById('vault-empty');
  if(!v)return;
  let f=[...artifacts];
  if(session.filterType!=='all')f=f.filter(a=>a.type===session.filterType);
  if(session.activeNotebookId)f=f.filter(a=>a.notebookId===session.activeNotebookId);

  const chipIds={all:'c-all',audio:'c-audio',video:'c-video',slide_deck:'c-slide',mind_map:'c-map',report:'c-report'};
  for(const[t,id]of Object.entries(chipIds)){const el=document.getElementById(id);if(el)el.textContent=t==='all'?artifacts.length:artifacts.filter(a=>a.type===t).length;}

  if(f.length===0){if(empty){v.innerHTML='';v.appendChild(empty);empty.style.display='flex';}return;}
  if(empty)empty.style.display='none';
  v.innerHTML=f.map(a=>renderArtifactCard(a)).join('');
  v.querySelectorAll('.card').forEach(c=>c.addEventListener('click',()=>{selId=c.dataset.id;renderVault();showInspector(selId);}));
  v.querySelectorAll('[data-a]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();handleAction(b.dataset.a,b.dataset.id);}));
}

function renderArtifactCard(a){
  const ti=ARTIFACT_TYPES[a.type]||ARTIFACT_TYPES.audio;
  const stored=!!a.localPath;
  let status=a.status||'completed';
  if(stored)status='stored';
  const statusText=status==='generating'?'Generating...':status==='processing'?'Processing...':stored?'Stored':'Completed';
  const statusClass=status==='generating'||status==='processing'?'gen':status==='stored'?'comp':'';
  return`<div class="card ${selId===a.id?'sel':''}" data-id="${a.id}"><div class="card-h" style="background:${ti.color}15;color:${ti.color}"><span style="font-size:24px">${ti.icon}</span><span class="card-badge">${ti.label}</span><span class="status-badge ${statusClass}">${statusText}</span></div><div class="card-info"><div class="card-title">${escapeHtml(a.title)}</div><div class="card-meta"><span>${escapeHtml(a.notebookName||'Unknown')}</span><span>${formatDate(a.discoveredAt)}</span></div></div><div class="card-actions">${!stored?`<button class="btn primary sm" data-a="store" data-id="${a.id}">&#128190; Store</button>`:''}<button class="btn sm" data-a="inspect" data-id="${a.id}">&#128203; View</button><button class="btn sm" data-a="dl" data-id="${a.id}">&#11123; DL</button><button class="btn sm" data-a="del" data-id="${a.id}" style="color:var(--err)">&#128465;</button></div></div>`;
}

// ─── PIPELINE ───
function renderPipeline(){
  const gen=artifacts.filter(a=>a.status==='generating'||a.status==='processing');
  const comp=artifacts.filter(a=>!a.localPath&&(a.status==='completed'||!a.status));
  const fail=artifacts.filter(a=>a.status==='failed');
  document.getElementById('pipe-gen').textContent=gen.length;
  document.getElementById('pipe-comp').textContent=comp.length;
  document.getElementById('pipe-fail').textContent=fail.length;
  document.getElementById('pipe-gen-body').innerHTML=gen.length?gen.map(a=>renderPipeItem(a,'generating')).join(''):'<div style="color:var(--fg3);font-size:11px;text-align:center;padding:16px">Nothing generating</div>';
  document.getElementById('pipe-comp-body').innerHTML=comp.length?comp.map(a=>renderPipeItem(a,'completed')).join(''):'<div style="color:var(--fg3);font-size:11px;text-align:center;padding:16px">No completed</div>';
  document.getElementById('pipe-fail-body').innerHTML=fail.length?fail.map(a=>renderPipeItem(a,'failed')).join(''):'<div style="color:var(--fg3);font-size:11px;text-align:center;padding:16px">No failures</div>';
}

function renderPipeItem(a,status){
  const ti=ARTIFACT_TYPES[a.type]||ARTIFACT_TYPES.audio;
  return`<div class="pipe-item" data-id="${a.id}" data-a="inspect"><div class="pipe-item-title"><span style="color:${ti.color};margin-right:4px">${ti.icon}</span>${escapeHtml(a.title)}</div><div class="pipe-item-meta">${escapeHtml(a.notebookName||'Unknown')} &middot; ${formatDate(a.discoveredAt)}</div></div>`;
}

// ─── STORAGE ───
function renderStorage(){
  const stored=artifacts.filter(a=>a.localPath);
  const total=artifacts.length;
  const bar=document.getElementById('storage-bar');
  const usedLabel=document.getElementById('storage-used');
  if(bar)bar.style.width=total?((stored.length/total)*100)+'%':'0%';
  if(usedLabel)usedLabel.textContent=stored.length+' stored / '+total+' total';
  const list=document.getElementById('file-list');
  if(!list)return;
  if(stored.length===0){list.innerHTML='<div class="empty" style="padding:16px"><div class="empty-icon">&#128193;</div><div class="empty-title">No local files</div><div class="empty-desc">Click "Store" on artifacts to download them</div></div>';return;}
  list.innerHTML=stored.map(a=>{
    const ti=ARTIFACT_TYPES[a.type]||ARTIFACT_TYPES.audio;
    const name=a.localPath.split('/').pop();
    return`<div class="file-item"><span class="file-icon" style="color:${ti.color}">${ti.icon}</span><span class="file-name">${escapeHtml(name)}</span><span class="file-size">${ti.label}</span></div>`;
  }).join('');
}

// ─── ACTIONS ───
async function handleAction(action,id){
  switch(action){
    case'store':showToast('Storing...','ok');await chrome.runtime.sendMessage({action:MSG_ACTIONS.ARTIFACT_STORE,artifactId:id});await loadState();renderVault();showInspector(id);showToast('Stored','ok');break;
    case'dl':showToast('Downloading...','ok');await chrome.runtime.sendMessage({action:MSG_ACTIONS.ARTIFACT_DOWNLOAD,artifactId:id});showToast('Downloaded','ok');break;
    case'del':if(!confirm('Delete this artifact?'))return;await chrome.runtime.sendMessage({action:MSG_ACTIONS.ARTIFACT_DELETE,artifactId:id});selId=null;await loadState();renderVault();document.getElementById('inspector')?.classList.add('collapsed');showToast('Deleted','ok');break;
    case'inspect':selId=id;renderVault();showInspector(id);break;
  }
}

function showInspector(id){
  const a=artifacts.find(x=>x.id===id);if(!a)return;
  const ti=ARTIFACT_TYPES[a.type]||ARTIFACT_TYPES.audio;
  const stored=!!a.localPath;
  const status=a.status||'completed';
  const body=document.getElementById('ins-body');
  const actions=document.getElementById('ins-actions');
  if(!body||!actions)return;
  body.innerHTML=`<div class="field"><div class="field-label">Title</div><div class="field-value">${escapeHtml(a.title)}</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div class="field"><div class="field-label">Type</div><div class="field-value" style="color:${ti.color}">${ti.icon} ${ti.label}</div></div><div class="field"><div class="field-label">Status</div><div class="field-value">${stored?'&#10003; Stored':status==='generating'?'&#9889; Generating...':'&#10003; Completed'}</div></div><div class="field"><div class="field-label">Notebook</div><div class="field-value">${escapeHtml(a.notebookName||'Unknown')}</div></div><div class="field"><div class="field-label">Discovered</div><div class="field-value">${formatDate(a.discoveredAt)}</div></div></div>`;
  actions.innerHTML=`${!stored?`<button class="btn primary" data-a="store" data-id="${id}">&#128190; Store</button>`:''}<button class="btn" data-a="dl" data-id="${id}">&#11123; Download</button><button class="btn" data-a="del" data-id="${id}">&#128465; Delete</button>`;
  actions.querySelectorAll('[data-a]').forEach(b=>b.addEventListener('click',()=>handleAction(b.dataset.a,b.dataset.id)));
  document.getElementById('inspector')?.classList.remove('collapsed');
}

function renderNotebooks(){
  const s=document.getElementById('nb-sel');if(!s)return;
  const cv=s.value;
  s.innerHTML='<option value="">All Notebooks</option>';
  notebooks.forEach(n=>{const o=document.createElement('option');o.value=n.id;o.textContent=n.title;s.appendChild(o);});
  if(cv)s.value=cv;
}

// ─── SYNC ───
async function doSync(){
  const btn=document.getElementById('btn-sync');if(btn){btn.disabled=true;btn.textContent='...';}
  try{
    const tabs=await chrome.tabs.query({url:'*://notebooklm.google.com/*'});
    if(tabs.length===0){showToast('Open notebooklm.google.com first','err');return;}
    const resp=await chrome.tabs.sendMessage(tabs[0].id,{action:MSG_ACTIONS.SCAN_REQUEST});
    console.log('[PLM] Scan:',resp);
    await loadState();
    renderDashboard();renderVault();renderPipeline();renderNotebooks();
    if(resp?.count>0)showToast(`Found ${resp.count} artifacts`,'ok');
    else if(resp?.scanned)showToast('No artifacts found - generate some first','ok');
  }catch(e){console.error('[PLM] Sync error:',e);showToast('Could not reach NotebookLM page','err');}
  finally{if(btn){btn.disabled=false;btn.textContent='Sync';}}
}

function showToast(msg,type='ok'){
  const c=document.getElementById('toasts');if(!c)return;
  const t=document.createElement('div');t.className='toast '+type;t.textContent=msg;
  c.appendChild(t);setTimeout(()=>t.remove(),2800);
}

// ─── SETUP ───
document.getElementById('nb-sel')?.addEventListener('change',e=>{session.activeNotebookId=e.target.value;chrome.storage.local.set({[STORAGE_KEYS.session]:session});renderVault();});
document.getElementById('btn-sync')?.addEventListener('click',doSync);
document.getElementById('btn-sync-h')?.addEventListener('click',doSync);
document.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));c.classList.add('active');session.filterType=c.dataset.filter;chrome.storage.local.set({[STORAGE_KEYS.session]:session});renderVault();}));
document.getElementById('ins-toggle')?.addEventListener('click',()=>document.getElementById('inspector')?.classList.toggle('collapsed'));
document.getElementById('btn-settings')?.addEventListener('click',()=>{document.getElementById('s-lic').value=settings.licenseKey||'';document.getElementById('s-sync').checked=settings.autoSync!==false;document.getElementById('modal-settings')?.classList.add('visible');});
document.getElementById('btn-close')?.addEventListener('click',()=>document.getElementById('modal-settings')?.classList.remove('visible'));
document.getElementById('btn-cancel')?.addEventListener('click',()=>document.getElementById('modal-settings')?.classList.remove('visible'));
document.getElementById('btn-save')?.addEventListener('click',async()=>{settings.licenseKey=document.getElementById('s-lic').value.trim();settings.autoSync=document.getElementById('s-sync').checked;await chrome.storage.local.set({[STORAGE_KEYS.settings]:settings});document.getElementById('modal-settings')?.classList.remove('visible');showToast('Saved','ok');});

// ─── INIT ───
loadState().then(()=>{renderDashboard();renderVault();renderNotebooks();chrome.runtime.onMessage.addListener(msg=>{if(msg.action===MSG_ACTIONS.VAULT_SYNCED){loadState().then(()=>{renderDashboard();renderVault();renderPipeline();renderNotebooks();if(msg.added>0)showToast(`${msg.added} new artifacts`,'ok');});}});});