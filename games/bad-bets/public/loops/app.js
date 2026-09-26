import './tune.js';
// Loops web client. One file, template strings, re-render on every state change.
// Talks only to /api with a bearer token, so an iOS shell can load this page or call the same API.
const $=s=>document.querySelector(s);
// Everything lives under /loops (play.clarkhayashi.com/loops, or localhost:3300/loops).
const BASE='/loops',ORIGIN=location.origin+BASE;
// Inside the iMessage extension the page runs with ?im=1; the native side listens on messageHandlers.loops.
{const q=new URLSearchParams(location.search);if(q.get('im')==='1'){try{sessionStorage.setItem('loops.im','1');}catch{}}}
const IM=(()=>{try{return sessionStorage.getItem('loops.im')==='1';}catch{return false;}})();
const native=msg=>{try{window.webkit?.messageHandlers?.loops?.postMessage(msg);}catch{}};
const route=()=>location.pathname.slice(BASE.length)||'/';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v);}catch{}}};
// Local demo links carry ?login=<token> so one person can try several accounts in separate tabs.
{const q=new URLSearchParams(location.search).get('login');if(q){try{sessionStorage.setItem('loops.token',q);}catch{}history.replaceState(null,'',location.pathname+(location.search.includes('im=1')?'?im=1':''));}}
const tabToken=(()=>{try{return sessionStorage.getItem('loops.token');}catch{return null;}})();
let startGroup=false,pongMode='classic',pollTimer=null;
let token=tabToken||store.get('loops.token'),data=null,tab='home',openLoop=null,draft={to:null,text:'',url:'',photo:null},lastLink=null,pongOpen=null;
import {mountPong} from './pong.js';
import {mountDerby} from './derby.js';
import {fx,muted,setMuted} from './sfx.js';
import {openOopsRoom} from './oops.js';

async function api(path,body){
 const r=await fetch(BASE+'/api'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});
 const j=await r.json().catch(()=>({error:'Something went wrong.'}));
 if(!r.ok)throw Error(j.error||'Something went wrong.');return j;
}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2600);}
// quiet=true is the background refresh: it never re-draws while someone is typing, or when nothing changed.
let lastJson='';
async function refresh(quiet=false){if(!token)return;try{const next=await api('/home'),json=JSON.stringify(next);
 if(quiet&&(json===lastJson||document.activeElement?.matches('input,textarea,select')||(tab==='send'&&draft.to)||pongOpen||derbyOpen||shootOpen||duelOpen))return;
 data=next;lastJson=json;}catch(e){if(/Sign in/.test(e.message)){token=null;store.set('loops.token',null);}if(!quiet)toast(e.message);}render();}
async function act(fn,ok){try{const out=await fn();if(ok)toast(ok);await refresh();return out;}catch(e){toast(e.message);return null;}}

const fmtDate=d=>new Date(d+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'});
const ago=ms=>{const m=Math.round((Date.now()-ms)/60000);if(m<1)return 'just now';if(m<60)return m+'m ago';const h=Math.round(m/60);if(h<24)return h+'h ago';return Math.round(h/24)+'d ago';};
const inviteUrl=code=>`${ORIGIN}/j/${code}`;

// ---------- screens ----------
function onboarding(invite,loopInfo){
 return `<section class="hero"><h1>Loops</h1>
 <p>Send a thought when you think of someone. They can send one back whenever. <b>Replies are a gift.</b></p>
 <p class="muted small">No streaks. No read receipts. No likes to count.</p></section>
 ${loopInfo?`<div class="card invite"><h3>You're invited to ${esc(loopInfo.publicName)}</h3><p class="small">${esc(loopInfo.members.join(', '))} ${loopInfo.members.length===1?'is':'are'} in it.</p></div>`:''}
 <form id="signup" class="card">
  <label for="name">Your first name</label><input id="name" name="name" autocomplete="given-name" maxlength="24" required autofocus>
  <button class="accent" type="submit" style="width:100%">${invite?'Join the loop':'Start'}</button>
 </form>`;
}

function giftCard(t){
 return `<article class="card gift">
  <div class="row"><span class="from grow">${esc(t.from?.name)}${t.to.type==='loop'?` <span class="muted small">to ${esc(t.to.name)}</span>`:''}</span><span class="muted small">${ago(t.createdAt)}</span></div>
  ${t.text?`<p>${esc(t.text)}</p>`:''}${t.url?`<p><a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.url)}</a></p>`:''}
  ${t.photo?`<img src="${t.photo}" alt="Photo from ${esc(t.from?.name)}">`:''}
  <div class="react">${data.reactions.map(r=>`<button data-react="${t.id}" data-r="${esc(r)}" class="${t.myReaction===r?'on':''}" aria-label="React ${esc(r)}">${esc(r)}</button>`).join('')}</div>
  <button class="link" data-sendto="user:${t.from?.id}">Send one back (only if you want)</button>
 </article>`;
}

const record=g=>`You ${g.record.me}–${g.record.them} ${esc(g.vs)} all time`;

const SLOT_NAME={guard:'Guard',wing:'Wing',big:'Big'};
// Headshots: the same Wikimedia Commons photos Oops uses (credits at /credits.html). Missing or broken photos
// fall back to an initials badge, so a card never shows an empty box.
let PHOTOS={};fetch('/players/players.json').then(r=>r.ok?r.json():{}).then(j=>{PHOTOS=j||{};if(pageGame?.mode==='big3')render();}).catch(()=>{});
const initials=n=>String(n).split(/\s+/).filter(w=>/^[A-Za-z]/.test(w)).map(w=>w[0].toUpperCase()).slice(0,2).join('')||'?';
const badge=(n,size)=>`<span class="hs hs-${size} hs-initials" aria-hidden="true">${esc(initials(n))}</span>`;
function headshot(name,size='lg'){const p=PHOTOS[name]?.file;
 if(typeof p!=='string'||!/^\/players\/[a-z0-9-]+\.jpg$/.test(p))return badge(name,size);
 return `<img class="hs hs-${size}" src="${p}" alt="" width="64" height="64" loading="eager" decoding="async" onerror="this.outerHTML=this.dataset.fb" data-fb="${esc(badge(name,size))}">`;}
const pct=x=>`${x>=1?'+':'−'}${Math.round(Math.abs(x-1)*100)}%`;
const lineup=(picks,who)=>`<div class="lineup"><b>${esc(who)}</b>${['guard','wing','big'].map(k=>picks[k]?`<span class="pill pill-hs">${headshot(picks[k].name,'sm')}${SLOT_NAME[k]}: ${esc(picks[k].name)}</span>`:`<span class="pill muted">${SLOT_NAME[k]}: …</span>`).join('')}</div>`;
// Big 3 draft: pick a guard, a wing and a big. Each card says what that player will do to your game.
function draftView(g,page=false){
 const d=g.draft,what={guard:c=>`Aim ${pct(1+0.35*(c.off-75)/50)}`,wing:c=>{const w=Math.max(c.off,c.def);return `🔥 Fireball after ${w>=92?2:w>=82?3:4}`;},big:c=>`Contest ${pct(1-0.2*(c.def-75)/50)} on them`};
 return `${page?'':'<button class="link" data-closepong>← Home</button>'}
 ${soundToggle()}<h1>Big 3 draft</h1><p class="muted small">vs ${esc(g.vs)} · Guard sets your aim, wing sets your heat, big contests their shots.</p>
 ${lineup(d.mine,'You')}${lineup(d.theirs,g.vs)}
 ${d.myPick?`<h2>Pick your ${d.slot}</h2><div class="picks">${d.board.map(c=>`<button class="card pickcard" data-pick="${esc(c.name)}">${headshot(c.name)}<span class="pickinfo"><b>${esc(c.name)}</b><span class="small muted">${esc(c.note)}</span><span class="pill">${what[d.slot](c)}</span></span></button>`).join('')}</div>`
  :`<div class="empty">${esc(d.picker)} is picking their ${d.slot}. ${page?'This updates by itself.':'No rush.'}</div>`}
 <p class="small muted" style="text-align:center"><a href="/credits.html" target="_blank" rel="noopener">Photo credits</a></p>`;
}
// Scout (from Oops) grades each finished lineup. Just for bragging: the cups still decide the game.
const withGrade=(who,x)=>x?`${who} · Scout ${x.grade}`:who;
function statsStrip(g){
 const d=g.draft;if(!d?.stats)return '';const m=d.stats.me,t=d.stats.them,gr=d.grades||{};
 return `<div class="card statstrip">${lineup(d.mine,withGrade('You',gr.me))}<p class="small">Aim ${pct(m.aim*t.contest)} after their contest · 🔥 Fireball after ${m.heat} in a row${d.streak?` (on ${d.streak})`:''}</p>${lineup(d.theirs,withGrade(g.vs,gr.them))}${gr.me?`<p class="small muted">Scout on your squad: ${esc(gr.me.report)}</p>`:''}</div>`;
}

// Drawn icons (not emoji) for the Liquid Glass buttons: sound on/off, enter/exit full screen.
const ICON={
 sound:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
 muted:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9.5l5 5M22 9.5l-5 5"/></svg>',
 shrink:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
 expand:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>'};
const soundToggle=()=>`<button class="glass sound" data-sound aria-label="${muted?'Turn sound on':'Turn sound off'}">${muted?ICON.muted:ICON.sound}</button>`;
const fullToggle=full=>`<button class="glass" data-derbyfull aria-label="${full?'Exit full screen':'Full screen'}">${full?ICON.shrink:ICON.expand}</button>`;
function pongView(g,page=false){
 if(g.mode==='big3'&&!g.draft.done)return draftView(g,page);
 const status=g.done?(g.won?'You won. 🏆':`${esc(g.winnerName||g.vs)} won.`):g.open&&!g.seated?'Take the open seat: shoot first to join.':g.myTurn?`${g.left} ${g.left===1?'ball':'balls'} left. Sink both and you get them back.`:g.open?'Waiting for a friend to open it. You go next.':`Nice. ${esc(g.vs)} is up.`;
 return `${page?'':'<button class="link" data-closepong>← Home</button>'}
 ${soundToggle()}<h1>${g.open&&!g.seated?'Pong challenge':`${g.mode==='big3'?'Big 3 Pong':'Pong'} vs ${esc(g.vs)}`}</h1><p class="muted small">${record(g)}</p>
 ${statsStrip(g)}
 <p><b>${status}</b></p>
 <div id="pong" class="pong">${'<canvas aria-label="Pong table. Flick up from the bottom to throw."></canvas>'}
  ${g.myTurn?`<p class="small muted">Flick up from the bottom: longer = farther, sideways = aim.</p>
  <details><summary class="small">Use sliders instead</summary><form class="card"><label>Aim <input name="aim" type="range" min="-100" max="100" value="0"></label><label>Power <input name="power" type="range" min="0" max="100" value="62"></label><button class="accent" type="submit">Throw</button></form></details>`:''}</div>
 <p class="small">Their cups left: ${g.targets.filter(Boolean).length} · Yours: ${g.mine.filter(Boolean).length}</p>
 ${g.done&&g.vsId&&!page?`<button class="accent" data-challenge="${g.vsId}">Rematch</button>`:''}`;
}

// Text a friend a game: tap a game, then "Text it" opens Messages with the link typed in. They open it, type
// a first name, and play. No app or account on their side.
let sentGame=null;
// art: Oops sticker SVGs in /loops/art (same style as Oops' props). Emoji stay only in texted messages and reactions.
const gameArt=(k,size=56)=>`<img class="gameart" src="${BASE}/art/${k}.svg" alt="" width="${size}" height="${size}">`;
const GAMES={shootout:{kind:'shootout',name:'Penalty Shootout',emoji:'⚽',blurb:'Pick your shot and your dive.'},derby:{kind:'derby',name:'Home Run Derby',emoji:'⚾',blurb:'10 pitches. Most homers wins.'},pong:{mode:'classic',name:'Pong',emoji:'🏓',blurb:'Flick to sink their cups.'},big3:{mode:'big3',name:'Big 3 Pong',emoji:'🏀',blurb:'Draft a guard, wing and big first.'},duel:{kind:'duel',name:'Draft Duel',emoji:'🃏',blurb:'Draft 5 under the cap. Scout grades it.'}};
let duelChoose=false,liveRoom=null;
const aGrade=g=>`${/^[AF]/.test(g||'')?'an':'a'} ${g}`; // "an A−", "a B+"
const smsLink=msg=>`sms:?&body=${encodeURIComponent(msg)}`;
function textAGame(){
 if(liveRoom)return `<div class="card invite"><h3>${liveRoom.duel?'🃏 Live draft room':'🎲 Game night room'} ${esc(liveRoom.code)} is open</h3><p class="small">${liveRoom.duel?'This one is live: you both draft at the same time, 30 seconds a pick. Text it, then jump in.':'Text the group, then jump in. The room stays open for 12 hours.'}</p>
   <a class="btn accent full" href="${smsLink(liveRoom.msg)}">💬 Text it</a>
   <div class="row" style="margin-top:8px"><a class="btn ghost" href="${liveRoom.enter}">Go to the room →</a>${liveRoom.loopId?`<button class="ghost" data-postnight>Post in the loop</button>`:''}<button class="link" data-newgame>Done</button></div></div>`;
 if(duelChoose)return `<div class="card invite"><h3 class="arthead">${gameArt('duel',32)} Draft Duel</h3><p class="small">Same players for both of you, $130 for five. Oops' Scout grades each team and the better team wins.</p>
   <button class="accent full" data-duelmode="async">🕒 Anytime: you draft now, they draft later</button>
   <button class="ghost full" style="margin-top:8px" data-duelmode="live">⚡ Live now: a real-time Oops 1v1 room</button>
   <button class="link" data-newgame>Back</button></div>`;
 if(sentGame){const G=GAMES[sentGame.key],url=`${ORIGIN}/${G.kind==='derby'?'d':G.kind==='shootout'?'s':G.kind==='duel'?'r':'p'}/${sentGame.id}`,msg=G.kind==='duel'?`${data.me.name} drafted ${aGrade(sentGame.grade)} team 🃏 Beat it: ${url}`:G.kind==='shootout'?`${data.me.name} took a penalty ⚽ Save it, then take yours: ${url}`:G.kind==='derby'?`${data.me.name} hit ${sentGame.hr} ${sentGame.hr===1?'homer':'homers'} ⚾ Beat it: ${url}`:`${data.me.name} challenged you to ${G.name} ${G.emoji} ${url}`;
  return `<div class="card invite"><h3 class="arthead">${gameArt(sentGame.key,32)} ${G.kind==='duel'?`Scout gave you ${esc(aGrade(sentGame.grade))}. Send it.`:G.kind==='derby'?`You hit ${sentGame.hr}. Send it.`:G.kind==='shootout'?'Your penalty is in. Send it.':`${G.name} is ready`}</h3><p class="small">${G.kind==='duel'?'They draft the same board without seeing your picks. Better Scout grade wins.':G.kind==='shootout'?'They pick their dive and their shot. Then you both see what happened.':G.kind==='derby'?'They get the same 10 pitches. Most homers wins.':'Send it to a friend. They go first, and you get your turn after.'}</p>
   <a class="btn accent full" href="sms:?&body=${encodeURIComponent(msg)}">💬 Text it</a>
   <div class="row" style="margin-top:8px"><button class="ghost" data-copy="${esc(url)}" data-sharetext="${esc(`${data.me.name} challenged you to ${G.name} ${G.emoji}`)}">${navigator.share?'Share…':'Copy link'}</button><button class="link" data-newgame>Done</button></div></div>`;}
 return `<h2 style="margin-top:8px">Text a friend a game</h2><div class="games">${Object.entries(GAMES).map(([k,G])=>`<button class="card gametile" data-textgame="${k}">${gameArt(k)}<b>${G.name}</b><span class="small muted">${G.blurb}</span></button>`).join('')}</div>`;
}

// First run: nobody to talk to yet. Two one-tap paths straight to a first send; nothing else on screen.
function firstRun(){
 return `<h1>Hi, ${esc(data.me.name)}</h1>${textAGame()}
 <h2>Or keep in touch another way</h2>
 <div class="row"><button class="ghost" data-start="thought">💭 Send a thought</button><button class="ghost" data-start="group">👥 Invite a group</button></div>
 ${startGroup?`<form id="quickloop" class="card"><label for="qpub">Group name</label><input id="qpub" name="publicName" maxlength="40" placeholder="Kalani Class of ’22" required autofocus><button class="accent full" type="submit">Make it and get the invite link</button></form>`:''}`;
}

// Home: only three things. What's waiting on you, a game to text a friend, and the latest thoughts for you.
let showAllGifts=false;
function homeView(){
 if(!data.loops.length&&!data.people.length&&!data.gifts.length&&!data.sent.length)return firstRun();
 const mine=data.pongs.filter(g=>g.myTurn),wait=data.pongs.filter(g=>!g.myTurn&&!g.done&&!g.open),done=data.pongs.filter(g=>g.done).slice(0,1);
 const moves=[
  ...data.shootouts.filter(g=>g.myTurn&&!(g.open&&g.rounds.length===0&&!g.theyPicked&&g.myPicked)).map(g=>row('⚽',g.open&&!g.rounds.length?'Your penalty challenge':`Round ${g.round} vs ${esc(g.vs)}${g.suddenDeath?' · sudden death':''}`,`${g.score.me}–${g.score.them}${g.theyPicked?' · they already picked':''}`,`<button class="accent" data-shoot="${g.id}">Pick</button>`)),
  ...data.shootouts.filter(g=>g.done).slice(0,1).map(g=>row('⚽',g.won?`You beat ${esc(g.vs)}, ${g.score.me}–${g.score.them}`:g.tie?`Tied ${esc(g.vs)}`:`${esc(g.vs)} won, ${g.score.them}–${g.score.me}`,'Penalty Shootout',g.vsId?`<button class="ghost" data-reshoot="${g.vsId}">Rematch</button>`:'')),
  ...(data.duels||[]).filter(g=>g.myTurn).map(g=>row('🃏',g.theirs?`Beat ${esc(g.vs)}’s ${esc(g.theirs.grade)} draft`:'Your draft','Draft Duel',`<button class="accent" data-duel="${g.id}">Draft</button>`)),
  ...(data.duels||[]).filter(g=>g.done).slice(0,1).map(g=>row('🃏',g.won?`You beat ${esc(g.vs)}, ${esc(g.mine.grade)} to ${esc(g.theirs.grade)}`:g.tie?`Tied ${esc(g.vs)}`:`${esc(g.vs)} won, ${esc(g.theirs.grade)} to ${esc(g.mine.grade)}`,'Draft Duel',g.vsId?`<button class="ghost" data-reduel="${g.vsId}">Rematch</button>`:'')),
  ...data.derbies.filter(g=>g.myTurn).map(g=>row('⚾',g.theirs?`Beat ${esc(g.vs)}’s ${g.theirs.hr} ${g.theirs.hr===1?'homer':'homers'}`:'Your at-bat','Home Run Derby',`<button class="accent" data-derby="${g.id}">Bat</button>`)),
  ...data.derbies.filter(g=>g.done).slice(0,1).map(g=>row('⚾',g.won?`You beat ${esc(g.vs)}, ${g.mine.hr}–${g.theirs.hr}`:g.tie?`Tied ${esc(g.vs)}, ${g.mine.hr}–${g.theirs.hr}`:`${esc(g.vs)} won, ${g.theirs.hr}–${g.mine.hr}`,'Home Run Derby',g.vsId?`<button class="ghost" data-rederby="${g.vsId}">Rematch</button>`:'')),
  ...mine.filter(g=>g.id!==sentGame?.id).map(g=>{const pick=g.mode==='big3'&&!g.draft.done,name=g.mode==='big3'?'Big 3 Pong':'Pong';
   if(g.open)return row(pick?'🏀':'🏓',`Your ${name} challenge`,'Go first while a friend joins',`<button class="accent" data-pong="${g.id}">${pick?'Pick':'Shoot'}</button>`);
   return row(pick?'🏀':'🏓',pick?`Your pick vs ${esc(g.vs)}`:`Your shot vs ${esc(g.vs)}`,g.lastNote?esc(g.lastNote):record(g),`<button class="accent" data-pong="${g.id}">${pick?'Pick':'Shoot'}</button>`);}),
  ...data.invites.filter(i=>!i.down).map(i=>row('📍',`${esc(i.who)} is in ${esc(i.city)}`,`${fmtDate(i.from)} to ${fmtDate(i.to)}${i.note?` · “${esc(i.note)}”`:''}`,`<button class="accent" data-down="${i.id}">I’m down</button>`)),
  ...done.map(g=>row('🏓',g.won?`You beat ${esc(g.vs)}`:`${esc(g.vs)} won`,record(g),g.vsId?`<button class="ghost" data-challenge="${g.vsId}">Rematch</button>`:''))];
 const gifts=showAllGifts?data.gifts:data.gifts.slice(0,3);
 return `<h1>Hi, ${esc(data.me.name)}</h1>
 ${moves.length?`<section class="card rows"><h3>Your move</h3>${moves.join('')}</section>`:''}
 ${wait.length?`<p class="muted small">Waiting on ${wait.map(g=>esc(g.vs)).join(', ')}. No rush.</p>`:''}
 ${textAGame()}
 <h2>For you</h2>
 ${gifts.length?gifts.map(giftCard).join(''):`<div class="empty">Thoughts from friends land here. No pressure to reply.</div>`}
 ${data.gifts.length>3&&!showAllGifts?`<button class="link" data-allgifts>See all ${data.gifts.length}</button>`:''}`;
}
const ROW_ART={'⚽':'shootout','⚾':'derby','🏓':'pong','🏀':'big3','🃏':'duel'};
const row=(icon,title,sub,action)=>`<div class="mrow">${ROW_ART[icon]?`<img class="micon art" src="${BASE}/art/${ROW_ART[icon]}.svg" alt="" width="36" height="36">`:`<span class="micon">${icon}</span>`}<span class="mtext"><b>${title}</b><span class="small muted">${sub}</span></span>${action}</div>`;

function sendView(){
 const targets=[...data.people.map(p=>({key:'user:'+p.id,label:p.name+(p.openDoor?' ·':'')})),...data.loops.map(l=>({key:'loop:'+l.id,label:l.name+' (loop)'})),{key:'link:',label:'Someone not on Loops yet'}];
 return `<h1>Send a thought</h1><p class="muted">It’s complete the moment you send it. No reply needed.</p>
 ${lastLink?`<div class="card invite"><h3>Send this link to ${esc(lastLink.name)}</h3><p class="small">They can open it and react without an app or an account.</p>
  <button class="accent" style="width:100%" data-copy="${esc(lastLink.url)}" data-sharetext="A thought for you">${navigator.share?'Share the link':'Copy the link'}</button><p class="small muted" style="margin-top:8px;word-break:break-all">${esc(lastLink.url)}</p></div>`:''}
 <form id="send" class="card">
  <label>To</label><div>${targets.map(t=>`<button type="button" class="chip ${draft.to===t.key?'on':''}" data-to="${esc(t.key)}">${esc(t.label)}</button>`).join('')}</div>
  ${draft.to==='link:'?`<label for="toname">Their name</label><input id="toname" name="toname" maxlength="24" value="${esc(draft.toName||'')}">`:''}
  <label for="text" style="margin-top:12px;display:block">Note</label><textarea id="text" name="text" maxlength="500" placeholder="Anything, or nothing. A link or photo works on its own.">${esc(draft.text)}</textarea>
  <label for="url">Link <span class="muted small">(song, video, place)</span></label><input id="url" name="url" inputmode="url" value="${esc(draft.url)}" placeholder="https://">
  <label for="photo">Photo</label><input id="photo" name="photo" type="file" accept="image/*">
  ${draft.photo?`<img src="${draft.photo}" alt="Photo to send" style="width:100%;border-radius:12px"><button type="button" class="link" data-nophoto>Remove photo</button>`:''}
  <button class="accent" type="submit" ${draft.to?'':'disabled'}>Send</button>
 </form>
 ${data.sent.length?`<h2>Sent</h2><p class="muted small">You’ll see reactions here, never who has or hasn’t looked.</p>${data.sent.slice(0,10).map(t=>`<div class="card sent"><p class="small muted">To ${esc(t.to.name)} · ${ago(t.createdAt)}</p>${t.text?`<p>${esc(t.text)}</p>`:''}${t.photo?`<img src="${t.photo}" alt="">`:''}${t.reactions.length?`<p>${t.reactions.map(r=>`<span class="pill">${esc(r.name)} ${esc(r.r)}</span>`).join(' ')}</p>`:''}${t.to.type==='link'?`<button class="link" data-copy="${ORIGIN}${t.to.link}">Copy link again</button>`:''}</div>`).join('')}`:''}`;
}

function loopsView(){
 if(openLoop){const l=data.loops.find(l=>l.id===openLoop);if(l)return loopDetail(l);openLoop=null;}
 return `<h1>Your loops</h1>
 ${data.loops.length?'':'<p class="muted">A loop is a group of friends. Make one and share the link.</p>'}${data.loops.map(l=>`<button class="card" style="width:100%;text-align:left;background:#fff;color:var(--ink)" data-openloop="${l.id}">
  <h3>${esc(l.name)}</h3>${l.privateName?`<p class="small muted">The group calls it “${esc(l.publicName)}”</p>`:''}
  <p class="small">${esc(l.members.map(m=>m.name).join(', '))}</p></button>`).join('')}
 <form id="newloop" class="card"><h3>New loop</h3>
  <label for="pub">Group name</label><input id="pub" name="publicName" maxlength="40" placeholder="Kalani Class of ’22" required>
  <details><summary class="small">Add a private name only you see</summary><input id="priv" name="privateName" maxlength="40" placeholder="The Day Ones"></details>
  <button class="accent" type="submit" style="width:100%">Make it and get the invite link</button></form>
 <details class="small"><summary>Have a code instead of a link?</summary><form id="joinloop" class="row"><input class="grow" name="code" maxlength="6" placeholder="ABC123" autocapitalize="characters" style="width:auto"><button type="submit">Join</button></form></details>`;
}

function loopDetail(l){
 const url=inviteUrl(l.code);
 return `<button class="link" data-openloop="">← All loops</button>
 <h1>${esc(l.name)}</h1>${l.privateName?`<p class="muted">The group calls it “${esc(l.publicName)}”</p>`:''}
 <div class="card invite"><h3>Invite friends</h3><p class="small">Anyone with this link can join. They just need a first name.</p>
  <button class="accent" style="width:100%" data-copy="${esc(url)}" data-sharetext="Join ${esc(l.publicName)} on Loops">${navigator.share?'Share invite link':'Copy invite link'}</button><p class="small muted" style="margin-top:8px;word-break:break-all">${esc(url)}</p></div>
 ${l.members.length>1?`<div class="row"><button class="accent" data-sendto="loop:${l.id}">Send the loop a thought</button><button class="ghost" data-gamenight="${l.id}">🎲 Game night tonight</button></div>`:'<p class="muted small">Once someone joins, you can send the whole loop a thought.</p>'}
 <h2>Who’s in it</h2><div class="card">${l.members.map(m=>`<div class="person"><span>${esc(m.name)}${m.city?` <span class="muted small">${esc(m.city)}</span>`:''}</span><span class="row">${m.openDoor?'<span class="door">Door open</span>':''}${m.id!==data.me.id?`<button class="ghost" style="padding:6px 10px" data-challenge="${m.id}">🏓</button>`:''}</span></div>`).join('')}</div>
 <form data-rename="${l.id}" class="card"><h3>Names</h3>
  <label>Name the group uses</label><input name="publicName" maxlength="40" value="${esc(l.publicName)}">
  <label>Your private name</label><input name="privateName" maxlength="40" value="${esc(l.privateName)}" placeholder="Only you see this">
  <button type="submit">Save names</button></form>
 <button class="link" data-leave="${l.id}">Leave this loop</button>`;
}

function meView(){
 return `<h1>${esc(data.me.name)}</h1>
 <form id="me" class="card">
  <label for="mename">Name</label><input id="mename" name="name" maxlength="24" value="${esc(data.me.name)}">
  <label for="mecity">Home city</label><input id="mecity" name="city" maxlength="40" value="${esc(data.me.city)}" placeholder="Honolulu">
  <label class="check"><input type="checkbox" name="openDoor" ${data.me.openDoor?'checked':''}><span>My door is open<br><span class="muted small">Friends see you’re always happy to hear from them.</span></span></label>
  <button type="submit" class="full">Save</button></form>
 <h2>I’m in town</h2><p class="muted small">Heading somewhere? Friends whose home city matches get an open invite. We never track your location.</p>
 ${data.myTrips.map(t=>`<div class="card invite"><h3>${esc(t.city)}, ${fmtDate(t.from)} to ${fmtDate(t.to)}</h3>
  <p class="small">${t.friendsThere.length?`Invite goes to ${esc(t.friendsThere.join(', '))}.`:'None of your loop friends list this city yet.'}</p>
  ${t.downs.length?`<p>${t.downs.map(d=>`<span class="pill">${esc(d.name)}: ${esc(d.note)}</span>`).join(' ')}</p>`:''}
  <button class="link" data-rmtrip="${t.id}">Cancel trip</button></div>`).join('')}
 <form id="trip" class="card"><label for="tcity">City</label><input id="tcity" name="city" maxlength="40" placeholder="Seattle" required>
  <div class="two"><div><label for="tfrom">From</label><input id="tfrom" name="from" type="date" required></div><div><label for="tto">To</label><input id="tto" name="to" type="date" required></div></div>
  <label for="tnote">Note <span class="muted small">(optional)</span></label><input id="tnote" name="note" maxlength="200" placeholder="Down for food or a game">
  <button class="accent full" type="submit">Post open invite</button></form>
 <div class="account"><button class="link" data-signout>Sign out on this device</button><button class="link danger" data-deleteme>Delete my account</button></div>`;
}

async function linkThoughtView(id){
 let t;try{t=await fetch(BASE+'/api/t/'+id).then(r=>r.json());if(t.error)throw Error(t.error);}catch(e){return `<h1>Loops</h1><div class="empty">${esc(e.message)}</div>`;}
 const reacted=store.get('loops.reacted.'+id);
 return `<section class="hero"><h1>${esc(t.from)} thought of you</h1><p class="muted">No reply needed.</p></section>
 <article class="card gift">${t.text?`<p>${esc(t.text)}</p>`:''}${t.url?`<p><a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.url)}</a></p>`:''}${t.photo?`<img src="${t.photo}" alt="Photo from ${esc(t.from)}">`:''}
 <div class="react">${t.reactions.map(r=>`<button data-guest="${id}" data-r="${esc(r)}" class="${reacted===r?'on':''}">${esc(r)}</button>`).join('')}</div></article>
 ${reacted&&token?`<p class="door">${esc(t.from)} will see your ${esc(reacted)}.</p>`:reacted?`<div class="card"><h3>${esc(t.from)} will see your ${esc(reacted)}</h3><p class="small">Want to send one back sometime? Loops keeps it light: no streaks, no read receipts.</p>
  <form id="replyback"><label for="rname">Your name</label><input id="rname" name="name" maxlength="24" value="${esc(t.to==='a friend'?'':t.to)}" required>
  <label for="rcity">Home city <span class="muted small">(optional)</span></label><input id="rcity" name="city" maxlength="40">
  <button class="accent" type="submit">Join ${esc(t.from)} on Loops</button></form></div>`:''}`;
}

// ---------- render + routing ----------
async function render(){
 const r=route(),m=r.match(/^\/(j|t|p|d|s|r)\/([\w-]+)/);
 const app=$('#app'),nav=$('#tabs');document.body.classList.remove('derby-open');
 if(r==='/im'){nav.hidden=true;app.innerHTML=imCompose();return;}
 if(m?.[1]==='t'&&(!token||IM)){nav.hidden=true;app.innerHTML=await linkThoughtView(m[2]);return;}
 if(!token&&m?.[1]==='s'){nav.hidden=true;let c=null;try{c=await api('/schallenge/'+m[2]);}catch(e){}
  app.innerHTML=`<section class="hero"><h1>${c?`${esc(c.from)} took a penalty ⚽`:'Penalty Shootout'}</h1><p class="muted">${c&&!c.open?'Someone already took this one, but you can start your own.':'Pick where you dive to save it, and where you shoot. Best of 5.'}</p></section>
  <form id="signup" class="card"><label for="name">Your first name</label><input id="name" name="name" autocomplete="given-name" maxlength="24" required autofocus><button class="accent full" type="submit">Play</button></form>
  <p class="small muted" style="text-align:center">No app, no password. Loops keeps it light.</p>`;return;}
 if(!token&&m?.[1]==='d'){nav.hidden=true;let c=null;try{c=await api('/dchallenge/'+m[2]);}catch(e){}
  app.innerHTML=`<section class="hero"><h1>${c?`${esc(c.from)} hit ${c.hr??'?'} ${c.hr===1?'homer':'homers'} ⚾`:'Home Run Derby'}</h1><p class="muted">${c&&!c.open?'Someone already took this at-bat, but you can start your own.':'Same 10 pitches. Beat it.'}</p></section>
  <form id="signup" class="card"><label for="name">Your first name</label><input id="name" name="name" autocomplete="given-name" maxlength="24" required autofocus><button class="accent full" type="submit">Bat</button></form>
  <p class="small muted" style="text-align:center">No app, no password. Loops keeps it light.</p>`;return;}
 if(!token&&m?.[1]==='r'){nav.hidden=true;let c=null;try{c=await api('/uchallenge/'+m[2]);}catch(e){}
  app.innerHTML=`<section class="hero"><h1>${c?`${esc(c.from)} drafted ${esc(aGrade(c.grade||'?'))} team 🃏`:'Draft Duel'}</h1><p class="muted">${c&&!c.open?'Someone already took this draft, but you can start your own.':'Same players, same $130 cap. Beat their Scout grade.'}</p></section>
  <form id="signup" class="card"><label for="name">Your first name</label><input id="name" name="name" autocomplete="given-name" maxlength="24" required autofocus><button class="accent full" type="submit">Draft</button></form>
  <p class="small muted" style="text-align:center">No app, no password. Loops keeps it light.</p>`;return;}
 if(!token&&m?.[1]==='p'){nav.hidden=true;let c=null;try{c=await api('/challenge/'+m[2]);}catch(e){}
  const G=c?.mode==='big3'?GAMES.big3:GAMES.pong;
  app.innerHTML=`<section class="hero"><h1>${c?`${esc(c.from)} challenged you to ${G.name} ${G.emoji}`:'Pong'}</h1><p class="muted">${c&&!c.open?'Someone already took this seat, but you can still join Loops and start your own.':G.blurb}</p></section>
  <form id="signup" class="card"><label for="name">Your first name</label><input id="name" name="name" autocomplete="given-name" maxlength="24" required autofocus><button class="accent full" type="submit">Play</button></form>
  <p class="small muted" style="text-align:center">No app, no password. Loops keeps it light.</p>`;return;}
 if(!token){nav.hidden=true;let info=null;if(m?.[1]==='j'){try{info=await api('/invite/'+m[2]);}catch(e){toast(e.message);}}app.innerHTML=onboarding(m?.[1]==='j'?m[2]:null,info);return;}
 if(m?.[1]==='p'){nav.hidden=IM;await pongPage(m[2]);return;}
 if(m?.[1]==='d'){nav.hidden=IM;await derbyPage(m[2]);return;}
 if(m?.[1]==='s'){nav.hidden=IM;await shootPage(m[2]);return;}
 if(m?.[1]==='r'){nav.hidden=IM;await duelPage(m[2]);return;}
 if(m){ // Signed in and opened an invite or link: handle it, then go home.
  history.replaceState(null,'',BASE+'/');
  if(m[1]==='j')await act(()=>api('/join',{code:m[2]}),'You joined the loop.');else await act(()=>api(`/t/${m[2]}/reply`,{}),'You’re connected.');
  return;
 }
 if(!data){app.innerHTML='<p class="muted">Loading…</p>';return;}
 nav.hidden=false;nav.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
 clearInterval(pollTimer);
 if(shootOpen&&tab==='home'){await shootPage(shootOpen,false);return;}
 if(duelOpen&&tab==='home'){await duelPage(duelOpen,false);return;}
 if(derbyOpen&&tab==='home'){await derbyPage(derbyOpen,false);return;}
 if(pongOpen&&tab==='home'){await pongPage(pongOpen,false);return;}
 app.innerHTML={home:homeView,send:sendView,loops:loopsView,me:meView}[tab]();
}

// A pong game opened from a link or an iMessage bubble. Anyone signed in can take an open seat.
let pageGame=null;
// One screen for a game: the draft until it's done, then the table. While it's the other person's move, it checks
// every 2.5 s, so two people on the page at once play live; otherwise it just works turn by turn.
async function pongPage(id,page=true){
 try{pageGame=await api('/pong/'+id);}catch(e){$('#app').innerHTML=`<h1>Pong</h1><div class="empty">${esc(e.message)}</div>`;return;}
 const g=pageGame;$('#app').innerHTML=pongView(g,page);
 if(!(g.mode==='big3'&&!g.draft.done))mountPong($('#pong'),g,{throwShot:shot=>api(`/pong/${id}/throw`,shot),after:async res=>{
  await pongAfter(res,true);
  const v=res.view;
  if(v&&IM&&(res.event==='turnOver'||res.event==='win'))native({type:'update',kind:'pong',path:`/p/${id}`,
   caption:res.event==='win'?`🏓 ${v.winnerName||'Someone'} won ${v.mode==='big3'?'Big 3 ':''}Pong`:`🏓 ${v.lastNote||''} ${v.vs}’s shot`.trim(),
   sub:`${v.mine.filter(Boolean).length}–${v.targets.filter(Boolean).length} cups`});
  if(!page)await refresh(true);
  pongPage(id,page);
 }});
 clearInterval(pollTimer);
 if(!g.myTurn&&!g.done)pollTimer=setInterval(async()=>{
  if(document.visibilityState!=='visible')return;
  try{const next=await api('/pong/'+id);if(next.updatedAt!==g.updatedAt){clearInterval(pollTimer);if(next.myTurn)fx('yourTurn');pongPage(id,page);}}catch{}
 },2500);
}

// iMessage compose: the extension's own screen. Sending inserts a bubble into the current thread.
// iMessage panel: as small as it gets. First time: your first name. After that: tap a game and it drops into the
// chat as a bubble. Sending a thought is tucked underneath.
function imCompose(){
 const tiles=`<div class="games">${Object.entries(GAMES).map(([k,G])=>`<button class="card gametile" data-imgame="${k}" ${token?'':'disabled'}>${gameArt(k,48)}<b>${G.name}</b></button>`).join('')}</div>`;
 if(!token)return `<form id="imname" class="row imname"><input class="grow" name="name" autocomplete="given-name" maxlength="24" placeholder="Your first name" required><button class="accent" type="submit">Go</button></form>${tiles}`;
 return `${tiles}
 <details class="imthought"><summary>💭 Send a thought instead</summary>
 <form id="imsend" class="card">
  <textarea name="text" maxlength="500" placeholder="Anything. A link or photo works on its own."></textarea>
  <input name="url" inputmode="url" placeholder="Link: song, video, place">
  <input id="photo" name="photo" type="file" accept="image/*">
  ${draft.photo?`<img src="${draft.photo}" alt="Photo to send" style="width:100%;border-radius:12px">`:''}
  <button class="accent full" type="submit">Send thought</button>
 </form></details>`;
}

// Penalty Shootout screen: pick where you shoot, then where you dive, then lock in. Revealed rounds show
// both kicks on little goals: ⚽ is where the shot went, 🧤 is where the keeper dove.
let shootOpen=null,soPick={};
const SPOT_ORDER=['tl','tc','tr','bl','bc','br'],SPOT_TXT={tl:'top left',tc:'top middle',tr:'top right',bl:'low left',bc:'low middle',br:'low right',l:'left',c:'middle',r:'right'};
const sideOf=x=>x&&x.length===2?x[1]:x; // a dive covers a whole side, top and low
const miniGoal=(ball,glove)=>`<span class="minigoal">${SPOT_ORDER.map(k=>{const g=k[1]===sideOf(glove);return `<i class="${g?'dove':''}">${k===ball?(g?'🧤':'⚽'):''}</i>`;}).join('')}</span>`;
async function shootPage(id,page=true){
 let g;try{g=await api('/shootout/'+id);}catch(e){$('#app').innerHTML=`<h1>Penalty Shootout</h1><div class="empty">${esc(e.message)}</div>`;return;}
 const back=page?'':'<button class="link" data-closeshoot>← Home</button>';
 const dots=(n,total)=>Array.from({length:Math.max(5,total)},(_,i)=>`<span class="dot ${i<n?'on':''}"></span>`).join('');
 const board=`<section class="card rows sboard"><div class="mrow"><span class="mtext"><b>You ${g.score.me}</b></span><span>${g.rounds.map(r=>r.mine.goal?'⚽':'❌').join(' ')||'…'}</span></div><div class="mrow"><span class="mtext"><b>${esc(g.vs)} ${g.score.them}</b></span><span>${g.rounds.map(r=>r.theirs.goal?'⚽':'❌').join(' ')||'…'}</span></div></section>`;
 const rounds=g.rounds.map((r,i)=>`<div class="card sround"><b>Round ${i+1}</b>
   <div class="mrow">${miniGoal(r.mine.shoot,r.mine.theirDive)}<span class="mtext"><b>${r.mine.goal?'Your goal ⚽':'Saved 🧤'}</b><span class="small muted">You shot ${SPOT_TXT[r.mine.shoot]}, ${esc(g.vs)} dove ${SPOT_TXT[sideOf(r.mine.theirDive)]}</span></span></div>
   <div class="mrow">${miniGoal(r.theirs.shoot,r.theirs.myDive)}<span class="mtext"><b>${r.theirs.goal?`${esc(g.vs)} scores`:'You saved it 🧤'}</b><span class="small muted">${esc(g.vs)} shot ${SPOT_TXT[r.theirs.shoot]}, you dove ${SPOT_TXT[sideOf(r.theirs.myDive)]}</span></span></div></div>`).reverse().join('');
 let top;
 if(g.done)top=`<h1>${g.won?'You win!':g.tie?'Tie game':`${esc(g.winnerName||g.vs)} wins`}</h1><p class="muted small">${record(g)}</p>${g.vsId&&!page?`<button class="accent full" data-reshoot="${g.vsId}">Rematch</button>`:''}`;
 else if(g.myTurn){const step=soPick.shoot?'dive':'shoot';
  top=`<h1>${g.suddenDeath?'Sudden death':`Round ${g.round} of 5`}</h1><p class="muted small">${g.theyPicked?`${esc(g.vs)} already picked. `:''}${step==='shoot'?'Where do you shoot?':'Now, which way do you dive? You cover that whole side.'}</p>
  <div class="goal ${step==='dive'?'diving':''}">${SPOT_ORDER.map(k=>{const dove=soPick.dive&&k[1]===soPick.dive;return `<button class="spot ${soPick.shoot===k?'ball':''} ${dove?'glove':''}" data-spot="${step==='dive'?k[1]:k}" aria-label="${step==='dive'?`dive ${SPOT_TXT[k[1]]}`:SPOT_TXT[k]}">${soPick.shoot===k?'⚽':''}${dove&&k[0]==='b'?'🧤':''}</button>`;}).join('')}</div>
  <p class="small">${soPick.shoot?`Shoot: <b>${SPOT_TXT[soPick.shoot]}</b>`:'Tap a spot to aim.'}${soPick.dive?` · Dive: <b>${SPOT_TXT[soPick.dive]}</b>`:''} ${soPick.shoot?'<button class="link" data-spotreset>Change</button>':''}</p>
  <button class="accent full" data-lockin ${soPick.shoot&&soPick.dive?'':'disabled'}>Lock in</button>`;}
 else top=`<h1>${g.suddenDeath?'Sudden death':`Round ${g.round}`}</h1><div class="empty">Your picks are in. Waiting on ${esc(g.vs)}. ${page?'This updates by itself.':'No rush.'}</div>`;
 $('#app').innerHTML=`${back}${soundToggle()}${top}${g.rounds.length?board:''}${rounds}`;
 shootGame=g;
 clearInterval(pollTimer);
 if(!g.myTurn&&!g.done)pollTimer=setInterval(async()=>{if(document.visibilityState!=='visible')return;try{const n=await api('/shootout/'+id);if(n.updatedAt!==g.updatedAt){clearInterval(pollTimer);revealFx(n,g);shootPage(id,page);}}catch{}},2500);
}
let shootGame=null;
function revealFx(n,old){if(n.rounds.length>old.rounds.length){const r=n.rounds.at(-1);fx('kick');setTimeout(()=>fx(r.mine.goal?'goal':'save'),250);setTimeout(()=>fx(r.theirs.goal?'kick':'save'),1100);}}

// Home Run Derby screen: bat your 10 pitches, then see the result (or send it, if you batted first).
let derbyOpen=null,derbyGame=null;
async function derbyPage(id,page=true){
 try{derbyGame=await api('/derby/'+id);}catch(e){$('#app').innerHTML=`<h1>Home Run Derby</h1><div class="empty">${esc(e.message)}</div>`;return;}
 const g=derbyGame,app=$('#app'),back=page?'':'<button class="link" data-closederby>← Home</button>';
 document.body.classList.remove('derby-open');
 if(g.myTurn){
  app.innerHTML=`${back}<h1>Home Run Derby</h1><p class="muted small">${g.theirs?`Beat ${esc(g.vs)}’s <b>${g.theirs.hr}</b> ${g.theirs.hr===1?'homer':'homers'}.`:'You bat first. Your friend gets the same 10 pitches.'}</p>
   <div id="derby" class="pong derby-full"><canvas aria-label="Baseball field. Tap anywhere to start, then tap to swing when the pitch reaches the plate."></canvas>
   <div class="glassbar">${soundToggle()}${fullToggle(true)}</div></div>`;
  document.body.classList.add('derby-open');
  mountDerby($('#derby'),g.pitches,{target:g.theirs?{name:g.vs,hr:g.theirs.hr}:null,onDone:async swings=>{
   try{const v=await api(`/derby/${id}/swings`,{swings});derbyGame=v;
    if(v.done){fx(v.won?'win':'miss');}
    if(IM)native({type:v.done?'update':'send',kind:'derby',path:`/d/${id}`,caption:v.done?(v.won?`⚾ ${data?.me?.name} won the Derby, ${v.mine.hr}–${v.theirs.hr}`:v.tie?`⚾ Derby tied ${v.mine.hr}–${v.theirs.hr}`:`⚾ ${v.vs} won the Derby, ${v.theirs.hr}–${v.mine.hr}`):`⚾ ${data?.me?.name||'A friend'} hit ${v.mine.hr} ${v.mine.hr===1?'homer':'homers'}. Beat it.`,sub:v.done?'Tap for the box score':'Same 10 pitches. Tap to bat.'});
    if(!v.done&&v.open&&!IM&&!page){sentGame={id,key:'derby',hr:v.mine.hr};derbyOpen=null;await refresh();scrollTo(0,0);return;}
    derbyPage(id,page);
   }catch(e){toast(e.message);}
  }});
  return;
 }
 const box=r=>r.results?`<span class="boxscore">${r.results.map(x=>`<i class="${x.hr?'hr':x.feet>0?'in':'k'}" title="${x.hr?`Home run, ${x.feet} ft`:x.feet>0?`${x.feet} ft`:'Strike'}">${x.feet>0?x.feet:'K'}</i>`).join('')}</span>`:'';
 const line=(who,r)=>r?`<div class="mrow"><img class="micon art" src="${BASE}/art/derby.svg" alt="" width="36" height="36"><span class="mtext"><b>${esc(who)}: ${r.hr} ${r.hr===1?'homer':'homers'}</b><span class="small muted">Longest ${r.longest} ft</span>${box(r)}</span></div>`:`<div class="mrow"><span class="micon art waiting" aria-hidden="true"></span><span class="mtext"><b>${esc(who)}</b><span class="small muted">Hasn’t batted yet</span></span></div>`;
 app.innerHTML=`${back}<h1>${g.done?(g.won?'You win!':g.tie?'Tie game':`${esc(g.winnerName||g.vs)} wins`):'Home Run Derby'}</h1>
  <section class="card rows">${line('You',g.mine)}${line(g.vs,g.theirs)}</section>
  ${g.done?`<p class="muted small">${record(g)}</p>${g.vsId&&!page?`<button class="accent full" data-rederby="${g.vsId}">Rematch</button>`:''}`:`<p class="muted small">Waiting on ${esc(g.vs)}. No rush.</p>`}`;
 clearInterval(pollTimer);
 if(!g.done)pollTimer=setInterval(async()=>{if(document.visibilityState!=='visible')return;try{const n=await api('/derby/'+id);if(n.updatedAt!==g.updatedAt){clearInterval(pollTimer);fx('yourTurn');derbyPage(id,page);}}catch{}},3000);
}

// Draft Duel screen: pick one player per position under the cap, then lock in. Afterwards, both teams with
// Scout's grade and one-line report. Before the reveal you only see the grade you have to beat.
let duelOpen=null,duelGame=null,duelPick={};
const duelCost=()=>Object.values(duelPick).reduce((s,c)=>s+c.price,0);
function duelTeam(who,t,won){
 if(!t)return `<div class="card"><b>${esc(who)}</b><p class="small muted">Hasn’t drafted yet</p></div>`;
 if(t.hidden)return `<div class="card"><b>${esc(who)}: Scout grade ${esc(t.grade)}</b><p class="small muted">Their picks stay hidden until you draft.</p></div>`;
 return `<div class="card ${won?'winner':''}"><b>${esc(who)}: ${esc(t.grade)}</b> <span class="small muted">${esc(t.rank)} · $${t.total}</span>
  <div class="lineup">${t.picks.map(p=>`<span class="pill pill-hs">${headshot(p.name,'sm')}${p.slot}: ${esc(p.name)}</span>`).join('')}</div><p class="small">${esc(t.report)}</p></div>`;
}
async function duelPage(id,page=true){
 try{duelGame=await api('/duel/'+id);}catch(e){$('#app').innerHTML=`<h1>Draft Duel</h1><div class="empty">${esc(e.message)}</div>`;return;}
 const g=duelGame,app=$('#app'),back=page?'':'<button class="link" data-closeduel>← Home</button>';
 clearInterval(pollTimer);
 if(g.myTurn){
  const spent=duelCost(),left=g.budget-spent,open=g.board.filter(s=>!duelPick[s.slot]);
  // A card fits if, after buying it, the cheapest card at every other open position is still affordable.
  const fits=(s,c)=>{const rest=open.filter(o=>o.slot!==s.slot).reduce((t,o)=>t+Math.min(...o.cards.map(x=>x.price)),0),swap=duelPick[s.slot]?.price||0;return c.price-swap+rest<=left;};
  app.innerHTML=`${back}${soundToggle()}<h1>Draft Duel</h1><p class="muted small">${g.theirs?`Beat ${esc(g.vs)}’s <b>${esc(g.theirs.grade)}</b>.`:'You draft first. Your friend gets the same board.'} One player per position, $${g.budget} cap.</p>
   <div class="card budget"><b>$${left} left</b> <span class="small muted">of $${g.budget} · ${5-open.length} of 5 picked</span></div>
   ${g.board.map(s=>`<h2>${s.label}${duelPick[s.slot]?` <span class="small muted">· ${esc(duelPick[s.slot].name)}</span>`:''}</h2><div class="picks">${s.cards.map(c=>{const on=duelPick[s.slot]?.name===c.name,ok=on||fits(s,c);
    return `<button class="card pickcard ${on?'on':''}" data-dpick="${s.slot}|${esc(c.name)}" ${ok?'':'disabled'}>${headshot(c.name)}<span class="pickinfo"><b>${esc(c.name)}</b><span class="small muted">${esc(c.note)}</span><span class="pill">$${c.price} · ${c.ovr} ovr</span></span></button>`;}).join('')}</div>`).join('')}
   <button class="accent full" data-dlock ${open.length?'disabled':''}>${open.length?`Pick ${open.length} more`:'Lock in my five'}</button>
   <p class="small muted" style="text-align:center"><a href="/credits.html" target="_blank" rel="noopener">Photo credits</a></p>`;
  return;
 }
 app.innerHTML=`${back}<h1>${g.done?(g.won?'You win!':g.tie?'Tie game':`${esc(g.winnerName||g.vs)} wins`):'Draft Duel'}</h1>
  ${duelTeam('You',g.mine,g.won)}${duelTeam(g.vs,g.theirs,g.done&&!g.won&&!g.tie)}
  ${g.done?`<p class="muted small">${record(g)}</p>${g.vsId&&!page?`<button class="accent full" data-reduel="${g.vsId}">Rematch</button>`:''}`:`<p class="muted small">Waiting on ${esc(g.vs)}. No rush.</p>`}`;
 if(!g.done)pollTimer=setInterval(async()=>{if(document.visibilityState!=='visible')return;try{const n=await api('/duel/'+id);if(n.updatedAt!==g.updatedAt){clearInterval(pollTimer);fx('yourTurn');duelPage(id,page);}}catch{}},3000);
}

async function pongAfter(res,page=false){
 if(res.error)toast(res.error);
 else if(res.event==='win'){fx('win');toast('Cleared the table. You win!');}
 else if(res.event==='ballsBack'){fx('ballsBack');toast(res.fireball!=null?'🔥 Fireball! Both in, balls back!':'Both in. Balls back!');}
 else if(res.fireball!=null)toast('🔥 Fireball! Two cups gone.');
 else if(res.event==='turnOver')toast(res.hit!==null?'Sunk one. Their turn.':'Their turn now.');
 else toast(res.hit!==null?'Sunk it!':res.rim!==null?'Rimmed out.':'Missed.');
 if(!page)await refresh();
}

// Shrink photos before sending so they stay small (and fit the future Redis store).
function shrink(file){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>{const s=Math.min(1,900/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(img.src);res(c.toDataURL('image/jpeg',.8));};img.onerror=()=>rej(Error('That photo could not be read.'));img.src=URL.createObjectURL(file);});}
const saveDraft=()=>{const f=$('#send');if(!f)return;draft.text=f.text.value;draft.url=f.url.value;if(f.toname)draft.toName=f.toname.value;};

document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.tab){saveDraft();tab=d.tab;openLoop=null;pongOpen=null;derbyOpen=null;shootOpen=null;duelOpen=null;if(tab!=='send')lastLink=null;render();scrollTo(0,0);return;}
 if(d.sendto){const [type,id]=d.sendto.split(':');draft={to:`${type}:${id}`,text:'',url:'',photo:null};lastLink=null;tab='send';render();scrollTo(0,0);return;}
 if(d.to!==undefined){saveDraft();draft.to=d.to;lastLink=null;render();return;}
 if(d.nophoto!==undefined){saveDraft();draft.photo=null;render();return;}
 if(d.react){await act(()=>api(`/thoughts/${d.react}/react`,{reaction:d.r}));return;}
 if(d.guest){try{const name=(IM&&data?.me?.name)||store.get('loops.guestname')||'';if(IM)native({type:'update',kind:'thought',path:`/t/${d.guest}`,caption:`${name||'Someone'} ${d.r}’d your thought`});await api(`/t/${d.guest}/react`,{reaction:d.r,name});store.set('loops.reacted.'+d.guest,d.r);render();}catch(err){toast(err.message);}return;}
 if(d.down){await act(()=>api(`/trips/${d.down}/down`,{}),'They’ll see you’re down.');return;}
 if(d.rmtrip){await act(()=>api(`/trips/${d.rmtrip}/remove`,{}),'Trip removed.');return;}
 if(d.openloop!==undefined){openLoop=d.openloop||null;render();scrollTo(0,0);return;}
 if(d.imgame==='shootout'){const out=await act(()=>api('/shootout',{}));if(out){history.replaceState(null,'',`${BASE}/s/${out.id}?im=1`);native({type:'expand'});soPick={};render();}return;}
 if(d.imgame==='duel'){const out=await act(()=>api('/duel',{}));if(out){history.replaceState(null,'',`${BASE}/r/${out.id}?im=1`);native({type:'expand'});duelPick={};render();}return;}
 if(d.imgame==='derby'){const out=await act(()=>api('/derby',{}));if(out){history.replaceState(null,'',`${BASE}/d/${out.id}?im=1`);native({type:'expand'});render();}return;}
 if(d.imgame){const big=d.imgame==='big3',out=await act(()=>api('/pong',{mode:big?'big3':'classic'}));if(out)native({type:'send',kind:'pong',path:`/p/${out.id}`,caption:big?`🏀 ${data?.me?.name||'A friend'} wants a Big 3 Pong draft`:`🏓 ${data?.me?.name||'A friend'} challenged you to Pong`,sub:big?'Tap to draft first, then play':'Tap to play. You go first.'});return;}
 if(d.sound!==undefined){setMuted(!muted);b.outerHTML=soundToggle();return;}
 if(d.derbyfull!==undefined){const w=$('#derby');if(!w)return;const f=!w.classList.contains('derby-full');w.classList.toggle('derby-full',f);document.body.classList.toggle('derby-open',f);b.outerHTML=fullToggle(f);if(!f)w.scrollIntoView({block:'center'});return;}
 if(d.textgame==='shootout'){const out=await act(()=>api('/shootout',{}));if(out){shootOpen=out.id;soPick={};render();scrollTo(0,0);}return;}
 if(d.textgame==='duel'){duelChoose=true;sentGame=null;liveRoom=null;render();return;}
 if(d.duelmode==='async'){duelChoose=false;const out=await act(()=>api('/duel',{}));if(out){duelOpen=out.id;duelPick={};render();scrollTo(0,0);}return;}
 if(d.duelmode==='live'){b.disabled=true;try{const room=await openOopsRoom('duel',data.me.name);duelChoose=false;liveRoom={...room,duel:true,msg:`${data.me.name} wants a live Draft Duel 🃏 Join now: ${room.url}`};render();}catch(err){toast(err.message);b.disabled=false;}return;}
 if(d.gamenight){b.disabled=true;try{const room=await openOopsRoom('party',data.me.name);liveRoom={...room,loopId:d.gamenight,msg:`Game night tonight 🎲 Room ${room.code}: ${room.url}`};openLoop=null;tab='home';render();scrollTo(0,0);}catch(err){toast(err.message);b.disabled=false;}return;}
 if(d.postnight!==undefined){if(!liveRoom?.loopId)return;const out=await act(()=>api('/thoughts',{to:{type:'loop',id:liveRoom.loopId},text:`Game night tonight 🎲 Room ${liveRoom.code}`,url:liveRoom.url}),'Posted in the loop.');if(out)b.remove();return;}
 if(d.textgame==='derby'){const out=await act(()=>api('/derby',{}));if(out){derbyOpen=out.id;render();scrollTo(0,0);}return;}
 if(d.textgame){const G=GAMES[d.textgame];const out=await act(()=>api('/pong',{mode:G.mode}));if(out){sentGame={id:out.id,key:d.textgame};render();}return;}
 if(d.allgifts!==undefined){showAllGifts=true;render();return;}
 if(d.newgame!==undefined){sentGame=null;duelChoose=false;liveRoom=null;render();return;}
 if(d.pongmode){pongMode=d.pongmode;render();return;}
 if(d.pick){const id=pageGame?.id;if(!id)return;fx('pick');try{const v=await api(`/pong/${id}/pick`,{name:d.pick});
  if(IM)native({type:'update',kind:'pong',path:`/p/${id}`,caption:v.draft.done?`🏀 Draft done. ${v.vs==='Open seat'?'':v.vs+' vs '}${data?.me?.name||''}: tip-off!`:`🏀 ${data?.me?.name||'Someone'} drafted ${d.pick}`,sub:v.draft.done?'Tap to shoot':`${v.draft.picker}’s pick`});
  const page=!pongOpen;if(!page)await refresh(true);pongPage(id,page);}catch(err){toast(err.message);}return;}
 if(d.start){if(d.start==='thought'){draft={to:'link:',text:'',url:'',photo:null};lastLink=null;tab='send';}else startGroup=true;render();if(startGroup)$('#qpub')?.focus();return;}
 if(d.spot){fx('pick');if(!soPick.shoot)soPick.shoot=d.spot;else soPick.dive=d.spot;const id=shootGame?.id;if(id)shootPage(id,!shootOpen);return;}
 if(d.spotreset!==undefined){soPick={};const id=shootGame?.id;if(id)shootPage(id,!shootOpen);return;}
 if(d.lockin!==undefined){const id=shootGame?.id;if(!id)return;fx('kick');try{const v=await api(`/shootout/${id}/pick`,soPick);soPick={};
  if(v.justRevealed){const r=v.rounds.at(-1);setTimeout(()=>fx(r.mine.goal?'goal':'save'),250);setTimeout(()=>fx(r.theirs.goal?'kick':'save'),1100);}
  if(IM)native({type:v.open?'send':'update',kind:'shootout',path:`/s/${id}`,caption:v.done?(v.won?`⚽ ${data?.me?.name} won the shootout, ${v.score.me}–${v.score.them}`:v.tie?'⚽ Shootout tied':`⚽ ${v.vs} won the shootout, ${v.score.them}–${v.score.me}`):v.open?`⚽ ${data?.me?.name||'A friend'} took a penalty. Save it.`:`⚽ Round ${v.round} · ${data?.me?.name} ${v.score.me}–${v.score.them} ${v.vs}`,sub:v.done?'Tap for every kick':'Tap to pick your dive and shot'});
  if(v.open&&!IM&&shootOpen){sentGame={id,key:'shootout'};shootOpen=null;await refresh();scrollTo(0,0);return;}
  shootPage(id,!shootOpen);}catch(err){toast(err.message);}return;}
 if(d.shoot){shootOpen=d.shoot;soPick={};tab='home';render();scrollTo(0,0);return;}
 if(d.closeshoot!==undefined){shootOpen=null;clearInterval(pollTimer);render();return;}
 if(d.reshoot){const out=await act(()=>api('/shootout',{opponentId:d.reshoot}));if(out){shootOpen=out.id;soPick={};tab='home';render();scrollTo(0,0);}return;}
 if(d.dpick){const [slot,name]=d.dpick.split('|'),c=duelGame?.board?.find(s=>s.slot===slot)?.cards.find(x=>x.name===name);if(!c)return;fx('pick');if(duelPick[slot]?.name===name)delete duelPick[slot];else duelPick[slot]=c;duelPage(duelGame.id,!duelOpen);return;}
 if(d.dlock!==undefined){const id=duelGame?.id;if(!id)return;b.disabled=true;try{const v=await api(`/duel/${id}/lineup`,{picks:Object.fromEntries(Object.entries(duelPick).map(([k,c])=>[k,c.name]))});duelPick={};
  if(v.done)fx(v.won?'win':'miss');
  if(IM)native({type:v.done?'update':'send',kind:'duel',path:`/r/${id}`,caption:v.done?(v.won?`🃏 ${data?.me?.name} won the Draft Duel, ${v.mine.grade} to ${v.theirs.grade}`:v.tie?'🃏 Draft Duel tied':`🃏 ${v.vs} won the Draft Duel, ${v.theirs.grade} to ${v.mine.grade}`):`🃏 ${data?.me?.name||'A friend'} drafted ${aGrade(v.mine.grade)} team. Beat it.`,sub:v.done?'Tap for both teams':'Same players, $130 cap. Tap to draft.'});
  if(!v.done&&v.open&&!IM&&duelOpen){sentGame={id,key:'duel',grade:v.mine.grade};duelOpen=null;await refresh();scrollTo(0,0);return;}
  duelPage(id,!duelOpen);}catch(err){toast(err.message);b.disabled=false;}return;}
 if(d.duel){duelOpen=d.duel;duelPick={};tab='home';render();scrollTo(0,0);return;}
 if(d.closeduel!==undefined){duelOpen=null;clearInterval(pollTimer);render();return;}
 if(d.reduel){const out=await act(()=>api('/duel',{opponentId:d.reduel}));if(out){duelOpen=out.id;duelPick={};tab='home';render();scrollTo(0,0);}return;}
 if(d.derby){derbyOpen=d.derby;tab='home';render();scrollTo(0,0);return;}
 if(d.closederby!==undefined){derbyOpen=null;clearInterval(pollTimer);render();return;}
 if(d.rederby){const out=await act(()=>api('/derby',{opponentId:d.rederby}));if(out){derbyOpen=out.id;tab='home';render();scrollTo(0,0);}return;}
 if(d.pong){pongOpen=d.pong;tab='home';render();scrollTo(0,0);return;}
 if(d.closepong!==undefined){pongOpen=null;clearInterval(pollTimer);render();return;}
 if(d.challenge){const out=await act(()=>api('/pong',{opponentId:d.challenge,mode:pongMode}),pongMode==='big3'?'Draft started. You pick first.':'Challenge sent. Your shot first.');if(out){pongOpen=out.id;tab='home';openLoop=null;render();scrollTo(0,0);}return;}
 if(d.leave){if(confirm('Leave this loop? You can rejoin with the invite link.')){openLoop=null;await act(()=>api(`/loops/${d.leave}/leave`,{}),'You left the loop.');}return;}
 if(d.copy){if(navigator.share){try{await navigator.share(d.sharetext?{text:d.sharetext,url:d.copy}:{url:d.copy});}catch{}}else{try{await navigator.clipboard.writeText(d.copy);toast('Copied.');}catch{toast('Copy the link from the box.');}}return;}
 if(d.deleteme!==undefined){if(confirm('Delete your account? Your thoughts, games and trips are removed for everyone. This can’t be undone.')){try{await api('/me/delete',{});token=null;data=null;store.set('loops.token',null);try{sessionStorage.removeItem('loops.token');}catch{}toast('Account deleted.');render();}catch(err){toast(err.message);}}return;}
 if(d.signout!==undefined){if(confirm('Sign out on this device? Save your invite links first; there is no password yet.')){token=null;data=null;store.set('loops.token',null);render();}}
});

document.addEventListener('change',async e=>{
 if(e.target.id==='photo'&&e.target.files[0]){saveDraft();try{draft.photo=await shrink(e.target.files[0]);}catch(err){toast(err.message);}render();}
});

document.addEventListener('submit',async e=>{
 e.preventDefault();const f=e.target,v=n=>f.elements[n]?.value;
 if(f.closest('#pong'))return; // handled by pong.js
 if(f.id==='imname'){try{const out=await api('/signup',{name:v('name')});token=out.token;store.set('loops.token',token);await refresh();}catch(err){toast(err.message);}return;}
 if(f.id==='signup'){try{const m=route().match(/^\/j\/([\w-]+)/);const out=await api('/signup',{name:v('name'),invite:m?.[1]});token=out.token;store.set('loops.token',token);if(m)history.replaceState(null,'',BASE+'/');await refresh();if(m)toast('You’re in.');}catch(err){toast(err.message);}return;}
 if(f.id==='replyback'){try{const id=route().split('/')[2];store.set('loops.guestname',v('name'));const out=await api('/signup',{name:v('name'),city:v('city'),fromThought:id});token=out.token;store.set('loops.token',token);history.replaceState(null,'',BASE+'/');await refresh();toast('You’re connected.');}catch(err){toast(err.message);}return;}
 if(f.id==='imsend'){const out=await act(()=>api('/thoughts',{to:{type:'link',name:''},text:v('text'),url:v('url'),photo:draft.photo}));
  if(out){native({type:'send',kind:'thought',path:`/t/${out.id}`,caption:`💭 ${data?.me?.name||'A friend'} sent a thought`,sub:(v('text')||v('url')||'📸 Photo').slice(0,80),photo:draft.photo||null});draft.photo=null;f.reset();render();}return;}
 if(f.id==='send'){saveDraft();const [type,id]=draft.to.split(':');const to=type==='link'?{type,name:draft.toName}:{type,id};
  const out=await act(()=>api('/thoughts',{to,text:draft.text,url:draft.url,photo:draft.photo}),type==='link'?null:'Sent. No reply needed.');
  if(out){if(type==='link')lastLink={name:draft.toName||'your friend',url:`${ORIGIN}/t/${out.id}`};draft={to:null,text:'',url:'',photo:null};render();}return;}
 if(f.id==='quickloop'){const out=await act(()=>api('/loops',{publicName:v('publicName')}),'Made. Share the link with the group.');if(out){startGroup=false;tab='loops';openLoop=out.id;render();scrollTo(0,0);}return;}
 if(f.id==='newloop'){const out=await act(()=>api('/loops',{publicName:v('publicName'),privateName:v('privateName')}),'Loop made. Invite your friends.');if(out){openLoop=out.id;render();}return;}
 if(f.id==='joinloop'){await act(()=>api('/join',{code:v('code')}),'You joined the loop.');return;}
 if(f.id==='me'){await act(()=>api('/me',{name:v('name'),city:v('city'),openDoor:f.elements.openDoor.checked}),'Saved.');return;}
 if(f.id==='trip'){await act(()=>api('/trips',{city:v('city'),from:v('from'),to:v('to'),note:v('note')}),'Open invite posted.');return;}
 if(f.dataset.rename){await act(()=>api(`/loops/${f.dataset.rename}/rename`,{publicName:v('publicName'),privateName:v('privateName')}),'Names saved.');return;}
});

// Gentle refresh while the page is open. No badges, no pings.
setInterval(()=>{if(token&&document.visibilityState==='visible')refresh(true);},20000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh(true);});
token?refresh():render();
