import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,UNSEEN_MS,DISCONNECT_MS} from './server.mjs';
import {pollDelay,POLL,isQuota} from './public/state-flow.js';
import {RedisRoomStore,StorageQuotaError} from './room-store.mjs';
import handler,{allowRead} from './api/room.mjs';
import {health,resetHealth} from './api/health.mjs';
import {PRESENCE_WRITE_MS,PRESENCE_CALM_MS} from './cloud-game.mjs';
import {simulate} from './usage-sim.mjs';

const env={UPSTASH_REDIS_REST_URL:'https://redis.invalid',UPSTASH_REDIS_REST_TOKEN:'t'};
async function withFetch(fake,fn){const real=globalThis.fetch;globalThis.fetch=fake;try{return await fn();}finally{globalThis.fetch=real;}}
function call(req){let out='';const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},end(s){out=s;}};return handler({headers:{host:'x'},...req},res).then(()=>({status:res.statusCode,body:JSON.parse(out)}));}

test('poll schedule: fast in timed play, slow in lobby/results, backs off after a quiet minute',()=>{
 assert.equal(pollDelay({phase:'play'}),1000);assert.equal(pollDelay({phase:'auction'},{idleMs:59000}),1000);
 assert.equal(pollDelay({phase:'auction'},{idleMs:61000}),3000); // never slower than 3 s while presence matters
 for(const phase of ['lobby','result','finished'])assert.equal(pollDelay({phase}),3000);
 assert.equal(pollDelay({phase:'lobby'},{idleMs:60000}),10000);
 assert.equal(pollDelay({phase:'vote'},{display:true}),1500);assert.equal(pollDelay({phase:'result'},{display:true}),4000);
 assert.equal(pollDelay(null),POLL.offline);
});
test('presence lag stays inside the unseen and disconnect windows',()=>{
 assert.equal(UNSEEN_MS,15000);assert.equal(DISCONNECT_MS,30000);
 assert.ok(PRESENCE_WRITE_MS+POLL.activeIdle<UNSEEN_MS);          // active phases
 assert.ok(PRESENCE_CALM_MS+POLL.idle<DISCONNECT_MS);             // lobby/results after backoff
});
test('auction bidding pauses only after a bidder is unseen for 15 seconds',()=>{
 const g=new Game(),a=g.create('P0'),r=g.rooms.get(a.code);g.join(a.code,'P1');const [p0,p1]=r.players;r.active=[p0.id,p1.id];
 p1.lastSeen=Date.now()-10000;assert.throws(()=>g.action(r,p0,{type:'auctionBid',round:r.round}),e=>!/reconnecting/.test(e.message));
 p1.lastSeen=Date.now()-16000;assert.throws(()=>g.action(r,p0,{type:'auctionBid',round:r.round}),/reconnecting/);
});
test('physical games pause only after the host is unseen for 15 seconds',()=>{
 const g=new Game(),a=g.create('P0'),r=g.rooms.get(a.code);g.join(a.code,'P1');r.banEnabled=false;r.mode='minigames';r.selectedGame='shadow';r.enabledGames=['shadow'];
 g.action(r,r.players[0],{type:'start'});g.begin(r);g.action(r,r.players[0],{type:'physicalStart',revision:r.physical.revision});
 assert.equal(r.phase,'physical');assert.equal(!!r.physical.paused,false);
 r.players[0].lastSeen=Date.now()-10000;g.tick();assert.equal(!!r.physical.paused,false);
 r.players[0].lastSeen=Date.now()-16000;g.tick();assert.equal(!!r.physical.paused,true);
});
test('Upstash quota errors are detected (error text and HTTP 429); other failures stay generic',async()=>{
 const store=new RedisRoomStore(env);
 await withFetch(async()=>new Response('{"error":"ERR max requests limit exceeded. Limit: 500000, Usage: 500000"}',{status:400}),()=>assert.rejects(store.get('ABCD'),StorageQuotaError));
 await withFetch(async()=>new Response('{"error":"too many"}',{status:429}),()=>assert.rejects(store.get('ABCD'),e=>e.code==='quota'));
 await withFetch(async()=>new Response('{"error":"WRONGTYPE"}',{status:200}),()=>assert.rejects(store.get('ABCD'),e=>e.code!=='quota'&&/Room storage/.test(e.message)));
});
test('API answers a distinct quota code; clients recognise it',async()=>{
 Object.assign(process.env,env);
 await withFetch(async()=>new Response('{"error":"ERR max requests limit exceeded"}',{status:400}),async()=>{
  const r=await call({method:'GET',url:'/api/room?route=state&code=ABCD'});
  assert.equal(r.status,503);assert.deepEqual(r.body,{error:'The game is taking a break',code:'quota'});assert.equal(isQuota(r.body),true);
  const w=await call({method:'POST',url:'/api/room?route=action',body:{type:'create',name:'A'}});assert.equal(w.body.code,'quota');
 });
});
test('a state poll costs one Redis command (no rate-limit or ratings commands)',async()=>{
 Object.assign(process.env,env);const data=new Map(),seen=[];
 await withFetch(async(url,init)=>{const args=JSON.parse(init.body);seen.push(args[0]);let result=null;
  if(args[0]==='GET')result=data.get(args[1])??null;else if(args[0]==='HGETALL')result=[];else if(args[0]==='EVAL'){if(args[1].includes('INCR'))result=1;else{data.set(args[3],args[5]);result=1;}}
  return new Response(JSON.stringify({result}),{status:200});},async()=>{
  const host=(await call({method:'POST',url:'/api/room?route=action',body:{type:'create',name:'Host'},headers:{host:'x','x-forwarded-for':'9.9.9.9'}})).body;
  seen.length=0;const r=await call({method:'GET',url:`/api/room?route=state&code=${host.code}`,headers:{host:'x',authorization:`Bearer ${host.token}`}});
  assert.equal(r.status,200);assert.deepEqual(seen,['GET']);
 });
});
test('in-memory read limiter allows 1500 polls per minute per client, then resets',()=>{
 const t=1e12;for(let i=0;i<1500;i++)assert.equal(allowRead('b1',1500,60000,t),true);
 assert.equal(allowRead('b1',1500,60000,t+1),false);assert.equal(allowRead('b1',1500,60000,t+60000),true);
});
test('health check uses one command and caches it for 60 seconds',async()=>{
 resetHealth();let pings=0;const ok={ping:async()=>{pings++;}};
 assert.deepEqual(await health(()=>ok,1000),{ok:true});assert.deepEqual(await health(()=>ok,30000),{ok:true});assert.equal(pings,1);
 resetHealth();assert.deepEqual(await health(()=>({ping:async()=>{throw new StorageQuotaError();}}),1000),{ok:false,code:'quota'});resetHealth();
});
test('simulated Upstash usage is several times below the old polling loop',async()=>{
 // Old code measured with this simulator: lobby 1316/min, party 1353/min, idle tab 165/min, TV 108/min.
 const lobby=await simulate('lobby','after'),idle=await simulate('idle','after'),tv=await simulate('display','after'),party=await simulate('party','after');
 assert.ok(lobby.perMinute<=1316/3,`lobby ${lobby.perMinute}`);assert.ok(idle.perMinute<=165/5,`idle ${idle.perMinute}`);
 assert.ok(tv.perMinute<=108/2,`tv ${tv.perMinute}`);assert.ok(party.perMinute<=1353/2,`party ${party.perMinute}`);
 assert.equal(lobby.breakdown.HINCRBY,undefined);
});
