import {Game} from './server.mjs';
import {refreshCounts,countsStale} from './ratings.mjs';
// Prompt weights read a cached copy of the anonymous counts. Refresh it before an action when stale; short wait, silent fallback.
export async function warmCounts(store,wait=300){try{if(countsStale()&&typeof store.ratings==='function')await refreshCounts(()=>store.ratings(),wait);}catch{}}
// Send anonymous prompt ratings after the room write lands. Bounded wait; errors are swallowed so the game never fails on them.
export async function flushRatings(store,events,wait=800){if(!events.length||typeof store.incrementRating!=='function')return;let timer;const all=Promise.allSettled(events.map(([id,vote])=>Promise.resolve().then(()=>store.incrementRating(id,vote))));await Promise.race([all,new Promise(resolve=>{timer=setTimeout(resolve,wait);})]);clearTimeout(timer);}
export class PublicError extends Error {constructor(message,status=400){super(message);this.status=status;}}
export async function cloudRequest(store,action,{state=false}={}){
 if(!action||typeof action!=='object'||Array.isArray(action))throw new PublicError('Invalid request.');
 if(!state&&typeof action.type!=='string')throw new PublicError('Choose an action.');
 if(action.type==='create'&&!state){
  for(let attempt=0;attempt<8;attempt++){
   const game=new Game();const result=game.create(action.name,action.mode);const room=game.rooms.get(result.code);
   if(await store.compareAndSwap(result.code,null,JSON.stringify(room)))return result;
  }
  throw new PublicError('Could not open a room. Try again.',503);
 }
 const code=String(action.code||'').toUpperCase();
 if(!/^[A-Z]{4}$/.test(code))throw new PublicError('Enter a four-letter room code.');
 if(!state)await warmCounts(store);
 for(let attempt=0;attempt<16;attempt++){
  const before=await store.get(code);
  if(!before)throw new PublicError('Room not found or expired. Join a new room.',404);
  const room=JSON.parse(before);const game=new Game();game.rooms.set(code,room);const ratings=[];game.onRate=(id,vote)=>ratings.push([id,vote]);
  let player;
  // Authenticate before advancing timers or changing connection state.
  const display=state&&room.displayToken&&action.token===room.displayToken;if((state&&!display)||(!state&&action.type!=='join'))player=game.player(room,action.token);
  game.tick();
  if(!game.rooms.has(code))throw new PublicError('This room has expired. Join a new room.',404);
  let result;
  if(display){result=game.publicView(room);}
  else if(state){if(Date.now()-(player.lastSeen||0)>=2000){player.lastSeen=Date.now();room.last=Date.now();}result=game.view(room,player);}
  else if(action.type==='join'){result=game.join(code,action.name);room.last=Date.now();}
  else{player.lastSeen=Date.now();game.action(room,player,action);result={ok:true,state:game.view(room,player)};}
  const after=JSON.stringify(room);
  if(after===before||await store.compareAndSwap(code,before,after)){await flushRatings(store,ratings);return result;}
 }
 throw new PublicError('The room is busy. Try again.',503);
}
