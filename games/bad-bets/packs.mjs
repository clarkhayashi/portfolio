// Content layer: builds prompt pools from core content, enabled packs, and player-written prompts.
// Draws use a per-room shuffled bag of indices, so nothing repeats until the pool runs out.
import {randomInt} from 'node:crypto';
import {BALLPARK_CORE,CORE_EXTRA,PACKS} from './pack-content.mjs';
import {quips} from './creative.mjs';
import {categories} from './physical.mjs';
import {itemWeight} from './ratings.mjs';
import {drawFrom} from './bags.mjs';
export {drawFrom};

export const meals=['Build your dream fast-food meal.','Build the best meal after a concert.','Build a drive-through date-night dinner.','Build the ultimate road-trip meal.'];
export const brain=['Worst animal to share an elevator with?','Best midnight snack?','Most suspicious thing to carry in a briefcase?','Worst place to fall asleep?','An animal that would be a terrible roommate?','What would a pigeon buy with $100?'];
export const nums=[['How many minutes are in one week?',10080],['How many squares are on a standard chessboard (individual cells)?',64],['How many legs do seven spiders have?',56],['How many seconds are in two hours?',7200],['How many sides do nine triangles have altogether?',27],['How many months are in 15 years?',180],['How many cards are in a standard deck without jokers?',52],['How many days are in three non-leap years?',1095],['How many inches are in five feet?',60]];
export const drawings=['A pigeon applying for a mortgage','A potato on its first date','A haunted vending machine','A raccoon running a luxury hotel','A dinosaur stuck on a video call'];
// Engine format for faker items is [word, category].
export const secrets=[['Airport','Places'],['Popcorn','Food'],['Dentist','Jobs'],['Camping','Activities'],['Karaoke','Activities'],['Aquarium','Places'],['Library','Places'],['Roller coaster','Things you ride'],['Pizza','Food'],['Firefighter','Jobs'],['Bicycle','Things you ride'],['Bowling','Activities']];

export const KINDS=['brain','number','food','draw','faker','quips','rhythm'];
export const CUSTOM_TYPES={brain:'Same Brain question',quips:'Bad Answers prompt',draw:'Drawing idea',rhythm:'Keep It Going category',faker:'Imposter word'};
export const CUSTOM_LIMIT=2,CUSTOM_MAX=90,CATEGORY_MAX=40;
export const PACK_IDS=Object.keys(PACKS);
const BASE={brain,food:meals,draw:drawings,faker:secrets,quips,rhythm:categories};
const text=s=>typeof s==='string'?s.trim():'';
export const normText=s=>String(s||'').toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();

// Pack faker items arrive as [category, word]; engine uses [word, category].
function clean(kind,items,{packFormat=false}={}){
 const out=[];for(const item of Array.isArray(items)?items:[]){
  if(kind==='number'){if(Array.isArray(item)&&text(item[0])&&Number.isFinite(Number(item[1])))out.push([text(item[0]),Number(item[1])]);}
  else if(kind==='faker'){if(Array.isArray(item)){const [word,category]=packFormat?[item[1],item[0]]:item;if(text(word)&&text(category))out.push([text(word),text(category)]);}}
  else{const s=Array.isArray(item)?text(item[0]):text(item);if(s)out.push(s);}
 }return out;
}
const key=(kind,item)=>normText(kind==='number'||kind==='faker'?item[0]:item);
function corePool(kind){
 if(kind==='number')return BALLPARK_CORE.length&&clean('number',BALLPARK_CORE).length?clean('number',BALLPARK_CORE):nums;
 return [...BASE[kind],...clean(kind,CORE_EXTRA[kind],{packFormat:true})];
}
export function packCount(id){const p=PACKS[id];if(!p)return 0;return KINDS.reduce((n,k)=>n+clean(k,p[k==='food'?'food':k],{packFormat:true}).length,0);}
// Adult packs only appear once the host switches the room to Adults (family.mjs).
export const ADULT_PACKS=['spicy'];
export function packOptions(){return PACK_IDS.map(id=>({id,name:PACKS[id].name||id,description:PACKS[id].description||'',count:packCount(id),adult:ADULT_PACKS.includes(id)})).filter(p=>p.count>0);}
export function validatePacks(ids){
 if(!Array.isArray(ids)||ids.length>PACK_IDS.length)throw Error('Choose valid question packs.');
 const out=[];for(const id of ids){if(typeof id!=='string'||!Object.hasOwn(PACKS,id))throw Error('Unknown question pack.');if(!out.includes(id))out.push(id);}
 return PACK_IDS.filter(id=>out.includes(id));
}
export function customItems(kind,custom=[]){
 return (custom||[]).filter(c=>c&&c.type===kind).map(c=>kind==='faker'?[c.text,c.category]:c.text).filter(x=>kind==='faker'?x[0]&&x[1]:x);
}
// Full pool for one kind: core, then enabled packs in fixed order, then player-written items. Duplicates dropped.
export function pool(kind,packs=[],custom=[]){
 if(!KINDS.includes(kind))throw Error('Unknown content kind.');
 const items=[...corePool(kind)];
 for(const id of PACK_IDS)if(packs.includes(id))items.push(...clean(kind,PACKS[id][kind],{packFormat:true}));
 items.push(...customItems(kind,custom));
 const seen=new Set(),out=[];for(const item of items){const k=key(kind,item);if(!k||seen.has(k))continue;seen.add(k);out.push(item);}
 return out.length?out:kind==='number'?nums:[...BASE[kind]];
}
// Weight for one pool item in this room: player-written prompts are always 1.0.
export function roomWeigher(r,kind){const mine=new Set(customItems(kind,r.custom||[]).map(x=>key(kind,x)));return item=>mine.has(key(kind,item))?1:itemWeight(kind,item,r.mood);}
// Draw one item from the room's bag for this kind.
export function draw(r,kind){
 const items=pool(kind,r.packs||[],r.custom||[]);
 return drawFrom(r,kind,items,roomWeigher(r,kind));
}
export function resetBags(r,kinds){if(!r.bags)return;if(!kinds){r.bags={};return;}for(const k of kinds)delete r.bags[k];}
// Validate and add a player-written prompt. Throws a short player-facing error.
export function addCustom(r,playerId,a){
 const type=String(a.kind||'');if(!Object.hasOwn(CUSTOM_TYPES,type))throw Error('Pick a prompt type.');
 const value=String(a.value??'').trim().replace(/\s+/g,' ');if(!value)throw Error('Type your prompt first.');if(value.length>CUSTOM_MAX)throw Error(`Keep it under ${CUSTOM_MAX} characters.`);
 let category;if(type==='faker'){category=String(a.category??'').trim().replace(/\s+/g,' ');if(!category)throw Error('Add a category for your word.');if(category.length>CATEGORY_MAX)throw Error(`Keep the category under ${CATEGORY_MAX} characters.`);if(value.length>30)throw Error('Keep the word under 30 characters.');}
 r.custom||=[];if(r.custom.filter(c=>c.by===playerId).length>=CUSTOM_LIMIT)throw Error(`You can add ${CUSTOM_LIMIT} prompts.`);
 const k=normText(value);if(!k)throw Error('Use some letters or numbers.');
 if(pool(type,r.packs||[],r.custom).some(item=>key(type,item)===k))throw Error('That one is already in the game.');
 r.custom.push(type==='faker'?{by:playerId,type,text:value,category}:{by:playerId,type,text:value});resetBags(r,[type]);
}
export function removeCustom(r,playerId,index){
 const mine=(r.custom||[]).map((c,i)=>[c,i]).filter(([c])=>c.by===playerId);const hit=mine[Number(index)];
 if(!hit)throw Error('That prompt is gone.');const [c,i]=hit;r.custom.splice(i,1);resetBags(r,[c.type]);
}
