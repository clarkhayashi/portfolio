// Network requests may finish out of order. Never roll a room back to an older revision.
export function isCurrentState(current,next){
 return !current||current.code!==next.code||(next.version??0)>=(current.version??0);
}

// Adaptive polling. Timed play polls fast; lobby, results and finished rooms poll slowly and back off
// further after a minute with no state change and no tap. Presence (lastSeen) tolerates these gaps:
// active phases never poll slower than 3 s, so a player is never "unseen" (15 s) while their tab is open.
export const CALM_PHASES=new Set(['lobby','result','finished','paused']);
export const POLL={active:1000,activeIdle:3000,calm:3000,idle:10000,idleAfter:60000,tvActive:1500,tvCalm:4000,offline:2000,quotaRetry:60000};
export function pollDelay(state,{idleMs=0,display=false}={}){
 if(!state||!state.phase)return POLL.offline;
 const calm=CALM_PHASES.has(state.phase),idle=idleMs>=POLL.idleAfter;
 if(display)return calm?(idle?POLL.idle:POLL.tvCalm):POLL.tvActive;
 if(calm)return idle?POLL.idle:POLL.calm;
 return idle?POLL.activeIdle:POLL.active;
}
// The API answers {code:'quota'} when the free database plan is used up. Repeated storage 503s are treated the same way.
const nextReset=(d=new Date())=>new Date(d.getFullYear(),d.getMonth()+1,1).toLocaleDateString('en-US',{month:'long',day:'numeric'});export const QUOTA_TEXT={title:'The game is taking a short break',get body(){return `Online rooms are paused until the monthly reset on ${nextReset()}. Thanks for your patience!`;}};
export const STORAGE_FAILS_FOR_BREAK=6;
export const isQuota=body=>body?.code==='quota';
