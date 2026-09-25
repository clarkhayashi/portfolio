import {createHash} from 'node:crypto';
import {RedisRoomStore,isQuotaError} from '../room-store.mjs';
import {cloudRequest,PublicError} from '../cloud-game.mjs';
// Read polls are limited in memory, per warm instance, so a poll costs no Redis command for limiting.
// Trade-off: the budget is per instance, not global, so a client spread across N instances gets up to N x 1500/min.
// Polls are cheap GETs, so that is acceptable; writes, joins and creates keep the shared Redis counter.
const reads=new Map();
export function allowRead(bucket,limit=1500,windowMs=60000,now=Date.now()){
 let entry=reads.get(bucket);if(!entry||now-entry.start>=windowMs||now<entry.start){entry={start:now,count:0};reads.set(bucket,entry);}
 if(reads.size>5000)for(const [k,v] of reads)if(now-v.start>=windowMs)reads.delete(k);
 return ++entry.count<=limit;
}
// One store per warm instance so the short poll cache in cloud-game.mjs is shared across requests.
let sharedStore=null;
export const QUOTA_BODY={error:'The game is taking a break',code:'quota'};
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');res.setHeader('X-Content-Type-Options','nosniff');
 try{
  const url=new URL(req.url,'https://game.invalid');const route=url.searchParams.get('route');
  if(route==='info'){res.end(JSON.stringify({addresses:[],online:true}));return;}
  const state=route==='state';
  if(req.method!==(state?'GET':'POST'))throw new PublicError('Method not allowed.',405);
  if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)throw new PublicError('Invalid origin.',403);
  const store=sharedStore||=new RedisRoomStore();
  const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'unknown').split(',')[0];
  const bucket=createHash('sha256').update(ip).digest('hex').slice(0,24);
  if(state?!allowRead(bucket):!await store.allow(`write:${bucket}`,300,60))throw new PublicError('Too many requests. Wait a minute and try again.',429);
  let action;
  if(state)action={code:url.searchParams.get('code'),token:req.headers.authorization?.replace(/^Bearer /,'')||url.searchParams.get('token')};
  else{
   let body=req.body;
   if(body===undefined){body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>120000)throw new PublicError('Submission too large.',413);}}
   if(Buffer.byteLength(typeof body==='string'?body:JSON.stringify(body))>120000)throw new PublicError('Submission too large.',413);
   try{action=typeof body==='string'?JSON.parse(body):body;}catch{throw new PublicError('Invalid request.');}
   if(['create','join'].includes(action?.type)&&!await store.allow(`entry:${bucket}`,30,60))throw new PublicError('Too many room attempts. Try again in a minute.',429);
  }
  res.end(JSON.stringify(await cloudRequest(store,action,{state})));
  }catch(error){
  if(isQuotaError(error)){res.statusCode=503;res.end(JSON.stringify(QUOTA_BODY));return;}
  // Engine errors contain game instructions; storage/network details never go to the client.
  const storageFailure=/storage|fetch|timeout|aborted/i.test(error.message);
  res.statusCode=error.status||(storageFailure?503:400);
  res.end(JSON.stringify({error:storageFailure?'The game is reconnecting. Please try again shortly.':error.message}));
 }
}
