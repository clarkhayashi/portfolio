// "My moment": one player's best moment of the night, for the 9:16 story card. Pure, importable in node.
// Order: the player's award (a fun one before Chip Leader / Most Wins), else their biggest chip win,
// else a round they won, else how long they played. Never quotes anyone's answers or drawings.
import {gameById} from './catalog.js';
const EXTRA={finale:'One More Round',mixer:'Date Night'};
export const gameName=id=>gameById(id)?.name||EXTRA[id]||'a round';
export function ordinal(n){const v=n%100,s=v>=11&&v<=13?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th');return `${n}${s}`;}
const wins=(s,id)=>(s.history||[]).filter(h=>(h.s?.w||[]).includes(id)).length;
// Placement among the players still in the room. Party ranks by chips, Minigames by rounds won. Ties share a place.
export function placement(s,id){
 const live=(s.players||[]).filter(p=>!p.left),party=s.mode!=='minigames',score=p=>party?p.chips:wins(s,p.id),me=live.find(p=>p.id===id);
 if(!me)return null;const mine=score(me),rank=1+live.filter(p=>score(p)>mine).length,tied=live.some(p=>p.id!==id&&score(p)===mine);
 return {rank,of:live.length,tied,score:mine,unit:party?'chips':mine===1?'round won':'rounds won',label:`${tied?'Tied ':''}${ordinal(rank)} of ${live.length}`};
}
export function pickMoment(s,id){
 const mine=(s.awards||[]).filter(a=>(a.players||[]).includes(id)),award=mine.find(a=>!['leader','wins'].includes(a.id))||mine[0];
 if(award)return {kind:'award',icon:award.icon,title:award.title,line:award.line};
 let best=null;for(const h of s.history||[]){const n=h.changes?.[id];if(typeof n==='number'&&n>0&&(!best||n>best.n))best={n,h};}
 if(best)return {kind:'win',icon:'🪙',title:`Won ${best.n} chips`,line:`Round ${best.h.round} · ${gameName(best.h.game)}`};
 const won=(s.history||[]).find(h=>(h.s?.w||[]).includes(id));
 if(won)return {kind:'round',icon:'⭐',title:`Won ${gameName(won.game)}`,line:`Round ${won.round}`};
 const joined=(s.players||[]).find(p=>p.id===id)?.joined,n=(s.history||[]).filter(h=>!joined||h.round>=joined).length;
 return {kind:'played',icon:'🎲',title:'Showed up and played',line:`${n} ${n===1?'round':'rounds'} tonight`};
}
