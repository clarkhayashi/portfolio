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
 return {score,pct,top:Math.max(1,100-pct),grade,band:bandOf(grade),report:report(theme,names),players};
}

// One plain line from the lineup's shape: strongest trait, then the weak spot.
function report(theme,names){
 const rs=names.map(n=>rating(theme,n)),off=avg(rs.map(r=>r.off)),def=avg(rs.map(r=>r.def));
 const lo=Math.min(...rs.map(r=>Math.max(r.off,r.def))),hi=Math.max(...rs.map(r=>Math.max(r.off,r.def)));
 const words={hoops:['scoring','defense','the paint'],nfl:['offense','toughness','the trenches'],mlb:['hitting','run prevention','the rotation']}[theme]||['offense','defense','depth'];
 const strong=off>=85&&def>=78?'Elite on both ends.':off-def>8?`All ${words[0]}.`:def-off>8?`Built on ${words[1]}.`:'Balanced on both ends.';
 const weak=hi-lo>25?`${names[rs.findIndex(r=>Math.max(r.off,r.def)===lo)]} is the weak link.`:def<68?`Nobody holds down ${words[2]}.`:off<68?'Points will be hard to find.':hi>=95?'A true star leads it.':'No real weak spot.';
 return `${strong} ${weak}`;
}

const avg=a=>a.reduce((s,x)=>s+x,0)/a.length;
const round1=x=>Math.round(x*10)/10;
