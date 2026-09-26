// Family / Adults switch and basic host controls.
// Family (the default): adult packs are hidden and turned off, and everything players type goes through the
// strict word filter. Adults: adult packs can be picked by the host (never switched on automatically), and
// typed text is checked for slurs only. This is the one content setting for Party and Minigames; Date Night's
// "Keep it light" is a depth choice inside that deck, not a content filter, so it stays where it is.
// Host controls: pause and resume any timed phase, and swap the prompt in text, number and drawing games.
import {ADULT_PACKS} from './packs.mjs';
import {checkText} from './wordfilter.mjs';
export const AUDIENCES=['family','adults'];
export const isAdults=r=>r.audience==='adults';
// Text fields players type that other players see. Drawings (data URLs) are skipped.
const TEXT={submit:['value'],clue:['value'],pitch:['value'],addCustom:['value','category'],herdAsk:['question','a','b'],finalePrompt:['value'],finaleEntry:['value'],comebackDare:['value'],auctionItem:['value'],physicalCategory:['value']};
export const PAUSABLE=['play','clue','discuss','vote','pitch','draft','wager','ban','comeback','herdWrite','herdVote','finaleWrite','finalePick','finalePlay','finaleVote'];
const HIDDEN_WHEN_PAUSED=['wager','ban','comeback']; // the prompt stays secret until betting is over
export const SKIPPABLE={quips:'quips',draw:'draw',number:'number',brain:'brain'};
const PLAY_SECONDS={quips:45,draw:45};
const canPause=r=>r.mode!=='mixer'&&PAUSABLE.includes(r.phase)&&!!r.deadline;
function canSkip(r){if(r.mode==='mixer'||!SKIPPABLE[r.game]||r.herd||r.game==='finale')return false;const ph=r.phase==='paused'?r.pausedRound?.phase:r.phase;return ['reveal','play'].includes(ph);}

export function installFamily(Game){
 const prev=Object.fromEntries(['create','join','action','view'].map(k=>[k,Game.prototype[k]]));
 Game.prototype.create=function(...args){const out=prev.create.apply(this,args);this.rooms.get(out.code).audience='family';return out;};
 Game.prototype.join=function(code,name){const r=this.rooms.get(String(code).toUpperCase());if(r&&typeof name==='string')checkText(name,{strict:!isAdults(r)});return prev.join.call(this,code,name);};
 Game.prototype.resume=function(r){const pr=r.pausedRound;r.pausedRound=null;this.phase(r,pr?.phase||'play',pr?.remaining?pr.remaining/1000:undefined);};
 Game.prototype.action=function(r,p,a){
  const type=a?.type,host=()=>{if(r.host!==p.id)throw Error('Only the host can do that.');};
  if(TEXT[type])for(const k of TEXT[type]){const v=a[k];if(typeof v==='string'&&!v.startsWith('data:image/'))checkText(v,{strict:!isAdults(r)});}
  if(type==='setAudience'){host();if(r.phase!=='lobby')throw Error('Change this in the lobby.');if(!AUDIENCES.includes(a.audience))throw Error('Choose Family or Adults.');
   r.audience=a.audience;if(a.audience==='family'&&(r.packs||[]).some(id=>ADULT_PACKS.includes(id))){r.packs=r.packs.filter(id=>!ADULT_PACKS.includes(id));r.bags={};}
   r.last=Date.now();this.emit(r);return;}
  if(type==='setPacks'&&!isAdults(r)&&Array.isArray(a.packs)&&a.packs.some(id=>ADULT_PACKS.includes(id)))throw Error('Switch the room to Adults to use that pack.');
  if(type==='pauseRound'){host();if(!canPause(r))throw Error('Nothing to pause right now.');r.pausedRound={phase:r.phase,remaining:Math.max(1000,r.deadline-Date.now())};r.last=Date.now();this.phase(r,'paused');this.emit(r);return;}
  if(type==='resumeRound'){host();if(r.phase!=='paused')throw Error('The game is not paused.');r.last=Date.now();this.resume(r);this.emit(r);return;}
  if(type==='skipPrompt'){host();if(!canSkip(r))throw Error('This prompt can’t be swapped right now.');
   const kind=SKIPPABLE[r.game],from=r.phase==='paused'?r.pausedRound.phase:r.phase;
   if(kind==='number')[r.prompt,r.answer]=this.drawContent(r,'number');else r.prompt=this.drawContent(r,kind);
   r.submissions={};r.promptVersion=(r.promptVersion||0)+1;r.pausedRound=null;r.last=Date.now();
   if(from==='play')this.phase(r,'play',PLAY_SECONDS[r.game]||30);else if(r.phase==='paused')this.phase(r,'reveal',10);
   this.emit(r);return;}
  if(r.phase==='paused'){
   if(['leave','removeDisconnected'].includes(type))this.resume(r); // the round goes on without them
   else if(type!=='takeover')throw Error('The host paused this round.');
  }
  if(type==='submit'&&a.promptVersion!==undefined&&a.promptVersion!==(r.promptVersion||0))throw Error('The prompt changed. Answer the new prompt.');
  return prev.action.call(this,r,p,a);
 };
 Game.prototype.view=function(r,p){const v=prev.view.call(this,r,p);
  v.audience=isAdults(r)?'adults':'family';
  if(!isAdults(r)&&Array.isArray(v.packOptions))v.packOptions=v.packOptions.filter(o=>!o.adult);
  v.canPause=canPause(r);v.canSkip=canSkip(r);v.pausedFrom=r.phase==='paused'?r.pausedRound?.phase||null:null;
  if(r.phase==='paused'&&HIDDEN_WHEN_PAUSED.includes(r.pausedRound?.phase)){v.prompt='';v.secret=null;v.category=null;v.answers={};}
  return v;};
}
