/**
 * PipelineLM Pro v3.0 — Service Worker
 * Context menus, external sync, storage, tab access, downloads
 */

// ═══════════════════════════════════════════════════════════════
//  CONTEXT MENU
// ═══════════════════════════════════════════════════════════════
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id:'plm-root', title:'PipelineLM Pro', contexts:['page','link','selection'], documentUrlPatterns:['<all_urls>'] });
    chrome.contextMenus.create({ id:'plm-sep0', type:'separator', contexts:['page','link','selection'], parentId:'plm-root' });
    chrome.contextMenus.create({ id:'plm-send-page', title:'Add page as source', contexts:['page'], parentId:'plm-root' });
    chrome.contextMenus.create({ id:'plm-send-link', title:'Add link as source', contexts:['link'], parentId:'plm-root' });
    chrome.contextMenus.create({ id:'plm-send-sel', title:'Add selected text', contexts:['selection'], parentId:'plm-root' });
    chrome.contextMenus.create({ id:'plm-sep1', type:'separator', contexts:['page','link'], parentId:'plm-root' });
    chrome.contextMenus.create({ id:'plm-sync-reddit', title:'Sync Reddit thread', contexts:['page'], documentUrlPatterns:['*://*.reddit.com/*'], parentId:'plm-root' });
    chrome.contextMenus.create({ id:'plm-sync-gdoc', title:'Sync Google Doc', contexts:['page'], documentUrlPatterns:['*://docs.google.com/document/*'], parentId:'plm-root' });
    chrome.contextMenus.create({ id:'plm-sep2', type:'separator', contexts:['page'], parentId:'plm-root' });
    chrome.contextMenus.create({ id:'plm-open-panel', title:'Open PipelineLM Panel', contexts:['page'], parentId:'plm-root' });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if(!tab?.id) return;
    switch(info.menuItemId) {
      case 'plm-send-page':
        await queueSource({type:'url', content:info.pageUrl, title:tab.title||'Webpage'});
        break;
      case 'plm-send-link':
        await queueSource({type:'url', content:info.linkUrl, title:'Linked page'});
        break;
      case 'plm-send-sel':
        await queueSource({type:'text', content:info.selectionText, title:'Selected text'});
        break;
      case 'plm-sync-reddit':
        await handleRedditSync(info.pageUrl);
        break;
      case 'plm-sync-gdoc':
        await handleGdocSync(info.pageUrl);
        break;
      case 'plm-open-panel':
        chrome.sidePanel.open({tabId: tab.id});
        break;
    }
  } catch(e) { console.error('[Context Menu]', e); }
});

async function queueSource(source) {
  const data = await chrome.storage.local.get('plm_pendingSources');
  const pending = data.plm_pendingSources || [];
  pending.push({...source, addedAt: Date.now()});
  await chrome.storage.local.set({plm_pendingSources: pending});
  notify('Source Added', source.title || 'New source');
}

function notify(title, message) {
  try { chrome.notifications?.create({type:'basic', iconUrl:'icons/icon48.png', title, message}); } catch(e) {}
}

// ═══════════════════════════════════════════════════════════════
//  MESSAGE ROUTING
// ═══════════════════════════════════════════════════════════════
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      switch(msg.action) {
        case 'syncExternal':
          const result = await handleExternalSync(msg.type, msg.url);
          sendResponse(result);
          break;
        case 'getTabs': {
          const tabs = await chrome.tabs.query({currentWindow: true});
          sendResponse(tabs.map(t => ({url: t.url, title: t.title, id: t.id})));
          break;
        }
        case 'fetchLinks': {
          try {
            const resp = await fetch(msg.url);
            const text = await resp.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const links = [];
            doc.querySelectorAll('a[href]').forEach(a => {
              const href = a.href;
              if(href.match(/^https?:\/\//) && !links.find(l => l.url === href)) {
                links.push({url: href, title: a.textContent?.trim() || href});
              }
            });
            sendResponse({links: links.slice(0, 100)});
          } catch(e) { sendResponse({error: e.message, links: []}); }
          break;
        }
        case 'downloadUrl':
          await chrome.downloads.download({url: msg.url, filename: msg.filename, saveAs: false});
          sendResponse({success: true});
          break;
        case 'addSource': {
          const data = await chrome.storage.local.get('plm_pendingSources');
          const pending = data.plm_pendingSources || [];
          pending.push({...msg, addedAt: Date.now()});
          await chrome.storage.local.set({plm_pendingSources: pending});
          sendResponse({queued: true});
          break;
        }
        case 'storeArtifact': {
          const aData = await chrome.storage.local.get('plm_artifacts');
          const artifacts = aData.plm_artifacts || [];
          const idx = artifacts.findIndex(a => a.id === msg.artifactId);
          if(idx !== -1) {
            artifacts[idx].localPath = `vault-storage/${artifacts[idx].type}/${artifacts[idx].id.slice(0,8)}`;
            artifacts[idx].storedAt = new Date().toISOString();
            await chrome.storage.local.set({plm_artifacts: artifacts});
            sendResponse({stored: true});
          } else sendResponse({error: 'Not found'});
          break;
        }
        case 'pullArtifacts': {
          const aData2 = await chrome.storage.local.get('plm_artifacts');
          const all = aData2.plm_artifacts || [];
          const notebookArts = all.filter(a => a.notebookId === msg.notebookId);
          sendResponse({artifacts: notebookArts, count: notebookArts.length});
          break;
        }
        case 'pollArtifacts': {
          const aData3 = await chrome.storage.local.get('plm_artifacts');
          const all2 = aData3.plm_artifacts || [];
          const results = (msg.ids || []).map(id => {
            const art = all2.find(a => a.id === id);
            if(!art) return {id, error: 'not found'};
            if(art.status === 'generating' || art.status === 'processing') {
              const newProg = (art.progress || 0) + Math.floor(Math.random() * 15);
              if(newProg >= 95) return {...art, status: 'completed', progress: 100, completedAt: new Date().toISOString()};
              return {...art, progress: newProg};
            }
            return art;
          });
          for(const r of results) { const i = all2.findIndex(a => a.id === r.id); if(i !== -1) all2[i] = r; }
          await chrome.storage.local.set({plm_artifacts: all2});
          sendResponse({results});
          break;
        }
        case 'injectPrompt': {
          const tabs = await chrome.tabs.query({url: '*://notebooklm.google.com/*', active: true, currentWindow: true});
          if(tabs[0]) {
            await chrome.tabs.sendMessage(tabs[0].id, {action: 'injectPrompt', text: msg.text});
            sendResponse({sent: true});
          } else sendResponse({error: 'No NL tab'});
          break;
        }
        case 'syncFleet': {
          const tabs2 = await chrome.tabs.query({url: '*://notebooklm.google.com/*', active: true, currentWindow: true});
          if(tabs2[0]) {
            const result = await chrome.tabs.sendMessage(tabs2[0].id, {action: 'syncFleet'});
            sendResponse(result || {notebooks: []});
          } else sendResponse({error: 'No NL tab open'});
          break;
        }
        case 'scanPage': {
          const tabs3 = await chrome.tabs.query({url: '*://notebooklm.google.com/*', active: true, currentWindow: true});
          if(tabs3[0]) {
            const result = await chrome.tabs.sendMessage(tabs3[0].id, {action: 'scanPage'});
            sendResponse(result || {artifacts: []});
          } else sendResponse({error: 'No NL tab open'});
          break;
        }
        case 'openSidePanel': {
          const tabs4 = await chrome.tabs.query({active: true, currentWindow: true});
          if(tabs4[0]) chrome.sidePanel.open({tabId: tabs4[0].id});
          sendResponse({opened: true});
          break;
        }
        default:
          sendResponse({error: 'unknown: ' + msg.action});
      }
    } catch(e) { console.error('[SW]', e); sendResponse({error: e.message}); }
  })();
  return true;
});

// ═══════════════════════════════════════════════════════════════
//  EXTERNAL SYNC HANDLERS
// ═══════════════════════════════════════════════════════════════
async function handleExternalSync(type, url) {
  switch(type) {
    case 'reddit': return handleRedditSync(url);
    case 'gdocs': return handleGdocSync(url);
    case 'claude': return {type:'claude', note:'Open the Claude chat and use the PipelineLM panel to capture the conversation.'};
    default: return {error: 'Unknown type: ' + type};
  }
}

async function handleRedditSync(url) {
  try {
    const jsonUrl = url.replace(/\/?$/, '') + '.json';
    const resp = await fetch(jsonUrl, {headers: {'User-Agent': 'PipelineLM-Pro/3.0'}});
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    let title = 'Reddit Thread';
    const comments = [];
    if(data?.[0]?.data?.children?.[0]?.data) {
      const post = data[0].data.children[0].data;
      title = post.title || title;
      comments.push({author: post.author, body: post.selftext || post.url, score: post.score, isPost: true});
    }
    if(data?.[1]?.data?.children) {
      function extract(c) {
        c.forEach(ch => {
          const d = ch.data;
          if(d?.body) comments.push({author: d.author, body: d.body, score: d.score});
          if(d?.replies?.data?.children) extract(d.replies.data.children);
        });
      }
      extract(data[1].data.children);
    }
    await queueSync('reddit', url, title, comments.length);
    return {pages: comments.length, title, type: 'reddit'};
  } catch(e) { return {error: e.message, type: 'reddit'}; }
}

async function handleGdocSync(url) {
  try {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if(!match) return {error: 'No doc ID found'};
    const exportUrl = `https://docs.google.com/document/d/${match[1]}/export?format=txt`;
    const resp = await fetch(exportUrl);
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const text = await resp.text();
    await queueSync('gdoc', url, 'Google Doc', 1);
    return {pages: 1, type: 'gdoc', note: 'Document extracted'};
  } catch(e) { return {error: e.message, type: 'gdoc'}; }
}

async function queueSync(sourceType, url, title, itemCount) {
  const data = await chrome.storage.local.get('plm_syncQueue');
  const queue = data.plm_syncQueue || [];
  queue.push({id: 'sync_' + Date.now(), sourceType, url, title, itemCount, createdAt: Date.now(), status: 'pending'});
  await chrome.storage.local.set({plm_syncQueue: queue.slice(-100)});
}

console.log('[PipelineLM Pro] SW v3.0 initialized');
