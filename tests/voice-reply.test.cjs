'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createPlayer,createUpdateTracker}=require('../voice-reply.js');

function setup() {
  const instances=[],states=[];
  class FakeAudio {
    constructor(url){this.url=url;this.paused=false;instances.push(this);this.pending=new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject;});}
    play(){return this.pending;}
    pause(){this.paused=true;}
    removeAttribute(){this.removed=true;}
    load(){this.released=true;}
  }
  return {instances,states,player:createPlayer({AudioClass:FakeAudio,onState:state=>states.push(state)})};
}
test('receipt is loading until playback actually starts, then clears on completion',async()=>{
  const {instances,states,player}=setup();const ticket={id:'receipt-1',patient_summary:'Received.'};
  const playing=player.play(ticket);
  assert.equal(instances[0].url,'/api/voice/receipt-1');assert.equal(states.at(-1).status,'loading');
  instances[0].resolve();assert.equal(await playing,true);assert.equal(states.at(-1).status,'playing');
  instances[0].onended();assert.equal(states.at(-1).status,'idle');assert.equal(instances[0].released,true);
});
test('browser autoplay refusal exposes a manual-play state without changing the delivered ticket',async()=>{
  const {instances,states,player}=setup();const ticket={id:'receipt-2',status:'NEW'};
  const playing=player.play(ticket);instances[0].reject(Object.assign(new Error('Autoplay blocked'),{name:'NotAllowedError'}));
  assert.equal(await playing,false);assert.equal(states.at(-1).status,'blocked');assert.equal(states.at(-1).ticket,ticket);assert.equal(ticket.status,'NEW');
});
test('audio service failure has a distinct error state and releases the stream',async()=>{
  const {instances,states,player}=setup();const playing=player.play({id:'receipt-3'});
  instances[0].onerror();instances[0].reject(new Error('Invalid media'));
  assert.equal(await playing,false);assert.equal(states.at(-1).status,'error');assert.ok(instances[0].released);
});
test('stopping pending audio prevents a late playback promise from restarting the indicator',async()=>{
  const {instances,states,player}=setup();const playing=player.play({id:'receipt-4'});
  player.stop();instances[0].resolve();assert.equal(await playing,false);
  assert.equal(states.at(-1).status,'idle');assert.ok(instances[0].paused);assert.equal(instances[0].onended,null);
});
test('callbacks from an older reply cannot stop the newer reply',async()=>{
  const {instances,states,player}=setup();const first=player.play({id:'old'});
  const staleEnd=instances[0].onended,staleError=instances[0].onerror;
  const second=player.play({id:'new'});instances[1].resolve();assert.equal(await second,true);
  staleEnd();staleError();instances[0].reject(new Error('Aborted'));
  assert.equal(await first,false);assert.equal(states.at(-1).status,'playing');assert.equal(states.at(-1).ticket.id,'new');
});
test('manual retry can play the same receipt after autoplay was blocked',async()=>{
  const {instances,states,player}=setup();const ticket={id:'retry'};
  const first=player.play(ticket);instances[0].reject(Object.assign(new Error(),{name:'NotAllowedError'}));await first;
  const retry=player.play(ticket);instances[1].resolve();assert.equal(await retry,true);assert.equal(states.at(-1).status,'playing');
});
test('automatic receipt, acknowledgement and completion play sequentially without duplicates',async()=>{
  const {instances,states,player}=setup();
  const received={id:'queued',status:'NEW'},acknowledged={...received,status:'ACKNOWLEDGED'},completed={...received,status:'RESOLVED'};
  const first=player.enqueue(received);
  player.enqueue(acknowledged);player.enqueue(completed);player.enqueue(acknowledged);
  assert.equal(instances.length,1);assert.equal(instances[0].url,'/api/voice/queued?stage=NEW');
  instances[0].resolve();await first;instances[0].onended();
  assert.equal(instances.length,2);assert.equal(instances[1].url,'/api/voice/queued?stage=ACKNOWLEDGED');
  instances[1].resolve();await Promise.resolve();instances[1].onended();
  assert.equal(instances.length,3);assert.equal(instances[2].url,'/api/voice/queued?stage=RESOLVED');
  instances[2].resolve();await Promise.resolve();instances[2].onended();
  assert.equal(states.at(-1).status,'idle');assert.equal(instances.length,3);
});
test('blocked automatic playback keeps later staff updates for a user-initiated retry',async()=>{
  const {instances,player}=setup();const receipt={id:'blocked-queue',status:'NEW'};
  const first=player.enqueue(receipt);player.enqueue({...receipt,status:'ACKNOWLEDGED'});
  instances[0].reject(Object.assign(new Error(),{name:'NotAllowedError'}));await first;
  assert.equal(instances.length,1);
  const retry=player.retry(receipt);instances[1].resolve();await retry;instances[1].onended();
  assert.equal(instances[2].url,'/api/voice/blocked-queue?stage=ACKNOWLEDGED');
  player.stop();
});
test('stopping audio cancels queued staff updates as well as current playback',async()=>{
  const {instances,states,player}=setup();
  const first=player.enqueue({id:'stopped-queue',status:'NEW'});player.enqueue({id:'stopped-queue',status:'ACKNOWLEDGED'});
  const staleEnd=instances[0].onended;player.stop();instances[0].resolve();await first;staleEnd();
  assert.equal(instances.length,1);assert.equal(states.at(-1).status,'idle');
});
test('polling speaks new transitions once and never replays the sign-in history',()=>{
  const tracker=createUpdateTracker();const old={id:'old',status:'ACKNOWLEDGED',created_at:'2026-10-10T12:00:00Z'};
  assert.deepEqual(tracker.observe([old],true),[]);
  const receipt={id:'new',status:'NEW',created_at:'2026-10-10T12:01:00Z'};
  tracker.remember(receipt);
  assert.deepEqual(tracker.observe([old,receipt]),[]);
  const acknowledged={...receipt,status:'ACKNOWLEDGED'};
  assert.deepEqual(tracker.observe([old,acknowledged]),[acknowledged]);
  assert.deepEqual(tracker.observe([old,acknowledged]),[]);
  assert.deepEqual(tracker.observe([old,receipt]),[], 'stale responses cannot rewind an acknowledged request');
  const completed={...receipt,status:'RESOLVED'};
  assert.deepEqual(tracker.observe([old,completed]),[completed]);
  tracker.reset();assert.deepEqual(tracker.observe([old,completed],true),[]);
});
test('a rapid staff acknowledgement is announced even during the first poll after submission',()=>{
  const tracker=createUpdateTracker();const receipt={id:'fast',status:'NEW'};tracker.remember(receipt);
  const acknowledged={...receipt,status:'ACKNOWLEDGED'};
  assert.deepEqual(tracker.observe([acknowledged],true),[acknowledged]);
});
