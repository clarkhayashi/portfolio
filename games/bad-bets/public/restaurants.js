// Restaurant marks identify the game’s choices; names remain the accessible labels.
export const RESTAURANTS = {
 'McDonald’s':'mcdonalds.svg','Taco Bell':'taco-bell.svg','Wendy’s':'wendys.svg',
 'Burger King':'burger-king.svg','Chick-fil-A':'chick-fil-a.svg','Popeyes':'popeyes.png',
 'Sonic':'sonic.png','Dairy Queen':'dairy-queen.png','Shake Shack':'shake-shack.svg',
 'Five Guys':'five-guys.svg','In-N-Out':'in-n-out.svg','Jack in the Box':'jack-in-the-box.svg',
 'Subway':'subway.svg','Chipotle':'chipotle.svg','Panda Express':'panda-express.svg',
 'KFC':'kfc.ico','Arby’s':'arbys.png','Culver’s':'culvers.svg','Whataburger':'whataburger.png','Dunkin’':'dunkin.png'
};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function restaurantLogo(name){return Object.hasOwn(RESTAURANTS,name)?`<span class="restaurant-mark"><img src="/logos/${RESTAURANTS[name]}" alt="" width="80" height="80" decoding="async"></span>`:'';}
export function restaurantHeading(name){return `<h3 class="restaurant-heading">${restaurantLogo(name)}<span>${esc(name)}</span></h3>`;}
const draftBrands={'Big Mac':'McDonald’s','Crunchwrap':'Taco Bell'};
export function foodLabel(value){const brand=Object.keys(RESTAURANTS).find(name=>String(value).endsWith(' ('+name+')')||String(value).endsWith(' — '+name))||(Object.hasOwn(draftBrands,value)?draftBrands[value]:null);return `${brand?restaurantLogo(brand):''}<span>${esc(value)}</span>`;}

// Theme art for non-food lots. The image removes itself if the file is missing.
export function themeMark(icon){return icon?`<span class="restaurant-mark theme-mark"><img src="${esc(icon)}" alt="" width="80" height="80" decoding="async" onerror="this.parentNode.remove()"></span>`:'';}
// Food lots show the restaurant logo; other themes show the theme icon.
export function lotHeading(name,a,art=''){return a&&a.food===false?`<h3 class="restaurant-heading lot-heading">${art||themeMark(a.icon)}<span>${esc(name)}</span></h3>`:restaurantHeading(name);}
// Theme icon plus name, for intro, rounds and results.
export function themeBadge(theme){return theme?`<div class="theme-badge">${themeMark(theme.icon)}<span>${esc(theme.name)} theme</span></div>`:'';}
// Bigger theme card for the reveal: icon, name and blurb.
export function themeCard(theme){return theme?`<div class="theme-card">${themeMark(theme.icon)}<div><strong>${esc(theme.name)}</strong>${theme.blurb?`<span>${esc(theme.blurb)}</span>`:''}</div></div>`:'';}
// "meal" in the food theme, neutral words otherwise.
export function buildWord(s){return !s.theme||s.theme.food?'meal':s.game==='draft'?'team':'build';}
