// Big 3 Pong: before the game, both players draft a guard, a wing and a big from the Oops hoops pool.
// Each pick turns a real rating into a pong stat:
//   Guard (offense)  -> Aim: widens your make window.
//   Wing (best side) -> Heat: makes in a row until Fireball (your next make also clears a second cup).
//   Big (defense)    -> Contest: shrinks your opponent's make window.
// Draft order is a snake, so async turns stay short: A picks 1, B picks 2, A picks 2, B picks 1.
import {randomInt} from 'node:crypto';
import {RATINGS} from '../scout-ratings.mjs';
import {DRAFT_THEMES} from '../theme-content.mjs';

export const SLOTS=[{id:'guard',label:'guard',from:['pg','sg'],deal:6},{id:'wing',label:'wing',from:['sf'],deal:5},{id:'big',label:'big',from:['pf','c'],deal:6}];
export const ORDER=[['a','guard'],['b','guard'],['b','wing'],['a','wing'],['a','big'],['b','big']];

const rating=name=>{const r=RATINGS.hoops?.[name];return r?{off:r[0],def:r[1],note:r[2]||''}:{off:70,def:70,note:''};};
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=randomInt(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};

export function dealBig3(){
 const t=DRAFT_THEMES.hoops,boards={};
 for(const s of SLOTS)boards[s.id]=shuffle([...new Set(s.from.flatMap(k=>t.cards[k]))]).slice(0,s.deal);
 return {boards,step:0,picks:{a:{},b:{}}};
}

export const draftDone=d=>!d||d.step>=ORDER.length;
export const draftTurn=d=>draftDone(d)?null:ORDER[d.step][0];

export function pickBig3(d,seat,name){
 if(draftDone(d))throw Error('The draft is over. Shoot!');
 const [who,slot]=ORDER[d.step];
 if(who!==seat)throw Error('It is not your pick yet.');
 if(!d.boards[slot].includes(name))throw Error('That player is gone. Pick another.');
 d.picks[seat][slot]=name;d.boards[slot]=d.boards[slot].filter(n=>n!==name);d.step++;
}

// Ratings -> pong stats. Average players (75) are neutral; stars move things about 15%.
export function statsFor(picks){
 const g=rating(picks.guard),w=rating(picks.wing),b=rating(picks.big),wing=Math.max(w.off,w.def);
 return {
  aim:+(1+0.35*(g.off-75)/50).toFixed(3),
  heat:wing>=92?2:wing>=82?3:4,
  contest:+(1-0.2*(b.def-75)/50).toFixed(3)
 };
}

export function card(name){const r=rating(name);return {name,off:r.off,def:r.def,note:r.note};}
