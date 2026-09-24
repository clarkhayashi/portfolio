import {createHash} from 'node:crypto';
import {RedisRoomStore} from '../room-store.mjs';
import {cloudRequest,PublicError} from '../cloud-game.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');res.setHeader('X-Content-Type-Options','nosniff');
 try{
  const url=new URL(req.url,'https://game.invalid');const route=url.searchParams.get('route');
  if(route==='info'){res.end(JSON.stringify({addresses:[],online:true}));return;}
  const state=route==='state';
  if(req.method!==(state?'GET':'POST'))throw new PublicError('Method not allowed.',405);
  if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)throw new PublicError('Invalid origin.',403);
  const store=new RedisRoomStore();
  const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'unknown').split(',')[0];
  const bucket=createHash('sha256').update(ip).digest('hex').slice(0,24);
  if(!await store.allow(`${state?'read':'write'}:${bucket}`,state?1500:300,60))throw new PublicError('Too many requests. Wait a minute and try again.',429);
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
  // Engine errors contain game instructions; storage/network details never go to the client.
  const storageFailure=/storage|fetch|timeout|aborted/i.test(error.message);
  res.statusCode=error.status||(storageFailure?503:400);
  res.end(JSON.stringify({error:storageFailure?'The game is reconnecting. Please try again shortly.':error.message}));
 }
}
