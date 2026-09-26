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

test('open pong challenge: first friend to shoot takes the seat and gets connected',()=>{
 const {db,clark}=setup();const stranger=L.signUp(db,{name:'Leilani'}),third=L.signUp(db,{name:'Third'});
 const g=L.startPong(db,clark);
 assert.equal(L.pongFor(db,stranger,g.id).open,true);
 assert.throws(()=>L.pongThrow(db,stranger,g.id,{aim:0,power:0}),/not your turn/); // challenger shoots first
 L.pongThrow(db,clark,g.id,{aim:0,power:0});L.pongThrow(db,clark,g.id,{aim:0,power:0});
 L.pongThrow(db,stranger,g.id,{aim:0,power:0}); // takes seat b
 assert.equal(db.pongs[g.id].b,stranger.id);
 assert.ok(L.home(db,clark).people.some(p=>p.name==='Leilani')); // now in each other's circle
 assert.throws(()=>L.pongThrow(db,third,g.id,{aim:0,power:0}),/not your turn/);
});

test('photos are stored apart from the thought and served by id',async()=>{
 const {db,clark,kai}=setup();const store=memoryStore(db);
 const photo='data:image/jpeg;base64,'+Buffer.from('fake').toString('base64');
 const t=L.sendThought(db,clark,{to:{type:'user',id:kai.id},photo});
 assert.equal(t.photo,`/loops/api/photo/${t.id}`);
 const out=await handle(store,{method:'GET',path:`/photo/${t.id}`});
 assert.equal(out.photo,photo);
});
