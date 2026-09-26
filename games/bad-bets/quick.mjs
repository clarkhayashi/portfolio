// Quick 1v1 auction: one round per position, sealed bids. Both pick a player at that position and a price.
// Different players: both get their pick and pay. Same player: higher bid wins, the other picks again.
// Nobody is ever handed a player they didn't choose (except the timer's cheapest-card fallback).
import {randomInt} from 'node:crypto';

export const QA_BUDGET=100;
export const QA_SECONDS=30;

export function setupQuickAuction(r,theme,deal){
 r.qa={theme:theme.id,slots:theme.slots.map(s=>s.id.toUpperCase()),labels:theme.slots.map(s=>s.label),
  boards:theme.slots.map(slot=>deal(r,theme,slot,8)),step:0,budgets:Object.fromEntries(r.active.map(p=>[p,QA_BUDGET])),
  bids:{},last:null,revision:0};
 r.active.forEach(p=>r.picks[p]=[]);
}

const needs=(r,pid)=>r.picks[pid].length===r.qa.step;
// Max bid keeps $1 for every position still to fill after this one.
export const maxBid=(r,pid)=>Math.max(1,r.qa.budgets[pid]-(r.qa.slots.length-1-r.qa.step));

export function quickBid(g,r,p,a){
 const q=r.qa;if(r.phase!=='qauction'||!q)throw Error('The auction has ended.');
 if(!r.active.includes(p.id))throw Error('Only the two players can bid.');
 if(!needs(r,p.id))throw Error('You already have your player for this position.');
 const board=q.boards[q.step];if(!board.includes(a.item))throw Error('That player is gone. Pick another.');
 const amount=Math.floor(Number(a.amount));if(!(amount>=1))throw Error('Bid at least $1.');
 if(amount>maxBid(r,p.id))throw Error(`Keep $1 for each position left. Max bid: $${maxBid(r,p.id)}.`);
 q.bids[p.id]={item:a.item,amount};q.revision++;resolve(g,r);
}

// Timer ran out: anyone without a bid takes the first player left on the board for $1.
export function quickTimeout(g,r){
 const q=r.qa;for(const pid of r.active)if(needs(r,pid)&&!q.bids[pid])q.bids[pid]={item:q.boards[q.step][0],amount:1,auto:true};
 resolve(g,r);
}

function resolve(g,r){
 const q=r.qa,waiting=r.active.filter(pid=>needs(r,pid));
 if(waiting.some(pid=>!q.bids[pid])){g.phase(r,'qauction',QA_SECONDS);return;}
 const name=pid=>r.players.find(p=>p.id===pid)?.name||'Player',label=q.slots[q.step];
 const give=(pid,{item,amount})=>{r.picks[pid].push(`${label}: ${item}`);q.budgets[pid]-=amount;q.boards[q.step]=q.boards[q.step].filter(x=>x!==item);};
 if(waiting.length===2&&q.bids[waiting[0]].item===q.bids[waiting[1]].item){
  const [x,y]=waiting,bx=q.bids[x].amount,by=q.bids[y].amount,win=bx===by?waiting[randomInt(2)]:bx>by?x:y,lose=win===x?y:x;
  give(win,q.bids[win]);
  q.last={clash:true,item:q.bids[win].item,winner:name(win),loser:name(lose),text:`You both wanted ${q.bids[win].item}. ${name(win)} got ${q.bids[win].item} for $${q.bids[win].amount}${bx===by?' (tie, coin flip)':''}. ${name(lose)} picks again.`};
  q.bids={};q.revision++;g.phase(r,'qauction',QA_SECONDS);return;
 }
 for(const pid of waiting)give(pid,q.bids[pid]);
 q.last={clash:false,text:waiting.map(pid=>`${name(pid)}: ${q.bids[pid].item} ($${q.bids[pid].amount})`).join(' · ')};
 q.bids={};q.step++;q.revision++;
 if(q.step>=q.slots.length){g.phase(r,'pitch',45);return;}
 g.phase(r,'qauction',QA_SECONDS);
}

// What one player may see: their own bid, not the other's.
export function quickView(r,pid){
 const q=r.qa;if(!q||r.phase!=='qauction')return null;
 return {step:q.step,total:q.slots.length,slot:q.slots[q.step],label:q.labels[q.step],cards:q.boards[q.step],budgets:q.budgets,
  max:r.active.includes(pid)?maxBid(r,pid):0,mine:q.bids[pid]||null,done:needs(r,pid)?false:true,
  submitted:Object.fromEntries(r.active.map(x=>[x,!!q.bids[x]||!needs(r,x)])),last:q.last,revision:q.revision};
}
