import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudRequest} from './cloud-game.mjs';
class Store {
 data=new Map();
 async get(k){return this.data.get(k)||null;}
 async compareAndSwap(k,b,a){await new Promise(resolve=>setImmediate(resolve));if((this.data.get(k)||null)!==b)return false;this.data.set(k,a);return true;}
 async allow(){return true;}
}
test('separate cloud instances retain rooms; concurrent joins and submissions survive',async()=>{
 const s=new Store();const host=await cloudRequest(s,{type:'create',name:'Host',mode:'minigames'});
 const guests=await Promise.all(Array.from({length:7},(_,i)=>cloudRequest(s,{type:'join',code:host.code,name:`Guest ${i}`})));
 assert.equal(JSON.parse(await s.get(host.code)).players.length,8);
 await cloudRequest(s,{...host,type:'selectGame',game:'brain'});
 await cloudRequest(s,{...host,type:'start'});
 await cloudRequest(s,{...host,type:'beginGame'});
 await Promise.all([host,...guests].map(a=>cloudRequest(s,{...a,type:'submit',value:'pizza'})));
 const result=await cloudRequest(s,host,{state:true});assert.equal(result.phase,'result');assert.equal(result.result.winners.length,8);
 assert.equal(result.players.every(p=>p.chips===100),true);
 assert.equal(JSON.stringify(result).includes(host.token),false);
});
test('invalid tokens cannot change stored state and overdue rounds advance on reads',async()=>{
 const s=new Store();const host=await cloudRequest(s,{type:'create',name:'Host'});await cloudRequest(s,{type:'join',code:host.code,name:'Guest'});
 await cloudRequest(s,{...host,type:'banSetting',enabled:false});await cloudRequest(s,{...host,type:'start'});
 const room=JSON.parse(await s.get(host.code));room.deadline=Date.now()-1;s.data.set(host.code,JSON.stringify(room));const before=await s.get(host.code);
 await assert.rejects(cloudRequest(s,{code:host.code,token:'wrong'},{state:true}));assert.equal(await s.get(host.code),before);
 const state=await cloudRequest(s,host,{state:true});assert.ok(['wager','reveal'].includes(state.phase));
});
test('concurrent final votes settle chips exactly once',async()=>{
 const s=new Store();const h=await cloudRequest(s,{type:'create',name:'Host'});const peers=[];
 for(let i=0;i<3;i++)peers.push(await cloudRequest(s,{type:'join',code:h.code,name:`Guest${i}`}));
 const r=JSON.parse(await s.get(h.code));r.round=1;r.game='draw';r.phase='vote';r.deadline=Date.now()+30000;r.active=r.players.slice(0,2).map(p=>p.id);r.stakes=Object.fromEntries(r.active.map(id=>[id,5]));r.active.forEach(id=>r.players.find(p=>p.id===id).chips-=5);r.submissions=Object.fromEntries(r.active.map(id=>[id,'data:image/png;base64,abc']));r.votes={};r.bets={};r.picks={};r.teams=[];r.contestants=[...r.active];r.folded=[];r.forfeits=[];r.judges=r.players.slice(2).map(p=>p.id);r.pot={fixed:false};s.data.set(h.code,JSON.stringify(r));
 await Promise.all(peers.slice(1).map(a=>cloudRequest(s,{...a,type:'vote',player:r.active[0]})));
 const final=JSON.parse(await s.get(h.code));assert.equal(final.phase,'result');assert.equal(final.players[0].chips,105);assert.equal(final.history.length,1);
});
test('concurrent repeated raises debit once and retain a single next turn',async()=>{
 const s=new Store(),h=await cloudRequest(s,{type:'create',name:'Host'});await cloudRequest(s,{type:'join',code:h.code,name:'Guest'});
 let r=JSON.parse(await s.get(h.code));r.enabledGames=['number'];r.banEnabled=false;s.data.set(h.code,JSON.stringify(r));await cloudRequest(s,{...h,type:'start'});
 r=JSON.parse(await s.get(h.code));r.deadline=Date.now()-1;s.data.set(h.code,JSON.stringify(r));const v=await cloudRequest(s,h,{state:true});
 const action={...h,type:'potBet',move:'raise',total:20,round:v.round,revision:v.pot.revision};const results=await Promise.allSettled([cloudRequest(s,action),cloudRequest(s,action)]);
 assert.equal(results.filter(x=>x.status==='fulfilled').length,1);r=JSON.parse(await s.get(h.code));assert.equal(r.players[0].chips,80);assert.equal(r.stakes[r.players[0].id],20);assert.equal(r.players.reduce((n,p)=>n+p.chips,0)+Object.values(r.stakes).reduce((a,b)=>a+b,0),200);
});
test('storage hiccups (bad JSON, HTTP errors, network) surface as Room storage errors',async()=>{
 const {RedisRoomStore}=await import('./room-store.mjs');const store=new RedisRoomStore({UPSTASH_REDIS_REST_URL:'https://redis.invalid',UPSTASH_REDIS_REST_TOKEN:'t'});const real=globalThis.fetch;
 try{
  for(const fake of [async()=>new Response('<html>502</html>',{status:502}),async()=>new Response('not json',{status:200}),async()=>{throw TypeError('fetch failed');},async()=>new Response('{"error":"x"}',{status:200})]){globalThis.fetch=fake;await assert.rejects(store.get('ABCD'),/Room storage/);}
  globalThis.fetch=async()=>new Response('{"result":"ok"}',{status:200});assert.equal(await store.get('ABCD'),'ok');
 }finally{globalThis.fetch=real;}
});
