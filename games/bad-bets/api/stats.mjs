import {createHash} from 'node:crypto';
import {RedisRoomStore} from '../room-store.mjs';
import {lastDays,statsBody,CLIENT_EVENTS,dayKey} from '../metrics.mjs';
import {allowRead} from './room.mjs';
// Anonymous daily funnel counts (metrics.mjs).
// GET /api/stats?days=14 : read-only totals. One Redis command per cache miss; the CDN keeps it for 60 s.
// POST {"event":"share"|"tv"} : the two events only a browser sees. One command each, limited in memory
// (no Redis command for limiting), same-origin only. Nothing else is accepted or stored.
let sharedStore=null;
const store=()=>sharedStore||=new RedisRoomStore();
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json');res.setHeader('X-Content-Type-Options','nosniff');
 const fail=(status,error)=>{res.statusCode=status;res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({error}));};
 const url=new URL(req.url||'/api/stats','https://game.invalid');
 if(req.method==='GET'){
  const days=lastDays(Number(url.searchParams.get('days'))||14);
  try{const rows=await store().metrics(days);res.setHeader('Cache-Control','public, max-age=60, s-maxage=60');res.end(JSON.stringify(statsBody(days.map((day,i)=>[day,rows?.[i]||[]]))));}
  catch{return fail(503,'Counts are unavailable right now.');}
  return;
 }
 if(req.method!=='POST')return fail(405,'Method not allowed.');
 try{if(!req.headers.origin||new URL(req.headers.origin).host!==req.headers.host)return fail(403,'Invalid origin.');}catch{return fail(403,'Invalid origin.');}
 let body=req.body;
 try{if(body===undefined){body='';for await(const c of req){body+=c;if(body.length>200)return fail(413,'Too large.');}}if(typeof body==='string')body=JSON.parse(body||'{}');}catch{return fail(400,'Invalid request.');}
 const event=body?.event;if(!CLIENT_EVENTS.includes(event))return fail(400,'Unknown event.');
 const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'unknown').split(',')[0];
 if(!allowRead(`stats:${createHash('sha256').update(ip).digest('hex').slice(0,24)}`,20))return fail(429,'Too many requests.');
 try{await store().incrementMetrics(dayKey(),{[event]:1});}catch{}
 res.statusCode=204;res.setHeader('Cache-Control','no-store');res.end();
}
