// Pong sounds and haptics. Sounds are synthesized with Web Audio (no files to download).
// Haptics go to the Loops app / iMessage extension over the native bridge (iOS web pages can't vibrate),
// with navigator.vibrate as the Android fallback. Mute is remembered per device.
let ac=null,master=null;
const store={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);}catch{}}};
export let muted=store.get('loops.muted')==='1';
export function setMuted(m){muted=m;store.set('loops.muted',m?'1':'0');}

// Audio can only start after a tap; call this from any pointer handler.
export function unlock(){
 if(!ac){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;ac=new C();master=ac.createGain();master.gain.value=0.5;master.connect(ac.destination);}
 if(ac.state==='suspended')ac.resume();
}
addEventListener('pointerdown',unlock,{passive:true});

function tone({f=440,f2=f,type='sine',dur=0.12,vol=0.4,at=0,attack=0.004}){
 const t=ac.currentTime+at,o=ac.createOscillator(),g=ac.createGain();
 o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+dur);
 g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+attack);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
 o.connect(g).connect(master);o.start(t);o.stop(t+dur+0.02);
}
function noise({dur=0.2,vol=0.3,at=0,filter='bandpass',f=1200,f2=f,q=1}){
 const t=ac.currentTime+at,n=Math.ceil(ac.sampleRate*dur),buf=ac.createBuffer(1,n,ac.sampleRate),d=buf.getChannelData(0);
 for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
 const s=ac.createBufferSource(),bf=ac.createBiquadFilter(),g=ac.createGain();s.buffer=buf;
 bf.type=filter;bf.Q.value=q;bf.frequency.setValueAtTime(f,t);bf.frequency.exponentialRampToValueAtTime(Math.max(40,f2),t+dur);
 g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
 s.connect(bf).connect(g).connect(master);s.start(t);s.stop(t+dur+0.02);
}

const SOUNDS={
 throw(){noise({dur:0.22,vol:0.18,filter:'highpass',f:600,f2:2400,q:0.7});},
 bounce(){tone({f:1100,f2:700,type:'sine',dur:0.07,vol:0.35});},
 plunk(){tone({f:260,f2:120,type:'sine',dur:0.22,vol:0.55});noise({dur:0.28,vol:0.22,filter:'lowpass',f:1800,f2:300,at:0.02});},
 rim(){tone({f:2300,f2:2100,type:'triangle',dur:0.16,vol:0.25});tone({f:3100,f2:2900,type:'sine',dur:0.1,vol:0.12,at:0.01});},
 miss(){[0,0.14,0.24].forEach((at,i)=>tone({f:900-i*120,f2:600-i*80,dur:0.06,vol:0.28/(i+1),at}));},
 fireball(){noise({dur:0.5,vol:0.3,filter:'bandpass',f:300,f2:3000,q:2});tone({f:110,f2:55,type:'sawtooth',dur:0.4,vol:0.18});},
 ballsBack(){tone({f:660,dur:0.12,vol:0.3});tone({f:990,dur:0.18,vol:0.3,at:0.1});},
 win(){[523,659,784,1047].forEach((f,i)=>tone({f,dur:0.22,vol:0.3,type:'triangle',at:i*0.1}));},
 pick(){tone({f:1400,f2:1000,type:'square',dur:0.04,vol:0.12});},
 yourTurn(){tone({f:880,dur:0.12,vol:0.22});tone({f:1320,dur:0.16,vol:0.18,at:0.09});}
};
// Haptic style per moment: iOS generator names; the number is the Android vibrate length.
const HAPTIC={throw:['light',10],plunk:['medium',25],rim:['rigid',12],miss:['soft',8],fireball:['heavy',[30,40,30]],ballsBack:['success',[15,30,15]],win:['success',[20,40,20,40,60]],pick:['selection',8],yourTurn:['light',15]};

export function fx(name){
 if(!muted&&ac&&SOUNDS[name]){try{SOUNDS[name]();}catch{}}
 const h=HAPTIC[name];if(!h)return;
 try{if(window.webkit?.messageHandlers?.loops)window.webkit.messageHandlers.loops.postMessage({type:'haptic',style:h[0]});else navigator.vibrate?.(h[1]);}catch{}
}
