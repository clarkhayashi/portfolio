// Loops local server. Mirrors production: everything lives under /loops (the API at /loops/api/*),
// so the same client works here and at play.clarkhayashi.com/loops.
import http from 'node:http';
import os from 'node:os';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import * as L from './logic.mjs';
import {BASE,handle,memoryStore,decodePhoto} from './core.mjs';
export {memoryStore};

const here=p=>fileURLToPath(new URL(p,import.meta.url));
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};

// JSON-file persistence for local testing.
export async function fileStore(path=here('./data/loops.json')){
 let db;try{db=JSON.parse(await readFile(path,'utf8'));}catch{db=L.emptyDb();}
 let timer=null;
 return memoryStore(db,()=>{clearTimeout(timer);timer=setTimeout(async()=>{await mkdir(here('./data/'),{recursive:true});await writeFile(path+'.tmp',JSON.stringify(db));await rename(path+'.tmp',path);},150);});
}

export function createServer(store){
 return http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://localhost');
  if(u.pathname==='/'||u.pathname===BASE){res.writeHead(302,{Location:BASE+'/'+u.search});res.end();return;}
  // Shared Oops files the Loops client uses (player headshots and their credits), same paths as production.
  if(u.pathname.startsWith('/players/')||u.pathname==='/credits.html'){try{const f=u.pathname;if(f.includes('..'))throw Error();const body=await readFile(here('../public'+f));res.writeHead(200,{'Content-Type':TYPES[f.slice(f.lastIndexOf('.'))]||(f.endsWith('.jpg')?'image/jpeg':'application/octet-stream')});res.end(body);}catch{res.writeHead(404);res.end('Not found');}return;}
  if(!u.pathname.startsWith(BASE+'/')){res.writeHead(404);res.end('Not found');return;}
  const path=u.pathname.slice(BASE.length);
  try{
   if(path.startsWith('/api/')){
    let raw='';if(req.method==='POST'){for await(const c of req){raw+=c;if(raw.length>600_000)throw Error('That is too big to send.');}}
    const out=await handle(store,{method:req.method,path:path.slice(4),auth:req.headers.authorization,body:raw?JSON.parse(raw):{}});
    if(out.photo){const p=decodePhoto(out.photo);res.writeHead(200,{'Content-Type':p.type,'Cache-Control':'private, max-age=86400'});res.end(p.buffer);return;}
    res.writeHead(out.status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(out.json));return;
   }
   // Static files; page paths (/j/CODE, /t/ID, /p/ID, /im) all serve the single-page app.
   const file=path==='/'||!/\.\w+$/.test(path)?'/index.html':path;
   if(file.includes('..'))throw Error('Bad path');
   const body=await readFile(here('../public/loops'+file));
   res.writeHead(200,{'Content-Type':TYPES[file.slice(file.lastIndexOf('.'))]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
  }catch(e){res.writeHead(e.code==='ENOENT'?404:400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:e.code==='ENOENT'?'Not found.':e.message}));}
 });
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const store=await fileStore(),port=Number(process.env.PORT||3300);
 createServer(store).listen(port,()=>{
  console.log(`Loops: http://localhost:${port}${BASE}/`);
  for(const n of Object.values(os.networkInterfaces()).flat())if(n?.family==='IPv4'&&!n.internal)console.log(`Phone on same Wi-Fi: http://${n.address}:${port}${BASE}/`);
 });
}
