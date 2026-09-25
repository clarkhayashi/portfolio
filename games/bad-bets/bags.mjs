// No-repeat bags shared by prompts, theme cards and auction lots. No imports from game modules (avoids cycles).
import {randomInt} from 'node:crypto';
export function shuffled(n){const a=Array.from({length:n},(_,i)=>i);for(let i=n-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
// Efraimidis-Spirakis: key u^(1/w). Returns indices in ascending key order, so bag.pop() yields the highest key first.
export function weightedOrder(weights,rand=Math.random){return weights.map((w,i)=>{let u=rand();if(!(u>0))u=1e-12;return [Math.pow(u,1/(w>0?w:1)),i];}).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);}
// Generic no-repeat bag keyed by name. Bags hold indices only (small Redis payload).
// weightOf(item) > 0 gives a weighted order on each refill: every item still appears once per cycle,
// higher weights tend to come earlier. Weights are read only when a bag is (re)filled, never mid-bag.
export function drawFrom(r,key,items,weightOf=null){
 const n=items.length;if(!n)return undefined;
 const fill=()=>{if(!weightOf)return shuffled(n);let w;try{w=items.map(x=>{const v=Number(weightOf(x));return v>0&&Number.isFinite(v)?v:1;});}catch{return shuffled(n);}return weightedOrder(w);};
 r.bags||={};let bag=r.bags[key];
 if(!bag||bag.n!==n||!Array.isArray(bag.q))bag=r.bags[key]={n,q:fill(),last:bag&&bag.n===n?bag.last:-1};
 if(!bag.q.length){bag.q=fill();if(n>1&&bag.q[bag.q.length-1]===bag.last){const t=bag.q[bag.q.length-1];bag.q[bag.q.length-1]=bag.q[bag.q.length-2];bag.q[bag.q.length-2]=t;}}
 const i=bag.q.pop();bag.last=i;return items[i];
}
