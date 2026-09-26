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
let startGroup=false;
let token=tabToken||store.get('loops.token'),data=null,tab='home',openLoop=null,draft={to:null,text:'',url:'',photo:null},lastLink=null,pongOpen=null;
import {mountPong} from './pong.js';

async function api(path,body){
 const r=await fetch(BASE+'/api'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});
 const j=await r.json().catch(()=>({error:'Something went wrong.'}));
 if(!r.ok)throw Error(j.error||'Something went wrong.');return j;
}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2600);}
// quiet=true is the background refresh: it never re-draws while someone is typing, or when nothing changed.
let lastJson='';
async function refresh(quiet=false){if(!token)return;try{const next=await api('/home'),json=JSON.stringify(next);
 if(quiet&&(json===lastJson||document.activeElement?.matches('input,textarea,select')||(tab==='send'&&draft.to)||pongOpen))return;
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
function pongCards(){
 const mine=data.pongs.filter(g=>g.myTurn),wait=data.pongs.filter(g=>!g.myTurn&&!g.done),done=data.pongs.filter(g=>g.done);
 return mine.map(g=>`<div class="card turn"><h3>🏓 Your shot vs ${esc(g.vs)}</h3>${g.lastNote?`<p>${esc(g.lastNote)}</p>`:''}
   <p class="small muted">${record(g)} · You have ${g.mine.filter(Boolean).length} cups left, they have ${g.targets.filter(Boolean).length}.</p>
   <button class="accent" data-pong="${g.id}">Take your shot</button></div>`).join('')
  +done.map(g=>`<div class="card"><h3>${g.won?`You beat ${esc(g.vs)}`:`${esc(g.vs)} won this one`}</h3><p class="small muted">${record(g)}</p><button data-challenge="${g.vsId}">Rematch</button></div>`).join('')
  +(wait.length?`<p class="muted small">Waiting on ${wait.map(g=>esc(g.vs)).join(', ')} to shoot. No rush.</p>`:'');
}

function pongView(g,page=false){
 const status=g.done?(g.won?'You won. 🏆':`${esc(g.winnerName||g.vs)} won.`):g.open&&!g.seated?'Take the open seat: shoot first to join.':g.myTurn?`${g.left} ${g.left===1?'ball':'balls'} left. Sink both and you get them back.`:`Nice. ${esc(g.vs)} is up.`;
 return `${page?'':'<button class="link" data-closepong>← Home</button>'}
 <h1>${g.open&&!g.seated?'Pong challenge':`Pong vs ${esc(g.vs)}`}</h1><p class="muted small">${record(g)}</p>
 <p><b>${status}</b></p>
 <div id="pong" class="pong">${'<canvas aria-label="Pong table. Flick up from the bottom to throw."></canvas>'}
  ${g.myTurn?`<p class="small muted">Flick up from the bottom: longer = farther, sideways = aim.</p>
  <details><summary class="small">Use sliders instead</summary><form class="card"><label>Aim <input name="aim" type="range" min="-100" max="100" value="0"></label><label>Power <input name="power" type="range" min="0" max="100" value="62"></label><button class="accent" type="submit">Throw</button></form></details>`:''}</div>
 <p class="small">Their cups left: ${g.targets.filter(Boolean).length} · Yours: ${g.mine.filter(Boolean).length}</p>
 ${g.done&&g.vsId&&!page?`<button class="accent" data-challenge="${g.vsId}">Rematch</button>`:''}`;
}

// First run: nobody to talk to yet. Two one-tap paths straight to a first send; nothing else on screen.
function firstRun(){
 return `<h1>Hi, ${esc(data.me.name)}</h1><p class="muted">Who do you want to keep in touch with?</p>
 <button class="card big-choice" data-start="thought"><span class="big-emoji">💭</span><span><b>Send someone a thought</b><br><span class="small muted">One friend. They open a link, no app needed.</span></span></button>
 <button class="card big-choice" data-start="group"><span class="big-emoji">👥</span><span><b>Invite a group</b><br><span class="small muted">High school, college, the old team.</span></span></button>
 ${startGroup?`<form id="quickloop" class="card"><label for="qpub">Group name</label><input id="qpub" name="publicName" maxlength="40" placeholder="Kalani Class of ’22" required autofocus><button class="accent" type="submit" style="width:100%">Make it and get the invite link</button></form>`:''}
 <p class="muted small" style="text-align:center">Got an invite link from a friend? Just open it.</p>`;
}

function homeView(){
 if(!data.loops.length&&!data.people.length&&!data.gifts.length&&!data.sent.length)return firstRun();
 const doors=data.people.filter(p=>p.openDoor).slice(0,8);
 return `<h1>Hi, ${esc(data.me.name)}</h1>
 ${pongCards()}
 ${data.invites.map(i=>`<div class="card invite"><h3>${esc(i.who)} is in ${esc(i.city)}</h3><p>${fmtDate(i.from)} to ${fmtDate(i.to)}. Open invite.${i.note?` “${esc(i.note)}”`:''}</p>
  ${i.down?'<p class="door">You said you’re down.</p>':`<button class="accent" data-down="${i.id}">I’m down</button>`}</div>`).join('')}
 ${doors.length?`<h2>Thinking of someone?</h2><p class="muted small">Their door is open: they’re always happy to hear from you.</p>
  <div>${doors.map(p=>`<button class="chip" data-sendto="user:${p.id}">${esc(p.name)}</button>`).join('')}</div>`:''}
 ${data.people.length?`<h2>Pong, anyone?</h2><p class="muted small">Send a challenge. They shoot whenever.</p><div>${data.people.map(p=>`<button class="chip" data-challenge="${p.id}">🏓 ${esc(p.name)}</button>`).join('')}</div>`:''}
 <h2>Thoughts for you</h2>
 ${data.gifts.length?data.gifts.map(giftCard).join(''):`<div class="empty">Nothing yet. Thoughts from your loops land here.<br>No pressure to open, react or reply.</div>`}
 ${!data.loops.length?`<div class="card"><h3>Start your first loop</h3><p class="small">A loop is a group of friends: high school, college, the old team.</p><button class="accent" data-tab="loops">Make a loop</button></div>`:''}`;
}

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
 ${l.members.length>1?`<div class="row"><button class="accent" data-sendto="loop:${l.id}">Send the loop a thought</button></div>`:'<p class="muted small">Once someone joins, you can send the whole loop a thought.</p>'}
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
  <label class="row" style="margin:6px 0 14px"><input type="checkbox" name="openDoor" ${data.me.openDoor?'checked':''} style="width:auto;margin:0"> <span>My door is open <span class="muted small">(friends see you’re always happy to hear from them)</span></span></label>
  <button type="submit">Save</button></form>
 <h2>I’m in town</h2><p class="muted small">Heading somewhere? Friends whose home city matches get an open invite. We never track your location.</p>
 ${data.myTrips.map(t=>`<div class="card invite"><h3>${esc(t.city)}, ${fmtDate(t.from)} to ${fmtDate(t.to)}</h3>
  <p class="small">${t.friendsThere.length?`Invite goes to ${esc(t.friendsThere.join(', '))}.`:'None of your loop friends list this city yet.'}</p>
  ${t.downs.length?`<p>${t.downs.map(d=>`<span class="pill">${esc(d.name)}: ${esc(d.note)}</span>`).join(' ')}</p>`:''}
  <button class="link" data-rmtrip="${t.id}">Cancel trip</button></div>`).join('')}
 <form id="trip" class="card"><label for="tcity">City</label><input id="tcity" name="city" maxlength="40" placeholder="Seattle" required>
  <div class="row"><div class="grow"><label for="tfrom">From</label><input id="tfrom" name="from" type="date" required></div><div class="grow"><label for="tto">To</label><input id="tto" name="to" type="date" required></div></div>
  <label for="tnote">Note <span class="muted small">(optional)</span></label><input id="tnote" name="note" maxlength="200" placeholder="Down for food or a game">
  <button class="accent" type="submit">Post open invite</button></form>
 <button class="link" data-signout>Sign out on this device</button><br><button class="link" data-deleteme style="color:var(--accent)">Delete my account</button>`;
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
 const r=route(),m=r.match(/^\/(j|t|p)\/([\w-]+)/);
 const app=$('#app'),nav=$('#tabs');
 if(m?.[1]==='t'&&(!token||IM)){nav.hidden=true;app.innerHTML=await linkThoughtView(m[2]);return;}
 if(!token){nav.hidden=true;let info=null;if(m?.[1]==='j'){try{info=await api('/invite/'+m[2]);}catch(e){toast(e.message);}}app.innerHTML=onboarding(m?.[1]==='j'?m[2]:null,info);return;}
 if(m?.[1]==='p'){nav.hidden=IM;await pongPage(m[2]);return;}
 if(r==='/im'){nav.hidden=true;app.innerHTML=imCompose();return;}
 if(m){ // Signed in and opened an invite or link: handle it, then go home.
  history.replaceState(null,'',BASE+'/');
  if(m[1]==='j')await act(()=>api('/join',{code:m[2]}),'You joined the loop.');else await act(()=>api(`/t/${m[2]}/reply`,{}),'You’re connected.');
  return;
 }
 if(!data){app.innerHTML='<p class="muted">Loading…</p>';return;}
 nav.hidden=false;nav.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
 if(pongOpen&&tab==='home'){const g=data.pongs.find(g=>g.id===pongOpen);if(g){app.innerHTML=pongView(g);mountPong($('#pong'),g,{throwShot:shot=>api(`/pong/${g.id}/throw`,shot),after:pongAfter});return;}pongOpen=null;}
 app.innerHTML={home:homeView,send:sendView,loops:loopsView,me:meView}[tab]();
}

// A pong game opened from a link or an iMessage bubble. Anyone signed in can take an open seat.
let pageGame=null;
async function pongPage(id){
 try{pageGame=await api('/pong/'+id);}catch(e){$('#app').innerHTML=`<h1>Pong</h1><div class="empty">${esc(e.message)}</div>`;return;}
 $('#app').innerHTML=pongView(pageGame,true);
 mountPong($('#pong'),pageGame,{throwShot:shot=>api(`/pong/${id}/throw`,shot),after:async res=>{
  await pongAfter(res,true);
  const v=res.view;if(!v)return;
  // Update the iMessage bubble: the thread shows the latest state without a new chat message to read.
  if(IM&&(res.event==='turnOver'||res.event==='win'))native({type:'update',kind:'pong',path:`/p/${id}`,
   caption:res.event==='win'?`🏓 ${esc(v.winnerName||'Someone')} won Pong`:`🏓 ${v.lastNote||''} ${v.vs}’s shot`.trim(),
   sub:`${v.mine.filter(Boolean).length}–${v.targets.filter(Boolean).length} cups`});
  pongPage(id);
 }});
}

// iMessage compose: the extension's own screen. Sending inserts a bubble into the current thread.
function imCompose(){
 return `<h1>Send a thought</h1><p class="muted small">No reply needed. They tap 💛 if they want.</p>
 <form id="imsend" class="card">
  <textarea name="text" maxlength="500" placeholder="Anything, or nothing. A link or photo works on its own."></textarea>
  <input name="url" inputmode="url" placeholder="Link: song, video, place">
  <input id="photo" name="photo" type="file" accept="image/*">
  ${draft.photo?`<img src="${draft.photo}" alt="Photo to send" style="width:100%;border-radius:12px">`:''}
  <button class="accent" type="submit">Send thought</button>
 </form>
 <div class="card"><h3>🏓 Pong</h3><p class="small">Challenge the chat. First to tap it plays you.</p><button data-imgame="pong">Send a Pong challenge</button></div>`;
}

async function pongAfter(res,page=false){
 if(res.error)toast(res.error);
 else if(res.event==='win')toast('Cleared the table. You win!');
 else if(res.event==='ballsBack')toast('Both in. Balls back!');
 else if(res.event==='turnOver')toast(res.hit!==null?'Sunk one. Their turn.':'Their turn now.');
 else toast(res.hit!==null?'Sunk it!':res.rim!==null?'Rimmed out.':'Missed.');
 if(!page)await refresh();
}

// Shrink photos before sending so they stay small (and fit the future Redis store).
function shrink(file){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>{const s=Math.min(1,900/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(img.src);res(c.toDataURL('image/jpeg',.8));};img.onerror=()=>rej(Error('That photo could not be read.'));img.src=URL.createObjectURL(file);});}
const saveDraft=()=>{const f=$('#send');if(!f)return;draft.text=f.text.value;draft.url=f.url.value;if(f.toname)draft.toName=f.toname.value;};

document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.tab){saveDraft();tab=d.tab;openLoop=null;pongOpen=null;if(tab!=='send')lastLink=null;render();scrollTo(0,0);return;}
 if(d.sendto){const [type,id]=d.sendto.split(':');draft={to:`${type}:${id}`,text:'',url:'',photo:null};lastLink=null;tab='send';render();scrollTo(0,0);return;}
 if(d.to!==undefined){saveDraft();draft.to=d.to;lastLink=null;render();return;}
 if(d.nophoto!==undefined){saveDraft();draft.photo=null;render();return;}
 if(d.react){await act(()=>api(`/thoughts/${d.react}/react`,{reaction:d.r}));return;}
 if(d.guest){try{const name=(IM&&data?.me?.name)||store.get('loops.guestname')||'';if(IM)native({type:'update',kind:'thought',path:`/t/${d.guest}`,caption:`${name||'Someone'} ${d.r}’d your thought`});await api(`/t/${d.guest}/react`,{reaction:d.r,name});store.set('loops.reacted.'+d.guest,d.r);render();}catch(err){toast(err.message);}return;}
 if(d.down){await act(()=>api(`/trips/${d.down}/down`,{}),'They’ll see you’re down.');return;}
 if(d.rmtrip){await act(()=>api(`/trips/${d.rmtrip}/remove`,{}),'Trip removed.');return;}
 if(d.openloop!==undefined){openLoop=d.openloop||null;render();scrollTo(0,0);return;}
 if(d.imgame){const out=await act(()=>api('/pong',{}));if(out)native({type:'send',kind:'pong',path:`/p/${out.id}`,caption:`🏓 ${data?.me?.name||'A friend'} challenged you to Pong`,sub:'Tap to take the open seat'});return;}
 if(d.start){if(d.start==='thought'){draft={to:'link:',text:'',url:'',photo:null};lastLink=null;tab='send';}else startGroup=true;render();if(startGroup)$('#qpub')?.focus();return;}
 if(d.pong){pongOpen=d.pong;tab='home';render();scrollTo(0,0);return;}
 if(d.closepong!==undefined){pongOpen=null;render();return;}
 if(d.challenge){const out=await act(()=>api('/pong',{opponentId:d.challenge}),'Challenge sent. Your shot first.');if(out){pongOpen=out.id;tab='home';openLoop=null;render();scrollTo(0,0);}return;}
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
