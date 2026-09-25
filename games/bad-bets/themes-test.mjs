import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game} from './server.mjs';
import {DRAFT_THEMES,AUCTION_THEMES} from './theme-content.mjs';
import {themeIds,themeOptions,getTheme,slotName} from './themes.mjs';
import {weightFromCounts,weightedOrder,itemWeight,setGlobalCounts,clearGlobalCounts,refreshCounts,countsStale,moodFactor,recordMood,packOf,promptId,promptText,resetLocalCounts} from './ratings.mjs';
import {pool,draw,PACK_IDS} from './packs.mjs';
import {cloudRequest,warmCounts} from './cloud-game.mjs';
import {drawFrom} from './bags.mjs';

// Test-only themes, added under ids the content agent will not use, so the tests work with empty or full content.
const TD={name:'Test Heist',blurb:'Test',icon:'theme-zz-test',slots:[{id:'a',label:'a driver'},{id:'b',label:'a hacker'},{id:'c',label:'a lookout'},{id:'d',label:'an inside person'},{id:'e',label:'a getaway car'}],cards:Object.fromEntries(['a','b','c','d','e'].map(k=>[k,Array.from({length:16},(_,i)=>`${k.toUpperCase()} card ${i}`)])),prompts:['Build the test crew','Build the other test crew']};
const TA={name:'Test Trip',blurb:'Test',icon:'theme-zz-test',slots:[{id:'x',label:'a place'},{id:'y',label:'a ride'},{id:'z',label:'a snack'},{id:'w',label:'a souvenir'}],lots:Array.from({length:20},(_,i)=>`Lot ${i}`),nameItem:false,itemPrompt:'',prompts:['Pitch the test trip']};
DRAFT_THEMES['zz-test']=TD;AUCTION_THEMES['zz-test']=TA;AUCTION_THEMES['zz-named']={...TA,name:'Named',nameItem:true,itemPrompt:'What do you take from {lot}?'};
DRAFT_THEMES['zz-broken']={name:'Broken',slots:[]};

const setup=(n,game,themes)=>{const g=new Game(),a=g.create('Host','minigames'),r=g.rooms.get(a.code);for(let i=1;i<n;i++)g.join(a.code,'Guest '+i);const p=r.players;for(const [k,v] of Object.entries(themes||{}))g.action(r,p[0],{type:'setTheme',game:k,theme:v});r.selectedGame=game;g.action(r,p[0],{type:'start'});g.begin(r);return {g,r,p};};
const auction=(g,r,p,a)=>g.action(r,p,{...a,revision:r.auction.revision});

test('game names: Imposter, Fantasy Draft, Bidding War with ids unchanged',async()=>{const {GAMES}=await import('./public/catalog.js');const by=Object.fromEntries(GAMES.map(g=>[g.id,g.name]));assert.equal(by.imposter,'Imposter');assert.equal(by.draft,'Fantasy Draft');assert.equal(by.auction,'Bidding War');assert.equal(JSON.stringify(GAMES).includes('Faking'),false);});

test('rooms default to random themes; host sets valid themes only in the lobby (older rooms)',()=>{const g=new Game(),a=g.create('Host'),r=g.rooms.get(a.code);g.join(a.code,'B');const [h,b]=r.players;assert.deepEqual(r.themes,{draft:'random',auction:'random'});
 const v=g.view(r,h);assert.deepEqual(v.themes,{draft:'random',auction:'random'});assert.ok(v.themeOptions.draft.some(o=>o.id==='zz-test'));assert.equal(v.themeOptions.draft[0].icon,'/art/theme-food-draft.svg');
 assert.throws(()=>g.action(r,b,{type:'setTheme',game:'draft',theme:'zz-test'}),/host/);assert.throws(()=>g.action(r,h,{type:'setTheme',game:'draft',theme:'nope'}),/theme/);assert.throws(()=>g.action(r,h,{type:'setTheme',game:'draft',theme:'zz-broken'}),/theme/);assert.throws(()=>g.action(r,h,{type:'setTheme',game:'brain',theme:'food'}));assert.throws(()=>g.action(r,h,{type:'setTheme',game:'draft',theme:'__proto__'}));
 g.action(r,h,{type:'setTheme',game:'auction',theme:'zz-test'});assert.deepEqual(r.themes,{draft:'random',auction:'zz-test'});assert.ok(!themeIds('draft').includes('zz-broken'));});

test('food theme keeps the original draft and auction',()=>{let {g,r}=setup(4,'draft',{draft:'food'});assert.equal(g.view(r,r.players[0]).theme.id,'food');assert.deepEqual(r.cards.slice(0,2),['Big Mac','Crunchwrap']);while(r.phase==='draft')g.advance(r);assert.ok(r.active.every(id=>r.picks[id].length===4));
 ({g,r}=setup(2,'auction',{auction:'food'}));assert.equal(r.auction.food,true);assert.equal(r.auction.slotCount,4);});

test('themed draft uses theme slots, cards and prompts; five slots means five rounds',()=>{const {g,r,p}=setup(8,'draft',{draft:'zz-test'});assert.ok(TD.prompts.includes(r.prompt));const v=g.view(r,p[0]);assert.equal(v.theme.name,'Test Heist');assert.equal(v.theme.icon,'/art/theme-zz-test.svg');assert.deepEqual(v.theme.slots,['Driver','Hacker','Lookout','Inside person','Getaway car']);
 assert.ok(r.cards.length>=8&&r.cards.every(c=>c.startsWith('A card')));assert.equal(new Set(r.cards).size,r.cards.length);const turns=[];while(r.phase==='draft'){turns.push(g.draftPlayer(r));g.advance(r);}assert.equal(turns.length,40);assert.deepEqual(turns.slice(8,16),[...turns.slice(0,8)].reverse());assert.equal(r.phase,'pitch');assert.ok(r.active.every(id=>r.picks[id].length===5&&r.picks[id][4].startsWith('E card')));});

test('themed auction without naming fills slots directly and never uses restaurants',()=>{for(const n of [2,4,8]){const {g,r,p}=setup(n,'auction',{auction:'zz-test'});assert.equal(r.auction.food,false);assert.equal(r.auction.icon,'/art/theme-zz-test.svg');let moves=0;while(r.phase==='auction'){assert.ok(moves++<200);const a=r.auction;assert.equal(a.pending.length,0);if(moves%3===0&&a.bid+1<=a.budgets[a.turn]-(a.slotCount-1-a.slot))auction(g,r,p.find(q=>q.id===a.turn),{type:'auctionRaise'});else auction(g,r,p.find(q=>q.id===a.turn),{type:'auctionPass'});}
 assert.equal(r.phase,'pitch');assert.ok(r.active.every(id=>r.picks[id].length===4));assert.match(r.picks[r.active[0]][0],/^Place: Lot \d+$/);assert.ok(Object.values(r.auction.budgets).every(b=>b>=0));}});

test('themed auction with naming uses the item prompt',()=>{const {g,r,p}=setup(2,'auction',{auction:'zz-named'});const a=r.auction;const q=p.find(x=>x.id===a.turn),o=p.find(x=>x!==q);auction(g,r,q,{type:'auctionRaise'});auction(g,r,o,{type:'auctionPass'});assert.equal(a.pending[0].player,q.id);auction(g,r,q,{type:'auctionItem',value:'Sunglasses'});assert.match(r.picks[q.id][0],/^Place: Sunglasses \(Lot \d+\)$/);});

test('themed lots do not repeat within a bag cycle',()=>{const t=getTheme('auction','zz-test');const room={};const seen=new Set();for(let i=0;i<20;i++)seen.add(drawFrom(room,`auction:${t.id}:lots`,t.lots));assert.equal(seen.size,20);});

test('theme options work with empty content',()=>{const o=themeOptions();assert.equal(o.draft[0].id,'food');assert.equal(o.auction[0].id,'food');assert.equal(slotName('an inside person'),'Inside person');});

// ---------- R9 room-tuned prompts ----------
test('weight formula: unrated 1.0, loved near 1.65, hated near 0.35, never zero',()=>{assert.equal(weightFromCounts(undefined),1);assert.equal(weightFromCounts({fire:0,meh:0}),1);assert.ok(Math.abs(weightFromCounts({fire:1000,meh:0})-1.65)<0.01);assert.ok(Math.abs(weightFromCounts({fire:0,meh:1000})-0.35)<0.01);assert.ok(weightFromCounts({fire:0,meh:1e9})>0.35);assert.equal(weightFromCounts({fire:3,meh:1}),0.35+1.3*(4/6));});

test('weighted order keeps every item once and favours high weights (seeded)',()=>{let seed=42;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};const w=[1.65,1,1,1,0.35];let firstHigh=0,firstLow=0,posHigh=0,posLow=0;const N=4000;
 for(let i=0;i<N;i++){const q=weightedOrder(w,rand);assert.deepEqual([...q].sort(),[0,1,2,3,4]);const order=[...q].reverse();if(order[0]===0)firstHigh++;if(order[0]===4)firstLow++;posHigh+=order.indexOf(0);posLow+=order.indexOf(4);}
 assert.ok(firstHigh>firstLow*3,`${firstHigh} vs ${firstLow}`);assert.ok(posHigh/N<posLow/N-1);assert.ok(firstHigh/N>0.28&&firstHigh/N<0.45);});

test('draws use global counts; every prompt still appears once per cycle',()=>{const items=pool('brain',[],[]);const loved=promptId('brain',promptText('brain',items[0]));const hated=promptId('brain',promptText('brain',items[1]));setGlobalCounts({[loved]:{fire:500,meh:0},[hated]:{fire:0,meh:500}});
 try{let earlyLoved=0,earlyHated=0;for(let t=0;t<300;t++){const r={packs:[],custom:[]};const seq=Array.from({length:items.length},()=>draw(r,'brain'));assert.equal(new Set(seq).size,items.length);const k=Math.floor(items.length/4);if(seq.slice(0,k).includes(items[0]))earlyLoved++;if(seq.slice(0,k).includes(items[1]))earlyHated++;}assert.ok(earlyLoved>earlyHated*2,`${earlyLoved} vs ${earlyHated}`);}
 finally{clearGlobalCounts();}});

test('unrated and custom prompts weigh 1.0; weighting failures fall back to plain draws',()=>{resetLocalCounts();const item=pool('brain',[],[])[0];assert.equal(itemWeight('brain',item,null),1);assert.equal(itemWeight('brain',{bad:true},null),1);
 const r={packs:[],custom:[{by:'x',type:'brain',text:'Totally custom question?'}]};const n=pool('brain',[],r.custom).length;const seq=Array.from({length:n},()=>draw(r,'brain'));assert.equal(new Set(seq).size,n);});

test('room mood: counts per pack only, 0.6 when meh leads by 2+, 1.25 when fire leads by 2+',()=>{assert.equal(moodFactor(undefined),1);assert.equal(moodFactor({fire:0,meh:2}),0.6);assert.equal(moodFactor({fire:0,meh:1}),1);assert.equal(moodFactor({fire:3,meh:1}),1.25);
 const pack=PACK_IDS.find(id=>pool('brain',[id],[]).length>pool('brain',[],[]).length);const item=pool('brain',[pack],[]).at(-1);const id=promptId('brain',promptText('brain',item));assert.equal(packOf(id),pack);
 const r={};recordMood(r,id,'meh');recordMood(r,id,'meh');recordMood(r,id,'meh');assert.deepEqual(r.mood,{[pack]:{fire:0,meh:3}});assert.ok(Math.abs(itemWeight('brain',item,r.mood)-0.6)<1e-9);recordMood(r,'brain-00000000','fire');recordMood(r,id,'bogus');assert.deepEqual(Object.keys(r.mood),[pack]);});

test('rating in a room updates mood without player ids and rebuilds only on refill',()=>{const g=new Game(),a=g.create('Host','minigames'),r=g.rooms.get(a.code);g.join(a.code,'B');g.join(a.code,'C');r.selectedGame='brain';g.action(r,r.players[0],{type:'start'});g.begin(r);r.players.forEach(p=>g.action(r,p,{type:'submit',value:'same'}));assert.equal(r.phase,'result');const q=[...r.bags.brain.q];
 r.players.forEach(p=>g.action(r,p,{type:'rate',vote:'meh'}));const packs=Object.keys(r.mood);assert.equal(packs.length,1);assert.deepEqual(r.mood[packs[0]],{fire:0,meh:3});const text=JSON.stringify(r.mood);assert.ok(r.players.every(p=>!text.includes(p.id)&&!text.includes(p.name)));assert.deepEqual(r.bags.brain.q,q);});

test('counts cache: refresh when stale, silent fallback on failure or hang',async()=>{clearGlobalCounts();assert.equal(countsStale(),true);assert.equal(await refreshCounts(()=>{throw Error('down');}),false);assert.equal(countsStale(),false);
 clearGlobalCounts();const t0=Date.now();assert.equal(await refreshCounts(()=>new Promise(()=>{}),50),false);assert.ok(Date.now()-t0<500);
 clearGlobalCounts();assert.equal(await refreshCounts(()=>['brain-0000abcd:fire','4','junk','x'],300),true);assert.equal(countsStale(),false);assert.equal(await refreshCounts(()=>{throw Error('not called');}),false);clearGlobalCounts();});

test('cloud actions still work when the counts store fails',async()=>{clearGlobalCounts();const data=new Map();const store={get:async k=>data.get(k)||null,compareAndSwap:async(k,b,a)=>{if((data.get(k)||null)!==(b||null))return false;data.set(k,a);return true;},ratings:async()=>{throw Error('storage down');}};
 const host=await cloudRequest(store,{type:'create',name:'Host'});const out=await cloudRequest(store,{type:'join',code:host.code,name:'Guest'});assert.ok(out.token);await warmCounts({ratings:()=>new Promise(()=>{})},30);clearGlobalCounts();});

// ---------- random themes with a veto ----------
import {rollTheme,VETO_MS} from './themes.mjs';
import {localCounts} from './ratings.mjs';
const vroom=(n,game,mode='minigames')=>{const g=new Game(),a=g.create('Host',mode),r=g.rooms.get(a.code);for(let i=1;i<n;i++)g.join(a.code,'Guest '+i);r.selectedGame=game;r.enabledGames=[game];r.banEnabled=false;return {g,r,p:r.players};};
test('random theme selection rotates through every theme before repeating',()=>{for(const game of ['draft','auction']){const r={bags:{},themes:{[game]:'random'}};const ids=themeIds(game);const seen=ids.map(()=>rollTheme(r,game));assert.deepEqual([...seen].sort(),[...ids].sort());assert.ok(ids.includes('food'));}});
test('a round rolls a theme and offers a veto in the reveal',()=>{const {g,r,p}=vroom(4,'draft');g.action(r,p[0],{type:'start'});assert.equal(r.phase,'reveal');assert.ok(themeIds('draft').includes(r.roundTheme));const v=g.view(r,p[1]);assert.equal(v.veto.open,true);assert.equal(v.veto.left,true);assert.ok(v.veto.until>Date.now());assert.equal(g.publicView(r).veto,null);assert.throws(()=>g.action(r,p[0],{type:'beginGame'}),/veto timer/);});
test('the first veto rerolls once to a different theme, and counts it anonymously',()=>{const {g,r,p}=vroom(4,'auction');g.action(r,p[0],{type:'start'});const from=r.roundTheme;const before=localCounts()[`theme-auction-${from}`]?.veto||0;
 g.action(r,p[1],{type:'veto'});assert.notEqual(r.roundTheme,from);assert.equal(r.auction.theme,r.roundTheme);assert.equal(localCounts()[`theme-auction-${from}`].veto,before+1);
 const v=g.view(r,p[2]);assert.equal(v.veto.done,true);assert.equal(v.veto.by,'Guest 1');assert.equal(v.veto.open,false);
 assert.throws(()=>g.action(r,p[2],{type:'veto'}),/already vetoed/);assert.deepEqual(r.vetoUsed,[p[1].id]);
 const tv=g.publicView(r);assert.deepEqual(Object.keys(tv.veto).sort(),['done','from']);assert.equal(JSON.stringify(tv).includes('vetoUsed'),false);});
test('each player gets one veto per session',()=>{const {g,r,p}=vroom(4,'draft');g.action(r,p[0],{type:'start'});g.action(r,p[1],{type:'veto'});assert.equal(r.draftStep,0);assert.ok(r.active.every(id=>Array.isArray(r.picks[id])&&!r.picks[id].length));
 g.begin(r);while(r.phase==='draft')g.advance(r);g.settle(r);g.action(r,p[0],{type:'replay'});assert.equal(r.phase,'reveal');assert.equal(g.view(r,p[1]).veto.left,false);assert.equal(g.view(r,p[2]).veto.left,true);
 assert.throws(()=>g.action(r,p[1],{type:'veto'}),/already used/);g.action(r,p[2],{type:'veto'});assert.deepEqual(r.vetoUsed,[p[1].id,p[2].id]);});
test('the veto closes after the window and in other phases',()=>{const {g,r,p}=vroom(4,'draft');g.action(r,p[0],{type:'start'});r.revealAt=Date.now()-VETO_MS-1;assert.throws(()=>g.action(r,p[1],{type:'veto'}),/closed/);g.action(r,p[0],{type:'beginGame'});assert.throws(()=>g.action(r,p[1],{type:'veto'}));});
test('party mode: veto happens inside the 15 second reveal without extending it',()=>{let g,r,p;for(let i=0;i<200;i++){({g,r,p}=vroom(5,'draft','tournament'));r.enabledGames=['draft','auction','number'];g.action(r,p[0],{type:'start'});r.pot=null;g.fresh(r);r.pot=null;g.fresh(r);if(['draft','auction'].includes(r.game))break;}assert.ok(['draft','auction'].includes(r.game));let guard=0;while(r.phase!=='reveal'&&guard++<60){if(r.phase==='wager'){const q=p.find(x=>x.id===r.pot.turn);g.action(r,q,{type:'potBet',move:'match',round:r.round,revision:r.pot.revision});}else g.advance(r);}
 assert.equal(r.phase,'reveal');
 const deadline=r.deadline;g.action(r,p[3],{type:'veto'});assert.equal(r.deadline,deadline);assert.ok(r.deadline-r.revealAt<=15000);});
test('food is still the safe default when theme content is missing',()=>{const r={bags:{},themes:{draft:'random'}};const saved={...DRAFT_THEMES};for(const k of Object.keys(DRAFT_THEMES))delete DRAFT_THEMES[k];try{assert.deepEqual(themeIds('draft'),['food']);for(let i=0;i<3;i++)assert.equal(rollTheme(r,'draft'),'food');const {g,r:room,p}=vroom(4,'draft');g.action(room,p[0],{type:'start'});assert.equal(room.roundTheme,'food');assert.throws(()=>g.action(room,p[1],{type:'veto'}),/no other theme/);assert.deepEqual(room.vetoUsed||[],[]);}finally{Object.assign(DRAFT_THEMES,saved);}});
test('player themes: hoops and bench always, others by players:true',()=>{assert.equal(getTheme('draft','food').players,false);for(const id of ['hoops','bench'])if(themeIds('draft').includes(id))assert.equal(getTheme('draft',id).players,true);DRAFT_THEMES['zz-players']={...TD,players:true};try{assert.equal(getTheme('draft','zz-players').players,true);assert.equal(getTheme('draft','zz-test').players,false);}finally{delete DRAFT_THEMES['zz-players'];}});

// ---------- card art ----------
import {readFileSync,existsSync} from 'node:fs';
const PLAYERS=JSON.parse(readFileSync(new URL('./public/players/players.json',import.meta.url)));
const PROPS=JSON.parse(readFileSync(new URL('./public/art/props/props-map.json',import.meta.url)));
test('card art: headshots, jersey fallback, props, and food logos kept',async()=>{const m=await import('./public/card-art.js');m.setCardArtData(PLAYERS,PROPS);
 const hoops={game:'draft',theme:{id:'hoops',players:true,slotIds:['guard']}};const named=Object.keys(PLAYERS).find(k=>!k.startsWith('_'));
 assert.match(m.cardLabel(hoops,named,0),/class="card-art headshot".*src="\/players\/[a-z0-9-]+\.jpg".*loading="lazy" decoding="async"/);
 const missing=PLAYERS._missing[0];const j=m.cardLabel(hoops,missing,0);assert.match(j,/jersey/);assert.ok(j.includes(`>${m.initials(missing)}<`));assert.ok(['#087F98','#e05a47','#3b6fd6','#F4CD72','#BAB4EA'].includes(m.jerseyColor(missing)));assert.equal(m.jerseyColor(missing),m.jerseyColor(missing));
 assert.match(m.cardLabel({game:'auction',theme:{id:'nfl',players:true},auction:{nameItem:false}},'Guard: Nobody Real',0),/jersey/);
 const key=Object.keys(PROPS).find(k=>k.startsWith('heist/lots/'));const lot=key.split('/').slice(2).join('/');
 assert.ok(m.lotArt({game:'auction',theme:{id:'heist'}},lot).includes(`/art/props/${PROPS[key]}.svg`));
 assert.ok(m.cardLabel({game:'auction',theme:{id:'heist'},auction:{nameItem:false}},`Van: ${lot}`,0).includes(`/art/props/${PROPS[key]}.svg`));
 assert.ok(m.cardLabel({game:'draft',theme:{id:'food',food:true}},'Big Mac',0).includes('/art/props/'));
 assert.ok(m.cardLabel({game:'draft',theme:{id:'heist',slotIds:['x']}},'Not a card',0).includes('/art/props/mystery.svg'));
 assert.equal(m.lotArt({game:'auction',theme:{id:'food',food:true}},'Taco Bell'),'');assert.match(m.cardLabel({game:'auction',theme:{id:'food',food:true}},'Main: Tacos (Taco Bell)',0),/logos\/taco-bell/);
 for(const f of new Set(Object.values(PROPS).filter(v=>typeof v==='string')))assert.ok(existsSync(new URL(`./public/art/props/${f}.svg`,import.meta.url)),f);});
test('credits list every headshot with license and source links',async()=>{const {creditsHtml}=await import('./public/credits.js');const html=creditsHtml(PLAYERS);const n=Object.keys(PLAYERS).filter(k=>!k.startsWith('_')).length;assert.equal((html.match(/<li>/g)||[]).length,n);assert.ok(html.includes('Source</a>'));assert.ok(html.includes('creativecommons.org'));});
test('server serves headshots, props, maps, credits and font licenses',async()=>{const {createServer}=await import('./server.mjs');const srv=createServer();await new Promise(r=>srv.listen(0,r));const base=`http://localhost:${srv.address().port}`;try{
 const file=Object.values(PLAYERS).find(v=>v&&v.file)?.file;for(const [path,type] of [[file,'image/jpeg'],['/art/props/mystery.svg','image/svg+xml'],['/players/players.json','application/json'],['/art/props/props-map.json','application/json'],['/credits.html','text/html'],['/credits.js','text/javascript'],['/card-art.js','text/javascript'],['/fonts/OFL-Baloo-2.txt','text/plain; charset=utf-8']]){const r=await fetch(base+path);assert.equal(r.status,200,path);assert.equal(r.headers.get('content-type'),type);await r.arrayBuffer();}
 assert.equal((await fetch(base+'/players/../server.mjs')).status,404);}finally{srv.close();}});
