'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {createTurnCue}=require('../voice-reply.js');
function setup(){
 const contexts=[];
 class Context{
  constructor(){this.state='suspended';this.currentTime=10;this.destination={};this.tones=[];contexts.push(this);}
  async resume(){this.state='running';}async close(){this.state='closed';}
  createOscillator(){const node={frequency:{},connect(){},disconnect(){this.disconnected=true;},start(at){this.started=at;},stop(at){this.stopped=at??true;}};this.tones.push(node);return node;}
  createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(value){assert.ok(value>=0&&value<=0.045);}},connect(){},disconnect(){this.disconnected=true;}};}
 }
 return {contexts,cue:createTurnCue({AudioContextClass:Context})};
}
test('turn sound is opt-in through a gesture unlock and uses a short soft two-note cue',async()=>{
 const {contexts,cue}=setup();try{assert.equal(await cue.play(),false);assert.equal(contexts.length,0);
 assert.equal(await cue.unlock(),true);assert.equal(await cue.play(),true);assert.equal(contexts.length,1);
 const tones=contexts[0].tones;assert.equal(tones.length,2);assert.deepEqual(tones.map(t=>t.frequency.value),[660,880]);
 assert.equal(tones[0].started,10);assert.ok(Math.abs(tones[1].stopped-10.24)<1e-9);
 }finally{cue.dispose();}
});
test('stop releases tones and invalidates a delayed context resume',async()=>{
 const {contexts,cue}=setup();await cue.unlock();await cue.play();const active=contexts[0].tones;
 cue.stop();assert.ok(active.every(t=>t.disconnected&&t.onended===null));
 let resume;contexts[0].resume=()=>new Promise(resolve=>{resume=resolve;});
 const pending=cue.play();cue.stop();resume();assert.equal(await pending,false);assert.equal(active.length,2);cue.dispose();
});
test('unsupported or blocked sound fails quietly and disposal cannot restart audio',async()=>{
 const unsupported=createTurnCue({AudioContextClass:null});assert.equal(await unsupported.unlock(),false);assert.equal(await unsupported.play(),false);unsupported.dispose();
 const {contexts,cue}=setup();await cue.unlock();contexts[0].resume=async()=>{throw new Error('blocked');};assert.equal(await cue.play(),false);assert.equal(contexts[0].tones.length,0);
 cue.dispose();assert.equal(contexts[0].state,'closed');assert.equal(await cue.unlock(),false);assert.equal(await cue.play(),false);
});
