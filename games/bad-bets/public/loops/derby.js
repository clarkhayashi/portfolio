// Home Run Derby batting screen: 10 pitches, tap (or press space) to swing. Timing is measured from the
// pitch release; the server re-scores the same taps, so what you see here is just instant feedback.
import {outcome} from './derby-sim.js';
import {fx} from './sfx.js';

const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountDerby(wrap,pitches,{onDone}){
 const canvas=wrap.querySelector('canvas'),ctx=canvas.getContext('2d'),label=wrap.querySelector('[data-derby-label]');
 const size=()=>{const w=wrap.clientWidth,h=Math.round(w*1.15),d=devicePixelRatio||1;canvas.width=w*d;canvas.height=h*d;canvas.style.height=h+'px';ctx.setTransform(d,0,0,d,0,0);return {W:w,H:h};};
 let {W,H}=size();
 const swings=[];let i=0,phase='ready',t0=0,swingAt=null,result=null,resultAt=0,hrs=0,alive=true;
 const mound=()=>({x:W/2,y:H*0.36}),plate=()=>({x:W/2,y:H*0.88});

 function field(){
  ctx.fillStyle='#8fc6e8';ctx.fillRect(0,0,W,H*0.2);                       // sky
  ctx.fillStyle='#2f6b3e';ctx.fillRect(0,H*0.2,W,H);                        // outfield grass
  ctx.fillStyle='#244f30';ctx.fillRect(0,H*0.16,W,H*0.06);                  // wall
  ctx.fillStyle='#f2b33d';ctx.fillRect(0,H*0.215,W,3);                     // home-run line
  ctx.fillStyle='#c98f5a';ctx.beginPath();ctx.moveTo(W*0.5,H*0.3);ctx.lineTo(W*1.05,H*0.8);ctx.lineTo(W*0.5,H*1.1);ctx.lineTo(-W*0.05,H*0.8);ctx.closePath();ctx.fill(); // infield dirt
  ctx.fillStyle='#3a7a4a';ctx.beginPath();ctx.moveTo(W*0.5,H*0.42);ctx.lineTo(W*0.82,H*0.7);ctx.lineTo(W*0.5,H*0.98);ctx.lineTo(W*0.18,H*0.7);ctx.closePath();ctx.fill(); // infield grass
  const m=mound();ctx.fillStyle='#c98f5a';ctx.beginPath();ctx.ellipse(m.x,m.y,W*0.07,W*0.025,0,0,Math.PI*2);ctx.fill();
  const p=plate();ctx.fillStyle='#f8f7f2';ctx.beginPath();ctx.moveTo(p.x-14,p.y);ctx.lineTo(p.x+14,p.y);ctx.lineTo(p.x+14,p.y+6);ctx.lineTo(p.x,p.y+13);ctx.lineTo(p.x-14,p.y+6);ctx.closePath();ctx.fill();
  // pitcher
  ctx.fillStyle='#253345';ctx.beginPath();ctx.arc(m.x,m.y-26,7,0,Math.PI*2);ctx.fill();ctx.fillRect(m.x-6,m.y-19,12,18);
 }
 function bat(now){
  const p=plate(),sw=swingAt!=null?clamp((now-swingAt)/140,0,1):0,ang=-2.4+sw*3.2;
  ctx.save();ctx.translate(p.x+W*0.16,p.y+4);ctx.rotate(ang);ctx.strokeStyle='#b5874f';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-W*0.24,0);ctx.stroke();ctx.restore();
 }
 function ball(x,y,r){ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(x,y+r*1.4,r,r*0.35,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d33';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x-r*0.5,y,r*0.7,-0.9,0.9);ctx.stroke();}

 function draw(now){
  if(!alive||!canvas.isConnected)return;
  ctx.clearRect(0,0,W,H);field();
  const p=pitches[i],m=mound(),pl=plate();
  if(phase==='windup'){const k=clamp((now-t0+700)/700,0,1);ctx.fillStyle=`rgba(255,255,255,${0.3+0.5*k})`;ctx.beginPath();ctx.arc(m.x+10,m.y-30,4,0,Math.PI*2);ctx.fill();}
  if(phase==='pitch'){const t=(now-t0)/p.ms;
   if(t<=1.25){const e=clamp(t,0,1.25),x=m.x+(pl.x-m.x)*e+(p.type==='slider'?Math.sin(e*Math.PI)*W*0.05:0),y=m.y+(pl.y-12-m.y)*e-(p.type==='changeup'?Math.sin(e*Math.PI)*H*0.04:0);ball(x,y,4+e*9);}
   if(swingAt==null&&now-t0>p.ms+260)finishPitch(null,now);
  }
  if(phase==='result'&&result){const u=clamp((now-resultAt)/(reduced?1:1100),0,1);
   if(result.feet>0){const dir=result.side==='left'?-1:result.side==='right'?1:0,dist=result.feet/460,
    x=pl.x+dir*W*0.42*dist*u,y=pl.y-H*0.9*dist*u-Math.sin(Math.PI*u)*H*0.18*(result.hr?1:0.6);ball(x,y,Math.max(2,10-8*u));}
   // Result on up to two lines: what happened, then how early or late (so players can adjust).
   ctx.textAlign='center';ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=5;
   const [main,sub]=result.label.split(' · ');
   ctx.font=`800 ${result.hr?30:22}px "Baloo 2",sans-serif`;ctx.fillStyle=result.hr?'#f2b33d':'#fff';
   ctx.strokeText(main,W/2,H*0.55);ctx.fillText(main,W/2,H*0.55);
   if(sub){ctx.font='800 16px "Nunito",sans-serif';ctx.fillStyle='#fff';ctx.strokeText(sub,W/2,H*0.55+24);ctx.fillText(sub,W/2,H*0.55+24);}
   if(u>=1&&now-resultAt>1300)nextPitch(now);
  }
  bat(now);
  ctx.textAlign='left';ctx.font='800 16px "Nunito",sans-serif';ctx.fillStyle='#fff';ctx.fillText(`HR ${hrs}`,12,H*0.2-10);
  ctx.textAlign='right';ctx.fillText(`Pitch ${Math.min(i+1,pitches.length)}/${pitches.length}`,W-12,H*0.2-10);
  requestAnimationFrame(draw);
 }

 function nextPitch(now){
  i++;if(i>=pitches.length){phase='done';alive=false;onDone(swings);return;}
  startPitch(now);
 }
 function startPitch(now){
  phase='windup';swingAt=null;result=null;t0=now+700;
  if(label)label.textContent='Get ready…';
  setTimeout(()=>{if(!alive)return;phase='pitch';t0=performance.now();if(label)label.textContent=`${pitches[i].label}`;},700);
 }
 function finishPitch(swing,now){
  swings[i]=swing;result=outcome(pitches[i],swing);resultAt=now;phase='result';
  if(result.hr){hrs++;fx('crack');setTimeout(()=>fx('cheer'),220);}
  else if(result.feet>0)fx('contact');else if(result.kind==='whiff')fx('whiff');else fx('mitt');
  if(label)label.textContent=`${pitches[i].label} · ${pitches[i].mph} mph`;
 }
 function swing(now){
  if(phase!=='pitch'||swingAt!=null)return;
  swingAt=now;fx('swing');finishPitch(Math.round(now-t0),now);
 }

 canvas.addEventListener('pointerdown',e=>{e.preventDefault();swing(performance.now());});
 const key=e=>{if(e.code==='Space'&&document.contains(canvas)){e.preventDefault();swing(performance.now());}};
 addEventListener('keydown',key);
 addEventListener('resize',()=>{({W,H}=size());});
 const start=wrap.querySelector('[data-derby-start]');
 const go=()=>{start?.remove();startPitch(performance.now());};
 if(start)start.addEventListener('click',go);else go();
 requestAnimationFrame(draw);
}
