console.log('[PLM] Content script loaded');
let observer=null;

function sendMsg(msg){try{if(!chrome.runtime?.id)return Promise.resolve();return chrome.runtime.sendMessage(msg);}catch(e){return Promise.resolve();}}

function init(){
  detectPage();
  scrapeArtifacts();
  scrapeNotebooks();
  injectToolbar();
  startObserver();
  chrome.runtime.onMessage.addListener((msg,sender,sendResponse)=>{
    if(msg.action==='prefab:inject'){injectPrefab(msg.prefabId,msg.topic,msg.audience);sendResponse({injected:true});return true;}
    if(msg.action==='scan:request'){const arts=scrapeArtifacts();const nbs=scrapeNotebooks();sendResponse({scanned:true,count:arts.length,artifacts:arts,notebooks:nbs});return true;}
  });
}

// Detect what page we're on
function detectPage(){
  if(location.pathname==='/'||location.pathname==='/notebooks'){
    // Notebook list page
    console.log('[PLM] On notebook list page');
    setTimeout(()=>scrapeNotebooks(),1000);
  }else{
    // Individual notebook page
    const m=location.pathname.match(/\/notebook\/([^/]+)/);
    if(m)sendMsg({action:'notebook:detected',notebookId:m[1],notebookName:document.title.replace(' - NotebookLM','').trim()}).catch(()=>{});
  }
}

function scrapeNotebooks(){
  console.log('[PLM] Scraping notebooks...');
  const nbs=[];
  const seen=new Set();
  // Notebook cards on the home/list page
  document.querySelectorAll('a[href*="/notebook/"]').forEach(a=>{
    const m=a.href.match(/\/notebook\/([^/]+)/);if(!m)return;
    const id=m[1];
    let title='';
    // Try to find title in or near the link
    const container=a.closest('div,article,li')||a;
    const h=container.querySelector('h1,h2,h3,h4,h5,h6');
    if(h)title=h.textContent.trim();
    else{const spans=container.querySelectorAll('span,div');for(const s of spans){const t=s.textContent.trim();if(t.length>3&&t.length<100){title=t;break;}}}
    if(!title)title='Notebook '+(seen.size+1);
    if(seen.has(id))return;seen.add(id);
    nbs.push({id,title,updatedAt:new Date().toISOString()});
    console.log('[PLM] Found notebook:',id,title.substring(0,40));
  });
  if(nbs.length>0){
    sendMsg({action:'notebooks:discovered',notebooks:nbs}).catch(()=>{});
  }
  return nbs;
}

function scrapeArtifacts(){
  console.log('[PLM] Scraping artifacts...');
  const arts=[];
  const seen=new Set();
  const nbId=location.pathname.match(/\/notebook\/([^/]+)/)?.[1]||'';
  const nbName=document.title.replace(' - NotebookLM','').trim()||'Unknown';

  // Strategy 1: Media elements (audio/video)
  document.querySelectorAll('audio, video').forEach((media,i)=>{
    const src=media.src||media.querySelector('source')?.src||'';
    const tag=media.tagName.toLowerCase();
    let title='';
    let container=media;
    for(let j=0;j<8&&container;j++){
      container=container.parentElement;
      if(!container)break;
      const rect=container.getBoundingClientRect();
      if(rect.width>180&&rect.height>60){
        const txt=container.textContent.trim();
        const lines=txt.split('\n').map(l=>l.trim()).filter(l=>l.length>3&&l.length<120);
        for(const line of lines){
          if(!/^\d{1,2}:\d{2}/.test(line)&&!/^\d+\.?\d*\s*(MB|KB)/i.test(line)){title=line;break;}
        }
        if(title)break;
      }
    }
    if(!title)title=(document.title||'Media').replace(' - NotebookLM','')+' ('+tag+' '+(i+1)+')';
    if(seen.has(title))return;
    seen.add(title);
    const type=tag==='video'?'video':'audio';
    // Check if this media is currently playing/generating
    let status='completed';
    if(container&&container.textContent.toLowerCase().includes('generating'))status='generating';
    if(container&&container.textContent.toLowerCase().includes('loading'))status='processing';
    arts.push({id:'art_'+hash(title+src),title,type,status,downloadUrl:src,pageUrl:location.href,notebookId:nbId,notebookName:nbName,localPath:'',discoveredAt:new Date().toISOString(),createdAt:new Date().toISOString()});
    console.log('[PLM] Found media:',type,status,title.substring(0,50));
  });

  // Strategy 2: Buttons/links with artifact type keywords
  document.querySelectorAll('button,a,[role="button"]').forEach(el=>{
    const txt=el.textContent.trim();
    if(txt.length<5||txt.length>100)return;
    const lower=txt.toLowerCase();
    let type=null;
    if(lower.includes('audio overview')||lower.includes('podcast')||lower.includes('deep-dive')||lower.includes('deep dive')||lower.includes('tutorial'))type='audio';
    else if(lower.includes('video overview')||lower.includes('explainer'))type='video';
    else if(lower.includes('slide deck')||lower.includes('presentation'))type='slide_deck';
    else if(lower.includes('mind map')||lower.includes('mindmap'))type='mind_map';
    else if(lower.includes('report')||lower.includes('briefing'))type='report';
    if(!type||seen.has(txt))return;
    seen.add(txt);
    let status='completed';
    if(el.disabled||el.getAttribute('aria-disabled')==='true')status='generating';
    const parent=el.closest('div');
    if(parent&&parent.textContent.toLowerCase().includes('generating'))status='generating';
    arts.push({id:'art_'+hash(txt),title:txt,type,status,downloadUrl:'',pageUrl:location.href,notebookId:nbId,notebookName:nbName,localPath:'',discoveredAt:new Date().toISOString(),createdAt:new Date().toISOString()});
    console.log('[PLM] Found button:',type,status,txt.substring(0,50));
  });

  if(arts.length>0){
    sendMsg({action:'artifacts:discovered',artifacts:arts,notebookId:nbId,notebookName:nbName}).catch(()=>{});
  }
  console.log('[PLM] Total artifacts:',arts.length);
  return arts;
}

function hash(str){let h=0;for(let i=0;i<str.length;i++)h=((h<<5)-h+str.charCodeAt(i))|0;return Math.abs(h).toString(36).slice(0,8);}

function startObserver(){
  if(observer)observer.disconnect();
  observer=new MutationObserver(()=>{clearTimeout(window._plmTimer);window._plmTimer=setTimeout(()=>{scrapeArtifacts();scrapeNotebooks();},1200);});
  observer.observe(document.body,{childList:true,subtree:true});
}

function injectToolbar(){
  if(document.getElementById('plm-tb'))return;
  const div=document.createElement('div');div.id='plm-tb';
  div.innerHTML='<style>#plm-tb{position:fixed;top:72px;right:16px;z-index:2147483646;font-family:Inter,system-ui,sans-serif;font-size:12px}#plm-tb *{box-sizing:border-box}.plm-pill{width:36px;height:36px;border-radius:18px;background:#0f172a;border:1px solid rgba(255,255,255,0.1);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 24px rgba(0,0,0,0.4);font-size:16px;transition:all .2s}.plm-pill:hover{transform:scale(1.1);border-color:#3b82f6}.plm-box{width:240px;background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;box-shadow:0 8px 32px rgba(0,0,0,0.5);display:none}.plm-box input{width:100%;padding:6px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:#1e293b;color:#e2e8f0;font-size:11px;margin-bottom:6px;outline:none;font-family:inherit}.plm-box input:focus{border-color:#3b82f6}.plm-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-top:6px}.plm-pf{padding:8px 2px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.03);color:#94a3b8;cursor:pointer;text-align:center;font-size:10px;transition:all .15s}.plm-pf:hover{background:#3b82f6;color:#fff;border-color:#3b82f6}.plm-pf span{display:block;font-size:18px;margin-bottom:2px}</style><div class="plm-pill" id="plm-pill">&#9889;</div><div class="plm-box" id="plm-box"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b style="font-size:12px;color:#e2e8f0">&#9889; Quick Launch</b><button style="background:rgba(255,255,255,0.05);border:none;color:#94a3b8;border-radius:4px;cursor:pointer;width:20px;height:20px;font-size:12px">&times;</button></div><input id="plm-topic" placeholder="Topic" /><input id="plm-aud" placeholder="Audience" /><div class="plm-grid"><div class="plm-pf" data-id="deep-dive"><span>&#127909;</span>Deep-Dive</div><div class="plm-pf" data-id="exec-brief"><span>&#128202;</span>Brief</div><div class="plm-pf" data-id="explainer"><span>&#127916;</span>Video</div><div class="plm-pf" data-id="investor-deck"><span>&#128193;</span>Slides</div><div class="plm-pf" data-id="mind-map"><span>&#129504;</span>Map</div><div class="plm-pf" data-id="tutorial"><span>&#127891;</span>Tutorial</div></div></div>';
  document.body.appendChild(div);
  const pill=div.querySelector('#plm-pill'),box=div.querySelector('#plm-box'),close=box.querySelector('button');
  pill.addEventListener('click',()=>{pill.style.display='none';box.style.display='block';});
  close.addEventListener('click',()=>{box.style.display='none';pill.style.display='flex';});
  box.querySelectorAll('.plm-pf').forEach(btn=>{btn.addEventListener('click',()=>{const topic=box.querySelector('#plm-topic').value.trim();const aud=box.querySelector('#plm-aud').value.trim();if(!topic){box.querySelector('#plm-topic').focus();return;}if(!aud){box.querySelector('#plm-aud').focus();return;}injectPrefab(btn.dataset.id,topic,aud);});});
}

const TEMPLATES={'deep-dive':'Create a deep-dive podcast about {topic} for {audience}. Two hosts, cited sources, 15-20 min.','exec-brief':'Generate an executive briefing about {topic} for {audience}. Summary, findings, implications, actions.','explainer':'Write an explainer video script about {topic} for {audience}. Hook, problem, solution, CTA.','investor-deck':'Create an investor slide deck about {topic} for {audience}. Problem, market, solution, traction, ask.','mind-map':'Generate a hierarchical mind map about {topic} for {audience}. Central concept, 5-7 branches.','tutorial':'Create a step-by-step tutorial about {topic} for {audience}. 5-8 steps, prerequisites, pitfalls, recap.'};

function injectPrefab(id,topic,audience){
  const tpl=TEMPLATES[id];if(!tpl)return;
  const prompt=tpl.replace(/{topic}/g,topic).replace(/{audience}/g,audience).slice(0,10000);
  const ta=document.querySelector('textarea');
  if(ta){ta.value=prompt;ta.dispatchEvent(new Event('input',{bubbles:true}));ta.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(()=>{const btns=[...document.querySelectorAll('button')].filter(b=>/generate/i.test(b.textContent));if(btns[0])btns[0].click();},200);}
  else{navigator.clipboard.writeText(prompt);}
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();