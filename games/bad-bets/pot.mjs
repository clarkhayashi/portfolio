// Shared-pot economy. Legacy rooms finish under their original rules.
const creative=['draft','auction','draw','quips'];
const restricted=['brain','imposter'];
const sum=xs=>xs.reduce((a,b)=>a+b,0);
const rotate=(xs,n)=>[...xs.slice(n%xs.length),...xs.slice(0,n%xs.length)];
export function distribute(contributions,scores,order,{refund=false}={}){
 const payouts=Object.fromEntries(Object.keys(contributions).map(id=>[id,0])),pots=[];
 const levels=[...new Set(Object.values(contributions).filter(n=>n>0))].sort((a,b)=>a-b);let prev=0;
 for(const level of levels){const payers=Object.keys(contributions).filter(id=>contributions[id]>=level),amount=(level-prev)*payers.length;prev=level;
  const eligible=payers.filter(id=>Number.isFinite(scores[id]));
  if(refund||payers.length===1||!eligible.length){for(const id of payers)payouts[id]+=amount/payers.length;pots.push({amount,winners:[],refund:true});continue;}
  const best=Math.max(...eligible.map(id=>scores[id])),winners=eligible.filter(id=>scores[id]===best);
  // A complete tie returns each contribution at this layer, unless forfeits exist.
  if(winners.length===payers.length){for(const id of payers)payouts[id]+=amount/payers.length;pots.push({amount,winners,refund:true});continue;}
  const seats=order.filter(id=>winners.includes(id)),each=Math.floor(amount/winners.length);let remainder=amount%winners.length;
  for(const id of seats)payouts[id]+=each+(remainder-->0?1:0);
  pots.push({amount,winners,refund:false});
 }
 return {payouts,pots};
}
export function installPotRules(Game){
 const old=Object.fromEntries(['create','fresh','roundReady','betting','choose','advance','action','view','voters','settle','pool'].map(k=>[k,Game.prototype[k]]));
 const modern=r=>r.potVersion===2&&r.mode==='tournament';
 const player=(r,id)=>r.players.find(p=>p.id===id);
 const remain=r=>(r.contestants||[]).filter(id=>!r.folded.includes(id));
 const pay=(r,id,total)=>{const p=player(r,id),delta=total-(r.stakes[id]||0);if(!Number.isSafeInteger(total)||delta<0||delta>p.chips)throw Error('FUN_POLICE: That amount is outside your available chips.');p.chips-=delta;r.stakes[id]=total;};
 Game.prototype.create=function(...args){const result=old.create.apply(this,args);this.rooms.get(result.code).potVersion=2;return result;};
 Game.prototype.pool=function(r,spot=r.spot){const pool=old.pool.call(this,r,spot);if(!modern(r))return pool;const funded=this.live(r).filter(p=>p.chips>0).length;return pool.filter(id=>restricted.includes(id)?this.live(r).filter(p=>p.chips>=5).length>=(id==='imposter'?4:2):funded>=2);};
 Game.prototype.fresh=function(r){if(modern(r)){r.pot=null;r.contestants=[];r.folded=[];r.forfeits=[];r.judges=[];r.uncontested=false;r.interruptedForfeit=false;r.potSettled=false;r.issuedChips ||=0;}return old.fresh.call(this,r);};
 Game.prototype.roundReady=function(r){if(!modern(r))return old.roundReady.call(this,r);const low=this.live(r).find(p=>p.chips<5&&!p.comebackUsed&&!p.comebackDeclined);if(low){r.comeback={player:low.id,stage:'offer',dare:''};this.phase(r,'comeback',60);return;}r.comeback=null;if(this.live(r).filter(p=>p.chips>0).length<2){this.phase(r,'finished');return;}r.candidates=this.pool(r).filter(id=>id!==r.banned);if(r.banEnabled&&r.candidates.length>=3)this.phase(r,'ban',18);else this.betting(r);};
 Game.prototype.betting=function(r){if(!modern(r))return old.betting.call(this,r);this.choose(r);};
 Game.prototype.choose=function(r){if(!modern(r))return old.choose.call(this,r);if(r.pot)throw Error('This round already has a pot.');
  // Selection reuses the established game setup without debiting legacy stakes.
  r.free=true;const small=this.live(r).filter(p=>p.chips>0&&p.chips<5);for(const p of small){p.realBalance=p.chips;p.chips=5;}
  try{old.choose.call(this,r);}finally{for(const p of small){p.chips=p.realBalance;delete p.realBalance;}}
  if(r.phase==='result')return;
  r.free=false;r.teams=[]; // Pot Ballpark ranks individual errors, including in Spotlight.
  if(restricted.includes(r.game)){r.active=r.active.filter(id=>player(r,id).chips>=5);r.voteOrder=r.voteOrder.filter(id=>r.active.includes(id));if(r.game==='imposter'){r.clueOrder=r.clueOrder.filter(id=>r.active.includes(id));if(!r.active.includes(r.imposter))r.imposter=r.active[0];}}
  r.contestants=[...r.active];r.folded=[];r.forfeits=[];r.judges=this.live(r).filter(p=>!r.active.includes(p.id)).map(p=>p.id);r.stakes={};
  r.pot={revision:0,stage:'opening',target:5,queue:[],turn:null,fixed:restricted.includes(r.game),opening:r.round<=2};
 };
 Game.prototype.openPot=function(r){const b=r.pot;for(const id of remain(r))pay(r,id,Math.min(5,player(r,id).chips));
  if(b.fixed){this.phase(r,'reveal',15);return;}
  b.queue=rotate([...r.contestants],(r.round-1)%r.contestants.length);this.nextPotTurn(r);
 };
 Game.prototype.nextPotTurn=function(r){const b=r.pot;while(b.queue.length){const id=b.queue.shift();if(r.folded.includes(id)||player(r,id).left||player(r,id).chips===0)continue;if(b.stage==='response'&&(r.stakes[id]||0)>=b.target)continue;b.turn=id;b.revision++;this.phase(r,'wager',20);return;}
  if(b.stage==='opening'){b.stage='response';b.queue=rotate([...r.contestants],(r.round-1)%r.contestants.length);return this.nextPotTurn(r);}
  this.closePot(r);
 };
 Game.prototype.closePot=function(r){r.pot.turn=null;r.pot.revision++;r.active=remain(r);r.voteOrder=r.voteOrder.filter(id=>r.active.includes(id));
  if(r.active.length===1){r.uncontested=true;this.settle(r);return;}
  if(r.active.length<2){this.cancel(r,'Nobody is left in this round. Everyone gets their chips back.');return;}
  if(r.auction){ // Auction was prepared before folds; rebuild for the remaining creators.
   this.resetPotAuction(r);
  }
  if(r.physical){for(const id of Object.keys(r.physical.scores))if(!r.active.includes(id))delete r.physical.scores[id];if(!r.active.includes(r.physical.attacker))r.physical.attacker=r.active[0];}
  this.phase(r,'reveal',15);
 };
 Game.prototype.potAction=function(r,p,a){const b=r.pot;if(r.phase!=='wager'||a.round!==r.round||a.revision!==b.revision||b.turn!==p.id)throw Error('That betting turn has changed. Use the current screen.');
  const have=r.stakes[p.id]||0,stack=have+p.chips;
  if(a.move==='fold'){if(remain(r).length<=1)throw Error('The last player cannot fold.');r.folded.push(p.id);}
  else if(a.move==='match'){if(!b.opening&&p.chips>0&&b.target>=stack&&a.confirmed!==true)throw Error('FUN_POLICE: Confirm All In before risking your last chip.');pay(r,p.id,Math.min(b.target,stack));}
  else if(a.move==='raise'||a.move==='allin'){
   const total=a.move==='allin'?stack:a.total;
   if(a.move==='allin'&&(b.opening||a.confirmed!==true))throw Error('FUN_POLICE: All In unlocks in round 3 and needs confirmation.');
   if(b.stage==='response'&&total>b.target)throw Error('FUN_POLICE: Raising is closed. Match, go all in for less, or fold.');
   if(b.opening&&total>20)throw Error('FUN_POLICE: Opening rounds have a 20-chip limit. All In unlocks in round 3.');
   if(!Number.isSafeInteger(total)||total<=have||total>stack)throw Error('FUN_POLICE: Choose a whole-chip amount within your balance.');
   if(total< b.target+5 && total!==stack && total!==b.target)throw Error('FUN_POLICE: Raise the total by at least 5 chips.');
   if(total===stack&&!b.opening&&a.confirmed!==true)throw Error('FUN_POLICE: Confirm All In before risking your last chip.');
   pay(r,p.id,total);b.target=Math.max(b.target,total);
  }else throw Error('Choose Stay in, Raise or Fold.');
  b.revision++;if(remain(r).length===1)this.closePot(r);else this.nextPotTurn(r);
 };
 Game.prototype.advance=function(r){if(!modern(r))return old.advance.call(this,r);if(r.phase==='spin'){this.openPot(r);this.emit(r);return;}if(r.phase==='wager'){const p=player(r,r.pot.turn);this.potAction(r,p,{round:r.round,revision:r.pot.revision,move:(r.stakes[p.id]||0)>=r.pot.target?'match':'fold'});this.emit(r);return;}return old.advance.call(this,r);};
 Game.prototype.voters=function(r){if(!modern(r)||!creative.includes(r.game))return old.voters.call(this,r);return this.live(r).filter(p=>(r.judges||[]).includes(p.id));};
 Game.prototype.action=function(r,p,a){if(!modern(r))return old.action.call(this,r,p,a);
  if(a.type==='potBet'){if(r.deadline&&Date.now()>=r.deadline){this.advance(r);throw Error('Time is up. Use the current betting turn.');}r.last=Date.now();this.potAction(r,p,a);this.emit(r);return;}
  if(['stake','entry','bet'].includes(a.type))throw Error('Use the current pot controls. Side betting is off.');
  if(a.type==='vote'&&creative.includes(r.game)&&['draw','quips'].includes(r.game)&&!r.submissions[a.player])throw Error('That entry was not submitted and cannot receive votes.');
  if(a.type==='skipPrompt'&&r.pot)throw Error('FUN_POLICE: Chips are already bet on this prompt, so it can’t be swapped. Finish the round or pause it.');
  if(a.type==='comebackComplete'){old.action.call(this,r,p,a);r.issuedChips=(r.issuedChips||0)+20;return;}
  if(a.type==='removeDisconnected'){if(p.id!==r.host)throw Error('Only the host can do that.');const q=player(r,a.player);if(!q||q.left||q.id===p.id||!q.lastSeen||Date.now()-q.lastSeen<30000)throw Error('Wait 30 seconds before removing a disconnected player.');return this.action(r,q,{type:'leave',round:r.round});}
  if(a.type==='leave'&&r.pot&&!['result','finished','lobby'].includes(r.phase)){
   if(a.round!==undefined&&a.round!==r.round)throw Error('The round changed.');p.left=true;if(r.host===p.id)r.host=this.live(r)[0]?.id;
   if(r.contestants.includes(p.id)){r.forfeits.push(p.id);if(!r.folded.includes(p.id))r.folded.push(p.id);
    if(['spin','wager'].includes(r.phase)){if(remain(r).length<=1)this.closePot(r);else if(r.pot.turn===p.id)this.nextPotTurn(r);}else{r.active=r.active.filter(id=>id!==p.id);if(['draft','auction','imposter','shadow','rhythm'].includes(r.game)||r.active.length<2){r.uncontested=r.active.length===1;r.interruptedForfeit=true;this.settle(r);}}
   }else if(creative.includes(r.game)&&this.voters(r).length<2)this.cancel(r,'Fewer than 2 judges are left. Everyone gets their chips back.');
   this.emit(r);return;
  }
  const result=old.action.call(this,r,p,a);if(a.type==='rematch'){r.pot=null;r.stakes={};r.contestants=[];r.folded=[];r.judges=[];r.issuedChips=0;this.emit(r);}return result;
 };
 Game.prototype.settle=function(r){if(!modern(r)||!r.pot)return old.settle.call(this,r);if(r.potSettled||['result','finished'].includes(r.phase))return;
  const scores={},totals={},valid=r.active.filter(id=>!r.forfeits.includes(id)&&!player(r,id).left);let detail='',refund=!!r.forceDraw;
  if(r.interruptedForfeit&&valid.length>1){for(const id of valid)scores[id]=1;detail='A player left before the round finished. The players still in split the pot. The player who left loses their chips.';}
  else if(r.uncontested){for(const id of valid)scores[id]=1;detail='Everyone else folded or dropped out. The last player takes the chips they matched; the rest go back.';}
  else if(r.game==='number'){for(const id of valid)if(r.submissions[id]!==undefined)scores[id]=-Math.abs(Number(r.submissions[id])-r.answer);detail=`The answer is ${r.answer.toLocaleString()}. Closest valid answer wins each pot.`;}
  else if(r.game==='brain'&&r.herd){const o=this.herdOutcome(r);if(o.tie)refund=true;else for(const id of o.winners)if(valid.includes(id))scores[id]=1;} // Herd round (herd.mjs): the bigger side splits the pot; a tie refunds
  else if(r.game==='brain'){const norm=s=>s.toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/^(a|an|the) /,'').trim().replace(/\s+/g,' '),groups=Object.create(null);for(const id of valid){const a=norm(r.submissions[id]||'');if(a)(groups[a]||=[]).push(id);}const matched=Object.values(groups).filter(g=>g.length>1).flat();if(!matched.length||matched.length===r.contestants.length)refund=true;else for(const id of matched)scores[id]=1;detail=refund?'Everyone matched or nobody matched. Entries returned.':'Matching players split the pot. Missing answers cannot win.';}
  else if(r.game==='imposter'){for(const [v,id] of Object.entries(r.votes))if(valid.includes(v))totals[id]=(totals[id]||0)+1;const max=Math.max(0,...Object.values(totals)),leaders=Object.keys(totals).filter(id=>totals[id]===max);const caught=leaders.length===1&&leaders[0]===r.imposter;if(!max)refund=true;else for(const id of valid)if((caught?id!==r.imposter:id===r.imposter)&&r.submissions[id])scores[id]=1;detail=`The word was “${r.secret}”. ${player(r,r.imposter).name} was the imposter. ${!max?'No votes; entries returned.':caught?'The group caught the imposter and shares the pot.':'The imposter escaped and takes the pot.'}`;}
  else if(creative.includes(r.game)){
   const submitted=valid.filter(id=>['draw','quips'].includes(r.game)?!!r.submissions[id]:(r.picks[id]?.length===4));
   for(const [v,id] of Object.entries(r.votes))if(r.judges.includes(v)&&submitted.includes(id))totals[id]=(totals[id]||0)+1;
   if(this.voters(r).length<2)refund=true;
   if(submitted.length===1&&!refund){scores[submitted[0]]=1;detail='The other player didn’t finish, so they lose the chips they put in.';}
   else if(!sum(Object.values(totals))){refund=true;detail='No votes came in. Everyone gets their chips back.';}
   else{for(const id of submitted)scores[id]=totals[id]||0;detail='Secret judge votes rank the entries. If players tie for first, they split the chips.';}
  }else if(['shadow','rhythm'].includes(r.game)){for(const id of valid)scores[id]=(r.game==='rhythm'?-1:1)*(r.physical.scores[id]||0);detail='The confirmed score decides who wins the chips.';}
  if(r.forceDraw)detail='Round cancelled. Everyone gets their chips back.';
  const order=rotate(r.players.map(p=>p.id),(r.round-1)%r.players.length),{payouts,pots}=distribute(r.stakes,scores,order,{refund});
  const changes={};for(const [id,n] of Object.entries(payouts)){player(r,id).chips+=n;changes[id]=n-(r.stakes[id]||0);}
  r.potSettled=true;const winners=[...new Set(pots.filter(p=>!p.refund).flatMap(p=>p.winners))],tie=pots.every(p=>p.refund);
  r.result={winners,tie,detail,changes,totals,pots,payouts,distances:r.game==='number'?Object.fromEntries(valid.map(id=>[id,r.submissions[id]===undefined?null:Math.abs(r.submissions[id]-r.answer)])):null,answers:r.game==='imposter'?r.clues:r.submissions,picks:r.picks};
  r.history.push({round:r.round,game:r.game,prompt:r.prompt,detail,changes});if(r.history.length>50)r.history.shift();this.phase(r,'result');
 };
 Game.prototype.view=function(r,p){const v=old.view.call(this,r,p);if(!modern(r))return v;v.potVersion=2;v.teams=[];v.stakes=r.stakes||{};v.stake=r.stakes?.[p.id]||0;v.pot=r.pot?{...r.pot,queue:undefined,total:sum(Object.values(r.stakes)),contributions:r.stakes,contestants:r.contestants,folded:r.folded,judges:r.judges}:null;
  if(['spin','wager','ban','banResult','comeback'].includes(r.phase)){v.prompt='';v.secret=null;v.category=null;v.clueOrder=[];v.auction=null;v.physical=null;v.picks={};v.answers={};}
  return v;
 };
}
