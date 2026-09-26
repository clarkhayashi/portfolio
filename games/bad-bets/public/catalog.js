export const MAX_PLAYERS=12

export const GAMES = [
 {id:'auction',maxAll:8,name:'Bidding War',short:'Bidding War',icon:'$',color:'#ffd166',ink:'#493018',min:2,formats:['spot'],label:'Bid · build · pitch',description:'Bid on picks. Build the best lineup.'},
 {id:'quips',name:'Bad Answers',short:'Bad Answers',icon:'!?',color:'#f4a7cb',ink:'#49233c',min:2,formats:['spot'],label:'Write · reveal · vote',description:'One prompt. Your worst good idea.'},
 {id:'shadow',name:'Shadowbox',short:'Shadowbox',icon:'↗',color:'#fb7657',ink:'#341a35',min:2,formats:['spot'],label:'In-person face-off',description:'Point, dodge, switch. First to 3 hits.'},
 {id:'rhythm',name:'Keep It Going',short:'Keep It Going',icon:'♫',color:'#c5e86c',ink:'#263e27',min:2,formats:['all'],label:'In-person · everyone',description:'Pick a category. Keep the beat.'},
 {id:'brain',name:'Same Brain?',short:'Same Brain',icon:'◎',color:'#8acbd2',ink:'#163c46',min:2,formats:['all'],label:'Everyone plays',description:'Think alike. Match a friend’s answer.',herd:'4+ players: one writes a this-or-that, everyone picks, smaller side loses.'},
 {id:'number',name:'Ballpark',short:'Ballpark',icon:'#',color:'#b2b5ec',ink:'#313158',min:2,formats:['all','spot'],label:'Closest guess wins',description:'Big guesses. Small margins. Get closest.'},
 {id:'draft',maxAll:8,name:'Fantasy Draft',short:'Fantasy Draft',icon:'≋',color:'#f1c778',ink:'#573c16',min:2,formats:['spot'],label:'Create · reveal · vote',description:'Draft your dream team. Win the room.'},
 {id:'draw',maxAll:10,name:'Drawn Into Trouble',short:'Draw Trouble',icon:'✎',color:'#eea99c',ink:'#562c29',min:2,formats:['spot'],label:'Create · reveal · vote',description:'Terrible drawings. Excellent arguments.'},
 {id:'finale',maxAll:12,name:'One More Round',title:'Oops, I guess one more round?',short:'One More Round',icon:'↻',color:'#ffb77a',ink:'#4d2a14',min:3,formats:[],label:'Write · pick · play · vote',description:'Everyone writes a prompt. The room plays the best one.'},
 {id:'imposter',name:'Imposter',short:'Imposter',icon:'◉',color:'#a7cbb3',ink:'#254733',min:4,formats:['all'],label:'Everyone plays',description:'One secret word. One imposter. Trust nobody.'}
];
export const gameById=id=>GAMES.find(g=>g.id===id);
export const fitsAll=(g,n)=>g.min<=n&&n<=(g.maxAll||MAX_PLAYERS)
export const compatible=(ids,count,spot)=>GAMES.filter(g=>ids.includes(g.id)&&g.min<=count&&g.formats.includes(spot?'spot':'all')).map(g=>g.id);
