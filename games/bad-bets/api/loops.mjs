// Loops API on Vercel: /loops/api/* is rewritten here with ?path=. Same core as the local server.
import {handle,redisStore,decodePhoto} from '../loops/core.mjs';
let store=null;
export default async function handler(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');
 try{
  store ||= redisStore();
  const url=new URL(req.url,'https://loops.invalid'),path='/'+(url.searchParams.get('path')||'').replace(/^\/+/,'');
  let body=req.body;
  if(typeof body==='string')body=body?JSON.parse(body):{};
  if(!body||typeof body!=='object'){let raw='';for await(const c of req){raw+=c;if(raw.length>600000)throw Error('That is too big to send.');}body=raw?JSON.parse(raw):{};}
  const out=await handle(store,{method:req.method,path,auth:req.headers.authorization,body});
  if(out.photo){const p=decodePhoto(out.photo);res.statusCode=200;res.setHeader('Content-Type',p.type);res.setHeader('Cache-Control','private, max-age=86400');res.end(p.buffer);return;}
  res.statusCode=out.status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(out.json));
 }catch(e){res.statusCode=500;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:'Loops is taking a break. Try again soon.'}));}
}
