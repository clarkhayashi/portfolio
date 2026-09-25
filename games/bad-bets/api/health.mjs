import {RedisRoomStore,isQuotaError} from '../room-store.mjs';
// Cheap storage check for the home screen: one Redis command at most once a minute per instance (plus CDN cache).
const TTL=60000;let cached=null;
export async function health(makeStore=()=>new RedisRoomStore(),now=Date.now()){
 if(cached&&now-cached.at<TTL)return cached.body;
 let body;try{await makeStore().ping();body={ok:true};}catch(error){body=isQuotaError(error)?{ok:false,code:'quota'}:{ok:false,code:'unavailable'};}
 cached={at:now,body};return body;
}
export function resetHealth(){cached=null;}
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json');res.setHeader('X-Content-Type-Options','nosniff');
 const body=await health();
 res.setHeader('Cache-Control','public, max-age=30, s-maxage=60');res.end(JSON.stringify(body));
}
