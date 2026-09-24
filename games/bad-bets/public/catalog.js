export const GAMES = [
 {id:'shadow',name:'Shadowbox',short:'Shadowbox',icon:'↗',color:'#fb7657',ink:'#341a35',min:2,formats:['spot'],label:'In-person face-off',description:'Point, dodge, switch. First to 3 hits.'},
 {id:'rhythm',name:'Keep It Going',short:'Keep It Going',icon:'♫',color:'#c5e86c',ink:'#263e27',min:2,formats:['all'],label:'In-person · everyone',description:'Pick a category. Keep the beat.'},
 {id:'brain',name:'Same Brain?',short:'Same Brain',icon:'◎',color:'#8acbd2',ink:'#163c46',min:2,formats:['all'],label:'Everyone plays',description:'Think alike. Match a friend’s answer.'},
 {id:'number',name:'Ballpark',short:'Ballpark',icon:'#',color:'#b2b5ec',ink:'#313158',min:2,formats:['all','spot'],label:'Everyone · teams',description:'Big guesses. Small margins. Get closest.'},
 {id:'draft',name:'Food Court Draft',short:'Food Draft',icon:'≋',color:'#f1c778',ink:'#573c16',min:3,formats:['spot'],label:'1v1 + audience',description:'Draft your dream meal. Win the room.'},
 {id:'draw',name:'Drawn Into Trouble',short:'Draw Trouble',icon:'✎',color:'#eea99c',ink:'#562c29',min:3,formats:['spot'],label:'1v1 + audience',description:'Terrible drawings. Excellent arguments.'},
 {id:'imposter',name:'Who’s Faking?',short:'Who’s Faking?',icon:'◉',color:'#a7cbb3',ink:'#254733',min:4,formats:['all'],label:'Everyone plays',description:'One secret. One faker. Trust nobody.'}
];
export const gameById=id=>GAMES.find(g=>g.id===id);
export const compatible=(ids,count,spot)=>GAMES.filter(g=>ids.includes(g.id)&&g.min<=count&&g.formats.includes(spot?'spot':'all')).map(g=>g.id);
