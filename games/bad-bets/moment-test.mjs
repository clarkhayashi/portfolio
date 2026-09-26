// "My moment" share card: which moment a player gets, and their placement.
import test from 'node:test';
import assert from 'node:assert/strict';
import {pickMoment,placement,ordinal} from './public/moment.js';
import {Game} from './server.mjs';

const P=(id,chips,x={})=>({id,name:id.toUpperCase(),chips,left:false,...x});
const night=(x={})=>({mode:'tournament',players:[P('a',180),P('b',120),P('c',120),P('d',0)],awards:[
 {id:'leader',icon:'🏆',title:'Chip Leader',players:['a'],line:'180 chips'},
 {id:'sheep',icon:'🐑',title:'Black Sheep',players:['a','c'],line:'Alone on their side twice'},
 {id:'bigbet',icon:'🎲',title:'Biggest Bet',players:['b'],line:'Bet 60 chips on one round'}],
 history:[{round:1,game:'brain',changes:{},s:{w:['a','b']}},{round:2,game:'number',changes:{a:30,b:-15,d:-15},s:{w:['a']}},{round:3,game:'quips',changes:{a:-10,d:45,b:-35},s:{w:['d']}}],...x});

test('ordinals',()=>{assert.deepEqual([1,2,3,4,11,12,13,21,22,101,112].map(ordinal),['1st','2nd','3rd','4th','11th','12th','13th','21st','22nd','101st','112th']);});
test('a fun award beats Chip Leader; otherwise the award they have',()=>{
 assert.deepEqual(pickMoment(night(),'a'),{kind:'award',icon:'🐑',title:'Black Sheep',line:'Alone on their side twice'});
 assert.equal(pickMoment(night(),'b').title,'Biggest Bet');
 const onlyLeader=night({awards:[night().awards[0]]});assert.equal(pickMoment(onlyLeader,'a').title,'Chip Leader');
});
test('no award: their biggest chip win, then a round they won, then how long they played',()=>{
 assert.deepEqual(pickMoment(night(),'d'),{kind:'win',icon:'🪙',title:'Won 45 chips',line:'Round 3 · Bad Answers'});
 const mini=night({mode:'minigames',awards:[],history:[{round:1,game:'number',changes:{},s:{w:['c']}},{round:2,game:'brain',changes:{},s:{w:[]}}]});
 assert.deepEqual(pickMoment(mini,'c'),{kind:'round',icon:'⭐',title:'Won Ballpark',line:'Round 1'});
 const late=night({awards:[],players:[...night().players,P('e',80,{joined:3})]});
 assert.deepEqual(pickMoment(late,'e'),{kind:'played',icon:'🎲',title:'Showed up and played',line:'1 round tonight'});
});
test('placement: chips in Party, rounds won in Minigames, ties share a place',()=>{
 assert.equal(placement(night(),'a').label,'1st of 4');assert.equal(placement(night(),'b').label,'Tied 2nd of 4');assert.equal(placement(night(),'d').label,'4th of 4');
 const mini=night({mode:'minigames'});assert.equal(placement(mini,'a').label,'1st of 4');assert.equal(placement(mini,'a').unit,'rounds won');assert.equal(placement(mini,'d').score,1);
 assert.equal(placement(night(),'zz'),null);
});
test('a real Party night: everyone gets a moment and a placement, and nothing quotes an answer',()=>{
 const g=new Game(),a=g.create('Host'),r=g.rooms.get(a.code);for(const n of ['Kai','Noa','Mika'])g.join(a.code,n);r.banEnabled=false;r.enabledGames=['brain','number'];r.totalRounds=3;
 g.action(r,r.players[0],{type:'start'});
 for(let i=0;i<300&&r.phase!=='finished';i++){const q=id=>r.players.find(p=>p.id===id);
  if(r.phase==='wager'){g.action(r,q(r.pot.turn),{type:'potBet',move:'match',round:r.round,revision:r.pot.revision,confirmed:true});continue;}
  if(r.phase==='play'){for(const [k,id] of [...r.active].entries())if(r.phase==='play'&&r.submissions[id]===undefined)g.action(r,q(id),{type:'submit',value:r.game==='number'?String(k*9):'secret answer '+k,promptVersion:r.promptVersion||0});continue;}
  if(r.phase==='herdVote'){for(const id of [...r.herd.voters])if(r.phase==='herdVote'&&!r.herd.votes[id])g.action(r,q(id),{type:'herdVote',side:'a'});continue;}
  if(r.phase==='result'){g.action(r,r.players[0],{type:'next'});continue;}
  g.advance(r);}
 assert.equal(r.phase,'finished');
 for(const p of r.players){const v=g.view(r,p),m=pickMoment(v,p.id),pl=placement(v,p.id);
  assert.ok(m.title&&m.line&&m.icon);assert.ok(pl.rank>=1&&pl.rank<=4);assert.ok(!JSON.stringify(m).includes('secret answer'));}
});
