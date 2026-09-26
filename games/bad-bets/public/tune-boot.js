// The only always-loaded piece of the hidden tune panel: a few lines that decide whether to fetch
// tune.js at all. It loads for ?tune, for five quick taps on the logo, or when tuned values are saved
// on this device (so a tuned build always shows its TUNE badge). Nobody else downloads anything.
const KEY='oops-tune';
let mod=null,loading=null;
export function tuneWanted(){
 if(new URLSearchParams(location.search).has('tune'))return true;
 try{return !!localStorage.getItem(KEY);}catch{return false;}
}
export function loadTune(opts){
 loading||=import('./tune.js').then(m=>{mod=m;return m;});
 return loading.then(m=>{m.startTune(opts);return m;}).catch(()=>null);
}
// Extra fields for "create": timer multipliers, only while tune mode is loaded and tuned.
export const tuneCreateExtras=()=>mod?.createExtras?.()||{};
// Five taps on the logo inside two seconds opens the panel. A single tap on a logo link still follows
// the link, a moment later, once it is clear no tap sequence is under way.
export function watchLogoTaps(selector,opts){
 const sel=typeof selector==='string'?selector:null,el=sel?null:selector;
 let taps=[],timer=0;
 document.addEventListener('click',e=>{
  const hit=sel?e.target.closest?.(sel):el&&el.contains(e.target)?el:null;if(!hit)return;
  const now=Date.now();taps=[...taps.filter(t=>now-t<2000),now];
  const link=hit.closest('a[href]');
  if(taps.length>=5){taps=[];clearTimeout(timer);e.preventDefault();loadTune({...opts,open:true});return;}
  if(link&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey){e.preventDefault();clearTimeout(timer);const href=link.href;timer=setTimeout(()=>{location.href=href;},450);}
 });
}
