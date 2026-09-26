// Phone screens for "Oops, I guess one more round?" (One More Round).
import {swipeCard} from './swipe.js';
export const finaleUi={mode:'answer',autoSent:''};
export const MODE_LABEL={answer:'✍️ Answer it',draw:'🎨 Draw it'};
const plural=(n,one,many)=>`${n} ${n===1?one:many}`;
export const isFinaleScreen=s=>!!s.finale&&(String(s.phase).startsWith('finale')||s.phase==='result');
function entryBody(e,esc){return typeof e.value==='string'&&e.value.startsWith('data:image/png;base64,')?`<img alt="Drawing" src="${esc(e.value)}">`:`<p class="answer">${esc(e.value)}</p>`;}
export function finaleScreen(s,{esc,name,btn,heading,host}){
 const f=s.finale,title='Oops, I guess one more round?';
 if(s.phase==='finaleWrite'){
  if(!f.inGame)return heading('ONE MORE ROUND',title)+`<p>Everyone is writing a prompt. You joined after this round started, so sit back and watch.</p>`;
  if(f.mine)return heading('ONE MORE ROUND','Prompt sent')+`<div class="build finale-prompt"><span class="tag">${MODE_LABEL[f.mine.mode]}</span><p class="answer">${esc(f.mine.text)}</p></div><p>${f.promptsIn} of ${f.total} prompts in. Nobody sees who wrote what until the end.</p>`;
  return heading('ONE MORE ROUND',title)+`<p>Write one short prompt for the whole room. Everyone picks the funniest one, then everyone plays it.</p>
  <div class="finale-modes" role="group" aria-label="How to play your prompt">${['answer','draw'].map(m=>`<button type="button" class="${finaleUi.mode===m?'selected':'secondary'}" aria-pressed="${finaleUi.mode===m}" data-action="finaleMode:${m}">${MODE_LABEL[m]}</button>`).join('')}</div>
  <p class="micro">${finaleUi.mode==='draw'?'Everyone draws it.':'Everyone writes a funny answer.'}</p>
  <form id="finalePromptForm"><label for="answer">Your prompt (${f.limits.prompt} characters)</label><input id="answer" maxlength="${f.limits.prompt}" autocomplete="off" required placeholder="Type your prompt"><button class="full" style="margin-top:14px">Send prompt</button></form>
  <details class="finale-examples" open><summary>Need an idea?</summary><ul>${f.examples.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>
  <p class="micro">${f.promptsIn} of ${f.total} prompts in. No prompt when time runs out? You get a random one.</p>`;
 }
 if(s.phase==='finalePick'){
  const k=f.pick;
  if(!k||!k.pair)return heading('THIS OR THAT?','Nice picks')+`<p>Waiting for the others. ${f.picked} of ${f.total} done.</p>`;
  return heading('THIS OR THAT?','Which would be funnier to play?')+`<p class="micro">Pair ${k.index+1} of ${k.count}</p>${swipeCard({a:{text:k.pair[0].text,tag:MODE_LABEL[k.pair[0].mode]},b:{text:k.pair[1].text,tag:MODE_LABEL[k.pair[1].mode]},actionA:'finalePick:'+k.pair[0].key,actionB:'finalePick:'+k.pair[1].key,key:`finale:${s.code}:${s.round}:${k.index}`},esc)}<div class="finale-pair">${k.pair.map(x=>`<button type="button" class="finale-choice" data-action="finalePick:${esc(x.key)}"><span class="tag">${MODE_LABEL[x.mode]}</span><span class="finale-choice-text">${esc(x.text)}</span></button>`).join('')}</div><p class="micro">${f.picked} of ${f.total} done</p>`;
 }
 if(s.phase==='finalePlay'){
  const two=f.played.length>1,m=f.mine;
  if(!m)return heading('ONE MORE ROUND','Watch this one')+f.played.map(x=>`<div class="build"><span class="tag">${MODE_LABEL[x.mode]}</span><p class="answer">${esc(x.text)}</p></div>`).join('')+`<p>${f.sent} of ${f.playing} sent</p>`;
  const top=heading(two?`GROUP ${m.group+1}`:'THE ROOM PICKED',esc(m.prompt.text))+`<span class="tag">${MODE_LABEL[m.prompt.mode]}</span>${two?'<p class="micro">Two prompts won. Your half of the room plays this one.</p>':''}`;
  if(m.submitted)return top+`<div class="note">Sent. ${f.sent} of ${f.playing} in.</div>`;
  if(m.prompt.mode==='draw')return top+`<p>Draw it with your finger or mouse. Tap Submit before time runs out. If time runs out, we send what you drew.</p><canvas id="canvas" width="600" height="400" aria-label="Draw the prompt here"></canvas><div class="row">${btn('Clear','clear','secondary')}${btn('Submit drawing','finaleDraw')}</div><p class="micro finale-progress">${f.sent} of ${f.playing} sent</p>`;
  return top+`<form id="finaleAnswerForm"><label for="answer">Your answer (${f.limits.answer} characters)</label><textarea id="answer" maxlength="${f.limits.answer}" rows="3" required placeholder="Make it funny"></textarea><button class="full" style="margin-top:14px">Send answer</button></form><p class="micro">${f.sent} of ${f.playing} sent</p>`;
 }
 if(s.phase==='finaleVote'){
  const two=f.played.length>1;
  const card=e=>`<div class="build finale-entry${f.myVotes.includes(e.key)?' voted':''}">${entryBody(e,esc)}${e.mine?'<p class="micro">Your entry</p>':f.myVotes.includes(e.key)?'<p class="micro">✓ Your vote</p>':btn('Vote','finaleVote:'+esc(e.key),'secondary full',!f.votesLeft||!f.inGame)}</div>`;
  const groups=f.played.map((x,i)=>{const list=f.entries.filter(e=>e.group===i);return `${two?`<h3 class="finale-group">${esc(x.text)}</h3>`:''}${list.map(card).join('')||'<p>No entries here.</p>'}`;}).join('');
  return heading('VOTE','Pick the funniest')+`${two?'':`<p class="vote-prompt">${esc(f.played[0].text)}</p>`}<p>${!f.inGame?'You joined late, so just enjoy these.':f.votesLeft?`You have ${plural(f.votesLeft,'vote','votes')} left. You can’t vote for your own.`:'✓ Your votes are in.'}</p>${groups}<p class="micro">${f.voted} of ${f.total} done voting</p>`;
 }
 // Results: authors revealed.
 const R=f.reveal||{entries:[],played:[],prompts:[],winners:[],best:[]};const chips=f.chips;
 const tags=id=>[R.winners.includes(id)?`🏆 Main pot${chips?` · +${(R.awards[id]||[]).filter(a=>a.why==='main').reduce((t,a)=>t+a.n,0)} chips`:''}`:'',R.toilet===id?`🚽 Toilet Bowl: dishonourable mention${chips?' · +10 chips':''}`:''].filter(Boolean).map(t=>`<span class="tag finale-award">${t}</span>`).join('');
 const played=R.played.map((x,i)=>`<div class="build finale-played"><span class="tag">${R.played.length>1?`Prompt ${i+1} · `:''}${MODE_LABEL[x.mode]}</span><p class="answer">${esc(x.text)}</p><p class="micro">${x.writer?`⭐ Best Prompt: ${name(x.writer)}${chips?' · +20 chips':''}`:'A built-in prompt. No Best Prompt award.'}</p></div>`).join('');
 const list=R.entries.map(e=>`<div class="build">${R.played.length>1?`<span class="micro">Prompt ${e.group+1}</span>`:''}<h3>${name(e.player)} · ${plural(e.votes,'vote','votes')}</h3>${tags(e.player)}${entryBody(e,esc)}</div>`).join('')||'<p>No entries came in.</p>';
 const me=s.you,mine=Object.values(R.awards?.[me]||{}).reduce((t,a)=>t+a.n,0);
 const who=R.winners.map(name).join(' & ');
 return heading('RESULTS',R.winners.length?(chips?`${who} ${R.winners.length>1?'split':'takes'} the main pot`:`${who} ${R.winners.length>1?'tie for the win':'wins'}`):(chips?'Nobody took the main pot':'No votes, no winner'))+`<p>${chips?`Main pot: ${R.pot} chips from the house. Nobody paid to play.`:'Awards only in Minigames. No chips.'}${chips&&mine?` You got +${mine} chips.`:''}</p>${played}<h3>Entries</h3>${list}<details><summary>Every prompt</summary>${R.prompts.map(x=>`<p><b>${x.writer?name(x.writer):'Built-in'}</b> · ${esc(x.text)} · won ${x.wins} of ${x.seen}</p>`).join('')}</details><div style="margin-top:25px">${host?(s.mode==='minigames'?`<div class="row">${btn('Play again','replay')}${btn('Choose another game','lobby','secondary')}</div>`:btn('Show final standings →','next','full')):'<p>Waiting for the host</p>'}</div>`;
}
