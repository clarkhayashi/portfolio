// Bridge to Oops, All In. Loops and Oops share one site (play.clarkhayashi.com), so Loops can open an Oops room
// through Oops' own /api and save the seat exactly the way Oops does. Opening "/" then drops you straight in as
// host. Nothing here changes Oops; if Oops renames its storage keys, update seat() to match app.js saveSeat().
const SEAT_MS=12*3600e3; // Oops rooms expire after 12 hours idle

function seat({code,token},name){
 try{sessionStorage.setItem('badbets',JSON.stringify({code,token}));}catch{}
 try{localStorage.setItem(`oops-seat-${code}`,JSON.stringify({code,token,name,savedAt:Date.now()}));}catch{}
}

// kind: 'party' (full game night) or 'duel' (Quick 1v1 hoops draft, graded by Scout).
export async function openOopsRoom(kind,name){
 const body=kind==='duel'?{type:'create',mode:'minigames',quick:'hoops',quickGame:'draft',name}:{type:'create',mode:'tournament',name};
 let r;try{r=await fetch('/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}catch{throw Error('Oops is not reachable right now.');}
 const j=await r.json().catch(()=>null);
 if(!r.ok||!j?.code||!j?.token)throw Error(j?.error||'Oops could not open a room. Try again in a minute.');
 seat(j,name);
 return {code:j.code,url:`${location.origin}/?room=${j.code}`,enter:'/',expires:Date.now()+SEAT_MS};
}
