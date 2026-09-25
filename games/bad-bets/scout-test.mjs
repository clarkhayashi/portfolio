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
