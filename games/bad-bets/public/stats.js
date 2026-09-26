// Read-only funnel page. Data: GET /api/stats?days=14 (metrics.mjs). Pure helpers are exported for tests.
export const BUCKET_LABELS={lt30:'Under 30 s','30to60':'30 to 60 s','1to2m':'1 to 2 min','2to5m':'2 to 5 min','5mplus':'5 min or more'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function summarize(days){
 const t={};for(const d of days||[])for(const [k,v] of Object.entries(d.counts||{}))t[k]=(t[k]||0)+v;
 const n=k=>t[k]||0,created=Object.keys(t).filter(k=>k.startsWith('created:')).reduce((a,k)=>a+t[k],0);
 return {totals:t,created,fast:n('ttfr:lt30')+n('ttfr:30to60'),started:n('started'),finished:n('finished'),rematch:n('rematch'),share:n('share')};
}
export const ratio=(a,b)=>b>0?`${Math.round(100*a/b)}%`:'None yet';
const created=c=>Object.entries(c||{}).filter(([k])=>k.startsWith('created:')).reduce((a,[,v])=>a+v,0);
export function renderStats(body){
 const days=body?.days||[],s=summarize(days),n=k=>s.totals[k]||0,cell=v=>`<td class="${v?'':'zero'}">${v}</td>`;
 const tile=(value,label,note)=>`<div class="tile"><b>${value}</b><span>${label}</span><small>${note}</small></div>`;
 const main=[['Day',d=>d.day.slice(5)],['Rooms',d=>created(d.counts)],['In 60 s',d=>(d.counts['ttfr:lt30']||0)+(d.counts['ttfr:30to60']||0)],['Done',d=>d.counts.finished||0],['Rematch',d=>d.counts.rematch||0],['Share',d=>d.counts.share||0]];
 const more=[['Day',d=>d.day.slice(5)],['Party',d=>d.counts['created:party']||0],['Minigames',d=>d.counts['created:minigames']||0],['1v1',d=>d.counts['created:quick']||0],['Date',d=>d.counts['created:date']||0],['New hosts',d=>d.counts.newhost||0],['Started',d=>d.counts.started||0],['Rounds',d=>d.counts.rounds||0],['TV',d=>d.counts.tv||0],['Late joins',d=>d.counts.latejoin||0]];
 const table=(cols,label)=>`<div class="table-wrap" role="region" aria-label="${label}" tabindex="0"><table><thead><tr>${cols.map(([h])=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${days.map(d=>`<tr>${cols.map(([,f],i)=>i?cell(f(d)):`<td>${esc(f(d))}</td>`).join('')}</tr>`).join('')}</tbody><tfoot><tr>${cols.map(([,f],i)=>i?`<td>${days.reduce((a,d)=>a+f(d),0)}</td>`:'<td>Total</td>').join('')}</tr></tfoot></table></div>`;
 return `<div class="tiles">${tile(ratio(s.fast,s.created),'Round 1 within 60 s',`${s.fast} of ${s.created} rooms`)}${tile(ratio(s.rematch,s.finished),'Rematch rate',`${s.rematch} rematches from ${s.finished} finished games`)}${tile(ratio(s.share,s.finished),'Share rate',`${s.share} share card taps from ${s.finished} finished games`)}</div>
<h2>Last 14 days</h2>${table(main,'Daily funnel')}
<h2>Time from room created to round 1</h2><div class="table-wrap" role="region" aria-label="Time to round 1" tabindex="0"><table><thead><tr><th scope="col">Time</th><th scope="col">Rooms</th><th scope="col">Share</th></tr></thead><tbody>${Object.entries(BUCKET_LABELS).map(([k,label])=>`<tr><td>${label}</td>${cell(n('ttfr:'+k))}<td>${ratio(n('ttfr:'+k),s.started)}</td></tr>`).join('')}</tbody></table></div>
<h2>All counts</h2>${table(more,'All daily counts')}<p class="note">Rooms that never start count against round 1 within 60 s. Rematch and share rates use finished games; share counts every tap.</p>`;
}
if(typeof document!=='undefined'){
 const status=document.querySelector('#status'),out=document.querySelector('#out');
 fetch('/api/stats?days=14',{signal:AbortSignal.timeout(8000)}).then(r=>r.json()).then(body=>{if(body.error)throw Error(body.error);out.innerHTML=renderStats(body);status.textContent='';status.hidden=true;}).catch(e=>{status.textContent=`Counts are unavailable right now. ${e.message||''}`.trim();});
}
