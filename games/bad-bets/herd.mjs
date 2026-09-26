// Herd round: a Same Brain variant. With 4+ players, every other Same Brain round one player writes a this-or-that,
// everyone else picks a side, and the smaller side loses. A lone voter on the smaller side is the Black Sheep and pays
// a small penalty; if every voter agrees, the writer pays it instead ("too easy"). 2 or 3 players never see a Herd round.
// Written questions live only in the room object. Nothing here is sent to ratings or Redis counters.
import {drawFrom} from './bags.mjs';
import {HERD_PROMPTS} from './pack-content.mjs';
export const HERD={writeSeconds:45,voteSeconds:20,questionMax:90,optionMax:30,penalty:10,min:4};
const PHASES=['herdWrite','herdVote'];
export const isHerdPhase=phase=>PHASES.includes(phase);
const clean=s=>String(s??'').trim().replace(/\s+/g,' ');
const rotate=(xs,n)=>xs.length?[...xs.slice(n%xs.length),...xs.slice(0,n%xs.length)]:[];
// Throws a short player-facing error, or returns the cleaned question.
export function validateHerd(a){const question=clean(a?.question),A=clean(a?.a),B=clean(a?.b);
 if(!question)throw Error('Write a question first.');if(question.length>HERD.questionMax)throw Error(`Keep the question to ${HERD.questionMax} characters.`);
 if(!A||!B)throw Error('Fill in both options.');if(A.length>HERD.optionMax||B.length>HERD.optionMax)throw Error(`Keep each option to ${HERD.optionMax} characters.`);
 if(A.toLowerCase()===B.toLowerCase())throw Error('Make the two options different.');
 return {question,a:A,b:B};}
// Next writer in seat order who hasn't asked yet; once everyone has, the rotation starts over.
export function nextAsker(r,ids){const seats=r.players.map(p=>p.id).filter(id=>ids.includes(id));r.herdAsked=(r.herdAsked||[]).filter(id=>r.players.some(p=>p.id===id));
 let pick=seats.find(id=>!r.herdAsked.includes(id));if(!pick){r.herdAsked=[];pick=seats[0];}r.herdAsked.push(pick);return pick;}
// Sides from the locked picks. No pick = losing side. Bigger side is the Herd; equal sides (or no picks) = tie.
export function herdOutcome(h,voters){const A=voters.filter(id=>h.votes[id]==='a'),B=voters.filter(id=>h.votes[id]==='b'),missed=voters.filter(id=>!h.votes[id]);
 const tie=A.length===B.length,side=tie?null:A.length>B.length?'a':'b',herd=side==='a'?A:side==='b'?B:[],small=side==='a'?B:side==='b'?A:[];
 const easy=!tie&&!small.length&&!missed.length,sheep=!tie&&small.length===1&&voters.length>=3?small[0]:null;
 return {A,B,missed,side,tie,winners:herd,easy,sheep};}
export function installHerd(Game){
 const prev=Object.fromEntries(['fresh','choose','begin','advance','action','view','settle','phase'].map(k=>[k,Game.prototype[k]]));
 const player=(r,id)=>r.players.find(p=>p.id===id);
 const on=r=>r.game==='brain'&&!!r.herd;
 // Voters still in the round. In Party a voter who leaves is dropped from r.active by the pot rules.
 const voters=r=>r.herd.voters.filter(id=>r.active.includes(id)&&player(r,id)&&!player(r,id).left);
 Game.prototype.fresh=function(r){r.herd=null;return prev.fresh.call(this,r);};
 Game.prototype.choose=function(r){const out=prev.choose.call(this,r);
  if(r.game!=='brain'||!['spin','reveal'].includes(r.phase)||(r.mode==='tournament'&&r.potVersion!==2))return out; // legacy Party rooms keep their rules
  r.brainRounds=(r.brainRounds||0)+1;if(r.brainRounds%2||r.active.length<HERD.min)return out;
  // The writer sits the vote out: no entry chips, never a winner or loser on the vote. Their only risk is the too-easy penalty.
  const asker=nextAsker(r,r.active),keep=id=>id!==asker;r.active=r.active.filter(keep);r.voteOrder=(r.voteOrder||[]).filter(keep);if(r.pot)r.contestants=r.contestants.filter(keep);
  r.prompt='';r.herd={asker,voters:[...r.active],question:'',a:'',b:'',stock:false,votes:{},outcome:null};return out;};
 Game.prototype.begin=function(r){if(!on(r))return prev.begin.call(this,r);if(player(r,r.herd.asker)?.left)this.herdOpenVote(r);else this.phase(r,'herdWrite',HERD.writeSeconds);};
 // Writer done, timed out or gone: a stock prompt fills in, then voting opens.
 Game.prototype.herdOpenVote=function(r){const h=r.herd;if(!h.question){const [q,a,b]=drawFrom(r,'herd',HERD_PROMPTS);Object.assign(h,{question:q,a,b,stock:true});}
  r.prompt=h.question;if(!voters(r).length){this.settle(r);return;}this.phase(r,'herdVote',HERD.voteSeconds);};
 Game.prototype.herdProgress=function(r){const h=r.herd;if(r.phase==='herdWrite'&&player(r,h.asker)?.left)this.herdOpenVote(r);else if(r.phase==='herdVote'&&voters(r).every(id=>h.votes[id]))this.settle(r);};
 Game.prototype.herdOutcome=function(r){return herdOutcome(r.herd,voters(r));};
 Game.prototype.advance=function(r){if(!on(r)||!isHerdPhase(r.phase))return prev.advance.call(this,r);if(r.phase==='herdWrite')this.herdOpenVote(r);else this.settle(r);this.emit(r);};
 Game.prototype.herdAction=function(r,p,a){const h=on(r)?r.herd:null;
  if(!h||!isHerdPhase(r.phase))throw Error('That part of the round has ended.');
  if(a.round!==undefined&&a.round!==r.round)throw Error('The round changed. Try again.');
  if(r.deadline&&Date.now()>=r.deadline){this.tick();throw Error('Time is up. Use the current round screen.');}
  r.last=Date.now();
  if(a.type==='herdAsk'){if(r.phase!=='herdWrite')throw Error('Voting has already started.');if(p.id!==h.asker)throw Error('Only the writer can send the question.');Object.assign(h,validateHerd(a),{stock:false});this.herdOpenVote(r);}
  else if(a.type==='herdVote'){if(r.phase!=='herdVote')throw Error('Wait for the question.');if(p.id===h.asker)throw Error('You wrote this one. Sit back and watch.');if(!voters(r).includes(p.id))throw Error('You are watching this one.');if(h.votes[p.id])throw Error('Your pick is locked.');if(!['a','b'].includes(a.side))throw Error('Pick A or B.');h.votes[p.id]=a.side;this.herdProgress(r);}
  else throw Error('Unknown action.');};
 Game.prototype.action=function(r,p,a){
  if(typeof a?.type==='string'&&a.type.startsWith('herd')){this.herdAction(r,p,a);this.emit(r);return;}
  const out=prev.action.call(this,r,p,a);
  if(a?.type==='leave'&&on(r)&&isHerdPhase(r.phase)){this.herdProgress(r);this.emit(r);}
  return out;};
 // Chips (Party only; Minigames has no chips, so there the callout is the whole penalty). Herd payouts are always even:
 // the winners' share of the pot, the penalty and any carried chips are pooled and split equally; leftover chips (fewer
 // than the number of winners) sit in r.carry and join the next pot that has winners. The penalty is the largest multiple
 // of the winner count that is at most min(10, the payer's chips), so 10 with 3 winners charges 9.
 // Carry is Herd-only in origin but pays out on the next contested round of any game (evenly, leftovers roll on).
 // If the game ends with carry left, the chip leader gets it, so chips are always conserved.
 const alive=(r,id)=>!!player(r,id)&&!player(r,id).left;
 Game.prototype.payCarry=function(r){const res=r.result;if(!r.pot||!res||res.carryDone)return;res.carryDone=true;
  const w=res.tie||r.forceDraw?[]:(res.winners||[]).filter(id=>alive(r,id)),each=w.length?Math.floor((r.carry||0)/w.length):0;
  if(each){for(const id of w){player(r,id).chips+=each;res.changes[id]=(res.changes[id]||0)+each;}res.bonus=each;r.carry-=each*w.length;}res.carry=r.carry||0;};
 Game.prototype.phase=function(r,phase,seconds){if(phase==='finished'&&r.carry>0){const live=this.live(r),top=live.find(p=>p.chips===Math.max(...live.map(q=>q.chips)));if(top){top.chips+=r.carry;r.carryAwarded={player:top.id,amount:r.carry};r.carry=0;}}return prev.phase.call(this,r,phase,seconds);};
 Game.prototype.settle=function(r){const herd=on(r)&&!['result','finished'].includes(r.phase);const out=prev.settle.call(this,r);if(r.phase!=='result')return out;if(!herd){this.payCarry(r);return out;}if(r.herd.outcome)return out;
  const h=r.herd,res=r.result,o=this.herdOutcome(r),nm=id=>player(r,id)?.name||'Someone',opt=s=>s==='a'?h.a:h.b;
  if(r.forceDraw||r.uncontested||r.interruptedForfeit){h.outcome={...o,cancelled:true,payer:null,penalty:0};res.carryDone=true;res.carry=r.carry||0;return out;} // cancelled or everyone else left: the round's own detail stands
  const payer=o.easy?h.asker:o.sheep,w=o.tie?[]:o.winners.filter(id=>alive(r,id));let paid=0;res.carryDone=true;
  if(r.pot&&w.length){const n=w.length;if(payer){const p=player(r,payer);paid=Math.floor(Math.min(HERD.penalty,Math.max(0,p.chips))/n)*n;p.chips-=paid;res.changes[payer]=(res.changes[payer]||0)-paid;}
   const got=id=>res.payouts?.[id]||0,pool=w.reduce((t,id)=>t+got(id),0)+paid+(r.carry||0),each=Math.floor(pool/n);
   for(const id of w){const d=each-got(id);player(r,id).chips+=d;res.changes[id]=(res.changes[id]||0)+d;if(res.payouts)res.payouts[id]=each;}
   r.carry=pool-each*n;}
  res.carry=r.carry||0;
  const refund=r.pot?' Everyone gets their chips back.':'';
  const detail=o.tie?`${o.A.length?'Even split.':'Nobody picked a side.'} Nobody wins this one.${refund}`:o.easy?`Everyone picked ${opt(o.side)}. Too easy! ${nm(h.asker)} wrote a no-brainer.`:`The Herd picked ${opt(o.side)}. The smaller side loses.${o.sheep?` 🐑 Black Sheep: ${nm(o.sheep)}.`:''}${o.missed.length?' No pick counts as the losing side.':''}`;
  h.outcome={...o,payer,penalty:paid,cancelled:false};res.winners=o.tie?[]:o.winners;res.tie=o.tie;res.detail=detail;res.answers={};
  const last=r.history.at(-1);if(last&&last.round===r.round&&last.game==='brain')last.detail=detail;return out;};
 // Views: nobody sees anyone else's pick before the reveal; the question shows once voting opens.
 Game.prototype.view=function(r,p){const v=prev.view.call(this,r,p);if(!on(r))return v;v.herd=herdView(r,p.id);v.answers={};if(r.phase!=='herdVote'&&r.phase!=='result')v.prompt='';return v;};
 function herdView(r,me){const h=r.herd,live=voters(r),shown=['herdVote','result','finished'].includes(r.phase)&&!!h.question;
  const v={asker:h.asker,youAsk:!!me&&me===h.asker,youVote:!!me&&live.includes(me),total:live.length,locked:live.filter(id=>h.votes[id]).length,limits:{question:HERD.questionMax,option:HERD.optionMax},penalty:HERD.penalty,chips:!!r.pot,
   question:shown?h.question:'',a:shown?h.a:'',b:shown?h.b:'',stock:shown&&h.stock,mine:me?h.votes[me]||null:null};
  if(['result','finished'].includes(r.phase)&&h.outcome)v.reveal=h.outcome;
  return v;}
}
