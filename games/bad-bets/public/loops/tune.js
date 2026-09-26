// Design values in one place. Defaults ship to everyone; with ?dials=1 (Clark's tuning mode) DialKit opens a
// panel to adjust them live. Use the panel's Copy button to send the numbers back so they become the defaults.
export const TUNE={
 layout:{radius:18,cardPadding:16,gap:10,accent:'#e2574c',ink:'#253345',paper:'#f8f7f2',textSize:16},
 pong:{zoom:1.3,perspective:0.2,cupHeight:1.25,ballSize:0.032,flightMs:760,arc:0.5,table:'#226b58',cup:'#e2574c'}
};
const root=document.documentElement;
function applyLayout(v){
 root.style.setProperty('--radius',v.radius+'px');root.style.setProperty('--pad',v.cardPadding+'px');root.style.setProperty('--gap',v.gap+'px');
 root.style.setProperty('--accent',v.accent);root.style.setProperty('--ink',v.ink);root.style.setProperty('--paper',v.paper);
 root.style.fontSize=v.textSize+'px';
}
applyLayout(TUNE.layout);

// Tuning mode survives navigation within the tab.
{const q=new URLSearchParams(location.search);if(q.get('dials')==='1'){try{sessionStorage.setItem('loops.dials','1');}catch{}}}
const on=(()=>{try{return sessionStorage.getItem('loops.dials')==='1';}catch{return false;}})();
if(on){
 const css=document.createElement('link');css.rel='stylesheet';css.href='/loops/vendor/dialkit/styles.css';document.head.append(css);
 const js=document.createElement('script');js.src='/loops/vendor/dialkit/browser.global.js';
 js.onload=()=>{
  const DK=window.DialKit;DK.createDialRoot({position:'bottom-left'});
  const L=TUNE.layout,G=TUNE.pong;
  DK.createDialKit('Layout',{radius:[L.radius,0,32],cardPadding:[L.cardPadding,8,28],gap:[L.gap,4,24],textSize:[L.textSize,14,19],accent:L.accent,ink:L.ink,paper:L.paper})
   .subscribe(v=>{Object.assign(L,v);applyLayout(L);});
  DK.createDialKit('Pong',{zoom:[G.zoom,0.8,1.3,0.01],perspective:[G.perspective,0,0.6,0.01],cupHeight:[G.cupHeight,0.8,2,0.05],ballSize:[G.ballSize,0.02,0.05,0.001],flightMs:[G.flightMs,300,1400,10],arc:[G.arc,0.2,0.9,0.01],table:G.table,cup:G.cup})
   .subscribe(v=>{Object.assign(G,v);dispatchEvent(new Event('loops-tune'));});
 };
 document.head.append(js);
}
