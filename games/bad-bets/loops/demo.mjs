// Seeds a local demo so Clark can try Loops alone: four friends, two loops, thoughts, a story mid-way,
// and a Seattle trip. Refuses to overwrite real data unless run with --reset.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import * as L from './logic.mjs';
const path=fileURLToPath(new URL('./data/loops.json',import.meta.url));
const exists=await readFile(path).then(()=>true,()=>false);
if(exists&&!process.argv.includes('--reset')){console.log('data/loops.json already exists. Run "node demo.mjs --reset" to replace it with demo data.');process.exit(1);}
const db=L.emptyDb();
const clark=L.signUp(db,{name:'Clark',city:'Honolulu'}),kai=L.signUp(db,{name:'Kai',city:'Seattle'}),mel=L.signUp(db,{name:'Mel',city:'Seattle'}),noa=L.signUp(db,{name:'Noa',city:'Los Angeles'});
noa.openDoor=false;
const hs=L.createLoop(db,kai,{publicName:'Kalani Class of 22'});[clark,mel,noa].forEach(u=>L.joinLoop(db,u,hs.code));hs.nick[clark.id]='The Day Ones';
const col=L.createLoop(db,mel,{publicName:'SU Rec Crew'});L.joinLoop(db,clark,col.code);
const t1=L.sendThought(db,kai,{to:{type:'user',id:clark.id},text:'Saw a Spam musubi at a Seattle gas station and thought of you.'});
L.sendThought(db,mel,{to:{type:'loop',id:hs.id},text:'Found the senior trip photos. The bus breaking down on the Pali, lol.'});
const t3=L.sendThought(db,clark,{to:{type:'user',id:mel.id},text:'',url:'https://music.apple.com/'});
L.react(db,mel,t3.id,'😂');
const pg=L.startPong(db,kai,clark.id);L.pongThrow(db,kai,pg.id,{aim:0,power:(0.74-0.25)/0.85});L.pongThrow(db,kai,pg.id,{aim:0.3,power:0.2});
const d=n=>new Date(Date.now()+n*864e5).toISOString().slice(0,10);
L.addTrip(db,clark,{city:'Seattle',from:d(14),to:d(21),note:'Down for food or pickup ball'});
await mkdir(fileURLToPath(new URL('./data/',import.meta.url)),{recursive:true});
await writeFile(path,JSON.stringify(db));
const port=process.env.PORT||3300;
console.log('Demo data written. Start the server (npm start), then open each link in its own tab:');
for(const u of [clark,kai,mel,noa])console.log(`  ${u.name.padEnd(6)} http://localhost:${port}/loops/?login=${u.token}`);
