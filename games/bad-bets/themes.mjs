// Theme layer for Fantasy Draft (id 'draft') and Bidding War (id 'auction').
// 'food' is built in from the original food cards and restaurants. Other themes come from theme-content.mjs,
// which may be empty; everything here must work with empty objects.
import {DRAFT_THEMES,AUCTION_THEMES} from './theme-content.mjs';
import {drawFrom} from './bags.mjs';
export const THEMED_GAMES=['draft','auction'];
// 'random' = roll a theme each round from a no-repeat bag (the owner's choice: no host picker).
export const DEFAULT_THEMES={draft:'random',auction:'random'};
export const PLAYER_THEMES=['hoops','bench'];
export const VETO_MS=6000;
const content=game=>(game==='draft'?DRAFT_THEMES:AUCTION_THEMES)||{};
const valid=(game,id)=>{const t=content(game)[id];if(!t||typeof t!=='object'||!Array.isArray(t.slots)||!t.slots.length||!Array.isArray(t.prompts)||!t.prompts.length)return false;return game==='draft'?t.slots.every(s=>Array.isArray(t.cards?.[s.id])&&t.cards[s.id].length):Array.isArray(t.lots)&&t.lots.length>0;};
export function themeIds(game){return ['food',...Object.keys(content(game)).filter(id=>id!=='food'&&/^[a-z0-9-]+$/.test(id)&&valid(game,id))];}
export function validateTheme(game,id){if(!THEMED_GAMES.includes(game))throw Error('That game has no themes.');if(id==='random')return id;if(typeof id!=='string'||!themeIds(game).includes(id))throw Error('Choose a theme from the list.');return id;}
export const themeIcon=(game,id)=>id==='food'?`/art/theme-food-${game}.svg`:`/art/theme-${id}.svg`;
// Short slot name from a label like "a getaway driver" -> "Getaway driver".
export const slotName=label=>{const s=String(label||'').trim().replace(/^(a|an|the)\s+/i,'');return s.charAt(0).toUpperCase()+s.slice(1);};
const FOOD_DRAFT_SLOTS=[{id:'main',label:'a main'},{id:'side',label:'a side'},{id:'drink',label:'a drink'},{id:'wildcard',label:'a wildcard'}];
const FOOD_AUCTION_SLOTS=[{id:'main',label:'a main'},{id:'side',label:'a side'},{id:'drink',label:'a drink'},{id:'dessert',label:'a dessert'}];
export function getTheme(game,id='food'){
 if(!THEMED_GAMES.includes(game))return null;
 if(id!=='food'&&themeIds(game).includes(id)){const t=content(game)[id];return {id,food:false,players:t.players===true||PLAYER_THEMES.includes(id),name:String(t.name||id),blurb:String(t.blurb||''),icon:themeIcon(game,id),slots:t.slots.map(s=>({id:String(s.id),label:String(s.label||s.id)})),cards:t.cards||{},lots:t.lots||[],prompts:t.prompts,nameItem:!!t.nameItem,itemPrompt:String(t.itemPrompt||'')};}
 return {id:'food',food:true,players:false,name:'Food',blurb:game==='draft'?'Draft a meal from the food court.':'Bid on restaurants, then name your food.',icon:themeIcon(game,'food'),slots:game==='draft'?FOOD_DRAFT_SLOTS:FOOD_AUCTION_SLOTS,nameItem:true,itemPrompt:''};
}
// The round's rolled theme wins; otherwise a fixed room theme (older rooms), otherwise food.
export const roomTheme=(r,game)=>{if(r.game===game&&r.roundTheme&&themeIds(game).includes(r.roundTheme))return getTheme(game,r.roundTheme);const fixed=(r.themes||{})[game];return getTheme(game,fixed&&fixed!=='random'?fixed:'food');};
// Pick this round's theme. Fixed room themes are kept. 'random' draws from a no-repeat bag, so every theme
// comes up once before any repeats. exclude skips ids (the vetoed theme) when another one exists.
export function rollTheme(r,game,exclude=[]){const ids=themeIds(game);const fixed=(r.themes||{})[game];if(fixed&&fixed!=='random'&&ids.includes(fixed)&&!exclude.includes(fixed))return fixed;const open=ids.filter(id=>!exclude.includes(id));if(!open.length)return ids[0];for(let i=0;i<ids.length*2;i++){const id=drawFrom(r,`theme:${game}`,ids);if(!exclude.includes(id))return id;}return open[0];}
export const isRandomTheme=(r,game)=>{const fixed=(r.themes||{})[game];return !fixed||fixed==='random'||!themeIds(game).includes(fixed);};
// What players see about a theme. No card lists, only names and slot labels.
export function themeInfo(game,id){const t=getTheme(game,id);if(!t)return null;return {id:t.id,name:t.name,blurb:t.blurb,icon:t.icon,food:t.food,players:!!t.players,slotIds:t.slots.map(s=>s.id),slots:t.slots.map(s=>slotName(s.label)),labels:t.slots.map(s=>s.label)};}
export function themeOptions(){return Object.fromEntries(THEMED_GAMES.map(g=>[g,themeIds(g).map(id=>{const t=themeInfo(g,id);return {id,name:t.name,blurb:t.blurb,icon:t.icon};})]));}
