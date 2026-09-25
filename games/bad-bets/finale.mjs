// "Oops, I guess one more round?" (One More Round). Everyone writes a prompt, the room picks the best one
// in quick "this or that" pairs, everyone plays it, then votes. House-funded in Party mode, awards only in Minigames.
// Written prompts and answers live only in the room object. Nothing here is sent to ratings or Redis counters.
import {randomBytes,randomInt} from 'node:crypto';
export const FINALE={writeSeconds:45,pickSeconds:25,answerSeconds:60,drawSeconds:75,promptMax:90,answerMax:140,drawMax:100000,maxPairs:5,bestPrompt:20,toilet:10,perPlayer:20};
export const FINALE_EXAMPLES=['The worst thing to say at a job interview','A new school rule nobody asked for','Draw a dog running a lemonade stand'];
const PHASES=['finaleWrite','finalePick','finalePlay','finaleVote'];
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=randomInt(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};
const key=()=>randomBytes(6).toString('hex');
const sum=xs=>xs.reduce((a,b)=>a+b,0);
export const isFinalePhase=phase=>PHASES.includes(phase);
export const mainPot=players=>2*10*players;
export const votesEach=players=>players<6?1:2;
// Party mode: the last round becomes the finale with 3+ players (broke players included). Legacy rooms keep their old rules.
export const finaleDue=(g,r)=>r.mode==='tournament'&&r.potVersion===2&&r.round>=(r.totalRounds||9)&&g.live(r).length>=3;

// Each viewer gets k=min(5, pairs without their own prompt) pairs, dealt round-robin so every prompt shows up about equally.
export function assignPairs(ids,max=FINALE.maxPairs){
 const apps=Object.fromEntries(ids.map(id=>[id,0])),used=new Map(),out=Object.fromEntries(ids.map(id=>[id,[]]));
 const options=Object.fromEntries(ids.map(v=>{const o=ids.filter(id=>id!==v),all=[];for(let i=0;i<o.length;i++)for(let j=i+1;j<o.length;j++)all.push([o[i],o[j]]);return [v,all];}));
 const k=Object.fromEntries(ids.map(v=>[v,Math.min(max,options[v].length)]));
 for(let round=0;round<max;round++)for(const v of shuffle(ids)){
  if(out[v].length>=k[v])continue;
  const taken=new Set(out[v].map(p=>[...p].sort().join('|')));
  const pick=shuffle(options[v].filter(p=>!taken.has([...p].sort().join('|')))).map(p=>({p,score:apps[p[0]]+apps[p[1]]+(used.get([...p].sort().join('|'))||0)/10}));
  pick.sort((a,b)=>a.score-b.score);const best=pick[0].p;apps[best[0]]++;apps[best[1]]++;const id=[...best].sort().join('|');used.set(id,(used.get(id)||0)+1);
  out[v].push(shuffle(best));
 }
 return out;
}
// Win rate = wins / appearances in answered pairs. Ties break randomly.
export function rankPrompts(ids,pairs,picks){
 const wins=Object.fromEntries(ids.map(id=>[id,0])),seen=Object.fromEntries(ids.map(id=>[id,0]));
 for(const [v,list] of Object.entries(pairs))list.forEach((pair,i)=>{const w=picks[v]?.[i];if(w===undefined||!pair.includes(w))return;seen[pair[0]]++;seen[pair[1]]++;wins[w]++;});
 const rate=id=>seen[id]?wins[id]/seen[id]:0;
 const order=shuffle(ids).sort((a,b)=>rate(b)-rate(a));
 return {order,wins,seen};
}
// Two prompts (9+ players): split into halves; nobody answers their own prompt when it can be avoided.
export function splitGroups(live,a,b){
 const ga=[],gb=[];if(live.includes(b))ga.push(b);if(live.includes(a))gb.push(a);
 for(const id of shuffle(live.filter(id=>id!==a&&id!==b)))(ga.length<=gb.length?ga:gb).push(id);
 return [ga,gb];
}

export function installFinale(Game){
 const prev=Object.fromEntries(['roundReady','choose','advance','action','view','settle'].map(k=>[k,Game.prototype[k]]));
 const player=(r,id)=>r.players.find(p=>p.id===id);
 const alive=(r,id)=>{const p=player(r,id);return !!p&&!p.left;};
 const livePlayers=r=>r.finale.players.filter(id=>alive(r,id));
 Game.prototype.startFinale=function(r){
  const ids=this.live(r).map(p=>p.id);
  r.game='finale';r.prompt='';r.active=[];r.teams=[];r.voteOrder=[];r.submissions={};r.votes={};r.stakes={};r.spinOptions=[];r.candidates=[];r.comeback=null;r.pot=null;r.spot=false;r.result=null;r.free=true;
  r.finale={chips:r.mode==='tournament',players:ids,size:ids.length,seq:0,prompts:{},pairs:{},picks:{},ranking:[],played:[],entries:{},votes:{},granted:0};
  this.phase(r,'finaleWrite',FINALE.writeSeconds);
 };
 Game.prototype.roundReady=function(r){if(finaleDue(this,r)){this.startFinale(r);return;}return prev.roundReady.call(this,r);};
 Game.prototype.choose=function(r){if(r.mode==='minigames'&&r.selectedGame==='finale'){this.startFinale(r);return;}return prev.choose.call(this,r);};
 Game.prototype.finaleStartPick=function(r){const f=r.finale;
  for(const id of f.players)if(!f.prompts[id])f.prompts[id]={text:this.drawContent(r,'quips'),mode:'answer',builtin:true,key:key(),seq:f.seq++};
  f.pairs=assignPairs(f.players);f.picks=Object.fromEntries(f.players.map(id=>[id,[]]));
  if(livePlayers(r).every(id=>!f.pairs[id].length)){this.finaleStartPlay(r);return;}
  this.phase(r,'finalePick',FINALE.pickSeconds);
 };
 Game.prototype.finaleStartPlay=function(r){const f=r.finale,live=livePlayers(r);
  const {order,wins,seen}=rankPrompts(f.players,f.pairs,f.picks);f.ranking=order;f.wins=wins;f.seen=seen;
  const top=order.slice(0,f.size>=9?2:1);
  const groups=top.length===2?splitGroups(live,top[0],top[1]):[live];
  f.played=top.map((w,i)=>({writer:w,group:groups[i]}));
  this.phase(r,'finalePlay',f.played.some(x=>f.prompts[x.writer].mode==='draw')?FINALE.drawSeconds:FINALE.answerSeconds);
 };
 Game.prototype.finaleStartVote=function(r){const f=r.finale;const ids=Object.keys(f.entries);f.voteOrder=shuffle(ids);
  if(!ids.length){this.finaleSettle(r);return;}
  this.phase(r,'finaleVote',Math.min(50,30+2*ids.length));
  if(this.finaleVotesDone(r))this.finaleSettle(r);
 };
 const groupOf=(f,id)=>f.played.findIndex(x=>x.group.includes(id));
 const quota=(r,id)=>{const f=r.finale;return Math.min(votesEach(f.size),Object.keys(f.entries).filter(e=>e!==id&&alive(r,e)).length);};
 Game.prototype.finaleVotesDone=function(r){const f=r.finale;return livePlayers(r).every(id=>(f.votes[id]||[]).length>=quota(r,id));};
 Game.prototype.finaleProgress=function(r){const f=r.finale,live=livePlayers(r);
  if(r.phase==='finaleWrite'&&live.every(id=>f.prompts[id]))this.finaleStartPick(r);
  else if(r.phase==='finalePick'&&live.every(id=>f.picks[id].length>=f.pairs[id].length))this.finaleStartPlay(r);
  else if(r.phase==='finalePlay'&&live.every(id=>groupOf(f,id)<0||f.entries[id]))this.finaleStartVote(r);
  else if(r.phase==='finaleVote'&&this.finaleVotesDone(r))this.finaleSettle(r);
 };
 Game.prototype.finaleSettle=function(r){const f=r.finale;if(r.phase==='result'||r.phase==='finished')return;
  const ids=Object.keys(f.entries).filter(id=>alive(r,id)).sort((a,b)=>f.entries[a].seq-f.entries[b].seq);
  const totals=Object.fromEntries(ids.map(id=>[id,0]));for(const list of Object.values(f.votes))for(const e of list)if(Object.hasOwn(totals,e))totals[e]++;
  const max=Math.max(0,...Object.values(totals)),winners=max>0?ids.filter(id=>totals[id]===max):[];
  const awards={},give=(id,n,why)=>{(awards[id]||=[]).push({why,n});};
  const pot=mainPot(f.size);
  if(winners.length){const each=Math.floor(pot/winners.length),rem=pot%winners.length;winners.forEach((id,i)=>give(id,each+(i===0?rem:0),'main'));}
  const min=Math.min(...ids.map(id=>totals[id])),lows=ids.filter(id=>totals[id]===min);
  const toilet=ids.length>=2&&lows.length===1&&!winners.includes(lows[0])?lows[0]:null;if(toilet)give(toilet,FINALE.toilet,'toilet');
  const best=f.played.map(x=>x.writer).filter(w=>!f.prompts[w].builtin&&alive(r,w));for(const w of best)give(w,FINALE.bestPrompt,'prompt');
  const changes={};for(const [id,list] of Object.entries(awards))changes[id]=sum(list.map(x=>x.n));
  let granted=0;if(f.chips){for(const [id,n] of Object.entries(changes)){player(r,id).chips+=n;granted+=n;}r.issuedChips=(r.issuedChips||0)+granted;f.granted=granted;}
  f.totals=totals;f.winners=winners;f.toilet=toilet;f.best=best;f.awards=awards;f.pot=pot;
  const names=ids=>ids.map(id=>player(r,id)?.name||'Someone').join(' and ');
  const detail=winners.length?`${names(winners)} ${winners.length>1?'split':'won'} the main pot.`:'No votes came in, so nobody won the main pot.';
  r.result={winners,tie:!winners.length,detail,changes:f.chips?changes:{},totals,answers:{},picks:{},awards};
  r.history.push({round:r.round,game:'finale',prompt:f.played.map(x=>f.prompts[x.writer].text).join(' / '),detail,changes:f.chips?changes:{}});if(r.history.length>50)r.history.shift();
  this.phase(r,'result');
 };
 Game.prototype.settle=function(r){if(r.game==='finale'&&r.finale)return this.finaleSettle(r);return prev.settle.call(this,r);};
 Game.prototype.advance=function(r){
  if(r.game!=='finale'||!r.finale||!isFinalePhase(r.phase))return prev.advance.call(this,r);
  if(r.phase==='finaleWrite')this.finaleStartPick(r);else if(r.phase==='finalePick')this.finaleStartPlay(r);else if(r.phase==='finalePlay')this.finaleStartVote(r);else this.finaleSettle(r);
  this.emit(r);
 };
 Game.prototype.finaleAction=function(r,p,a){const f=r.finale;
  if(!f||r.game!=='finale')throw Error('That part of the round has ended.');
  if(a.round!==undefined&&a.round!==r.round)throw Error('The round changed. Try again.');
  if(r.deadline&&Date.now()>=r.deadline){this.tick();throw Error('Time is up. Use the current round screen.');}
  r.last=Date.now();const need=phase=>{if(r.phase!==phase)throw Error('That part of the round has ended.');};
  if(!f.players.includes(p.id))throw Error('You joined after this round started. Watch this one.');
  if(a.type==='finalePrompt'){need('finaleWrite');if(f.prompts[p.id])throw Error('Your prompt is already in.');
   const text=String(a.value||'').trim().replace(/\s+/g,' ');if(!text)throw Error('Write a prompt first.');if(text.length>FINALE.promptMax)throw Error(`Keep it to ${FINALE.promptMax} characters.`);
   if(!['answer','draw'].includes(a.mode))throw Error('Pick Answer it or Draw it.');
   f.prompts[p.id]={text,mode:a.mode,builtin:false,key:key(),seq:f.seq++};}
  else if(a.type==='finalePick'){need('finalePick');const i=f.picks[p.id].length,pair=f.pairs[p.id][i];
   if(!pair)throw Error('You already picked. Waiting for the others.');if(a.index!==undefined&&a.index!==i)throw Error('That pair changed. Pick from the current one.');
   const w=pair.find(id=>f.prompts[id].key===a.prompt);if(!w)throw Error('Pick one of the two prompts.');f.picks[p.id].push(w);}
  else if(a.type==='finaleEntry'){need('finalePlay');const g=groupOf(f,p.id);if(g<0)throw Error('You are watching this one.');if(f.entries[p.id])throw Error('Already sent.');
   const mode=f.prompts[f.played[g].writer].mode;let value;
   if(mode==='draw'){if(typeof a.value!=='string'||a.value.length>FINALE.drawMax||!a.value.startsWith('data:image/png;base64,'))throw Error('Submit a drawing.');value=a.value;}
   else{value=String(a.value||'').trim();if(!value)throw Error('Write an answer first.');if(value.length>FINALE.answerMax)throw Error(`Keep it to ${FINALE.answerMax} characters.`);}
   f.entries[p.id]={value,group:g,key:key(),seq:f.seq++};}
  else if(a.type==='finaleVote'){need('finaleVote');const id=Object.keys(f.entries).find(e=>f.entries[e].key===a.entry);
   if(!id||!alive(r,id))throw Error('Pick one of the entries.');if(id===p.id)throw Error('You can’t vote for your own entry.');
   const mine=f.votes[p.id]||=[];if(mine.includes(id))throw Error('You already voted for that one.');if(mine.length>=quota(r,p.id))throw Error('Your votes are locked.');mine.push(id);}
  else throw Error('Unknown action.');
  this.finaleProgress(r);
 };
 Game.prototype.action=function(r,p,a){
  if(typeof a?.type==='string'&&a.type.startsWith('finale')){this.finaleAction(r,p,a);this.emit(r);return;}
  if(r.game==='finale'&&r.finale&&isFinalePhase(r.phase)&&a?.type==='leave'){
   if(a.round!==undefined&&a.round!==r.round)throw Error('The round changed. Try again.');
   p.left=true;if(r.host===p.id)r.host=this.live(r)[0]?.id;this.finaleProgress(r);this.emit(r);return;
  }
  const out=prev.action.call(this,r,p,a);
  if(['rematch','lobby'].includes(a?.type)&&r.phase==='lobby')r.finale=null;
  return out;
 };
 // Views: only your own prompt and entry before the reveal. Pair votes are never sent to anyone.
 Game.prototype.view=function(r,p){const v=prev.view.call(this,r,p);if(r.game!=='finale'||!r.finale)return v;
  v.prompt='';v.answers={};v.submissionCount=0;v.finale=finaleView(r,p.id,this);return v;};
 const promptOut=(f,w)=>({key:f.prompts[w].key,text:f.prompts[w].text,mode:f.prompts[w].mode});
 function finaleView(r,me,g){const f=r.finale,live=f.players.filter(id=>alive(r,id)),phase=r.phase;
  const v={phase,chips:f.chips,size:f.size,mainPot:mainPot(f.size),votesEach:votesEach(f.size),limits:{prompt:FINALE.promptMax,answer:FINALE.answerMax},examples:FINALE_EXAMPLES,inGame:f.players.includes(me),
   promptsIn:live.filter(id=>f.prompts[id]).length,total:live.length};
  if(phase==='finaleWrite'){v.mine=f.prompts[me]&&!f.prompts[me].builtin?{text:f.prompts[me].text,mode:f.prompts[me].mode}:null;return v;}
  if(phase==='finalePick'){v.picked=live.filter(id=>f.picks[id].length>=f.pairs[id].length).length;
   if(me&&f.pairs[me]){const i=f.picks[me].length,pair=f.pairs[me][i];v.pick={index:i,count:f.pairs[me].length,pair:pair?pair.map(w=>promptOut(f,w)):null};}
   return v;}
  v.played=f.played.map(x=>({...promptOut(f,x.writer),size:x.group.length}));
  if(phase==='finalePlay'){const gi=groupOf(f,me);v.sent=live.filter(id=>f.entries[id]).length;v.playing=live.filter(id=>groupOf(f,id)>=0).length;
   v.mine=gi<0?null:{group:gi,prompt:promptOut(f,f.played[gi].writer),submitted:!!f.entries[me]};return v;}
  if(phase==='finaleVote'){const quotaMe=me?quota(r,me):0;v.entries=f.voteOrder.filter(id=>alive(r,id)).map(id=>({key:f.entries[id].key,group:f.entries[id].group,value:f.entries[id].value,mine:id===me}));
   v.myVotes=(f.votes[me]||[]).map(id=>f.entries[id].key);v.votesLeft=Math.max(0,quotaMe-v.myVotes.length);v.voted=live.filter(id=>(f.votes[id]||[]).length>=quota(r,id)).length;return v;}
  if(['result','finished'].includes(phase)&&f.totals){
   v.reveal={entries:Object.keys(f.totals).sort((a,b)=>f.totals[b]-f.totals[a]||f.entries[a].seq-f.entries[b].seq).map(id=>({player:id,group:f.entries[id].group,value:f.entries[id].value,votes:f.totals[id]})),
    winners:f.winners,toilet:f.toilet,best:f.best,pot:f.pot,awards:f.awards,granted:f.granted,
    played:f.played.map(x=>({text:f.prompts[x.writer].text,mode:f.prompts[x.writer].mode,writer:f.prompts[x.writer].builtin?null:x.writer})),
    prompts:f.ranking.map(w=>({text:f.prompts[w].text,mode:f.prompts[w].mode,writer:f.prompts[w].builtin?null:w,wins:f.wins?.[w]||0,seen:f.seen?.[w]||0}))};
  }
  return v;}
}
