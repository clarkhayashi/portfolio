import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,createServer} from './server.mjs';
import {cloudRequest} from './cloud-game.mjs';
import {isCurrentState} from './public/state-flow.js';
class Store{
 data=new Map();writes=0;
 async get(k){return this.data.get(k)||null;}
 async compareAndSwap(k,b,a){if((this.data.get(k)||null)!==b)return false;this.data.set(k,a);this.writes++;return true;}
}
test('idle cloud polls write presence once per 2 seconds instead of every request',async()=>{
 const real=Date.now;let now=real();Date.now=()=>now;
 try{const store=new Store();const host=await cloudRequest(store,{type:'create',name:'Host'});const seats=[host];for(let i=1;i<8;i++)seats.push(await cloudRequest(store,{type:'join',code:host.code,name:`P${i}`}));
 const before=store.writes;
 for(let i=0;i<30;i++){now+=700;await Promise.all(seats.map(a=>cloudRequest(store,a,{state:true})));}
 assert.equal(store.writes-before,80); // Previously 240 room writes for these same reads.
 const r=JSON.parse(await store.get(host.code));assert.ok(r.players.every(p=>now-p.lastSeen<2000));
 }finally{Date.now=real;}
});
test('presence-only polls do not change the gameplay version; actions do',async()=>{
 const store=new Store(),h=await cloudRequest(store,{type:'create',name:'Host'});
 const before=await cloudRequest(store,h,{state:true});const action=await cloudRequest(store,{...h,type:'banSetting',enabled:false});
 assert.ok(action.state.version>before.version);assert.equal(isCurrentState(action.state,before),false);
 assert.equal(isCurrentState(action.state,action.state),true);
});
test('repeated lobby joins do not retain departed seats',()=>{
 const g=new Game(),h=g.create('Host'),r=g.rooms.get(h.code);
 for(let i=0;i<1000;i++){const a=g.join(h.code,'Guest');g.action(r,g.player(r,a.token),{type:'leave'});}
 assert.ok(r.players.length<=2);assert.equal(g.live(r).length,1);
});
test('Shadowbox dodge history is bounded and remains undoable',()=>{
 const g=new Game(),h=g.create('Host','minigames'),r=g.rooms.get(h.code);g.join(h.code,'Guest');const p=g.player(r,h.token);
 g.action(r,p,{type:'selectGame',game:'shadow'});g.action(r,p,{type:'start'});g.action(r,p,{type:'beginGame'});g.action(r,p,{type:'physicalStart',revision:r.physical.revision});
 for(let i=0;i<1000;i++)g.action(r,p,{type:'physicalDodge',revision:r.physical.revision});
 assert.equal(r.physical.undo.length,60);g.action(r,p,{type:'physicalUndo',revision:r.physical.revision});assert.equal(r.physical.undo.length,59);
});
test('unlimited minigame replays retain at most 50 summaries',()=>{
 const g=new Game(),h=g.create('Host','minigames'),r=g.rooms.get(h.code);const a=g.join(h.code,'Guest');const p=g.player(r,h.token),q=g.player(r,a.token);
 g.action(r,p,{type:'start'});
 for(let i=0;i<200;i++){g.action(r,p,{type:'beginGame'});g.action(r,p,{type:'submit',value:'pizza'});g.action(r,q,{type:'submit',value:'pizza'});if(i<199)g.action(r,p,{type:'replay'});}
 assert.equal(r.history.length,50);assert.equal(r.phase,'result');assert.equal(p.chips,100);
});
test('expired rooms are released by cleanup',()=>{
 const g=new Game();for(let i=0;i<100;i++){const a=g.create('Host');g.rooms.get(a.code).last=Date.now()-13*3600000;}g.tick();assert.equal(g.rooms.size,0);
});

test('authenticated local actions refresh player presence',async()=>{
 const g=new Game(),h=g.create('Host'),r=g.rooms.get(h.code),p=g.player(r,h.token);
 const server=createServer(g);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{p.lastSeen=Date.now()-60000;const response=await fetch(`http://127.0.0.1:${server.address().port}/api`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...h,type:'banSetting',enabled:false})});
 const result=await response.json();assert.equal(response.status,200);assert.equal(result.state.players[0].disconnected,false);assert.ok(Date.now()-p.lastSeen<1000);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
