import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from './server.mjs';import {QUICK_GAMES} from './public/catalog.js';

// A fresh 1v1 room with both seats filled.
function room(game='draft',sport='hoops'){
 const g=new Game();const h=g.create('Clark','minigames',sport,game);const r=g.rooms.get(h.code);const j=g.join(h.code,'Kai');
 const host=r.players.find(p=>p.token===h.token),guest=r.players.find(p=>p.token===j.token);
 return {g,r,host,guest,code:h.code};
}
const skipIntro=(g,r)=>{if(r.phase==='reveal'){assert.equal(r.veto,null);g.advance(r);}};
const NO_BETTING=['stake','entry','ban','banResult','wager','spin','vote','comeback'];

// Play one full round of whatever game is selected. `winner` = host | guest | 'tie' | 'match' | 'miss'.
function play(g,r,host,guest,outcome){
 g.action(r,host,{type:'start'});
 assert.ok(!NO_BETTING.includes(r.phase),`no betting phase, got ${r.phase}`);
 assert.equal(r.free,true);
 const game=r.game;
 if(['number','brain','shadow','rhythm'].includes(game)){assert.equal(r.phase,'reveal');skipIntro(g,r);}
 if(game==='draft'){assert.equal(r.phase,'draft');while(r.phase==='draft'){const pid=g.draftPlayer(r);g.action(r,r.players.find(p=>p.id===pid),{type:'pick',item:r.cards[0]});}
  g.action(r,host,{type:'quickReady'});g.action(r,guest,{type:'quickReady'});}
 else if(game==='auction'){assert.equal(r.phase,'qauction');while(r.phase==='qauction'){const b=r.qa.boards[r.qa.step];g.action(r,host,{type:'qbid',item:b[0],amount:1});g.action(r,guest,{type:'qbid',item:b[1],amount:1});}
  g.action(r,host,{type:'quickReady'});g.action(r,guest,{type:'quickReady'});}
 else if(game==='number'){assert.equal(r.phase,'play');const off={host:[1,50],guest:[50,1],tie:[5,5]}[outcome]||[1,50];
  g.action(r,host,{type:'submit',value:String(r.answer+off[0])});g.action(r,guest,{type:'submit',value:String(r.answer-off[1])});}
 else if(game==='brain'){assert.equal(r.phase,'play');g.action(r,host,{type:'submit',value:'Pizza'});g.action(r,guest,{type:'submit',value:outcome==='match'?'the pizza!':'Tacos'});}
 else if(['shadow','rhythm'].includes(game)){assert.equal(r.phase,'physicalSetup');assert.equal(r.physical.keeper,host.id);
  const rev=()=>r.physical.revision;
  if(game==='rhythm')g.action(r,host,{type:'physicalCategory',random:true,revision:rev()});
  g.action(r,host,{type:'physicalStart',revision:rev()});assert.equal(r.phase,'physical');
  // Shadowbox: most hits wins. Keep It Going: fewest mistakes wins.
  const scorer=game==='shadow'?(outcome==='guest'?guest:host):(outcome==='guest'?host:guest);
  if(outcome!=='tie')g.action(r,host,{type:'physicalScore',player:scorer.id,delta:1,revision:rev()});
  if(r.phase==='physical')g.action(r,host,{type:'physicalFinish',revision:rev()});
  assert.equal(r.phase,'physicalConfirm');
  g.action(r,host,{type:'physicalConfirm',revision:rev()});g.action(r,guest,{type:'physicalConfirm',revision:rev()});}
 assert.equal(r.phase,'result',`${game} reaches a result`);
 return r.result;
}

test('quick 1v1 offers exactly the two-player games',()=>{
 assert.deepEqual(QUICK_GAMES,['draft','auction','number','shadow','rhythm','brain']);
});

for(const game of QUICK_GAMES)test(`quick 1v1 plays ${game} end to end with two players, then replays and switches games`,()=>{
 const {g,r,host,guest}=room(game);
 assert.equal(r.selectedGame,game);
 const res=play(g,r,host,guest,game==='brain'?'match':'host');
 assert.equal(r.game,game);assert.deepEqual([...r.active].sort(),[host.id,guest.id].sort());
 if(!['draft','auction'].includes(game)){assert.equal(res.tie,false);assert.ok(res.winners.includes(host.id));}
 assert.ok(r.players.every(p=>p.chips===100),'no chips move in 1v1');
 // Guest can call the rematch.
 g.action(r,guest,{type:'replay'});assert.equal(r.game,game);assert.notEqual(r.phase,'result');
 // Back to the lobby and pick something else.
 g.cancel(r,'test');g.action(r,host,{type:'lobby'});assert.equal(r.phase,'lobby');
 const next=QUICK_GAMES.find(x=>x!==game);g.action(r,host,{type:'quickSetup',game:next});
 g.action(r,host,{type:'start'});assert.equal(r.game,next);
});

test('quickSetup rejects games that need a judge or more players, and guests cannot change the game',()=>{
 const {g,r,host,guest}=room('number');
 for(const game of ['quips','draw','imposter','finale','herd','nope'])assert.throws(()=>g.action(r,host,{type:'quickSetup',game}),/3 or more players/);
 assert.equal(r.selectedGame,'number');
 assert.throws(()=>g.action(r,guest,{type:'quickSetup',game:'brain'}),/host/);
 assert.throws(()=>g.action(r,host,{type:'quickSetup',sport:'curling'}),/basketball/);
 g.action(r,host,{type:'quickSetup',game:'auction',sport:'mlb'});assert.equal(r.selectedGame,'auction');assert.equal(r.themes.auction,'mlb');
 // create() falls back to Draft for anything that is not a 1v1 game.
 const g2=new Game();const h=g2.create('Clark','minigames','hoops','quips');assert.equal(g2.rooms.get(h.code).selectedGame,'draft');
 for(const game of QUICK_GAMES){const x=g2.create('Clark','minigames','nfl',game);assert.equal(g2.rooms.get(x.code).selectedGame,game);}
});

test('a third player still cannot join a quick 1v1 room',()=>{
 const {g,code}=room('shadow');
 assert.throws(()=>g.join(code,'Maya'),/full/);
});

test('head-to-head score: a win counts, a tie adds nothing, Same Brain is a team point',()=>{
 const {g,r,host,guest}=room('number');
 const view=()=>g.view(r,host).h2h;
 assert.deepEqual(view(),{wins:{},team:0});
 play(g,r,host,guest,'host');assert.equal(view().wins[host.id],1);
 g.action(r,host,{type:'lobby'});play(g,r,host,guest,'guest');assert.equal(view().wins[guest.id],1);
 g.action(r,host,{type:'lobby'});const t=play(g,r,host,guest,'tie');assert.equal(t.winners.length,2);
 assert.deepEqual(view(),{wins:{[host.id]:1,[guest.id]:1},team:0},'equal guesses add nothing');
 g.action(r,host,{type:'lobby'});g.action(r,host,{type:'quickSetup',game:'shadow'});
 const s=play(g,r,host,guest,'tie');assert.equal(s.tie,true);assert.deepEqual(view().wins,{[host.id]:1,[guest.id]:1});
 g.action(r,host,{type:'lobby'});g.action(r,host,{type:'quickSetup',game:'rhythm'});
 play(g,r,host,guest,'guest');assert.equal(view().wins[guest.id],2);
 g.action(r,host,{type:'lobby'});g.action(r,host,{type:'quickSetup',game:'brain'});
 const b=play(g,r,host,guest,'match');assert.equal(b.coop,true);assert.match(b.detail,/Same brain/);
 assert.equal(view().team,1);assert.deepEqual(view().wins,{[host.id]:1,[guest.id]:2},'co-op never adds a win');
 g.action(r,host,{type:'lobby'});const miss=play(g,r,host,guest,'miss');assert.match(miss.detail,/No match/);assert.equal(view().team,1);
 // A cancelled round (someone leaves) is a draw and adds nothing.
 g.action(r,host,{type:'lobby'});g.action(r,host,{type:'quickSetup',game:'number'});g.action(r,host,{type:'start'});g.cancel(r,'left');
 assert.deepEqual(view(),{wins:{[host.id]:1,[guest.id]:2},team:1});
 // Party and Minigames rooms carry no head-to-head score.
 const g2=new Game();const x=g2.create('Clark','minigames');const r2=g2.rooms.get(x.code);assert.equal(g2.view(r2,r2.players[0]).h2h,null);
});

test('scout-graded draft winner feeds the head-to-head score',()=>{
 const {g,r,host,guest}=room('draft');
 const res=play(g,r,host,guest);const h=g.view(r,host).h2h;
 if(res.tie)assert.deepEqual(h.wins,{});else assert.equal(h.wins[res.winners[0]],1);
});
