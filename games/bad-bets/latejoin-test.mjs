// Late join: the waiting line, seating at round breaks, median chips, the free first round, cutoff, cap, and cloud storage.
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from './server.mjs';
import {cloudRequest} from './cloud-game.mjs';
import {medianChips,LATE} from './latejoin.mjs';

const lobby=(n=4,mode='tournament')=>{const g=new Game(),events=[];g.onMetrics=c=>events.push(c);const a=g.create('Host',mode),r=g.rooms.get(a.code);for(let i=1;i<n;i++)g.join(a.code,'P'+i);r.banEnabled=false;return {g,r,p:r.players,events,code:a.code};};
const host=r=>r.players.find(p=>p.id===r.host);
const chipsTotal=r=>r.players.reduce((t,p)=>t+p.chips,0);
const byToken=(r,t)=>r.players.find(p=>p.token===t);
// Plays the room forward until stop(r) is true (checked before every step). Everyone matches bets and answers.
function play(g,r,stop,{answer=(r,id,i)=>r.game==='number'?String(i*7):i%2?'pizza':'tacos',max=800}={}){
 for(let step=0;step<max;step++){
  if(stop(r))return r;
  const q=id=>r.players.find(x=>x.id===id);
  if(r.phase==='finished')break;
  if(r.phase==='wager'){g.action(r,q(r.pot.turn),{type:'potBet',move:'match',round:r.round,revision:r.pot.revision,confirmed:true});continue;}
  if(r.phase==='play'){for(const [i,id] of [...r.active].entries()){if(r.phase!=='play')break;if(r.submissions[id]===undefined)g.action(r,q(id),{type:'submit',value:answer(r,id,i),promptVersion:r.promptVersion||0});}continue;}
  if(r.phase==='herdVote'){for(const [i,id] of [...r.herd.voters].entries()){if(r.phase!=='herdVote')break;if(!r.herd.votes[id]&&r.active.includes(id))g.action(r,q(id),{type:'herdVote',side:i%3?'a':'b'});}continue;}
  if(r.phase==='result'){g.action(r,host(r),{type:'next'});continue;}
  g.advance(r);
 }
 assert.ok(stop(r),`stopped at ${r.phase} round ${r.round}`);return r;
}
const party=(n=4,rounds=9)=>{const x=lobby(n);x.r.enabledGames=['brain','number'];x.r.brainRounds=0;x.r.totalRounds=rounds;x.g.action(x.r,x.p[0],{type:'start'});return x;};
const atResult=round=>r=>r.phase==='result'&&r.round===round;
const inPlay=round=>r=>r.round===round&&!['result','finished'].includes(r.phase);

test('median chips: middle stack, even counts average the middle two, rounded down',()=>{
 assert.equal(medianChips([10,30,20]),20);assert.equal(medianChips([10,20,30,41]),25);assert.equal(medianChips([0,0,7,200]),3);
 assert.equal(medianChips([5]),5);assert.equal(medianChips([]),100);assert.equal(medianChips([99,100]),99);
});

test('a late joiner waits and is seated only at a round break, with the median stack',()=>{
 const {g,r,code,events}=party(4);
 play(g,r,inPlay(2));
 const a=g.join(code,'Late');assert.equal(a.waiting,true);assert.equal(r.players.length,4);assert.equal(r.waiting.length,1);
 assert.equal(events.filter(e=>e.latejoin).length,1);
 const w=g.player(r,a.token),v=g.view(r,w);assert.equal(v.waiting.status,'round');assert.equal(v.waiting.next,3);
 assert.throws(()=>g.action(r,w,{type:'submit',value:'x'}),/Hang tight/);
 play(g,r,atResult(2));assert.equal(r.waiting.length,1,'never seated mid-round');
 const stacks=r.players.map(p=>p.chips),median=medianChips(stacks),issued=r.issuedChips||0;
 g.action(r,host(r),{type:'next'});
 const late=byToken(r,a.token);assert.ok(late,'seated at the break');assert.equal(r.waiting.length,0);
 assert.equal(late.chips,median);assert.equal(late.joinedRound,3);assert.equal(r.issuedChips,issued+median);
 assert.equal(g.view(r,late).waiting,undefined);assert.equal(g.view(r,host(r)).players.find(p=>p.id===late.id).joined,3);
});

test('the first round after seating is free: no chips at risk, then they play',()=>{
 // Round 4 is an everyone-plays round (round 3 is a two-player Spotlight), so everyone else is dealt in.
 const {g,r,code}=party(4);play(g,r,inPlay(3));const a=g.join(code,'Late');play(g,r,atResult(3));g.action(r,host(r),{type:'next'});
 const late=byToken(r,a.token),start=late.chips;
 play(g,r,r=>r.round===4&&!!r.pot&&r.phase!=='spin');assert.equal(r.spot,false);
 assert.ok(!r.contestants.includes(late.id),'sits out betting');assert.equal(r.stakes[late.id]||0,0);assert.equal(late.chips,start);
 assert.deepEqual([...r.contestants].sort(),g.live(r).filter(p=>p.id!==late.id&&p.chips+(r.stakes[p.id]||0)>=5).map(p=>p.id).sort(),'everyone else is still in');
 assert.equal(g.view(r,late).freeRound,true);
 play(g,r,atResult(4));assert.equal(late.chips,start,'no chips moved in the free round');
 g.action(r,host(r),{type:'next'});play(g,r,r=>r.round===5&&!!r.pot&&r.phase!=='spin');
 assert.ok(r.contestants.includes(late.id),'plays from the next round');assert.equal(g.view(r,late).freeRound,undefined);
});

test('cutoff: nobody is seated in the last 2 Party rounds; they wait for the rematch',()=>{
 const {g,r,code}=party(4,9);play(g,r,inPlay(7));
 const a=g.join(code,'Late');const w=g.player(r,a.token);assert.equal(g.view(r,w).waiting.status,'game');
 play(g,r,atResult(7));g.action(r,host(r),{type:'next'});assert.equal(r.round,8);assert.equal(r.waiting.length,1,'round 8 is inside the cutoff');
 play(g,r,r=>r.phase==='finished');assert.equal(r.waiting.length,1);assert.equal(g.view(r,w).waiting.status,'game');
 g.action(r,host(r),{type:'rematch'});const late=byToken(r,a.token);assert.ok(late);assert.equal(late.chips,100);assert.equal(late.joinedRound,undefined);
 assert.ok(r.players.every(p=>p.chips===100));assert.equal(r.phase,'lobby');
 // A 6-round game seats through round 4 and stops at round 5.
 const b=party(4,6);play(b.g,b.r,inPlay(3));b.g.join(b.code,'Early');play(b.g,b.r,atResult(3));b.g.action(b.r,host(b.r),{type:'next'});assert.equal(b.r.waiting.length,0);
 play(b.g,b.r,inPlay(4));b.g.join(b.code,'Later');play(b.g,b.r,atResult(4));b.g.action(b.r,host(b.r),{type:'next'});assert.equal(b.r.waiting.length,1);
});

test('cap and queue: late joiners count toward 12; past it they line up in order for the next game',()=>{
 const {g,r,code}=party(12);play(g,r,inPlay(2));
 const a=g.join(code,'Line1'),b=g.join(code,'Line2');
 const va=g.view(r,g.player(r,a.token)).waiting,vb=g.view(r,g.player(r,b.token)).waiting;
 assert.deepEqual([va.status,va.line,vb.status,vb.line],['full',1,'full',2]);
 assert.deepEqual(g.view(r,host(r)).waitingList.map(x=>x.name),['Line1','Line2']);
 play(g,r,atResult(2));const leaver=r.players.find(p=>p.id!==r.host);g.action(r,leaver,{type:'leave'});
 g.action(r,host(r),{type:'next'});assert.ok(byToken(r,a.token),'first in line takes the open seat');assert.ok(!byToken(r,b.token));
 assert.equal(g.live(r).length,12);assert.equal(g.view(r,g.player(r,b.token)).waiting.line,1);
 for(let i=0;i<LATE.maxWaiting-1;i++)g.join(code,'Q'+i);assert.throws(()=>g.join(code,'TooMany'),/line is full/);
 assert.throws(()=>g.join(code,'line2'),/taken/);
});

test('chips balance over a full 9-round game with a late joiner',()=>{
 const {g,r,code}=party(4,9);play(g,r,inPlay(2));const a=g.join(code,'Late');
 play(g,r,r=>r.phase==='finished');const late=byToken(r,a.token);assert.ok(late);assert.equal(r.history.length,9);
 assert.equal(chipsTotal(r),400+(r.issuedChips||0));assert.ok(r.issuedChips>=late.joinedRound&&r.issuedChips>0);
 const v=g.view(r,late);assert.equal(v.players.find(p=>p.id===late.id).joined,3);assert.ok(Array.isArray(v.awards));
});

test('Quick 1v1 and Date Night stay closed to late joiners (and are still counted)',()=>{
 const q=new Game(),ev=[];q.onMetrics=c=>ev.push(c);const qa=q.create('A','minigames','hoops','draft');const qr=q.rooms.get(qa.code);q.join(qa.code,'B');q.action(qr,qr.players[0],{type:'start'});
 assert.throws(()=>q.join(qa.code,'C'),/full|has started/);
 const {g,r,p,code,events}=lobby(2);g.action(r,p[0],{type:'configure',mode:'mixer',deck:'date'});g.action(r,p[0],{type:'start'});
 assert.throws(()=>g.join(code,'Third'),/has started/);assert.equal(events.filter(e=>e.latejoin).length,1);assert.equal(r.waiting,undefined);
});

test('host switch: late joining is on by default, host-only, lobby-only; off refuses late joins',()=>{
 const {g,r,p,code}=lobby(3);assert.equal(g.view(r,p[0]).lateJoin.on,true);
 assert.throws(()=>g.action(r,p[1],{type:'lateJoin',enabled:false}),/host/);
 g.action(r,p[0],{type:'lateJoin',enabled:false});assert.equal(g.view(r,p[1]).lateJoin.on,false);
 g.action(r,p[0],{type:'start'});assert.throws(()=>g.action(r,p[0],{type:'lateJoin',enabled:true}),/lobby/);
 assert.throws(()=>g.join(code,'Late'),/turned off late joining/);
});

test('the host can remove a waiting player; a waiting player can leave; nobody else is touched',()=>{
 const {g,r,p,code}=party(4);play(g,r,inPlay(2));const a=g.join(code,'Late'),b=g.join(code,'Other');
 assert.throws(()=>g.action(r,p[1],{type:'removeWaiting',player:r.waiting[0].id}),/host/);
 g.action(r,host(r),{type:'removeWaiting',player:r.waiting[0].id});assert.deepEqual(r.waiting.map(w=>w.name),['Other']);
 assert.throws(()=>g.player(r,a.token),/unavailable/);
 g.action(r,g.player(r,b.token),{type:'leave'});assert.equal(r.waiting.length,0);assert.equal(r.players.length,4);
});

test('Minigames: seated at the next replay, but a Draft replay waits for the lobby',()=>{
 const {g,r,p,code}=lobby(3,'minigames');g.action(r,p[0],{type:'selectGame',game:'number'});g.action(r,p[0],{type:'start'});
 const a=g.join(code,'Late');assert.equal(g.view(r,g.player(r,a.token)).waiting.status,'round');
 g.action(r,p[0],{type:'beginGame'});r.active.forEach((id,i)=>g.action(r,r.players.find(x=>x.id===id),{type:'submit',value:String(i)}));assert.equal(r.phase,'result');
 g.action(r,p[0],{type:'replay'});assert.ok(byToken(r,a.token));assert.ok(r.active.includes(byToken(r,a.token).id),'Minigames has no chips, so they play right away');
 const d=lobby(4,'minigames');d.g.action(d.r,d.p[0],{type:'selectGame',game:'draft'});d.g.action(d.r,d.p[0],{type:'start'});
 const b=d.g.join(d.code,'Late');assert.equal(d.g.view(d.r,d.g.player(d.r,b.token)).waiting.status,'game');
 d.r.phase='result';d.g.action(d.r,d.p[0],{type:'replay'});assert.equal(d.r.waiting.length,1,'never dealt into a draft replay');
 d.r.phase='result';d.g.action(d.r,d.p[0],{type:'lobby'});assert.ok(byToken(d.r,b.token));assert.equal(d.r.waiting.length,0);
});

test('a player who stopped polling stays in line instead of becoming an empty seat',()=>{
 const {g,r,code}=party(4);play(g,r,inPlay(2));const a=g.join(code,'Gone');r.waiting[0].lastSeen=Date.now()-LATE.seenMs-1;
 play(g,r,atResult(2));g.action(r,host(r),{type:'next'});assert.equal(r.waiting.length,1);assert.ok(!byToken(r,a.token));
});

class Store{data=new Map();log=[];async get(k){this.log.push('GET');return this.data.get(k)??null;}async compareAndSwap(k,b,a){this.log.push('CAS');if((this.data.get(k)??null)!==(b||null)&&!(b===null&&!this.data.has(k)))return false;this.data.set(k,a);return true;}async incrementMetrics(){this.log.push('METRICS');}}
test('cloud path: the waiting line is stored in the room, polls cost one GET, seating survives a round trip',async()=>{
 const s=new Store(),h=await cloudRequest(s,{type:'create',name:'Host',mode:'tournament'});
 for(let i=0;i<3;i++)await cloudRequest(s,{type:'join',code:h.code,name:'G'+i});
 await cloudRequest(s,{...h,type:'banSetting',enabled:false});await cloudRequest(s,{...h,type:'start'});
 const late=await cloudRequest(s,{type:'join',code:h.code,name:'Late'});assert.equal(late.waiting,true);
 let room=JSON.parse(s.data.get(h.code));assert.equal(room.waiting.length,1);assert.equal(room.waiting[0].name,'Late');assert.equal(room.players.length,4);
 const before=s.log.length,v=await cloudRequest(s,late,{state:true});assert.deepEqual(s.log.slice(before),['GET']);
 assert.equal(v.waiting.status,'round');assert.equal(v.you,room.waiting[0].id);assert.equal(JSON.stringify(v).includes(late.token),false);
 const tv=await cloudRequest(s,{code:h.code,token:room.displayToken},{state:true});assert.equal(tv.lateJoin.round,1);assert.equal(tv.waitingList,undefined);
 await assert.rejects(cloudRequest(s,{...late,type:'submit',value:'x'}),/Hang tight/);
 room=JSON.parse(s.data.get(h.code));room.phase='result';room.deadline=null;room.potSettled=true;s.data.set(h.code,JSON.stringify(room));
 await cloudRequest(s,{...h,type:'next'});room=JSON.parse(s.data.get(h.code));
 assert.equal(room.waiting.length,0);const seat=room.players.find(p=>p.name==='Late');assert.equal(seat.joinedRound,2);assert.equal(seat.freeRound,2);
 const after=await cloudRequest(s,late,{state:true});assert.equal(after.waiting,undefined);assert.equal(after.you,seat.id);
});
