// Flick Pong physics, shared by the server (which decides every shot) and the browser (which animates it).
// Table space: x from -0.5 (left) to 0.5 (right), y from 0 (thrower's edge) to 1.1 (far edge).
// A flick is {aim:-1..1, power:0..1}. The same flick always lands in the same spot, so it's pure skill.
export const CUP_R=0.06;
export const TABLE_END=1.1;
const r4=n=>Math.round(n*1e4)/1e4;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,Number(n)||0));

// Six cups in a 1-2-3 triangle, point toward the thrower.
export function rack(){
 const d=0.125,h=d*0.87,y0=0.74;
 return [[0,y0],[-d/2,y0+h],[d/2,y0+h],[-d,y0+2*h],[0,y0+2*h],[d,y0+2*h]].map(([x,y])=>({x:r4(x),y:r4(y)}));
}

export function landing(shot){
 const aim=clamp(shot.aim,-1,1),power=clamp(shot.power,0,1);
 const y=0.25+0.85*power;
 return {x:r4(aim*0.45*y),y:r4(y)};
}

// alive: six booleans for the cups still standing. Returns where the ball landed and what happened.
export function resolve(alive,shot){
 const p=landing(shot),cups=rack();
 let best=-1,bd=Infinity;
 cups.forEach((c,i)=>{if(!alive[i])return;const d=Math.hypot(p.x-c.x,p.y-c.y);if(d<bd){bd=d;best=i;}});
 if(best>=0&&bd<=CUP_R*0.8)return {land:p,hit:best,rim:null};
 if(best>=0&&bd<=CUP_R*1.2)return {land:p,hit:null,rim:best};
 return {land:p,hit:null,rim:null};
}
