// Offline Upstash usage simulator. Runs the real /api/room handler against a counting fake Redis
// (global fetch is swapped out) on a virtual clock. Nothing leaves this process.
// Usage: node usage-sim.mjs [before|after]   (client cadence model; server code is whatever is on disk)
import handler from './api/room.mjs';
import {clearGlobalCounts} from './ratings.mjs';

// Client cadence. "before" = the old fixed loop (700 ms player / 1000 ms TV + ~150 ms request time).
// "after" = the shipped adaptive schedule in public/state-flow.js.
export async function cadence(model){
 if(model==='before')return {player:()=>850,display:()=>1150};
 const {pollDelay}=await import('./public/state-flow.js');
 return {player:(s,idle)=>pollDelay(s,{idleMs:idle}),display:(s,idle)=>pollDelay(s,{idleMs:idle,display:true})};
}

export async function simulate(name,model){
 const real={fetch:globalThis.fetch,now:Date.now};let T=Date.UTC(2026,9,2,18);
 const data=new Map(),hashes=new Map();const counts={total:0};
 const bump=k=>{counts.total++;counts[k]=(counts[k]||0)+1;};
 process.env.UPSTASH_REDIS_REST_URL='https://sim.invalid';process.env.UPSTASH_REDIS_REST_TOKEN='sim';
 globalThis.fetch=async(url,init)=>{
  const args=JSON.parse(init.body);const cmd=String(args[0]).toUpperCase();let result=null;
  if(cmd==='GET'){bump('GET');result=data.get(args[1])??null;}
  else if(cmd==='SET'){bump('SET');data.set(args[1],args[2]);result='OK';}
  else if(cmd==='PING'){bump('PING');result='PONG';}
  else if(cmd==='HINCRBY'){bump('HINCRBY');const h=hashes.get(args[1])||{};h[args[2]]=(h[args[2]]||0)+args[3];hashes.set(args[1],h);result=h[args[2]];}
  else if(cmd==='HGETALL'){bump('HGETALL');result=Object.entries(hashes.get(args[1])||{}).flat();}
  else if(cmd==='EVAL'){
   const script=args[1],key=args[3];
   if(script.includes('HINCRBY')){bump('EVAL metrics');result=1;} // anonymous funnel counts (metrics.mjs)
   else if(script.includes('INCR')){bump('EVAL rate');const n=(Number(data.get(key))||0)+1;data.set(key,n);result=n;}
   else{bump('EVAL cas');if((data.get(key)||'')!==args[4]){result=0;}else{data.set(key,args[5]);result=1;}}
  } else throw Error(`sim: unexpected ${cmd}`);
  return new Response(JSON.stringify({result}),{status:200});
 };
 Date.now=()=>T;clearGlobalCounts();
 const call=async(method,path,body,token,ip)=>{
  let out='';const res={statusCode:200,setHeader(){},end(s){out=s;}};
  await handler({method,url:path,headers:{host:'sim',...(token?{authorization:`Bearer ${token}`}:{}),'x-forwarded-for':ip},body},res);
  return {status:res.statusCode,body:JSON.parse(out)};
 };
 const act=(a,ip='10.0.0.1')=>call('POST','/api/room?route=action',a,null,ip);
 const read=(code,token,ip)=>call('GET',`/api/room?route=state&code=${code}`,undefined,token,ip);
 try{
  const cad=await cadence(model);
  const host=(await act({type:'create',name:'Host',mode:'tournament'})).body;const code=host.code;
  const seats=[host];for(let i=1;i<8;i++)seats.push((await act({type:'join',code,name:`P${i}`},`10.0.0.${i+1}`)).body);
  const room=()=>JSON.parse(data.get(`bad-bets:room:${code}`));
  let clients=[],duration;
  if(name==='lobby'){clients=seats.map((s,i)=>({kind:'player',seat:s,ip:`10.0.0.${i+1}`}));duration=60000;}
  if(name==='party'){await act({...host,type:'start'});clients=seats.map((s,i)=>({kind:'player',seat:s,ip:`10.0.0.${i+1}`,acts:true}));duration=180000;}
  if(name==='idle'){const r=room();r.phase='finished';r.deadline=null;r.version=(r.version||0)+1;data.set(`bad-bets:room:${code}`,JSON.stringify(r));clients=[{kind:'player',seat:host,ip:'10.0.0.1'}];duration=600000;}
  if(name==='display'){const r=room();r.displayToken='tv-token';data.set(`bad-bets:room:${code}`,JSON.stringify(r));clients=[{kind:'display',seat:{code,token:'tv-token'},ip:'10.0.0.99'}];duration=180000;await act({...host,type:'start'});}
  const start=T;const before=counts.total;
  for(const c of clients){c.next=start+Math.floor(Math.random()*800);c.changed=start;c.version=-1;c.nextAct=c.acts?start+15000+Math.random()*15000:Infinity;}
  while(true){
   const c=clients.reduce((a,b)=>(Math.min(a.next,a.nextAct)<=Math.min(b.next,b.nextAct)?a:b));
   const due=Math.min(c.next,c.nextAct);if(due>=start+duration)break;T=due;
   if(c.acts&&c.nextAct<=c.next){await act({...c.seat,type:'submit',value:'pizza'},c.ip);c.nextAct=T+20000+Math.random()*10000;c.changed=T;continue;}
   const {body}=await read(c.seat.code,c.seat.token,c.ip);
   if(body.version!==c.version){c.version=body.version;c.changed=T;}
   c.next=T+cad[c.kind](body,T-c.changed);
  }
  const used=counts.total-before,minutes=duration/60000;const {total,...by}=counts;
  return {scenario:name,model,minutes,commands:used,perMinute:+(used/minutes).toFixed(1),breakdown:by};
 }finally{globalThis.fetch=real.fetch;Date.now=real.now;}
}

if(import.meta.url===`file://${process.argv[1]}`){
 const model=process.argv[2]||'after';
 for(const s of ['lobby','party','idle','display'])console.log(JSON.stringify(await simulate(s,model)));
}
