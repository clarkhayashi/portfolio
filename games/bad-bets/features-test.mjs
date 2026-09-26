// Funnel counts, the house round, end-of-night awards, and the Family / Adults switch with host controls.
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from './server.mjs';
import {cloudRequest} from './cloud-game.mjs';
import {bucket,BUCKETS,FIELDS,cleanCounts,dayKey,metricsKey,statsBody,hashCounts,flushMetrics,METRICS_SCRIPT,resetLocalMetrics,localMetrics} from './metrics.mjs';
import {computeAwards,roundStats} from './awards.mjs';
import {TEACH_LINE,houseGame} from './house.mjs';
import {render as tvRender} from './public/display.js';
import {summarize,ratio,renderStats} from './public/stats.js';
import statsHandler from './api/stats.mjs';

const lobby=(n=4,mode='tournament')=>{const g=new Game(),events=[];g.onMetrics=c=>events.push(c);const a=g.create('Host',mode),r=g.rooms.get(a.code);for(let i=1;i<n;i++)g.join(a.code,'P'+i);return {g,r,p:r.players,events};};
const host=r=>r.players.find(p=>p.id===r.host);
const chipsTotal=r=>r.players.reduce((t,p)=>t+p.chips,0);
// Plays a Party game to the end with scripted answers. answer(r,id,i) returns what player i submits.
function drive(g,r,{answer=(r,id,i)=>r.game==='number'?String(i):'pizza',side=()=> 'a',max=600}={}){
 for(let step=0;step<max&&r.phase!=='finished';step++){
  const q=id=>r.players.find(x=>x.id===id),h=host(r);
  if(r.phase==='wager'){g.action(r,q(r.pot.turn),{type:'potBet',move:'match',round:r.round,revision:r.pot.revision,confirmed:true});continue;}
  if(r.phase==='play'){for(const [i,id] of [...r.active].entries()){if(r.phase!=='play')break;if(r.submissions[id]===undefined)g.action(r,q(id),{type:'submit',value:answer(r,id,i),promptVersion:r.promptVersion||0});}continue;}
  if(r.phase==='herdVote'){for(const [i,id] of [...r.herd.voters].entries()){if(r.phase!=='herdVote')break;if(!r.herd.votes[id]&&r.active.includes(id))g.action(r,q(id),{type:'herdVote',side:side(r,id,i)});}continue;}
  if(r.phase==='result'){g.action(r,h,{type:'next'});continue;}
  g.advance(r);
 }
 assert.equal(r.phase,'finished');
}

// ---------- 1. funnel counts ----------
test('time to round 1 is stored in buckets only',()=>{
 assert.deepEqual([0,29.9,30,59,60,119,120,299,300,5000].map(bucket),['lt30','lt30','30to60','30to60','1to2m','1to2m','2to5m','2to5m','5mplus','5mplus']);
 assert.equal(bucket(NaN),'lt30');assert.deepEqual(BUCKETS.map(b=>FIELDS.includes(`ttfr:${b}`)),[true,true,true,true,true]);
});
test('counts carry no personal data: known fields and whole numbers only',()=>{
 assert.deepEqual(cleanCounts({'created:party':1,name:'Kai',code:'ABCD',share:2.5,tv:-1,rounds:'3',__proto__:{x:1}}),{'created:party':1,rounds:3});
 assert.equal(metricsKey(dayKey(Date.UTC(2026,8,25,23))),'oops:m:v1:2026-09-25');
 const {g,r,p,events}=lobby(3);r.banEnabled=false;r.enabledGames=['brain','number'];
 g.action(r,p[0],{type:'start'});drive(g,r);g.action(r,p[0],{type:'rematch'});
 const all=events.flatMap(e=>Object.entries(e));
 assert.ok(all.length>0);for(const [k,v] of all){assert.ok(FIELDS.includes(k),k);assert.ok(Number.isSafeInteger(v)&&v>0);}
 const json=JSON.stringify(events);for(const q of r.players){assert.ok(!json.includes(q.name));assert.ok(!json.includes(q.id));assert.ok(!json.includes(q.token));}assert.ok(!json.includes(r.code));
 const sum=k=>events.reduce((t,e)=>t+(e[k]||0),0);
 assert.equal(sum('created:party'),1);assert.equal(sum('started'),1);assert.equal(sum('ttfr:lt30'),1);assert.equal(sum('rounds'),9);assert.equal(sum('finished'),1);assert.equal(sum('rematch'),1);
 assert.ok(events.length<=7,`${events.length} sends`); // create, start, rounds 3 and 6, finish, rematch
});
test('late joins are counted and still refused; minigames and 1v1 are counted by mode',()=>{
 const {g,r,p,events}=lobby(2,'minigames');g.action(r,p[0],{type:'selectGame',game:'number'});g.action(r,p[0],{type:'start'});
 assert.throws(()=>g.join(r.code,'Late'),/has started/);assert.equal(events.filter(e=>e.latejoin).length,1);assert.equal(events[0]['created:minigames'],1);
 const x=new Game(),ev=[];x.onMetrics=c=>ev.push(c);x.create('A','minigames','hoops','draft',{newHost:true});assert.deepEqual(ev[0],{'created:quick':1,newhost:1});
});
// A tiny Redis stand-in that counts commands by kind.
class Store{constructor(){this.data=new Map();this.log=[];this.metrics=[];}async get(k){this.log.push('GET');return this.data.get(k)??null;}async compareAndSwap(k,b,a){this.log.push('CAS');if((this.data.get(k)??null)!==(b||null)&&!(b===null&&!this.data.has(k)))return false;this.data.set(k,a);return true;}async incrementMetrics(day,counts){this.log.push('METRICS');this.metrics.push(counts);}}
test('state polls never send metrics; a game costs a handful of metric commands',async()=>{
 const s=new Store();const h=await cloudRequest(s,{type:'create',name:'Host',mode:'tournament',newHost:true});
 const guests=[];for(let i=0;i<3;i++)guests.push(await cloudRequest(s,{type:'join',code:h.code,name:'G'+i}));
 assert.deepEqual(s.metrics[0],{'created:party':1,newhost:1});
 await cloudRequest(s,{...h,type:'banSetting',enabled:false});await cloudRequest(s,{...h,type:'start'});
 const polls=async()=>{const before=s.log.filter(x=>x==='METRICS').length;for(const q of [h,...guests])await cloudRequest(s,q,{state:true});assert.equal(s.log.filter(x=>x==='METRICS').length,before,'a poll sent metrics');};
 await polls();
 // An overdue timer advanced on a poll: its counts wait in the room for the next action.
 let room=JSON.parse(s.data.get(h.code));room.deadline=Date.now()-1;s.data.set(h.code,JSON.stringify(room));await polls();
 room=JSON.parse(s.data.get(h.code));room.phase='result';room.mt.p={rounds:1};room.deadline=null;s.data.set(h.code,JSON.stringify(room));
 await polls();const n=s.metrics.length;await cloudRequest(s,{...h,type:'next'});assert.equal(s.metrics.length,n+1);assert.deepEqual(s.metrics.at(-1),{rounds:1});assert.equal(JSON.parse(s.data.get(h.code)).mt.p,undefined);
 // Refused late join: counted once, no room write.
 const writes=s.log.filter(x=>x==='CAS').length;await assert.rejects(cloudRequest(s,{type:'join',code:h.code,name:'Late'}),/started/);
 assert.equal(s.log.filter(x=>x==='CAS').length,writes);assert.deepEqual(s.metrics.at(-1),{latejoin:1});
});
test('metrics sends are one EVAL; the read endpoint is one EVAL and cacheable',async()=>{
 assert.ok(METRICS_SCRIPT.includes('HINCRBY')&&METRICS_SCRIPT.includes('EXPIRE'));
 const sent=[];await flushMetrics({incrementMetrics:(d,c)=>sent.push([d,c])},[{share:1},{share:1,rounds:2},{bad:5}]);assert.deepEqual(sent[0][1],{share:2,rounds:2});
 await flushMetrics({incrementMetrics:()=>{throw Error('down');}},[{share:1}]); // never throws
 const body=statsBody([['2026-09-25',['created:party','3','ttfr:lt30','2','evil','9']]]);assert.deepEqual(body.days[0].counts,{'created:party':3,'ttfr:lt30':2});
 assert.deepEqual(hashCounts({share:'4'}),{share:4});
 const env={UPSTASH_REDIS_REST_URL:'https://redis.invalid',UPSTASH_REDIS_REST_TOKEN:'t'};Object.assign(process.env,env);const real=globalThis.fetch,seen=[];
 globalThis.fetch=async(url,init)=>{const a=JSON.parse(init.body);seen.push(a[0]);return new Response(JSON.stringify({result:a[0]==='EVAL'&&a[1].includes('HGETALL')?a.slice(3,3+a[2]).map(()=>['share','1']):1}),{status:200});};
 try{
  let out='',headers={};const res={statusCode:200,setHeader(k,v){headers[k]=v;},end(s){out=s;}};
  await statsHandler({method:'GET',url:'/api/stats?days=14',headers:{host:'x'}},res);
  assert.deepEqual(seen,['EVAL']);assert.match(headers['Cache-Control'],/s-maxage=60/);const b=JSON.parse(out);assert.equal(b.days.length,14);assert.equal(b.days[0].counts.share,1);
  seen.length=0;const res2={statusCode:200,setHeader(){},end(){}};
  await statsHandler({method:'POST',url:'/api/stats',headers:{host:'x',origin:'https://x'},body:{event:'share'}},res2);assert.equal(res2.statusCode,204);assert.deepEqual(seen,['EVAL']);
  const res3={statusCode:200,setHeader(){},end(){}};await statsHandler({method:'POST',url:'/api/stats',headers:{host:'x',origin:'https://x'},body:{event:'created:party'}},res3);assert.equal(res3.statusCode,400);
  const res4={statusCode:200,setHeader(){},end(){}};await statsHandler({method:'POST',url:'/api/stats',headers:{host:'x',origin:'https://evil'},body:{event:'share'}},res4);assert.equal(res4.statusCode,403);
 }finally{globalThis.fetch=real;}
});
test('stats page math: round 1 within 60 s, rematch and share rates',()=>{
 const days=[{day:'2026-09-25',counts:{'created:party':3,'created:minigames':1,'ttfr:lt30':1,'ttfr:30to60':1,'ttfr:5mplus':1,started:3,finished:2,rematch:1,share:1}},{day:'2026-09-24',counts:{}}];
 const s=summarize(days);assert.equal(s.created,4);assert.equal(ratio(s.fast,s.created),'50%');assert.equal(ratio(s.rematch,s.finished),'50%');assert.equal(ratio(0,0),'None yet');
 const html=renderStats({days});assert.ok(html.includes('Rematch rate')&&html.includes('Round 1 within 60 s')&&html.includes('09-25'));assert.ok(!/\u2014/.test(html));
 resetLocalMetrics();const g=new Game();g.create('A','tournament');assert.equal(localMetrics(1).days[0].counts['created:party'],1);
});

// ---------- 2. the first 60 seconds ----------
test('Party round 1 is a house round: easiest game, no chips, no betting, no game vote',()=>{
 for(const [n,expect] of [[4,'brain'],[2,'number']]){
  const {g,r,p}=lobby(n);r.banEnabled=true;g.action(r,p[0],{type:'start'});
  assert.equal(r.round,1);assert.equal(r.phase,'reveal');assert.equal(r.game,expect);assert.equal(r.pot,null);assert.equal(r.house,true);assert.equal(r.herd,null);
  const v=g.view(r,p[1]);assert.equal(v.house,true);assert.equal(v.free,true);assert.equal(v.teach,null);assert.ok(v.prompt);
  assert.throws(()=>g.action(r,p[1],{type:'beginGame'}),/host/);g.action(r,p[0],{type:'beginGame'});assert.equal(r.phase,'play'); // host can skip the intro
  r.active.forEach((id,i)=>g.action(r,r.players.find(q=>q.id===id),{type:'submit',value:expect==='brain'?'pizza':String(i)}));
  assert.equal(r.phase,'result');assert.equal(r.result.house,true);assert.deepEqual(r.result.changes,{});assert.equal(chipsTotal(r),100*n);assert.ok(r.players.every(q=>q.chips===100));
 }
});
test('round 2 opens betting with the teach card, once per room; total rounds and chips hold',()=>{
 const {g,r,p}=lobby(4);r.banEnabled=false;r.enabledGames=['number'];g.action(r,p[0],{type:'start'});
 g.advance(r);r.active.forEach((id,i)=>g.action(r,r.players.find(q=>q.id===id),{type:'submit',value:String(i)}));g.action(r,p[0],{type:'next'});
 assert.equal(r.round,2);assert.equal(r.phase,'spin');assert.ok(r.pot);assert.equal(g.view(r,p[1]).teach,TEACH_LINE);assert.equal(g.publicView(r).teach,TEACH_LINE);
 g.advance(r);assert.equal(r.phase,'wager');assert.equal(g.view(r,p[2]).teach,TEACH_LINE);
 drive(g,r,{answer:(r,id,i)=>String(i*3)});assert.equal(r.history.length,9);assert.equal(chipsTotal(r),400+(r.issuedChips||0));
 g.action(r,p[0],{type:'rematch',now:true});assert.equal(r.house,true);g.advance(r);r.active.forEach((id,i)=>g.action(r,r.players.find(q=>q.id===id),{type:'submit',value:String(i)}));g.action(r,p[0],{type:'next'});
 assert.equal(r.round,2);assert.ok(r.pot);assert.equal(g.view(r,p[1]).teach,null,'shown once per room');
});
test('house round respects the host game list and can be switched off for tests',()=>{
 assert.equal(houseGame({enabledGames:['number','draw']},5),'number');assert.equal(houseGame({enabledGames:['draw','quips']},5),null);
 const {g,r,p}=lobby(4);r.banEnabled=false;r.enabledGames=['imposter','quips'];g.action(r,p[0],{type:'start'});assert.equal(r.house,false);assert.ok(r.pot);
 const x=lobby(3);x.r.banEnabled=false;x.r.opener=false;x.g.action(x.r,x.p[0],{type:'start'});assert.equal(x.r.house,false);
});
test('leaving the house round drops the player without touching chips',()=>{
 const {g,r,p}=lobby(4);r.banEnabled=false;g.action(r,p[0],{type:'start'});g.advance(r);g.action(r,p[3],{type:'leave',round:1});
 assert.equal(r.phase,'play');assert.equal(r.active.length,3);r.active.forEach(id=>g.action(r,r.players.find(q=>q.id===id),{type:'submit',value:'taco'}));assert.equal(r.phase,'result');assert.ok(r.players.every(q=>q.chips===100));
});

// ---------- 3. end-of-night awards ----------
test('awards come from what the room played: Party with Herd, Ballpark and Same Brain',()=>{
 const {g,r,p}=lobby(5);r.banEnabled=false;r.enabledGames=['brain','number'];r.totalRounds=6;r.brainRounds=1; // the next betting Same Brain is a Herd round
 const [a,b,c,d,e]=p.map(q=>q.id);
 g.action(r,p[0],{type:'start'});
 // Same Brain answers: Host and P1 always match. Ballpark: P2 is always closest. Herd: P4 always alone on B.
 drive(g,r,{answer:(r,id)=>r.game==='number'?String(r.answer+(id===c?0:id===a?50:100)):[a,b].includes(id)?'pizza':'x'+id.slice(0,4),side:(r,id)=>id===e?'b':'a'});
 const aw=g.view(r,p[0]).awards,byId=Object.fromEntries(aw.map(x=>[x.id,x]));
 assert.ok(aw.length>=3&&aw.length<=5,JSON.stringify(aw.map(x=>x.id)));
 assert.equal(aw[0].id,'leader');
 assert.ok(r.history.some(h=>h.game==='brain'&&h.s.sh),'a Herd round was played');
 assert.deepEqual(byId.sharp.players,[c]);assert.deepEqual([...byId.brain.players].sort(),[a,b].sort());assert.deepEqual(byId.sheep.players,[e]);assert.equal(byId.sheep.line,'Alone on their side once');
 assert.ok(!byId.crowd&&!byId.bluff,'never invent awards for games nobody played');
 for(const x of aw){assert.ok(x.players.length>=1&&x.players.length<=3);assert.ok(!/\u2014/.test(x.line+x.title));}
 const tv=tvRender(g.publicView(r)).html;assert.ok(tv.includes('Tonight’s awards')&&tv.includes(aw[0].title));
});
test('award facts: votes, bluffs, all ins and big bets; ties list both; too many ties are skipped',()=>{
 const players=['a','b','c','d'].map(id=>({id,name:id.toUpperCase(),chips:100,left:false}));
 const r={mode:'tournament',players,history:[
  {round:1,s:{v:{a:3,b:1},bl:'c',a:['d'],b:['d',60]}},{round:2,s:{v:{b:1},bl:'c',n:['a','b']}},{round:3,s:{n:['a','b'],m:['a','b','c','d']}}]};
 players[0].chips=150;
 const aw=computeAwards(r),by=Object.fromEntries(aw.map(x=>[x.id,x]));
 assert.deepEqual(by.leader.players,['a']);assert.deepEqual(by.crowd.players,['a']);assert.equal(by.crowd.line,'3 votes from the judges');
 assert.deepEqual(by.bluff.players,['c']);assert.equal(by.bluff.line,'Got away as the imposter twice');
 assert.deepEqual(by.allin.players,['d']);assert.equal(by.bigbet,undefined,'All In Energy replaces Biggest Bet');
 assert.deepEqual(by.sharp.players,['a','b'],'a tie names both');
 assert.equal(aw.length,5);assert.equal(by.brain,undefined,'four-way tie is not an award (and the list is capped at 5)');
 const big=computeAwards({mode:'tournament',players,history:[{round:1,s:{b:['b',40]}},{round:2,s:{b:['c',25]}}]});assert.deepEqual(big.find(x=>x.id==='bigbet').players,['b']);
 assert.deepEqual(computeAwards({mode:'minigames',players,history:[]}),[]);
});
test('round facts are recorded once per settled round, including herd sheep and imposter escapes',()=>{
 assert.deepEqual(roundStats({forceDraw:true,result:{winners:['a']}}),{});
 assert.deepEqual(roundStats({game:'imposter',imposter:'c',result:{winners:['c'],tie:false}}),{w:['c'],bl:'c'});
 assert.deepEqual(roundStats({game:'brain',herd:{outcome:{sheep:'e',cancelled:false}},result:{winners:['a','b'],tie:false}}).sh,'e');
 assert.deepEqual(roundStats({game:'number',result:{winners:['a'],distances:{a:1,b:4,c:null}}}).n,['a']);
});
test('Minigames: the host ends the night to see awards on phone and TV',()=>{
 const {g,r,p}=lobby(3,'minigames');g.action(r,p[0],{type:'selectGame',game:'number'});
 for(let i=0;i<3;i++){if(i)g.action(r,p[0],{type:'replay'});else g.action(r,p[0],{type:'start'});g.action(r,p[0],{type:'beginGame'});r.active.forEach(id=>g.action(r,r.players.find(q=>q.id===id),{type:'submit',value:String(r.answer+(id===p[1].id?0:9))}));}
 assert.throws(()=>g.action(r,p[1],{type:'endNight'}),/host/);g.action(r,p[0],{type:'endNight'});assert.equal(r.phase,'finished');
 const aw=g.view(r,p[2]).awards;assert.deepEqual(aw.map(x=>x.id),['wins','sharp']);assert.deepEqual(aw[0].players,[p[1].id]);assert.equal(aw[0].line,'Won 3 rounds');
 const tv=tvRender(g.publicView(r)).html;assert.ok(tv.includes('Good game, everyone!')&&tv.includes('Most Wins')&&!tv.includes('100 chips'));
 const q=lobby(2,'minigames');q.r.quick=true;q.g.action(q.r,q.p[0],{type:'selectGame',game:'number'});q.g.action(q.r,q.p[0],{type:'start'});q.g.advance(q.r);q.r.active.forEach(id=>q.g.action(q.r,q.r.players.find(x=>x.id===id),{type:'submit',value:'1'}));assert.throws(()=>q.g.action(q.r,q.p[0],{type:'endNight'}));
});

// ---------- 4. Family / Adults and host controls ----------
test('Family is the default: adult packs hidden and locked until the host picks Adults',()=>{
 const {g,r,p}=lobby(3);assert.equal(r.audience,'family');const v=g.view(r,p[1]);assert.equal(v.audience,'family');assert.ok(v.packOptions.every(o=>!o.adult));
 assert.throws(()=>g.action(r,p[0],{type:'setPacks',packs:['spicy']}),/Adults/);
 assert.throws(()=>g.action(r,p[1],{type:'setAudience',audience:'adults'}),/host/);assert.throws(()=>g.action(r,p[0],{type:'setAudience',audience:'teens'}));
 g.action(r,p[0],{type:'setAudience',audience:'adults'});assert.ok(g.view(r,p[1]).packOptions.some(o=>o.adult));assert.ok(!r.packs.includes('spicy'),'Adults never turns packs on by itself');
 g.action(r,p[0],{type:'setPacks',packs:[...r.packs,'spicy']});assert.ok(r.packs.includes('spicy'));
 g.action(r,p[0],{type:'setAudience',audience:'family'});assert.ok(!r.packs.includes('spicy'));assert.equal(g.view(r,p[2]).audience,'family');
 g.action(r,p[0],{type:'start'});assert.throws(()=>g.action(r,p[0],{type:'setAudience',audience:'adults'}),/lobby/);
});
test('Family runs the strict word filter on typed text and names; Adults blocks slurs only',()=>{
 const fam=lobby(3);assert.throws(()=>fam.g.join(fam.r.code,'Shit Lord'),/family friendly/);
 fam.r.banEnabled=false;fam.g.action(fam.r,fam.p[0],{type:'start'});fam.g.advance(fam.r);assert.equal(fam.r.game,'brain');
 assert.throws(()=>fam.g.action(fam.r,fam.p[1],{type:'submit',value:'bullsh1t',promptVersion:0}),/family friendly/);
 fam.g.action(fam.r,fam.p[1],{type:'submit',value:'class assignment',promptVersion:0});
 const ad=lobby(3);ad.g.action(ad.r,ad.p[0],{type:'setAudience',audience:'adults'});ad.r.banEnabled=false;ad.g.action(ad.r,ad.p[0],{type:'start'});ad.g.advance(ad.r);
 ad.g.action(ad.r,ad.p[1],{type:'submit',value:'damn good pizza',promptVersion:0});assert.throws(()=>ad.g.action(ad.r,ad.p[2],{type:'submit',value:'n1gger',promptVersion:0}),/slur/);
 assert.throws(()=>ad.g.action(ad.r,ad.p[0],{type:'addCustom',kind:'brain',value:'x'}));
});
test('host can pause and resume any timed step, including a betting turn, without leaking the prompt',()=>{
 const {g,r,p}=lobby(3);r.banEnabled=false;r.opener=false;r.enabledGames=['number'];g.action(r,p[0],{type:'start'});g.advance(r);assert.equal(r.phase,'wager');
 assert.throws(()=>g.action(r,p[1],{type:'pauseRound'}),/host/);
 const left=r.deadline-Date.now();g.action(r,p[0],{type:'pauseRound'});assert.equal(r.phase,'paused');assert.equal(r.deadline,null);g.tick();assert.equal(r.phase,'paused');
 assert.equal(g.view(r,p[1]).prompt,'');assert.equal(g.view(r,p[1]).pausedFrom,'wager');
 assert.throws(()=>g.action(r,r.players.find(q=>q.id===r.pot.turn),{type:'potBet',move:'match',round:r.round,revision:r.pot.revision}),/paused/);
 g.action(r,p[0],{type:'resumeRound'});assert.equal(r.phase,'wager');assert.ok(Math.abs((r.deadline-Date.now())-left)<1500);
 assert.equal(g.view(r,p[0]).canPause,true);
});
test('host can swap the prompt in Same Brain, Ballpark, Bad Answers and drawing rounds; stale answers are refused',()=>{
 const {g,r,p}=lobby(3);r.banEnabled=false;g.action(r,p[0],{type:'start'});g.advance(r);assert.equal(r.game,'brain');
 g.action(r,p[1],{type:'submit',value:'taco',promptVersion:0});const old=r.prompt;
 assert.equal(g.view(r,p[0]).canSkip,true);assert.throws(()=>g.action(r,p[1],{type:'skipPrompt'}),/host/);
 g.action(r,p[0],{type:'skipPrompt'});assert.notEqual(r.prompt,old);assert.deepEqual(r.submissions,{});assert.equal(r.phase,'play');assert.equal(r.promptVersion,1);
 assert.throws(()=>g.action(r,p[2],{type:'submit',value:'late',promptVersion:0}),/prompt changed/);
 const n=lobby(3,'minigames');n.g.action(n.r,n.p[0],{type:'selectGame',game:'number'});n.g.action(n.r,n.p[0],{type:'start'});n.g.action(n.r,n.p[0],{type:'beginGame'});
 const before=[n.r.prompt,n.r.answer];n.g.action(n.r,n.p[0],{type:'pauseRound'});n.g.action(n.r,n.p[0],{type:'skipPrompt'});assert.equal(n.r.phase,'play');assert.notDeepEqual([n.r.prompt,n.r.answer],before);
 const im=lobby(4,'minigames');im.g.action(im.r,im.p[0],{type:'selectGame',game:'imposter'});im.g.action(im.r,im.p[0],{type:'start'});im.g.action(im.r,im.p[0],{type:'beginGame'});assert.throws(()=>im.g.action(im.r,im.p[0],{type:'skipPrompt'}),/swapped/);
});
test('a player can still leave while the game is paused',()=>{
 const {g,r,p}=lobby(4);r.banEnabled=false;g.action(r,p[0],{type:'start'});g.advance(r);g.action(r,p[0],{type:'pauseRound'});
 g.action(r,p[3],{type:'leave',round:r.round});assert.equal(r.phase,'play');assert.equal(r.active.length,3);
});
