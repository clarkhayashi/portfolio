import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{cleanFeedback} from './api/feedback.mjs';
test('feedback accepts only intended fields and validates content',()=>{
 assert.deepEqual(cleanFeedback({kind:'bug',title:'Cannot join',details:'The room never opens',token:'secret',answers:['private']}),{kind:'bug',title:'Cannot join',details:'The room never opens',email:''});
 for(const a of [{kind:'other'},{kind:'bug',title:'abc',details:'x'},{kind:'idea',title:'abc',details:'Enough details',email:'bad'}])assert.throws(()=>cleanFeedback(a));
});
test('feedback rejects foreign origins and never reports delivery without configuration',async()=>{
 const call=async(req)=>{const res={statusCode:200,setHeader(){},end(s){this.body=JSON.parse(s);}};await handler(req,res);return res;};
 assert.equal((await call({method:'POST',headers:{origin:'https://evil.example',host:'game.example'}})).statusCode,403);
 assert.equal((await call({method:'POST',headers:{origin:'not a url',host:'game.example'}})).statusCode,403);
 const before=process.env.FEEDBACK_GITHUB_TOKEN;delete process.env.FEEDBACK_GITHUB_TOKEN;
 try{const r=await call({method:'POST',headers:{origin:'https://game.example',host:'game.example'},body:{kind:'bug',title:'Cannot join',details:'The room never opens'}});assert.equal(r.statusCode,503);assert.equal(r.body.ok,undefined);}finally{if(before)process.env.FEEDBACK_GITHUB_TOKEN=before;}
});
