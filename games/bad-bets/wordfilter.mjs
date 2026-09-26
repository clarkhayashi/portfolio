// Blocks slurs and hate terms in anything a player types that others see (team names, custom prompts).
// Matching ignores case, spacing and common letter swaps (0→o, 1→i, 3→e, 4→a, 5→s, $→s, @→a).
// The list stays short and targeted: slurs, not ordinary swearing.
const TERMS=['chink','chinky','gook','jap','japs','slanteye','zipperhead','nigger','nigga','niggas','nigg','negro','coon','darkie','jiggaboo','porchmonkey','spic','wetback','beaner','kike','heeb','raghead','towelhead','sandnigger','paki','faggot','fag','fags','dyke','tranny','retard','retarded','gypped','injun','redskin','squaw','whitetrash','hitler','nazi','kkk','heilhitler','rape','rapist'];
const GLUED=['chink','nigger','nigga','faggot','wetback','raghead','towelhead','zipperhead','jiggaboo','porchmonkey','slanteye','heilhitler'];
const SWAP={'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','$':'s','@':'a','!':'i','|':'i'};
const norm=s=>String(s||'').toLowerCase().replace(/[013457$@!|]/g,c=>SWAP[c]);
export function hasSlur(text){
 const words=norm(text).split(/[^a-z]+/).filter(Boolean),joined=words.join('');
 if(words.some(w=>TERMS.includes(w)||TERMS.includes(w.replace(/(.)\1+/g,'$1'))))return true;
 // Catch spaced-out or glued versions ("c h i n k", "allchinkteam") of terms that never appear inside normal words.
 return GLUED.some(t=>joined.includes(t));
}
export function cleanText(text,max=100){
 const t=String(text||'').trim().slice(0,max);
 if(hasSlur(t))throw Error('That name has a slur in it. Try another.');
 return t;
}
