// The first 60 seconds of Party mode. Round 1 is a house round: the easiest game (Same Brain on one prompt,
// or Ballpark for two players), everyone plays, no chips at risk, no betting screens, no game vote.
// Betting starts in round 2, with a one-line teach card shown once per room before that first bet.
// Total rounds and the rest of the Party structure are unchanged.
import {randomInt} from 'node:crypto';
export const HOUSE={revealSeconds:10,teachSpinSeconds:7};
export const TEACH_LINE='Now bet chips on yourself. Win the round, win the pot.';
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=randomInt(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};
// Same Brain needs a third player to be easy to match; with two, Ballpark is the gentler opener.
// Honors the host's game list; if both are switched off, round 1 is a normal betting round.
export function houseGame(r,players){const on=r.enabledGames||[];if(players>=3&&on.includes('brain'))return 'brain';if(on.includes('number'))return 'number';if(on.includes('brain'))return 'brain';return null;}
export const houseDue=(g,r)=>r.mode==='tournament'&&r.potVersion===2&&!r.quick&&r.round===1&&r.opener!==false&&!!houseGame(r,g.live(r).length);

export function installHouse(Game){
 const prev=Object.fromEntries(['fresh','roundReady','choose','settle','action','view'].map(k=>[k,Game.prototype[k]]));
 Game.prototype.fresh=function(r){r.house=false;if(r.teachRound&&r.round>=r.teachRound)r.teachRound=null;return prev.fresh.call(this,r);};
 Game.prototype.roundReady=function(r){if(houseDue(this,r)){r.comeback=null;this.houseStart(r);return;}return prev.roundReady.call(this,r);};
 Game.prototype.houseStart=function(r){
  const ids=this.live(r).map(p=>p.id),game=houseGame(r,ids.length);
  Object.assign(r,{house:true,hadHouse:true,free:true,spot:false,teams:[],pot:null,banned:null,veto:null,forceDraw:false,candidates:[game],spinOptions:[game],game,previous:game,
   active:ids,voteOrder:shuffle(ids),contestants:[...ids],folded:[],forfeits:[],judges:[],stakes:Object.fromEntries(ids.map(id=>[id,0])),spinStarted:Date.now(),spinAngle:0});
  if(game==='brain')r.prompt=this.drawContent(r,'brain');else [r.prompt,r.answer]=this.drawContent(r,'number');
  this.phase(r,'reveal',HOUSE.revealSeconds);
 };
 // Round 2 (the first pot after a house round): the teach card shows on the wheel and the betting turns.
 Game.prototype.choose=function(r){const out=prev.choose.call(this,r);
  if(r.pot&&r.hadHouse&&!r.taught&&r.mode==='tournament'){r.taught=true;r.teachRound=r.round;if(r.phase==='spin')r.deadline=Date.now()+HOUSE.teachSpinSeconds*1000;}
  return out;};
 Game.prototype.settle=function(r){const house=r.house&&!['result','finished'].includes(r.phase);const out=prev.settle.call(this,r);
  if(house&&r.phase==='result'&&r.result){r.result.house=true;r.result.changes={};const h=r.history.at(-1);if(h&&h.round===r.round)h.changes={};}
  return out;};
 Game.prototype.action=function(r,p,a){
  if(r.house&&a?.type==='beginGame'&&r.phase==='reveal'){if(r.host!==p.id)throw Error('Only the host can do that.');r.last=Date.now();this.begin(r);this.emit(r);return;}
  // Leaving the free round just drops the player; nobody has chips in it.
  if(r.house&&a?.type==='leave'&&['reveal','play'].includes(r.phase)&&r.active.includes(p.id)){
   if(a.round!==undefined&&a.round!==r.round)throw Error('The round changed. Try again.');
   p.left=true;if(r.host===p.id)r.host=this.live(r)[0]?.id;r.active=r.active.filter(id=>id!==p.id);r.voteOrder=r.voteOrder.filter(id=>id!==p.id);r.contestants=r.contestants.filter(id=>id!==p.id);delete r.submissions?.[p.id];
   if(r.active.length<2)this.cancel(r,'A player left, so the house round ends here. Nobody had chips in it.');
   else if(r.phase==='play'&&r.active.every(id=>r.submissions[id]!==undefined))this.advance(r);
   this.emit(r);return;
  }
  return prev.action.call(this,r,p,a);
 };
 Game.prototype.view=function(r,p){const v=prev.view.call(this,r,p);v.house=!!r.house;v.teach=r.teachRound===r.round&&['spin','wager'].includes(r.phase)?TEACH_LINE:null;return v;};
}
