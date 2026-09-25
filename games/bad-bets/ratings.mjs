// One-tap prompt feedback. Only anonymous counts per built-in prompt are kept.
// No names, room codes, IPs, timestamps, or prompt text go into the counters.
import {pool,normText,PACK_IDS} from './packs.mjs';

export const RATINGS_VERSION=1;
export const RATINGS_KEY='oops:fb:v1';
export const VOTES=['fire','meh'];
// Game id -> content kind. Shadowbox, Date Night and the comeback dare are left out on purpose.
export const RATED_GAMES={brain:'brain',number:'number',draft:'food',auction:'food',draw:'draw',imposter:'faker',rhythm:'rhythm',quips:'quips'};

// FNV-1a 32-bit. The rater page carries a copy of this exact function; keep them in sync.
// Input is normalized to plain ASCII first, so char codes are bytes.
export function fnv1a(s){let h=0x811c9dc5;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i)&0xff;h=Math.imul(h,0x01000193)>>>0;}return h.toString(16).padStart(8,'0');}
export const promptText=(kind,item)=>Array.isArray(item)?item[0]:item;
export const promptId=(kind,text)=>`${kind}-${fnv1a(`${kind}|${normText(text)}`)}`;

// Built-in prompts only: core plus every pack. Player-written prompts are never in here.
let builtin=null;
export function builtinIds(){
 if(builtin)return builtin;builtin=new Map();
 for(const kind of new Set(Object.values(RATED_GAMES))){const m=new Map();for(const item of pool(kind,PACK_IDS,[])){const t=promptText(kind,item);m.set(normText(t),promptId(kind,t));}builtin.set(kind,m);}
 return builtin;
}
// The prompt id a finished round can be rated under, or null if it is not a built-in prompt.
export function rateTarget(r){
 if(!r||r.phase!=='result'||r.mode==='mixer'||!r.game)return null;
 const kind=RATED_GAMES[r.game];if(!kind)return null;
 const text=r.game==='imposter'?r.secret:r.game==='rhythm'?(r.physical?.category||r.prompt):r.prompt;
 if(typeof text!=='string'||!text)return null;
 return builtinIds().get(kind)?.get(normText(text))||null;
}

// Local server (no Redis): in-memory anonymous counters.
const local=new Map();
export function recordLocal(id,vote){const c=local.get(id)||{fire:0,meh:0};c[vote]++;local.set(id,c);}
export function localCounts(){return Object.fromEntries(local);}
export function resetLocalCounts(){local.clear();}
// Redis hash fields look like "<id>:fire". Anything malformed is dropped.
export function countsFromHash(flat){
 const counts={};const pairs=Array.isArray(flat)?flat:Object.entries(flat||{}).flat();
 for(let i=0;i+1<pairs.length;i+=2){const m=/^([a-z]+-[0-9a-f]{8}):(fire|meh)$/.exec(String(pairs[i]));const n=Number(pairs[i+1]);if(!m||!Number.isSafeInteger(n)||n<0)continue;(counts[m[1]]||={fire:0,meh:0})[m[2]]=n;}
 return counts;
}
export const ratingsBody=counts=>({version:RATINGS_VERSION,counts});
