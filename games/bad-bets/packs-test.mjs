import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game} from './server.mjs';
import {pool,draw,packOptions,validatePacks,brain,nums,secrets,CUSTOM_LIMIT} from './packs.mjs';
import {BALLPARK_CORE,CORE_EXTRA,PACKS} from './pack-content.mjs';
import {quips} from './creative.mjs';
import {categories} from './physical.mjs';
const lobby=(n=3)=>{const g=new Game(),a=g.create('Host','minigames'),r=g.rooms.get(a.code);for(let i=1;i<n;i++)g.join(a.code,'Guest '+i);return {g,r,p:r.players};};
// Temporarily add content to the shared pack objects, then restore them.
const withContent=(fn)=>{const saved={extra:CORE_EXTRA.brain.length,sports:PACKS.sports.brain.length,faker:PACKS.pop.faker.length,num:PACKS.sports.number.length,core:BALLPARK_CORE.length};
 CORE_EXTRA.brain.push('Core extra question?');PACKS.sports.brain.push('Best mascot?','  ','Best mascot?');PACKS.pop.faker.push(['Singers','Madonna']);PACKS.sports.number.push(['How many players on a hockey team on ice?',6,'https://example.com']);BALLPARK_CORE.push(['How many strings on a guitar?',6,'https://example.com']);
 try{fn();}finally{CORE_EXTRA.brain.length=saved.extra;PACKS.sports.brain.length=saved.sports;PACKS.pop.faker.length=saved.faker;PACKS.sports.number.length=saved.num;BALLPARK_CORE.length=saved.core;}};

test('pack pools: core only by default, packs add items, bad and duplicate items dropped',()=>withContent(()=>{
 const core=pool('brain',[]);assert.ok(brain.every(q=>core.includes(q)));assert.ok(core.includes('Core extra question?'));assert.ok(!core.includes('Best mascot?'));
 const sports=pool('brain',['sports']);assert.equal(sports.filter(q=>q==='Best mascot?').length,1);assert.ok(sports.length>core.length);assert.ok(core.every(q=>sports.includes(q)));
 assert.deepEqual(pool('faker',['pop']).at(-1),['Madonna','Singers']);assert.equal(pool('faker',[]).length,secrets.length+CORE_EXTRA.faker.length);
 const ball=pool('number',[]);assert.ok(ball.some(x=>x[0]==='How many strings on a guitar?'&&x[1]===6));assert.ok(ball.every(x=>x.length===2));assert.ok(!ball.some(x=>x[0]===nums[0][0]));
 assert.ok(pool('number',['sports']).some(x=>x[0].startsWith('How many players')));
 const opts=packOptions();assert.ok(opts.some(o=>o.id==='sports'&&o.count>=2));assert.ok(opts.every(o=>o.count>0));
}));
test('empty packs keep the old Ballpark list and hide from the lobby',()=>{if(!BALLPARK_CORE.length)assert.deepEqual(pool('number',[]),nums);for(const o of packOptions())assert.ok(o.count>0);assert.deepEqual(pool('brain',['spicy','family']).slice(0,brain.length),brain);});
test('bags never repeat until exhausted and do not repeat across a reshuffle',()=>{for(let t=0;t<30;t++){const r={};const n=pool('quips',[]).length;const a=Array.from({length:n},()=>draw(r,'quips'));assert.equal(new Set(a).size,n);const b=draw(r,'quips');assert.notEqual(b,a.at(-1));assert.ok(JSON.stringify(r.bags).length<n*4+80);}});
test('Bad Answers skip and Keep It Going random pick never repeat within a bag',()=>{
 const g=new Game(),a=g.create('Host','minigames'),r=g.rooms.get(a.code);g.join(a.code,'B');g.join(a.code,'C');g.join(a.code,'D');r.selectedGame='quips';g.action(r,r.players[0],{type:'start'});g.begin(r);
 const seen=[r.prompt];for(let i=1;i<quips.length;i++){g.action(r,r.players[0],{type:'skipPrompt'});seen.push(r.prompt);}assert.equal(new Set(seen).size,quips.length);
 const x=lobby(2);x.r.selectedGame='rhythm';x.g.action(x.r,x.p[0],{type:'start'});x.g.begin(x.r);assert.equal(x.r.phase,'physicalSetup');
 const cats=[];for(let i=0;i<categories.length;i++){x.g.action(x.r,x.p[0],{type:'physicalCategory',random:true,revision:x.r.physical.revision});cats.push(x.r.physical.category);}assert.equal(new Set(cats).size,categories.length);});
test('host picks packs; ids are validated server side and bags rebuild',()=>{const {g,r,p}=lobby();draw(r,'brain');assert.ok(r.bags.brain);
 assert.throws(()=>g.action(r,p[1],{type:'setPacks',packs:['sports']}),/host/);assert.throws(()=>g.action(r,p[0],{type:'setPacks',packs:['nope']}),/Unknown/);assert.throws(()=>g.action(r,p[0],{type:'setPacks',packs:'sports'}));assert.throws(()=>g.action(r,p[0],{type:'setPacks',packs:['__proto__']}));
 g.action(r,p[0],{type:'setPacks',packs:['spicy','sports','sports']});assert.deepEqual(r.packs,['sports','spicy']);assert.deepEqual(r.bags,{});assert.deepEqual(g.view(r,p[1]).packs,['sports','spicy']);
 assert.deepEqual(validatePacks([]),[]);});
test('custom prompts: limits, validation, removal by author only',()=>{const {g,r,p}=lobby();const add=(q,kind,value,category)=>g.action(r,q,{type:'addCustom',kind,value,category});
 assert.throws(()=>add(p[0],'brain','   '),/Type/);assert.throws(()=>add(p[0],'brain','x'.repeat(91)),/90/);assert.throws(()=>add(p[0],'bogus','Hi'),/type/);assert.throws(()=>add(p[0],'brain',brain[0].toUpperCase()),/already/);
 assert.throws(()=>add(p[0],'faker','Mochi',''),/category/);
 add(p[0],'brain','  Best   poke   spot?  ');assert.equal(r.custom[0].text,'Best poke spot?');assert.throws(()=>add(p[1],'brain','best poke spot'),/already/);
 add(p[0],'faker','Mochi','Food');assert.equal(r.custom.length,2);assert.throws(()=>add(p[0],'draw','A cat surfing'),new RegExp(String(CUSTOM_LIMIT)));
 add(p[1],'draw','A cat surfing');assert.throws(()=>g.action(r,p[1],{type:'removeCustom',index:1}),/gone/);g.action(r,p[0],{type:'removeCustom',index:0});assert.deepEqual(r.custom.map(c=>c.text),['Mochi','A cat surfing']);
 r.phase='play';assert.throws(()=>add(p[2],'brain','Too late?'));});
test('custom prompts join the right bags and show up in draws',()=>{const {g,r,p}=lobby();g.action(r,p[1],{type:'addCustom',kind:'brain',value:'Best plate lunch?'});g.action(r,p[2],{type:'addCustom',kind:'faker',value:'Spam musubi',category:'Snacks'});g.action(r,p[2],{type:'addCustom',kind:'rhythm',value:'Oahu beaches'});
 const n=pool('brain',[],r.custom).length;assert.ok(Array.from({length:n},()=>draw(r,'brain')).includes('Best plate lunch?'));
 const m=pool('faker',[],r.custom).length;assert.ok(Array.from({length:m},()=>draw(r,'faker')).some(x=>x[0]==='Spam musubi'&&x[1]==='Snacks'));
 const k=pool('rhythm',[],r.custom).length;assert.ok(Array.from({length:k},()=>draw(r,'rhythm')).includes('Oahu beaches'));
 assert.ok(!pool('quips',[],r.custom).includes('Best plate lunch?'));});
test('view never leaks custom prompt text to other players or the TV',()=>{const {g,r,p}=lobby();g.action(r,p[1],{type:'addCustom',kind:'quips',value:'<b>Secret</b> zinger'});g.action(r,p[1],{type:'addCustom',kind:'faker',value:'Hidden word',category:'Hidden cat'});
 for(const v of [g.view(r,p[0]),g.view(r,p[2]),g.publicView(r)]){const s=JSON.stringify(v);assert.ok(!s.includes('Secret')&&!s.includes('Hidden'));}
 assert.equal(g.view(r,p[0]).customCounts[p[1].id],2);assert.equal(g.view(r,p[0]).customTotal,2);assert.equal(g.view(r,p[1]).myCustom.length,2);});
test('lobby panels escape text, label adult packs, and tile art falls back to the icon',async()=>{const ui=await import('./public/ui.js');
 const s={players:[{id:'a',name:'<i>Al</i>'}],packs:['spicy'],packOptions:[{id:'spicy',name:'Spicy',description:'<script>x</script>',count:3,adult:true}],customTypes:{brain:'Same Brain question',faker:'Who’s Faking word'},myCustom:[{type:'brain',text:'<img src=x onerror=alert(1)>'}],customCounts:{a:1},customTotal:1,customLimit:2};
 const html=ui.packsPanel(s,true)+ui.customPanel(s);assert.ok(!html.includes('<script>')&&!html.includes('<img src=x')&&!html.includes('<i>Al'));assert.ok(html.includes('Spicy (adults)'));assert.ok(html.includes('1 custom prompt added'));
 assert.equal(ui.packsPanel({...s,packOptions:[]},true),'');assert.ok(ui.packsPanel(s,false).includes('Packs on: Spicy'));
 const art=ui.art('draw');assert.ok(art.includes('src="/art/draw.svg"')&&art.includes('tile-fallback')&&!art.includes('—'));assert.ok(ui.art('"><x').includes('/art/brain.svg'));});
