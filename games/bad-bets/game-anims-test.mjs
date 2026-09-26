import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GAMES} from './public/catalog.js';
import {gameAnim,animInfo,animCss,ANIM_IDS} from './public/game-anims.js';
import {herdAnim} from './public/herd-anim.js';
import {render} from './public/display.js';

const DASH=/[–—]/;
const capsIn=html=>[...html.matchAll(/class="ga-cap[^"]*">([^<]*)</g)].map(m=>m[1]);

test('every catalog game has an intro animation with an aria-label',()=>{
 for(const g of GAMES){const html=gameAnim(g.id);assert.ok(html.length>200,`${g.id} has an animation`);assert.match(html,/role="img" aria-label="Animation: [^"]{20,}"/,`${g.id} has an aria-label`);}
 assert.equal(gameAnim('nope'),'');assert.equal(gameAnim('__proto__'),'');
 assert.match(herdAnim(),/aria-label="Animation: one player writes a this-or-that/);
});

test('captions: 3 or 4 beats, at most 7 words, no em or en dashes, same text in the markup',()=>{
 for(const id of ANIM_IDS){const {seconds,beats,captions}=animInfo(id),html=gameAnim(id);
  assert.ok(seconds>=10&&seconds<=15,`${id} loops in 10 to 15 seconds`);
  assert.ok(captions.length>=3&&captions.length<=4,`${id} has 3 or 4 beats`);assert.equal(beats.length,captions.length);
  assert.deepEqual(capsIn(html),captions);
  for(const c of captions){assert.ok(c.trim().split(/\s+/).length<=7,`${id}: "${c}" is short`);assert.ok(!DASH.test(c),`${id}: "${c}" has no dash`);}
  assert.ok(!DASH.test(html),`${id} markup has no dash`);
 }
});

test('CSS: reduced motion stops the loop, and every opacity keyframe sets both ends',()=>{
 const css=animCss();
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.ga-e\{animation:none!important\}\}/);
 const frames=[...css.matchAll(/@keyframes ([\w-]+)\{((?:[^{}]*\{[^{}]*\})*)\}/g)];
 assert.ok(frames.length>100);
 for(const [,name,body] of frames){if(!body.includes('opacity'))continue;
  const stops=[...body.matchAll(/([\d.%,]+)\{([^}]*)\}/g)];
  const at=p=>stops.find(([,sel])=>sel.split(',').includes(p));
  assert.match(at('0%')?.[2]||'',/opacity/,`${name} sets opacity at 0%`);assert.match(at('100%')?.[2]||'',/opacity/,`${name} sets opacity at 100%`);}
});

test('TV reveal shows the game animation (Herd keeps its own)',()=>{
 const base={code:'ABCD',round:1,phase:'reveal',players:[{id:'a',name:'A'},{id:'b',name:'B'}],prompt:'Keys on a piano?',active:['a','b']};
 for(const g of GAMES.filter(g=>g.id!=='finale')){const html=render({...base,game:g.id}).html;assert.ok(html.includes('tv-game-anim')&&html.includes(`ga-${g.id}`),`${g.id} on TV`);}
 const herd=render({...base,game:'brain',herd:{asker:'a'}}).html;assert.ok(herd.includes('ga-herd')&&!herd.includes('ga-brain'));
});
