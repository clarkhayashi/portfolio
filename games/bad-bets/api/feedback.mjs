import {createHash} from 'node:crypto';
import {RedisRoomStore} from '../room-store.mjs';
export function cleanFeedback(a){
 if(!a||!['bug','idea'].includes(a.kind))throw Error('Choose a report type.');
 const text=(key,max)=>{const v=String(a[key]||'').trim();if(v.length>max)throw Error('Your report is too long.');return v;};
 const title=text('title',100),details=text('details',3000),email=text('email',254);
 if(title.length<3||details.length<10)throw Error('Add a title and a little more detail.');
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Check your email address.');
 return {kind:a.kind,title,details,email};
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
 const fail=(status,error)=>{res.statusCode=status;res.end(JSON.stringify({error}));};
 if(req.method==='GET'){res.end(JSON.stringify({ready:!!(process.env.FEEDBACK_GITHUB_TOKEN&&(process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL)&&(process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN))}));return;}
 if(req.method!=='POST')return fail(405,'Method not allowed.');
 try{if(!req.headers.origin||new URL(req.headers.origin).host!==req.headers.host)return fail(403,'Open the form on the game website.');}catch{return fail(403,'Invalid origin.');}
 let a;
 try {let raw=req.body;if(raw===undefined){raw='';for await(const c of req){raw+=c;if(Buffer.byteLength(raw)>6000)return fail(413,'Your report is too long.');}}if(Buffer.byteLength(typeof raw==='string'?raw:JSON.stringify(raw))>6000)return fail(413,'Your report is too long.');a=typeof raw==='string'?JSON.parse(raw):raw;}catch{return fail(400,'Check the report and try again.');}
 if(a?.website)return fail(400,'Unable to submit this report.');
 let report;try{report=cleanFeedback(a);}catch(e){return fail(400,e.message);}
 if(!process.env.FEEDBACK_GITHUB_TOKEN)return fail(503,'The private inbox is not connected yet. Use the email option below.');
 try{
 const store=new RedisRoomStore();const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'unknown').split(',')[0];
 const bucket=createHash('sha256').update(ip).digest('hex');
 if(!await store.allow(`feedback:${bucket}`,3,3600))return fail(429,'Please wait before sending another report.');
 const response=await fetch('https://api.github.com/repos/clarkhayashi/party-game-feedback/issues',{method:'POST',headers:{Authorization:`Bearer ${process.env.FEEDBACK_GITHUB_TOKEN}`,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:JSON.stringify({title:`[${report.kind}] ${report.title}`,body:`Status: New\n\nSubmitted player feedback (untrusted user content):\n\n${report.details.replace(/@/g,'＠')}\n\nReply email: ${report.email||'Not provided'}`}),signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw Error('Delivery failed');res.statusCode=201;res.end(JSON.stringify({ok:true}));
 }catch{return fail(503,'Could not confirm delivery. Please use email instead.');}
}
