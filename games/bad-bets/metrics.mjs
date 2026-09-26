// Anonymous funnel counts. Only daily totals are kept: one Redis hash per UTC day, e.g. oops:m:v1:2026-09-25
// with fields like "created:party" or "ttfr:lt30". No names, room codes, tokens, IPs, answers or timestamps
// are stored, and nothing here runs on a state poll. Events that happen inside a room are sent after that
// room's write lands, batched into one EVAL (one Redis command) per send. See installMetrics for when.

export const METRICS_VERSION=1;
export const METRICS_PREFIX='oops:m:v1:';
export const METRICS_TTL=400*86400; // keep a little over a year of days
// Time from room created to round 1 started, in buckets. Raw seconds are never stored.
export const BUCKETS=['lt30','30to60','1to2m','2to5m','5mplus'];
export function bucket(seconds){const s=Number(seconds);if(!Number.isFinite(s)||s<30)return 'lt30';if(s<60)return '30to60';if(s<120)return '1to2m';if(s<300)return '2to5m';return '5mplus';}
export const MODE_FIELD={tournament:'party',minigames:'minigames',quick:'quick',mixer:'date'};
export const FIELDS=[...Object.values(MODE_FIELD).map(m=>`created:${m}`),'newhost','started',...BUCKETS.map(b=>`ttfr:${b}`),'rounds','finished','rematch','share','tv','latejoin'];
const ALLOWED=new Set(FIELDS);
// The only events a browser may report on its own (they never touch a room).
export const CLIENT_EVENTS=['share','tv'];
// Rounds are sent in batches of this size, and the rest with the game's finish.
export const ROUND_BATCH=3;

export const dayKey=(now=Date.now())=>new Date(now).toISOString().slice(0,10);
export const metricsKey=day=>METRICS_PREFIX+day;
// Keep only known fields with positive whole counts. Anything else is dropped.
export function cleanCounts(counts){const out={};for(const [k,v] of Object.entries(counts||{})){const n=Number(v);if(ALLOWED.has(k)&&Number.isSafeInteger(n)&&n>0)out[k]=n;}return out;}
export function mergeCounts(list){const out={};for(const c of list)for(const [k,v] of Object.entries(cleanCounts(c)))out[k]=(out[k]||0)+v;return out;}

// One EVAL: HINCRBY every field, then refresh the key's expiry. Upstash bills a script as one command.
export const METRICS_SCRIPT=`for i=2,#ARGV,2 do redis.call('HINCRBY', KEYS[1], ARGV[i], ARGV[i+1]) end
redis.call('EXPIRE', KEYS[1], ARGV[1])
return 1`;
// One EVAL returns every requested day's hash, so the stats page costs one command per cache miss.
export const READ_SCRIPT=`local out = {}
for i=1,#KEYS do out[i] = redis.call('HGETALL', KEYS[i]) end
return out`;

// Local server (no Redis): in-memory daily counters, same shape.
const local=new Map();
export function recordLocalMetrics(counts,now=Date.now()){const c=cleanCounts(counts);if(!Object.keys(c).length)return;const day=dayKey(now),h=local.get(day)||{};for(const [k,v] of Object.entries(c))h[k]=(h[k]||0)+v;local.set(day,h);}
export function localMetrics(days=14,now=Date.now()){return statsBody(lastDays(days,now).map(day=>[day,local.get(day)||{}]));}
export function resetLocalMetrics(){local.clear();}

export function lastDays(n=14,now=Date.now()){n=Math.max(1,Math.min(60,Math.floor(Number(n))||14));const out=[];for(let i=0;i<n;i++)out.push(dayKey(now-i*86400000));return out;}
// Redis HGETALL replies arrive flat ([field, value, ...]) or as an object. Unknown fields are dropped.
export function hashCounts(flat){const pairs=Array.isArray(flat)?flat:Object.entries(flat||{}).flat(),out={};for(let i=0;i+1<pairs.length;i+=2)out[pairs[i]]=pairs[i+1];return cleanCounts(out);}
export function statsBody(rows){return {version:METRICS_VERSION,fields:FIELDS,days:rows.map(([day,flat])=>({day,counts:hashCounts(flat)}))};}

// Send counts with a bounded wait. Errors are swallowed: a metric must never fail a game action.
export async function flushMetrics(store,list,wait=800,now=Date.now()){
 const counts=mergeCounts(list);if(!Object.keys(counts).length||typeof store?.incrementMetrics!=='function')return;
 let timer;const send=Promise.resolve().then(()=>store.incrementMetrics(dayKey(now),counts)).catch(()=>{});
 await Promise.race([send,new Promise(resolve=>{timer=setTimeout(resolve,wait);})]);clearTimeout(timer);
}

// Room hooks. r.mt holds only {at: created time, s: started flag, q: rounds not sent yet}; it never leaves the server.
// Events leave through game.onMetrics(counts): the local server records them in memory, the cloud path collects them
// per attempt and sends them only after the room write succeeds (cloud-game.mjs).
export function installMetrics(Game){
 const prev=Object.fromEntries(['create','join','action','phase'].map(k=>[k,Game.prototype[k]]));
 Game.prototype.metric=function(counts){try{this.onMetrics?.(counts);}catch{}};
 Game.prototype.create=function(name,mode,quick,quickGame,opts={}){
  const out=prev.create.call(this,name,mode,quick,quickGame);const r=this.rooms.get(out.code);
  r.mt={at:Date.now(),s:0,q:0};
  this.metric({[`created:${r.quick?'quick':MODE_FIELD[r.mode]||'party'}`]:1,...(opts?.newHost===true?{newhost:1}:{})});
  return out;
 };
 // Late joins: someone tried to join after the game began. Counted whether they were let in to wait or refused.
 Game.prototype.join=function(code,name){
  let out;try{out=prev.join.call(this,code,name);}
  catch(e){const r=this.rooms.get(String(code).toUpperCase());if(r&&r.phase!=='lobby'&&/has started/.test(e.message))this.metric({latejoin:1});throw e;}
  if(out?.waiting)this.metric({latejoin:1}); // accepted into the late-join line (latejoin.mjs)
  return out;
 };
 Game.prototype.metricRound=function(r){if(!r.mt||r.mode==='mixer')return;r.mt.q=(r.mt.q||0)+1;
  const last=r.mode==='tournament'&&!r.quick&&r.round>=(r.totalRounds||9);
  if(r.mt.q>=ROUND_BATCH&&!last){this.metric({rounds:r.mt.q});r.mt.q=0;}};
 const takeRounds=r=>{const q=r.mt?.q||0;if(r.mt)r.mt.q=0;return q?{rounds:q}:{};};
 Game.prototype.phase=function(r,phase,seconds){
  if(phase==='finished'&&r.phase!=='finished'&&r.mt)this.metric({finished:1,...takeRounds(r)});
  return prev.phase.call(this,r,phase,seconds);
 };
 Game.prototype.action=function(r,p,a){
  const rematch=a?.type==='rematch'&&r.phase==='finished'&&r.mt?takeRounds(r):null;
  const out=prev.action.call(this,r,p,a);
  if(rematch)this.metric({rematch:1,...rematch});
  if(r.mt&&!r.mt.s&&r.round>=1&&r.phase!=='lobby'){r.mt.s=1;this.metric({started:1,[`ttfr:${bucket((Date.now()-r.mt.at)/1000)}`]:1});}
  return out;
 };
}
