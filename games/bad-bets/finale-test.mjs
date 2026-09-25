import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game} from './server.mjs';
import {assignPairs,rankPrompts,splitGroups,mainPot,FINALE} from './finale.mjs';
import {gameById} from './public/catalog.js';
const party=(n,rounds=3)=>{const g=new Game(),{code}=g.create('Host'),r=g.rooms.get(code);for(let i=1;i<n;i++)g.join(code,'Player '+i);r.enabledGames=['number'];r.totalRounds=rounds;r.round=rounds-1;g.phase(r,'result');return {g,r,p:r.players};};
const minigame=n=>{const g=new Game(),{code}=g.create('Host','minigames'),r=g.rooms.get(code);for(let i=1;i<n;i++)g.join(code,'Player '+i);g.action(r,r.players[0],{type:'selectGame',game:'finale'});g.action(r,r.players[0],{type:'start'});return {g,r,p:r.players};};
const chips=r=>r.players.reduce((s,p)=>s+p.chips,0);
const by=(r,id)=>r.players.find(p=>p.id===id);
// Drive one finale. skip: players who never act. drawOk: send drawings. vote(voter, entries) picks entries.
function play(g,r,{skip=[],modes=()=>'answer',vote=null}={}){
 const f=()=>r.finale,act=(p,a)=>g.action(r,p,{...a,round:r.round});
 assert.equal(r.phase,'finaleWrite');
 for(const p of r.players)if(!skip.includes(p.id))act(p,{type:'finalePrompt',value:`Prompt by ${p.name}`,mode:modes(p)});
 if(r.phase==='finaleWrite')g.advance(r);
 if(r.phase==='finalePick'){for(const p of r.players){if(skip.includes(p.id))continue;let v;while((v=g.view(r,p).finale.pick)?.pair){assert.ok(v.pair.every(x=>x.key!==f().prompts[p.id].key),'own prompt in pair');act(p,{type:'finalePick',index:v.index,prompt:v.pair[0].key});if(r.phase!=='finalePick')break;}if(r.phase!=='finalePick')break;}}
 if(r.phase==='finalePick')g.advance(r);
 assert.equal(r.phase,'finalePlay');
 for(const p of r.players){if(skip.includes(p.id)||r.phase!=='finalePlay')continue;const mine=g.view(r,p).finale.mine;if(!mine)continue;act(p,{type:'finaleEntry',value:mine.prompt.mode==='draw'?'data:image/png;base64,abc':`Answer from ${p.name}`});}
 if(r.phase==='finalePlay')g.advance(r);
 if(r.phase==='finaleVote'){for(const p of r.players){if(skip.includes(p.id)||r.phase!=='finaleVote')continue;const v=g.view(r,p).finale;const picks=vote?vote(p,v.entries):v.entries.filter(e=>!e.mine).slice(0,v.votesLeft);for(const e of picks)if(r.phase==='finaleVote')act(p,{type:'finaleVote',entry:e.key});}}
 if(r.phase==='finaleVote')g.advance(r);
 assert.equal(r.phase,'result');
}
test('catalog: One More Round tile needs 3 players and never joins the Party wheel',()=>{const g=gameById('finale');assert.equal(g.name,'One More Round');assert.equal(g.min,3);assert.deepEqual(g.formats,[]);const {g:game,r}=party(4);assert.ok(!game.pool(r,true).includes('finale')&&!game.pool(r,false).includes('finale'));});
test('pairs never include your own prompt; k=min(5,available); prompts spread evenly',()=>{for(const n of [3,4,5,6,9,12]){const ids=Array.from({length:n},(_,i)=>'p'+i);for(let t=0;t<20;t++){const pairs=assignPairs(ids);const apps=Object.fromEntries(ids.map(id=>[id,0]));for(const v of ids){const avail=(n-1)*(n-2)/2;assert.equal(pairs[v].length,Math.min(5,avail));assert.ok(pairs[v].every(p=>!p.includes(v)&&p[0]!==p[1]));assert.equal(new Set(pairs[v].map(p=>[...p].sort().join())).size,pairs[v].length);pairs[v].flat().forEach(id=>apps[id]++);}const c=Object.values(apps);assert.ok(Math.max(...c)-Math.min(...c)<=2,`${n}: ${c}`);}}});
test('ranking uses win rate and 3-player cycles break randomly',()=>{const ids=['a','b','c'],pairs={a:[['b','c']],b:[['a','c']],c:[['a','b']]};const tops=new Set();for(let i=0;i<60;i++)tops.add(rankPrompts(ids,pairs,{a:['b'],b:['c'],c:['a']}).order[0]);assert.equal(tops.size,3);const {order}=rankPrompts(ids,pairs,{a:['b'],b:['a'],c:['a']});assert.equal(order[0],'a');});
test('two-prompt split: halves differ by at most one; writers answer the other prompt',()=>{for(const n of [9,10,11,12]){const live=Array.from({length:n},(_,i)=>'p'+i);const [a,b]=splitGroups(live,'p3','p7');assert.ok(Math.abs(a.length-b.length)<=1);assert.ok(!a.includes('p3')&&a.includes('p7')&&b.includes('p3')&&!b.includes('p7'));assert.equal(a.length+b.length,n);}});
test('Party: 2 players keep a normal final round',()=>{const {g,r,p}=party(2);g.action(r,p[0],{type:'next'});assert.notEqual(r.game,'finale');assert.ok(!r.phase.startsWith('finale'));});
test('Party: last round becomes the finale with 3+ players, broke players included; then the game ends',()=>{const {g,r,p}=party(3);p[2].chips=0;p[2].comebackDeclined=true;p[0].chips=150;p[1].chips=150;g.action(r,p[0],{type:'next'});assert.equal(r.phase,'finaleWrite');assert.equal(r.round,3);assert.deepEqual(r.finale.players,p.map(q=>q.id));const before=chips(r);play(g,r);assert.equal(chips(r)-before,r.finale.granted);assert.equal(r.issuedChips,r.finale.granted);g.action(r,p[0],{type:'next'});assert.equal(r.phase,'finished');assert.equal(r.history.at(-1).game,'finale');});
test('3, 4, 6, 9 and 12 player finales complete with non-submitters, ties and conserved chips',()=>{for(const n of [3,4,6,9,12])for(const variant of ['all','skip','tie']){const {g,r,p}=party(n);g.action(r,p[0],{type:'next'});const skip=variant==='skip'?[p[1].id]:[];const before=chips(r);
 play(g,r,{skip,modes:q=>q===p[2]?'draw':'answer',vote:variant==='tie'?((q,entries)=>[]):null});const f=r.finale;
 assert.equal(f.played.length,n>=9?2:1,`${n} played`);if(n>=9){const [a,b]=f.played;assert.ok(!a.group.includes(a.writer)&&!b.group.includes(b.writer));assert.ok(Math.abs(a.group.length-b.group.length)<=1);}else assert.equal(f.played[0].group.length,n);
 if(skip.length)assert.equal(f.prompts[skip[0]].builtin,true);
 const pot=mainPot(n),expected=Object.values(r.result.changes).reduce((a,b)=>a+b,0);assert.equal(chips(r)-before,expected);assert.equal(f.granted,expected);
 if(variant==='tie'){assert.deepEqual(f.winners,[]);assert.equal(f.toilet,null);}
 else{const main=f.winners.reduce((s,id)=>s+f.awards[id].filter(x=>x.why==='main').reduce((a,x)=>a+x.n,0),0);assert.equal(main,f.winners.length?pot:0);}
 for(const w of f.best)assert.ok(!f.prompts[w].builtin);assert.ok(Object.values(r.result.changes).every(n=>Number.isSafeInteger(n)&&n>0));}});
test('payouts: top entry takes 2 x 10 x players, ties split with remainder to the earliest submitter, unique lowest gets the Toilet Bowl, writer gets Best Prompt',()=>{const {g,r,p}=party(4);g.action(r,p[0],{type:'next'});const f=()=>r.finale;
 for(const q of p)g.action(r,q,{type:'finalePrompt',value:'Hello '+q.name,mode:'answer'});g.advance(r);assert.equal(r.phase,'finalePlay');const writer=f().played[0].writer;
 const order=[p[2],p[0],p[1],p[3]];order.forEach(q=>g.action(r,q,{type:'finaleEntry',value:'x '+q.name}));assert.equal(r.phase,'finaleVote');
 const key=q=>f().entries[q.id].key;const before=p.map(q=>q.chips);
 // p2 and p0 tie with 2 votes (p0 votes p2 etc.), p1 gets 0, p3 gets 0: toilet tied, skipped. Use a custom arrangement instead.
 g.action(r,p[0],{type:'finaleVote',entry:key(p[2])});g.action(r,p[1],{type:'finaleVote',entry:key(p[0])});g.action(r,p[2],{type:'finaleVote',entry:key(p[0])});g.action(r,p[3],{type:'finaleVote',entry:key(p[2])});
 assert.equal(r.phase,'result');assert.deepEqual(new Set(f().winners),new Set([p[2].id,p[0].id]));assert.equal(f().toilet,null,'p1 and p3 tie for lowest');
 const gain=p.map((q,i)=>q.chips-before[i]);const bp=id=>id===writer?20:0;assert.equal(gain[2],40+bp(p[2].id));assert.equal(gain[0],40+bp(p[0].id));assert.equal(gain[1],bp(p[1].id));assert.equal(gain[3],bp(p[3].id));
 // Odd split and a unique lowest entry.
 const x=party(3);x.g.action(x.r,x.p[0],{type:'next'});x.g.advance(x.r);x.g.advance(x.r);const F=x.r.finale;[x.p[1],x.p[0],x.p[2]].forEach(q=>x.g.action(x.r,q,{type:'finaleEntry',value:'y'}));const k=q=>F.entries[q.id].key;const b=x.p.map(q=>q.chips);
 x.g.action(x.r,x.p[0],{type:'finaleVote',entry:k(x.p[1])});x.g.action(x.r,x.p[1],{type:'finaleVote',entry:k(x.p[0])});x.g.action(x.r,x.p[2],{type:'finaleVote',entry:k(x.p[0])});
 assert.deepEqual(F.winners,[x.p[0].id]);assert.equal(F.toilet,x.p[2].id);assert.deepEqual(x.p.map((q,i)=>q.chips-b[i]),[60,0,10]);assert.deepEqual(F.best,[],'built-in prompts earn no Best Prompt');
 const y=party(7);y.g.action(y.r,y.p[0],{type:'next'});y.g.advance(y.r);y.g.advance(y.r);const Y=y.r.finale;const [e1,e2,e3]=[y.p[4],y.p[1],y.p[5]];[e1,e2,e3].forEach(q=>y.g.action(y.r,q,{type:'finaleEntry',value:'z'}));y.g.advance(y.r);const b2=y.p.map(q=>q.chips);
 const yk=q=>Y.entries[q.id].key;y.g.action(y.r,y.p[0],{type:'finaleVote',entry:yk(e1)});y.g.action(y.r,y.p[0],{type:'finaleVote',entry:yk(e2)});y.g.action(y.r,y.p[2],{type:'finaleVote',entry:yk(e1)});y.g.action(y.r,y.p[2],{type:'finaleVote',entry:yk(e2)});y.g.advance(y.r);
 assert.equal(mainPot(7),140);const d=y.p.map((q,i)=>q.chips-b2[i]);assert.equal(d[4],70);assert.equal(d[1],70);assert.equal(d[5],10);
 const z=party(4);z.g.action(z.r,z.p[0],{type:'next'});z.g.advance(z.r);z.g.advance(z.r);const Z=z.r.finale;[z.p[3],z.p[1],z.p[2]].forEach(q=>z.g.action(z.r,q,{type:'finaleEntry',value:'w'}));z.g.advance(z.r);const b3=z.p.map(q=>q.chips);const zk=q=>Z.entries[q.id].key;
 z.g.action(z.r,z.p[0],{type:'finaleVote',entry:zk(z.p[3])});z.g.action(z.r,z.p[1],{type:'finaleVote',entry:zk(z.p[2])});z.g.action(z.r,z.p[2],{type:'finaleVote',entry:zk(z.p[1])});z.g.advance(z.r);const dz=z.p.map((q,i)=>q.chips-b3[i]);assert.deepEqual([dz[3],dz[1],dz[2],dz[0]],[28,26,26,0],'80 split 3 ways, remainder to the earliest submitter');assert.equal(Z.toilet,null);
});
test('Minigames: One More Round awards without chips, replays, and needs 3 players',()=>{const {g,r,p}=minigame(4);assert.equal(r.phase,'finaleWrite');const before=p.map(q=>q.chips);play(g,r);assert.deepEqual(p.map(q=>q.chips),before);assert.deepEqual(r.result.changes,{});assert.ok(r.finale.awards);g.action(r,p[0],{type:'replay'});assert.equal(r.phase,'finaleWrite');
 const two=new Game(),a=two.create('A','minigames'),rr=two.rooms.get(a.code);two.join(a.code,'B');assert.throws(()=>two.action(rr,rr.players[0],{type:'selectGame',game:'finale'}));});
test('validation: prompt length, mode, own-vote, vote quota, stale pair and late joiners',()=>{const {g,r,p}=party(6);g.action(r,p[0],{type:'next'});
 assert.throws(()=>g.action(r,p[0],{type:'finalePrompt',value:'x'.repeat(91),mode:'answer'}),/90/);assert.throws(()=>g.action(r,p[0],{type:'finalePrompt',value:'ok',mode:'sing'}));assert.throws(()=>g.action(r,p[0],{type:'finalePrompt',value:'   ',mode:'answer'}));
 g.action(r,p[0],{type:'finalePrompt',value:'x'.repeat(90),mode:'draw'});assert.throws(()=>g.action(r,p[0],{type:'finalePrompt',value:'again',mode:'answer'}));g.advance(r);
 const v=g.view(r,p[1]).finale.pick;assert.equal(v.count,5);assert.throws(()=>g.action(r,p[1],{type:'finalePick',index:v.index+1,prompt:v.pair[0].key}));assert.throws(()=>g.action(r,p[1],{type:'finalePick',index:v.index,prompt:'nope'}));g.advance(r);
 const mode=r.finale.prompts[r.finale.played[0].writer].mode;assert.throws(()=>g.action(r,p[0],{type:'finaleEntry',value:mode==='draw'?'hello':'x'.repeat(141)}));
 for(const q of p)g.action(r,q,{type:'finaleEntry',value:mode==='draw'?'data:image/png;base64,abc':'answer'});assert.equal(r.phase,'finaleVote');const V=g.view(r,p[0]).finale;assert.equal(V.votesLeft,2);const mine=V.entries.find(e=>e.mine),other=V.entries.filter(e=>!e.mine);
 assert.throws(()=>g.action(r,p[0],{type:'finaleVote',entry:mine.key}),/own/);g.action(r,p[0],{type:'finaleVote',entry:other[0].key});assert.throws(()=>g.action(r,p[0],{type:'finaleVote',entry:other[0].key}));g.action(r,p[0],{type:'finaleVote',entry:other[1].key});assert.throws(()=>g.action(r,p[0],{type:'finaleVote',entry:other[2].key}),/locked/);assert.equal(g.view(r,p[0]).finale.votesLeft,0);});
test('privacy: views never leak prompt authors, pair votes or answers before the reveal; nothing is rated',()=>{const {g,r,p}=party(4);let rated=0;g.onRate=()=>rated++;g.action(r,p[0],{type:'next'});
 g.action(r,p[1],{type:'finalePrompt',value:'SECRET PROMPT ONE',mode:'answer'});const w=JSON.stringify(g.view(r,p[0]))+JSON.stringify(g.publicView(r));assert.ok(!w.includes('SECRET PROMPT ONE'));assert.equal(g.view(r,p[1]).finale.mine.text,'SECRET PROMPT ONE');
 g.advance(r);for(const q of p){const s=JSON.stringify(g.view(r,q).finale);for(const other of p)assert.ok(!s.includes(other.id)||other.id===q.id,'player id in pick view');}
 const pv=JSON.stringify(g.publicView(r).finale);assert.ok(!p.some(q=>pv.includes(q.id)));const v=g.view(r,p[0]).finale.pick;g.action(r,p[0],{type:'finalePick',index:v.index,prompt:v.pair[0].key});
 for(const q of p.slice(1))assert.ok(!JSON.stringify(g.view(r,q).finale).includes(p[0].id));g.advance(r);
 const writer=r.finale.played[0].writer;for(const q of p){const s=JSON.stringify(g.view(r,q).finale);assert.ok(!s.includes(writer)||writer===q.id);}
 g.action(r,p[2],{type:'finaleEntry',value:'HIDDEN ANSWER'});for(const q of [p[0],p[1],p[3]])assert.ok(!JSON.stringify(g.view(r,q)).includes('HIDDEN ANSWER'));assert.ok(!JSON.stringify(g.publicView(r)).includes('HIDDEN ANSWER'));
 g.advance(r);const tv=g.publicView(r);assert.ok(tv.finale.entries.some(e=>e.value==='HIDDEN ANSWER'));assert.ok(!JSON.stringify(tv.finale).includes(p[2].id));
 g.advance(r);assert.equal(r.phase,'result');const rv=g.view(r,p[0]).finale.reveal;assert.equal(rv.entries[0].player,p[2].id);assert.equal(g.view(r,p[0]).rating,null);assert.throws(()=>g.action(r,p[0],{type:'rate',vote:'fire'}));assert.equal(rated,0);});
test('a player leaving mid-finale does not stall it',()=>{const {g,r,p}=party(4);g.action(r,p[0],{type:'next'});for(const q of p.slice(0,3))g.action(r,q,{type:'finalePrompt',value:'Hi',mode:'answer'});g.action(r,p[3],{type:'leave',round:r.round});assert.equal(r.phase,'finalePick');});
test('TV display: friendly finale screens, no names before results, awards after',async()=>{const {render}=await import('./public/display.js');const {g,r,p}=party(4);g.action(r,p[0],{type:'next'});g.action(r,p[1],{type:'finalePrompt',value:'Draw a sad robot',mode:'draw'});
 let html=render(g.publicView(r)).html;assert.match(html,/1 of 4 prompts in/);assert.ok(!html.includes('Draw a sad robot'));assert.ok(!/\u2014/.test(html));
 g.advance(r);html=render(g.publicView(r)).html;assert.match(html,/Picking the best prompt/);g.advance(r);html=render(g.publicView(r)).html;assert.match(html,/of 4 sent/);
 for(const q of p){const m=g.view(r,q).finale.mine;g.action(r,q,{type:'finaleEntry',value:m.prompt.mode==='draw'?'data:image/png;base64,abc':'Funny '+q.name});}
 html=render(g.publicView(r)).html;assert.match(html,/Vote on your phones/);for(const q of p.slice(1))assert.ok(!html.includes('<span>'+q.name+'</span>'),'no names in vote');
 g.advance(r);html=render(g.publicView(r)).html;assert.match(html,/One More Round/);assert.ok(r.finale.toilet?html.includes('Toilet Bowl'):true);if(r.finale.best.length)assert.match(html,/Best Prompt/);});
