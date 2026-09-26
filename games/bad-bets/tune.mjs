// Tune mode timers (public/tune.js is the hidden ?tune panel). A room created while tune mode is on can
// carry timerScale {write, vote}: multipliers on the phase timers, clamped to 0.5..2, applied to whole
// seconds. Rooms without it (every normal room) run on the exact default timers.
export const TIMER_RANGE=[0.5,2];
// Which timed phases each multiplier stretches. Everything else (betting, spin, reveal, comeback) is untouched.
export const WRITE_PHASES=['play','herdWrite','finaleWrite','finalePlay','pitch','clue','discuss','draft','qauction'];
export const VOTE_PHASES=['vote','herdVote','finalePick','finaleVote','ban'];
const clamp=n=>Math.min(TIMER_RANGE[1],Math.max(TIMER_RANGE[0],Math.round(n*100)/100));
const num=v=>typeof v==='number'&&Number.isFinite(v);
// Validate what the client sent. Anything malformed means "no scaling"; numbers out of range are clamped.
// Returns null when the result is the default (1 and 1), so normal rooms never store the field.
export function parseTimerScale(v){
 if(v===null||v===undefined)return null;
 let w,o;
 if(num(v)){w=o=v;}
 else if(typeof v==='object'&&!Array.isArray(v)){w=num(v.write)?v.write:1;o=num(v.vote)?v.vote:1;if(!num(v.write)&&!num(v.vote))return null;}
 else return null;
 const out={write:clamp(w),vote:clamp(o)};
 return out.write===1&&out.vote===1?null:out;
}
// Seconds for one phase in a scaled room: whole seconds, at least 1.
export function scaledSeconds(phase,seconds,scale){
 if(!scale||!num(seconds)||seconds<=0)return seconds;
 const k=WRITE_PHASES.includes(phase)?scale.write:VOTE_PHASES.includes(phase)?scale.vote:1;
 return k===1?seconds:Math.max(1,Math.round(seconds*k));
}
export function installTune(Game){
 const prev={create:Game.prototype.create,phase:Game.prototype.phase};
 Game.prototype.create=function(name,mode,quick,quickGame,opts={}){
  const out=prev.create.call(this,name,mode,quick,quickGame,opts);
  const scale=parseTimerScale(opts?.timerScale);if(scale)this.rooms.get(out.code).timerScale=scale;
  return out;
 };
 // A paused round resumes with its leftover time, which was already scaled once.
 Game.prototype.phase=function(r,phase,seconds){
  return prev.phase.call(this,r,phase,r.timerScale&&r.phase!=='paused'?scaledSeconds(phase,seconds,r.timerScale):seconds);
 };
}
