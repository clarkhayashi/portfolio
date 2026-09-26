// Flick Pong screen: draws the table in simple perspective, reads a flick, asks the server what happened,
// then animates it. The server's answer is the truth; the local sim only shapes the animation.
import {rack,CUP_R,TABLE_END} from './pong-sim.js';
import {TUNE} from './tune.js';
const T=TUNE.pong;

const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const easeOut=t=>1-(1-t)*(1-t);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountPong(wrap,game,{throwShot,after}){
 const canvas=wrap.querySelector('canvas'),ctx=canvas.getContext('2d');
 const cups=rack();let alive=[...game.targets],ball=null,drag=null,busy=false,sink={},splash=null,frame=0;
 const size=()=>{const w=wrap.clientWidth,h=Math.round(w*1.2),d=devicePixelRatio||1;canvas.width=w*d;canvas.height=h*d;canvas.style.height=h+'px';ctx.setTransform(d,0,0,d,0,0);return {W:w,H:h};};
 let {W,H}=size();
 // Table space to screen. A low, close camera: gentle perspective so the far cups stay big. z lifts the ball.
 const proj=(x,y,z=0)=>{const t=y/TABLE_END,s=1-T.perspective*t;return {x:W/2+x*W*T.zoom*s,y:H*0.93-(t>0?Math.pow(t,1.35):t)*H*0.74-z*H*0.5*s,s};};
 const cupR=p=>CUP_R*W*T.zoom*p.s;

 function table(){
  const a=proj(-0.5,-0.05),b=proj(0.5,-0.05),c=proj(0.5,TABLE_END),d=proj(-0.5,TABLE_END);
  ctx.fillStyle=T.table;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fill();
  // Soft light toward the far end so the cups pop.
  const g=ctx.createLinearGradient(0,c.y,0,a.y);g.addColorStop(0,'rgba(255,255,255,.10)');g.addColorStop(1,'rgba(0,0,0,.12)');ctx.fillStyle=g;ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=3;ctx.lineJoin='round';ctx.stroke();
  const m1=proj(0,-0.05),m2=proj(0,TABLE_END);ctx.beginPath();ctx.moveTo(m1.x,m1.y);ctx.lineTo(m2.x,m2.y);ctx.strokeStyle='rgba(255,255,255,.28)';ctx.lineWidth=2;ctx.stroke();
 }

 function cup(i){
  const k=alive[i]?0:(sink[i]??1);if(k>=1)return;           // k: 0 standing, 1 gone
  const p=proj(cups[i].x,cups[i].y),r=cupR(p)*(1-0.25*k),ry=r*0.38,h=r*T.cupHeight;
  ctx.save();ctx.globalAlpha=1-k;
  ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(p.x+r*0.12,p.y+h,r*0.85,ry*0.8,0,0,Math.PI*2);ctx.fill();
  // Body: tapered, shaded left to right.
  const body=ctx.createLinearGradient(p.x-r,0,p.x+r,0);body.addColorStop(0,'rgba(255,255,255,.2)');body.addColorStop(0.45,'rgba(255,255,255,0)');body.addColorStop(1,'rgba(0,0,0,.3)');
  // Cup color first, then light-to-shadow shading on top, so any tuned color still looks round.
  ctx.beginPath();ctx.moveTo(p.x-r,p.y);ctx.lineTo(p.x-r*0.72,p.y+h);ctx.ellipse(p.x,p.y+h,r*0.72,ry*0.7,0,Math.PI,0,true);ctx.lineTo(p.x+r,p.y);ctx.closePath();
  ctx.fillStyle=T.cup;ctx.fill();ctx.fillStyle=body;ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.moveTo(p.x-r*0.62,p.y+ry*0.6);ctx.lineTo(p.x-r*0.48,p.y+h*0.92);ctx.lineTo(p.x-r*0.36,p.y+h*0.92);ctx.lineTo(p.x-r*0.46,p.y+ry*0.6);ctx.fill();
  // Rim and inside.
  ctx.fillStyle='#f8f7f2';ctx.beginPath();ctx.ellipse(p.x,p.y,r,ry,0,0,Math.PI*2);ctx.fill();
  const inner=ctx.createLinearGradient(0,p.y-ry,0,p.y+ry);inner.addColorStop(0,'#5a1712');inner.addColorStop(1,'#8e2a22');
  ctx.fillStyle=inner;ctx.beginPath();ctx.ellipse(p.x,p.y+ry*0.06,r*0.86,ry*0.8,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
 }

 function drawBall(bp){
  const p=proj(bp.x,bp.y,bp.z),r=Math.max(4,T.ballSize*W*p.s*(1+bp.z*0.5));
  if(bp.z>-0.01){const sh=proj(bp.x,bp.y,0),a=clamp(0.3-bp.z*0.35,0.08,0.3);ctx.fillStyle=`rgba(0,0,0,${a})`;ctx.beginPath();ctx.ellipse(sh.x,sh.y,r*(1+bp.z),r*0.4*(1+bp.z),0,0,Math.PI*2);ctx.fill();}
  const g=ctx.createRadialGradient(p.x-r*0.35,p.y-r*0.65,r*0.15,p.x,p.y-r*0.3,r);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#d9d4c6');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y-r*0.3,r,0,Math.PI*2);ctx.fill();
 }

 function draw(now=performance.now()){
  ctx.clearRect(0,0,W,H);table();
  [...cups.keys()].sort((i,j)=>cups[j].y-cups[i].y).forEach(cup);
  if(splash){const p=proj(splash.x,splash.y),r=cupR(p);ctx.strokeStyle=`rgba(255,255,255,${0.7*(1-splash.k)})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(p.x,p.y,r*(0.3+splash.k*0.9),r*0.38*(0.3+splash.k*0.9),0,0,Math.PI*2);ctx.stroke();}
  if(ball)drawBall(ball);
  else if(game.myTurn&&!busy)drawBall({x:0,y:0.03,z:reduced?0:0.015+0.012*Math.sin(now/260)}); // resting ball bobs gently
  if(drag){const b=proj(0,0.03);ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=4;ctx.lineCap='round';ctx.setLineDash([2,10]);
   ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+(drag.x-drag.x0)*1.4,b.y+(drag.y-drag.y0)*1.4);ctx.stroke();ctx.setLineDash([]);}
 }

 // Idle loop only while it's your turn, so the resting ball breathes; stops otherwise to save battery.
 const idle=now=>{if(!canvas.isConnected)return;if(!ball&&!busy)draw(now);frame=game.myTurn&&!reduced?requestAnimationFrame(idle):0;};

 // Fly the ball to where the server says it landed, then sink it, rim it out, or bounce it away.
 function animate(res){return new Promise(done=>{
  const from={x:0,y:0.03},to=res.land,dur=reduced?1:T.flightMs,start=performance.now();
  const step=now=>{const t=clamp((now-start)/dur,0,1),e=easeOut(t);
   ball={x:from.x+(to.x-from.x)*e,y:from.y+(to.y-from.y)*e,z:T.arc*Math.sin(Math.PI*t)};
   draw(now);if(t<1){requestAnimationFrame(step);return;}
   const end=performance.now(),dur2=reduced?1:480,c=res.hit!==null?cups[res.hit]:res.rim!==null?cups[res.rim]:null;
   if(res.hit!==null)alive[res.hit]=false;
   if(res.fireball!=null)alive[res.fireball]=false; // Fireball: a second cup goes with it
   const settle=now=>{const u=clamp((now-end)/dur2,0,1);
    if(res.fireball!=null)sink[res.fireball]=easeOut(u);
    if(res.hit!==null){sink[res.hit]=easeOut(u);splash={x:c.x,y:c.y,k:u};ball=u<0.35?{x:c.x,y:c.y,z:-0.02*u}:null;}
    else if(c){const dx=(to.x-c.x)||0.01,dy=(to.y-c.y)||0.01,m=Math.hypot(dx,dy);ball={x:to.x+dx/m*0.22*u,y:to.y+dy/m*0.12*u,z:0.14*Math.sin(Math.PI*u)};}
    else ball={x:to.x,y:to.y+0.3*u,z:0.09*Math.abs(Math.sin(Math.PI*1.6*u))*(1-u)};
    draw(now);if(u<1)requestAnimationFrame(settle);else{ball=null;splash=null;draw();done();}};
   requestAnimationFrame(settle);};
  requestAnimationFrame(step);
 });}

 async function shoot(shot){
  if(busy||!game.myTurn)return;busy=true;
  try{const res=await throwShot(shot);await animate(res);after(res);}catch(e){after({error:e.message});}
  busy=false;
 }

 // Flick up from anywhere on the table. Longer flick = more power; sideways = aim.
 canvas.addEventListener('pointerdown',e=>{if(!game.myTurn||busy)return;const r=canvas.getBoundingClientRect();drag={x0:e.clientX-r.left,y0:e.clientY-r.top,x:e.clientX-r.left,y:e.clientY-r.top};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const r=canvas.getBoundingClientRect();drag.x=e.clientX-r.left;drag.y=e.clientY-r.top;if(!frame)draw();});
 canvas.addEventListener('pointerup',()=>{if(!drag)return;const dx=drag.x-drag.x0,dy=drag.y-drag.y0;drag=null;draw();
  if(dy>-20)return;
  shoot({aim:clamp(dx/-dy*1.25,-1,1),power:clamp(-dy/(H*0.62),0,1)});});

 // Sliders for keyboards and screen readers (and precise practice).
 const form=wrap.querySelector('form');
 form?.addEventListener('submit',e=>{e.preventDefault();shoot({aim:Number(form.aim.value)/100,power:Number(form.power.value)/100});});
 addEventListener('resize',()=>{({W,H}=size());draw();});
 addEventListener('loops-tune',()=>draw());
 draw();idle(performance.now());
}
