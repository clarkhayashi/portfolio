// Pure pieces of the hidden ?tune panel (public/tune.js). No DOM here, so node tests can import it.
// Values: anim (intro animation speed), bounce (spring on presses, entrances and anim moves),
// write and vote (timer multipliers for rooms created in tune mode) and volume (master sound level).
export const TUNE_KEY='oops-tune';
export const FIELDS={
 anim:{label:'Animation speed',min:.5,max:2,step:.05,def:1,key:'A'},
 bounce:{label:'Bounce',min:0,max:1,step:.05,def:0,key:'B'},
 write:{label:'Write timers',min:.5,max:2,step:.05,def:1},
 vote:{label:'Vote timers',min:.5,max:2,step:.05,def:1},
 volume:{label:'Volume',min:0,max:1,step:.05,def:1,key:'V'},
};
export const DEFAULTS=Object.fromEntries(Object.entries(FIELDS).map(([k,f])=>[k,f.def]));
const snap=(k,v)=>{const f=FIELDS[k];const n=Math.round(Math.round(v/f.step)*f.step*100)/100;return Math.min(f.max,Math.max(f.min,n));};
// Merge a patch (object or JSON text) over a base. Unknown keys and non-numbers are dropped, numbers
// are clamped to range and snapped to the step. Bad JSON returns the base unchanged plus an error.
export function mergeTune(base=DEFAULTS,patch={}){
 let p=patch,error=null;
 if(typeof p==='string'){try{p=JSON.parse(p);}catch{return {values:{...DEFAULTS,...base},error:'That is not valid JSON.'};}}
 if(!p||typeof p!=='object'||Array.isArray(p))return {values:{...DEFAULTS,...base},error:'Paste a JSON object.'};
 const values={...DEFAULTS};
 for(const k of Object.keys(FIELDS)){const b=base?.[k];if(typeof b==='number'&&Number.isFinite(b))values[k]=snap(k,b);}
 let used=0;
 for(const k of Object.keys(FIELDS)){const v=p[k];if(typeof v==='number'&&Number.isFinite(v)){values[k]=snap(k,v);used++;}}
 if(!used&&Object.keys(p).length)error='No tune values found.';
 return {values,error};
}
export const parseTune=text=>mergeTune(DEFAULTS,text??'{}').values;
export const isDefault=v=>Object.keys(FIELDS).every(k=>v?.[k]===DEFAULTS[k]);
export const tuneJson=v=>JSON.stringify(Object.fromEntries(Object.keys(FIELDS).map(k=>[k,v[k]])),null,1);
// One scroll notch (deltaY about 100) moves one step; scrolling up raises the value.
export function nudge(v,k,deltaY){if(!FIELDS[k]||!deltaY)return v;const steps=Math.max(-5,Math.min(5,Math.round(-deltaY/100)||(deltaY<0?1:-1)));return {...v,[k]:snap(k,v[k]+steps*FIELDS[k].step)};}
// Timer multipliers sent with "create" (tune.mjs validates and clamps them again on the server).
export const timerScaleOf=v=>v.write===1&&v.vote===1?null:{write:v.write,vote:v.vote};
// Spring easing as a CSS linear() curve. bounce 0 is null: keep the stock easing. Higher bounce means
// lower damping, so the curve overshoots 1 and settles. 24 samples is smooth enough at UI durations.
export function springEasing(bounce){
 if(!(bounce>0))return null;
 const zeta=Math.max(.12,1-bounce*.85),w=10,wd=w*Math.sqrt(1-zeta*zeta),N=24;
 const x=t=>1-Math.exp(-zeta*w*t)*(Math.cos(wd*t)+zeta*w/wd*Math.sin(wd*t));
 const pts=[];for(let i=0;i<=N;i++){const t=i/N;pts.push(i===N?1:Math.round(x(t)*1000)/1000);}
 return `linear(${pts.join(', ')})`;
}
// Press curve: a cubic-bezier whose second handle rises past 1 as bounce grows.
export const pressEasing=b=>b>0?`cubic-bezier(.34,${(1+b*.9).toFixed(2)},.64,1)`:null;
// CSS custom properties for the page. null means "remove it" so stock styles apply.
export function cssVars(v){
 return {'--anim-speed':v.anim===1?null:String(v.anim),'--spring':springEasing(v.bounce),'--ease-press':pressEasing(v.bounce)};
}
