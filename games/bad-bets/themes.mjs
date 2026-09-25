// Theme layer for Fantasy Draft (id 'draft') and Bidding War (id 'auction').
// 'food' is built in from the original food cards and restaurants. Other themes come from theme-content.mjs,
// which may be empty; everything here must work with empty objects.
import {DRAFT_THEMES,AUCTION_THEMES} from './theme-content.mjs';
export const THEMED_GAMES=['draft','auction'];
export const DEFAULT_THEMES={draft:'food',auction:'food'};
const content=game=>(game==='draft'?DRAFT_THEMES:AUCTION_THEMES)||{};
const valid=(game,id)=>{const t=content(game)[id];if(!t||typeof t!=='object'||!Array.isArray(t.slots)||!t.slots.length||!Array.isArray(t.prompts)||!t.prompts.length)return false;return game==='draft'?t.slots.every(s=>Array.isArray(t.cards?.[s.id])&&t.cards[s.id].length):Array.isArray(t.lots)&&t.lots.length>0;};
export function themeIds(game){return ['food',...Object.keys(content(game)).filter(id=>id!=='food'&&/^[a-z0-9-]+$/.test(id)&&valid(game,id))];}
export function validateTheme(game,id){if(!THEMED_GAMES.includes(game))throw Error('That game has no themes.');if(typeof id!=='string'||!themeIds(game).includes(id))throw Error('Choose a theme from the list.');return id;}
export const themeIcon=(game,id)=>id==='food'?`/art/theme-food-${game}.svg`:`/art/theme-${id}.svg`;
// Short slot name from a label like "a getaway driver" -> "Getaway driver".
export const slotName=label=>{const s=String(label||'').trim().replace(/^(a|an|the)\s+/i,'');return s.charAt(0).toUpperCase()+s.slice(1);};
const FOOD_DRAFT_SLOTS=[{id:'main',label:'a main'},{id:'side',label:'a side'},{id:'drink',label:'a drink'},{id:'wildcard',label:'a wildcard'}];
const FOOD_AUCTION_SLOTS=[{id:'main',label:'a main'},{id:'side',label:'a side'},{id:'drink',label:'a drink'},{id:'dessert',label:'a dessert'}];
export function getTheme(game,id='food'){
 if(!THEMED_GAMES.includes(game))return null;
 if(id!=='food'&&themeIds(game).includes(id)){const t=content(game)[id];return {id,food:false,name:String(t.name||id),blurb:String(t.blurb||''),icon:themeIcon(game,id),slots:t.slots.map(s=>({id:String(s.id),label:String(s.label||s.id)})),cards:t.cards||{},lots:t.lots||[],prompts:t.prompts,nameItem:!!t.nameItem,itemPrompt:String(t.itemPrompt||'')};}
 return {id:'food',food:true,name:'Food',blurb:game==='draft'?'Draft a meal from the food court.':'Bid on restaurants, then name your food.',icon:themeIcon(game,'food'),slots:game==='draft'?FOOD_DRAFT_SLOTS:FOOD_AUCTION_SLOTS,nameItem:true,itemPrompt:''};
}
export const roomTheme=(r,game)=>getTheme(game,(r.themes||DEFAULT_THEMES)[game]||'food');
// What players see about a theme. No card lists, only names and slot labels.
export function themeInfo(game,id){const t=getTheme(game,id);if(!t)return null;return {id:t.id,name:t.name,blurb:t.blurb,icon:t.icon,food:t.food,slots:t.slots.map(s=>slotName(s.label)),labels:t.slots.map(s=>s.label)};}
export function themeOptions(){return Object.fromEntries(THEMED_GAMES.map(g=>[g,themeIds(g).map(id=>{const t=themeInfo(g,id);return {id,name:t.name,blurb:t.blurb,icon:t.icon};})]));}
