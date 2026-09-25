import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game} from './server.mjs';
import {quips,creativeGames} from './creative.mjs';
const setup=(n=4,game='quips',mode='minigames')=>{const g=new Game(),a=g.create('Host',mode),r=g.rooms.get(a.code);for(let i=1;i<n;i++)g.join(a.code,'Guest '+i);r.selectedGame=game;r.banEnabled=false;g.action(r,r.players[0],{type:'start'});if(mode==='minigames')g.begin(r);return {g,r,p:r.players};};
const auction=(g,r,p,a)=>g.action(r,p,{...a,revision:r.auction.revision});
test('60 unique original prompts',()=>{assert.equal(quips.length,60);assert.equal(new Set(quips).size,60);});
test('standalone quips hides answers, supports eight writers and forbids self-voting',()=>{const {g,r,p}=setup(8);p.forEach((q,i)=>{assert.deepEqual(g.view(r,q).answers,{});g.action(r,q,{type:'submit',value:'Answer '+i});});assert.equal(r.phase,'vote');assert.throws(()=>g.action(r,p[0],{type:'vote',player:p[0].id}));p.forEach((q,i)=>g.action(r,q,{type:'vote',player:p[(i+1)%8].id}));assert.equal(r.result.tie,true);});
test('legacy rooms preserve original missing-entry refund behavior',()=>{const {g,r,p}=setup();r.potVersion=1;r.mode='tournament';r.active=p.slice(0,2).map(p=>p.id);g.action(r,p[0],{type:'submit',value:'Hello'});g.advance(r);p.slice(2).forEach(q=>g.action(r,q,{type:'vote',player:p[0].id}));assert.equal(r.result.tie,true);});
test('skipped prompts reject stale answers and reset timer; pause stops ticking',()=>{const {g,r,p}=setup();const old=r.prompt;g.action(r,p[0],{type:'pauseRound'});assert.equal(r.deadline,null);g.tick();assert.equal(r.phase,'paused');g.action(r,p[0],{type:'skipPrompt'});assert.notEqual(r.prompt,old);assert.throws(()=>g.action(r,p[1],{type:'submit',value:'stale',promptVersion:0}));g.action(r,p[1],{type:'submit',value:'fresh',promptVersion:1});});
test('creative tournaments require four players but standalone supports two',()=>{const {g,r}=setup(3);r.mode='tournament';r.enabledGames=creativeGames;assert.equal(g.pool(r,true).length,0);const x=setup(2);x.p.forEach(q=>x.g.action(x.r,q,{type:'submit',value:'answer'}));assert.equal(x.r.result.tie,true);});
test('draft snake order fills four slots for eight players without duplicates',()=>{const {g,r}=setup(8,'draft');let turns=[];while(r.phase==='draft'){turns.push(g.draftPlayer(r));g.advance(r);}assert.equal(turns.length,32);assert.deepEqual(turns.slice(8,16),[...turns.slice(0,8)].reverse());assert.ok(r.active.every(id=>r.picks[id].length===4));});
test('auction all-pass and lone-player fallbacks complete all slots for 2,4,8',()=>{for(const n of [2,4,8]){const {g,r,p}=setup(n,'auction');let moves=0;while(r.phase==='auction'){assert.ok(moves++<150);const a=r.auction;if(a.pending.length){const pending=a.pending[0];auction(g,r,p.find(p=>p.id===pending.player),{type:'auctionItem',value:'My choice'});}else auction(g,r,p.find(p=>p.id===a.turn),{type:'auctionPass'});}assert.equal(r.phase,'pitch');assert.ok(r.active.every(id=>r.picks[id].length===4));assert.ok(Object.values(r.auction.budgets).every(n=>n===20));}});
test('auction bid charges once, rejects stale and out of turn, reserves future budget',()=>{const {g,r,p}=setup(2,'auction');let a=r.auction,q=p.find(p=>p.id===a.turn),other=p.find(p=>p!==q);assert.throws(()=>auction(g,r,other,{type:'auctionRaise'}));const revision=a.revision;auction(g,r,q,{type:'auctionRaise'});assert.throws(()=>g.action(r,q,{type:'auctionRaise',revision}));auction(g,r,other,{type:'auctionPass'});assert.equal(a.budgets[q.id],19);assert.equal(a.pending[0].player,q.id);auction(g,r,q,{type:'auctionItem',value:'Burger'});assert.equal(a.pending[0].player,other.id);});
test('comeback needs request, consent, host completion and can only happen once',()=>{const {g,r,p}=setup(4,'brain','tournament');g.phase(r,'result');p[1].chips=0;g.fresh(r);assert.equal(r.phase,'comeback');assert.throws(()=>g.action(r,p[0],{type:'comebackComplete'}));g.action(r,p[1],{type:'comebackRequest'});g.action(r,p[0],{type:'comebackDare',value:'Robot dance'});g.action(r,p[1],{type:'comebackAccept'});g.action(r,p[0],{type:'comebackComplete'});assert.equal(p[1].chips,20);assert.equal(p[1].comebackUsed,true);p[1].chips=0;g.fresh(r);assert.notEqual(r.phase,'comeback');});
test('comeback timeout never awards chips; fewer than two funded ends party',()=>{const {g,r,p}=setup(2,'brain','tournament');p.forEach(p=>p.chips=0);g.fresh(r);g.advance(r);g.advance(r);assert.equal(r.phase,'finished');assert.ok(p.every(p=>p.chips===0));});
test('public view never exposes secret roles or contestant submissions before reveal',()=>{const {g,r,p}=setup(4,'imposter');r.submissions[p[0].id]='hidden';const v=g.publicView(r);assert.equal(v.secret,null);assert.equal(v.displayToken,undefined);assert.equal(JSON.stringify(v).includes(p[0].token),false);assert.deepEqual(v.answers,{[p[0].id]:'hidden'});g.phase(r,'play');assert.deepEqual(g.publicView(r).answers,{});});
test('no immediate repeat when another compatible game remains',()=>{const {g,r}=setup(4,'brain','tournament');r.enabledGames=['brain','number'];r.previous='brain';r.candidates=['brain','number'];r.pot=null;g.choose(r);assert.equal(r.game,'number');});
test('physical review times out and unresolved disputes refund',()=>{const {g,r,p}=setup(2,'shadow');g.action(r,p[0],{type:'physicalStart',revision:0});g.action(r,p[0],{type:'physicalFinish',revision:r.physical.revision});assert.ok(r.deadline>Date.now());g.action(r,p[0],{type:'physicalDispute',revision:r.physical.revision});assert.equal(r.phase,'physicalDispute');g.advance(r);assert.equal(r.result.tie,true);});

test('complete nine-round sessions with the full catalog at 2, 3, 4 and 8 players',()=>{
 for(const count of [2,3,4,8]){
  const {g,r,p}=setup(count,'brain','tournament');
  let turns=0;
  while(r.phase!=='finished'){
   assert.ok(turns++<600,`${count} players stalled at ${r.phase}`);
   if(r.phase==='result'){g.action(r,p[0],{type:'next'});continue;}
   if(r.phase==='auction'){
    const a=r.auction;
    if(a.pending.length)auction(g,r,p.find(q=>q.id===a.pending[0].player),{type:'auctionItem',value:'My meal'});
    else auction(g,r,p.find(q=>q.id===a.turn),{type:'auctionPass'});
   }else if(r.phase==='entry'){
    p.filter(q=>q.chips>=5&&!r.eliminated.includes(q.id)).forEach(q=>g.action(r,q,{type:'entry',stay:true}));g.advance(r);
   }else if(r.phase==='play'){
    for(const id of [...r.active]){if(r.phase!=='play')break;g.action(r,p.find(q=>q.id===id),{type:'submit',value:r.game==='number'?r.answer:r.game==='draw'?'data:image/png;base64,abc':'pizza',promptVersion:r.promptVersion||0});}
   }else if(r.phase==='physicalSetup'){
    if(r.game==='rhythm')g.action(r,p[0],{type:'physicalCategory',value:'States',revision:r.physical.revision});g.action(r,p[0],{type:'physicalStart',revision:r.physical.revision});
   }else if(r.phase==='physical')g.action(r,p[0],{type:'physicalFinish',revision:r.physical.revision});
   else if(r.phase==='pitch'){r.deadline=1;g.tick();}
   else g.advance(r);
  }
  assert.equal(r.round,9);assert.ok(p.every(q=>Number.isFinite(q.chips)&&q.chips>=0));
 }
});

test('creative Party cancels immediately when a judge leaves and no independent replacement exists',()=>{const {g,r,p}=setup(4,'quips','tournament');r.round=2;r.pot=null;r.spot=true;r.candidates=['quips'];g.choose(r);g.advance(r);while(r.phase==='wager')g.action(r,p.find(q=>q.id===r.pot.turn),{type:'potBet',move:'match',round:r.round,revision:r.pot.revision});g.advance(r);r.submissions=Object.fromEntries(r.active.map(id=>[id,'Answer']));g.openVote(r);g.action(r,p.find(p=>r.judges.includes(p.id)),{type:'leave',round:r.round});assert.equal(r.result.tie,true);});
test('comeback: setting the dare resets a 60s clock; a timeout while performing re-offers instead of declining',()=>{const {g,r,p}=setup(4,'brain','tournament');g.phase(r,'result');p[1].chips=0;g.fresh(r);assert.equal(r.phase,'comeback');assert.ok(r.deadline-Date.now()>55000);g.action(r,p[1],{type:'comebackRequest'});r.deadline=Date.now()+1000;g.action(r,p[0],{type:'comebackDare',value:'Robot dance'});assert.ok(r.deadline-Date.now()>55000);g.action(r,p[1],{type:'comebackAccept'});g.advance(r);assert.equal(r.phase,'comeback');assert.equal(r.comeback.stage,'offer');assert.ok(!p[1].comebackDeclined);g.advance(r);assert.equal(p[1].comebackDeclined,true);assert.notEqual(r.phase,'comeback');});
test('auction picks read "Main: Item (Restaurant)" and still show the restaurant logo',async()=>{const {g,r,p}=setup(2,'auction');const a=r.auction,q=p.find(p=>p.id===a.turn),other=p.find(p=>p!==q);auction(g,r,q,{type:'auctionRaise'});auction(g,r,other,{type:'auctionPass'});const restaurant=a.pending[0].restaurant;auction(g,r,q,{type:'auctionItem',value:'Crunchwrap'});assert.equal(r.picks[q.id][0],`Main: Crunchwrap (${restaurant})`);assert.ok(!r.picks[q.id][0].includes('—'));const {foodLabel}=await import('./public/restaurants.js');assert.match(foodLabel('Main: Crunchwrap (Taco Bell)'),/taco-bell/);assert.match(foodLabel('main: Crunchwrap — Taco Bell'),/taco-bell/);});
