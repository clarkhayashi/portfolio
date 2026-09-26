// Draft Duel: an async salary-cap draft graded by Oops' Scout. Both players get the same five cards at each
// position and $130. The challenger drafts all five and texts it; the friend drafts the same board without
// seeing those picks. Higher Scout score wins. Two turns total, so it works over text.
import {randomInt} from 'node:crypto';
import {RATINGS} from '../scout-ratings.mjs';
import {DRAFT_THEMES} from '../theme-content.mjs';
import {scout} from '../scout.mjs';

export const THEME='hoops';
export const BUDGET=130; // tuned 2026-09-26: the best lineup under the cap grades A−, random ones spread F to B
export const DEAL=5;
export const CHEAP=12; // every position deals at least one card this cheap, so a full lineup always fits

const ovr=name=>{const r=RATINGS[THEME]?.[name]||[60,60];return Math.round(Math.max(r[0],r[1])*0.65+Math.min(r[0],r[1])*0.35);};
// Stars cost more: ovr 96 is $39, ovr 76 is $25, ovr 57 is $12, and nobody is under $5.
export const price=name=>Math.max(5,Math.round((ovr(name)-40)*0.7));

export const slots=()=>DRAFT_THEMES[THEME].slots.map(s=>({id:s.id,label:s.id.toUpperCase()}));

export function dealDuel(){
 const t=DRAFT_THEMES[THEME],boards={};
 for(const s of t.slots){
  const pool=[...new Set(t.cards[s.id])],pick=[];
  while(pick.length<DEAL&&pool.length)pick.push(pool.splice(randomInt(pool.length),1)[0]);
  if(!pick.some(n=>price(n)<=CHEAP)){const cheap=pool.filter(n=>price(n)<=CHEAP);if(cheap.length)pick[pick.length-1]=cheap[randomInt(cheap.length)];}
  boards[s.id]=pick.sort((a,b)=>price(b)-price(a));
 }
 return boards;
}

// picks: {pg:name, sg:name, ...}. Throws a plain-English error if the lineup is not allowed.
export function checkLineup(boards,picks){
 const ids=Object.keys(boards),out={};let total=0;
 for(const id of ids){
  const n=picks?.[id];
  if(!n||!boards[id].includes(n))throw Error(`Pick a ${id.toUpperCase()} from the board.`);
  out[id]=n;total+=price(n);
 }
 if(total>BUDGET)throw Error(`That lineup costs $${total}. The cap is $${BUDGET}.`);
 return {picks:out,total};
}

export function grade(boards,picks){
 const r=scout(THEME,Object.keys(boards).map(id=>`${id.toUpperCase()}: ${picks[id]}`));
 return {grade:r.grade,score:r.score,rank:r.rank,report:r.report,players:r.players};
}

export const card=name=>{const r=RATINGS[THEME]?.[name];return {name,price:price(name),ovr:ovr(name),note:r?.[2]||''};};
