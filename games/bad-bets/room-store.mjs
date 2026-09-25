// Shared state uses compare-and-swap so concurrent devices cannot overwrite votes or chips.
import {RATINGS_KEY} from './ratings.mjs';
const CAS = `local current = redis.call('GET', KEYS[1])
if (current or '') ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
return 1`;
const RATE = `local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return count`;
export class RedisRoomStore {
 constructor(env=process.env){this.url=env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL;this.token=env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN;if(!this.url||!this.token)throw Error('Room storage is not configured.');}
 async command(args,timeout=3500){let response,data;try{response=await fetch(this.url,{method:'POST',headers:{Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(timeout)});data=await response.json();}catch{throw Error('Room storage is temporarily unavailable.');}if(!response.ok||!data||data.error)throw Error('Room storage is temporarily unavailable.');return data.result;}
 get(code){return this.command(['GET',`bad-bets:room:${code}`]);}
 async compareAndSwap(code,before,after){return await this.command(['EVAL',CAS,1,`bad-bets:room:${code}`,before||'',after,43200])===1;}
 // Anonymous prompt feedback: one hash, fields "<promptId>:fire" or ":meh". Nothing else is written.
 incrementRating(id,vote){return this.command(['HINCRBY',RATINGS_KEY,`${id}:${vote}`,1],1500);}
 ratings(){return this.command(['HGETALL',RATINGS_KEY],2500);}
 async allow(key,limit,seconds){return await this.command(['EVAL',RATE,1,`bad-bets:rate:${key}`,seconds])<=limit;}
}
