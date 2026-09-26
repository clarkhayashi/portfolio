import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from './logic.mjs';
import {createServer,memoryStore} from './server.mjs';
import {handle} from './core.mjs';
import {rack,resolve,CUP_R} from '../public/loops/pong-sim.js';

const setup=()=>{
 const db=L.emptyDb();
 const clark=L.signUp(db,{name:'Clark',city:'Honolulu'}),kai=L.signUp(db,{name:'Kai',city:'Seattle'}),mel=L.signUp(db,{name:'Mel',city:'seattle '});
 const loop=L.createLoop(db,clark,{publicName:'Kalani 22',privateName:'Day Ones'});
 L.joinLoop(db,kai,loop.code);L.joinLoop(db,mel,loop.code);
 return {db,clark,kai,mel,loop};
};

test('private name only shows for its owner; the group sees the public name',()=>{
 const {db,clark,kai}=setup();
 assert.equal(L.home(db,clark).loops[0].name,'Day Ones');
 assert.equal(L.home(db,kai).loops[0].name,'Kalani 22');
 assert.equal(L.home(db,kai).loops[0].privateName,'');
});

test('thoughts: no read receipts, sender sees reactions only',()=>{
 const {db,clark,kai}=setup();
 const t=L.sendThought(db,clark,{to:{type:'user',id:kai.id},text:'Saw this and thought of you.'});
 const sent=L.home(db,clark).sent[0];
 assert.deepEqual(sent.reactions,[]);
 assert.ok(!('seen' in sent)&&!('read' in sent));
 assert.equal(L.home(db,kai).gifts[0].text,'Saw this and thought of you.');
 L.react(db,kai,t.id,'💛');
 assert.deepEqual(L.home(db,clark).sent[0].reactions,[{name:'Kai',r:'💛'}]);
 assert.throws(()=>L.react(db,clark,t.id,'💛'),/gone/); // can't react to your own
});

test('you can only send to people you share a loop with',()=>{
 const {db,clark}=setup();const stranger=L.signUp(db,{name:'Stranger'});
 assert.throws(()=>L.sendThought(db,clark,{to:{type:'user',id:stranger.id},text:'hi'}),/only send/);
});

test('slurs are blocked in names and thoughts',()=>{
 const {db,clark,kai}=setup();
 assert.throws(()=>L.createLoop(db,clark,{publicName:'n1gger squad'}),/slur/);
 assert.throws(()=>L.sendThought(db,clark,{to:{type:'user',id:kai.id},text:'you chink'}),/slur/);
});

test('link thought: guest reacts without an account, reply creates a 2-person loop',()=>{
 const {db,clark}=setup();
 const t=L.sendThought(db,clark,{to:{type:'link',name:'Noa'},text:'This song is you.'});
 assert.equal(L.linkThought(db,t.id).from,'Clark');
 L.guestReact(db,t.id,{reaction:'😂'});
 assert.deepEqual(L.home(db,clark).sent[0].reactions,[{name:'Noa',r:'😂'}]);
 const noa=L.signUp(db,{name:'Noa'});
 const l=L.replyBack(db,noa,t.id);
 assert.deepEqual(l.members.sort(),[clark.id,noa.id].sort());
 assert.equal(L.replyBack(db,noa,t.id).id,l.id); // no duplicate loop
 assert.throws(()=>L.replyBack(db,clark,t.id),/own thought/);
});

test('Flick Pong: server decides shots, balls back on 2 hits, win updates head-to-head',()=>{
 const {db,clark,kai}=setup();
 const cups=rack(),aimAt=i=>{const c=cups[i];return {aim:c.x/(0.45*c.y),power:(c.y-0.25)/0.85};};
 const g=L.startPong(db,clark,kai.id);
 assert.equal(L.startPong(db,kai,clark.id).id,g.id); // one live game per pair
 assert.throws(()=>L.pongThrow(db,kai,g.id,aimAt(0)),/not your turn/);
 assert.equal(L.pongThrow(db,clark,g.id,aimAt(0)).hit,0);
 const r=L.pongThrow(db,clark,g.id,aimAt(1));assert.equal(r.event,'ballsBack');
 assert.equal(L.pongThrow(db,clark,g.id,{aim:0,power:0}).hit,null); // short
 assert.equal(L.pongThrow(db,clark,g.id,{aim:0,power:1}).event,'turnOver');
 assert.equal(L.home(db,kai).pongs[0].myTurn,true);
 assert.match(L.home(db,kai).pongs[0].lastNote,/Clark sank 2 cups/);
 L.pongThrow(db,kai,g.id,{aim:0,power:0});L.pongThrow(db,kai,g.id,{aim:0,power:0});
 for(const i of [2,3,4,5]){const out=L.pongThrow(db,clark,g.id,aimAt(i));if(i===5)assert.equal(out.event,'win');}
 const v=L.home(db,clark).pongs[0];assert.equal(v.done,true);assert.equal(v.won,true);assert.deepEqual(v.record,{me:1,them:0});
 assert.notEqual(L.startPong(db,kai,clark.id).id,g.id); // rematch is a new game
});

test('pong sim: same flick, same result; rim shots miss',()=>{
 assert.deepEqual(resolve(Array(6).fill(true),{aim:.1,power:.6}),resolve(Array(6).fill(true),{aim:.1,power:.6}));
 const c=rack()[0],rim={aim:(c.x+CUP_R)/(0.45*c.y),power:(c.y-0.25)/0.85};
 const out=resolve(Array(6).fill(true),rim);assert.equal(out.hit,null);assert.equal(out.rim,0);
});

test('I’m in town: only friends whose home city matches get the invite',()=>{
 const {db,clark,kai,mel}=setup();const far=L.signUp(db,{name:'Far',city:'Seattle'});
 const trip=L.addTrip(db,clark,{city:'Seattle',from:'2099-10-10',to:'2099-10-17',note:'Down for food'});
 assert.equal(L.home(db,kai).invites.length,1);
 assert.equal(L.home(db,mel).invites.length,1); // case and spaces ignored
 assert.equal(L.home(db,far).invites.length,0); // not in a loop with Clark
 assert.deepEqual(L.home(db,clark).myTrips[0].friendsThere.sort(),['Kai','Mel']);
 L.imDown(db,kai,trip.id);
 assert.equal(L.home(db,clark).myTrips[0].downs[0].name,'Kai');
 assert.throws(()=>L.addTrip(db,clark,{city:'Seattle',from:'2099-10-17',to:'2099-10-10'}),/end after/);
});

test('API: signup, home and auth over HTTP',async()=>{
 const server=createServer(memoryStore());await new Promise(r=>server.listen(0,r));
 const base=`http://localhost:${server.address().port}/loops/api`;
 const post=(p,b,t)=>fetch(base+p,{method:'POST',headers:{'Content-Type':'application/json',...(t?{Authorization:'Bearer '+t}:{})},body:JSON.stringify(b)}).then(r=>r.json());
 const {token}=await post('/signup',{name:'Clark',city:'Honolulu'});
 await post('/loops',{publicName:'Test'},token);
 const home=await fetch(base+'/home',{headers:{Authorization:'Bearer '+token}}).then(r=>r.json());
 assert.equal(home.loops[0].publicName,'Test');
 const bad=await fetch(base+'/home',{headers:{Authorization:'Bearer nope'}});
 assert.equal(bad.status,400);
 server.close();
});

test('open pong challenge: whoever opens the link plays first and gets connected',()=>{
 const {db,clark}=setup();const leilani=L.signUp(db,{name:'Leilani'}),third=L.signUp(db,{name:'Third'});
 const g=L.startPong(db,clark);
 assert.equal(L.pongFor(db,leilani,g.id).open,true);
 assert.equal(L.pongFor(db,leilani,g.id).myTurn,true); // the friend can shoot right away
 assert.throws(()=>L.pongThrow(db,clark,g.id,{aim:0,power:0}),/not your turn/);
 L.pongThrow(db,leilani,g.id,{aim:0,power:0}); // takes the open seat
 assert.equal(db.pongs[g.id].a,leilani.id);
 assert.ok(L.home(db,clark).people.some(p=>p.name==='Leilani'));
 assert.throws(()=>L.pongThrow(db,third,g.id,{aim:0,power:0}),/not your turn|two players/);
 L.pongThrow(db,leilani,g.id,{aim:0,power:0});
 assert.equal(L.pongFor(db,clark,g.id).myTurn,true);
});

test('photos are stored apart from the thought and served by id',async()=>{
 const {db,clark,kai}=setup();const store=memoryStore(db);
 const photo='data:image/jpeg;base64,'+Buffer.from('fake').toString('base64');
 const t=L.sendThought(db,clark,{to:{type:'user',id:kai.id},photo});
 assert.equal(t.photo,`/loops/api/photo/${t.id}`);
 const out=await handle(store,{method:'GET',path:`/photo/${t.id}`});
 assert.equal(out.photo,photo);
});

test('delete my account removes the person and everything they made',()=>{
 const {db,clark,kai,loop}=setup();
 L.sendThought(db,clark,{to:{type:'user',id:kai.id},text:'hi'});L.startPong(db,clark,kai.id);
 L.addTrip(db,clark,{city:'Seattle',from:'2099-01-01',to:'2099-01-02'});
 L.deleteUser(db,clark);
 assert.equal(db.users[clark.id],undefined);
 assert.ok(!db.loops[loop.id].members.includes(clark.id));
 assert.equal(db.thoughts.length,0);assert.equal(Object.keys(db.pongs).length,0);assert.equal(db.trips.length,0);
 assert.equal(L.home(db,kai).people.some(p=>p.name==='Clark'),false);
});

test('Big 3 Pong: snake draft, ratings become stats, stats change the make window, fireball clears 2',async()=>{
 const {statsFor,ORDER}=await import('./big3.mjs');
 const {db,clark,kai}=setup();
 const g=L.startPong(db,clark,kai.id,'big3');
 assert.throws(()=>L.pongThrow(db,clark,g.id,{aim:0,power:0}),/Finish the draft/);
 assert.throws(()=>L.pongPick(db,kai,g.id,db.pongs[g.id].draft.boards.guard[0]),/not your pick/);
 const who={a:clark,b:kai};
 for(const [seat,slot] of ORDER){const v=L.pongFor(db,who[seat],g.id);assert.equal(v.draft.myPick,true);assert.equal(v.draft.slot,slot);L.pongPick(db,who[seat],g.id,v.draft.board[0].name);}
 const v=L.pongFor(db,clark,g.id);
 assert.equal(v.draft.done,true);assert.ok(v.draft.mine.guard&&v.draft.mine.wing&&v.draft.mine.big);
 assert.ok(v.draft.stats.me.aim>0&&[2,3,4].includes(v.draft.stats.me.heat));
 // Curry-level guard vs a weak big widens the window; a lockdown big shrinks it.
 assert.ok(statsFor({guard:'Stephen Curry',wing:'LeBron James',big:'Bill Russell'}).aim>1.1);
 assert.equal(statsFor({guard:'Stephen Curry',wing:'LeBron James',big:'Bill Russell'}).heat,2);
 assert.ok(statsFor({guard:'Stephen Curry',wing:'LeBron James',big:'Bill Russell'}).contest<0.95);
 // Force a hot streak: heat 2, two makes -> the second make also clears a neighbour (3 cups gone).
 const game=db.pongs[g.id];game.stats.a.heat=2;game.stats.a.aim=1;game.stats.b.contest=1;
 const cups=rack(),aimAt=i=>({aim:cups[i].x/(0.45*cups[i].y),power:(cups[i].y-0.25)/0.85});
 L.pongThrow(db,clark,g.id,aimAt(0));const second=L.pongThrow(db,clark,g.id,aimAt(3));
 assert.notEqual(second.fireball,null);
 assert.equal(game.cups.b.filter(Boolean).length,3);
});

test('Home Run Derby: timing sets distance, same pitches for both, beat-my-score, open seat connects',async()=>{
 const {pitchList,outcome,PITCHES_PER_TURN}=await import('../public/loops/derby-sim.js');
 const p={ms:700};
 assert.equal(outcome(p,700).hr,true);assert.ok(outcome(p,700).feet>=440);
 assert.equal(outcome(p,700+300).kind,'whiff');assert.equal(outcome(p,null).kind,'take');
 assert.ok(outcome(p,760).feet<outcome(p,720).feet);
 assert.deepEqual(pitchList(42),pitchList(42));
 const {db,clark}=setup();const leilani=L.signUp(db,{name:'Leilani'});
 const g=L.startDerby(db,clark);
 assert.equal(L.derbyFor(db,leilani,g.id).myTurn,false); // wait for the first batter
 const pitches=L.derbyFor(db,clark,g.id).pitches;assert.equal(pitches.length,PITCHES_PER_TURN);
 const perfect=pitches.map(x=>x.ms),late=pitches.map(x=>x.ms+120);
 const v1=L.derbySwings(db,clark,g.id,late);assert.equal(v1.done,false);
 assert.throws(()=>L.derbySwings(db,clark,g.id,late),/already batted/);
 const seen=L.derbyFor(db,leilani,g.id);assert.equal(seen.myTurn,true);assert.deepEqual(seen.pitches,pitches); // same pitches
 const v2=L.derbySwings(db,leilani,g.id,perfect);
 assert.equal(v2.done,true);assert.equal(v2.won,true);assert.equal(v2.mine.hr,10);
 assert.ok(L.home(db,clark).people.some(p=>p.name==='Leilani'));
 assert.equal(L.home(db,clark).derbies[0].won,false);
});

test('Penalty Shootout: secret picks, reveal only when both are in, exact dive saves, sudden death',async()=>{
 const {db,clark}=setup();const cody=L.signUp(db,{name:'Cody'});
 const g=L.startShootout(db,clark);
 L.shootoutPick(db,clark,g.id,{shoot:'tl',dive:'bc'});
 const cv=L.shootoutFor(db,cody,g.id);assert.equal(cv.myTurn,true);assert.equal(cv.rounds.length,0); // Clark's picks stay hidden
 assert.throws(()=>L.shootoutPick(db,clark,g.id,{shoot:'tl',dive:'bc'}),/already picked/);
 const r1=L.shootoutPick(db,cody,g.id,{shoot:'bc',dive:'tr'}); // Cody's shot saved, Clark's goes in
 assert.equal(r1.justRevealed,true);assert.deepEqual(r1.score,{me:0,them:1});
 assert.equal(r1.rounds[0].theirs.goal,true);assert.equal(r1.rounds[0].mine.goal,false);
 // Clark scores every round and saves every one: done after round 3 (3-0 with 2 left can't be caught)
 for(let i=0;i<2;i++){L.shootoutPick(db,clark,g.id,{shoot:'tr',dive:'bl'});L.shootoutPick(db,cody,g.id,{shoot:'bl',dive:'tl'});}
 const end=L.shootoutFor(db,clark,g.id);assert.equal(end.done,true);assert.equal(end.won,true);assert.deepEqual(end.score,{me:3,them:0});
 // sudden death: level after 5 keeps going
 const g2=L.startShootout(db,clark,cody.id);
 for(let i=0;i<5;i++){L.shootoutPick(db,clark,g2.id,{shoot:'tl',dive:'br'});L.shootoutPick(db,cody,g2.id,{shoot:'tl',dive:'br'});}
 const sd=L.shootoutFor(db,cody,g2.id);assert.equal(sd.done,false);assert.equal(sd.suddenDeath,true);
 assert.throws(()=>L.shootoutPick(db,clark,g2.id,{shoot:'zz',dive:'tl'}),/Pick a spot/);
});
