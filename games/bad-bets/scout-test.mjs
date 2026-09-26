import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from './server.mjs';import {scout} from './scout.mjs';import {DRAFT_THEMES} from './theme-content.mjs';
test('scout grades rank a legend lineup above a bench lineup',()=>{
 const a=scout('hoops',['Stephen Curry','Michael Jordan','LeBron James','Tim Duncan','Hakeem Olajuwon']);
 assert.ok(a.grade.startsWith('A'));assert.ok(a.players.length===5&&a.report.length>5);
});
test('quick 1v1 draft ends with a scout-grade winner, not a forced tie',()=>{
 const g=new Game();const h=g.create('Clark','tournament','hoops');const r=g.rooms.get(h.code);const j=g.join(h.code,'Maya');
 assert.equal(r.mode,'minigames');assert.equal(r.selectedGame,'draft');assert.equal(r.themes.draft,'hoops');
 const byTok=t=>r.players.find(p=>p.token===t);const host=byTok(h.token),guest=byTok(j.token);
 g.action(r,host,{type:'start'});
 for(let i=0;i<40&&r.phase!=='draft';i++)g.advance(r);
 assert.equal(r.phase,'draft');
 while(r.phase==='draft'){const pid=g.draftPlayer(r);g.action(r,r.players.find(p=>p.id===pid),{type:'pick',item:r.cards[0]});}
 assert.equal(r.phase,'pitch');
 g.action(r,host,{type:'callGrade',band:'B'});
 g.openVote(r);
 assert.equal(r.phase,'result');assert.ok(r.result.scout[host.id]&&r.result.scout[guest.id]);
 assert.equal(r.result.scout[host.id].call,'B');
 const [s1,s2]=[host.id,guest.id].map(id=>r.result.scout[id].score);
 if(s1!==s2){assert.equal(r.result.winners.length,1);assert.equal(r.result.tie,false);}
});
test('quick 1v1 auction: positions match, a clash re-picks, nobody is handed a player, results come when both are ready',()=>{
 const g=new Game();const h=g.create('Clark','minigames','nfl','auction');const r=g.rooms.get(h.code);g.join(h.code,'Maya');
 assert.throws(()=>g.join(h.code,'Kai'),/full/);
 const host=r.players.find(p=>p.token===h.token),guest=r.players.find(p=>p.id!==host.id);
 g.action(r,host,{type:'quickSetup',sport:'hoops'});
 g.action(r,host,{type:'start'});
 assert.equal(r.phase,'qauction');assert.deepEqual(r.qa.slots,['PG','SG','SF','PF','C']);
 // Round 1: both want the same player. Higher bid wins; the other picks again from the same position.
 const star=r.qa.boards[0][0];
 g.action(r,host,{type:'qbid',item:star,amount:30});g.action(r,guest,{type:'qbid',item:star,amount:12});
 assert.equal(r.picks[host.id][0],`PG: ${star}`);assert.equal(r.picks[guest.id].length,0);assert.equal(r.qa.step,0);
 assert.equal(r.qa.budgets[host.id],70);assert.equal(r.qa.budgets[guest.id],100);
 assert.throws(()=>g.action(r,guest,{type:'qbid',item:star,amount:1}),/gone/);
 g.action(r,guest,{type:'qbid',item:r.qa.boards[0][0],amount:5});
 assert.equal(r.qa.step,1);
 // Rounds 2-5: different players, both pay.
 while(r.phase==='qauction'){const b=r.qa.boards[r.qa.step];g.action(r,host,{type:'qbid',item:b[0],amount:1});g.action(r,guest,{type:'qbid',item:b[1],amount:1});}
 assert.equal(r.phase,'pitch');
 for(const id of [host.id,guest.id]){assert.equal(r.picks[id].length,5);assert.deepEqual(r.picks[id].map(x=>x.split(':')[0]),['PG','SG','SF','PF','C']);}
 assert.throws(()=>g.action(r,host,{type:'pitch',value:'all chink team'}),/slur/);
 g.action(r,host,{type:'quickReady'});assert.equal(r.phase,'pitch');
 g.action(r,guest,{type:'quickReady'});assert.equal(r.phase,'result');
 for(const id of [host.id,guest.id])assert.equal(r.result.scout[id].players.length,5);
});
test('party rematch-now resets chips and starts round 1 with the same group',()=>{
 const g=new Game();const h=g.create('Clark','tournament');const r=g.rooms.get(h.code);g.join(h.code,'Maya');g.join(h.code,'Kai');
 const host=r.players.find(p=>p.token===h.token);
 r.players.forEach((p,i)=>p.chips=50+i*40);g.phase(r,'finished');
 g.action(r,host,{type:'rematch',now:true});
 assert.equal(r.round,1);assert.notEqual(r.phase,'lobby');assert.ok(r.players.every(p=>p.chips===100||r.stakes[p.id]!==undefined));assert.equal(r.players.length,3);
});
test('quick 1v1 guest can call a rematch',()=>{
 const g=new Game();const h=g.create('Clark','minigames','hoops');const r=g.rooms.get(h.code);const j=g.join(h.code,'Maya');
 const guest=r.players.find(p=>p.token===j.token);r.game='draft';g.phase(r,'result');
 g.action(r,guest,{type:'replay'});assert.notEqual(r.phase,'result');
});
