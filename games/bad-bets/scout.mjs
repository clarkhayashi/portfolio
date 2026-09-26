// Scout grade: turns a sports draft lineup into a score, a letter grade and a one-line report.
// Grades are percentiles against random lineups dealt from the same theme, so an "A" means top ~10%.
import {RATINGS} from './scout-ratings.mjs';
import {DRAFT_THEMES} from './theme-content.mjs';

export const SCOUT_THEMES=Object.keys(RATINGS);
export const hasScout=id=>SCOUT_THEMES.includes(id);

const GRADES=[['A+',97],['A',90],['A−',83],['B+',75],['B',65],['B−',55],['C+',45],['C',35],['C−',25],['D',12],['F',0]];
export const GRADE_BANDS=['A','B','C'];   // what a player calls before the reveal ("C" means C or worse)
export const bandOf=g=>g[0]==='A'?'A':g[0]==='B'?'B':'C';

const rating=(theme,name)=>{const r=RATINGS[theme]?.[name];return r?{off:r[0],def:r[1],note:r[2]}:{off:60,def:60,note:''};};

// Team score: stars matter most, balance matters a little. Range roughly 55–97.
export function teamScore(theme,names){
 if(!names.length)return 0;
 const rs=names.map(n=>rating(theme,n)),off=avg(rs.map(r=>r.off)),def=avg(rs.map(r=>r.def));
 const ovr=avg(rs.map(r=>Math.max(r.off,r.def)*0.65+Math.min(r.off,r.def)*0.35));
 const balance=-Math.max(0,Math.abs(off-def)-12)*0.25;
 return round1(ovr+balance);
}

// Percentile table per theme from seeded random lineups (same result every time the server starts).
const tables=new Map();
function table(theme){
 if(tables.has(theme))return tables.get(theme);
 const t=DRAFT_THEMES[theme];let seed=0x2f6b1a;
 const rand=()=>((seed=(seed*1103515245+12345)&0x7fffffff)/0x7fffffff);
 const scores=[];
 for(let i=0;i<2000;i++)scores.push(teamScore(theme,t.slots.map(s=>{const c=t.cards[s.id];return c[Math.floor(rand()*c.length)];})));
 scores.sort((a,b)=>a-b);tables.set(theme,scores);return scores;
}
export function percentile(theme,score){const s=table(theme);let lo=0;while(lo<s.length&&s[lo]<=score)lo++;return Math.round(100*lo/s.length);}

export function scout(theme,raw){
 const parts=raw.map(x=>{const i=String(x).indexOf(': ');return i>0?[x.slice(0,i),x.slice(i+2)]:[null,x];}),names=parts.map(p=>p[1]);
 const t=DRAFT_THEMES[theme],score=teamScore(theme,names),pct=percentile(theme,score);
 const grade=GRADES.find(([,min])=>pct>=min)[0];
 const players=names.map((n,i)=>{const r=rating(theme,n);return {name:n,slot:(parts[i][0]||t.slots[i]?.id||'').toUpperCase(),ovr:Math.round(Math.max(r.off,r.def)*0.65+Math.min(r.off,r.def)*0.35),note:r.note};});
 const rank=pct>=50?`top ${Math.max(1,100-pct)}%`:`bottom ${Math.max(1,pct)}%`;
 return {score,pct,top:Math.max(1,100-pct),rank,grade,band:bandOf(grade),report:report(theme,names),players};
}

// One plain line: who carries the team, then the weak spot. Uses each player's best side, so a defensive
// star never makes a lineup read as "all offense".
function report(theme,names){
 if(!names.length)return 'No picks to grade.';
 const rs=names.map(n=>rating(theme,n)),best=rs.map(r=>Math.max(r.off,r.def)),avgBest=avg(best);
 const top=best.indexOf(Math.max(...best)),low=best.indexOf(Math.min(...best));
 const lead=best[top]>=93?`${names[top]} carries it.`:avgBest>=85?'Deep and dangerous.':avgBest>=74?'Solid starters.':'A thin roster.';
 const hoopsDef=theme==='hoops'&&avg(rs.map(r=>r.def))<66;
 const weak=best[low]<62?`${names[low]} is the weak link.`:hoopsDef?'Nobody guards the paint.':best[low]>=80?'No weak spot.':`${names[low]} is the swing piece.`;
 return `${lead} ${weak}`;
}

const avg=a=>a.reduce((s,x)=>s+x,0)/a.length;
const round1=x=>Math.round(x*10)/10;
