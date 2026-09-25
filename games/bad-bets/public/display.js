import {restaurantHeading,foodLabel} from './restaurants.js';
import {gameById,MAX_PLAYERS} from './catalog.js';

// ---------- pure rendering (importable in node for tests) ----------
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DATE_LEVELS=['Keep it light','A little more','Closer together'];
const DATE_THEMES=[{bg:'#FBF1EC',ink:'#4A2231',accent:'#B8465E',muted:'#8A5A66'},{bg:'#6E3F52',ink:'#FBF1EC',accent:'#F6C1B3',muted:'#E3C3C9'},{bg:'#221A26',ink:'#FBF1EC',accent:'#E98D7D',muted:'#BFAEB8'}];
const CREATIVE=['draft','auction','draw','quips'];
const PHYSICAL=['shadow','rhythm'];
const chips=n=>`${n} chip${n===1?'':'s'}`;
const live=s=>(s.players||[]).filter(p=>!p.left);
const nameOf=(s,id)=>esc((s.players||[]).find(p=>p.id===id)?.name||'Someone');
const andList=xs=>xs.length<2?xs.join(''):`${xs.slice(0,-1).join(', ')} and ${xs[xs.length-1]}`;
const names=(s,ids)=>andList((ids||[]).map(id=>nameOf(s,id)));
const signed=n=>n>0?`+${n}`:n<0?`−${Math.abs(n)}`:'±0';
const timer=s=>s.deadline&&s.phase!=='paused'?`<span class="timer" data-deadline="${Number(s.deadline)}" aria-label="Time left"></span>`:'';
const art=id=>gameById(id)?`<img class="art" src="/art/${esc(id)}.svg" alt="">`:'';
const isDrawing=v=>typeof v==='string'&&/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(v);

// Every phase gets friendly words. Nothing raw ever reaches the screen.
export function statusText(s){
 const g=gameById(s.game)?.name;
 const map={lobby:'Waiting for players',ban:'Vote a game off the wheel',banResult:'The wheel is set',entry:'Stay in or sit out?',stake:'Placing bets',spin:'Spinning the wheel',wager:'Betting round',reveal:'Get ready',play:'Answer on your phones',clue:'Clue time',discuss:'Talk it out',vote:'Voting time',pitch:'Pitch time',auction:'Food auction',draft:'Food court draft',physicalSetup:'Get in position',physical:'Playing live',physicalConfirm:'Checking the score',physicalDispute:'Score check',result:'Round results',finished:'Final standings',comeback:'Comeback chance',paused:'Paused',mixer:s.deck==='date'?'Date Night':'Your turn to share',mixerReveal:s.deck==='date'?'Date Night':'Answers are in',dateCheck:'Date Night'};
 if(s.phase==='play'&&s.game==='draw')return 'Drawing on phones';
 if(s.phase==='play'&&s.game==='number')return 'Guess on your phones';
 if(s.phase==='vote'&&s.game==='imposter')return 'Who’s faking? Vote now';
 return map[s.phase]||(g?`Playing ${g}`:'Game in progress');
}

function roundText(s){
 if(s.phase==='lobby')return '';
 if(s.mode==='mixer')return s.round?`Card ${s.round} of ${s.mixerTotal||'?'}`:'';
 return s.round?`Round ${s.round} of ${s.totalRounds||9}`:'';
}

function dateLevelIndex(label){const i=DATE_LEVELS.indexOf(label);return i<0?0:i;}

export function themeFor(s){
 if(s.mode==='mixer'&&s.deck==='date'&&['mixer','mixerReveal','dateCheck'].includes(s.phase)){
  const lvl=s.phase==='dateCheck'?dateLevelIndex(s.dateNextLevel):dateLevelIndex(s.dateLevel);
  return {name:`date-${lvl+1}`,...DATE_THEMES[lvl]};
 }
 return {name:'base',bg:'#F7F6F2',ink:'#293C48',accent:'#087F98',muted:'#5D6C75'};
}

function gameVars(id){const g=gameById(id);return g?`--tile:${g.color};--tile-ink:${g.ink}`:'--tile:#DCEBEE;--tile-ink:#293C48';}

function gameBanner(s,extra=''){
 const g=gameById(s.game);if(!g)return '';
 return `<div class="banner" style="${gameVars(s.game)}">${art(s.game)}<div><p class="banner-name">${esc(g.name)}</p><p class="banner-how">${esc(g.description)}</p></div>${extra}</div>`;
}

function scoreboard(s,{title='Chip count',big=false,highlight=[]}={}){
 const ps=live(s).slice().sort((a,b)=>b.chips-a.chips||a.name.localeCompare(b.name));
 const max=Math.max(1,...ps.map(p=>p.chips));
 const changes=s.phase==='result'?s.result?.changes||{}:{};
 return `<section class="board${big?' board-big':''}${big&&ps.length>6?' two':''}"><h2 class="eyebrow">${esc(title)}</h2><ol${big&&ps.length>6?` style="grid-template-rows:repeat(${Math.ceil(ps.length/2)},auto)"`:''}>${ps.map((p,i)=>{const c=changes[p.id];return `<li class="${highlight.includes(p.id)?'win':''}"><span class="rank">${i+1}</span><span class="who">${esc(p.name)}</span><span class="bar"><i style="width:${Math.max(2,Math.round(p.chips/max*100))}%"></i></span><span class="amt">${p.chips}${typeof c==='number'&&c!==0?` <em class="${c>0?'up':'down'}">${signed(c)}</em>`:''}</span></li>`;}).join('')}</ol></section>`;
}

function progress(done,total,word='answers in'){
 total=Math.max(0,total|0);done=Math.min(done|0,total);
 return `<div class="progress"><span class="dots">${Array.from({length:total},(_,i)=>`<i class="${i<done?'on':''}"></i>`).join('')}</span><span>${done} of ${total} ${esc(word)}</span></div>`;
}

function entryContent(s,id,answers){
 const a=answers?.[id];let out='';
 if(s.game==='draw'&&isDrawing(a))out+=`<img class="drawing" alt="Drawing" src="${esc(a)}">`;
 else if(a!==undefined&&a!==null&&a!==''&&!(s.game==='draw'))out+=`<p class="answer">${esc(a)}</p>`;
 else if(s.game==='draw')out+=`<p class="answer muted">No drawing</p>`;
 const picks=(s.result?.picks||s.picks||{})[id]||[];
 if(picks.length)out+=`<ul class="meal">${picks.map(item=>`<li>${foodLabel(item)}</li>`).join('')}</ul>`;
 return out||'<p class="answer muted">No answer</p>';
}

// ---------- scenes ----------
function lobby(s,ctx){
 const ps=live(s),url=ctx.joinUrl(s.code);
 const mode=s.mode==='mixer'?`${esc(s.deckName||'Conversation deck')} · talk, no chips`:s.mode==='minigames'?'Minigames · just for fun':'Party mode · 100 chips each';
 return `<section class="lobby">
 <div class="join">
  <p class="eyebrow">Join on your phone</p>
  <p class="join-url">Go to <strong>${esc(ctx.joinHost)}</strong></p>
  <p class="eyebrow">Room code</p>
  <p class="code" aria-label="Room code ${esc(s.code)}">${[...String(s.code||'')].map(c=>`<span>${esc(c)}</span>`).join('')}</p>
  <p class="mode">${mode}</p>
 </div>
 <div class="qr" role="img" aria-label="QR code to join room ${esc(s.code)}">${ctx.qr(url)}<span>Scan to join</span></div>
 </section>
 <section class="roster${ps.length>8?' crowd':''}"><h2><strong>${ps.length}</strong> / ${MAX_PLAYERS} players</h2><ul class="chips">${ps.map(p=>`<li class="${ctx.fresh?.has(p.id)?'new':''}${p.disconnected?' away':''}">${esc(p.name)}${p.id===s.host?' <small>host</small>':''}</li>`).join('')||'<li class="ghost">Waiting for the first player…</li>'}</ul>
 <p class="hint">${ps.length<2?'Need at least 2 players to start.':'The host starts the game from their phone.'}</p></section>`;
}

function hero(s,{eyebrow='Next game',sub=''}={}){
 const g=gameById(s.game);
 if(!g)return `<section class="center"><p class="eyebrow">${esc(eyebrow)}</p><h1 class="big">Spinning…</h1></section>`;
 const opts=(s.spinOptions||[]).filter(id=>gameById(id));
 return `<section class="hero" style="${gameVars(s.game)}">
 <div class="hero-art">${art(s.game)}</div>
 <div class="hero-copy"><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(g.name)}</h1><p class="how">${esc(g.description)}</p><p class="tag">${esc(g.label)}</p>${sub}</div>
 </section>${opts.length>1?`<ul class="wheel">${opts.map(id=>`<li class="${id===s.game?'pick':''}" style="${gameVars(id)}">${esc(gameById(id).short)}</li>`).join('')}</ul>`:''}`;
}

function players(s){
 const pot=s.pot;if(!pot)return '';
 const c=pot.contestants||[],j=pot.judges||[];
 let out='';
 if(c.length&&c.length<live(s).length)out+=`<p class="line">${c.length===2?`${nameOf(s,c[0])} vs ${nameOf(s,c[1])}`:`Playing: ${names(s,c)}`}</p>`;
 if(j.length)out+=`<p class="line muted">Judging: ${names(s,j)}</p>`;
 return out;
}

function spin(s){return hero(s,{eyebrow:'The wheel picked',sub:`${players(s)}<p class="line muted">Betting opens in a moment.</p>`});}

function ban(s){
 const ids=[...(s.candidates||[]),...(s.banned&&!(s.candidates||[]).includes(s.banned)?[s.banned]:[])].filter(id=>gameById(id));
 const result=s.phase==='banResult';
 return `<section class="center"><h1>${result?(s.banned?`${esc(gameById(s.banned)?.name||'A game')} is off the wheel`:'Nothing got voted off'):'Vote one game off the wheel'}</h1>
 ${result?(s.banTie?'<p class="lead">It was a tie, so the wheel broke it.</p>':''):`<p class="lead">${Number(s.banCount)||0} of ${live(s).length} votes in ${timer(s)}</p>`}</section>
 <ul class="tiles">${ids.map(id=>`<li class="${id===s.banned?'out':''}" style="${gameVars(id)}">${art(id)}<span>${esc(gameById(id).short)}</span>${result&&s.banTotals?.[id]?`<b>${s.banTotals[id]} vote${s.banTotals[id]===1?'':'s'}</b>`:''}</li>`).join('')}</ul>`;
}

function entry(s){
 const out=(s.eliminated||[]);
 return `<section class="center"><p class="eyebrow">Spotlight round</p><h1>Stay in for ${chips(Number(s.ladder)||5)}?</h1><p class="lead">Decide on your phone. ${timer(s)}</p>${out.length?`<p class="line muted">Sitting out: ${names(s,out)}</p>`:''}</section>`;
}

function stake(s){return `${gameBanner(s)}<section class="center"><h1>Place your bets</h1><p class="lead">Choose on your phone. ${timer(s)}</p></section>`;}

function wager(s){
 const pot=s.pot||{},g=gameById(s.game);
 const turn=pot.turn?`<p class="turn"><strong>${nameOf(s,pot.turn)}</strong> is deciding</p><p class="line">${pot.target?`${chips(pot.target)} to stay in`:''}</p>`:'<p class="turn">Locking in bets…</p>';
 const c=pot.contestants||s.active||[],folded=pot.folded||[],contrib=pot.contributions||s.stakes||{};
 return `<section class="bet">
 <div class="bet-game" style="${gameVars(s.game)}">${g?`${art(s.game)}<p class="banner-name">${esc(g.name)}</p><p class="banner-how">${esc(g.description)}</p>`:''}</div>
 <div class="bet-pot"><p class="eyebrow">In the pot</p><p class="pot">${Number(pot.total)||0}</p><p class="pot-unit">chips</p>${turn}${timer(s)}${pot.fixed?'<p class="line muted">Same bet for everyone this game.</p>':''}</div>
 </section>
 <ul class="seats">${c.map(id=>`<li class="${id===pot.turn?'now':''}${folded.includes(id)?' folded':''}"><span>${nameOf(s,id)}</span><b>${folded.includes(id)?'Folded':chips(Number(contrib[id])||0)}</b></li>`).join('')}</ul>
 ${(pot.judges||[]).length?`<p class="line muted center-text">Judging: ${names(s,pot.judges)}</p>`:''}`;
}

function promptBlock(s,{lead='',foot=''}={}){
 return `<section class="prompt-wrap"><p class="prompt">${esc(s.prompt||'')}</p>${lead?`<p class="lead">${lead}</p>`:''}${foot}</section>`;
}

function reveal(s){
 if(PHYSICAL.includes(s.game))return hero(s,{eyebrow:'Up next · in person',sub:`<p class="line">${esc(s.prompt||'')} ${timer(s)}</p>${players(s)}`});
 if(s.game==='auction'||s.game==='draft')return `${gameBanner(s,timer(s))}${promptBlock(s,{lead:'Get ready. It starts on your phones.'})}`;
 if(s.game==='imposter')return `${gameBanner(s,timer(s))}<section class="prompt-wrap">${s.category?`<p class="eyebrow">Category</p><p class="prompt">${esc(s.category)}</p>`:''}<p class="lead">Check your phone. Everyone sees the secret word except the faker.</p></section>`;
 return `${gameBanner(s,timer(s))}${promptBlock(s,{lead:'Get ready. Answers open in a moment.'})}`;
}

function play(s){
 const total=(s.active||[]).length;
 const word=s.game==='draw'?'drawings in':s.game==='number'?'guesses in':'answers in';
 return `${gameBanner(s,timer(s))}${promptBlock(s,{foot:progress(s.submissionCount,total,word)})}`;
}

function clueList(s){
 const order=s.clueOrder||[],answers=s.answers||{};
 return `<ol class="clues${order.length>6?' many':''}"${order.length>6?` style="grid-template-rows:repeat(${Math.ceil(order.length/2)},auto)"`:''}>${order.map((id,i)=>{const a=answers[id];const now=s.phase==='clue'&&i===s.clueIndex;return `<li class="${now?'now':''}"><span>${nameOf(s,id)}</span><b>${a!==undefined?`“${esc(a)}”`:now?'thinking…':'…'}</b></li>`;}).join('')}</ol>`;
}

function clue(s){
 const who=s.cluePlayer?`<strong>${nameOf(s,s.cluePlayer)}</strong> is giving a clue`:'Clue time';
 return `${gameBanner(s,timer(s))}<section class="split"><div>${s.category?`<p class="eyebrow">Category</p><p class="prompt">${esc(s.category)}</p>`:''}<p class="turn">${who}</p></div>${clueList(s)}</section>`;
}

function discuss(s){
 return `${gameBanner(s,timer(s))}<section class="split"><div><h1>${s.phase==='vote'?'Vote on your phones':'Who’s faking?'}</h1><p class="lead">${s.phase==='vote'?'Pick the player you think is the faker.':'Talk it out. Defend your clue.'}</p></div>${clueList(s)}</section>`;
}

function entries(s,{named=false,winners=[],changes={},distances=null}={}){
 const answers=s.result?.answers||s.answers||{};
 let ids=(s.voteOrder&&s.voteOrder.length?s.voteOrder:s.active)||[];
 if(!ids.length)ids=Object.keys(answers);
 return `<ul class="entries${ids.length>4?' many':''}">${ids.map((id,i)=>{const c=changes[id];return `<li class="${winners.includes(id)?'win':''}">
 <p class="entry-head"><span>${named?nameOf(s,id):`Entry ${i+1}`}</span>${named&&typeof c==='number'?`<em class="${c>0?'up':c<0?'down':''}">${signed(c)}</em>`:''}</p>
 ${entryContent(s,id,answers)}${distances&&distances[id]!==undefined?`<p class="line muted">${distances[id]===null?'No guess':distances[id]===0?'Exact!':`Off by ${esc(distances[id])}`}</p>`:''}</li>`;}).join('')}</ul>`;
}

function vote(s){
 if(s.game==='imposter')return discuss(s);
 const named=!CREATIVE.includes(s.game);
 const voters=s.voters||[];
 return `${gameBanner(s,timer(s))}<section class="prompt-wrap small"><p class="prompt">${esc(s.prompt||'')}</p></section>${entries(s,{named})}<p class="line center-text">${voters.length?`Judges, vote on your phones: ${names(s,voters)}`:'Vote on your phones'}</p>`;
}

function pitch(s){
 const ids=s.active||[];
 return `${gameBanner(s,timer(s))}<section class="center tight"><h1>Pitch your meal</h1><p class="lead">Tell everyone why it’s great. Judges vote next.</p></section><ul class="entries${ids.length>4?' many':''}">${ids.map(id=>`<li><p class="entry-head"><span>${nameOf(s,id)}</span></p><ul class="meal">${((s.picks||{})[id]||[]).map(item=>`<li>${foodLabel(item)}</li>`).join('')||'<li class="muted">No picks</li>'}</ul></li>`).join('')}</ul>`;
}

function draft(s){
 const ids=s.active||[],cards=s.cards||[];
 return `${gameBanner(s,timer(s))}<section class="center tight"><p class="turn">${s.draftPlayer?`<strong>${nameOf(s,s.draftPlayer)}</strong> is picking`:'Drafting…'}</p>${cards.length?`<ul class="cards">${cards.map(c=>`<li>${foodLabel(c)}</li>`).join('')}</ul>`:''}</section>
 <ul class="entries${ids.length>4?' many':''}">${ids.map(id=>`<li class="${id===s.draftPlayer?'now':''}"><p class="entry-head"><span>${nameOf(s,id)}</span></p><ul class="meal">${((s.picks||{})[id]||[]).map(item=>`<li>${foodLabel(item)}</li>`).join('')||'<li class="muted">Nothing yet</li>'}</ul></li>`).join('')}</ul>`;
}

function auction(s){
 const a=s.auction||{},ids=s.active||[];
 let head='';
 if((a.pending||[]).length)head=`<p class="turn"><strong>${nameOf(s,a.pending[0].player)}</strong> is choosing from</p>${restaurantHeading(a.pending[0].restaurant)}`;
 else if(a.restaurant)head=`<p class="eyebrow">Up for auction</p>${restaurantHeading(a.restaurant)}<p class="turn">${a.leader?`Top bid <strong>$${Number(a.bid)||0}</strong> by ${nameOf(s,a.leader)}`:'No bids yet'}</p>${a.turn?`<p class="line"><strong>${nameOf(s,a.turn)}</strong>’s turn to bid or pass</p>`:''}`;
 return `${gameBanner(s,timer(s))}<section class="center tight auction">${head}</section>
 <ul class="entries${ids.length>4?' many':''}">${ids.map(id=>`<li class="${id===a.turn?'now':''}"><p class="entry-head"><span>${nameOf(s,id)}</span>${a.budgets&&a.budgets[id]!==undefined?`<em>$${Number(a.budgets[id])} left</em>`:''}</p><ul class="meal">${((s.picks||{})[id]||[]).map(item=>`<li>${foodLabel(item)}</li>`).join('')||'<li class="muted">Nothing yet</li>'}</ul></li>`).join('')}</ul>`;
}

function physical(s){
 const ph=s.physical||{},ids=s.active||[],scores=ph.scores||{};
 const lines={physicalSetup:`Get in position. ${nameOf(s,ph.keeper)} starts the round.`,physical:ph.paused?'Paused':'Go!',physicalConfirm:'Check the score on your phones.',physicalDispute:'The score is disputed. Sort it out together.'};
 const extra=s.game==='shadow'?`<p class="line">First to 3 hits wins${ph.attacker?` · ${nameOf(s,ph.attacker)} points first`:''}</p>`:ph.category?`<p class="eyebrow">Category</p><p class="prompt">${esc(ph.category)}</p>`:'';
 return `${gameBanner(s,timer(s))}<section class="center tight">${extra}<h1>${esc(lines[s.phase]||'Playing live')}</h1>${ph.practice?'<p class="line muted">Practice round</p>':''}</section>
 <ul class="scores">${ids.map(id=>`<li><span>${nameOf(s,id)}</span><b>${Number(scores[id])||0}</b></li>`).join('')}</ul>`;
}

function result(s){
 const r=s.result||{},winners=r.winners||[],changes=r.changes||{};
 const won=winners.map(id=>Number(changes[id])||0);
 let head;
 if(r.tie&&!winners.length)head='It’s a tie';
 else if(r.tie)head=`${names(s,winners)} split the pot`;
 else if(winners.length)head=`${names(s,winners)} win${winners.length===1?'s':''}${won[0]>0?` ${chips(won[0])}`:''}!`;
 else head='Round over';
 let body;
 if(PHYSICAL.includes(s.game)&&s.physical){const sc=s.physical.scores||{};body=`<ul class="scores">${(s.active||[]).map(id=>`<li class="${winners.includes(id)?'win':''}"><span>${nameOf(s,id)}</span><b>${Number(sc[id])||0}</b><em class="${(changes[id]||0)>0?'up':(changes[id]||0)<0?'down':''}">${signed(Number(changes[id])||0)}</em></li>`).join('')}</ul>`;}
 else if(s.game==='imposter'&&(s.clueOrder||[]).length){body=clueList({...s,answers:r.answers||s.answers,phase:'result'});}
 else body=entries(s,{named:true,winners,changes,distances:r.distances||null});
 const g=gameById(s.game);
 return `<section class="result"><div class="result-main">${g?`<p class="eyebrow result-game" style="${gameVars(s.game)}">${art(s.game)}${esc(g.name)}</p>`:''}<h1 class="headline">${head}</h1>${r.detail?`<p class="lead">${esc(r.detail)}</p>`:''}${body}</div>${s.mode==='mixer'?'':scoreboard(s,{highlight:winners})}</section>`;
}

function finished(s){
 if(s.mode==='mixer')return `<section class="center"><p class="eyebrow">${esc(s.deckName||'Conversation deck')}</p><h1 class="big">Thanks for playing</h1><p class="lead">That’s the whole deck.</p></section>`;
 const top=live(s).slice().sort((a,b)=>b.chips-a.chips)[0];
 return `<section class="finale"><div class="center tight"><p class="eyebrow">Game over</p><h1 class="big">${top?`${esc(top.name)} wins!`:'Game over'}</h1></div>${scoreboard(s,{title:'Final standings',big:true,highlight:top?[top.id]:[]})}</section>`;
}

function comeback(s){
 const c=s.comeback||{};const who=nameOf(s,c.player);
 if(c.stage==='perform')return `<section class="center"><p class="eyebrow">Comeback chance</p><h1><strong>${who}</strong> takes the dare</h1>${c.dare?`<p class="prompt">${esc(c.dare)}</p>`:''}<p class="lead">Watch closely. ${timer(s)}</p></section>`;
 if(c.stage==='agree')return `<section class="center"><p class="eyebrow">Comeback chance</p><h1><strong>${who}</strong> wants back in</h1>${c.dare?`<p class="lead">Proposed dare</p><p class="prompt">${esc(c.dare)}</p>`:'<p class="lead">Agree on a dare out loud. The host types it in.</p>'} ${timer(s)}</section>`;
 return `<section class="center"><p class="eyebrow">Comeback chance</p><h1><strong>${who}</strong> is almost out of chips</h1><p class="lead">A dare can win them 20 chips. Deciding on their phone… ${timer(s)}</p></section>`;
}

function paused(s){return `<section class="center"><h1 class="big">Paused</h1><p class="lead">The host will pick it back up in a moment.</p></section>`;}

function dateNight(s){
 const lvl=s.phase==='dateCheck'?s.dateNextLevel:s.dateLevel;
 if(s.phase==='dateCheck')return `<section class="date"><p class="eyebrow">Date Night</p><h1 class="big">Ready for “${esc(lvl)}”?</h1><p class="lead">You both confirm on your phones.</p></section>`;
 return `<section class="date"><p class="eyebrow">Date Night · ${esc(lvl||'')}</p><p class="date-q">${esc(s.prompt||'')}</p>${s.dateFirst?`<p class="turn"><strong>${nameOf(s,s.dateFirst)}</strong> answers first</p>`:''}</section>`;
}

function mixer(s){
 if(s.deck==='date')return dateNight(s);
 const total=live(s).length;
 if(s.phase==='mixerReveal'){
  const answers=Object.values(s.answers||{}),passes=Math.max(0,(Number(s.responseCount)||0)-answers.length);
  return `<section class="prompt-wrap small"><p class="eyebrow">${esc(s.mixerKind||'')}</p><p class="prompt">${esc(s.prompt||'')}</p></section><ul class="entries${answers.length>4?' many':''}">${answers.map(a=>`<li><p class="answer">${esc(a)}</p></li>`).join('')}</ul>${passes?`<p class="line muted center-text">${passes} passed</p>`:''}`;
 }
 const opts=s.options||[];
 return `<section class="prompt-wrap"><p class="eyebrow">${esc(s.mixerKind||'')}</p><p class="prompt">${esc(s.prompt||'')}</p>${opts.length?`<ul class="cards">${opts.map(o=>`<li>${esc(o)}</li>`).join('')}</ul>`:''}${progress(s.responseCount,total,'responded')}</section>`;
}

const SCENES={lobby,ban,banResult:ban,entry,stake,spin,wager,reveal,play,clue,discuss,vote,pitch,draft,auction,physicalSetup:physical,physical,physicalConfirm:physical,physicalDispute:physical,result,finished,comeback,paused,mixer,mixerReveal:mixer,dateCheck:dateNight};

export function render(s,ctx={}){
 ctx={qr:()=>'',joinUrl:c=>`/?room=${encodeURIComponent(c||'')}`,joinHost:'',...ctx};
 const scene=SCENES[s.phase]||(()=>`${gameBanner(s)}<section class="center"><h1>${esc(statusText(s))}</h1><p class="lead">Follow along on your phones.</p></section>`);
 const theme=themeFor(s);
 const top=`<header class="top"><span class="brand">Oops, All In</span><span class="status">${esc(statusText(s))}</span><span class="meta">${s.phase!=='lobby'&&s.code?`Room <b>${esc(s.code)}</b>`:''}${roundText(s)?` · ${esc(roundText(s))}`:''}</span></header>`;
 return {key:`${s.phase}|${s.round}|${s.game||''}`,theme,html:`${top}<main class="stage phase-${esc(s.phase)}">${scene(s,ctx)}</main>`};
}

export function messageScreen(title,detail=''){
 return `<header class="top"><span class="brand">Oops, All In</span><span class="status"></span><span class="meta"></span></header><main class="stage"><section class="center"><h1 class="big">${esc(title)}</h1>${detail?`<p class="lead">${esc(detail)}</p>`:''}</section></main>`;
}

// ---------- browser runtime ----------
function boot(){
 const root=document.querySelector('#display'),conn=document.querySelector('#connection'),fsBtn=document.querySelector('#fullscreen');
 const params=new URLSearchParams(location.search),code=(params.get('room')||'').toUpperCase(),token=location.hash.slice(1);
 let stopped=false,lastVersion=-1,lastHtml='',lastKey='',offset=0,failures=0,known=null,joinOrigin=location.origin,wake=null;
 const qrCache=new Map();
 const qr=url=>{if(!qrCache.has(url)){let svg='';try{if(window.qrcode){const q=window.qrcode(0,'M');q.addData(url);q.make();svg=q.createSvgTag({cellSize:6,margin:2,scalable:true});}}catch{}qrCache.set(url,svg);}return qrCache.get(url);};
 const ctx={qr,joinUrl:c=>`${joinOrigin}/?room=${encodeURIComponent(c||'')}`,get joinHost(){return joinOrigin.replace(/^https?:\/\//,'');}};
 // On a local server, point phones at the LAN address instead of localhost.
 if(/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)){fetch('/info').then(r=>r.json()).then(d=>{if(d.addresses?.[0]){joinOrigin=`http://${d.addresses[0]}${location.port?':'+location.port:''}`;lastHtml='';}}).catch(()=>{});}
 const setConn=(text,bad)=>{conn.textContent=text;conn.hidden=!text;conn.classList.toggle('bad',!!bad);};
 const applyTheme=t=>{const st=document.documentElement.style;st.setProperty('--bg',t.bg);st.setProperty('--ink',t.ink);st.setProperty('--accent',t.accent);st.setProperty('--muted',t.muted);document.documentElement.dataset.theme=t.name;};
 const tick=()=>{const now=Date.now()+offset;for(const el of root.querySelectorAll('.timer[data-deadline]')){const left=Math.max(0,Math.ceil((Number(el.dataset.deadline)-now)/1000));el.textContent=`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;el.classList.toggle('low',left<=5);}};
 setInterval(tick,250);
 async function poll(){
  if(stopped)return;
  try{
   if(!code||!token){root.innerHTML=messageScreen('Open this from the host’s phone','In the lobby, tap “Open shared display”.');stopped=true;return;}
   const res=await fetch(`/state?code=${encodeURIComponent(code)}`,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(6000)});
   const s=await res.json();
   if(!res.ok||s.error){const e=Error(s.error||'Reconnecting');e.fatal=/expired|not found/i.test(s.error||'');throw e;}
   const d=Date.parse(res.headers.get('Date')||'');if(Number.isFinite(d)){const o=d-Date.now();offset=Math.abs(o)>2000?o:0;}
   failures=0;setConn('',false);
   if(s.version<lastVersion)return;lastVersion=s.version;
   const ids=live(s).map(p=>p.id);ctx.fresh=known?new Set(ids.filter(id=>!known.has(id))):new Set();known=new Set(ids);
   const out=render(s,ctx);applyTheme(out.theme);
   if(out.html!==lastHtml){root.innerHTML=out.html;lastHtml=out.html;
    if(out.key!==lastKey){root.classList.remove('enter');void root.offsetWidth;root.classList.add('enter');lastKey=out.key;}
    tick();}
  }catch(e){
   failures++;
   if(e.fatal){root.innerHTML=messageScreen('This room has ended','Start a new room on a phone, then open the display again.');lastHtml='';stopped=true;return;}
   setConn(failures>1?'Reconnecting…':'Checking connection…',true);
   if(!lastHtml)root.innerHTML=messageScreen('Connecting to the room…');
  }finally{if(!stopped)setTimeout(poll,failures>3?3000:1000);}
 }
 // Fullscreen + keep the screen awake.
 const canFs=!!(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen);
 const syncFs=()=>{fsBtn.hidden=!canFs||!!(document.fullscreenElement||document.webkitFullscreenElement)||fsBtn.dataset.used==='1';};
 async function keepAwake(){try{if('wakeLock' in navigator&&document.visibilityState==='visible'&&!wake){wake=await navigator.wakeLock.request('screen');wake.addEventListener('release',()=>{wake=null;});}}catch{wake=null;}}
 fsBtn.addEventListener('click',async()=>{fsBtn.dataset.used='1';try{const el=document.documentElement;await (el.requestFullscreen?el.requestFullscreen({navigationUI:'hide'}):el.webkitRequestFullscreen());}catch{}syncFs();keepAwake();});
 document.addEventListener('fullscreenchange',syncFs);document.addEventListener('webkitfullscreenchange',syncFs);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')keepAwake();});
 let idle;const wakeBtn=()=>{fsBtn.classList.remove('idle');clearTimeout(idle);idle=setTimeout(()=>fsBtn.classList.add('idle'),12000);};document.addEventListener('pointermove',wakeBtn);document.addEventListener('keydown',wakeBtn);wakeBtn();
 syncFs();keepAwake();
 window.addEventListener('pagehide',()=>{stopped=true;});
 window.addEventListener('pageshow',e=>{if(e.persisted){stopped=false;poll();}});
 poll();
}
if(typeof document!=='undefined'&&document.querySelector('#display'))boot();
