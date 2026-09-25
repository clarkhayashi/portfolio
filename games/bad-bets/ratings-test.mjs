import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,createServer} from './server.mjs';
import {cloudRequest} from './cloud-game.mjs';
import {promptId,fnv1a,rateTarget,builtinIds,localCounts,resetLocalCounts,countsFromHash,RATINGS_KEY} from './ratings.mjs';
import handler from './api/ratings.mjs';

function brainResult(n=3){
 const g=new Game(),host=g.create('Host','minigames'),r=g.rooms.get(host.code);
 for(let i=1;i<n;i++)g.join(host.code,`P${i}`);
 const p=r.players;g.action(r,p[0],{type:'selectGame',game:'brain'});g.action(r,p[0],{type:'start'});g.action(r,p[0],{type:'beginGame'});
 p.forEach((q,i)=>g.action(r,q,{type:'submit',value:`answer ${i}`}));
 assert.equal(r.phase,'result');return {g,r,p};
}
class Store {
 data=new Map();hits=[];
 async get(k){return this.data.get(k)||null;}
 async compareAndSwap(k,b,a){if((this.data.get(k)||null)!==b)return false;this.data.set(k,a);return true;}
 async allow(){return true;}
 async incrementRating(id,vote){this.hits.push(`${id}:${vote}`);}
}
async function cloudBrainResult(s){
 const host=await cloudRequest(s,{type:'create',name:'Host',mode:'minigames'});const guest=await cloudRequest(s,{type:'join',code:host.code,name:'Guest'});
 await cloudRequest(s,{...host,type:'selectGame',game:'brain'});await cloudRequest(s,{...host,type:'start'});await cloudRequest(s,{...host,type:'beginGame'});
 await cloudRequest(s,{...host,type:'submit',value:'one'});await cloudRequest(s,{...guest,type:'submit',value:'two'});
 return {host,guest};
}

test('prompt ids are stable kind plus hash of normalized text',()=>{
 assert.equal(fnv1a(''),'811c9dc5');
 assert.match(promptId('brain','Best midnight snack?'),/^brain-[0-9a-f]{8}$/);
 assert.equal(promptId('brain','Best midnight snack?'),promptId('brain','  best MIDNIGHT snack '));
 assert.notEqual(promptId('brain','Best midnight snack?'),promptId('quips','Best midnight snack?'));
 for(const m of builtinIds().values())assert.ok(m.size>0);
});

test('one vote per player per round, cleared next round, counters increment',()=>{
 resetLocalCounts();const {g,r,p}=brainResult();const id=rateTarget(r);assert.ok(id);
 assert.deepEqual(g.view(r,p[1]).rating,{rated:false});
 g.action(r,p[1],{type:'rate',vote:'fire',round:r.round});
 assert.throws(()=>g.action(r,p[1],{type:'rate',vote:'meh',round:r.round}));
 g.action(r,p[2],{type:'rate',vote:'meh',round:r.round});g.action(r,p[0],{type:'rate',vote:'fire',round:r.round});
 assert.deepEqual(localCounts()[id],{fire:2,meh:1});
 assert.deepEqual(g.view(r,p[1]).rating,{rated:true});
 assert.throws(()=>g.action(r,p[0],{type:'rate',vote:'love',round:r.round}));
 g.action(r,p[0],{type:'replay'});assert.deepEqual(r.rated,[]);
});

test('ratings only on result screens and never for player-written prompts',()=>{
 resetLocalCounts();const {g,r,p}=brainResult();
 r.prompt='A secret prompt my friend wrote';r.custom=[{by:p[1].id,type:'brain',text:r.prompt}];
 assert.equal(g.view(r,p[0]).rating,null);
 assert.throws(()=>g.action(r,p[0],{type:'rate',vote:'fire',round:r.round}));
 assert.deepEqual(localCounts(),{});
 const b=brainResult();b.r.game='shadow';assert.equal(rateTarget(b.r),null);
 const c=brainResult();c.g.phase(c.r,'play',30);assert.equal(c.g.view(c.r,c.p[0]).rating,null);
 assert.throws(()=>c.g.action(c.r,c.p[0],{type:'rate',vote:'fire',round:c.r.round}));
});

test('views never expose who voted what',()=>{
 const {g,r,p}=brainResult();g.action(r,p[1],{type:'rate',vote:'meh',round:r.round});
 const v=JSON.stringify(g.view(r,p[0]));assert.equal(v.includes('meh'),false);assert.equal(v.includes('"rated":['),false);
 assert.equal(JSON.stringify(g.view(r,p[2])).includes('meh'),false);assert.equal(g.publicView(r).rating,null);
});

test('cloud rating records one anonymous counter per vote',async()=>{
 const s=new Store();const {host,guest}=await cloudBrainResult(s);
 const out=await cloudRequest(s,{...guest,type:'rate',vote:'fire'});assert.deepEqual(out.state.rating,{rated:true});
 await assert.rejects(cloudRequest(s,{...guest,type:'rate',vote:'fire'}));
 await cloudRequest(s,{...host,type:'rate',vote:'meh'});
 assert.equal(s.hits.length,2);assert.match(s.hits[0],/^brain-[0-9a-f]{8}:fire$/);assert.match(s.hits[1],/:meh$/);
 const room=JSON.parse(s.data.get(host.code));assert.equal(JSON.stringify(room).includes('fire'),false);
});

test('rating storage errors or hangs never break the game action',async()=>{
 const broken=new Store();broken.incrementRating=async()=>{throw Error('Room storage is temporarily unavailable.');};
 const a=await cloudBrainResult(broken);const out=await cloudRequest(broken,{...a.guest,type:'rate',vote:'fire'});assert.equal(out.ok,true);
 const slow=new Store();slow.incrementRating=()=>new Promise(()=>{});
 const b=await cloudBrainResult(slow);const start=Date.now();const res=await cloudRequest(slow,{...b.guest,type:'rate',vote:'meh'});
 assert.equal(res.ok,true);assert.ok(Date.now()-start<2000);
 const room=JSON.parse(slow.data.get(b.host.code));assert.equal(room.rated.length,1);
});

test('/api/ratings returns anonymous counts with open CORS',async()=>{
 const env={...process.env},realFetch=globalThis.fetch;
 process.env.UPSTASH_REDIS_REST_URL='https://redis.invalid';process.env.UPSTASH_REDIS_REST_TOKEN='t';
 let sent;globalThis.fetch=async(url,init)=>{sent=JSON.parse(init.body);return {ok:true,json:async()=>({result:['brain-0000abcd:fire','3','brain-0000abcd:meh','1','junk','9','quips-1234abcd:fire','-2']})};};
 const call=async(method='GET')=>{const res={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},end(b){this.body=b?JSON.parse(b):null;}};await handler({method,headers:{}},res);return res;};
 try{
  const res=await call();assert.deepEqual(sent,['HGETALL',RATINGS_KEY]);assert.equal(res.statusCode,200);
  assert.deepEqual(res.body,{version:1,counts:{'brain-0000abcd':{fire:3,meh:1}}});
  assert.equal(res.headers['Access-Control-Allow-Origin'],'*');assert.match(res.headers['Cache-Control'],/max-age=60/);
  globalThis.fetch=async()=>{throw Error('down');};const down=await call();assert.equal(down.statusCode,503);assert.deepEqual(down.body.counts,{});
  assert.equal((await call('POST')).statusCode,405);
 }finally{globalThis.fetch=realFetch;process.env=env;}
 assert.deepEqual(countsFromHash({'draw-89abcdef:meh':'4'}),{'draw-89abcdef':{fire:0,meh:4}});
});

test('local server serves /api/ratings with the same shape',async()=>{
 resetLocalCounts();const {r,g,p}=brainResult();g.action(r,p[0],{type:'rate',vote:'fire',round:r.round});
 const server=createServer(new Game());await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const res=await fetch(`http://127.0.0.1:${server.address().port}/api/ratings`);assert.equal(res.headers.get('access-control-allow-origin'),'*');const body=await res.json();assert.equal(body.version,1);assert.deepEqual(body.counts[rateTarget(r)],{fire:1,meh:0});}
 finally{server.close();}
});

test('Party mode rooms accept ratings for each rated game, not Date Night or Shadowbox',async()=>{
 const {quips}=await import('./creative.mjs');const {categories}=await import('./physical.mjs');
 const g=new Game(),host=g.create('Host'),r=g.rooms.get(host.code);g.join(host.code,'Guest');const p=r.players;assert.equal(r.potVersion,2);
 const cases=[['quips',{prompt:quips[0]}],['rhythm',{prompt:categories[0],physical:{category:categories[0],undo:[]}}],['imposter',{secret:'Airport'}],['number',{prompt:'How many keys are on a standard piano?'}]];
 for(const [game,extra] of cases){g.fresh(r);Object.assign(r,{game},extra);g.phase(r,'result');assert.ok(rateTarget(r),game);g.action(r,p[1],{type:'rate',vote:'fire',round:r.round});assert.deepEqual(g.view(r,p[1]).rating,{rated:true});}
 g.fresh(r);Object.assign(r,{game:'rhythm',physical:{category:'Types of my cousins',undo:[]},prompt:'Types of my cousins'});g.phase(r,'result');assert.equal(rateTarget(r),null);
 const d=new Game(),dh=d.create('A'),dr=d.rooms.get(dh.code);d.join(dh.code,'B');Object.assign(dr,{mode:'mixer',game:'mixer',prompt:'Anything'});d.phase(dr,'result');assert.equal(rateTarget(dr),null);
});
