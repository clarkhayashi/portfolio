// End-of-night awards. Each finished round leaves a few facts on its history entry (h.s), then the final
// screen turns the night's history into 3 to 5 awards. Only what the room actually played can win an award,
// and nothing here is stored anywhere but the room object (no extra Redis commands).
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/^(a|an|the) /,'').trim().replace(/\s+/g,' ');
const JUDGED=['quips','draw','draft','auction','finale'];
export const MAX_AWARDS=5;

// Facts about the round that just settled. Short keys keep the room small:
// w winners · b [id, biggest stake] · a went all in · sh Black Sheep · m matched in Same Brain
// n closest Ballpark guess · v votes received from judges · bl imposter who got away
export function roundStats(r){
 const res=r.result||{},s={};if(!res||r.forceDraw)return s;
 const won=res.tie?[]:(res.winners||[]);if(won.length)s.w=[...won];
 if(r.pot&&r.stakes){let top=null;for(const [id,n] of Object.entries(r.stakes))if(n>5&&(!top||n>top[1]))top=[id,n];if(top)s.b=top;}
 if(r.roundAllIn?.length)s.a=[...new Set(r.roundAllIn)];
 if(r.game==='brain'&&r.herd){const o=r.herd.outcome;if(o&&!o.cancelled&&o.sheep)s.sh=o.sheep;}
 else if(r.game==='brain'){const groups=Object.create(null);for(const id of r.active||[]){const a=norm(r.submissions?.[id]);if(a)(groups[a]||=[]).push(id);}const m=Object.values(groups).filter(g=>g.length>1).flat();if(m.length)s.m=m;}
 if(r.game==='number'&&res.distances){const d=Object.entries(res.distances).filter(([,v])=>typeof v==='number'&&Number.isFinite(v));const best=Math.min(...d.map(([,v])=>v));if(d.length>1&&Number.isFinite(best))s.n=d.filter(([,v])=>v===best).map(([id])=>id);}
 if(JUDGED.includes(r.game)&&res.totals){const v=Object.fromEntries(Object.entries(res.totals).filter(([,n])=>n>0));if(Object.keys(v).length)s.v=v;}
 if(r.game==='imposter'&&r.imposter&&won.includes(r.imposter))s.bl=r.imposter;
 return s;
}

const times=n=>n===1?'once':n===2?'twice':`${n} times`;
// The player(s) with the top count. Skip if nobody scored, or if too many tie for it to mean anything.
function top(counts,live,maxTies=2){const entries=Object.entries(counts).filter(([id,n])=>live.has(id)&&n>0);if(!entries.length)return null;const best=Math.max(...entries.map(([,n])=>n));const who=entries.filter(([,n])=>n===best).map(([id])=>id);return who.length>maxTies?null:{players:who,n:best};}
function tally(history,key){const c={};for(const h of history){const v=h.s?.[key];if(v===undefined)continue;if(Array.isArray(v))for(const id of v)c[id]=(c[id]||0)+1;else if(typeof v==='string')c[v]=(c[v]||0)+1;}return c;}

// The night's awards, best first. Each names one player, or two on a tie.
export function computeAwards(r){
 const history=(r.history||[]).filter(h=>h&&h.s),livePlayers=r.players.filter(p=>!p.left),live=new Set(livePlayers.map(p=>p.id)),out=[];
 const add=(id,icon,title,res,line)=>{if(res)out.push({id,icon,title,players:res.players,line:line(res.n)});};
 if(r.mode==='tournament'){const max=Math.max(...livePlayers.map(p=>p.chips));const who=livePlayers.filter(p=>p.chips===max).map(p=>p.id);if(livePlayers.length&&who.length<=3)out.push({id:'leader',icon:'🏆',title:'Chip Leader',players:who,line:`${max} chips`});}
 else add('wins','🏆','Most Wins',top(tally(history,'w'),live),n=>`Won ${n} ${n===1?'round':'rounds'}`);
 const votes={};for(const h of history)for(const [id,n] of Object.entries(h.s.v||{}))votes[id]=(votes[id]||0)+n;
 add('crowd','😂','Crowd Favorite',top(votes,live),n=>`${n} ${n===1?'vote':'votes'} from the judges`);
 add('sheep','🐑','Black Sheep',top(tally(history,'sh'),live),n=>`Alone on their side ${times(n)}`);
 add('sharp','🎯','Sharpshooter',top(tally(history,'n'),live),n=>`Closest guess ${times(n)}`);
 add('bluff','🫣','Biggest Bluffer',top(tally(history,'bl'),live),n=>`Got away as the imposter ${times(n)}`);
 const allIn=top(tally(history,'a'),live);
 if(allIn)add('allin','🎲','All In Energy',allIn,n=>`Went all in ${times(n)}`);
 else{const big={};for(const h of history){const b=h.s.b;if(b&&b[1]>(big[b[0]]||0))big[b[0]]=b[1];}add('bigbet','🎲','Biggest Bet',top(big,live),n=>`Bet ${n} chips on one round`);}
 add('brain','🤝','Same Brain',top(tally(history,'m'),live),n=>`Matched answers ${times(n)}`);
 return out.slice(0,MAX_AWARDS);
}
// Plain one-liner for share text: "🐑 Black Sheep: Kai". Skips the chip leader (the card already names the winner).
export function awardLine(a,nameOf){return `${a.icon} ${a.title}: ${a.players.map(nameOf).join(' & ')}`;}

export function installAwards(Game){
 const prev=Object.fromEntries(['fresh','settle','finaleSettle','potAction','view','action'].map(k=>[k,Game.prototype[k]]));
 // Record facts once per settled round, then count the round for the funnel.
 Game.prototype.afterRound=function(r){const h=r.history?.at(-1);if(!h||h.round!==r.round||h.s)return;h.s=roundStats(r);this.metricRound?.(r);};
 const wrap=name=>function(r){const was=r.phase;const out=prev[name].call(this,r);if(was!=='result'&&r.phase==='result')this.afterRound(r);return out;};
 Game.prototype.settle=wrap('settle');Game.prototype.finaleSettle=wrap('finaleSettle');
 Game.prototype.fresh=function(r){r.roundAllIn=[];return prev.fresh.call(this,r);};
 // All In is a player's explicit choice, so it is logged at the moment it is made.
 Game.prototype.potAction=function(r,p,a){const out=prev.potAction.call(this,r,p,a);if(a?.move==='allin')(r.roundAllIn||=[]).push(p.id);return out;};
 // Minigames has no last round, so the host ends the night to see the awards.
 Game.prototype.action=function(r,p,a){
  if(a?.type==='endNight'){if(r.host!==p.id)throw Error('Only the host can do that.');if(r.mode!=='minigames'||r.quick)throw Error('Party mode ends after the last round.');if(r.phase!=='result')throw Error('Finish this round first.');r.last=Date.now();this.phase(r,'finished');this.emit(r);return;}
  return prev.action.call(this,r,p,a);
 };
 Game.prototype.view=function(r,p){const v=prev.view.call(this,r,p);if(r.phase==='finished'&&r.mode!=='mixer'&&!r.quick)v.awards=computeAwards(r);return v;};
}
