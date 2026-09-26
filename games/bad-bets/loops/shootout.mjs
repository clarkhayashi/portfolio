// Penalty Shootout: a mind game, like Battleship in one move. Each round both players secretly pick where they
// shoot (1 of 6 spots) and where they dive (1 of 6). When both are in, the round reveals: your shot vs their
// dive, their shot vs your dive. A dive to the exact spot saves it. Best of 5, then sudden death (cap 10).
export const SPOTS=['tl','tc','tr','bl','bc','br'];
export const SPOT_NAME={tl:'top left',tc:'top middle',tr:'top right',bl:'low left',bc:'low middle',br:'low right'};
const REGULATION=5,MAX_ROUNDS=10;

export const newShootout=()=>({rounds:[],winner:null});

// The round currently being picked (the first one missing either player's picks).
export function openRound(s){
 let r=s.rounds.find(r=>!r.a||!r.b);
 if(!r&&!s.winner){r={a:null,b:null};s.rounds.push(r);}
 return r;
}

export function pick(s,seat,shoot,dive){
 if(s.winner)throw Error('The shootout is over.');
 if(!SPOTS.includes(shoot)||!SPOTS.includes(dive))throw Error('Pick a spot to shoot and a spot to dive.');
 const r=openRound(s);
 if(r[seat])throw Error('You already picked this round. Waiting on them.');
 r[seat]={shoot,dive};
 if(r.a&&r.b){settle(s);if(!s.winner)openRound(s);}
}

const goals=(s,seat)=>s.rounds.filter(r=>r.a&&r.b).reduce((n,r)=>n+(r[seat].shoot!==r[seat==='a'?'b':'a'].dive?1:0),0);

function settle(s){
 const done=s.rounds.filter(r=>r.a&&r.b).length,a=goals(s,'a'),b=goals(s,'b');
 if(done<REGULATION){ // regulation: stop early once someone can't catch up
  const left=REGULATION-done;if(a>b+left)s.winner='a';else if(b>a+left)s.winner='b';return;}
 if(a!==b)s.winner=a>b?'a':'b';
 else if(done>=MAX_ROUNDS)s.winner='tie';
}

// What one seat may see: every revealed round, but never the other side's picks for a round still open.
export function view(s,seat){
 const other=seat==='a'?'b':'a';
 const revealed=s.rounds.filter(r=>r.a&&r.b).map(r=>({
  mine:{shoot:r[seat].shoot,theirDive:r[other].dive,goal:r[seat].shoot!==r[other].dive},
  theirs:{shoot:r[other].shoot,myDive:r[seat].dive,goal:r[other].shoot!==r[seat].dive}}));
 const open=s.winner?null:s.rounds.find(r=>!r.a||!r.b);
 return {rounds:revealed,round:revealed.length+1,suddenDeath:revealed.length>=REGULATION,
  myPicked:!!(open&&open[seat]),theyPicked:!!(open&&open[other]),
  score:{me:goals(s,seat),them:goals(s,other)},winner:s.winner};
}
