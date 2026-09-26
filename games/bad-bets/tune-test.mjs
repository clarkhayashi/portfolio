// Hidden tune panel (timer multipliers on the server, tune JSON on the client) and swipe to pick.
import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from './server.mjs';
import {cloudRequest} from './cloud-game.mjs';
import {parseTimerScale,scaledSeconds,WRITE_PHASES,VOTE_PHASES} from './tune.mjs';
import {DEFAULTS,FIELDS,mergeTune,parseTune,isDefault,tuneJson,nudge,timerScaleOf,springEasing,cssVars} from './public/tune-core.js';
import {swipeDecision,swipeHint,swipeTransform} from './public/swipe.js';

const near=(ms,want)=>assert.ok(Math.abs(ms-want)<250,`${ms} is not about ${want}`);
const left=r=>r.deadline-Date.now();

test('timerScale validation: malformed means default, numbers clamp to 0.5..2',()=>{
 for(const bad of [undefined,null,'2',true,[],[2],{},{write:'2'},{vote:null},NaN,Infinity,{write:NaN}])assert.equal(parseTimerScale(bad),null,JSON.stringify(bad));
 assert.equal(parseTimerScale(1),null);assert.equal(parseTimerScale({write:1,vote:1}),null);
 assert.deepEqual(parseTimerScale({write:3,vote:.1}),{write:2,vote:.5});
 assert.deepEqual(parseTimerScale(1.5),{write:1.5,vote:1.5});
 assert.deepEqual(parseTimerScale({write:1.5}),{write:1.5,vote:1});
 assert.deepEqual(parseTimerScale({write:-4,vote:99}),{write:.5,vote:2});
 assert.deepEqual(parseTimerScale({write:1.234567,vote:.75}),{write:1.23,vote:.75});
});

test('scaled seconds: whole seconds, only write and vote phases, at least 1',()=>{
 const k={write:1.5,vote:.5};
 assert.equal(scaledSeconds('play',45,k),68);assert.equal(scaledSeconds('herdWrite',45,k),68);
 assert.equal(scaledSeconds('herdVote',20,k),10);assert.equal(scaledSeconds('finalePick',25,k),13);
 for(const p of ['stake','entry','spin','reveal','comeback','banResult','physicalConfirm'])assert.equal(scaledSeconds(p,15,k),15,p);
 assert.equal(scaledSeconds('vote',1,{write:1,vote:.5}),1);
 assert.equal(scaledSeconds('play',undefined,k),undefined);assert.equal(scaledSeconds('play',30,null),30);
 assert.ok(!WRITE_PHASES.some(p=>VOTE_PHASES.includes(p)));
});

test('rooms created with timerScale stretch their timers; normal rooms are unchanged',()=>{
 const g=new Game();
 const plain=g.rooms.get(g.create('Host','tournament').code);assert.equal('timerScale' in plain,false);
 g.phase(plain,'herdVote',20);near(left(plain),20000);g.phase(plain,'play',45);near(left(plain),45000);
 const tuned=g.rooms.get(g.create('Host','tournament',null,undefined,{timerScale:{write:2,vote:.5}}).code);
 assert.deepEqual(tuned.timerScale,{write:2,vote:.5});
 g.phase(tuned,'herdVote',20);near(left(tuned),10000);
 g.phase(tuned,'herdWrite',45);near(left(tuned),90000);
 g.phase(tuned,'stake',15);near(left(tuned),15000);
 // A paused round resumes with its leftover time as-is (it was scaled when the phase opened).
 tuned.phase='paused';g.phase(tuned,'play',12.3);near(left(tuned),12300);
 // Garbage from the client is ignored rather than trusted.
 const junk=g.rooms.get(g.create('Host','tournament',null,undefined,{timerScale:{write:'lots',vote:{}}}).code);assert.equal('timerScale' in junk,false);
 const wild=g.rooms.get(g.create('Host','tournament',null,undefined,{timerScale:{write:40,vote:0}}).code);assert.deepEqual(wild.timerScale,{write:2,vote:.5});
});

class Store{constructor(){this.data=new Map();}async get(k){return this.data.get(k)??null;}async compareAndSwap(k,b,a){if((this.data.get(k)??null)!==(b||null))return false;this.data.set(k,a);return true;}}
test('the cloud create path passes timerScale through the same validation',async()=>{
 const s=new Store();
 const h=await cloudRequest(s,{type:'create',name:'Host',mode:'tournament',timerScale:{write:.5,vote:3}});
 assert.deepEqual(JSON.parse(s.data.get(h.code)).timerScale,{write:.5,vote:2});
 const n=await cloudRequest(s,{type:'create',name:'Host',mode:'tournament'});
 assert.equal('timerScale' in JSON.parse(s.data.get(n.code)),false);
});

test('tune JSON: merge, clamp, snap, and reject junk',()=>{
 assert.deepEqual(parseTune('{}'),DEFAULTS);assert.deepEqual(parseTune(undefined),DEFAULTS);
 assert.ok(isDefault(DEFAULTS));
 const r=mergeTune(DEFAULTS,'{"anim":1.53,"bounce":9,"volume":-1,"write":"2","nope":4}');
 assert.equal(r.error,null);assert.deepEqual(r.values,{anim:1.55,bounce:1,write:1,vote:1,volume:0});
 const base={...DEFAULTS,vote:1.5};
 assert.deepEqual(mergeTune(base,{anim:.5}).values,{...base,anim:.5},'a partial patch keeps the other values');
 assert.equal(mergeTune(base,'not json').error,'That is not valid JSON.');assert.equal(mergeTune(base,'not json').values.vote,1.5);
 assert.equal(mergeTune(base,'[1,2]').error,'Paste a JSON object.');
 assert.equal(mergeTune(base,'{"x":1}').error,'No tune values found.');
 assert.deepEqual(mergeTune(DEFAULTS,tuneJson(base)).values,base,'copy then paste round-trips');
 for(const [k,f] of Object.entries(FIELDS)){assert.ok(f.def>=f.min&&f.def<=f.max,k);}
});

test('keyboard nudges, timer extras and CSS variables',()=>{
 assert.equal(nudge(DEFAULTS,'anim',-100).anim,1.05);assert.equal(nudge(DEFAULTS,'anim',100).anim,.95);
 assert.equal(nudge(DEFAULTS,'volume',-300).volume,1,'clamped at the top');
 assert.equal(nudge(DEFAULTS,'bounce',-3).bounce,.05,'a tiny trackpad scroll still moves one step');
 assert.equal(nudge(DEFAULTS,'nope',-100),DEFAULTS);
 assert.equal(timerScaleOf(DEFAULTS),null);assert.deepEqual(timerScaleOf({...DEFAULTS,write:1.5}),{write:1.5,vote:1});
 assert.deepEqual(cssVars(DEFAULTS),{'--anim-speed':null,'--spring':null,'--ease-press':null},'defaults leave the stock styles alone');
 const v=cssVars({...DEFAULTS,anim:2,bounce:.6});assert.equal(v['--anim-speed'],'2');assert.match(v['--spring'],/^linear\(0, /);assert.match(v['--ease-press'],/^cubic-bezier\(/);
 const pts=springEasing(.8).slice(7,-1).split(', ').map(Number);assert.equal(pts.at(-1),1);assert.ok(Math.max(...pts)>1,'a bouncy spring overshoots');
 assert.ok(Math.max(...springEasing(.1).slice(7,-1).split(', ').map(Number))<1.01,'a low bounce barely overshoots');
});

test('swipe decision: commit past 30% or on a flick, otherwise spring back',()=>{
 const W=300;
 assert.equal(swipeDecision(-90,0,W),'a');assert.equal(swipeDecision(90,0,W),'b');
 assert.equal(swipeDecision(-89,0,W),null);assert.equal(swipeDecision(60,.2,W),null);
 assert.equal(swipeDecision(40,.8,W),'b','fast flick right');assert.equal(swipeDecision(-40,-.8,W),'a','fast flick left');
 assert.equal(swipeDecision(40,-.8,W),null,'flicking back toward the middle does not commit');
 assert.equal(swipeDecision(10,2,W),null,'a twitch is not a flick');
 assert.equal(swipeDecision(0,0,W),null);assert.equal(swipeDecision(NaN,0,W),null);assert.equal(swipeDecision(200,0,0),null);
 assert.equal(swipeDecision(-120,undefined,W),'a');
 assert.equal(swipeHint(-95,W),'a');assert.equal(swipeHint(95,W),'b');assert.equal(swipeHint(50,W),null);
 assert.match(swipeTransform(-150,W),/^translateX\(-150px\) rotate\(-9\.00deg\)$/);
 assert.match(swipeTransform(900,W),/rotate\(12\.00deg\)/,'tilt is capped');
});
