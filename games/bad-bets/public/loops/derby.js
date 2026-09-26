// Home Run Derby batting screen, Oops sticker style. 10 pitches; tap, press space, or press A on a game
// controller to swing. The server re-scores the same swing times, so this file is only what you see and feel.
//
// How it's built (web versions of the ideas in Apple's "Starting a game port" chapters):
// - A tiny camera: the field is laid out in real feet (bases 90 ft apart, mound 60.5 ft, wall ~400 ft) and every
//   point is projected to the screen, so depth, the ball growing toward you and the home-run flight are consistent.
// - Frame pacing: one requestAnimationFrame loop; everything moves by elapsed time, never by frame count.
// - Textures: the static ballpark is drawn once into an offscreen canvas and copied each frame.
// - Input: touch/click and keyboard use the event's own timestamp; game controllers are polled every frame.
// - Life cycle: if the page is hidden mid-pitch, that pitch is replayed instead of counting as a take.
// - Timing contract (don't break it): the ball reaches the plate exactly `pitch.ms` after release (t0).
import {outcome,WINDOW} from './derby-sim.js';
import {fx,unlock} from './sfx.js';

const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const C={ink:'#1c2433',teal:'#087F98',butter:'#F4CD72',paper:'#F8F7F3',aqua:'#CBE8EB',coral:'#E98D7D',red:'#e05a47',
 lav:'#BAB4EA',blue:'#3b6fd6',grass:'#5fae5f',grass2:'#54a055',dirt:'#d9a066',dirt2:'#c98a4b',chalk:'#fffdf6'};
const WINDUP=700,SWING_MS=150,HITSTOP=70;
const wallR=th=>330+70*Math.cos(2*clamp(th,-Math.PI/4,Math.PI/4)); // 330 down the lines, 400 to center

export function mountDerby(wrap,pitches,{onDone,target=null}){
 const canvas=wrap.querySelector('canvas'),ctx=canvas.getContext('2d'),label=wrap.querySelector('[data-derby-label]');
 let W,H,F,HZ,DPR,bg=null,stale=false;
 // ?fps=1 shows frame rate and the slowest frame time, to check smoothness on a real phone.
 const showFps=/[?&]fps=1/.test(location.search);let fpsN=0,fpsT=0,fpsShown='',worst=0;
 const CAM={y:16,z:-26};
 // World (x = right, y = up, z = toward center field, in feet) to screen. s = pixels per foot at that depth.
 const P=(x,y,z)=>{const d=Math.max(1,z-CAM.z);return {x:W/2+x*F/d,y:HZ+(CAM.y-y)*F/d,s:F/d};};
 function size(){
  const w=wrap.clientWidth,h=Math.round(w*1.4);DPR=Math.min(2,devicePixelRatio||1); // cap: battery and iMessage memory
  canvas.width=Math.round(w*DPR);canvas.height=Math.round(h*DPR);canvas.style.height=h+'px';
  W=w;H=h;HZ=H*0.26;F=H*0.9425;bg=null; // plate lands at 84% of the height, mound at 43%
 }
 size();

 // ---------- the ballpark, drawn once ----------
 function poly(c,pts,fill,stroke,lw){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||2;c.lineJoin='round';c.stroke();}}
 const arc=(r,y,from=-1.1,to=1.1,n=48)=>Array.from({length:n+1},(_,i)=>{const th=from+(to-from)*i/n,R=typeof r==='function'?r(th):r;return P(R*Math.sin(th),y,R*Math.cos(th));});
 function buildPark(){
  const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;const g=c.getContext('2d');g.setTransform(DPR,0,0,DPR,0,0);
  // sky
  const sky=g.createLinearGradient(0,0,0,HZ);sky.addColorStop(0,C.aqua);sky.addColorStop(1,C.paper);g.fillStyle=sky;g.fillRect(0,0,W,H);
  for(const [cx,cy,s] of [[0.18,0.05,1],[0.8,0.035,0.8],[0.55,0.08,0.6]]){g.fillStyle='#fff';g.strokeStyle=C.ink;g.lineWidth=2;g.beginPath();
   const x=cx*W,y=cy*H,r=10*s;g.arc(x,y,r,Math.PI*0.5,Math.PI*1.5);g.arc(x+r*1.2,y-r*0.6,r*1.2,Math.PI,0);g.arc(x+r*2.4,y,r,Math.PI*1.5,Math.PI*0.5);g.closePath();g.fill();g.stroke();}
  // grass first (the stands and wall are drawn over anything past the wall), with mowing stripes (bands of equal depth, so they narrow with distance)
  for(let z=wallR(0)+10,i=0;z>-20;z-=24,i++){const a=Math.max(z-24,-20);
   poly(g,[P(-600,0,z),P(600,0,z),P(600,0,a),P(-600,0,a)],i%2?C.grass:C.grass2);}
  // warning track
  poly(g,[...arc(wallR,0,-1.25,1.25),...arc(th=>wallR(th)-14,0,-1.25,1.25).reverse()],C.dirt);
  // stands: back rows first, a bowl of crowd dots
  const standTop=arc(th=>wallR(th)+130,62,-1.25,1.25),wallTop=arc(wallR,10,-1.25,1.25);
  poly(g,[...standTop,...wallTop.slice().reverse()],'#efe6f7',C.ink,2.5);
  const crowd=[C.teal,C.coral,C.butter,C.lav,C.blue,C.paper,C.red];let k=0;
  for(let row=0;row<9;row++){const R0=row*13+18,y0=13+row*5.4;
   for(let th=-1.25;th<=1.25;th+=0.018){const R=wallR(th)+R0,p=P(R*Math.sin(th),y0,R*Math.cos(th));if(p.x<-6||p.x>W+6)continue;
    const r=Math.max(1.1,p.s*3.1);k=(k*1103515245+12345)&0x7fffffff;g.fillStyle=crowd[k%crowd.length];g.beginPath();g.arc(p.x,p.y-r,r,0,Math.PI*2);g.fill();
    if(r>1.8){g.fillStyle='#f3d2b8';g.beginPath();g.arc(p.x,p.y-r*2.3,r*0.62,0,Math.PI*2);g.fill();}}}
  // scoreboard over center field
  const sb=P(0,62,wallR(0)+132),sw=W*0.34,sh=H*0.07;
  g.fillStyle=C.ink;g.fillRect(sb.x-2,sb.y,4,H*0.02);
  g.fillStyle=C.teal;g.strokeStyle=C.ink;g.lineWidth=3;g.beginPath();g.roundRect(sb.x-sw/2,sb.y-sh,sw,sh,8);g.fill();g.stroke();
  g.fillStyle=C.paper;g.font=`800 ${Math.round(sh*0.42)}px "Baloo 2",sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('LOOPS PARK',sb.x,sb.y-sh/2+1);
  // outfield wall with the yellow home-run line
  const wallBase=arc(wallR,0,-1.25,1.25);
  poly(g,[...wallTop,...wallBase.slice().reverse()],C.teal,C.ink,2.5);
  g.strokeStyle=C.butter;g.lineWidth=3;g.beginPath();wallTop.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke();
  const m400=P(0,4.5,wallR(0));g.fillStyle=C.paper;g.font=`800 ${Math.max(9,m400.s*7)}px "Baloo 2",sans-serif`;g.fillText('400',m400.x,m400.y);
  // infield dirt, infield grass, base paths
  poly(g,Array.from({length:60},(_,i)=>{const a=i/60*Math.PI*2;return P(Math.cos(a)*95,0,60.5+Math.sin(a)*95);}),C.dirt,C.dirt2,1.5);
  const b=63.64,inset=0.78;
  poly(g,[P(0,0,6),P(b*inset,0,b),P(0,0,b*2*0.93),P(-b*inset,0,b)],C.grass);
  for(const [x,z] of [[b,b],[0,b*2],[-b,b]]){poly(g,[P(x-1.3,0,z),P(x,0,z+1.3),P(x+1.3,0,z),P(x,0,z-1.3)],'#fff',C.ink,1);}
  // mound and rubber
  poly(g,Array.from({length:40},(_,i)=>{const a=i/40*Math.PI*2;return P(Math.cos(a)*9,0,60.5+Math.sin(a)*9);}),C.dirt,C.dirt2,1.5);
  poly(g,[P(-1,0.2,60),P(1,0.2,60),P(1,0.2,60.5),P(-1,0.2,60.5)],'#fff');
  // foul lines
  g.strokeStyle=C.chalk;g.lineWidth=2;for(const s of [-1,1]){const a=P(0,0,0),e=P(s*233,0,233);g.beginPath();g.moveTo(a.x,a.y);g.lineTo(e.x,e.y);g.stroke();}
  // home plate circle, batter's boxes, plate
  poly(g,Array.from({length:50},(_,i)=>{const a=i/50*Math.PI*2;return P(Math.cos(a)*13,0,Math.sin(a)*13);}),C.dirt,C.dirt2,1.5);
  g.lineWidth=2;g.strokeStyle=C.chalk;for(const s of [-1,1]){poly(g,[P(s*1.5,0,-3),P(s*5.5,0,-3),P(s*5.5,0,3),P(s*1.5,0,3)],null,C.chalk,2);}
  poly(g,[P(-0.71,0,0.71),P(0.71,0,0.71),P(0.71,0,0),P(0,0,-0.71),P(-0.71,0,0)],'#fff',C.ink,1.5);
  bg=c;
 }

 // ---------- Chip, the Oops mascot ----------
 // A chip seen from the front (pitcher) or the back (batter). r = body radius in pixels.
 function chip(x,y,r,{face=true,cap=C.blue}={}){
  ctx.save();ctx.lineJoin=ctx.lineCap='round';
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,r+r*0.22,0,Math.PI*2);ctx.fill();          // sticker border
  ctx.fillStyle=C.teal;ctx.strokeStyle=C.ink;ctx.lineWidth=Math.max(1.5,r*0.14);ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.setLineDash([r*0.28,r*0.34]);ctx.strokeStyle=C.paper;ctx.lineWidth=r*0.16;ctx.beginPath();ctx.arc(x,y,r*0.82,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=C.paper;ctx.strokeStyle=C.ink;ctx.lineWidth=Math.max(1,r*0.09);ctx.beginPath();ctx.arc(x,y,r*0.62,0,Math.PI*2);ctx.fill();ctx.stroke();
  if(face){ctx.fillStyle=C.ink;for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(x+s*r*0.22,y-r*0.08,r*0.07,r*0.11,0,0,Math.PI*2);ctx.fill();}
   ctx.fillStyle=C.red;ctx.beginPath();ctx.moveTo(x-r*0.2,y+r*0.14);ctx.quadraticCurveTo(x,y+r*0.46,x+r*0.2,y+r*0.14);ctx.closePath();ctx.fill();
   ctx.globalAlpha=0.45;for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(x+s*r*0.4,y+r*0.12,r*0.09,r*0.06,0,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
  else{ctx.fillStyle=C.teal;ctx.font=`800 ${Math.round(r*0.62)}px "Baloo 2",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('1',x,y+r*0.05);}
  // cap (pitcher) or batting helmet (batter)
  ctx.fillStyle=cap;ctx.strokeStyle=C.ink;ctx.lineWidth=Math.max(1.2,r*0.1);ctx.beginPath();
  ctx.moveTo(x-r*0.98,y-r*0.28);ctx.bezierCurveTo(x-r*0.98,y-r*1.28,x+r*0.98,y-r*1.28,x+r*0.98,y-r*0.28);ctx.quadraticCurveTo(x,y-r*0.46,x-r*0.98,y-r*0.28);ctx.fill();ctx.stroke();
  if(face){ctx.beginPath();ctx.ellipse(x,y-r*0.3,r*0.62,r*0.12,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
  else{ctx.beginPath();ctx.ellipse(x+r*0.78,y-r*0.2,r*0.24,r*0.3,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
  ctx.restore();
 }
 const limb=(x1,y1,x2,y2,w)=>{ctx.strokeStyle='#fff';ctx.lineWidth=w+w*1.4;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.strokeStyle=C.ink;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
 const shoe=(x,y,w)=>{ctx.fillStyle=C.red;ctx.strokeStyle=C.ink;ctx.lineWidth=Math.max(1,w*0.18);ctx.beginPath();ctx.roundRect(x-w*0.55,y-w*0.3,w*1.1,w*0.6,w*0.3);ctx.fill();ctx.stroke();};

 function pitcher(now){
  const m=P(0,0,60.5),r=Math.max(8,m.s*2.3*1.25),cx=m.x,cy=m.y-r*2.2;
  // windup: 0 = set, 1 = release. Leg kick and arm come over the top.
  let w=0;if(phase==='windup')w=clamp(1-(t0-now)/WINDUP,0,1);else if(phase==='pitch')w=clamp(1+(now-t0)/180,1,2);
  ctx.lineCap='round';const lw=Math.max(2,r*0.2);
  const kick=phase==='windup'?Math.sin(w*Math.PI)*r*0.7:0;
  limb(cx-r*0.35,cy+r*0.8,cx-r*0.45,m.y-r*0.15,lw);limb(cx+r*0.35,cy+r*0.8,cx+r*0.45+kick*0.3,m.y-r*0.15-kick,lw);
  shoe(cx-r*0.45,m.y-r*0.1,r*0.5);shoe(cx+r*0.45+kick*0.3,m.y-r*0.1-kick,r*0.5);
  // glove arm (left of screen), throwing arm (right) swings back, up and through
  limb(cx-r*0.8,cy+r*0.1,cx-r*1.35,cy-r*0.1,lw);ctx.fillStyle=C.dirt2;ctx.strokeStyle=C.ink;ctx.lineWidth=lw*0.6;ctx.beginPath();ctx.arc(cx-r*1.45,cy-r*0.15,r*0.32,0,Math.PI*2);ctx.fill();ctx.stroke();
  const a=w<1?Math.PI*0.2-w*Math.PI*1.2:-Math.PI+(w-1)*Math.PI*1.4,hx=cx+r*0.85+Math.cos(a)*r*0.9,hy=cy+Math.sin(a)*r*0.9;
  chip(cx,cy,r);limb(cx+r*0.8,cy,hx,hy,lw);
  if(phase==='windup'){ctx.fillStyle='#fff';ctx.strokeStyle=C.ink;ctx.lineWidth=1;ctx.beginPath();ctx.arc(hx,hy,Math.max(2,r*0.16),0,Math.PI*2);ctx.fill();ctx.stroke();}
  return {x:hx,y:hy};
 }

 function batter(now){
  const base=P(-4.6,0,0),r=H*0.07,cx=base.x,cy=base.y-r*2.1,lw=Math.max(3,r*0.2);
  limb(cx-r*0.45,cy+r*0.8,cx-r*0.8,base.y-r*0.2,lw);limb(cx+r*0.45,cy+r*0.8,cx+r*0.85,base.y-r*0.2,lw);
  shoe(cx-r*0.85,base.y-r*0.12,r*0.55);shoe(cx+r*0.9,base.y-r*0.12,r*0.55);
  chip(cx,cy,r,{face:false});
  // bat pivots at the hands over the right shoulder; the swing sweeps across the plate
  const sw=swingAt!=null?clamp((now-swingAt)/SWING_MS,0,1):0,ease=1-Math.pow(1-sw,3);
  const ang=-2.35+ease*2.65,hx=cx+r*0.95,hy=cy-r*0.25,len=r*2.6;
  limb(cx+r*0.55,cy-r*0.05,hx,hy,lw);
  const tx=hx+Math.cos(ang)*len,ty=hy+Math.sin(ang)*len;
  ctx.lineCap='round';ctx.strokeStyle='#fff';ctx.lineWidth=r*0.5;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(tx,ty);ctx.stroke();
  ctx.strokeStyle=C.ink;ctx.lineWidth=r*0.3;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(tx,ty);ctx.stroke();
  ctx.strokeStyle='#c98a4b';ctx.lineWidth=r*0.2;ctx.beginPath();ctx.moveTo(hx+Math.cos(ang)*r*0.5,hy+Math.sin(ang)*r*0.5);ctx.lineTo(tx,ty);ctx.stroke();
  ctx.fillStyle=C.butter;ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.beginPath();ctx.arc(hx,hy,r*0.2,0,Math.PI*2);ctx.fill();ctx.stroke(); // batting gloves
 }

 function ballAt(p,sizeMul=1,minR=2.2){
  const r=Math.max(minR,p.s*0.12*3.4*sizeMul);
  ctx.fillStyle='#fff';ctx.strokeStyle=C.ink;ctx.lineWidth=Math.max(1,r*0.22);ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.stroke();
  if(r>4){ctx.strokeStyle=C.red;ctx.lineWidth=Math.max(1,r*0.14);ctx.beginPath();ctx.arc(p.x-r*0.9,p.y,r*0.7,-0.9,0.9);ctx.stroke();ctx.beginPath();ctx.arc(p.x+r*0.9,p.y,r*0.7,Math.PI-0.9,Math.PI+0.9);ctx.stroke();}
  return r;
 }
 function shadow(x,z,y){const g=P(x,0,z),r=Math.max(1.5,g.s*0.12*3.4)*clamp(1-y/140,0.3,1);ctx.fillStyle='rgba(28,36,51,.22)';ctx.beginPath();ctx.ellipse(g.x,g.y,r*1.1,r*0.4,0,0,Math.PI*2);ctx.fill();}

 // The pitch in the air: from the pitcher's hand (x 1.2, y 6.5, z 57) to the strike point (0, 2.6, 0).
 // Linear in time so it arrives exactly at pitch.ms. Sliders break late, changeups dive.
 function pitchPos(p,e){
  const x=1.2*(1-e)+(p.type==='slider'?Math.sin(e*Math.PI*0.9)*1.6*e:0),y=6.5*(1-e)+2.6*e-(p.type==='changeup'?Math.sin(e*Math.PI)*0.9:0);
  return {x,y,z:57*(1-e)};
 }

 // ---------- state ----------
 const swings=[],hist=[];let i=0,phase='ready',t0=0,swingAt=null,result=null,resultAt=0,hrs=0,alive=true,contact=null,parts=[],shakeUntil=0,shakeAmp=0,flashAt=-1e9;

 function feedback(r){
  if(r.kind==='take')return 'Strike looking';
  const off=Math.abs(r.err),when=off<18?'Perfect':`${off<85?'Just ':''}${r.err<0?'early':'late'}`;
  return r.kind==='whiff'?`Strike! ${when==='Perfect'?'':when[0].toUpperCase()+when.slice(1)}`.trim():when[0].toUpperCase()+when.slice(1);
 }
 function flight(now){ // where the batted ball is, u from 0 to 1 (drawn larger than life so you can follow it)
  const r=result,dur=r.hr?1900:r.kind==='fly'?1500:1000,u=clamp((now-resultAt-HITSTOP)/(reduced?1:dur),0,1);
  const ang=clamp(r.err/200,-1,1)*0.45,wall=wallR(ang);
  const D=r.hr?Math.max(r.feet,wall+30):r.kind==='fly'?Math.min(r.feet,wall-8):r.feet;
  const h=r.hr?42:r.kind==='fly'?32:0,land=r.hr?10+(D-wall)*0.45:0; // the stands rise about 0.45 ft per ft past the wall
  const y=h?2.6+4*h*u*(1-u)+u*(land-2.6):Math.abs(Math.sin(u*Math.PI*3))*5*(1-u);
  return {x:D*u*Math.sin(ang),y:Math.max(0,y),z:D*u*Math.cos(ang),u,dur};
 }
 function burst(x,y,n=26){if(reduced)return;const cs=[C.butter,C.coral,C.teal,C.lav,'#fff'];
  for(let k=0;k<n;k++){const a=Math.random()*Math.PI*2,v=60+Math.random()*140;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-60,c:cs[k%cs.length],t:0,life:900+Math.random()*500});}}

 // ---------- HUD ----------
 function pill(x,y,text,bg,fg,align='left'){
  ctx.font='800 13px "Nunito",sans-serif';const w=ctx.measureText(text).width+18,h=24,X=align==='right'?x-w:align==='center'?x-w/2:x;
  ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(X-2,y-2,w+4,h+4,14);ctx.fill();
  ctx.fillStyle=bg;ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(X,y,w,h,12);ctx.fill();ctx.stroke();
  ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,X+w/2,y+h/2+1);
 }
 function hud(now){
  pill(10,10,`HR ${hrs}  ·  ${Math.min(i+1,pitches.length)}/${pitches.length}`,C.ink,C.paper);
  if(target)pill(W-10,10,`Beat ${target.name}: ${target.hr}`,C.butter,C.ink,'right');
  // box score dots: one per pitch
  for(let k=0;k<pitches.length;k++){const x=16+k*13,y=46,h=hist[k];ctx.beginPath();ctx.arc(x,y,4.5,0,Math.PI*2);
   ctx.fillStyle=h==null?'rgba(255,255,255,.7)':h.hr?C.butter:h.feet>0?C.paper:C.coral;ctx.fill();ctx.strokeStyle=C.ink;ctx.lineWidth=1.5;ctx.stroke();}
  if(phase==='pitch'||phase==='result'){const p=pitches[i];if(p)pill(W/2,H-36,`${p.label} · ${p.mph} mph`,'rgba(28,36,51,.85)',C.paper,'center');}
 }
 function banner(now){
  const r=result,landed=r.feet>0&&!reduced?resultAt+HITSTOP+flight(now).dur:resultAt+HITSTOP,age=now-landed;if(age<0)return;
  const big=r.hr?'HOME RUN!':r.kind==='fly'?'Warning track':r.kind==='ground'?'Grounder':r.kind==='whiff'?'Strike!':'Strike looking';
  const tick=r.hr&&!reduced?Math.round(r.feet*clamp(age/600,0,1)):r.feet;
  const sub=r.feet>0?`${tick} ft · ${feedback(r)}`:r.kind==='whiff'?feedback(r).replace(/^Strike! ?/,'')||'Swing and a miss':'Take';
  const pop=reduced?1:Math.min(1,0.6+age/250)*(age<330?1+0.12*Math.sin(clamp(age/260,0,1)*Math.PI):1);
  ctx.save();ctx.translate(W/2,H*0.5);ctx.scale(pop,pop);
  ctx.font=`800 ${r.hr?34:24}px "Baloo 2",sans-serif`;const w=Math.max(ctx.measureText(big).width,150)+36,h=r.hr?78:64;
  ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(-w/2-4,-h/2-4,w+8,h+8,20);ctx.fill();
  ctx.fillStyle=r.hr?C.butter:C.paper;ctx.strokeStyle=C.ink;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-w/2,-h/2,w,h,16);ctx.fill();ctx.stroke();
  ctx.fillStyle=C.ink;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillText(big,0,r.hr?2:-2);
  ctx.font='800 14px "Nunito",sans-serif';ctx.fillText(sub,0,h/2-12);ctx.restore();
 }
 function pow(now){
  if(!contact||result.feet<=0)return;const age=now-resultAt;if(age>650)return;
  const s=(reduced?1:Math.min(1,age/90)*(1+0.15*Math.max(0,1-age/200)))*(result.hr?1:0.8),a=age>450?1-(age-450)/200:1,{x,y}=contact;
  ctx.save();ctx.globalAlpha=a;ctx.translate(x,y-8);ctx.rotate(-0.12);ctx.scale(s,s);
  const R=34,pts=14;ctx.beginPath();for(let k=0;k<pts*2;k++){const rr=k%2?R*0.62:R,an=k/(pts*2)*Math.PI*2;ctx.lineTo(Math.cos(an)*rr,Math.sin(an)*rr*0.8);}ctx.closePath();
  ctx.lineWidth=8;ctx.strokeStyle='#fff';ctx.stroke();ctx.fillStyle=C.butter;ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=C.ink;ctx.stroke();
  ctx.fillStyle=C.red;ctx.font='800 17px "Baloo 2",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(result.hr?'POW!':'CRACK!',0,1);ctx.restore();
 }
 // The timing ring closes on the strike point exactly when the ball gets there.
 function ring(now){
  const p=pitches[i],t=now-t0,left=p.ms-t;if(left<-120)return;
  const sp=P(0,2.6,0),r0=Math.max(6,sp.s*0.12*3.4),r=r0+Math.max(0,left)/p.ms*54,a=left<0?Math.max(0,1+left/120):clamp(t/250,0,1);
  ctx.globalAlpha=a*0.9;ctx.strokeStyle='#fff';ctx.lineWidth=6;ctx.beginPath();ctx.arc(sp.x,sp.y,r,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle=C.butter;ctx.lineWidth=3;ctx.beginPath();ctx.arc(sp.x,sp.y,r,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
 }

 // ---------- the loop ----------
 let last=0,padDown=false;
 function draw(now){
  if(!alive||!canvas.isConnected)return;
  const dt=Math.min(50,now-(last||now));last=now;
  pollPad(now);
  if(phase==='windup'&&now>=t0){phase='pitch';if(label)label.textContent=`${pitches[i].label} · ${pitches[i].mph} mph`;}
  if(!bg||(stale&&phase!=='pitch')){const b0=performance.now();buildPark();stale=false;if(showFps)console.log('park built in',(performance.now()-b0).toFixed(1),'ms');}
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);
  if(now<shakeUntil){const k=(shakeUntil-now)/200*shakeAmp;ctx.translate((Math.random()-0.5)*k,(Math.random()-0.5)*k);}
  ctx.drawImage(bg,0,0,W,H);
  const p=pitches[i];
  // batted ball flies behind everything in the foreground
  if(phase==='result'&&result&&result.feet>0){const f=flight(now);shadow(f.x,f.z,f.y);
   if(!reduced&&f.u>0&&f.u<1)for(let k=3;k>=1;k--){const g=flight(now-k*45),q=P(g.x,g.y,g.z);ctx.globalAlpha=0.18*(4-k);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(q.x,q.y,Math.max(4,q.s*0.9),0,Math.PI*2);ctx.fill();}
   ctx.globalAlpha=1;ballAt(P(f.x,f.y,f.z),2.4,5);
   if(result.hr&&f.u>=1&&!result.burst){result.burst=true;const l=P(f.x,f.y,f.z);burst(l.x,l.y,34);burst(W*0.25,H*0.12,22);burst(W*0.75,H*0.1,22);}}
  pitcher(now);
  if(phase==='pitch'&&p)ring(now);
  if(p&&(phase==='pitch'||(phase==='result'&&result&&result.feet===0))){const e=(now-t0)/p.ms;
   if(e<=1.3){const q=pitchPos(p,clamp(e,0,1.3));if(e>1)q.z=-8*(e-1)/0.3;shadow(q.x,q.z,q.y);ballAt(P(q.x,q.y,q.z));}
   if(phase==='pitch'&&swingAt==null&&now-t0>p.ms+260)finishPitch(null,now);}
  batter(now);
  if(phase==='result'&&result){pow(now);banner(now);const done=result.feet>0&&!reduced?resultAt+HITSTOP+flight(now).dur+(result.hr?1400:900):resultAt+1400;if(now>done)nextPitch(now);}
  // particles
  parts=parts.filter(q=>(q.t+=dt)<q.life);for(const q of parts){q.vy+=260*dt/1000;q.x+=q.vx*dt/1000;q.y+=q.vy*dt/1000;ctx.globalAlpha=1-q.t/q.life;ctx.fillStyle=q.c;ctx.fillRect(q.x-3,q.y-3,6,6);}ctx.globalAlpha=1;
  if(now-flashAt<140&&!reduced){ctx.fillStyle=`rgba(255,255,255,${0.45*(1-(now-flashAt)/140)})`;ctx.fillRect(0,0,W,H);}
  ctx.setTransform(DPR,0,0,DPR,0,0);hud(now);
  if(showFps){fpsN++;worst=Math.max(worst,dt);if(now-fpsT>=1000){fpsShown=`${Math.round(fpsN*1000/(now-fpsT))} fps · worst ${worst.toFixed(0)} ms`;fpsN=0;fpsT=now;worst=0;}
   ctx.font='800 12px "Nunito",sans-serif';ctx.textAlign='right';ctx.textBaseline='top';ctx.fillStyle=C.ink;ctx.fillText(fpsShown,W-10,40);}
  if(phase==='ready'){ctx.fillStyle='rgba(28,36,51,.35)';ctx.fillRect(0,H*0.42,W,56);ctx.fillStyle='#fff';ctx.font='800 20px "Baloo 2",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('Tap Play ball',W/2,H*0.42+28);}
  requestAnimationFrame(draw);
 }

 function nextPitch(now){i++;if(i>=pitches.length){phase='done';alive=false;onDone(swings);return;}startPitch(now);}
 function startPitch(now){phase='windup';swingAt=null;result=null;contact=null;t0=now+WINDUP;if(label)label.textContent='Get ready…';}
 function finishPitch(swing,now){
  swings[i]=swing;result=outcome(pitches[i],swing);hist[i]=result;resultAt=now;phase='result';
  if(result.feet>0){const sp=P(0,2.6,0);contact={x:sp.x,y:sp.y};flashAt=now;shakeUntil=reduced?0:now+200;shakeAmp=result.hr?9:result.kind==='fly'?5:2;}
  if(result.hr){hrs++;fx('crack');setTimeout(()=>fx('cheer'),220);}
  else if(result.feet>0)fx('contact');else if(result.kind==='whiff')fx('whiff');else fx('mitt');
 }
 // `when` is the input event's own timestamp (same clock as requestAnimationFrame), not when this code ran.
 function swing(when){
  if(phase!=='pitch'||swingAt!=null)return;
  swingAt=when;fx('swing');finishPitch(Math.round(when-t0),when);
 }

 // Game controllers: poll each frame (A, or either trigger, swings; Start begins).
 function pollPad(now){
  const pads=navigator.getGamepads?.()||[];let down=false;
  for(const g of pads){if(!g)continue;if(g.buttons[0]?.pressed||g.buttons[6]?.pressed||g.buttons[7]?.pressed)down=true;if(g.buttons[9]?.pressed&&phase==='ready')go();}
  if(down&&!padDown){if(phase==='ready')go();else swing(now);}
  padDown=down;
 }

 canvas.addEventListener('pointerdown',e=>{e.preventDefault();swing(e.timeStamp||performance.now());});
 const key=e=>{if(e.code==='Space'&&document.contains(canvas)){e.preventDefault();if(!e.repeat)swing(e.timeStamp||performance.now());}};
 addEventListener('keydown',key);
 addEventListener('resize',()=>{if(Math.round(wrap.clientWidth)!==Math.round(W))size();});
 // Life cycle: leaving mid-pitch replays that pitch when you come back; sound is resumed on return.
 const vis=()=>{if(!alive)return;if(document.hidden){if(phase==='windup'||(phase==='pitch'&&swingAt==null))phase='paused';}
  else{unlock();if(phase==='paused')startPitch(performance.now()+400);}};
 document.addEventListener('visibilitychange',vis);
 document.fonts?.ready.then(()=>{stale=true;}); // redraw the park with real fonts, but never mid-pitch
 const start=wrap.querySelector('[data-derby-start]');
 function go(){if(phase!=='ready')return;start?.remove();startPitch(performance.now());}
 if(start)start.addEventListener('click',go);else go();
 requestAnimationFrame(draw);
}
