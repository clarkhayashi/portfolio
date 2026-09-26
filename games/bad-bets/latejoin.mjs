// Late join for Party and Minigames (rules approved by Clark, 2026-09-26).
// Someone who joins mid-game waits in r.waiting and is seated at the next round break, never mid-round.
// - Party seats start with the MEDIAN of the seated players' chips (rounded down), counted in r.issuedChips
//   the same way comebacks and finale awards are, so chip accounting still balances.
// - Their first round after seating is free: they sit out betting (like an audience member or judge),
//   so no chips are at risk. They play from the round after.
// - No seating in the last 2 rounds of a Party game. After that they wait for the rematch.
// - Draft and Auction deal to seated players, so a Minigames replay of those games does not seat anyone.
// - Everyone counts toward the 12-player cap. Past the cap, joiners wait in line for the next game.
// - Quick 1v1 and Date Night stay closed. The host can switch late joining off in the lobby and remove
//   anyone who is waiting.
// Everything lives in the room object, so a late join costs the same one write as a normal join and a
// waiting player's poll is the same single GET as anyone else's. No extra Redis commands.
import {randomBytes} from 'node:crypto';
import {MAX_PLAYERS} from './public/catalog.js';
import {checkText} from './wordfilter.mjs';
export const LATE={cutoff:2,seenMs:120000,maxWaiting:12};
const DEALT=['draft','auction'];
const newId=()=>randomBytes(18).toString('hex');

// Median of the seated players' chips, rounded down to a whole chip. Even counts average the middle two.
export function medianChips(stacks){const xs=stacks.map(Number).filter(Number.isFinite).sort((a,b)=>a-b);if(!xs.length)return 100;const m=xs.length>>1;return Math.floor(xs.length%2?xs[m]:(xs[m-1]+xs[m])/2);}
export const lateModes=r=>!r.quick&&['tournament','minigames'].includes(r.mode);
export const lateOpen=r=>lateModes(r)&&r.lateJoin!==false;
// Party only: the round about to start (`next`) is inside the last LATE.cutoff rounds.
export const pastCutoff=(r,next=(r.round||0)+1)=>r.mode==='tournament'&&next>(r.totalRounds||9)-LATE.cutoff;
// True when the next break can seat people (as opposed to waiting for the next game).
export const seatsThisGame=r=>r.phase!=='finished'&&!pastCutoff(r)&&!(r.mode==='minigames'&&DEALT.includes(r.selectedGame));

// Where each waiting player stands: 'round' (seated at the next break), 'game' (seated for the next game),
// or 'full' (the room is at the cap; `line` is their place in the queue, 1 = first in line).
export function lineup(r,seated){const free=Math.max(0,MAX_PLAYERS-seated),soon=seatsThisGame(r);
 return (r.waiting||[]).map((w,i)=>i>=free?{id:w.id,name:w.name,status:'full',line:i-free+1}:{id:w.id,name:w.name,status:soon?'round':'game'});}

export function installLateJoin(Game){
 const prev=Object.fromEntries(['player','join','fresh','choose','action','view'].map(k=>[k,Game.prototype[k]]));
 // Waiting players authenticate with their own token but are not in r.players, so no game code ever sees them.
 Game.prototype.player=function(r,t){try{return prev.player.call(this,r,t);}catch(e){const w=t&&(r.waiting||[]).find(w=>w.token===t);if(w)return w;throw e;}};
 // Seat waiting players, in queue order, up to the cap. fresh = a new game (100 chips, no free round).
 // Players not seen for 2 minutes stay in line so a closed tab never becomes an empty seat.
 Game.prototype.seatWaiting=function(r,{fresh=false}={}){
  if(!r.waiting?.length)return 0;
  const now=Date.now(),live=this.live(r),party=r.mode==='tournament'&&!fresh,chips=party?medianChips(live.map(p=>p.chips)):100;
  const least=k=>live.length?Math.min(...live.map(p=>p[k]||0)):0,keep=[];let seated=0;
  for(const w of r.waiting){
   if(this.live(r).length>=MAX_PLAYERS||now-(w.lastSeen||0)>=LATE.seenMs){keep.push(w);continue;}
   const p={id:w.id,token:w.token,name:w.name,chips,spots:least('spots'),fakerCount:least('fakerCount'),left:false,lastSeen:w.lastSeen};
   if(!fresh){p.joinedRound=(r.round||0)+1;if(party)p.freeRound=p.joinedRound;}
   r.players.push(p);seated++;
   if(party)r.issuedChips=(r.issuedChips||0)+chips; // late-join chips are issued chips, like the start stacks
  }
  r.waiting=keep;return seated;
 };
 Game.prototype.join=function(code,name){
  const r=this.rooms.get(String(code).toUpperCase());
  if(r?.phase==='lobby'&&r.waiting?.length)this.seatWaiting(r,{fresh:true}); // the line goes first
  if(!r||r.phase==='lobby'||!lateModes(r))return prev.join.call(this,code,name);
  if(r.lateJoin===false)throw Error('This game has started, and the host turned off late joining. Join after the rematch.');
  name=String(name||'').trim().slice(0,18);if(!name)throw Error('Enter a nickname.');
  checkText(name,{strict:r.audience!=='adults'});
  const low=name.toLowerCase();
  if([...this.live(r),...(r.waiting||[])].some(p=>p.name.toLowerCase()===low))throw Error('That nickname is taken. Try another.');
  if((r.waiting||[]).length>=LATE.maxWaiting)throw Error('This game has started and the line is full. Try again after this game.');
  const w={id:newId(),token:newId(),name,lastSeen:Date.now(),at:r.round||0,waiting:true};
  (r.waiting||=[]).push(w);r.last=Date.now();this.emit(r);
  return {code:r.code,token:w.token,waiting:true};
 };
 // A round break: the host moved on from a result. Seat whoever can play this game.
 Game.prototype.fresh=function(r){
  if(r.phase==='result'&&(r.round||0)>=1&&lateOpen(r)&&seatsThisGame(r))this.seatWaiting(r);
  return prev.fresh.call(this,r);
 };
 // Free first round: the new player is left out of the deal by looking broke while the round is set up.
 // They become an audience member (a judge in creative rounds) and put no chips in.
 Game.prototype.choose=function(r){
  const sit=r.mode==='tournament'?this.live(r).filter(p=>p.freeRound&&p.freeRound===r.round):[];
  for(const p of sit){p.heldChips=p.chips;p.chips=0;}
  try{return prev.choose.call(this,r);}finally{for(const p of sit){p.chips=p.heldChips;delete p.heldChips;}}
 };
 Game.prototype.action=function(r,p,a){
  const type=a?.type,host=()=>{if(r.host!==p.id)throw Error('Only the host can do that.');};
  if(p?.waiting){
   if(type==='leave'){r.waiting=(r.waiting||[]).filter(w=>w.id!==p.id);r.last=Date.now();this.emit(r);return;}
   throw Error('You’re in the next round. Hang tight.');
  }
  if(type==='lateJoin'){host();if(r.phase!=='lobby')throw Error('Change this in the lobby.');r.lateJoin=!!a.enabled;r.last=Date.now();this.emit(r);return;}
  if(type==='removeWaiting'){host();const before=(r.waiting||[]).length;r.waiting=(r.waiting||[]).filter(w=>w.id!==a.player);if(r.waiting.length===before)throw Error('That player already left.');r.last=Date.now();this.emit(r);return;}
  const rematch=type==='rematch'&&r.phase==='finished'&&r.host===p.id,toLobby=type==='lobby'&&['result','finished'].includes(r.phase)&&r.host===p.id;
  if(rematch)this.seatWaiting(r,{fresh:true});
  if(type==='start'&&r.phase==='lobby'&&r.host===p.id)this.seatWaiting(r,{fresh:true});
  const out=prev.action.call(this,r,p,a);
  if(rematch)for(const q of r.players){delete q.joinedRound;delete q.freeRound;}
  if(toLobby&&r.phase==='lobby')this.seatWaiting(r,{fresh:true});
  return out;
 };
 Game.prototype.view=function(r,p){
  const v=prev.view.call(this,r,p),seated=this.live(r).length,line=lineup(r,seated);
  const joined=new Map(r.players.filter(q=>q.joinedRound).map(q=>[q.id,q.joinedRound]));
  if(joined.size)v.players=v.players.map(q=>joined.has(q.id)?{...q,joined:joined.get(q.id)}:q);
  v.lateJoin={on:r.lateJoin!==false,open:lateModes(r),round:line.filter(x=>x.status==='round').length,later:line.filter(x=>x.status!=='round').length};
  if(p.id&&p.id===r.host&&line.length)v.waitingList=line;
  if(p.waiting){const me=line.find(x=>x.id===p.id)||{status:'game'};
   v.waiting={status:me.status,line:me.line||0,chips:r.mode==='tournament'?medianChips(this.live(r).map(q=>q.chips)):null,
    next:r.mode==='tournament'&&me.status==='round'?(r.round||0)+1:null,total:r.totalRounds||9};}
  if(p.freeRound&&p.freeRound===r.round)v.freeRound=true;
  return v;
 };
}
