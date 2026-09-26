import test from 'node:test';
import assert from 'node:assert/strict';
import {parseColor,blend,contrastRatio,isLargeText,requiredRatio,gradientColors,dashKinds,toHex,rectsOverlap,worstContrast,helpers,auditSource,summarize} from './ui-check-lib.mjs';
import {surfaceFor} from './public/catalog.js';

const near=(a,b,eps=0.02)=>assert.ok(Math.abs(a-b)<=eps,`${a} != ${b}`);

test('ui-check: parses the colour forms Chrome serialises',()=>{
 assert.deepEqual(parseColor('rgb(8, 127, 152)'),{r:8,g:127,b:152,a:1});
 assert.deepEqual(parseColor('rgba(0, 0, 0, 0.5)'),{r:0,g:0,b:0,a:0.5});
 assert.deepEqual(parseColor('rgb(1 2 3 / 50%)'),{r:1,g:2,b:3,a:0.5});
 assert.deepEqual(parseColor('#abc'),{r:170,g:187,b:204,a:1});
 assert.equal(parseColor('transparent').a,0);
 assert.equal(parseColor('nonsense'),null);
 const c=parseColor('color(srgb 1 0 0.5)');assert.deepEqual([c.r,c.g,Math.round(c.b)],[255,0,128]);
 const w=parseColor('oklab(1 0 0)');near(w.r,255,1);near(w.g,255,1);near(w.b,255,1);
 const k=parseColor('oklch(0 0 0 / 0.4)');near(k.r,0,1);assert.equal(k.a,0.4);
});

test('ui-check: WCAG contrast matches known pairs',()=>{
 near(contrastRatio(parseColor('#000'),parseColor('#fff')),21);
 near(contrastRatio(parseColor('#fff'),parseColor('#fff')),1);
 near(contrastRatio(parseColor('#767676'),parseColor('#fff')),4.54);
 // The two bugs this checker was built for: dark wordmark on Shadowbox purple, muted grey on a tinted page.
 assert.ok(contrastRatio(parseColor('#1c2433'),parseColor('#261c34'))<1.1);
 assert.ok(contrastRatio(parseColor('#657080'),parseColor('#e5e9df'))<4.5);
 assert.ok(contrastRatio(parseColor('#56606d'),parseColor('#e5e9df'))>=4.5);
});

test('ui-check: large text thresholds',()=>{
 assert.equal(isLargeText(24,400),true);
 assert.equal(isLargeText(19,700),true);
 assert.equal(isLargeText(19,600),false);
 assert.equal(requiredRatio(14,400),4.5);
 assert.equal(requiredRatio(30,400),3);
});

test('ui-check: blending and worst-case backgrounds',()=>{
 assert.deepEqual(blend({r:0,g:0,b:0,a:0.5},{r:255,g:255,b:255,a:1}),{r:127.5,g:127.5,b:127.5,a:1});
 // No background at all resolves to the white canvas.
 near(worstContrast({r:0,g:0,b:0,a:1},[],helpers).ratio,21);
 // The first opaque layer hides everything below it.
 near(worstContrast({r:255,g:255,b:255,a:1},[{color:{r:0,g:0,b:0,a:1}},{color:{r:255,g:255,b:255,a:1}}],helpers).ratio,21);
 // A gradient is judged by its worst stop.
 const g=worstContrast({r:0,g:0,b:0,a:1},[{stops:gradientColors('linear-gradient(rgb(255, 255, 255), rgb(0, 0, 0))')}],helpers);
 near(g.ratio,1);
});

test('ui-check: dashes, hex and overlap helpers',()=>{
 assert.deepEqual(dashKinds('Oops \u2014 no'),['em']);
 assert.deepEqual(dashKinds('2\u201312 players'),['en']);
 assert.deepEqual(dashKinds('plain - hyphen'),[]);
 assert.equal(toHex({r:8,g:127,b:152,a:1}),'#087f98');
 assert.equal(rectsOverlap({left:0,right:10,top:0,bottom:10},{left:5,right:15,top:5,bottom:15}),true);
 assert.equal(rectsOverlap({left:0,right:10,top:0,bottom:10},{left:9,right:15,top:0,bottom:10}),false);
});

test('ui-check: injected audit source parses and failures count only contrast, overflow and setup',()=>{
 assert.doesNotThrow(()=>new Function(`return ${auditSource({logoAccent:'.brand-word b'})}`));
 const s=summarize([{issues:[{type:'contrast'},{type:'tap-target'},{type:'overflow'},{type:'en-dash'}]},{issues:[{type:'setup'}]}]);
 assert.equal(s.failures,3);assert.equal(s.counts['tap-target'],1);assert.equal(s.screens,2);
});

test('surfaceFor: Shadowbox and Date Night levels 2-3 are dark surfaces',()=>{
 assert.equal(surfaceFor('shadow',''),'dark');
 assert.equal(surfaceFor('mixer','3'),'dark');
 assert.equal(surfaceFor('mixer','2'),'dark');
 assert.equal(surfaceFor('mixer','1'),'light');
 assert.equal(surfaceFor('quips',''),'light');
 assert.equal(surfaceFor('',undefined),'light');
});
