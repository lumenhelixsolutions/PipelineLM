import{MSG_ACTIONS,STORAGE_KEYS}from'../shared/constants.js';
import{generateId}from'../shared/utils.js';

chrome.runtime.onInstalled.addListener(async(d)=>{
  if(d.reason==='install'){
    await chrome.storage.local.set({
      [STORAGE_KEYS.artifacts]:[],
      [STORAGE_KEYS.notebooks]:[],
      [STORAGE_KEYS.settings]:{vaultPath:'',autoSync:true,licenseKey:''},
      [STORAGE_KEYS.session]:{activeNotebookId:'',filterType:'all'},
      'plm:onboarded':false
    });
  }
});

chrome.action.onClicked.addListener((tab)=>{
  chrome.sidePanel.open({tabId:tab.id});
});

chrome.runtime.onStartup.addListener(()=>{
  chrome.contextMenus.create({id:'open-vault',title:'Open PipelineLM Vault',contexts:['action']});
});
chrome.contextMenus.onClicked.addListener((info)=>{
  if(info.menuItemId==='open-vault'){
    chrome.tabs.query({active:true,currentWindow:true}).then(([t])=>{
      if(t)chrome.sidePanel.open({tabId:t.id});
    });
  }
});

// Shared download helper
async function downloadArtifact(artifactId){
  const data=await chrome.storage.local.get(STORAGE_KEYS.artifacts);
  const art=(data[STORAGE_KEYS.artifacts]||[]).find(a=>a.id===artifactId);
  if(!art)throw new Error('not found');
  const type=art.type||'audio';
  const ext={audio:'mp3',video:'mp4',slide_deck:'pdf',mind_map:'json',report:'md'}[type]||'bin';
  const safe=(art.title||'untitled').replace(/[^a-z0-9]/gi,'_').slice(0,40);
  const url=art.downloadUrl||art.pageUrl||'https://notebooklm.google.com';
  const dl=await chrome.downloads.download({url,filename:`vault-storage/${type}/${safe}_${art.id.slice(0,6)}.${ext}`,saveAs:false});
  return{downloaded:true,downloadId:dl};
}

chrome.runtime.onMessage.addListener((msg,sender,sendResponse)=>{
  (async()=>{
    try{
      switch(msg.action){
        case MSG_ACTIONS.ARTIFACTS_DISCOVERED:{
          const data=await chrome.storage.local.get(STORAGE_KEYS.artifacts);
          const existing=data[STORAGE_KEYS.artifacts]||[];
          const existingIds=new Set(existing.map(a=>a.id));
          let added=0;
          for(const art of msg.artifacts){
            if(!art.id)art.id='art_'+generateId();
            art.notebookId=msg.notebookId||art.notebookId||'';
            art.notebookName=msg.notebookName||art.notebookName||'Unknown';
            art.discoveredAt=art.discoveredAt||new Date().toISOString();
            if(!existingIds.has(art.id)){existing.push(art);added++;}
          }
          existing.sort((a,b)=>new Date(b.discoveredAt)-new Date(a.discoveredAt));
          await chrome.storage.local.set({[STORAGE_KEYS.artifacts]:existing});
          const pending=existing.filter(a=>!a.localPath).length;
          chrome.action.setBadgeText({text:pending>0?String(pending):''});
          chrome.action.setBadgeBackgroundColor({color:'#3b82f6'});
          chrome.runtime.sendMessage({action:MSG_ACTIONS.VAULT_SYNCED,count:existing.length,added}).catch(()=>{});
          sendResponse({merged:true,added,total:existing.length});
          break;
        }
        case MSG_ACTIONS.ARTIFACT_DOWNLOAD:{
          const result=await downloadArtifact(msg.artifactId);
          sendResponse(result);
          break;
        }
        case MSG_ACTIONS.ARTIFACT_STORE:{
          await downloadArtifact(msg.artifactId);
          const data=await chrome.storage.local.get(STORAGE_KEYS.artifacts);
          const arts=data[STORAGE_KEYS.artifacts]||[];
          const idx=arts.findIndex(a=>a.id===msg.artifactId);
          if(idx!==-1){
            const t=arts[idx].type||'audio';
            const e={audio:'mp3',video:'mp4',slide_deck:'pdf',mind_map:'json',report:'md'}[t]||'bin';
            const s=(arts[idx].title||'untitled').replace(/[^a-z0-9]/gi,'_').slice(0,40);
            arts[idx].localPath=`vault-storage/${t}/${s}_${msg.artifactId.slice(0,6)}.${e}`;
            arts[idx].storedAt=new Date().toISOString();
            await chrome.storage.local.set({[STORAGE_KEYS.artifacts]:arts});
          }
          sendResponse({stored:true});
          break;
        }
        case MSG_ACTIONS.ARTIFACT_DELETE:{
          const data=await chrome.storage.local.get(STORAGE_KEYS.artifacts);
          const filtered=(data[STORAGE_KEYS.artifacts]||[]).filter(a=>a.id!==msg.artifactId);
          await chrome.storage.local.set({[STORAGE_KEYS.artifacts]:filtered});
          sendResponse({deleted:true});
          break;
        }
        case MSG_ACTIONS.NOTEBOOK_DETECTED:
        case 'notebooks:discovered':{
          const data=await chrome.storage.local.get(STORAGE_KEYS.notebooks);
          const nbs=data[STORAGE_KEYS.notebooks]||[];
          const nbList=msg.notebooks||[{id:msg.notebookId,title:msg.notebookName||'Untitled'}];
          for(const nb of nbList){
            const ex=nbs.find(n=>n.id===nb.id);
            if(ex){ex.title=nb.title||ex.title;ex.updatedAt=new Date().toISOString();}
            else nbs.push({id:nb.id,title:nb.title||'Untitled',updatedAt:new Date().toISOString()});
          }
          await chrome.storage.local.set({[STORAGE_KEYS.notebooks]:nbs});
          sendResponse({registered:true,notebooks:nbs.length});
          break;
        }
        case MSG_ACTIONS.SCAN_REQUEST:{
          sendResponse({ok:true});
          break;
        }
        default:sendResponse({error:'unknown action'});
      }
    }catch(e){
      console.error('[PLM SW]',e);
      sendResponse({error:e.message||'internal error'});
    }
  })();
  return true;
});