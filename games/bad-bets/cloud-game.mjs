import {Game} from './server.mjs';
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
 for(let attempt=0;attempt<16;attempt++){
  const before=await store.get(code);
  if(!before)throw new PublicError('Room not found or expired. Join a new room.',404);
  const room=JSON.parse(before);const game=new Game();game.rooms.set(code,room);
  let player;
  // Authenticate before advancing timers or changing connection state.
  if(state||action.type!=='join')player=game.player(room,action.token);
  game.tick();
  if(!game.rooms.has(code))throw new PublicError('This room has expired. Join a new room.',404);
  let result;
  if(state){player.lastSeen=Date.now();room.last=Date.now();result=game.view(room,player);}
  else if(action.type==='join'){result=game.join(code,action.name);room.last=Date.now();}
  else{player.lastSeen=Date.now();game.action(room,player,action);result={ok:true,state:game.view(room,player)};}
  if(await store.compareAndSwap(code,before,JSON.stringify(room)))return result;
 }
 throw new PublicError('The room is busy. Try again.',503);
}
