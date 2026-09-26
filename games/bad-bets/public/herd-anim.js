// 12-second silent loop that shows a Herd round: write → pick → smaller side loses → Black Sheep.
// Pure HTML + CSS, sized in em so the phone and TV can scale it with font-size. Reduced motion shows the last frame.
const CSS=`.ha{position:relative;height:13em;border-radius:1.1em;background:#eef6f7;overflow:hidden;margin:.9em 0;font-family:'Nunito',ui-rounded,sans-serif;color:#253345}
.ha *{position:absolute;animation-duration:12s;animation-iteration-count:infinite;animation-timing-function:ease-in-out}
.ha-q{left:50%;top:.9em;transform:translateX(-50%);white-space:nowrap;background:#fff;border:.12em solid #cfe3e6;border-radius:.8em;padding:.35em .8em;font:800 1.05em 'Baloo 2','Nunito',sans-serif;animation-name:ha-q}
.ha-opt{top:3.6em;width:40%;text-align:center;border-radius:.7em;padding:.3em 0;font-weight:800;background:#fff;border:.12em solid #8acbd2;animation-name:ha-opt}
.ha-a{left:5%}.ha-b{right:5%}.ha-a.win{animation-name:ha-opt,ha-win}
.ha-s{top:4.6em;font-size:1.7em;line-height:1;left:var(--x0);animation-name:ha-walk}
.ha-s.lone{animation-name:ha-walk,ha-lone}
.ha-cap{left:0;right:0;bottom:.55em;text-align:center;font-weight:800;font-size:.95em;opacity:0}
.ha-c1{animation-name:ha-c1}.ha-c2{animation-name:ha-c2}.ha-c3{animation-name:ha-c3}.ha-c4{animation-name:ha-c4}
.ha-pay{right:6%;top:6em;font-weight:800;color:#ad414b;opacity:0;animation-name:ha-pay}
@keyframes ha-q{0%{opacity:0;transform:translateX(-50%) scale(.8)}6%,94%{opacity:1;transform:translateX(-50%) scale(1)}100%{opacity:0}}
@keyframes ha-opt{0%,14%{opacity:0;transform:translateY(-.4em)}20%,94%{opacity:1;transform:none}100%{opacity:0}}
@keyframes ha-win{0%,55%{background:#fff}60%,94%{background:#cdeef2;border-color:#087f98}100%{background:#fff}}
@keyframes ha-walk{0%,30%{left:var(--x0);transform:none;opacity:1}33%,39%,45%,51%{transform:translateY(-.25em)}36%,42%,48%{transform:none}54%,94%{left:var(--x1);transform:none;opacity:1}100%{left:var(--x1);opacity:0}}
@keyframes ha-lone{0%,60%{filter:none}64%,94%{filter:brightness(.25)}66%,70%{margin-left:-.1em}68%,72%{margin-left:.1em}74%{margin-left:0}100%{filter:none}}
@keyframes ha-pay{0%,68%{opacity:0;transform:none}72%,92%{opacity:1;transform:translateY(-.4em)}100%{opacity:0}}
@keyframes ha-c1{0%,2%{opacity:0}5%,23%{opacity:1}26%,100%{opacity:0}}
@keyframes ha-c2{0%,25%{opacity:0}28%,48%{opacity:1}51%,100%{opacity:0}}
@keyframes ha-c3{0%,51%{opacity:0}54%,68%{opacity:1}71%,100%{opacity:0}}
@keyframes ha-c4{0%,70%{opacity:0}73%,93%{opacity:1}96%,100%{opacity:0}}
@media(prefers-reduced-motion:reduce){.ha *{animation:none!important}.ha-s{left:var(--x1)}.ha-s.lone{filter:brightness(.25)}.ha-q,.ha-opt,.ha-c4,.ha-pay{opacity:1}.ha-a.win{background:#cdeef2}}`;
let added=false;
const addCss=()=>{if(added||typeof document==='undefined')return;added=true;const el=document.createElement('style');el.textContent=CSS;document.head.append(el);};
// Four sheep head to A, one stays alone on B.
const SHEEP=[['40%','8%'],['47%','17%'],['54%','26%'],['61%','35%'],['68%','78%','lone']];
export function herdAnim(){addCss();
 return `<div class="ha" role="img" aria-label="Animation: one player writes a this-or-that, everyone picks a side, the smaller side loses, and a player alone on their side is the Black Sheep.">
 <div class="ha-q">Beach or mountains?</div><div class="ha-opt ha-a win">A · Beach</div><div class="ha-opt ha-b">B · Mountains</div>
 ${SHEEP.map(([x0,x1,c])=>`<span class="ha-s${c?' '+c:''}" style="--x0:${x0};--x1:${x1}" aria-hidden="true">🐑</span>`).join('')}
 <div class="ha-pay" aria-hidden="true">pays up</div>
 <div class="ha-cap ha-c1">✍️ One player writes a this-or-that</div><div class="ha-cap ha-c2">👆 Everyone picks a side</div><div class="ha-cap ha-c3">🐑 Bigger side wins</div><div class="ha-cap ha-c4">Alone? You’re the Black Sheep</div></div>`;}
