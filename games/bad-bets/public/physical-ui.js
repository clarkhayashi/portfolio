const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,action,disabled=false)=>`<button data-action="${action}" ${disabled?'disabled':''}>${label}</button>`;
let audio,latest=null,lastBeat='',localMute=false;
export async function unlockBeat(){audio ||= new (window.AudioContext||window.webkitAudioContext)();await audio.resume();localMute=false;}
export function silenceBeat(){latest=null;lastBeat='';}
export function syncBeat(s){latest=s;}
export function physicalScreen(s){const p=s.physical,n=id=>esc(s.players.find(p=>p.id===id)?.name||'Player'),host=s.you===s.host,keeper=s.you===p.keeper||host,shadow=s.game==='shadow';let h=`<div class="eyebrow">${shadow?'IN-PERSON FACE-OFF':'AROUND THE ROOM'}</div><h2>${shadow?'Shadowbox':'Keep It Going'}</h2>`;
 if(s.phase==='physicalSetup'){
  h+=`<p>${shadow?'Face each other. On the high beep, point or look. Match = hit. Dodge = switch attacker. First to 3 hits.':'Go in the order below. Clap twice, then say something new on the high beep. Two trips around the group; fewest mistakes wins.'}</p>`;
  if(!shadow)h+=`<h3>${esc(p.category||'Choose your category')}</h3>${host?`<form id="category-form"><label for="answer">What did the group choose?</label><input id="answer" maxlength="70" placeholder="US states, pizza toppings, anything…" value="${esc(p.category)}"><button>Use category</button></form><div class="category-picks">${s.categories.map((c,i)=>button(esc(c),'categoryPick:'+i)).join('')}</div>${button('Can’t decide? Let us pick for you','categoryRandom')}`:'<p>Tell the host your category idea.</p>'}`;
  h+=`<div class="physical-order">${s.active.map((id,i)=>`<span>${i+1}. ${n(id)}</span>`).join('')}</div><p>${shadow?`${n(p.attacker)} attacks first. ${n(p.keeper)} records hits and dodges.`:'The host records mistakes. Agree on what counts before starting.'}</p><p>Sound comes from the host device only. Keep it awake and turn up the volume.</p>${host?`<div class="row">${button('Try the beat','practice')}${button('Start round','physicalStart')}</div>`:'<p>Waiting for the host to start the beat.</p>'}`;
 }else{
  h+=`<h3>${shadow?`${n(p.attacker)} attacks` : esc(p.category)}</h3><div class="beat-stage"><strong id="beat-word">${p.paused?'Paused':'3'}</strong><span id="beat-turn">Look at each other</span></div>`;
  if(p.practice)h+='<p>Practice only — scores don’t count.</p>';
  h+=`<div class="physical-scores">${s.active.map(id=>`<div><span>${n(id)}</span><strong>${p.scores[id]}</strong><small>${shadow?'hits':'mistakes'}</small>${keeper&&!p.practice?`<div class="row">${button('−','physicalMinus:'+id,p.scores[id]===0)}${button('+','physicalPlus:'+id,p.scores[id]>=(shadow?3:2))}</div>`:''}</div>`).join('')}</div>`;
  if(s.phase==='physicalConfirm')h+=`<h3>Does this score look right?</h3><p>${p.confirmed.length}/${s.active.length} players confirmed. Settle disagreements in the room before confirming.</p>${s.active.includes(s.you)?`<div class="row">${button(p.confirmed.includes(s.you)?'Confirmed':'Confirm score','physicalConfirm',p.confirmed.includes(s.you))}${button('Fix the score','physicalDispute')}</div>`:'<p>Waiting for the players to confirm.</p>'}`;
  else h+=`<div class="row">${!p.paused?button('Pause','physicalPause'):host?button(p.practice?'Start real round':'Resume beat','physicalStart'):''}${shadow&&keeper&&!p.practice?button('Dodged · switch attacker','physicalDodge'):''}${keeper&&p.canUndo?button('Undo last change','physicalUndo'):''}${host&&!p.practice?button('Finish & review scores','physicalFinish'):''}</div><p>${p.practice?'Listen for two low beeps and one high beep.':shadow?'Record a hit with +. A dodge changes the attacker.':'A repeat, missed turn, or invalid answer counts as one mistake. Pause for disagreements.'}</p>`;
 }
 return h;
}
setInterval(()=>{
 const s=latest,p=s?.physical;if(!p||s.phase!=='physical'||p.paused)return;
 const elapsed=p.elapsed+Date.now()-p.started;
 const countdown=elapsed<3000;const tick=countdown?Math.floor(elapsed/1000):3+Math.floor((elapsed-3000)/1500);const step=countdown?-1:(tick-3)%3;
 const word=countdown?String(3-tick):step===2?(s.game==='shadow'?'GO!':'SAY IT!'):'CLAP';
 const el=document.querySelector('#beat-word');if(el){el.textContent=word;el.dataset.accent=step===2?'yes':'no';}
 const turn=document.querySelector('#beat-turn');if(turn&&s.game==='rhythm'&&!p.practice){const k=Math.min(s.active.length*2-1,Math.max(0,Math.floor((elapsed-3000)/4500)));turn.textContent=`${s.players.find(x=>x.id===s.active[k%s.active.length])?.name} · lap ${Math.floor(k/s.active.length)+1}/2`;}
 const key=`${s.round}:${p.started}:${tick}`;if(key===lastBeat)return;lastBeat=key;
 if(s.you!==s.host||!audio||audio.state!=='running'||localMute)return;
 const osc=audio.createOscillator(),gain=audio.createGain();osc.connect(gain);gain.connect(audio.destination);osc.frequency.value=step===2?880:countdown?520:360;gain.gain.setValueAtTime(.0001,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.17,audio.currentTime+.01);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.16);osc.start();osc.stop(audio.currentTime+.18);
},60);
document.addEventListener('visibilitychange',()=>{if(document.hidden){localMute=true;lastBeat='';}});
