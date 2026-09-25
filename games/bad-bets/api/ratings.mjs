import {RedisRoomStore} from '../room-store.mjs';
import {countsFromHash,ratingsBody} from '../ratings.mjs';
// Public, anonymous prompt counts for the rater page. Only this endpoint allows other origins.
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');
 if(req.method==='OPTIONS'){res.statusCode=204;res.end();return;}
 if(req.method!=='GET'){res.statusCode=405;res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({error:'Method not allowed.'}));return;}
 try{
  const store=new RedisRoomStore();const counts=countsFromHash(await store.ratings());
  res.setHeader('Cache-Control','public, max-age=60, s-maxage=60');res.end(JSON.stringify(ratingsBody(counts)));
 }catch{
  res.statusCode=503;res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({...ratingsBody({}),error:'Counts are unavailable right now.'}));
 }
}
