// Sound cues are decided by pure functions of two polls, so they can be tested without audio.
import test from 'node:test';
import assert from 'node:assert/strict';
import {cues,clockCue,turnOf,SOUNDS,HAPTICS,play,soundOn} from './public/sounds.js';
import {readFile} from 'node:fs/promises';

const P=(id,chips=100)=>({id,name:id,chips,left:false});
const base=(x={})=>({code:'ABCD',round:2,phase:'play',you:'a',players:[P('a'),P('b'),P('c')],active:['a','b','c'],...x});

test('every cue names a real sound; haptics cover lock-in, win, lose and your turn',()=>{
 for(const k of Object.keys(HAPTICS))assert.ok(SOUNDS.includes(k),k);
 for(const k of ['lock','win','lose','turn'])assert.ok(HAPTICS[k],k);
 assert.equal(SOUNDS.length>=12,true);
});
test('lobby joins, a new round, the reveal and the final standings',()=>{
 assert.deepEqual(cues(base({phase:'lobby',round:0}),base({phase:'lobby',round:0,players:[P('a'),P('b'),P('c'),P('d')]})),['join']);
 assert.deepEqual(cues(base({phase:'result',round:1}),base({phase:'spin',round:2})),['round']);
 assert.deepEqual(cues(base({phase:'result'}),base({phase:'finished'})),['fanfare']);
 assert.deepEqual(cues(base(),base({code:'ZZZZ',phase:'finished'})),[],'a different room is not a change');
});
test('phones hear their own result: win, big win, lose; ties and audience stay quiet',()=>{
 const res=(changes,winners=['a'],x={})=>base({phase:'result',result:{winners,tie:false,changes},...x});
 assert.deepEqual(cues(base(),res({a:20,b:-20})),['reveal','win']);
 assert.deepEqual(cues(base(),res({a:60,b:-60})),['reveal','bigwin']);
 assert.deepEqual(cues(base(),res({a:-20,b:20},['b'])),['reveal','lose']);
 assert.deepEqual(cues(base(),base({phase:'result',result:{winners:[],tie:true,changes:{a:0}}})),['reveal']);
 assert.deepEqual(cues(base(),res({b:5,c:-5},['b'],{active:['b','c']})),['reveal'],'audience hears the reveal only');
 assert.deepEqual(cues(base(),res({},['a'],{result:{winners:['a'],tie:false,changes:{},house:true}})),['reveal','win'],'house and minigames rounds use winners');
});
test('TV: someone locking in, a big win, the Black Sheep, and +1 joining',()=>{
 const tv={tv:true};
 assert.deepEqual(cues(base({submissionCount:1}),base({submissionCount:2}),tv),['lock']);
 assert.deepEqual(cues(base(),base({phase:'result',result:{winners:['b'],tie:false,changes:{b:80,a:-80}}}),tv),['reveal','bigwin']);
 assert.deepEqual(cues(base(),base({phase:'result',herd:{reveal:{sheep:'c'}},result:{winners:['a','b'],tie:false,changes:{a:3,b:2,c:-5}}}),tv),['reveal','sheep','win']);
 assert.deepEqual(cues(base({lateJoin:{round:0,later:0}}),base({lateJoin:{round:1,later:0}}),tv),['join']);
 assert.deepEqual(cues(base({phase:'result'}),base({phase:'result',herd:{reveal:{sheep:'c'}}})),[],'phones only bleat for their own sheep, once');
});
test('All In: a contribution rises and that stack hits zero',()=>{
 const pot=(c,chips)=>base({phase:'wager',pot:{turn:'b',contestants:['a','b'],contributions:c,total:Object.values(c).reduce((x,y)=>x+y,0)},players:[P('a',chips.a),P('b',chips.b)]});
 assert.deepEqual(cues(pot({a:5,b:5},{a:95,b:95}),pot({a:5,b:100},{a:95,b:0}),{tv:true}),['allin','lock']);
 assert.deepEqual(cues(pot({a:5,b:5},{a:95,b:95}),pot({a:5,b:20},{a:95,b:80}),{tv:true}),['lock']);
});
test('your turn chimes once on your phone, never on the TV',()=>{
 const w=t=>base({phase:'wager',pot:{turn:t,contestants:['a','b'],contributions:{},total:0}});
 assert.equal(turnOf(w('a')),'a');assert.deepEqual(cues(w('b'),w('a')),['turn']);assert.deepEqual(cues(w('a'),w('a')),[]);
 assert.deepEqual(cues(w('b'),w('a'),{tv:true}),[]);
 assert.deepEqual(cues(base({phase:'clue',cluePlayer:'b'}),base({phase:'clue',cluePlayer:'a'})),['turn']);
});
test('waiting late joiners get no cues until seated',()=>{assert.deepEqual(cues(base(),base({phase:'finished',waiting:{status:'round'}})),[]);});
test('countdown ticks the last three seconds once each, then time up; not in physical rounds',()=>{
 const s=base({deadline:10000}),memo={},at=ms=>clockCue(s,ms,memo);
 assert.equal(at(5000),null);assert.equal(at(7100),'tick');assert.equal(at(7300),null);assert.equal(at(8100),'tick');assert.equal(at(9100),'tick');assert.equal(at(10050),'timeup');assert.equal(at(10200),null);
 assert.equal(clockCue(base({phase:'physical',deadline:10000}),9000,{}),null);assert.equal(clockCue(base({phase:'reveal',deadline:10000}),9000,{}),null);
});
test('in node there is no audio: play() is a safe no-op and TV defaults stay off the phone',()=>{assert.equal(play('win'),false);assert.equal(soundOn(),false);});
test('the beat and the effects share one AudioContext, created only on a gesture',async()=>{
 const phys=await readFile(new URL('./public/physical-ui.js',import.meta.url),'utf8'),snd=await readFile(new URL('./public/sounds.js',import.meta.url),'utf8');
 assert.ok(phys.includes('unlockAudio'));assert.ok(!/new \(window\.AudioContext/.test(phys));assert.equal((snd.match(/new AC\(\)/g)||[]).length,1);
});
