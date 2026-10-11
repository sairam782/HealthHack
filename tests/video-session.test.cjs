'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const {createSession}=require('../video-call.js');
function setup({patient=false,pendingMedia=false,denied=false,slowEnd=false,iceServers=[],relayOnly=false}={}){
  const tracks=[{id:'video',kind:'video',enabled:true,readyState:'live',stop(){this.readyState='ended';}},{id:'audio',kind:'audio',enabled:true,readyState:'live',stop(){this.readyState='ended';}}];
  const stream={getTracks:()=>tracks,getAudioTracks:()=>tracks.filter(track=>track.kind==='audio'),getVideoTracks:()=>tracks.filter(track=>track.kind==='video')};
  let current={id:'call-test',patient_id:'patient',nurse_id:'nurse',status:'RINGING'},captures=0,resolveMedia,resolveEnd;
  const requests=[],peers=[],states=[];let remoteSignals=[];
  class Peer{
    constructor(configuration){peers.push(this);this.configuration=configuration;this.remoteDescription=null;this.added=[];}
    addTrack(){}close(){this.closed=true;}
    async createOffer(){return {type:'offer',sdp:'v=0\r\n'};}async createAnswer(){return {type:'answer',sdp:'v=0\r\n'};}
    async setLocalDescription(value){this.localDescription=value;}async setRemoteDescription(value){this.remoteDescription=value;}
    async addIceCandidate(value){assert.ok(this.remoteDescription);this.added.push(value);}
  }
  const session=createSession({call:current,userId:patient?'patient':'nurse',PeerConnection:Peer,pollInterval:60000,onState:state=>states.push(state),mediaDevices:{getUserMedia:async()=>{
    captures++;if(denied)throw Object.assign(new Error(),{name:'NotAllowedError'});if(pendingMedia)return new Promise(resolve=>{resolveMedia=resolve;});return stream;
  }},request:async(endpoint,options)=>{
    requests.push({endpoint,...(options?JSON.parse(options.body):{})});
    if(endpoint.endsWith('/action')){
      const action=JSON.parse(options.body).action;
      current={...current,status:action==='accept'?'ACCEPTED':action==='connected'?'CONNECTED':action==='failed'?'FAILED':'ENDED'};
      if(slowEnd&&action==='end')await new Promise(resolve=>{resolveEnd=resolve;});
    }
    return {call:current,signals:remoteSignals,iceServers,relayOnly};
  }});
  return {session,tracks,stream,requests,peers,states,captures:()=>captures,resolveMedia:()=>resolveMedia(stream),resolveEnd:()=>resolveEnd(),accepted:()=>{current={...current,status:'ACCEPTED'};},signals:value=>{remoteSignals=value;}};
}
test('nurse media stays off until chosen; preview creates no peer before patient acceptance',async()=>{
  const x=setup();try{
    await x.session.poll();assert.equal(x.captures(),0);
    await x.session.start();assert.equal(x.captures(),1);assert.equal(x.peers.length,0);
    x.accepted();await x.session.poll();assert.equal(x.peers.length,1);assert.ok(x.requests.some(request=>request.kind==='offer'));
    x.session.mute(true);x.session.camera(false);assert.ok(x.tracks.every(track=>!track.enabled));
    await x.session.end();assert.ok(x.tracks.every(track=>track.readyState==='ended'));assert.equal(x.peers[0].closed,true);
  }finally{x.session.dispose();}
});
test('patient acceptance requires an explicit media choice and buffers ICE until the offer arrives',async()=>{
  const x=setup({patient:true});try{
    await x.session.poll();assert.ok(!x.requests.some(request=>request.action==='accept'));
    await x.session.start(true);assert.ok(x.requests.some(request=>request.action==='accept'));
    x.signals([{id:'ice',kind:'candidate',payload:{candidate:'synthetic'}}]);await x.session.poll();assert.equal(x.peers[0].added.length,0);
    x.signals([{id:'ice',kind:'candidate',payload:{candidate:'synthetic'}},{id:'offer',kind:'offer',payload:{type:'offer',sdp:'v=0\r\n'}}]);await x.session.poll();
    assert.equal(x.peers[0].added.length,1);assert.ok(x.requests.some(request=>request.kind==='answer'));
    await x.session.poll();assert.equal(x.requests.filter(request=>request.kind==='answer').length,1);
  }finally{x.session.dispose();}
});
test('denied device access leaves the invitation unaccepted for audio-only retry or decline',async()=>{
  const x=setup({patient:true,denied:true});try{assert.equal(await x.session.start(),false);assert.equal(x.states.at(-1).errorKey,'permission');assert.ok(!x.requests.some(request=>request.action==='accept'));assert.equal(x.peers.length,0);}
  finally{x.session.dispose();}
});
test('late camera permission cannot keep capture active after leaving the call',async()=>{
  const x=setup({patient:true,pendingMedia:true});const started=x.session.start();x.session.dispose();x.resolveMedia();assert.equal(await started,false);assert.ok(x.tracks.every(track=>track.readyState==='ended'));assert.equal(x.peers.length,0);
});
test('ending stops capture immediately while the server action is still pending',async()=>{
  const x=setup({patient:true,slowEnd:true});try{
    await x.session.start();const ending=x.session.end();
    assert.ok(x.tracks.every(track=>track.readyState==='ended'));
    assert.equal(x.peers[0].closed,true);assert.equal(x.states.at(-1).status,'ended');
    x.resolveEnd();await ending;
  }finally{x.session.dispose();}
});
test('direct demo and TURN configuration use their respective ICE policies after acceptance',async()=>{
 for(const relayOnly of [false,true]){const iceServers=[{urls:relayOnly?'turns:relay.example:443':'stun:stun.l.google.com:19302'}];const x=setup({patient:true,iceServers,relayOnly});try{await x.session.start();assert.equal(x.peers[0].configuration.iceTransportPolicy,relayOnly?'relay':'all');assert.deepEqual(x.peers[0].configuration.iceServers,iceServers);}finally{x.session.dispose();}}
});
