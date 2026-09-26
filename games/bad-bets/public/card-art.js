// Card art for Fantasy Draft and Bidding War: player headshots (or a jersey card when there is no photo)
// for player themes, and prop stickers for every other theme. Data files load once; until then cards show text only.
import {foodLabel} from './restaurants.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let players=null,props=null,loading=null;
export function setCardArtData(p,m){players=p||{};props=m||{};}
export function loadCardArt(onReady){
 if(!loading)loading=Promise.all([
  fetch('/players/players.json').then(r=>r.ok?r.json():{}).catch(()=>({})),
  fetch('/art/props/props-map.json').then(r=>r.ok?r.json():{}).catch(()=>({}))
 ]).then(([p,m])=>setCardArtData(p,m));
 return loading.then(()=>{try{onReady?.();}catch{}});
}
const FOOD_SLOTS={draft:['main','side','drink','wildcard'],auction:['main','side','drink','dessert']};
const PALETTE=['#087F98','#e05a47','#3b6fd6','#F4CD72','#BAB4EA'];
export function nameHash(s){let h=0x811c9dc5;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h;}
export const jerseyColor=name=>PALETTE[nameHash(name)%PALETTE.length];
export const initials=name=>String(name).replace(/[^A-Za-z' .-]/g,'').split(/[\s.-]+/).filter(w=>/^[A-Za-z]/.test(w)).map(w=>w.replace(/^[^A-Za-z]+/,'')[0].toUpperCase()).slice(0,2).join('')||'?';
// Illustrated jersey in a colour from the name, with the player's initials. Same circular sticker frame as a photo.
export function jerseyCard(name){const c=jerseyColor(name),ink=['#F4CD72','#BAB4EA'].includes(c)?'#1c2433':'#fff';
 return `<span class="card-art headshot jersey" title="${esc(name)}"><svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect width="40" height="40" fill="#fdf6e8"/><path d="M13 7h4.5a2.5 2.5 0 0 0 5 0H27l6 5-3 5-3-2v19H13V15l-3 2-3-5z" fill="${c}" stroke="#1c2433" stroke-width="1.4" stroke-linejoin="round"/><text x="20" y="27" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="9.5" fill="${ink}">${esc(initials(name))}</text></svg></span>`;}
export function headshot(name){const p=players&&Object.hasOwn(players,name)?players[name]:null;
 if(p&&typeof p.file==='string'&&/^\/players\/[a-z0-9-]+\.jpg$/.test(p.file))return `<span class="card-art headshot" data-fallback="${esc(jerseyCard(name))}"><img src="${esc(p.file)}" alt="" width="80" height="80" loading="eager" fetchpriority="high" decoding="async" onerror="this.parentNode.outerHTML=this.parentNode.dataset.fallback"></span>`;
 return jerseyCard(name);}
export function propArt(key){if(!props)return '';let name=Object.hasOwn(props,key)?props[key]:props._fallback;if(typeof name!=='string'||!/^[a-z0-9-]+$/.test(name))return '';
 return `<span class="card-art prop"><img src="/art/props/${name}.svg" alt="" width="80" height="80" loading="lazy" decoding="async" onerror="this.parentNode.remove()"></span>`;}
const themeOf=s=>s?.theme||{id:'food',food:true,players:false};
const slotId=(s,i)=>{const t=themeOf(s);return (t.slotIds||FOOD_SLOTS[s?.game]||[])[i]||'';};
// Art for one card or lot. kind: 'card' (a draft card in slot i) or 'lot' (an auction lot).
export function cardArt(s,text,i,kind){
 if(!players&&!props)return '';const t=themeOf(s),game=s?.game;if(!['draft','auction'].includes(game))return '';
 if(t.players)return players?headshot(text):'';
 if(game==='auction'&&t.food)return ''; // food auction keeps restaurant logos
 return propArt(kind==='lot'?`${t.id}/lots/${text}`:`${t.id}/${slotId(s,i)}/${text}`);
}
// Auction picks read "Slot: Lot", or "Slot: item (Lot)" when the winner named an item.
export function lotFromPick(s,pick){const t=themeOf(s),rest=String(pick).replace(/^[^:]*:\s*/,''),m=/\(([^()]*)\)\s*$/.exec(rest);if(!m)return rest;
 const known=x=>t.players?!!players&&Object.hasOwn(players,x):!!props&&Object.hasOwn(props,`${t.id}/lots/${x}`);return known(rest)||!known(m[1])&&!s?.auction?.nameItem?rest:m[1];}
export function pickArt(s,pick,i){const t=themeOf(s);if(s?.game==='auction'){if(t.food)return '';return cardArt(s,lotFromPick(s,pick),i,'lot');}return cardArt(s,pick,i,'card');}
// Label for a draft card or a pick: art plus text. Falls back to the food label (restaurant logos) when there is no art.
export function cardLabel(s,item,i){const art=pickArt(s,item,i);return art?`${art}<span>${esc(item)}</span>`:foodLabel(item);}
// Art for an auction lot heading: headshot or prop for themes, nothing for food (lotHeading keeps the logo).
export const lotArt=(s,name)=>cardArt(s,name,0,'lot');
