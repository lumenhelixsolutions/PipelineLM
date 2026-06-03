const T=5;let c=0;
const slides=document.querySelectorAll('.slide'),bar=document.getElementById('bar'),prev=document.getElementById('prev'),next=document.getElementById('next'),dots=document.getElementById('dots');
for(let i=0;i<T;i++){const d=document.createElement('div');d.className='dot'+(i===0?' a':'');d.addEventListener('click',()=>go(i));dots.appendChild(d);}
function go(i){c=Math.max(0,Math.min(T-1,i));slides.forEach((s,j)=>s.style.display=j===c?'flex':'none');bar.style.width=((c+1)/T*100)+'%';prev.disabled=c===0;if(c===T-1){next.style.display='none';}else{next.style.display='';}dots.querySelectorAll('.dot').forEach((d,j)=>d.classList.toggle('a',j===c));}
prev.addEventListener('click',()=>go(c-1));next.addEventListener('click',()=>go(c+1));
document.getElementById('btn-start').addEventListener('click',async()=>{await chrome.storage.local.set({'plm:onboarded':true});window.location.href='sidepanel.html';});
document.getElementById('btn-act').addEventListener('click',async()=>{const k=document.getElementById('lic').value.trim();if(k&&!k.startsWith('PLM-')){alert('Key must start with PLM-');return;}const d=await chrome.storage.local.get('plm:settings');const s=d['plm:settings']||{};if(k)s.licenseKey=k;await chrome.storage.local.set({'plm:settings':s});go(4);});
document.getElementById('lic').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('btn-act').click();});
go(0);