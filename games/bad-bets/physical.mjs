import {randomInt} from 'node:crypto';
export const categories=['US states','Fast-food chains','Cereal brands','Road-trip snacks','Sports teams','Celebrities','Things at a cookout','Things at Target','Pizza toppings','Animals','Movies','Bad first-date locations','Things you lose','Things in a junk drawer','Excuses for being late','Ice cream flavors'];
export function setupPhysical(r){
 r.physical={scores:Object.fromEntries(r.active.map(id=>[id,0])),confirmed:[],revision:0,started:null,elapsed:0,paused:true,practice:false,category:'',attacker:r.active[randomInt(r.active.length)],keeper:r.game==='shadow'?(r.players.find(p=>!p.left&&!r.active.includes(p.id))?.id||r.host):r.host,undo:[]};
}
export function physicalElapsed(r,now=Date.now()){const p=r.physical;return p.elapsed+(p.started&&!p.paused?now-p.started:0);}
export function physicalStop(r){const p=r.physical;p.elapsed=physicalElapsed(r);p.started=null;p.paused=true;}
export function physicalAction(g,r,player,a){
 const p=r.physical;if(!p||!['physicalSetup','physical','physicalConfirm','physicalDispute'].includes(r.phase))throw Error('This activity has ended.');
 const host=player.id===r.host,keeper=player.id===p.keeper||host;
 if(a.type==='physicalPause'){physicalStop(r);return;}
 if(a.revision!==p.revision)throw Error('The score changed. Check the current score and try again.');
 if(a.type==='physicalCategory'){
  if(!host||r.phase!=='physicalSetup'||r.game!=='rhythm')throw Error('The host chooses the category before play.');
  p.category=a.random?(g.drawContent?g.drawContent(r,'rhythm'):categories[randomInt(categories.length)]):String(a.value||'').trim().slice(0,70);if(!p.category)throw Error('Choose or write a category.');r.prompt=p.category;
 }else if(a.type==='physicalStart'){
  if(!host||['physicalConfirm','physicalDispute'].includes(r.phase))throw Error('Only the host can start the beat.');
  if(r.game==='rhythm'&&!p.category)throw Error('Choose a category first.');
  if(r.phase==='physicalSetup'){p.practice=!!a.practice;p.elapsed=0;}else if(p.practice){p.practice=false;p.elapsed=0;}
  p.started=Date.now();p.paused=false;g.phase(r,'physical');
 }else if(a.type==='physicalScore'){
  if(!keeper||r.phase==='physicalSetup'||p.practice)throw Error('The scorekeeper records the score during play.');
  if(!r.active.includes(a.player)||![1,-1].includes(a.delta))throw Error('Choose a valid player and score.');
  p.undo.push({scores:{...p.scores},attacker:p.attacker});if(p.undo.length>60)p.undo.shift();
  p.scores[a.player]=Math.max(0,Math.min(r.game==='shadow'?3:2,p.scores[a.player]+a.delta));p.confirmed=[];
  if(r.phase==='physicalConfirm')g.phase(r,'physicalConfirm',10);
  if(r.game==='shadow'&&p.scores[a.player]===3){physicalStop(r);g.phase(r,'physicalConfirm',10);}
 }else if(a.type==='physicalDodge'){
  if(!keeper||r.game!=='shadow'||r.phase!=='physical'||p.practice)throw Error('Only the scorekeeper can switch the attacker during play.');
  p.undo.push({scores:{...p.scores},attacker:p.attacker});if(p.undo.length>60)p.undo.shift();p.attacker=r.active.find(id=>id!==p.attacker);
 }else if(a.type==='physicalUndo'){
  if(!keeper||!p.undo.length)throw Error('No score change to undo.');const old=p.undo.pop();p.scores=old.scores;p.attacker=old.attacker;p.confirmed=[];physicalStop(r);g.phase(r,'physical');
 }else if(a.type==='physicalFinish'){
  if(!host||r.phase!=='physical'||p.practice)throw Error('Only the host can finish a live round.');physicalStop(r);p.confirmed=[];g.phase(r,'physicalConfirm',10);
 }else if(a.type==='physicalConfirm'){
  if(r.phase!=='physicalConfirm'||!r.active.includes(player.id))throw Error('Players confirm the final score.');
  if(!p.confirmed.includes(player.id))p.confirmed.push(player.id);
  if(r.active.every(id=>p.confirmed.includes(id)))g.settle(r);
  return;
 }else if(a.type==='physicalDispute'){
  if(r.phase!=='physicalConfirm'||!r.active.includes(player.id))throw Error('Players can dispute the final score.');
  p.confirmed=[];physicalStop(r);g.phase(r,'physicalDispute',30);
 }else if(a.type==='physicalResolve'){
  if(!host||r.phase!=='physicalDispute')throw Error('Only the host can present a corrected score.');p.confirmed=[];g.phase(r,'physicalConfirm',10);
 }else throw Error('Unknown activity action.');
 p.revision++;
}
