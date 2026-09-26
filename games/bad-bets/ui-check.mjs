// UI quality checker: renders real screens in headless Chrome and audits contrast, overflow,
// tap targets, overlapping text and dashes. Run with `npm run check:ui` (needs Google Chrome).
//   node ui-check.mjs                 all screens, 375x812 and 1280x800
//   node ui-check.mjs --only=shadow   screens whose name contains "shadow"
//   node ui-check.mjs --out=dir       screenshots somewhere other than ./ui-shots
// Writes ui-report.json and one PNG per screen. Exits 1 when contrast or overflow failures exist.
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Game,createServer} from './server.mjs';
import {auditSource,summarize,BLOCKING} from './ui-check-lib.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const args=Object.fromEntries(process.argv.slice(2).map(a=>{const [k,v]=a.replace(/^--/,'').split('=');return [k,v??true];}));
const OUT=path.resolve(here,args.out||'ui-shots');
const CHROME=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VIEWPORTS=[{id:'375',width:375,height:812,mobile:true,scale:2},{id:'1280',width:1280,height:800,mobile:false,scale:1}];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// ---------- room states, built with the real game engine ----------
const game=new Game();
const NAMES=['Clark','Kai','Leilani','Mika','Noa','Keola'];
function room({mode='tournament',players=4,quick=null,quickGame}={}){
 const {code,token}=game.create(NAMES[0],mode,quick,quickGame);const r=game.rooms.get(code);
 for(const n of NAMES.slice(1,players))game.join(code,n);
 r.players[0].token=token;return r;
}
const host=r=>r.players.find(p=>p.id===r.host);
const act=(r,p,a)=>game.action(r,p,a);
const tryDo=f=>{try{f();}catch{}};
function minigame(id,players=4){const r=room({mode:'minigames',players});act(r,host(r),{type:'selectGame',game:id});act(r,host(r),{type:'start'});return r;}
// Step the engine until the phase matches (or a step budget runs out).
function stepTo(r,phases,max=40){for(let i=0;i<max&&!phases.includes(r.phase);i++)game.advance(r);return r;}
function midPlay(id){
 const r=minigame(id);
 if(id==='shadow'||id==='rhythm'){game.advance(r);const h=host(r);if(id==='rhythm')act(r,h,{type:'physicalCategory',revision:r.physical.revision,random:true});act(r,h,{type:'physicalStart',practice:false,revision:r.physical.revision});return r;}
 game.advance(r);
 if(id==='draft'){game.advance(r);game.advance(r);}
 // Deterministic: it is always the viewer's (host's) turn to bid, so the raise buttons render.
 if(id==='auction'&&r.auction?.turn)r.auction.turn=r.host;
 if(id==='imposter'){const p=r.players.find(p=>p.id===r.clueOrder[r.clueIndex]);tryDo(()=>act(r,p,{type:'clue',value:'Crunchy',clueIndex:r.clueIndex}));}
 return r;
}
function result(id){
 const r=midPlay(id);
 if(id==='shadow'||id==='rhythm'){r.physical.scores[r.active[0]]=3;r.physical.scores[r.active[1]]=1;game.settle(r);return r;}
 if(id==='brain'){const [a,b]=r.active;r.submissions[a]='Spam musubi';r.submissions[b]='spam musubi';r.submissions[r.active[2]]='Poke';}
 if(id==='number')r.active.forEach((pid,i)=>r.submissions[pid]=String(Number(r.answer)+(i+1)*7));
 if(['quips','draw'].includes(id))r.active.forEach((pid,i)=>r.submissions[pid]=id==='quips'?['A haunted rice cooker','Free parking at Ala Moana','Grandma on a jet ski'][i%3]:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=');
 if(['draft','auction','quips','draw','imposter'].includes(id)){const [a,b]=r.active;r.votes={};r.players.forEach(p=>{r.votes[p.id]=p.id===a?b:a;});}
 game.settle(r);return r;
}
function dateNight(level,phase='mixer'){
 const r=room({mode:'mixer',players:2});act(r,host(r),{type:'start'});
 if(level>1||phase==='dateCheck'){r.round=(level-1)*12;r.dateApproved=r.round;if(phase==='dateCheck'){r.round=12;r.dateApproved=0;game.mixerNext(r);}else game.mixerNext(r);}
 if(phase==='finished')game.phase(r,'finished');
 return r;
}
function standings(){
 const r=room({players:4});r.enabledGames=['number'];r.banEnabled=false;act(r,host(r),{type:'start'});
 r.players.forEach((p,i)=>p.chips=[145,120,85,50][i]);r.round=9;r.history=[{round:1,game:'number',prompt:'How many islands in Hawaii?',detail:'Kai was closest.',changes:{}}];game.phase(r,'finished');return r;
}
function quickResult(){const r=room({mode:'minigames',players:2,quick:'hoops',quickGame:'number'});act(r,host(r),{type:'start'});stepTo(r,['play']);r.active.forEach((pid,i)=>r.submissions[pid]=String(Number(r.answer)+(i+1)*3));game.settle(r);return r;}
function herd(){const r=room({players:5});r.enabledGames=['brain'];r.banEnabled=false;r.brainRounds=1;game.fresh(r);stepTo(r,['herdWrite','play'],12);return r;}

// New screens (2026-09-26): Family/Adults lobby, house round, round-2 teach card, awards, host controls, stats page.
function partyStart(players=4,games=['brain','number']){const r=room({players});r.banEnabled=false;r.enabledGames=games;act(r,host(r),{type:'start'});return r;}
function finishHouse(r){game.advance(r);r.active.forEach((id,i)=>act(r,r.players.find(p=>p.id===id),{type:'submit',value:r.game==='number'?String(i):'Spam musubi'}));}
function teach(phase){const r=partyStart(4,['number']);finishHouse(r);act(r,host(r),{type:'next'});if(phase==='wager'){game.advance(r);r.pot.turn=r.host;}return r;}
function playOut(r,answer){for(let i=0;i<600&&r.phase!=='finished';i++){const q=id=>r.players.find(p=>p.id===id);
 if(r.phase==='wager'){act(r,q(r.pot.turn),{type:'potBet',move:'match',round:r.round,revision:r.pot.revision,confirmed:true});continue;}
 if(r.phase==='play'){for(const [k,id] of [...r.active].entries()){if(r.phase!=='play')break;if(r.submissions[id]===undefined)act(r,q(id),{type:'submit',value:answer(r,id,k),promptVersion:r.promptVersion||0});}continue;}
 if(r.phase==='herdVote'){for(const [k,id] of [...r.herd.voters].entries()){if(r.phase!=='herdVote')break;if(!r.herd.votes[id]&&r.active.includes(id))act(r,q(id),{type:'herdVote',side:k===r.herd.voters.length-1?'b':'a'});}continue;}
 if(r.phase==='result'){act(r,host(r),{type:'next'});continue;}
 game.advance(r);}return r;}
function awardsNight(){const r=room({players:5});r.banEnabled=false;r.enabledGames=['brain','number'];r.totalRounds=6;r.brainRounds=1;act(r,host(r),{type:'start'});
 const [a,b,c]=r.players.map(p=>p.id);return playOut(r,(r,id,k)=>r.game==='number'?String(r.answer+(id===c?0:(k+1)*40)):[a,b].includes(id)?'Spam musubi':`Poke ${k}`);}
function minigamesNight(){const r=room({mode:'minigames',players:4});act(r,host(r),{type:'selectGame',game:'number'});
 for(let i=0;i<3;i++){act(r,host(r),{type:i?'replay':'start'});act(r,host(r),{type:'beginGame'});r.active.forEach((id,k)=>act(r,r.players.find(p=>p.id===id),{type:'submit',value:String(r.answer+(k===1?0:(k+1)*9))}));}
 act(r,host(r),{type:'endNight'});return r;}
// Feature batch B (2026-09-26): late-join waiting screens, the host's waiting list, a free first round,
// "joined round N" standings, Share my moment, the TV "+1 joining" note, and the header sound toggle.
const MORE=['Kai','Leilani','Mika','Noa','Keola','Ikaika','Malia','Kalani','Pua','Makoa','Nalu','Iolana'];
function midParty(round=2,players=4,rounds=9){const r=partyStart(players);r.totalRounds=rounds;finishHouse(r);
 for(let i=0;i<400&&!(r.round===round&&r.phase==='play');i++){const q=id=>r.players.find(p=>p.id===id);
  if(r.phase==='wager'){act(r,q(r.pot.turn),{type:'potBet',move:'match',round:r.round,revision:r.pot.revision,confirmed:true});continue;}
  if(r.phase==='play'){for(const [k,id] of [...r.active].entries())if(r.phase==='play'&&r.submissions[id]===undefined)act(r,q(id),{type:'submit',value:r.game==='number'?String(r.answer+k*11):'Spam musubi',promptVersion:r.promptVersion||0});continue;}
  if(r.phase==='result'){act(r,host(r),{type:'next'});continue;}
  game.advance(r);}
 return r;}
function lateJoin(r,name='Kaimana'){const a=game.join(r.code,name);r.lateToken=a.token;return r;}
function waitingFull(){const r=room({players:6});r.banEnabled=false;r.enabledGames=['brain','number'];for(const n of MORE.slice(6,12))game.join(r.code,n);act(r,host(r),{type:'start'});game.advance(r);lateJoin(r,'Kaimana');return r;}
function freeRound(){const r=midParty(3);lateJoin(r);for(let i=0;i<60&&r.phase!=='result';i++){if(r.phase==='play'){r.active.forEach((id,k)=>{if(r.phase==='play'&&r.submissions[id]===undefined)act(r,r.players.find(p=>p.id===id),{type:'submit',value:String(r.answer+k),promptVersion:r.promptVersion||0});});continue;}if(r.phase==='wager'){act(r,r.players.find(p=>p.id===r.pot.turn),{type:'potBet',move:'match',round:r.round,revision:r.pot.revision,confirmed:true});continue;}game.advance(r);}
 act(r,host(r),{type:'next'});stepTo(r,['wager','reveal']);return r;}
function lateFinal(){const r=awardsNight();r.players[3].joinedRound=3;return r;}
const waiter=r=>({token:r.lateToken});
function paused(){const r=partyStart(4);game.advance(r);act(r,host(r),{type:'pauseRound'});return r;}

const GAMES=['auction','quips','shadow','rhythm','brain','number','draft','draw','imposter'];
const screens=[];
const add=(name,build,opts={})=>screens.push({name,build,...opts});
add('home',()=>null,{url:()=>'/'});
add('dialog-start',()=>null,{url:()=>'/?start=party'});
add('dialog-party-create',()=>null,{url:()=>'/?start=tournament'});
add('dialog-quick-create',()=>null,{url:()=>'/?start=quick'});
add('dialog-join',()=>room(),{url:r=>`/?room=${r.code}&new=1`,seat:false});
add('dialog-help',()=>null,{url:()=>'/',after:`document.querySelector('[data-action=help]')?.click()`});
add('lobby-party',()=>room({players:4}));
add('lobby-party-guest',()=>room({players:4}),{as:1});
add('lobby-quick1v1',()=>room({mode:'minigames',players:2,quick:'hoops',quickGame:'draft'}));
add('lobby-date-night',()=>room({mode:'mixer',players:2}));
for(const id of GAMES){
 add(`${id}-intro`,()=>minigame(id));
 add(`${id}-play`,()=>midPlay(id));
 add(`${id}-result`,()=>result(id));
}
add('shadow-setup',()=>stepTo(minigame('shadow'),['physicalSetup']));
add('rhythm-setup',()=>stepTo(minigame('rhythm'),['physicalSetup']));
add('brain-herd-write',()=>herd(),{asHerd:true});
add('quick1v1-result',()=>quickResult());
add('datenight-level1',()=>dateNight(1));
add('datenight-level2',()=>dateNight(2));
add('datenight-level3',()=>dateNight(3));
add('datenight-check',()=>dateNight(2,'dateCheck'));
add('datenight-finished',()=>dateNight(3,'finished'));
add('final-standings',()=>standings());
add('leave-dialog',()=>room({players:4}),{after:`document.querySelector('[data-action=leave]')?.click()`});
add('lobby-party-adults',()=>{const r=room({players:4});act(r,host(r),{type:'setAudience',audience:'adults'});return r;});
add('lobby-minigames-family',()=>room({mode:'minigames',players:3}));
add('lobby-minigames-guest',()=>room({mode:'minigames',players:3}),{as:1});
add('house-round-reveal',()=>partyStart(4));
add('house-round-play',()=>{const r=partyStart(4);game.advance(r);return r;});
add('house-round-result',()=>{const r=partyStart(4);finishHouse(r);return r;});
add('teach-spin',()=>teach('spin'));
add('teach-wager',()=>teach('wager'));
add('paused-host',()=>paused());
add('final-awards',()=>awardsNight());
add('final-awards-guest',()=>awardsNight(),{as:2});
add('final-awards-minigames',()=>minigamesNight());
add('minigames-result-end-night',()=>result('number'));
add('stats-page',()=>null,{url:()=>'/stats.html'});
add('tv-house-round',()=>partyStart(4),{tv:true});
add('tv-teach-spin',()=>teach('spin'),{tv:true});
add('tv-final-awards',()=>awardsNight(),{tv:true});
add('tv-final-awards-minigames',()=>minigamesNight(),{tv:true});
add('tv-lobby',()=>room({players:4}),{tv:true});
add('tv-reveal',()=>minigame('quips'),{tv:true});
add('tv-result',()=>result('number'),{tv:true});
add('tv-shadow-intro',()=>minigame('shadow'),{tv:true});
add('waiting-next-round',()=>lateJoin(midParty(2)),{who:waiter});
add('waiting-next-game',()=>lateJoin(midParty(8)),{who:waiter});
add('waiting-room-full',()=>waitingFull(),{who:waiter});
add('waiting-minigames',()=>lateJoin(minigame('quips')),{who:waiter});
add('host-waiting-list',()=>lateJoin(midParty(2)));
add('free-first-round',()=>freeRound(),{who:r=>r.players.find(p=>p.freeRound)});
add('lobby-late-join-switch',()=>room({players:4}),{after:`document.querySelector('.more-options').open=true`});
add('final-share-moment-guest',()=>lateFinal(),{as:3});
add('tv-joining-next-round',()=>lateJoin(midParty(2)),{tv:true});
add('header-sound-on',()=>room({players:4}),{init:`try{localStorage.setItem('oops-sound','on')}catch{}`});

// ---------- Chrome over the DevTools protocol ----------
async function launchChrome(){
 const dir=await mkdtemp(path.join(tmpdir(),'ui-check-'));
 const proc=spawn(CHROME,['--headless=new','--remote-debugging-port=0',`--user-data-dir=${dir}`,'--no-first-run','--no-default-browser-check','--disable-gpu','--hide-scrollbars','--mute-audio','--disable-extensions','--force-color-profile=srgb','about:blank'],{stdio:'ignore'});
 let port;for(let i=0;i<100&&!port;i++){await sleep(100);try{port=(await readFile(path.join(dir,'DevToolsActivePort'),'utf8')).split('\n')[0];}catch{}}
 if(!port)throw Error(`Chrome did not start. Set CHROME_PATH (tried ${CHROME}).`);
 const {webSocketDebuggerUrl}=await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
 const ws=new WebSocket(webSocketDebuggerUrl);await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no;});
 let seq=0;const pending=new Map(),listeners=new Set();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const {ok,no}=pending.get(m.id);pending.delete(m.id);m.error?no(Error(m.error.message)):ok(m.result);}else for(const l of listeners)l(m);};
 const send=(method,params={},sessionId)=>new Promise((ok,no)=>{const id=++seq;pending.set(id,{ok,no});ws.send(JSON.stringify({id,method,params,sessionId}));});
 const close=async()=>{try{await send('Browser.close');}catch{}proc.kill();await sleep(200);await rm(dir,{recursive:true,force:true}).catch(()=>{});};
 return {send,listeners,close};
}
async function openPage(cdp){
 const {browserContextId}=await cdp.send('Target.createBrowserContext',{disposeOnDetach:true});
 const {targetId}=await cdp.send('Target.createTarget',{url:'about:blank',browserContextId});
 const {sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true});
 const s=(m,p)=>cdp.send(m,p,sessionId);
 await s('Page.enable');await s('Runtime.enable');
 const errors=[];const onMsg=m=>{if(m.sessionId!==sessionId)return;if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails?.exception?.description||m.params.exceptionDetails?.text);};
 cdp.listeners.add(onMsg);
 const loaded=()=>new Promise(ok=>{const f=m=>{if(m.sessionId===sessionId&&m.method==='Page.loadEventFired'){cdp.listeners.delete(f);ok();}};cdp.listeners.add(f);});
 const evaluate=async expr=>{const r=await s('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 return {s,errors,loaded,evaluate,close:async()=>{cdp.listeners.delete(onMsg);await cdp.send('Target.disposeBrowserContext',{browserContextId}).catch(()=>{});}};
}

// ---------- run ----------
const server=createServer(game);await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin=`http://127.0.0.1:${server.address().port}`;
// Freeze time: no timers advance rooms while pages are open, and client actions are ignored.
game.tick=()=>{};const realAction=game.action.bind(game);let frozen=false;
game.action=function(r,p,a){if(frozen)return;return realAction(r,p,a);};

const only=typeof args.only==='string'?args.only.split(','):null;
const list=screens.filter(sc=>!only||only.some(o=>sc.name.includes(o)));
await mkdir(OUT,{recursive:true});
const built=list.map(sc=>{let r=null;try{r=sc.build();}catch(e){return {...sc,error:e.message};}return {...sc,r};});
frozen=true;
const cdp=await launchChrome();const results=[];
try{
 for(const vp of VIEWPORTS)for(const sc of built){
  const name=`${sc.name}@${vp.id}`;
  if(sc.error){results.push({name,screen:sc.name,viewport:vp.id,issues:[{type:'setup',severity:'warn',text:'',path:'',detail:sc.error}]});continue;}
  const r=sc.r;
  if(r){r.players.forEach(p=>{p.lastSeen=Date.now();p.disconnectedAt=null;});(r.waiting||[]).forEach(w=>{w.lastSeen=Date.now();});if(r.deadline)r.deadline=Date.now()+(r.phase==='reveal'?6000:20000);if(r.revealAt)r.revealAt=Date.now()-60000;}
  const page=await openPage(cdp);
  try{
   await page.s('Emulation.setDeviceMetricsOverride',{width:vp.width,height:vp.height,deviceScaleFactor:vp.scale,mobile:vp.mobile});
   await page.s('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-color-scheme',value:'light'}]});
   let url;
   if(sc.tv)url=`/display.html?room=${r.code}#${r.displayToken}`;
   else if(sc.url)url=sc.url(r);
   else{
    const who=sc.who?sc.who(r):sc.asHerd?r.players.find(p=>p.id===r.herd?.asker)||host(r):sc.as?r.players[sc.as]:host(r);
    const seat=JSON.stringify({code:r.code,token:who.token});
    await page.s('Page.addScriptToEvaluateOnNewDocument',{source:`try{if(location.pathname==='/')sessionStorage.setItem('badbets',${JSON.stringify(seat)});}catch{}${sc.init||''}`});
    url='/';
   }
   const done=page.loaded();await page.s('Page.navigate',{url:origin+url});await Promise.race([done,sleep(8000)]);
   await page.evaluate(`document.fonts.ready.then(()=>true)`);
   await sleep(sc.tv?1600:900);
   if(sc.after){await page.evaluate(sc.after);await sleep(500);}
   // Blur whatever the app auto-focused so focus rings do not show up in screenshots.
   await page.evaluate(`document.activeElement&&document.activeElement!==document.body&&!document.querySelector('dialog[open]')&&document.activeElement.blur(),true`);
   const audit=await page.evaluate(auditSource({logoAccent:'.brand-word b'}));
   const shot=await page.s('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:vp.width,height:audit.modal?vp.height:Math.min(audit.docHeight,6000),scale:1}});
   const file=path.join(OUT,`${name}.png`);await writeFile(file,Buffer.from(shot.data,'base64'));
   const issues=[...audit.issues,...page.errors.map(e=>({type:'js-error',severity:'warn',text:'',path:'',detail:String(e).split('\n')[0]}))];
   const phase=await page.evaluate(`document.querySelector('#app')?.dataset.phase||''`).catch(()=>'');
   results.push({name,screen:sc.name,viewport:vp.id,phase,game:await page.evaluate(`document.body.dataset.game||''`),file:path.relative(here,file),counts:audit.counts,issues});
  }catch(e){results.push({name,screen:sc.name,viewport:vp.id,issues:[{type:'setup',severity:'warn',text:'',path:'',detail:e.message}]});}
  finally{await page.close();}
  process.stdout.write('.');
 }
}finally{await cdp.close();server.close();}
process.stdout.write('\n');

// ---------- report ----------
const sum=summarize(results);
await writeFile(path.join(here,'ui-report.json'),JSON.stringify({when:new Date().toISOString(),summary:sum,results},null,1));
const order=['contrast','overflow','em-dash','tap-target','cramped','overlap','truncated','contrast-image','en-dash','js-error','setup'];
console.log(`\nOops, All In UI check: ${results.length} screens (${list.length} states x ${VIEWPORTS.length} viewports)`);
for(const t of order)if(sum.counts[t])console.log(`  ${t.padEnd(15)} ${sum.counts[t]}${BLOCKING.includes(t)?'  (blocking)':''}`);
const worst=results.filter(r=>r.issues.length);
for(const r of worst){
 const lines=r.issues.filter(i=>i.type!=='en-dash'||args.verbose);if(!lines.length)continue;
 console.log(`\n${r.name}${r.phase?` [${r.phase}${r.game?' / '+r.game:''}]`:''}`);
 for(const i of lines.sort((a,b)=>order.indexOf(a.type)-order.indexOf(b.type)))console.log(`  ${i.type.padEnd(13)} ${i.detail}${i.text?`  "${i.text}"`:''}${i.path?`\n                ${i.path}`:''}`);
}
console.log(`\n${sum.failures?`FAIL: ${sum.failures} contrast/overflow problems`:'PASS: no contrast or overflow failures'}. Report: ui-report.json, screenshots: ${path.relative(here,OUT)||'.'}/`);
process.exit(sum.failures?1:0);
