// Pure helpers for the UI quality checker (ui-check.mjs). No DOM, no imports: every function
// here is also injected into the page with Function.prototype.toString, so it may only call
// other functions listed in `helpers`.

// 'rgb(1, 2, 3)', 'rgba(1,2,3,.5)', 'rgb(1 2 3 / 50%)', '#abc', '#aabbcc', 'transparent' -> {r,g,b,a} or null.
export function parseColor(s){
 s=String(s||'').trim().toLowerCase();
 if(!s||s==='transparent')return {r:0,g:0,b:0,a:0};
 if(s[0]==='#'){let x=s.slice(1);if(x.length===3||x.length===4)x=[...x].map(c=>c+c).join('');if(!/^[0-9a-f]{6}([0-9a-f]{2})?$/.test(x))return null;const n=i=>parseInt(x.slice(i,i+2),16);return {r:n(0),g:n(2),b:n(4),a:x.length===8?n(6)/255:1};}
 const fn=s.match(/^(color|oklab|oklch)\((.+)\)$/);
 if(fn){
  let body=fn[2].trim(),alpha=1;const sl=body.split('/');if(sl[1]!==undefined){alpha=sl[1].trim();alpha=alpha.endsWith('%')?parseFloat(alpha)/100:parseFloat(alpha);body=sl[0];}
  const v=body.trim().split(/\s+/);const num=x=>x==='none'?0:x.endsWith('%')?parseFloat(x)/100:parseFloat(x);
  const to8=x=>{x=Math.max(0,Math.min(1,x));return 255*(x<=0.0031308?12.92*x:1.055*x**(1/2.4)-0.055);};
  if(fn[1]==='color'){if(v[0]!=='srgb'&&v[0]!=='srgb-linear')return null;const [r,g,b]=v.slice(1,4).map(num);const lin=v[0]==='srgb-linear';const c=x=>lin?to8(x):Math.max(0,Math.min(1,x))*255;return {r:c(r),g:c(g),b:c(b),a:alpha};}
  let L=num(v[0]),A,B;if(v[0].endsWith('%'))L=parseFloat(v[0])/100;
  if(fn[1]==='oklab'){A=num(v[1]);B=num(v[2]);}else{const C=num(v[1]),H=num(v[2])*Math.PI/180;A=C*Math.cos(H);B=C*Math.sin(H);}
  const l=(L+0.3963377774*A+0.2158037573*B)**3,m2=(L-0.1055613458*A-0.0638541728*B)**3,s2=(L-0.0894841775*A-1.2914855480*B)**3;
  return {r:to8(4.0767416621*l-3.3077115913*m2+0.2309699292*s2),g:to8(-1.2684380046*l+2.6097574011*m2-0.3413193965*s2),b:to8(-0.0041960863*l-0.7034186147*m2+1.7076147010*s2),a:alpha};
 }
 const m=s.match(/^rgba?\(([^)]+)\)$/);if(!m)return null;
 const parts=m[1].replace(/\s*\/\s*/,' / ').split(/[\s,\/]+/).filter(Boolean);
 if(parts.length<3)return null;
 const num=(v,max)=>v.endsWith('%')?parseFloat(v)/100*max:parseFloat(v);
 const c={r:num(parts[0],255),g:num(parts[1],255),b:num(parts[2],255),a:parts[3]===undefined?1:num(parts[3],1)};
 return [c.r,c.g,c.b,c.a].some(Number.isNaN)?null:c;
}

// Source-over composite of fg on bg. Result alpha follows Porter-Duff.
export function blend(fg,bg){
 const a=fg.a+bg.a*(1-fg.a);if(a===0)return {r:0,g:0,b:0,a:0};
 const ch=k=>(fg[k]*fg.a+bg[k]*bg.a*(1-fg.a))/a;
 return {r:ch('r'),g:ch('g'),b:ch('b'),a};
}

// WCAG 2.x relative luminance of an opaque colour.
export function luminance(c){
 const f=v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4;};
 return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b);
}

export function contrastRatio(a,b){
 const x=luminance(a),y=luminance(b);
 return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
}

// WCAG "large text": 24px+, or 18.66px+ (14pt) at bold weight.
export function isLargeText(px,weight){return px>=24||(px>=18.66&&Number(weight)>=700);}
export function requiredRatio(px,weight){return px>=24||(px>=18.66&&Number(weight)>=700)?3:4.5;}

// Every colour stop in a computed background-image gradient (Chrome serialises them as rgb/rgba).
export function gradientColors(s){
 return (String(s||'').match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}\b/gi)||[]).map(x=>{
  const t=String(x).trim().toLowerCase();
  if(t[0]==='#'){let v=t.slice(1);if(v.length<6)v=[...v].map(c=>c+c).join('');const n=i=>parseInt(v.slice(i,i+2),16);return {r:n(0),g:n(2),b:n(4),a:v.length===8?n(6)/255:1};}
  const p=t.slice(t.indexOf('(')+1,-1).replace(/\s*\/\s*/,' ').split(/[\s,]+/).filter(Boolean).map(Number);
  return {r:p[0],g:p[1],b:p[2],a:p[3]===undefined?1:p[3]};
 });
}

// Em dashes are banned from copy; en dashes are reported separately (ranges like 2-12 may be fine).
export function dashKinds(text){
 const s=String(text||'');const out=[];
 if(s.includes('\u2014'))out.push('em');
 if(s.includes('\u2013'))out.push('en');
 return out;
}

export function toHex(c){
 const h=v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0');
 return '#'+h(c.r)+h(c.g)+h(c.b)+(c.a!==undefined&&c.a<0.999?h(c.a*255):'');
}

// Two rectangles overlap by more than `slack` px on both axes.
export function rectsOverlap(a,b,slack=2){
 const w=Math.min(a.right,b.right)-Math.max(a.left,b.left);
 const hgt=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
 return w>slack&&hgt>slack;
}

// Worst-case contrast of text colour `fg` (already carrying element opacity in .a) against a
// stack of background layers listed top (nearest the text) to bottom. A layer is {color} or
// {stops:[colors]} for a gradient. Layers below the first opaque colour are ignored; the page
// canvas under everything is white.
export function worstContrast(fg,layers,h){
 let cut=layers.findIndex(l=>l.color&&l.color.a>=0.999);
 const used=cut===-1?layers:layers.slice(0,cut+1);
 let candidates=[{r:255,g:255,b:255,a:1}];
 for(let i=used.length-1;i>=0;i--){
  const l=used[i];
  if(l.color)candidates=candidates.map(c=>h.blend(l.color,c));
  else if(l.stops&&l.stops.length)candidates=candidates.flatMap(c=>l.stops.map(s=>h.blend(s,c)));
 }
 let worst=Infinity,worstBg=candidates[0];
 for(const bg of candidates){const r=h.contrastRatio(h.blend(fg,bg),bg);if(r<worst){worst=r;worstBg=bg;}}
 return {ratio:worst,bg:worstBg,fg:h.blend(fg,worstBg)};
}

export const helpers={parseColor,blend,luminance,contrastRatio,isLargeText,requiredRatio,gradientColors,dashKinds,toHex,rectsOverlap,worstContrast};

// Runs inside the page. Returns {issues, counts}. `h` is the helpers object above, rebuilt in the page.
export function pageAudit(h,opts){
 const issues=[];const vw=innerWidth;
 const SKIP='script,style,noscript,template,svg,title,option,datalist,canvas';
 const pathOf=el=>{const out=[];for(let e=el;e&&e.nodeType===1&&out.length<4&&e!==document.body;e=e.parentElement){let s=e.tagName.toLowerCase();if(e.id)s+='#'+e.id;else if(typeof e.className==='string'&&e.className.trim())s+='.'+e.className.trim().split(/\s+/).slice(0,2).join('.');const act=e.getAttribute('data-action');if(act)s+=`[data-action=${act}]`;out.unshift(s);}return out.join(' > ');};
 const visible=el=>{if(!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))return false;for(let e=el;e&&e!==document.documentElement;e=e.parentElement){const cs=getComputedStyle(e);if(cs.overflow!=='visible'||cs.clip!=='auto'){const r=e.getBoundingClientRect();if(r.width<3||r.height<3)return false;}if(cs.clipPath&&cs.clipPath.startsWith('inset(50%'))return false;}return true;};
 const snip=t=>t.replace(/\s+/g,' ').trim().slice(0,60);
 // ---- text nodes ----
 // With a modal dialog open, everything behind the backdrop is inert: audit the dialog only.
 const modal=document.querySelector('dialog:modal');const inScope=el=>!modal||modal.contains(el);
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const texts=[];const vis=new Map();
 const isVis=el=>{if(!vis.has(el))vis.set(el,visible(el));return vis.get(el);};
 for(let n;(n=walker.nextNode());){
  if(!n.nodeValue.trim())continue;const el=n.parentElement;if(!el||el.closest(SKIP))continue;if(modal&&!modal.contains(el))continue;if(!isVis(el))continue;
  const range=document.createRange();range.selectNodeContents(n);const rects=[...range.getClientRects()].filter(r=>r.width>0.5&&r.height>0.5);if(!rects.length)continue;
  texts.push({node:n,el,rects,text:n.nodeValue});
 }
 const counts={texts:texts.length,contrastChecked:0};
 // (a) contrast
 const seen=new Set();
 for(const t of texts){
  const el=t.el,cs=getComputedStyle(el);
  if(el.closest('button:disabled,[aria-disabled=true],input:disabled,fieldset:disabled'))continue;
  // Logotype accents are exempt (WCAG 1.4.3); the wordmark ink itself is still checked.
  if(opts.logoAccent&&el.matches(opts.logoAccent))continue;
  let fg=h.parseColor(cs.webkitTextFillColor&&cs.webkitTextFillColor!==cs.color&&!cs.webkitTextFillColor.includes('0, 0, 0, 0')?cs.webkitTextFillColor:cs.color);if(!fg)continue;
  let op=1;for(let e=el;e;e=e.parentElement)op*=parseFloat(getComputedStyle(e).opacity);
  fg={...fg,a:fg.a*op};if(fg.a<0.02)continue;
  const layers=[];let image=null,gradient=false;
  for(let e=el;e;e=e.parentElement){const s=getComputedStyle(e);const bi=s.backgroundImage;
   if(bi&&bi!=='none'){if(/url\(/.test(bi)&&!/gradient/.test(bi)){image=pathOf(e);break;}const stops=h.gradientColors(bi);if(stops.length){layers.push({stops});gradient=true;}}
   const bc=h.parseColor(s.backgroundColor);if(bc&&bc.a>0){layers.push({color:bc});if(bc.a>=0.999)break;}}
  const px=parseFloat(cs.fontSize),w=cs.fontWeight;const need=h.requiredRatio(px,w);
  counts.contrastChecked++;
  if(image){const k='img|'+pathOf(el);if(!seen.has(k)){seen.add(k);issues.push({type:'contrast-image',severity:'warn',text:snip(t.text),path:pathOf(el),detail:`text over background image on ${image}; check by eye`});}continue;}
  const res=h.worstContrast(fg,layers,h);const ratio=Math.floor(res.ratio*100)/100;
  if(ratio<need){const k=pathOf(el)+'|'+snip(t.text);if(seen.has(k))continue;seen.add(k);
   issues.push({type:'contrast',severity:'fail',text:snip(t.text),path:pathOf(el),ratio,need,fg:h.toHex(res.fg),bg:h.toHex(res.bg),size:px,weight:w,gradient,detail:`${ratio}:1 < ${need}:1 (${h.toHex(res.fg)} on ${h.toHex(res.bg)}${gradient?', gradient worst stop':''}, ${px}px/${w})`});}
 }
 // (b) overflow
 const scrollable=e=>{for(let x=e.parentElement;x&&x!==document.body;x=x.parentElement){const s=getComputedStyle(x);if(/(auto|scroll)/.test(s.overflowX))return true;}return false;};
 // A control "has a fill" when it paints a background or border that differs from what is behind it.
 const hasFill=el=>{const s=getComputedStyle(el);const bg=h.parseColor(s.backgroundColor);return (bg&&bg.a>0.05)||s.backgroundImage!=='none'||parseFloat(s.borderTopWidth)>0.5&&s.borderTopStyle!=='none'&&(h.parseColor(s.borderTopColor)?.a||0)>0.05;};
 // Text must sit inside the painted shape: clear of rounded corners and not flush to the edges.
 const edgeCheck=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);const range=document.createRange();range.selectNodeContents(el);const t=range.getBoundingClientRect();if(!t.width)return null;
  const rad=Math.min(parseFloat(s.borderTopLeftRadius)||0,r.height/2,r.width/2);const need=Math.max(6,rad*0.35);const inset=Math.min(t.left-r.left,r.right-t.right);
  if(inset<-1)return {type:'overflow',severity:'fail',text:snip(el.textContent),path:pathOf(el),detail:`label is ${Math.round(t.width)}px wide in a ${Math.round(r.width)}px shape`};
  if(inset<need-0.5)return {type:'cramped',severity:'warn',text:snip(el.textContent),path:pathOf(el),detail:`label only ${Math.max(0,Math.round(inset))}px from the edge of a filled shape (want ${Math.round(need)}px)`};return null;};
 const boxSel='button,a[href],[role=button],summary,label,.pill,.chip,.badge,.tag,.timer,.roomcode,h1,h2,h3,h4,.eyebrow,.brand';
 for(const el of document.querySelectorAll(boxSel)){
  if(el.closest(SKIP)||!inScope(el)||!isVis(el))continue;const s=getComputedStyle(el);if(/(auto|scroll)/.test(s.overflowX+s.overflowY))continue;if(!el.textContent.trim())continue;
  if(s.textOverflow==='ellipsis'&&el.scrollWidth>el.clientWidth+1){issues.push({type:'truncated',severity:'warn',text:snip(el.textContent),path:pathOf(el),detail:`ellipsis: ${el.scrollWidth}px of text in ${el.clientWidth}px`});continue;}
  const inline=s.display==='inline';
  if(!inline&&el.clientWidth>0&&el.scrollWidth>el.clientWidth+1)issues.push({type:'overflow',severity:'fail',text:snip(el.textContent),path:pathOf(el),detail:`content ${el.scrollWidth}px wide in a ${el.clientWidth}px box`});
  else if(!inline&&/^(button|a|summary)$/i.test(el.tagName)&&el.clientHeight>0&&el.scrollHeight>el.clientHeight+1&&s.height!=='auto')issues.push({type:'overflow',severity:'fail',text:snip(el.textContent),path:pathOf(el),detail:`content ${el.scrollHeight}px tall in a ${el.clientHeight}px box`});
  else if(!inline&&/^(button|a|summary)$/i.test(el.tagName)&&hasFill(el)&&edgeCheck(el))issues.push(edgeCheck(el));
  else if(!inline&&/(button|pill|chip|badge|tag)/i.test(el.tagName+' '+el.className)){const r=el.getBoundingClientRect();const range=document.createRange();range.selectNodeContents(el);const tr=range.getBoundingClientRect();if(tr.width&&(tr.left<r.left-1||tr.right>r.right+1||tr.top<r.top-1||tr.bottom>r.bottom+1))issues.push({type:'overflow',severity:'fail',text:snip(el.textContent),path:pathOf(el),detail:`text box ${Math.round(tr.width)}x${Math.round(tr.height)} spills out of ${Math.round(r.width)}x${Math.round(r.height)}`});}
 }
 // Placeholders are clipped silently by the field, so measure them with the placeholder's own font.
 const ctx=document.createElement('canvas').getContext('2d');
 for(const el of document.querySelectorAll('input[placeholder],textarea[placeholder]')){
  if(!inScope(el)||!isVis(el)||el.value)continue;const ps=getComputedStyle(el,'::placeholder'),s=getComputedStyle(el);
  ctx.font=`${ps.fontStyle} ${ps.fontWeight} ${ps.fontSize} ${ps.fontFamily}`;ctx.letterSpacing=ps.letterSpacing==='normal'?'0px':ps.letterSpacing;
  const room=el.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight);const w=ctx.measureText(el.getAttribute('placeholder')).width;
  if(el.tagName==='INPUT'&&w>room+1)issues.push({type:'overflow',severity:'fail',text:snip(el.getAttribute('placeholder')),path:pathOf(el),detail:`placeholder is ${Math.round(w)}px in a ${Math.round(room)}px field`});
 }
 const docW=document.documentElement.scrollWidth;
 if(docW>vw+1)issues.push({type:'overflow',severity:'fail',text:'',path:'html',detail:`page scrolls sideways: ${docW}px wide in a ${vw}px viewport`});
 const offSeen=new Set();
 for(const t of texts){for(const r of t.rects){if((r.right>vw+1||r.left<-1)&&!scrollable(t.el)){const k=pathOf(t.el);if(offSeen.has(k))break;offSeen.add(k);issues.push({type:'overflow',severity:'fail',text:snip(t.text),path:k,detail:`text runs off-screen (${Math.round(r.left)} to ${Math.round(r.right)} of ${vw}px)`});break;}}}
 // (c) tap targets
 for(const el of document.querySelectorAll('button,a[href],[role=button],summary,input[type=checkbox],input[type=radio],select')){
  if(!inScope(el)||!isVis(el))continue;const s=getComputedStyle(el);if(s.pointerEvents==='none')continue;
  if(el.tagName==='A'&&s.display==='inline'){const p=el.parentElement;if(p&&p.textContent.trim().length>el.textContent.trim().length+2)continue;}
  let r=el.getBoundingClientRect();const lab=el.closest('label');if(lab){const lr=lab.getBoundingClientRect();if(lr.width>=r.width&&lr.height>=r.height)r=lr;}
  if(r.width<44-0.5||r.height<44-0.5)issues.push({type:'tap-target',severity:'warn',text:snip(el.textContent||el.getAttribute('aria-label')||el.value||''),path:pathOf(el),detail:`${Math.round(r.width)}x${Math.round(r.height)} (min 44x44)`});
 }
 // (d) overlapping text
 const boxes=[];const byEl=new Map();
 for(const t of texts){if(t.el.closest('[aria-hidden=true] .ambient,.ambient'))continue;const s=getComputedStyle(t.el);if(s.position==='fixed'&&t.el.id==='toast')continue;const list=byEl.get(t.el)||[];list.push(...t.rects);byEl.set(t.el,list);}
 // Compare the glyph core (middle 60% of each line box): line boxes of tight headings touch by design.
 for(const [el,rects] of byEl)for(const r of rects){const pad=r.height*0.2;boxes.push({el,r:{left:r.left,right:r.right,top:r.top+pad,bottom:r.bottom-pad}});}
 const controls=[...document.querySelectorAll('button,input,select,textarea,img')].filter(el=>inScope(el)&&isVis(el)).map(el=>({el,r:el.getBoundingClientRect()}));
 const olap=new Set();
 // The hidden tune panel and its badge float above the page on purpose: only overlaps inside the same layer count.
 const layer=el=>el.closest('#tune-panel,#tune-badge')?1:0;
 for(let i=0;i<boxes.length;i++){const a=boxes[i];
  for(let j=i+1;j<boxes.length;j++){const b=boxes[j];if(a.el===b.el||a.el.contains(b.el)||b.el.contains(a.el)||layer(a.el)!==layer(b.el))continue;if(a.el.textContent.trim()===b.el.textContent.trim())continue;/* crossfade frames */if(h.rectsOverlap(a.r,b.r,3)){const k=pathOf(a.el)+'|'+pathOf(b.el);if(olap.has(k))continue;olap.add(k);issues.push({type:'overlap',severity:'warn',text:snip(a.el.textContent)+' / '+snip(b.el.textContent),path:pathOf(a.el),detail:`overlaps text in ${pathOf(b.el)}`});}}
  for(const c of controls){if(layer(a.el)!==layer(c.el)||c.el.contains(a.el)||a.el.contains(c.el)||c.el.closest('label')?.contains(a.el))continue;if(h.rectsOverlap(a.r,c.r,3)){const k=pathOf(a.el)+'|c|'+pathOf(c.el);if(olap.has(k))continue;olap.add(k);issues.push({type:'overlap',severity:'warn',text:snip(a.el.textContent),path:pathOf(a.el),detail:`text sits on top of ${pathOf(c.el)}`});}}
 }
 // (e) dashes in visible copy (text, placeholders, button values)
 const dashSeen=new Set();
 const dash=(text,el)=>{for(const k of h.dashKinds(text)){const key=k+'|'+snip(text);if(dashSeen.has(key))continue;dashSeen.add(key);issues.push({type:k==='em'?'em-dash':'en-dash',severity:k==='em'?'fail':'info',text:snip(text),path:pathOf(el),detail:k==='em'?'em dash in visible copy':'en dash in visible copy (fine for ranges like 2\u201312)'});}};
 for(const t of texts)dash(t.text,t.el);
 for(const el of document.querySelectorAll('[placeholder]'))if(isVis(el))dash(el.getAttribute('placeholder'),el);
 return {issues,counts,modal:!!modal,docHeight:Math.ceil(Math.max(document.documentElement.scrollHeight,document.body.scrollHeight)),docWidth:docW};
}

// Source for injecting the helpers + audit into a page with Runtime.evaluate. The helpers are
// declared as plain functions in one scope so they can call each other.
export function auditSource(opts={}){
 const decls=Object.values(helpers).map(f=>f.toString()).join('\n');
 return `(()=>{${decls}\nconst h={${Object.keys(helpers).join(',')}};return (${pageAudit.toString()})(h,${JSON.stringify(opts)});})()`;
}

// Summarise issues into per-type counts. Contrast and overflow failures (and screens that could not be
// rendered at all) fail the run.
export const BLOCKING=['contrast','overflow','setup'];
export function summarize(results){
 const counts={};let failures=0;
 for(const r of results)for(const i of r.issues){counts[i.type]=(counts[i.type]||0)+1;if(BLOCKING.includes(i.type))failures++;}
 return {counts,failures,screens:results.length};
}
