// Sound and haptics. Every sound is synthesized with the Web Audio API (oscillators and envelopes), so
// there are no audio files and nothing third party. One AudioContext is shared with the rhythm beat
// (physical-ui.js), created and resumed only inside a tap or click, never before a user gesture.
// TV board: sound on by default, with a visible mute toggle. Phones: sound is opt-in (header speaker
// toggle, saved in localStorage). Haptics: Android vibrate only (iOS Safari has none, so it no-ops),
// skipped when the player prefers reduced motion. The pure cue logic below is importable in node for tests.

// ---------- pure: which sounds a state change deserves ----------
export const SOUNDS=['tap','join','round','tick','timeup','lock','reveal','win','lose','bigwin','allin','sheep','fanfare','turn'];
// Phases where the last three seconds tick. Physical rounds keep the host beat instead.
export const TICK_PHASES=['play','vote','wager','clue','draft','pitch','discuss','ban','herdWrite','herdVote','finaleWrite','finalePick','finalePlay','finaleVote','qauction'];
export const BIG_WIN=50;
const liveCount=s=>(s?.players||[]).filter(p=>!p.left).length;
const chipsOf=(s,id)=>(s?.players||[]).find(p=>p.id===id)?.chips;
// Whose turn it is to act alone, if anyone.
export function turnOf(s){if(!s)return null;if(s.phase==='wager')return s.pot?.turn||null;if(s.phase==='clue')return s.cluePlayer||null;if(s.phase==='draft')return s.draftPlayer||null;if(s.phase==='auction')return s.auction?.turn||null;return null;}
// Cues for one poll-to-poll change. tv: the shared board (room-wide cues); otherwise the viewer's phone.
export function cues(a,b,{tv=false}={}){
 const out=[];if(!a||!b||a.code!==b.code)return out;
 const add=c=>{if(!out.includes(c))out.push(c);};
 if(b.waiting)return out; // waiting players get the room's news on their seat, not before
 if(b.phase==='lobby'&&a.phase==='lobby'&&liveCount(b)>liveCount(a))add('join');
 if(tv&&(b.lateJoin?.round||0)+(b.lateJoin?.later||0)>(a.lateJoin?.round||0)+(a.lateJoin?.later||0))add('join');
 if(b.round>0&&b.round!==a.round&&!['lobby','finished'].includes(b.phase))add('round');
 // Somebody just went all in: their pot contribution rose and their stack hit zero.
 if(b.phase==='wager'&&a.pot&&b.pot&&a.round===b.round){for(const id of b.pot.contestants||[]){if((b.pot.contributions?.[id]||0)>(a.pot.contributions?.[id]||0)&&chipsOf(b,id)===0&&chipsOf(a,id)>0){add('allin');break;}}}
 if(tv){ // someone locked something in: an answer, a vote, a bet or a clue
  const n=s=>(s.submissionCount||0)+(s.pot?.total||0)+(s.clueIndex||0)+(s.herd?.locked||0)+(s.finale?.promptsIn||0)+(s.finale?.sent||0)+(s.banCount||0);
  if(a.round===b.round&&a.phase===b.phase&&n(b)>n(a))add('lock');
 }else{const t=turnOf(b);if(t&&t===b.you&&(turnOf(a)!==b.you||a.phase!==b.phase))add('turn');}
 const done=b.phase==='result'&&(a.phase!=='result'||a.round!==b.round);
 if(done&&b.result){const r=b.result;add('reveal');
  const sheep=b.herd?.reveal?.sheep;if(sheep&&(tv||sheep===b.you))add('sheep');
  if(tv){const big=Object.values(r.changes||{}).some(n=>n>=BIG_WIN);if(!r.tie&&(r.winners||[]).length)add(big?'bigwin':'win');}
  else{const me=b.you,change=(r.changes||{})[me],won=(r.winners||[]).includes(me);
   if(typeof change==='number'&&change!==0&&!r.house)add(change>=BIG_WIN?'bigwin':change>0?'win':'lose');
   else if(won&&!r.tie)add('win');
   else if(!r.tie&&(b.active||[]).includes(me)&&(r.winners||[]).length)add('lose');}
 }
 if(b.phase==='finished'&&a.phase!=='finished')add('fanfare');
 return out;
}
// Countdown: 'tick' on each of the last three seconds, 'timeup' when the clock reaches zero. memo keeps state between calls.
export function clockCue(s,now,memo){
 if(!s?.deadline||!TICK_PHASES.includes(s.phase)||s.waiting)return null;
 const left=Math.ceil((s.deadline-now)/1000),key=`${s.code}:${s.round}:${s.phase}:${s.deadline}`;
 if(left>3||left<-1)return null;const k=`${key}:${Math.max(0,left)}`;if(memo.last===k)return null;memo.last=k;
 return left<=0?'timeup':'tick';
}
// Short Android vibration patterns (ms). Only these four moments buzz.
export const HAPTICS={lock:[14],win:[30,40,30,40,70],bigwin:[30,40,30,40,70],lose:[90],turn:[24,60,24]};

// ---------- browser: shared context, synth voices, toggles ----------
const hasWindow=typeof window!=='undefined';
let ctx=null,master=null;
export function audioContext(){return ctx;}
// Create or resume the shared context. Call only from a tap or click handler.
export async function unlockAudio(){
 if(!hasWindow)return null;
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
 ctx ||= new AC();
 if(!master){master=ctx.createGain();master.gain.value=.9;master.connect(ctx.destination);}
 if(ctx.state!=='running')await ctx.resume().catch(()=>{});
 return ctx;
}
const KEY={phone:'oops-sound',tv:'oops-tv-sound'};
let surface='phone';
export function setSurface(s){surface=s==='tv'?'tv':'phone';}
export function soundOn(){try{const v=localStorage.getItem(KEY[surface]);return v===null?surface==='tv':v==='on';}catch{return surface==='tv';}}
export function setSoundOn(on){try{localStorage.setItem(KEY[surface],on?'on':'off');}catch{}}
export const audioReady=()=>!!ctx&&ctx.state==='running';
const reduced=()=>hasWindow&&!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
export function haptic(name){
 const pattern=HAPTICS[name];if(!pattern||!hasWindow||surface==='tv'||reduced())return;
 try{window.webkit?.messageHandlers?.haptic?.postMessage(name);}catch{}
 try{if(typeof navigator.vibrate==='function'&&navigator.userActivation?.hasBeenActive!==false)navigator.vibrate(pattern);}catch{}
}

// One note: frequency glide, attack/decay envelope, optional vibrato. Times are seconds from now.
function note(at,{f=440,to=null,type='triangle',dur=.12,gain=.12,attack=.006,vibrato=0,rate=0,filter=0}){
 const t=ctx.currentTime+at,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+dur);
 let out=o;if(filter){const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=filter;o.connect(lp);out=lp;}
 let lfo=null;if(vibrato){lfo=ctx.createOscillator();const d=ctx.createGain();lfo.frequency.value=rate;d.gain.value=vibrato;lfo.connect(d);d.connect(o.frequency);lfo.start(t);lfo.stop(t+dur+.05);}
 out.connect(g);g.connect(master);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 o.start(t);o.stop(t+dur+.03);o.onended=()=>{try{o.disconnect();g.disconnect();lfo?.disconnect();}catch{}};
}
const seq=(notes,step,opts)=>notes.forEach((f,i)=>note(i*step,{f,...opts}));
// Playful chip-mascot blips: bright triangle and square voices, short and quiet.
const VOICES={
 tap:()=>note(0,{f:1320,type:'sine',dur:.035,gain:.035,attack:.002}),
 join:()=>{note(0,{f:1047,dur:.08,gain:.1});note(.07,{f:1568,dur:.12,gain:.1});},
 round:()=>seq([523,659,784,1047],.065,{dur:.11,gain:.1}),
 tick:()=>note(0,{f:880,type:'sine',dur:.07,gain:.14,attack:.002}),
 timeup:()=>{note(0,{f:660,to:330,type:'square',dur:.26,gain:.06,filter:1800});note(.28,{f:330,to:220,type:'square',dur:.3,gain:.05,filter:1400});},
 lock:()=>{note(0,{f:1568,dur:.04,gain:.09,attack:.002});note(.035,{f:2093,dur:.06,gain:.08,attack:.002});},
 reveal:()=>{note(0,{f:300,to:900,dur:.18,gain:.08});note(.18,{f:1319,type:'sine',dur:.35,gain:.11});},
 win:()=>{seq([784,988,1175],.08,{dur:.1,gain:.1});note(.24,{f:1568,dur:.34,gain:.12});},
 lose:()=>{note(0,{f:392,dur:.16,gain:.1});note(.17,{f:370,dur:.16,gain:.1});note(.34,{f:349,to:311,dur:.42,gain:.1,vibrato:6,rate:7});},
 bigwin:()=>{seq([523,659,784,1047,1319,1568],.05,{type:'square',dur:.08,gain:.05,filter:3200});note(.3,{f:1047,dur:.6,gain:.08});note(.3,{f:1319,dur:.6,gain:.07});note(.3,{f:1568,dur:.6,gain:.07});},
 allin:()=>{note(0,{f:110,to:880,type:'sawtooth',dur:.45,gain:.05,filter:2400});[0,1,2,3,4].forEach(i=>note(.45+i*.045,{f:1800+((i*437)%900),dur:.05,gain:.06,attack:.002}));note(.7,{f:1760,type:'sine',dur:.4,gain:.08});},
 sheep:()=>{note(0,{f:560,to:470,type:'sawtooth',dur:.5,gain:.07,vibrato:38,rate:28,filter:1900});},
 fanfare:()=>{seq([784,784,784],.11,{type:'square',dur:.08,gain:.05,filter:3000});note(.36,{f:1047,type:'square',dur:.3,gain:.06,filter:3000});note(.66,{f:1319,dur:.5,gain:.09});note(.66,{f:1568,dur:.5,gain:.08});note(.66,{f:2093,dur:.5,gain:.05});},
 turn:()=>{note(0,{f:988,type:'sine',dur:.12,gain:.12});note(.1,{f:1319,type:'sine',dur:.2,gain:.12});},
};
// Play a cue if sound is on and the context was unlocked by a gesture. Haptics follow their own rule.
export function play(name,{buzz=true}={}){
 if(buzz)haptic(name);
 if(!soundOn()||!audioReady()||!VOICES[name])return false;
 try{VOICES[name]();return true;}catch{return false;}
}
export function playAll(list){list.forEach((n,i)=>setTimeout(()=>play(n),i*260));}
