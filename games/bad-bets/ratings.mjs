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
export function recordLocal(id,vote){const c=local.get(id)||{fire:0,meh:0};c[vote]=(c[vote]||0)+1;local.set(id,c);}
export function localCounts(){return Object.fromEntries(local);}
export function resetLocalCounts(){local.clear();}
// Redis hash fields look like "<id>:fire". Anything malformed is dropped.
export function countsFromHash(flat){
 const counts={};const pairs=Array.isArray(flat)?flat:Object.entries(flat||{}).flat();
 for(let i=0;i+1<pairs.length;i+=2){const m=/^([a-z]+-[0-9a-f]{8}):(fire|meh)$/.exec(String(pairs[i]));const n=Number(pairs[i+1]);if(!m||!Number.isSafeInteger(n)||n<0)continue;(counts[m[1]]||={fire:0,meh:0})[m[2]]=n;}
 return counts;
}
export const ratingsBody=counts=>({version:RATINGS_VERSION,counts});

// R9 room-tuned prompts. Global weight from anonymous counts: unrated = 1.0, loved ~1.65, hated ~0.35, never zero.
export const weightFromCounts=c=>{const f=Math.max(0,Number(c?.fire)||0),m=Math.max(0,Number(c?.meh)||0);return 0.35+1.3*((f+1)/(f+m+2));};
export {weightedOrder} from './bags.mjs';
// Global counts cache. draw() is synchronous, so production refreshes this before an action (see cloud-game.mjs).
export const COUNTS_TTL=5*60000;
let remote=null;
export function setGlobalCounts(counts,now=Date.now()){remote={counts:counts&&typeof counts==='object'?counts:{},at:now};}
export function clearGlobalCounts(){remote=null;}
export const countsStale=(now=Date.now())=>!remote||now-remote.at>=COUNTS_TTL;
export function globalCount(id){return remote?remote.counts[id]:local.get(id);}
// Refresh from an async loader (Redis HGETALL). Bounded wait; failure keeps old counts and retries in 30 seconds.
export async function refreshCounts(load,timeout=300){
 if(!countsStale())return false;let timer;
 try{const flat=await Promise.race([Promise.resolve().then(load),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),timeout);})]);setGlobalCounts(countsFromHash(flat));return true;}
 catch{remote={counts:remote?.counts||{},at:Date.now()-COUNTS_TTL+30000};return false;}
 finally{clearTimeout(timer);}
}
// Which pack a built-in prompt id came from ('core' for the regular questions).
let packMap=null;
export function packOf(id){
 if(!packMap){packMap=new Map();for(const kind of new Set(Object.values(RATED_GAMES))){const core=new Set(pool(kind,[],[]).map(x=>promptId(kind,promptText(kind,x))));for(const c of core)packMap.set(c,'core');for(const pack of PACK_IDS)for(const x of pool(kind,[pack],[])){const pid=promptId(kind,promptText(kind,x));if(!packMap.has(pid))packMap.set(pid,pack);}}}
 return packMap.get(id)||null;
}
export const moodFactor=m=>!m?1:m.meh>m.fire+1?0.6:m.fire>m.meh+1?1.25:1;
// Room learning: counts only, keyed by pack. No player ids.
export function recordMood(r,id,vote){const pack=packOf(id);if(!pack||!VOTES.includes(vote))return;r.mood||={};const m=r.mood[pack]||={fire:0,meh:0};m[vote]++;}
export function itemWeight(kind,item,mood){let w=1;try{const id=promptId(kind,promptText(kind,item));w=weightFromCounts(globalCount(id));if(mood){const pack=packOf(id);if(pack)w*=moodFactor(mood[pack]);}}catch{w=1;}return w;}
