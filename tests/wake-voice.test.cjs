'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {createListener,wakeRequest,command}=require('../wake-voice.js');
function setup(options={}){
 const instances=[],states=[],drafts=[],prompts=[],sent=[];
 class Recognition{constructor(){instances.push(this);}start(){this.onstart?.();}abort(){this.aborted=true;}hear(text,final=true){const result=[{transcript:text}];result.isFinal=final;this.onresult?.({resultIndex:0,results:[result]});}}
 const listener=createListener({Recognition,onState:s=>states.push(s),onDraft:s=>drafts.push(s),onPrompt:(prompt,text)=>{prompts.push({prompt,text});listener.suspend('speech',true);},onSend:async text=>sent.push(text),...options});
 return {listener,instances,states,drafts,prompts,sent,hear:text=>instances.at(-1).hear(text),resume:()=>listener.suspend('speech',false)};
}
test('wake phrases match only a full leading phrase and support common name spellings',()=>{
 assert.equal(wakeRequest('Hey Kaalinga, I need water.'),'I need water');assert.equal(wakeRequest('hey kalinga'),'');
 assert.equal(wakeRequest('हे कालिंगा, मुझे पानी चाहिए।'),'मुझे पानी चाहिए');
 for(const text of ['I mentioned hey Kaalinga','hey Kaalingaroo','I need water','send request'])assert.equal(wakeRequest(text),null);
 assert.equal(command('Send request!'),'send');assert.equal(command('do not send request'),null);assert.equal(command('अनुरोध भेजें'),'send');
});
test('recognition is opt-in and unrelated or interim speech never creates a request',()=>{
 const x=setup();try{assert.equal(x.instances.length,0);x.listener.start();x.hear('Can I get water?');x.instances[0].hear('Hey Kaalinga, help',false);assert.equal(x.drafts.length,0);assert.equal(x.sent.length,0);}finally{x.listener.dispose();}
});
test('wake plus request is read back and requires a separate confirmation after playback',async()=>{
 const x=setup();try{
 x.listener.start();x.hear('Hey Kaalinga, I need water');assert.equal(x.drafts[0],'I need water');assert.equal(x.prompts[0].prompt,'confirm');assert.equal(x.sent.length,0);assert.equal(x.instances[0].aborted,true);
 x.instances[0].hear('send request');assert.equal(x.sent.length,0);x.resume();x.hear('send request');await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(x.sent,['I need water']);
 x.hear('send request');assert.equal(x.sent.length,1);
 }finally{x.listener.dispose();}
});
test('bare wake phrase captures the next request and cancel discards it without sending',()=>{
 const x=setup();try{x.listener.start();x.hear('hey kaalinga');assert.equal(x.prompts[0].prompt,'ready');x.resume();x.hear('I need a blanket');assert.equal(x.prompts[1].text,'I need a blanket');x.resume();x.hear('Cancel');assert.equal(x.drafts.at(-1),'');assert.equal(x.prompts.at(-1).prompt,'cancelled');assert.equal(x.sent.length,0);}finally{x.listener.dispose();}
});
test('video, speech and hidden pauses compose, and hiding clears pending voice confirmation',()=>{
 const x=setup();try{x.listener.start();x.hear('hey kaalinga, water');x.listener.suspend('video',true);x.resume();assert.equal(x.instances.length,1);x.listener.suspend('video',false);assert.equal(x.instances.length,2);x.listener.suspend('hidden',true);x.listener.suspend('hidden',false);x.hear('send request');assert.equal(x.sent.length,0);assert.equal(x.states.at(-1).phase,'wake');}finally{x.listener.dispose();}
});
test('permission denial disables the listener and cannot auto-restart',()=>{
 const x=setup();try{x.listener.start();const stale=x.instances[0].onend;x.instances[0].onerror({error:'not-allowed'});assert.equal(x.states.at(-1).enabled,false);assert.equal(x.states.at(-1).error,'permission');stale();assert.equal(x.instances.length,1);}finally{x.listener.dispose();}
});
test('stopping invalidates old recognition results and releases microphone',()=>{
 const x=setup();x.listener.start();const stale=x.instances[0].onresult;x.listener.dispose();const result=[{transcript:'Hey Kaalinga, water'}];result.isFinal=true;stale({resultIndex:0,results:[result]});assert.equal(x.instances[0].aborted,true);assert.equal(x.drafts.length,0);assert.equal(x.listener.start(),false);
});
test('confirmation times out without sending while leaving a visible draft for manual review',async()=>{
 const x=setup({timeoutMs:12});try{x.listener.start();x.hear('Hey Kaalinga, water');x.resume();await new Promise(resolve=>setTimeout(resolve,25));assert.equal(x.sent.length,0);assert.equal(x.prompts.at(-1).prompt,'timeout');assert.equal(x.drafts.at(-1),'water');}finally{x.listener.dispose();}
});
