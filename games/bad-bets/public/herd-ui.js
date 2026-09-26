// Phone screens for the Herd round (Same Brain at 4+ players, every other Same Brain round).
import {gameById} from './catalog.js';
export const HERD_RULE=gameById('brain').herd;
// Carried chips: leftovers from an even split wait for the next pot that has winners.
export const carryLine=r=>[r?.bonus?`+${r.bonus} bonus each`:'',r?.carry?`${r.carry} left over → next pot`:''].filter(Boolean).join(' ');
// Long questions get a smaller heading so the buttons stay on screen.
const qTitle=(q,esc)=>`<span class="herd-q${String(q||'').length>40?' long':''}">${esc(q)}</span>`;
export const isHerdScreen=s=>!!s.herd&&s.game==='brain'&&['reveal','herdWrite','herdVote','result'].includes(s.phase);
const sheepList=(ids,name,sheep)=>ids.map(id=>`<li class="${id===sheep?'black-sheep':''}"><span aria-hidden="true">🐑</span> ${name(id)}</li>`).join('')||'<li class="micro">Nobody</li>';
export function herdScreen(s,{esc,name,btn,heading,host}){
 const h=s.herd,writer=name(h.asker),count=`<p class="micro herd-count-line">${h.locked}/${h.total} picked</p>`;
 // Short copy on purpose: three steps, one line each.
 if(s.phase==='reveal')return heading('SAME BRAIN?','<span class="herd-title">🐑 Herd round</span>')+`<ol class="herd-steps"><li><span>✍️</span>${h.youAsk?'You write a this-or-that':`${writer} writes a this-or-that`}</li><li><span>👆</span>${h.youAsk?'Everyone else picks a side':'Everyone picks a side'}</li><li><span>🐑</span>Smaller side loses</li></ol>${h.youAsk?`<p class="micro">Everyone agrees? You pay.</p>`:''}`;
 if(s.phase==='herdWrite'){
  if(!h.youAsk)return heading('HERD ROUND',`${writer} is writing…`)+`<p>Get ready to pick a side.</p>`;
  return heading('HERD ROUND','Write a this-or-that')+`<p>Split the room. Everyone agrees? You pay.</p>
  <form id="herdForm" class="herd-form"><label for="herdQ">Question</label><input id="herdQ" maxlength="${h.limits.question}" autocomplete="off" required placeholder="Beach or mountains?">
  <div class="herd-options"><div><label for="herdA">A</label><input id="herdA" maxlength="${h.limits.option}" autocomplete="off" required placeholder="Beach"></div><div><label for="herdB">B</label><input id="herdB" maxlength="${h.limits.option}" autocomplete="off" required placeholder="Mountains"></div></div>
  <button class="full" style="margin-top:14px">Send</button></form>`;
 }
 if(s.phase==='herdVote'){
  const top=heading('PICK A SIDE',qTitle(h.question,esc));
  if(h.youAsk)return top+`<div class="note">Your question. Watch them pick.</div>${count}`;
  if(!h.youVote)return top+count;
  if(h.mine)return top+`<div class="note">Locked: ${esc(h.mine==='a'?h.a:h.b)}</div>${count}`;
  return top+`<div class="herd-pick">${btn(`<span class="tag">A</span> ${esc(h.a)}`,'herdVote:a','herd-side full')}${btn(`<span class="tag">B</span> ${esc(h.b)}`,'herdVote:b','herd-side full')}</div>${count}`;
 }
 // Result: A vs B, the callout, then chips (Party) and host controls.
 const r=s.result||{},o=h.reveal;
 const next=`<div style="margin-top:25px">${host?(s.mode==='minigames'?`<div class="row">${btn('Play again','replay')}${btn('Choose another game','lobby','secondary')}</div>`:btn(s.round>=(s.totalRounds||9)?'Show final standings →':'Next round →','next','full')):'<p>Waiting for the host</p>'}</div>`;
 const chips=s.mode!=='minigames'?Object.entries(r.changes||{}).map(([pid,n])=>`<div class="score"><span class="name">${name(pid)}</span><strong class="${n<0?'negative':'positive'}" style="color:${n<0?'var(--pink)':'var(--lime)'}">${n>0?'+':''}${n} chips</strong></div>`).join(''):'';
 if(!o||o.cancelled)return heading('RESULT','Round over')+`<p>${esc(r.detail)}</p>${carryLine(r)?`<p class="micro">${carryLine(r)}</p>`:''}${chips}${next}`;
 const title=o.tie?'Tie · chips back':o.easy?'Too easy!':r.winners?.includes(s.you)?'You’re in the Herd':o.sheep===s.you?'🐑 Black Sheep':'Round over';
 const call=o.easy?`<div class="note herd-callout">Too easy: ${writer} pays${h.chips&&o.penalty?` ${o.penalty}`:''}</div>`:o.sheep?`<div class="note herd-callout">🐑 Black Sheep: ${name(o.sheep)}${h.chips&&o.penalty?` · pays ${o.penalty}`:''}</div>`:'';
 const col=(k,ids)=>`<div class="herd-col${o.side===k?' herd-win':''}"><span class="tag">${k.toUpperCase()}${o.side===k?' · wins':''}</span><h3>${esc(k==='a'?h.a:h.b)}</h3><p class="herd-count">${ids.length}</p><ul class="herd-names">${sheepList(ids,name,o.sheep)}</ul></div>`;
 return heading('RESULT',title)+`${call}<div class="herd-cols">${col('a',o.A)}${col('b',o.B)}</div>${o.missed.length?`<p class="micro">No pick: ${o.missed.map(name).join(', ')}</p>`:''}${s.mode!=='minigames'&&carryLine(r)?`<p class="micro">${carryLine(r)}</p>`:''}${s.mode==='minigames'?`<p>${o.tie?'Tied round':r.winners.length?'Winner'+(r.winners.length>1?'s':'')+': '+r.winners.map(name).join(', '):'No winner this time'}</p>`:chips}${next}`;
}
