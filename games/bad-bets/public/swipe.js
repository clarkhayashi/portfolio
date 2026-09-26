// Swipe to pick: a card you drag LEFT for option A or RIGHT for option B (Herd vote, One More Round pick).
// The tap buttons under it stay the default and accessible path; this is an enhancement. Arrow keys work
// too. Pointer Events only (touch, pen and mouse), touch-action: pan-y keeps vertical scrolling.
// The pure decision helper is importable in node for tests.

// ---------- pure ----------
export const SWIPE={commit:.3,flick:.55,flickMin:28,hint:.3};
// dx: horizontal drag in px (negative = left). vx: release velocity in px/ms. width: card width in px.
// Commit past 30% of the width, or on a fast flick in the direction of the drag. Otherwise spring back.
export function swipeDecision(dx,vx,width){
 if(!Number.isFinite(dx)||!(width>0))return null;
 const v=Number.isFinite(vx)?vx:0;
 if(Math.abs(dx)>=width*SWIPE.commit)return dx<0?'a':'b';
 if(Math.abs(v)>=SWIPE.flick&&Math.abs(dx)>=SWIPE.flickMin&&Math.sign(v)===Math.sign(dx))return dx<0?'a':'b';
 return null;
}
// Which hint shows mid-drag (same threshold as a commit, so the hint is a promise).
export const swipeHint=(dx,width)=>width>0&&Math.abs(dx)>=width*SWIPE.hint?(dx<0?'a':'b'):null;
// Card transform for a drag offset: follows the finger, tilts up to about 12 degrees.
export const swipeTransform=(dx,width)=>`translateX(${Math.round(dx)}px) rotate(${(width>0?Math.max(-12,Math.min(12,dx/width*18)):0).toFixed(2)}deg)`;

// ---------- browser ----------
const hasWindow=typeof window!=='undefined';
const reduced=()=>hasWindow&&!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let busy=false,idle=null,seen='';
export const swipeBusy=()=>busy;
export function onSwipeIdle(fn){idle=fn;}
function settle(){busy=false;try{idle?.();}catch{}}
// The card HTML. side: {label, text, tag?}. key: marks a new card, which gets the entrance animation once.
export function swipeCard({a,b,actionA,actionB,key,label='Swipe or tap'},esc){
 const side=(k,o)=>`<div class="swipe-side swipe-${k}"><span class="swipe-tag">${k.toUpperCase()}</span>${o.tag?`<span class="swipe-mode">${esc(o.tag)}</span>`:''}<span class="swipe-text">${esc(o.text)}</span></div>`;
 const fresh=key!==seen;seen=key;
 return `<div class="swipe-wrap"><p class="micro swipe-label" aria-hidden="true"><span class="swipe-arrow">←</span> ${esc(label)} <span class="swipe-arrow">→</span></p><div class="swipe-card${fresh&&!reduced()?' enter':''}" data-a="${esc(actionA)}" data-b="${esc(actionB)}" aria-hidden="true">${side('a',a)}${side('b',b)}<span class="swipe-stamp swipe-stamp-a">A · ${esc(a.text)}</span><span class="swipe-stamp swipe-stamp-b">B · ${esc(b.text)}</span></div></div>`;
}
// Wire one card. onCommit(side) runs after the fly-off (or at once with reduced motion).
export function mountSwipe(card,{onCommit}){
 if(!card||card.dataset.swipeReady)return;card.dataset.swipeReady='1';card.addEventListener('animationend',()=>card.classList.remove('enter'),{once:true});
 let start=null,dx=0,last=null,v=0,axis=null,done=false;
 const width=()=>card.getBoundingClientRect().width||1;
 const paint=()=>{card.style.transform=swipeTransform(dx,width());const h=swipeHint(dx,width());card.classList.toggle('hint-a',h==='a');card.classList.toggle('hint-b',h==='b');};
 const commit=side=>{
  done=true;busy=true;card.classList.add('committed',`hint-${side}`);
  const go=()=>{settle();onCommit(side);};
  if(reduced()){go();return;}
  const w=width(),out=(side==='a'?-1:1)*(window.innerWidth||w*2)*1.1;
  card.style.transition='transform .28s cubic-bezier(.3,.6,.4,1), opacity .28s';card.style.transform=swipeTransform(out,w);card.style.opacity='0';
  setTimeout(go,260);
 };
 const back=()=>{dx=0;card.style.transition='transform .42s var(--spring, cubic-bezier(.3,1.35,.5,1))';paint();card.classList.remove('dragging');setTimeout(()=>{if(!done)card.style.transition='';},450);settle();};
 card.addEventListener('pointerdown',e=>{if(done||e.button>0)return;card.classList.remove('enter');start={x:e.clientX,y:e.clientY,id:e.pointerId};last={x:e.clientX,t:e.timeStamp};dx=0;v=0;axis=null;card.style.transition='';});
 card.addEventListener('pointermove',e=>{
  if(!start||e.pointerId!==start.id||done)return;
  const mx=e.clientX-start.x,my=e.clientY-start.y;
  if(!axis){if(Math.abs(mx)<6&&Math.abs(my)<6)return;axis=Math.abs(mx)>Math.abs(my)?'x':'y';if(axis==='y'){start=null;return;}busy=true;card.classList.add('dragging');try{card.setPointerCapture(e.pointerId);}catch{}}
  const dt=Math.max(1,e.timeStamp-last.t);v=.7*((e.clientX-last.x)/dt)+.3*v;last={x:e.clientX,t:e.timeStamp};dx=mx;paint();
 });
 const end=e=>{if(!start||e.pointerId!==start.id)return;start=null;if(axis!=='x'||done)return;const side=e.type==='pointercancel'?null:swipeDecision(dx,v,width());card.classList.remove('dragging');side?commit(side):back();};
 card.addEventListener('pointerup',end);card.addEventListener('pointercancel',end);
 card._swipeCommit=side=>{if(!done)commit(side);};
}
// Arrow keys: Left picks A, Right picks B, while a swipe card is on screen and no text field is focused.
if(hasWindow)document.addEventListener('keydown',e=>{
 if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight'||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;
 const t=document.activeElement;if(t&&(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable))return;
 if(document.querySelector('dialog[open]'))return;
 const card=document.querySelector('.swipe-card[data-swipe-ready]');if(!card?._swipeCommit)return;
 e.preventDefault();card._swipeCommit(e.key==='ArrowLeft'?'a':'b');
});
