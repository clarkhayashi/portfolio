// Home Run Derby rules, shared by the server (which scores every swing) and the browser (instant feedback).
// A pitch takes `ms` to reach the plate after release. A swing is the tap time after release (ms), or null
// for no swing. The closer the tap is to the arrival, the farther the ball goes.
export const PITCHES_PER_TURN=10;
export const WINDOW=220;         // ms off at which contact disappears
export const HR_FEET=350;

export const PITCH_TYPES=[
 {type:'fastball',label:'Fastball',min:640,max:740,mph:[93,99]},
 {type:'slider',label:'Slider',min:800,max:900,mph:[84,89]},
 {type:'changeup',label:'Changeup',min:980,max:1120,mph:[78,84]}
];

// Same 10 pitches for both players, from a seed, so the score is fair.
export function pitchList(seed){
 let s=seed>>>0||1;const rnd=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);
 return Array.from({length:PITCHES_PER_TURN},()=>{const t=PITCH_TYPES[Math.floor(rnd()*PITCH_TYPES.length)];
  const ms=Math.round(t.min+rnd()*(t.max-t.min)),mph=Math.round(t.mph[1]-(ms-t.min)/(t.max-t.min)*(t.mph[1]-t.mph[0]));
  return {type:t.type,label:t.label,ms,mph};});
}

export function outcome(pitch,swing){
 if(swing==null||!Number.isFinite(swing))return {kind:'take',label:'Strike looking',feet:0,hr:false,err:null};
 const err=Math.round(swing-pitch.ms),off=Math.abs(err);
 if(off>WINDOW)return {kind:'whiff',label:err<0?'Way early. Strike!':'Way late. Strike!',feet:0,hr:false,err};
 const q=1-off/WINDOW,feet=Math.round(110+Math.pow(q,1.2)*340),hr=feet>=HR_FEET;
 const side=off<18?'center':err<0?'left':'right';
 return {kind:hr?'hr':feet>=250?'fly':'ground',label:hr?`Home run! ${feet} ft`:feet>=250?`Warning track, ${feet} ft`:err<0?'Rolled over. Grounder.':'Late. Weak grounder.',feet,hr,err,side};
}

export function score(pitches,swings){
 const results=pitches.map((p,i)=>outcome(p,swings?.[i]));
 return {results,hr:results.filter(r=>r.hr).length,feet:results.reduce((a,r)=>a+(r.hr?r.feet:0),0),longest:Math.max(0,...results.map(r=>r.feet))};
}
