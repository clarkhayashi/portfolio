import {Game} from './server.mjs';
import {refreshCounts,countsStale} from './ratings.mjs';
import {flushMetrics,mergeCounts} from './metrics.mjs';
// Prompt weights read a cached copy of the anonymous counts. Refresh it before an action when stale; short wait, silent fallback.
export async function warmCounts(store,wait=300){try{if(countsStale()&&typeof store.ratings==='function')await refreshCounts(()=>store.ratings(),wait);}catch{}}
// Anonymous funnel counts (metrics.mjs) follow the same rule: collected per attempt, sent only after the room write lands.
// State polls never send any: see the state branch below.
// Send anonymous prompt ratings after the room write lands. Bounded wait; errors are swallowed so the game never fails on them.
export async function flushRatings(store,events,wait=800){if(!events.length||typeof store.incrementRating!=='function')return;let timer;const all=Promise.allSettled(events.map(([id,vote])=>Promise.resolve().then(()=>store.incrementRating(id,vote))));await Promise.race([all,new Promise(resolve=>{timer=setTimeout(resolve,wait);})]);clearTimeout(timer);}
// Presence: a read poll rewrites the room only when the player's lastSeen is this stale.
// Everything that reads lastSeen must tolerate this lag (see UNSEEN_MS / DISCONNECT_MS in server.mjs).
export const PRESENCE_WRITE_MS=10000;
// Lobby/results/finished only need the 30 s disconnect signal, so presence can be staler there (10 s poll + 15 s < 30 s).
export const PRESENCE_CALM_MS=15000;const CALM=new Set(['lobby','result','finished','paused']);
export const presenceInterval=room=>CALM.has(room?.phase)?PRESENCE_CALM_MS:PRESENCE_WRITE_MS;
// Short per-instance read cache for polls. Eight phones polling one room on the same warm instance share one GET.
// Only first-attempt state reads use it; actions and every retry read Redis, and CAS rejects any stale write.
// Stores opt in with cacheReads (RedisRoomStore does); ROOM_READ_CACHE_MS=0 turns it off.
export const READ_CACHE_MS=Number(process.env.ROOM_READ_CACHE_MS??750);
const readCache=new WeakMap();
function cacheFor(store){if(!store.cacheReads||!(READ_CACHE_MS>0))return null;let m=readCache.get(store);if(!m)readCache.set(store,m=new Map());return m;}
function remember(store,code,value){const m=cacheFor(store);if(!m)return;m.delete(code);m.set(code,{at:Date.now(),value});if(m.size>500)m.delete(m.keys().next().value);}
async function readRoom(store,code,useCache){const m=useCache&&cacheFor(store);if(m){const hit=m.get(code);if(hit&&Date.now()-hit.at<READ_CACHE_MS&&Date.now()>=hit.at)return hit.value;}const value=await store.get(code);remember(store,code,value);return value;}
export class PublicError extends Error {constructor(message,status=400){super(message);this.status=status;}}
export async function cloudRequest(store,action,{state=false}={}){
 if(!action||typeof action!=='object'||Array.isArray(action))throw new PublicError('Invalid request.');
 if(!state&&typeof action.type!=='string')throw new PublicError('Choose an action.');
 if(action.type==='create'&&!state){
  for(let attempt=0;attempt<8;attempt++){
   const game=new Game(),metrics=[];game.onMetrics=c=>metrics.push(c);const result=game.create(action.name,action.mode,typeof action.quick==='string'?action.quick:null,action.quickGame,{newHost:action.newHost===true});const room=game.rooms.get(result.code);
   if(await store.compareAndSwap(result.code,null,JSON.stringify(room))){await flushMetrics(store,metrics);return result;}
  }
  throw new PublicError('Could not open a room. Try again.',503);
 }
 const code=String(action.code||'').toUpperCase();
 if(!/^[A-Z]{4}$/.test(code))throw new PublicError('Enter a four-letter room code.');
 if(!state)await warmCounts(store);
 for(let attempt=0;attempt<16;attempt++){
  const before=await readRoom(store,code,state&&attempt===0);
  if(!before)throw new PublicError('Room not found or expired. Join a new room.',404);
  const room=JSON.parse(before);const game=new Game();game.rooms.set(code,room);const ratings=[],metrics=[];game.onRate=(id,vote)=>ratings.push([id,vote]);
  // Polls never send metrics. A poll that moves the game on (a timer ran out) parks its counts in the room;
  // the next action sends them with its own batch.
  if(state)game.onMetrics=c=>{if(room.mt)room.mt.p=mergeCounts([room.mt.p||{},c]);};
  else game.onMetrics=c=>metrics.push(c);
  let player;
  // Authenticate before advancing timers or changing connection state.
  const display=state&&room.displayToken&&action.token===room.displayToken;if((state&&!display)||(!state&&action.type!=='join'))player=game.player(room,action.token);
  game.tick();
  if(!game.rooms.has(code))throw new PublicError('This room has expired. Join a new room.',404);
  let result;
  if(display){result=game.publicView(room);}
  else if(state){if(Date.now()-(player.lastSeen||0)>=presenceInterval(room)){player.lastSeen=Date.now();room.last=Date.now();}result=game.view(room,player);}
  else if(action.type==='join'){try{result=game.join(code,action.name);}catch(e){await flushMetrics(store,metrics);throw e;}room.last=Date.now();} // a refused late join writes nothing but is counted
  else{player.lastSeen=Date.now();game.action(room,player,action);result={ok:true,state:game.view(room,player)};}
  if(!state&&room.mt?.p){metrics.push(room.mt.p);delete room.mt.p;} // parked counts ride along with this write
  const after=JSON.stringify(room);
  if(after===before||await store.compareAndSwap(code,before,after)){if(after!==before)remember(store,code,after);await flushRatings(store,ratings);await flushMetrics(store,metrics);return result;}
 }
 throw new PublicError('The room is busy. Try again.',503);
}
