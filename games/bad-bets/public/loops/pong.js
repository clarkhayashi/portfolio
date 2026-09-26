// Flick Pong screen: draws the table in simple perspective, reads a flick, asks the server what happened,
// then animates it. The server's answer is the truth; the local sim only shapes the animation.
import {rack,CUP_R,TABLE_END} from './pong-sim.js';

const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountPong(wrap,game,{throwShot,after}){
 const canvas=wrap.querySelector('canvas'),ctx=canvas.getContext('2d');
 const cups=rack();let alive=[...game.targets],ball=null,drag=null,busy=false,fade={};
 const size=()=>{const w=wrap.clientWidth,h=Math.round(w*1.25),d=devicePixelRatio||1;canvas.width=w*d;canvas.height=h*d;canvas.style.height=h+'px';ctx.setTransform(d,0,0,d,0,0);return {W:w,H:h};};
 let {W,H}=size();
 // Table space to screen. Far end is narrower; z lifts the ball.
 const proj=(x,y,z=0)=>{const t=y/TABLE_END,s=1-0.48*t;return {x:W/2+x*W*0.92*s,y:H*0.9-t*H*0.72-z*H*0.55*s,s};};

 function draw(){
  ctx.clearRect(0,0,W,H);
  const a=proj(-0.5,0),b=proj(0.5,0),c=proj(0.5,TABLE_END),d=proj(-0.5,TABLE_END);
  ctx.fillStyle='#1f6f5c';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;ctx.stroke();
  const m1=proj(0,0),m2=proj(0,TABLE_END);ctx.beginPath();ctx.moveTo(m1.x,m1.y);ctx.lineTo(m2.x,m2.y);ctx.strokeStyle='rgba(255,255,255,.25)';ctx.stroke();
  // Cups, back row first so nearer cups overlap them.
  [...cups.keys()].sort((i,j)=>cups[j].y-cups[i].y).forEach(i=>{
   const op=alive[i]?1:(fade[i]??0);if(op<=0)return;
   const p=proj(cups[i].x,cups[i].y),rx=CUP_R*W*0.92*p.s,ry=rx*0.42,hgt=rx*1.1;
   ctx.globalAlpha=op;
   ctx.fillStyle='#c93a2f';ctx.beginPath();ctx.moveTo(p.x-rx,p.y);ctx.lineTo(p.x-rx*0.78,p.y+hgt);ctx.lineTo(p.x+rx*0.78,p.y+hgt);ctx.lineTo(p.x+rx,p.y);ctx.fill();
   ctx.fillStyle='#e2574c';ctx.beginPath();ctx.ellipse(p.x,p.y,rx,ry,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#7a1f18';ctx.beginPath();ctx.ellipse(p.x,p.y,rx*0.8,ry*0.72,0,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,rx,ry,0,0,Math.PI*2);ctx.stroke();
   ctx.globalAlpha=1;
  });
  const bp=ball||{x:0,y:0.05,z:0};
  if(game.myTurn||ball){const p=proj(bp.x,bp.y,bp.z),r=Math.max(3,0.024*W*0.92*p.s*(1+bp.z*0.6));
   const sh=proj(bp.x,bp.y,0);ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(sh.x,sh.y,r,r*0.4,0,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(p.x,p.y-r*0.3,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d8d4c8';ctx.lineWidth=1;ctx.stroke();}
  if(drag){ctx.setLineDash([5,6]);ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(drag.x0,drag.y0);ctx.lineTo(drag.x,drag.y);ctx.stroke();ctx.setLineDash([]);}
 }

 // Fly the ball to where the server says it landed, then sink it, rim it out, or roll it off.
 function animate(res){return new Promise(done=>{
  const from={x:0,y:0.05},to=res.land,dur=reduced?1:650,start=performance.now();
  const step=now=>{const t=clamp((now-start)/dur,0,1);
   ball={x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t,z:0.42*Math.sin(Math.PI*t)};
   if(t<1){draw();requestAnimationFrame(step);return;}
   const end=performance.now(),dur2=reduced?1:380;
   const settle=now=>{const u=clamp((now-end)/dur2,0,1);
    if(res.hit!==null){alive[res.hit]=false;fade[res.hit]=1-u;const c=cups[res.hit];ball={x:c.x,y:c.y,z:-0.03*u};}
    else if(res.rim!==null){const c=cups[res.rim],dx=to.x-c.x||0.01;ball={x:to.x+dx*3*u,y:to.y+0.05*u,z:0.12*Math.sin(Math.PI*u)};}
    else ball={x:to.x,y:to.y+0.25*u,z:0.06*Math.sin(Math.PI*u)};
    draw();if(u<1)requestAnimationFrame(settle);else{ball=null;draw();done();}};
   requestAnimationFrame(settle);};
  requestAnimationFrame(step);
 });}

 async function shoot(shot){
  if(busy||!game.myTurn)return;busy=true;
  try{const res=await throwShot(shot);await animate(res);after(res);}catch(e){after({error:e.message});}
  busy=false;
 }

 // Flick up from the bottom. Longer flick = more power; sideways = aim.
 canvas.addEventListener('pointerdown',e=>{if(!game.myTurn||busy)return;const r=canvas.getBoundingClientRect();drag={x0:e.clientX-r.left,y0:e.clientY-r.top,x:e.clientX-r.left,y:e.clientY-r.top};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const r=canvas.getBoundingClientRect();drag.x=e.clientX-r.left;drag.y=e.clientY-r.top;draw();});
 canvas.addEventListener('pointerup',()=>{if(!drag)return;const dx=drag.x-drag.x0,dy=drag.y-drag.y0;drag=null;draw();
  if(dy>-20)return;
  shoot({aim:clamp(dx/-dy*1.25,-1,1),power:clamp(-dy/(H*0.62),0,1)});});

 // Sliders for keyboards and screen readers (and precise practice).
 const form=wrap.querySelector('form');
 form?.addEventListener('submit',e=>{e.preventDefault();shoot({aim:Number(form.aim.value)/100,power:Number(form.power.value)/100});});
 addEventListener('resize',()=>{({W,H}=size());draw();});
 draw();
}
