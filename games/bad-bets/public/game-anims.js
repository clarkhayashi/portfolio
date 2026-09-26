// Short silent intro loops, one per game (plus the Herd round). Pure HTML + CSS.
// Sized in em so the phone card and the TV scale them with font-size. CSS is injected once.
// Every element's resting style is its final frame, so reduced motion (animation:none) shows the ending.
const BASE=`.ga{position:relative;height:13em;border-radius:1.1em;background:#eef6f7;overflow:hidden;margin:.9em 0;font-family:'Nunito',ui-rounded,sans-serif;color:#253345;line-height:1.2;text-align:left}
.ga>*{position:absolute;margin:0;white-space:nowrap}
.ga-e{animation-duration:var(--d,12s);animation-iteration-count:infinite;animation-timing-function:ease-in-out}
.ga-cx{translate:-50% 0}
.ga-card{background:#fff;border:.12em solid #8acbd2;border-radius:.7em;padding:.25em .6em;font-weight:800}
.ga-q{background:#fff;border:.12em solid #cfe3e6;border-radius:.8em;padding:.3em .8em;font:800 1.05em/1.2 'Baloo 2','Nunito',sans-serif}
.ga-sm{font-size:.8em}.ga-xs{font-size:.72em;font-weight:800}
.ga-big{font-size:1.7em;line-height:1}.ga-md{font-size:1.3em;line-height:1}
.ga-win{background:#cdeef2;border-color:#087f98}
.ga-bad{color:#ad414b;border-color:#ad414b}
.ga-teal{color:#087f98}
.ga-slot{border:.1em dashed #8acbd2;border-radius:.5em;padding:.2em .45em;font-weight:800;color:#5d7480;background:#ffffff80}
.ga-tile{background:#fff;border:.1em solid #8acbd2;border-radius:.45em;padding:.12em .2em}
.ga-cap{left:0;right:0;bottom:.55em;text-align:center;font-weight:800;font-size:.95em;white-space:normal}
.ga-phone{width:6.4em;height:4.6em;background:#fff;border:.15em solid #8acbd2;border-radius:.8em}
.ga-phone svg{position:absolute;inset:.3em;width:calc(100% - .6em);height:calc(100% - .6em);overflow:visible}
.ga-phone path{fill:none;stroke:#253345;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1}
.ga-ring{width:6.4em;height:4.6em;border:.25em solid #087f98;border-radius:.8em}
.ga-line{height:.2em;border-radius:.1em;background:#8acbd2}
@media(prefers-reduced-motion:reduce){.ga-e{animation:none!important}}`;

const Y=y=>`${(y/13*100).toFixed(2)}%`;
// Visible during one or more windows [a,b] (percent of the loop). Opacity is set at both ends.
function vis(w,from='scale(.6)'){
 const ws=Array.isArray(w[0])?w:[w];let k=`0%{opacity:0;transform:${from}}`,fin=false;
 for(const [a,b] of ws){k+=`${a}%{opacity:0;transform:${from}}${a+3}%,${b}%{opacity:1;transform:none}${Math.min(b+3,99)}%{opacity:0;transform:none}`;if(a<86&&b>=86)fin=true;}
 return {k:k+'100%{opacity:0;transform:none}',fin};
}
// Move between points: stops are [percent, x, y, opacity]. The resting style is the last stop.
function move(stops,fin=true){return {k:stops.map(([p,x,y,o,extra=''])=>`${p}{left:${x}%;top:${Y(y)};opacity:${o};${extra}}`).join(''),fin};}

function build(id){
 const css=[];let n=0;
 const A=(anim,rest='')=>{const c=`ga-${id}-${n++}`;css.push(`.${c}{animation-name:${c};${anim.fin?'':'opacity:0;'}${rest}}@keyframes ${c}{${anim.k}}`);return c;};
 // One actor, centred on x% at y em from the top.
 const E=(x,y,html,anim,{cls='',style='',cx=true}={})=>`<div class="ga-e${cx?' ga-cx':''} ${cls} ${A(anim)}" style="left:${x}%;top:${Y(y)};${style}">${html}</div>`;
 const caps=(beats,list)=>list.map((t,i)=>`<div class="ga-cap ga-e ${A(vis([beats[i]+2,i===list.length-1?94:beats[i+1]-3],'translateY(.3em)'))}">${t}</div>`).join('');
 return {A,E,caps,css};
}

const PLAY=['🐱','🐶','🐰','🦊'],ROW=[14,38,62,86];

const GAMES={
 herd:{d:12,label:'one player writes a this-or-that, everyone picks a side, the smaller side loses, and a player alone on their side is the Black Sheep.',
  beats:[0,25,51,70],caps:['✍️ One player writes a this-or-that','👆 Everyone picks a side','🐑 Bigger side wins','Alone? You’re the Black Sheep'],
  make({E,A}){
   const q=E(50,.9,'Beach or mountains?',vis([4,94],'scale(.8)'),{cls:'ga-q'});
   const opt=(x,t,win)=>E(x,3.6,t,{k:`0%,14%{opacity:0;transform:translateY(-.4em)}20%,94%{opacity:1;transform:none}100%{opacity:0;transform:none}`,fin:true},{cls:'ga-card',style:'width:40%;text-align:center'})+(win?E(x,3.6,t,vis([57,94],'none'),{cls:'ga-card ga-win',style:'width:40%;text-align:center'}):'');
   const SHEEP=[[40,8],[47,17],[54,26],[61,35],[68,78,1]];
   const sheep=SHEEP.map(([x0,x1,lone])=>{
    const hop=`33%,39%,45%,51%{transform:translateY(-.25em)}36%,42%,48%{transform:none}`;
    const k=`0%{left:${x0}%;opacity:0;transform:none;filter:none}3%,30%{left:${x0}%;opacity:1;transform:none;filter:none}${hop}54%,60%{left:${x1}%;opacity:1;transform:none;filter:none}`+
     (lone?`64%{left:${x1}%;filter:brightness(.25);transform:none}66%,70%{transform:translateX(-.1em);filter:brightness(.25)}68%,72%{transform:translateX(.1em);filter:brightness(.25)}74%,94%{left:${x1}%;opacity:1;transform:none;filter:brightness(.25)}100%{left:${x1}%;opacity:0;transform:none;filter:none}`
      :`94%{left:${x1}%;opacity:1;transform:none;filter:none}100%{left:${x1}%;opacity:0;transform:none;filter:none}`);
    return E(x1,7.8,'🐑',{k,fin:true},{cls:'ga-big',cx:false,style:lone?'filter:brightness(.25)':''});
   }).join('');
   const pay=E(86,6,'pays up',{k:`0%,68%{opacity:0;transform:none}72%,92%{opacity:1;transform:translateY(-.4em)}100%{opacity:0;transform:translateY(-.4em)}`,fin:true},{cls:'ga-bad',style:'font-weight:800;transform:translateY(-.4em)'});
   return q+opt(25,'A · Beach',true)+opt(75,'B · Mountains')+sheep+pay;
  }},

 auction:{d:12,label:'players take turns raising a dollar or passing, the last bidder wins the lot, each win fills a slot in their build, and judges pick the best build.',
  beats:[0,28,52,74],caps:['💵 Raise by $1, $2 or $5','Last one bidding wins the lot','Each win fills a slot','Judges pick the best build'],
  make({E}){
   let h=E(50,.7,'Lot: 🌮 Taco Bell',vis([0,52],'scale(.8)'),{cls:'ga-q'});
   h+=E(18,3.2,'🐱',vis([0,94]),{cls:'ga-big'})+E(82,3.2,'🐶',vis([0,94]),{cls:'ga-big'});
   h+=E(18,5.2,'$20 left',vis([0,36],'none'),{cls:'ga-xs ga-teal'})+E(18,5.2,'$17 left',vis([37,94],'none'),{cls:'ga-xs ga-teal'})+E(82,5.2,'$20 left',vis([0,94],'none'),{cls:'ga-xs ga-teal'});
   h+=E(50,3.5,'🐱 bids $1',vis([3,8]),{cls:'ga-card ga-sm'})+E(50,3.5,'🐶 bids $2',vis([11,16]),{cls:'ga-card ga-sm'})+E(50,3.5,'🐱 bids $3',vis([19,24]),{cls:'ga-card ga-sm'})+E(50,3.5,'🐶 passes',vis([27,32]),{cls:'ga-card ga-sm ga-bad'});
   h+=E(50,3.5,'Sold to 🐱 for $3',vis([35,50]),{cls:'ga-card ga-sm ga-win'});
   // Beat 3: the lot flies into the first empty slot.
   h+=['Main','Side','Drink','Dessert'].map((t,i)=>E(20+i*20,6.4,t,vis([53+i,74],'none'),{cls:'ga-slot ga-xs'})).join('');
   h+=E(20,6.2,'🌮',move([['0%',42,.9,0],['53%',42,.9,0],['55%',42,.9,1],['60%',20,6.2,1],['62%,100%',20,6.2,0]],false),{cls:'ga-md'});
   h+=E(20,6.4,'🌮 Main',vis([60,74]),{cls:'ga-slot ga-xs ga-win',style:'color:#253345'});
   // Beat 4: two finished builds, the judges' stars.
   h+=E(27,6.4,'🐱 🌮🍟🥤🍦',vis([75,94],'none'),{cls:'ga-card ga-sm'})+E(73,6.4,'🐶 🍔🥗🧃🍰',vis([75,94],'none'),{cls:'ga-card ga-sm'});
   h+=E(27,6.4,'🐱 🌮🍟🥤🍦',vis([87,94],'none'),{cls:'ga-card ga-sm ga-win'});
   h+=E(21,8.6,'⭐',vis([78,94]),{cls:'ga-md'})+E(33,8.6,'⭐',vis([81,94]),{cls:'ga-md'})+E(73,8.6,'⭐',vis([84,94]),{cls:'ga-md'});
   return h;
  }},

 quips:{d:12,label:'two players write answers to a prompt, the answers show with no names, the room votes in secret, and the answer with the most votes wins.',
  beats:[0,26,50,74],caps:['✍️ Two players write answers','Answers show with no names','🤫 The room votes in secret','Most votes wins'],
  make({E}){
   let h=E(50,.7,'A terrible hotel name?',vis([0,94],'scale(.8)'),{cls:'ga-q'});
   [[27,'🐱'],[73,'🐶']].forEach(([x,f])=>{h+=E(x,3.1,f,vis([[0,25],[84,94]]),{cls:'ga-big'})+E(x,3.1,'👤',vis([28,81]),{cls:'ga-big'});});
   const wiggle={k:`0%,3%{opacity:0;transform:none}6%,10%,14%,18%{opacity:1;transform:rotate(-18deg)}8%,12%,16%,20%{opacity:1;transform:rotate(12deg)}22%{opacity:1;transform:none}25%,100%{opacity:0;transform:none}`,fin:false};
   h+=E(40,3.4,'✏️',wiggle,{cls:'ga-md'})+E(86,3.4,'✏️',wiggle,{cls:'ga-md'});
   h+=E(27,5.4,'Almost Clean Inn',vis([28,94],'scaleX(0)'),{cls:'ga-card ga-sm'})+E(73,5.4,'Hotel Maybe',vis([31,94],'scaleX(0)'),{cls:'ga-card ga-sm'});
   h+=E(27,5.4,'Almost Clean Inn',vis([80,94],'none'),{cls:'ga-card ga-sm ga-win'});
   ['🐰','🦊','🐻','🐸'].forEach((f,i)=>{const x=20+i*20;h+=E(x,8.8,f,vis([50,94]),{cls:'ga-md'})+E(x,7.4,'🗳️',vis([54+i*3,72]),{cls:'ga-sm'});});
   h+=E(27,7.4,'3 votes',vis([75,94],'none'),{cls:'ga-xs ga-teal'})+E(73,7.4,'1 vote',vis([75,94],'none'),{cls:'ga-xs ga-teal'});
   return h;
  }},

 shadow:{d:12,label:'two players face off in person: on 3, 2, 1 the attacker points and the other looks, the same direction is a hit, a dodge swaps roles, and the first to 3 hits wins.',
  beats:[0,30,56,78],caps:['3, 2, 1, point!','Same way? That’s a hit','Dodge it? Swap roles','First to 3 hits wins'],
  make({E}){
   let h=['3','2','1'].map((t,i)=>E(50,.8,t,vis([2+i*8,6+i*8]),{cls:'ga-big ga-teal',style:'font-weight:900'})).join('');
   h+=E(24,3.8,'🐱',vis([0,94]),{cls:'ga-big'})+E(76,3.8,'🐶',vis([0,94]),{cls:'ga-big'});
   h+=E(24,6,'👉 points',vis([0,62],'none'),{cls:'ga-xs ga-teal'})+E(76,6,'👀 looks',vis([0,62],'none'),{cls:'ga-xs ga-teal'});
   h+=E(24,6,'👀 looks',vis([64,94],'none'),{cls:'ga-xs ga-teal'})+E(76,6,'👉 points',vis([64,94],'none'),{cls:'ga-xs ga-teal'});
   h+=E(24,1.8,'⬆️',vis([25,50]),{cls:'ga-md'})+E(76,1.8,'⬆️',vis([27,50]),{cls:'ga-md'});
   h+=E(50,3.9,'💥 Hit!',vis([31,50]),{cls:'ga-card ga-win'});
   h+=E(24,1.8,'⬅️',vis([57,75]),{cls:'ga-md'})+E(76,1.8,'⬆️',vis([59,75]),{cls:'ga-md'});
   h+=E(50,3.9,'Dodge! Swap',vis([61,76]),{cls:'ga-card ga-sm'});
   h+=E(50,8,'🐱 0 · 🐶 0',vis([0,32],'none'),{cls:'ga-card'})+E(50,8,'🐱 1 · 🐶 0',vis([33,77],'none'),{cls:'ga-card'})+E(50,8,'🐱 3 · 🐶 1',vis([79,94],'none'),{cls:'ga-card ga-win'});
   h+=E(24,1.8,'🏆',vis([82,94]),{cls:'ga-md'});
   return h;
  }},

 rhythm:{d:12,label:'the group picks a category, goes around saying one item on each beat, a miss or a repeat is a mistake, and the fewest mistakes wins.',
  beats:[0,22,54,78],caps:['📋 Pick a category','Say one on the beat','Miss or repeat? Mistake','Fewest mistakes wins'],
  make({E}){
   let h=E(50,.7,'US states',vis([2,94],'scale(.8)'),{cls:'ga-q'});
   h+=PLAY.map((f,i)=>E(ROW[i],4.8,f,vis([0,94]),{cls:'ga-big'})).join('');
   h+=['Oregon','Texas','Maine','Ohio'].map((t,i)=>E(ROW[i],3.1,t,vis([24+i*7,29+i*7]),{cls:'ga-card ga-sm'})).join('');
   h+=E(14,3.1,'Texas?',vis([55,74]),{cls:'ga-card ga-sm ga-bad'});
   h+=E(14,7,'1 mistake',vis([58,94],'none'),{cls:'ga-xs ga-bad'});
   h+=ROW.slice(1).map(x=>E(x,7,'0',vis([58,79],'none'),{cls:'ga-xs ga-teal'})+E(x,6.9,'🏆 0',vis([80,94]),{cls:'ga-card ga-xs ga-win'})).join('');
   const pulse=[24,31,38,45,52,59].map(p=>`${p}%{transform:scale(1.35)}${p+2}%{transform:scale(1)}`).join('');
   h+=E(50,8.6,'🥁',{k:`0%,20%{opacity:0;transform:scale(1)}23%{opacity:1;transform:scale(1)}${pulse}62%{opacity:1;transform:scale(1)}66%,100%{opacity:0;transform:scale(1)}`,fin:false},{cls:'ga-md'});
   return h;
  }},

 brain:{d:12,label:'everyone answers the same prompt in secret, all answers show at once, players who match a friend win, and anyone with no match does not.',
  beats:[0,28,52,76],caps:['✍️ Everyone answers in secret','👀 All answers show','Match a friend to win','No match? No win'],
  make({E}){
   let h=E(50,.7,'Midnight snack?',vis([0,94],'scale(.8)'),{cls:'ga-q'});
   h+=PLAY.map((f,i)=>E(ROW[i],5.6,f,vis([0,94]),{cls:'ga-big'})).join('');
   h+=ROW.map((x,i)=>E(x,3.4,'🔒',vis([5+i*3,27],'scaleX(0)'),{cls:'ga-card ga-sm'})).join('');
   const ans=['Pizza','pizza!','Cereal','Pizza'];
   h+=ans.map((t,i)=>E(ROW[i],3.4,t,vis([29+i*2,94],'scaleX(0)'),{cls:'ga-card ga-sm'})).join('');
   h+=[0,1,3].map(i=>E(ROW[i],3.4,ans[i],vis([54,94],'none'),{cls:'ga-card ga-sm ga-win'})+E(ROW[i],7.8,'✓',vis([56,94]),{cls:'ga-md ga-teal',style:'font-weight:900'})).join('');
   h+=E(62,3.4,'Cereal',vis([77,94],'none'),{cls:'ga-card ga-sm ga-bad'})+E(62,7.8,'✗',vis([79,94]),{cls:'ga-md ga-bad',style:'font-weight:900'});
   return h;
  }},

 number:{d:12,label:'a question has a number for an answer, everyone guesses, the real answer is revealed on a number line, and the closest guess wins.',
  beats:[0,24,48,74],caps:['❓ A question with a number','🔢 Everyone guesses','🎯 Reveal the real answer','Closest guess wins'],
  make({E,A}){
   let h=E(50,.7,'Keys on a piano?',vis([0,49],'scale(.8)'),{cls:'ga-q'})+E(50,.7,'Answer: 88',vis([51,94],'scale(.8)'),{cls:'ga-q ga-win'});
   h+=E(50,8.6,'',vis([49,94],'scaleX(0)'),{cls:'ga-line',cx:false,style:'left:8%;width:84%'});
   h+=E(48,8.95,'🎯 88',vis([56,94]),{cls:'ga-card ga-xs ga-win'});
   const g=[['🐱','60',20],['🐶','100',60],['🐰','85',45],['🦊','120',80]];
   h+=g.map(([f,v,x1],i)=>{
    const chip=`<span class="ga-e ga-card ga-sm ${A(i===2?{k:`0%,${25+i*3}%{opacity:0;background:#fff;border-color:#8acbd2}${28+i*3}%,74%{opacity:1;background:#fff;border-color:#8acbd2}78%,94%{opacity:1;background:#cdeef2;border-color:#087f98}100%{opacity:0;background:#cdeef2;border-color:#087f98}`,fin:true}:vis([25+i*3,94],'none'),i===2?'background:#cdeef2;border-color:#087f98':'')}" style="display:block;margin-top:.15em">${v}</span>`;
    return E(x1,5.7,`<span style="display:block;text-align:center;font-size:1.3em;line-height:1">${f}</span>${chip}`,move([['0%',ROW[i],3,0],['3%,50%',ROW[i],3,1],['58%,94%',x1,5.7,1],['100%',x1,5.7,0]]),{style:'text-align:center'});
   }).join('');
   h+=E(45,4.2,'🏆',vis([78,94]),{cls:'ga-md'});
   return h;
  }},

 draft:{d:12,label:'two players take turns drafting cards from a shared pool, the pick order flips each round, each names and pitches their lineup, and the judges pick a winner.',
  beats:[0,30,54,76],caps:['Take turns picking cards','🔁 Order flips each round','🎤 Name it and pitch it','Judges pick a winner'],
  make({E}){
   let h=E(50,3.3,'Round 1: 🐱 then 🐶',vis([2,29],'none'),{cls:'ga-card ga-xs'})+E(50,3.3,'Round 2: 🐶 then 🐱',vis([31,52],'none'),{cls:'ga-card ga-xs'});
   h+=E(12,5.1,'🐱',vis([0,94]),{cls:'ga-big'})+E(88,5.1,'🐶',vis([0,94]),{cls:'ga-big'});
   // Pool cards fly to the picker: [emoji, pool x, landing x, pick time].
   const cards=[['🍕',18,28,8],['🌮',34,60,17],['🍟',66,72,34],['🥤',82,40,43]];
   h+=cards.map(([f,x0,x1,t])=>E(x1,5.1,f,move([['0%',x0,.8,0],['3%',x0,.8,1],[`${t}%`,x0,.8,1],[`${t+5}%,94%`,x1,5.1,1],['100%',x1,5.1,0]]),{cls:'ga-tile ga-md'})).join('');
   h+=E(50,.8,'🍩',vis([0,94]),{cls:'ga-tile ga-md'});
   h+=E(28,7.7,'Pizza Party',vis([56,94]),{cls:'ga-card ga-sm'})+E(72,7.7,'Taco Night',vis([60,94]),{cls:'ga-card ga-sm'});
   h+=E(28,7.7,'Pizza Party',vis([87,94],'none'),{cls:'ga-card ga-sm ga-win'});
   h+=E(23,9.6,'⭐',vis([78,94]),{cls:'ga-md'})+E(33,9.6,'⭐',vis([81,94]),{cls:'ga-md'})+E(72,9.6,'⭐',vis([84,94]),{cls:'ga-md'});
   return h;
  }},

 draw:{d:12,label:'two players get the same silly prompt, draw it on their phones, the room votes for a favorite, and the drawing with the most votes wins.',
  beats:[0,24,52,76],caps:['😜 Two players, one silly prompt','✏️ Draw it on your phone','🗳️ The room votes','Best drawing wins'],
  make({E,A}){
   let h=E(50,.7,'A potato on a date',vis([0,94],'scale(.8)'),{cls:'ga-q'});
   const stroke=(d,a,b)=>`<path pathLength="1" d="${d}" class="ga-e ${A({k:`0%,${a}%{stroke-dashoffset:1}${b}%,97%{stroke-dashoffset:0}100%{stroke-dashoffset:1}`,fin:true},'stroke-dashoffset:0')}"/>`;
   const potato='M22 30C18 16 34 10 46 14C58 8 74 16 70 32C74 46 60 56 44 52C28 56 18 46 22 30Z',face='M36 28v2M52 28v2M38 40Q45 45 52 40';
   const left=`<svg viewBox="0 0 100 64">${stroke(potato,26,36)}${stroke(face,36,42)}${stroke('M84 20C80 12 70 16 76 26L84 34L92 26C98 16 88 12 84 20Z',42,50)}</svg>`;
   const right=`<svg viewBox="0 0 100 64">${stroke(potato,27,37)}${stroke(face,37,43)}${stroke('M84 58V32M84 32m-6 0a6 6 0 1 0 12 0a6 6 0 1 0-12 0',43,51)}</svg>`;
   h+=E(27,2.9,left,vis([22,94],'none'),{cls:'ga-phone'})+E(73,2.9,right,vis([22,94],'none'),{cls:'ga-phone'});
   const pencil=(x)=>({k:`0%,24%{opacity:0;left:${x}%;top:${Y(3.6)}}27%{opacity:1;left:${x}%;top:${Y(3.6)}}33%{left:${x+8}%;top:${Y(5.2)}}39%{left:${x-6}%;top:${Y(4.4)}}45%{left:${x+14}%;top:${Y(3.4)}}50%{opacity:1;left:${x+10}%;top:${Y(4.8)}}53%,100%{opacity:0;left:${x+10}%;top:${Y(4.8)}}`,fin:false});
   h+=E(29,3.6,'✏️',pencil(20),{cls:'ga-md'})+E(75,3.6,'✏️',pencil(66),{cls:'ga-md'});
   h+=E(27,8.2,'🐱',vis([0,94]),{cls:'ga-md'})+E(73,8.2,'🐶',vis([0,94]),{cls:'ga-md'});
   h+=['🐰','🦊','🐻'].map((f,i)=>E(40+i*10,9.75,f,vis([52,94]),{cls:'ga-md'})).join('');
   h+=E(36,8.4,'⭐',vis([56,94]),{cls:'ga-sm'})+E(64,8.4,'⭐',vis([60,94]),{cls:'ga-sm'})+E(41,8.4,'⭐',vis([64,94]),{cls:'ga-sm'});
   h+=E(27,2.9,'',vis([79,94],'none'),{cls:'ga-ring'})+E(17,8.2,'🏆',vis([81,94]),{cls:'ga-md'});
   return h;
  }},

 imposter:{d:13,label:'everyone sees the category and all but one see the secret word, players take turns giving clues, and then everyone votes out the imposter.',
  beats:[0,24,44,72],caps:['🤫 Everyone gets the secret word','Except the imposter','Take turns giving clues','🗳️ Vote out the imposter'],
  make({E}){
   let h=E(50,.7,'Category: Food',vis([0,94],'scale(.8)'),{cls:'ga-q'});
   h+=PLAY.map((f,i)=>E(ROW[i],5.2,f,vis([0,94]),{cls:'ga-big'})).join('');
   h+=ROW.map((x,i)=>E(x,3.1,i===3?'???':'Pizza',vis([3+i*2,42],'scaleX(0)'),{cls:'ga-card ga-sm'})).join('');
   h+=E(86,3.1,'???',vis([26,42],'none'),{cls:'ga-card ga-sm ga-bad'})+E(86,7.3,'imposter',vis([27,94],'none'),{cls:'ga-xs ga-bad'});
   h+=['Cheesy','Round','Hot','Tasty?'].map((t,i)=>E(ROW[i],3.1,t,vis([46+i*6,94]),{cls:'ga-card ga-sm'})).join('');
   h+=ROW.slice(0,3).map((x,i)=>E(x,7.4,"👉",vis([74+i*2,94]),{cls:"ga-sm"})).join('');
   h+=E(86,8.6,'3 votes',vis([80,94],'none'),{cls:'ga-card ga-xs ga-bad'});
   h+=E(50,9.2,'Caught!',vis([84,94]),{cls:'ga-card ga-sm ga-win'});
   return h;
  }},

 finale:{d:13,label:'everyone writes one prompt, players tap the funnier of two prompts, everyone plays the winning prompt, and the room votes for the best answer.',
  beats:[0,26,52,76],caps:['✍️ Everyone writes a prompt','👆 Tap the funnier one','Everyone plays the winner','⭐ The room votes'],
  make({E}){
   let h=E(50,.7,'One more round?',vis([0,25],'scale(.8)'),{cls:'ga-q'});
   h+=PLAY.map((f,i)=>E(ROW[i],6.8,f,vis([0,94]),{cls:'ga-big'})).join('');
   h+=ROW.map((x,i)=>E(x,4.8,'📝',vis([3+i*3,25]),{cls:'ga-md'})).join('');
   h+=E(28,1.4,'A bad pet name',vis([27,51],'none'),{cls:'ga-card ga-sm'})+E(72,1.4,'A weird pizza',vis([27,51],'none'),{cls:'ga-card ga-sm'});
   h+=E(28,1.4,'A bad pet name',vis([38,51],'none'),{cls:'ga-card ga-sm ga-win'});
   h+=E(30,3.2,'👆',move([['0%,27%',50,4.6,0],['30%',50,4.6,1],['36%',30,3.2,1,'transform:scale(1)'],['38%',30,3.2,1,'transform:scale(.8)'],['40%,49%',30,3.2,1,'transform:scale(1)'],['52%,100%',30,3.2,0]],false),{cls:'ga-md'});
   h+=E(50,.7,'A bad pet name',vis([53,94],'scale(.8)'),{cls:'ga-q'});
   h+=['Chomp','Sir Bark','Toast','Noodle'].map((t,i)=>E(ROW[i],4.6,t,vis([55+i*3,94]),{cls:'ga-card ga-sm'})).join('');
   h+=E(38,4.6,'Sir Bark',vis([84,94],'none'),{cls:'ga-card ga-sm ga-win'});
   h+=E(38,3.2,'⭐⭐⭐',vis([79,94]),{cls:'ga-sm'});
   return h;
  }},
};

const cache={};let cssDone=false;
function compile(id){
 if(cache[id])return cache[id];const g=GAMES[id];if(!g)return null;
 const b=build(id),body=g.make(b),caps=b.caps(g.beats,g.caps);
 return cache[id]={html:`<div class="ga ga-${id}" style="--d:${g.d}s" role="img" aria-label="Animation: ${g.label}">${body}${caps}</div>`,css:b.css.join('\n')};
}
function addCss(){if(cssDone||typeof document==='undefined')return;cssDone=true;const el=document.createElement('style');el.dataset.gameAnims='';el.textContent=BASE+'\n'+Object.keys(GAMES).map(id=>compile(id).css).join('\n');document.head.append(el);}
export const ANIM_IDS=Object.keys(GAMES);
export const animInfo=id=>GAMES[id]?{seconds:GAMES[id].d,beats:[...GAMES[id].beats],captions:[...GAMES[id].caps]}:null;
export const animCss=()=>BASE+'\n'+Object.keys(GAMES).map(id=>compile(id).css).join('\n');
export function gameAnim(id){if(!Object.hasOwn(GAMES,id))return '';addCss();return compile(id).html;}
