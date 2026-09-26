// Hidden tune panel: a small, vanilla take on DialKit. Loaded only by tune-boot.js (?tune, five quick
// logo taps, or tuned values saved on this device). Floating, draggable, collapsible; sliders for intro
// animation speed, bounce, timer multipliers and volume; sound audition; replay, reset, copy and paste JSON.
// Hold A, B or V and scroll to nudge a value (desktop). Values live in localStorage under oops-tune.
import {FIELDS,DEFAULTS,TUNE_KEY,mergeTune,isDefault,tuneJson,nudge,cssVars,timerScaleOf} from './tune-core.js';
import {SOUNDS,setVolume,unlockAudio,preview} from './sounds.js';

let values={...DEFAULTS},panel=null,badge=null,started=false,held=null,surface='phone';
const load=()=>{try{return mergeTune(DEFAULTS,localStorage.getItem(TUNE_KEY)||'{}').values;}catch{return {...DEFAULTS};}};
const save=()=>{try{isDefault(values)?localStorage.removeItem(TUNE_KEY):localStorage.setItem(TUNE_KEY,tuneJson(values));}catch{}};
const fmt=(k,v)=>k==='bounce'||k==='volume'?`${Math.round(v*100)}%`:`${v.toFixed(2)}x`;

export function createExtras(){const t=timerScaleOf(values);return t?{timerScale:t}:{};}

function apply(){
 const root=document.documentElement;
 for(const [k,v] of Object.entries(cssVars(values)))v===null?root.style.removeProperty(k):root.style.setProperty(k,v);
 setVolume(values.volume);
 syncBadge();
 if(panel)for(const k of Object.keys(FIELDS)){const i=panel.querySelector(`#tune-${k}`),o=panel.querySelector(`[data-out=${k}]`);if(i&&Number(i.value)!==values[k])i.value=values[k];if(o)o.textContent=fmt(k,values[k]);}
}
function set(next){values=next;save();apply();}

// ---------- styles ----------
const CSS=`
#tune-panel{position:fixed;right:16px;bottom:16px;z-index:9000;width:min(320px,calc(100vw - 32px));max-height:min(78vh,640px);display:flex;flex-direction:column;background:#F8F7F3;color:#1c2433;border:2px solid #1c2433;border-radius:18px;box-shadow:4px 4px 0 #1c2433;font:600 15px/1.35 'Nunito',ui-rounded,system-ui,sans-serif;text-align:left;letter-spacing:0}
#tune-panel *{box-sizing:border-box}
#tune-panel .tune-head{display:flex;align-items:center;gap:6px;padding:6px 6px 6px 14px;border-bottom:2px solid #1c2433;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}
#tune-panel.dragging .tune-head{cursor:grabbing}
#tune-panel .tune-head h2{flex:1;margin:0;font:800 19px/1 'Baloo 2','Nunito',sans-serif;color:#1c2433;letter-spacing:.02em}
#tune-panel .tune-head h2 small{font:700 12px/1 'Nunito',sans-serif;color:#4b5563;margin-left:6px;letter-spacing:0}
#tune-panel button{min-height:44px;min-width:44px;margin:0;padding:8px 12px;border-radius:14px;font:800 14px/1.1 'Nunito',ui-rounded,sans-serif;cursor:pointer;transform:none;box-shadow:none;letter-spacing:0;text-transform:none}
#tune-panel .tune-primary{background:#087F98;color:#fff;border:2px solid #087F98}
#tune-panel .tune-secondary{background:#fff;color:#065d70;border:2px solid #087F98}
#tune-panel .tune-icon{background:transparent;color:#1c2433;border:2px solid transparent;padding:0;font-size:20px}
#tune-panel button:focus-visible,#tune-panel input:focus-visible,#tune-panel textarea:focus-visible{outline:3px solid #087F98;outline-offset:2px}
#tune-panel .tune-body{overflow:auto;padding:10px 14px 14px;overscroll-behavior:contain}
#tune-panel.collapsed .tune-body{display:none}
#tune-panel.collapsed{max-height:none}
#tune-panel .tune-sec{margin:0 0 12px;padding:0;border:0}
#tune-panel .tune-sec>h3{margin:0 0 6px;font:800 12px/1.2 'Nunito',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#4b5563}
#tune-panel .tune-row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:2px 8px;margin:0 0 6px}
#tune-panel .tune-row label{display:flex;align-items:center;justify-content:flex-start;gap:6px;margin:0;font-size:15px;font-weight:800;color:#1c2433}
#tune-panel .tune-row output{font:800 14px/1 'Nunito',sans-serif;color:#065d70;font-variant-numeric:tabular-nums}
#tune-panel .tune-row input[type=range]{grid-column:1/-1;width:100%;height:28px;min-height:0;margin:0;padding:0;border:0;border-radius:0;accent-color:#087F98;background:transparent}
#tune-panel .tune-key{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:20px;padding:0 5px;border:1.5px solid #1c2433;border-bottom-width:3px;border-radius:6px;background:#fff;color:#1c2433;font:800 11px/1 'Nunito',sans-serif}
#tune-panel .tune-key.on{background:#F4CD72}
#tune-panel .tune-note{margin:2px 0 8px;font-size:13px;color:#4b5563;font-weight:600}
#tune-panel .tune-sounds{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
#tune-panel .tune-sounds button{padding:6px 4px;font-size:13px}
#tune-panel .tune-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#tune-panel .tune-actions .wide{grid-column:1/-1}
#tune-panel .tune-paste{display:none;margin-top:8px}
#tune-panel .tune-paste.open{display:block}
#tune-panel .tune-paste textarea{width:100%;min-height:96px;padding:8px;border:2px solid #1c2433;border-radius:12px;background:#fff;color:#1c2433;font:600 13px/1.3 ui-monospace,Menlo,monospace;resize:vertical}
#tune-panel .tune-paste label{display:block;margin:0 0 4px}
#tune-panel .tune-paste .tune-actions{margin-top:6px}
#tune-panel .tune-status{min-height:18px;margin:8px 0 0;font-size:13px;color:#1c2433;font-weight:700}
#tune-badge{position:fixed;z-index:8999;left:12px;bottom:12px;min-height:44px;min-width:44px;padding:0 14px;border:2px solid #1c2433;border-radius:999px;background:#F4CD72;color:#1c2433;font:800 15px/1 'Baloo 2','Nunito',sans-serif;letter-spacing:.08em;box-shadow:2px 2px 0 #1c2433;cursor:pointer}
#tune-badge[hidden],#tune-panel[hidden]{display:none}
#tune-badge.tv{bottom:auto;top:12px}
@media(prefers-reduced-motion:no-preference){#tune-panel{animation:tune-in .32s var(--spring,cubic-bezier(.2,.8,.2,1)) both}}
@keyframes tune-in{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}
`;
function addCss(){if(document.querySelector('style[data-tune]'))return;const el=document.createElement('style');el.dataset.tune='';el.textContent=CSS;document.head.append(el);}

// ---------- panel ----------
const slider=k=>{const f=FIELDS[k];return `<div class="tune-row"><label for="tune-${k}">${f.label}${f.key?`<span class="tune-key" data-key="${f.key.toLowerCase()}" title="Hold ${f.key} and scroll">${f.key}</span>`:''}</label><output data-out="${k}" for="tune-${k}">${fmt(k,values[k])}</output><input type="range" id="tune-${k}" min="${f.min}" max="${f.max}" step="${f.step}" value="${values[k]}"></div>`;};
function build(){
 panel=document.createElement('section');panel.id='tune-panel';panel.className='tune-panel';panel.setAttribute('aria-label','Tune panel');
 panel.innerHTML=`<div class="tune-head"><h2>Tune<small>${surface==='tv'?'TV':'phone'}</small></h2><button type="button" class="tune-icon" data-t="collapse" aria-expanded="true" aria-label="Collapse the tune panel">▾</button><button type="button" class="tune-icon" data-t="close" aria-label="Close the tune panel">✕</button></div>
 <div class="tune-body">
  <div class="tune-sec"><h3>Motion</h3>${slider('anim')}${slider('bounce')}</div>
  <div class="tune-sec"><h3>Timers</h3><p class="tune-note">Only for rooms you create while this panel is on.</p>${slider('write')}${slider('vote')}</div>
  <div class="tune-sec"><h3>Sound</h3>${slider('volume')}<div class="tune-sounds">${SOUNDS.map(n=>`<button type="button" class="tune-secondary" data-sound="${n}">${n}</button>`).join('')}</div><button type="button" class="tune-primary" data-t="all" style="width:100%;margin-top:6px">Play all sounds</button></div>
  <div class="tune-sec"><h3>Actions</h3><div class="tune-actions"><button type="button" class="tune-primary wide" data-t="replay">Replay intro</button><button type="button" class="tune-secondary" data-t="copy">Copy JSON</button><button type="button" class="tune-secondary" data-t="paste">Paste JSON</button><button type="button" class="tune-secondary wide" data-t="reset">Reset to defaults</button></div>
   <div class="tune-paste"><label for="tune-json" class="tune-note">Paste tune JSON</label><textarea id="tune-json" spellcheck="false"></textarea><div class="tune-actions"><button type="button" class="tune-primary" data-t="apply">Apply</button><button type="button" class="tune-secondary" data-t="cancel">Cancel</button></div></div>
   <p class="tune-status" role="status" aria-live="polite"></p></div>
 </div>`;
 document.body.append(panel);
 panel.addEventListener('input',e=>{const k=e.target.id?.replace('tune-','');if(FIELDS[k])set({...values,[k]:Number(e.target.value)});});
 panel.addEventListener('click',onClick);
 drag(panel.querySelector('.tune-head'));
}
const status=t=>{const s=panel?.querySelector('.tune-status');if(s)s.textContent=t;};
async function onClick(e){
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.sound){await unlockAudio();preview(b.dataset.sound);return;}
 const t=b.dataset.t;
 if(t==='collapse'){const c=panel.classList.toggle('collapsed');b.setAttribute('aria-expanded',String(!c));b.setAttribute('aria-label',c?'Expand the tune panel':'Collapse the tune panel');b.textContent=c?'▸':'▾';}
 else if(t==='close'){closePanel();}
 else if(t==='all'){await unlockAudio();SOUNDS.forEach((n,i)=>setTimeout(()=>preview(n),i*750));status(`Playing ${SOUNDS.length} sounds`);}
 else if(t==='replay'){status(replay()?'Intro restarted':'No intro on this screen');}
 else if(t==='reset'){set({...DEFAULTS});status('Back to defaults');}
 else if(t==='copy'){const json=tuneJson(values);try{await navigator.clipboard.writeText(json);status('Copied');}catch{openPaste(json);status('Copy it from the box');}}
 else if(t==='paste'){let text='';try{text=await navigator.clipboard.readText();}catch{}openPaste(text);}
 else if(t==='apply'){const r=mergeTune(values,panel.querySelector('#tune-json').value);if(r.error){status(r.error);return;}set(r.values);panel.querySelector('.tune-paste').classList.remove('open');status('Applied');}
 else if(t==='cancel'){panel.querySelector('.tune-paste').classList.remove('open');}
}
function openPaste(text){const box=panel.querySelector('.tune-paste');box.classList.add('open');const ta=box.querySelector('textarea');ta.value=text||'';ta.focus();ta.select();}
// Re-mount every intro loop on screen so it plays from the first frame.
function replay(){
 const list=[...document.querySelectorAll('.ga,.ha')];list.forEach(el=>el.replaceWith(el.cloneNode(true)));
 const d=document.querySelector('#display');if(d){d.classList.remove('enter');void d.offsetWidth;d.classList.add('enter');}
 return list.length>0;
}
function drag(handle){
 let s=null;
 handle.addEventListener('pointerdown',e=>{if(e.target.closest('button')||e.button>0)return;const r=panel.getBoundingClientRect();s={x:e.clientX-r.left,y:e.clientY-r.top,id:e.pointerId};panel.classList.add('dragging');try{handle.setPointerCapture(e.pointerId);}catch{}});
 handle.addEventListener('pointermove',e=>{if(!s||e.pointerId!==s.id)return;const w=panel.offsetWidth,h=panel.offsetHeight;const x=Math.min(innerWidth-w-4,Math.max(4,e.clientX-s.x)),y=Math.min(innerHeight-Math.min(h,60),Math.max(4,e.clientY-s.y));Object.assign(panel.style,{left:`${x}px`,top:`${y}px`,right:'auto',bottom:'auto'});});
 const end=()=>{s=null;panel.classList.remove('dragging');};handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
}
function openPanel(){addCss();if(!panel)build();panel.hidden=false;apply();}
function closePanel(){if(panel)panel.hidden=true;syncBadge();}

// ---------- badge: shows whenever tuned values are active ----------
function syncBadge(){
 const on=!isDefault(values)&&!(panel&&!panel.hidden);
 if(!badge&&on){addCss();badge=document.createElement('button');badge.id='tune-badge';badge.type='button';badge.className=`tune-badge${surface==='tv'?' tv':''}`;badge.textContent='TUNE';badge.setAttribute('aria-label','Tuned values are on. Open the tune panel.');badge.onclick=openPanel;document.body.append(badge);}
 if(badge)badge.hidden=!on;
}

// ---------- keyboard nudges: hold A, B or V and scroll ----------
const KEYS=Object.fromEntries(Object.entries(FIELDS).filter(([,f])=>f.key).map(([k,f])=>[f.key.toLowerCase(),k]));
const typing=()=>{const t=document.activeElement;return !!t&&(t.tagName==='TEXTAREA'||t.isContentEditable||(t.tagName==='INPUT'&&!['range','button','checkbox','radio'].includes(t.type)));};
function pills(){panel?.querySelectorAll('.tune-key').forEach(p=>p.classList.toggle('on',p.dataset.key===held));}
function keys(){
 addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(!KEYS[k]||e.metaKey||e.ctrlKey||e.altKey||typing())return;held=k;pills();});
 addEventListener('keyup',e=>{if(e.key.toLowerCase()===held){held=null;pills();}});
 addEventListener('blur',()=>{held=null;pills();});
 addEventListener('wheel',e=>{if(!held||typing())return;e.preventDefault();set(nudge(values,KEYS[held],e.deltaY));},{passive:false});
}

export function startTune({surface:s='phone',open=false}={}){
 surface=s==='tv'?'tv':'phone';
 if(!started){started=true;values=load();keys();apply();}
 if(open)openPanel();else syncBadge();
}
