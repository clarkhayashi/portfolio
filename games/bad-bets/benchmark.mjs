import {Game,createServer} from './server.mjs';
import {performance} from 'node:perf_hooks';
import {writeFile} from 'node:fs/promises';
const game=new Game(),server=createServer(game);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const post=async a=>{const r=await fetch(base+'/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(a)});const d=await r.json();if(d.error)throw Error(d.error);return d;};
const host=await post({type:'create',name:'Bench host',mode:'minigames'}),seats=[host];
for(let i=1;i<8;i++)seats.push(await post({type:'join',code:host.code,name:`Player${i}`}));
const timings=[];const start=performance.now();
try{
 for(let i=0;i<100;i++)await Promise.all(seats.map(async a=>{const t=performance.now();const r=await fetch(base+'/state?'+new URLSearchParams(a));if(!r.ok)throw Error('Read failed');await r.json();timings.push(performance.now()-t);}));
 const duration=performance.now()-start;timings.sort((a,b)=>a-b);
 await post({...host,type:'start'});await post({...host,type:'beginGame'});await Promise.all(seats.map(a=>post({...a,type:'submit',value:'pizza'})));
 const final=await (await fetch(base+'/state?'+new URLSearchParams(host))).json();if(final.result?.winners.length!==8)throw Error('Final result mismatch');
 const heap=[];const soak=new Game();for(let batch=0;batch<6;batch++){for(let i=0;i<500;i++){const a=soak.create('Host');for(let j=1;j<8;j++)soak.join(a.code,'P'+j);soak.rooms.get(a.code).last=Date.now()-13*3600000;}soak.tick();global.gc?.();heap.push(process.memoryUsage().heapUsed);if(soak.rooms.size)throw Error('Expired rooms retained');}
 const result={recordedAt:new Date().toISOString(),environment:'Same-machine HTTP, loopback; not a physical-phone Wi-Fi or internet measurement',requests:timings.length,concurrency:8,p50Ms:timings[Math.floor(timings.length*.5)],p95Ms:timings[Math.floor(timings.length*.95)],maxMs:timings.at(-1),requestsPerSecond:timings.length/(duration/1000),eightPlayerRound:'passed',soakRooms:3000,retainedRooms:soak.rooms.size,heapAfterGcBytes:heap,limitations:'Synthetic short benchmark; does not prove absence of leaks or predict cloud performance.'};
 await writeFile(new URL('./benchmark-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
