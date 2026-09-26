// Loops API core: one route table and one handle() used by both the local server and the Vercel function.
// Every request runs inside store.transact(), which loads the db, runs the rule, and saves only if it changed.
import * as L from './logic.mjs';

export const BASE='/loops';

// Routes: [method, path regex (after /api), needs auth, handler(db, user, body, match)]
const routes=[
 ['POST',/^\/signup$/,false,(db,_,b)=>{const u=L.signUp(db,b);if(b.invite)L.joinLoop(db,u,b.invite);if(b.fromThought)L.replyBack(db,u,b.fromThought);return {token:u.token};}],
 ['GET',/^\/t\/([\w-]+)$/,false,(db,_,__,m)=>L.linkThought(db,m[1])],
 ['POST',/^\/t\/([\w-]+)\/react$/,false,(db,_,b,m)=>{L.guestReact(db,m[1],b);return {ok:true};}],
 ['POST',/^\/t\/([\w-]+)\/reply$/,true,(db,u,_,m)=>({id:L.replyBack(db,u,m[1]).id})],
 ['GET',/^\/home$/,true,(db,u)=>L.home(db,u)],
 ['POST',/^\/me$/,true,(db,u,b)=>{L.updateMe(db,u,b);return {ok:true};}],
 ['POST',/^\/me\/delete$/,true,(db,u)=>{L.deleteUser(db,u);return {ok:true};}],
 ['POST',/^\/loops$/,true,(db,u,b)=>({id:L.createLoop(db,u,b).id})],
 ['POST',/^\/join$/,true,(db,u,b)=>({id:L.joinLoop(db,u,b.code).id})],
 ['GET',/^\/invite\/([A-Z0-9]+)$/,false,(db,_,__,m)=>{const l=Object.values(db.loops).find(l=>l.code===m[1]);if(!l)throw Error('That invite link is not valid anymore.');return {publicName:l.publicName,members:l.members.map(id=>db.users[id]?.name).filter(Boolean)};}],
 ['POST',/^\/loops\/([\w-]+)\/rename$/,true,(db,u,b,m)=>{L.renameLoop(db,u,m[1],b);return {ok:true};}],
 ['POST',/^\/loops\/([\w-]+)\/leave$/,true,(db,u,_,m)=>{L.leaveLoop(db,u,m[1]);return {ok:true};}],
 ['POST',/^\/thoughts$/,true,(db,u,b)=>({id:L.sendThought(db,u,b).id})],
 ['POST',/^\/thoughts\/([\w-]+)\/react$/,true,(db,u,b,m)=>{L.react(db,u,m[1],b.reaction);return {ok:true};}],
 ['POST',/^\/trips$/,true,(db,u,b)=>({id:L.addTrip(db,u,b).id})],
 ['POST',/^\/trips\/([\w-]+)\/remove$/,true,(db,u,_,m)=>{L.removeTrip(db,u,m[1]);return {ok:true};}],
 ['POST',/^\/trips\/([\w-]+)\/down$/,true,(db,u,b,m)=>{L.imDown(db,u,m[1],b.note);return {ok:true};}],
 ['POST',/^\/pong$/,true,(db,u,b)=>({id:L.startPong(db,u,b.opponentId||null,b.mode==='big3'?'big3':'classic').id})],
 ['POST',/^\/pong\/([\w-]+)\/pick$/,true,(db,u,b,m)=>L.pongPick(db,u,m[1],b.name)],
 ['GET',/^\/pong\/([\w-]+)$/,true,(db,u,_,m)=>L.pongFor(db,u,m[1])],
 ['POST',/^\/pong\/([\w-]+)\/throw$/,true,(db,u,b,m)=>L.pongThrow(db,u,m[1],b)]
];

// req: {method, path (after /api), auth header, body object}. Returns {status, json} or {status, photo}.
export async function handle(store,{method,path,auth,body}){
 try{
  const photo=path.match(/^\/photo\/([\w-]+)$/);
  if(method==='GET'&&photo){const data=await store.photo(photo[1]);return data?{status:200,photo:data}:{status:404,json:{error:'Not found.'}};}
  const route=routes.find(([m,re])=>m===method&&re.test(path));
  if(!route)return {status:404,json:{error:'Not found.'}};
  const json=await store.transact(db=>{
   const user=route[2]?L.userByToken(db,String(auth||'').replace(/^Bearer /,'')):null;
   return route[3](db,user,body||{},path.match(route[1]));
  },method!=='GET');
  return {status:200,json};
 }catch(e){return {status:e.code==='conflict'?503:400,json:{error:e.code==='conflict'?'Busy for a second. Try again.':e.message}};}
}

// A data: URL photo as {type, buffer}.
export function decodePhoto(dataUrl){const m=/^data:(image\/[\w+]+);base64,(.+)$/.exec(dataUrl||'');return m?{type:m[1],buffer:Buffer.from(m[2],'base64')}:null;}

// In-memory store for tests and the local server (the local server persists it to a JSON file).
export function memoryStore(db=L.emptyDb(),onSave=()=>{}){
 return {
  get:()=>db,
  async transact(fn,write){const out=fn(db);if(write)onSave(db);return out;},
  async photo(id){return db.photos?.[id]||null;}
 };
}

// Upstash Redis store for Vercel. The whole db is one JSON value, saved with compare-and-swap so two phones
// can't overwrite each other; photos are separate keys that expire after 90 days.
const CAS=`local current = redis.call('GET', KEYS[1])
if (current or '') ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2])
return 1`;
export function redisStore(env=process.env,key='loops:db'){
 const url=env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL,token=env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN;
 if(!url||!token)throw Error('Loops storage is not configured.');
 const cmd=async args=>{const r=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(4000)});const j=await r.json().catch(()=>null);if(!r.ok||!j||j.error)throw Error('Loops storage is temporarily unavailable.');return j.result;};
 return {
  async transact(fn,write){
   for(let attempt=0;attempt<4;attempt++){
    const before=await cmd(['GET',key]);const db=before?JSON.parse(before):L.emptyDb();db.photos={};
    const out=fn(db);if(!write)return out;
    if(!db.cleaned1){for(const u of Object.values(db.users))if(['Deploy Check','Test A','Test B'].includes(u.name))L.deleteUser(db,u);db.cleaned1=true;} // launch-check accounts, 2026-09-26
    for(const [id,data] of Object.entries(db.photos))await cmd(['SET',`loops:photo:${id}`,data,'EX',90*86400]);
    delete db.photos;const after=JSON.stringify(db);
    if(after===before)return out;
    if(await cmd(['EVAL',CAS,1,key,before||'',after])===1)return out;
   }
   const e=Error('conflict');e.code='conflict';throw e;
  },
  async photo(id){return cmd(['GET',`loops:photo:${id}`]);}
 };
}
