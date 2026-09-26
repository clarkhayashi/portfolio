// Loops: the rules, as plain functions over one db object. No I/O here, so the web server,
// tests and a future iOS backend all share it.
// Design contract: replies are a gift. Nothing here tracks "seen", streaks, counts or reply timers.
import {randomBytes} from 'node:crypto';
import {cleanText} from '../wordfilter.mjs';
import {resolve as pongShot} from '../public/loops/pong-sim.js';

export const REACTIONS=['💛','😂','same','🤙'];
const newId=(n=9)=>randomBytes(n).toString('base64url');
const code=()=>Array.from({length:6},()=> 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[randomBytes(1)[0]%31]).join('');
const now=()=>Date.now();
const need=(ok,msg)=>{if(!ok)throw Error(msg);};

export const emptyDb=()=>({users:{},loops:{},thoughts:[],pongs:{},h2h:{},trips:[]});

// ---------- people ----------
export function signUp(db,{name,city}){
 name=cleanText(name,24);need(name,'Add your name.');
 const u={id:newId(),token:newId(18),name,city:cleanText(city||'',40),openDoor:true,createdAt:now()};
 db.users[u.id]=u;return u;
}
export function userByToken(db,token){const u=Object.values(db.users).find(u=>u.token===token);need(u,'Sign in again.');return u;}
export function updateMe(db,u,{name,city,openDoor}){
 if(name!==undefined){name=cleanText(name,24);need(name,'Add your name.');u.name=name;}
 if(city!==undefined)u.city=cleanText(city,40);
 if(openDoor!==undefined)u.openDoor=!!openDoor;
 return u;
}
const pub=u=>u&&{id:u.id,name:u.name,city:u.city,openDoor:u.openDoor};

// Delete an account and everything it made (Apple requires in-app deletion for apps with sign-up).
export function deleteUser(db,u){
 const id=u.id;
 delete db.users[id];
 for(const l of Object.values(db.loops)){l.members=l.members.filter(m=>m!==id);delete l.nick[id];if(!l.members.length)delete db.loops[l.id];}
 const gone=new Set(db.thoughts.filter(t=>t.from===id||(t.to.type==='user'&&t.to.id===id)).map(t=>t.id));
 db.thoughts=db.thoughts.filter(t=>!gone.has(t.id));
 for(const t of db.thoughts)delete t.reactions[id];
 db.trips=db.trips.filter(t=>t.uid!==id);for(const t of db.trips)delete t.downs[id];
 for(const g of Object.values(db.pongs||{}))if(g.a===id||g.b===id)delete db.pongs[g.id];
 for(const k of Object.keys(db.h2h||{}))if(k.split('|').includes(id))delete db.h2h[k];
 return [...gone]; // thought ids, so the store can drop their photos
}

// ---------- loops (groups) ----------
// Every loop has one public name the group shares, and each member can keep a private name only they see.
export function createLoop(db,u,{publicName,privateName}){
 publicName=cleanText(publicName,40);need(publicName,'Name the loop.');
 const l={id:newId(),code:code(),publicName,members:[u.id],nick:{},createdBy:u.id,createdAt:now()};
 if(privateName)l.nick[u.id]=cleanText(privateName,40);
 db.loops[l.id]=l;return l;
}
export function joinLoop(db,u,inviteCode){
 const l=Object.values(db.loops).find(l=>l.code===String(inviteCode||'').toUpperCase().trim());need(l,'That invite link is not valid anymore.');
 if(!l.members.includes(u.id))l.members.push(u.id);return l;
}
export function renameLoop(db,u,loopId,{publicName,privateName}){
 const l=memberLoop(db,u,loopId);
 if(publicName!==undefined){publicName=cleanText(publicName,40);need(publicName,'Name the loop.');l.publicName=publicName;}
 if(privateName!==undefined){const p=cleanText(privateName,40);if(p)l.nick[u.id]=p;else delete l.nick[u.id];}
 return l;
}
export function leaveLoop(db,u,loopId){const l=memberLoop(db,u,loopId);l.members=l.members.filter(m=>m!==u.id);delete l.nick[u.id];}
function memberLoop(db,u,loopId){const l=db.loops[loopId];need(l&&l.members.includes(u.id),'You are not in that loop.');return l;}
const myLoops=(db,u)=>Object.values(db.loops).filter(l=>l.members.includes(u.id));
// People I share at least one loop with.
function circle(db,u){const ids=new Set();for(const l of myLoops(db,u))l.members.forEach(m=>m!==u.id&&ids.add(m));return [...ids].map(id=>db.users[id]).filter(Boolean);}

// ---------- thoughts ----------
// A thought goes to one person or one loop. It is complete when sent; a reaction closes it, and nothing else is expected.
// to.type 'link' is for friends not on Loops yet: the app hands back a text link they open with no account.
export function sendThought(db,u,{to,text,url,photo}){
 need(to&&['user','loop','link'].includes(to.type),'Pick who it is for.');
 if(to.type==='user')need(circle(db,u).some(p=>p.id===to.id),'You can only send to people in your loops.');
 else if(to.type==='loop')memberLoop(db,u,to.id);
 else to={type:'link',id:cleanText(to.name||'',24)||'a friend'};
 text=cleanText(text||'',500);url=String(url||'').trim().slice(0,500);
 if(url&&!/^https?:\/\//i.test(url))url='https://'+url;
 if(photo)need(/^data:image\/(jpeg|png|webp);base64,/.test(photo)&&photo.length<380000,'That photo is too big. Try another.');
 need(text||url||photo,'Add a note, a link or a photo.');
 const t={id:newId(),from:u.id,to:{type:to.type,id:to.id},text,url,photo:null,createdAt:now(),reactions:{}};
 // Photos live apart from the main record (DynamoDB items cap at 400 KB); the thought keeps a URL.
 if(photo){(db.photos||={})[t.id]=photo;t.photo=`/loops/api/photo/${t.id}`;}
 db.thoughts.push(t);return t;
}
export function react(db,u,thoughtId,reaction){
 const t=db.thoughts.find(t=>t.id===thoughtId);need(t&&canSee(db,u,t)&&t.from!==u.id,'That thought is gone.');
 need(REACTIONS.includes(reaction),'Pick a reaction.');
 t.reactions[u.id]=reaction;return t;
}
const canSee=(db,u,t)=>t.from===u.id||(t.to.type==='user'?t.to.id===u.id:t.to.type==='loop'&&db.loops[t.to.id]?.members.includes(u.id));

// ---------- link thoughts (no account) ----------
// Anyone with the link sees the thought and can react with a name. Replying back creates their account
// and a two-person loop with the sender, so the first reply turns into a real connection.
export function linkThought(db,thoughtId){
 const t=db.thoughts.find(t=>t.id===thoughtId&&t.to.type==='link');need(t,'This link has expired.');
 return {from:db.users[t.from]?.name||'A friend',to:t.to.id,text:t.text,url:t.url,photo:t.photo,reacted:Object.keys(t.guests||{}).length>0,reactions:REACTIONS};
}
export function guestReact(db,thoughtId,{name,reaction}){
 const t=db.thoughts.find(t=>t.id===thoughtId&&t.to.type==='link');need(t,'This link has expired.');
 need(REACTIONS.includes(reaction),'Pick a reaction.');
 (t.guests||={})[cleanText(name||'',24)||t.to.id]=reaction;return t;
}
export function replyBack(db,u,thoughtId){
 const t=db.thoughts.find(t=>t.id===thoughtId&&t.to.type==='link');need(t,'This link has expired.');
 const s=db.users[t.from];need(s,'This link has expired.');need(s.id!==u.id,'This is your own thought. Send the link to your friend.');
 const existing=Object.values(db.loops).find(l=>l.members.length===2&&l.members.includes(s.id)&&l.members.includes(u.id));
 if(existing)return existing;
 const l=createLoop(db,s,{publicName:`${s.name} + ${u.name}`});l.members.push(u.id);return l;
}

// ---------- I'm in town ----------
// Manual trips only, never live location. Friends whose home city matches see an open invite.
export function addTrip(db,u,{city,from,to,note}){
 city=cleanText(city,40);need(city,'Which city?');
 need(/^\d{4}-\d{2}-\d{2}$/.test(from||'')&&/^\d{4}-\d{2}-\d{2}$/.test(to||''),'Pick the dates.');
 need(to>=from,'The trip has to end after it starts.');
 const t={id:newId(),uid:u.id,city,from,to,note:cleanText(note||'',200),downs:{},createdAt:now()};
 db.trips.push(t);return t;
}
export function removeTrip(db,u,tripId){db.trips=db.trips.filter(t=>!(t.id===tripId&&t.uid===u.id));}
export function imDown(db,u,tripId,note){
 const t=db.trips.find(t=>t.id===tripId);need(t&&t.uid!==u.id&&circle(db,u).some(p=>p.id===t.uid),'That invite is gone.');
 t.downs[u.id]=cleanText(note||'',140)||'I’m down';return t;
}
const sameCity=(a,b)=>a&&b&&a.trim().toLowerCase()===b.trim().toLowerCase();
const today=()=>new Date().toISOString().slice(0,10);

// ---------- Flick Pong (1v1, async) ----------
// Two balls a turn. Sink both and you get them back. Clear all six of their cups to win.
// The server decides every shot from the flick, so nobody's phone can fudge a result.
// Seats are 'a' (challenger, shoots first) and 'b'. In iMessage a challenge can be open: whoever
// in the thread taps it first takes seat b.
const pairKey=(a,b)=>[a,b].sort().join('|');
const seatOf=(g,id)=>g.a===id?'a':g.b===id?'b':null;
const otherSeat=s=>s==='a'?'b':'a';
function connect(db,x,y){ // make sure two people share a loop, so they can send each other thoughts
 if(Object.values(db.loops).some(l=>l.members.includes(x.id)&&l.members.includes(y.id)))return;
 const l=createLoop(db,x,{publicName:`${x.name} + ${y.name}`});l.members.push(y.id);
}
export function startPong(db,u,opponentId=null){
 db.pongs||={};db.h2h||={};
 if(opponentId){
  need(opponentId!==u.id&&circle(db,u).some(p=>p.id===opponentId),'You can only challenge people in your loops.');
  const live=Object.values(db.pongs).find(g=>!g.winner&&g.b&&pairKey(g.a,g.b)===pairKey(u.id,opponentId));
  if(live)return live;
 }
 const g={id:newId(),a:u.id,b:opponentId||null,cups:{a:Array(6).fill(true),b:Array(6).fill(true)},
  turn:'a',left:2,pairHits:0,current:[],last:null,winner:null,createdAt:now(),updatedAt:now()};
 db.pongs[g.id]=g;return g;
}
export function joinPong(db,u,gameId){
 const g=db.pongs?.[gameId];need(g,'That game is gone.');
 if(seatOf(g,u.id))return g;
 need(!g.b,'This game already has two players. Start your own!');
 g.b=u.id;connect(db,db.users[g.a],u);g.updatedAt=now();return g;
}
export function pongThrow(db,u,gameId,shot){
 const g=db.pongs?.[gameId];need(g&&!g.winner,'That game is over.');
 if(!seatOf(g,u.id)&&!g.b&&g.turn==='b')joinPong(db,u,gameId);
 const me=seatOf(g,u.id);need(me&&g.turn===me,'It is not your turn yet.');
 const opp=otherSeat(me),res=pongShot(g.cups[opp],shot);
 if(res.hit!==null){g.cups[opp][res.hit]=false;g.pairHits++;}
 g.current.push({aim:Number(shot.aim)||0,power:Number(shot.power)||0,hit:res.hit,rim:res.rim});
 g.left--;g.updatedAt=now();
 let event='';
 if(!g.cups[opp].some(Boolean)){
  g.winner=me;g.last={by:me,throws:g.current};g.current=[];
  if(g.b){const h=db.h2h[pairKey(g.a,g.b)]||={};h[u.id]=(h[u.id]||0)+1;}event='win';
 }else if(g.left===0){
  if(g.pairHits===2){g.left=2;g.pairHits=0;event='ballsBack';}
  else{g.last={by:me,throws:g.current};g.current=[];g.turn=opp;g.left=2;g.pairHits=0;event='turnOver';}
 }
 return {...res,event,view:pongView(db,u,g)};
}
export function pongView(db,u,g){
 const me=seatOf(g,u.id)||'b',opp=otherSeat(me),oppId=g[opp];
 const h=g.a&&g.b?db.h2h?.[pairKey(g.a,g.b)]||{}:{};
 const lastHits=g.last?g.last.throws.filter(t=>t.hit!==null).length:0;
 const vs=oppId?db.users[oppId]?.name||'Someone':'Open seat';
 return {id:g.id,vs,vsId:oppId,seated:!!seatOf(g,u.id),open:!g.b,myTurn:!g.winner&&g.turn===me&&(!!seatOf(g,u.id)||!g.b),left:g.left,
  targets:g.cups[opp],mine:g.cups[me],done:!!g.winner,won:!!g.winner&&g.winner===me&&!!seatOf(g,u.id),
  winnerName:g.winner?db.users[g[g.winner]]?.name:null,
  lastNote:g.last&&g.last.by!==me&&!g.winner?`${db.users[g[g.last.by]]?.name} sank ${lastHits} ${lastHits===1?'cup':'cups'}.`:'',
  record:{me:h[u.id]||0,them:oppId?h[oppId]||0:0},updatedAt:g.updatedAt};
}
export function pongFor(db,u,gameId){const g=db.pongs?.[gameId];need(g,'That game is gone.');return pongView(db,u,g);}

// ---------- what one person sees ----------
export function home(db,u){
 const loops=myLoops(db,u);
 const loopName=l=>l.nick[u.id]||l.publicName;
 const see=db.thoughts.filter(t=>canSee(db,u,t));
 const shape=t=>({id:t.id,from:pub(db.users[t.from]),mine:t.from===u.id,to:t.to.type==='link'?{type:'link',name:t.to.id,link:`/t/${t.id}`}:t.to.type==='user'?{type:'user',name:db.users[t.to.id]?.name}:{type:'loop',id:t.to.id,name:db.loops[t.to.id]?loopName(db.loops[t.to.id]):'a loop'},
  text:t.text,url:t.url,photo:t.photo,createdAt:t.createdAt,myReaction:t.reactions[u.id]||null,
  // The sender sees reactions (gifts back). Nobody sees who has or hasn't looked.
  reactions:t.from===u.id?[...Object.entries(t.reactions).map(([id,r])=>({name:db.users[id]?.name,r})),...Object.entries(t.guests||{}).map(([name,r])=>({name,r}))]:[]});
 const people=circle(db,u);
 const trips=db.trips.filter(t=>t.to>=today());
 return {
  me:{...pub(u)},
  gifts:see.filter(t=>t.from!==u.id).sort((a,b)=>b.createdAt-a.createdAt).slice(0,60).map(shape),
  sent:see.filter(t=>t.from===u.id).sort((a,b)=>b.createdAt-a.createdAt).slice(0,30).map(shape),
  loops:loops.map(l=>({id:l.id,code:l.code,publicName:l.publicName,privateName:l.nick[u.id]||'',name:loopName(l),
   members:l.members.map(m=>pub(db.users[m])).filter(Boolean)})),
  pongs:Object.values(db.pongs||{}).filter(g=>g.a===u.id||g.b===u.id).filter(g=>g.b||g.a===u.id).filter(g=>!g.winner||now()-g.updatedAt<3*864e5).sort((a,b)=>b.updatedAt-a.updatedAt).map(g=>pongView(db,u,g)),
  people:people.map(pub).sort((a,b)=>(b.openDoor-a.openDoor)||a.name.localeCompare(b.name)),
  // Open invites from friends visiting my city, plus my own trips.
  invites:trips.filter(t=>t.uid!==u.id&&sameCity(t.city,u.city)&&people.some(p=>p.id===t.uid)).map(t=>({id:t.id,who:db.users[t.uid]?.name,city:t.city,from:t.from,to:t.to,note:t.note,down:!!t.downs[u.id]})),
  myTrips:trips.filter(t=>t.uid===u.id).map(t=>({id:t.id,city:t.city,from:t.from,to:t.to,note:t.note,
   friendsThere:people.filter(p=>sameCity(p.city,t.city)).map(p=>p.name),
   downs:Object.entries(t.downs).map(([id,n])=>({name:db.users[id]?.name,note:n}))})),
  reactions:REACTIONS
 };
}
