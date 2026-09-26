// Shared state uses compare-and-swap so concurrent devices cannot overwrite votes or chips.
import {RATINGS_KEY} from './ratings.mjs';
import {METRICS_SCRIPT,READ_SCRIPT,METRICS_TTL,metricsKey} from './metrics.mjs';
const CAS = `local current = redis.call('GET', KEYS[1])
if (current or '') ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
return 1`;
const RATE = `local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return count`;
// Upstash answers an exhausted plan with HTTP 429 or an error like "ERR max requests limit exceeded".
export const QUOTA_PATTERN=/limit exceeded|max requests|max daily|max monthly|quota/i;
export class StorageQuotaError extends Error {constructor(){super('Room storage quota exceeded.');this.code='quota';}}
export const isQuotaError=error=>error?.code==='quota';
export class RedisRoomStore {
 cacheReads=true;
 constructor(env=process.env){this.url=env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL;this.token=env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN;if(!this.url||!this.token)throw Error('Room storage is not configured.');}
 async command(args,timeout=3500){let response,data;try{response=await fetch(this.url,{method:'POST',headers:{Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(timeout)});}catch{throw Error('Room storage is temporarily unavailable.');}if(response.status===429)throw new StorageQuotaError();try{data=await response.json();}catch{data=null;}if(QUOTA_PATTERN.test(String(data?.error||'')))throw new StorageQuotaError();if(!response.ok||!data||data.error)throw Error('Room storage is temporarily unavailable.');return data.result;}
 get(code){return this.command(['GET',`bad-bets:room:${code}`]);}
 // Health probe, one command, a real write: Upstash still answers PING after the monthly quota is gone.
 ping(){return this.command(['SET','oops:health','1','EX','300'],2000);}
 async compareAndSwap(code,before,after){return await this.command(['EVAL',CAS,1,`bad-bets:room:${code}`,before||'',after,43200])===1;}
 // Anonymous prompt feedback: one hash, fields "<promptId>:fire" or ":meh". Nothing else is written.
 incrementRating(id,vote){return this.command(['HINCRBY',RATINGS_KEY,`${id}:${vote}`,1],1500);}
 ratings(){return this.command(['HGETALL',RATINGS_KEY],2500);}
 // Anonymous daily funnel counts (metrics.mjs): one EVAL per batch of events, one EVAL to read many days.
 incrementMetrics(day,counts){const flat=Object.entries(counts).flat();if(!flat.length)return Promise.resolve(null);return this.command(['EVAL',METRICS_SCRIPT,1,metricsKey(day),METRICS_TTL,...flat],1500);}
 metrics(days){return this.command(['EVAL',READ_SCRIPT,days.length,...days.map(metricsKey)],2500);}
 async allow(key,limit,seconds){return await this.command(['EVAL',RATE,1,`bad-bets:rate:${key}`,seconds])<=limit;}
}
