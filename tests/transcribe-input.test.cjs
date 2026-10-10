'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const speech=require('../transcribe-input.js');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(overrides={}){
 const sockets=[],nodes=[],tracks=[],contexts=[],events=[];
 const stream=()=>{const track={stopped:false,stop(){this.stopped=true;}};tracks.push(track);return {getTracks:()=>[track]};};
 class Context{constructor(){contexts.push(this);this.audioWorklet={addModule:async()=>{}};this.destination={};}async resume(){}async close(){this.closed=true;}createMediaStreamSource(){return {connect(){},disconnect(){}};}createGain(){return {gain:{},connect(){},disconnect(){}};}}
 class Node{constructor(){nodes.push(this);this.port={postMessage:message=>{if(message==='flush')this.port.onmessage?.({data:{flushed:true}});}};}connect(){}disconnect(){this.disconnected=true;}}
 class Socket{constructor(){sockets.push(this);this.readyState=0;this.bufferedAmount=0;this.frames=[];}send(frame){this.frames.push(speech.decodeFrame(frame));}close(){this.closed=true;}open(){this.readyState=1;this.onopen?.();}result(text,partial=false,id='1'){const payload=new TextEncoder().encode(JSON.stringify({Transcript:{Results:[{ResultId:id,IsPartial:partial,Alternatives:[{Transcript:text}]}]}}));this.onmessage?.({data:speech.encodeFrame(payload,{':message-type':'event',':event-type':'TranscriptEvent',':content-type':'application/json'}).buffer});}}
 const Recognition=speech.createRecognitionClass({mediaDevices:{getUserMedia:async()=>stream()},AudioContextClass:Context,AudioWorkletNodeClass:Node,WebSocketClass:Socket,request:async()=>({url:'wss://transcribestreaming.us-east-1.amazonaws.com:8443/stream-transcription-websocket?fake=test',sampleRate:16000,maxDurationMs:60000}),...overrides});
 const recognition=new Recognition();recognition.onresult=event=>events.push({text:event.results[event.resultIndex][0].transcript,final:event.results[event.resultIndex].isFinal});return {recognition,sockets,nodes,tracks,contexts,events,stream};
}
test('EventStream CRC matches the standard vector; corrupted or truncated frames are rejected',()=>{
 assert.equal(speech.crc32(new TextEncoder().encode('123456789')),0xcbf43926);const encoded=speech.encodeFrame(new Uint8Array([1,2,3]));const decoded=speech.decodeFrame(encoded);assert.equal(decoded.headers[':event-type'],'AudioEvent');assert.deepEqual([...decoded.payload],[1,2,3]);encoded[encoded.length-5]^=1;assert.throws(()=>speech.decodeFrame(encoded));assert.throws(()=>speech.decodeFrame(new Uint8Array(12)));
});
test('AWS recognition captures only after start, delivers partial/final results once, and stops all media',async()=>{
 const f=fixture();assert.equal(f.tracks.length,0);f.recognition.continuous=true;f.recognition.start();await tick();f.sockets[0].open();f.nodes[0].port.onmessage({data:new Uint8Array([0,1]).buffer});assert.equal(f.sockets[0].frames[0].payload.length,2);f.sockets[0].result('agua',true);f.sockets[0].result('Necesito agua');f.sockets[0].result('duplicate final');assert.deepEqual(f.events,[{text:'agua',final:false},{text:'Necesito agua',final:true}]);f.recognition.stop();assert.equal(f.tracks[0].stopped,true);assert.equal(f.contexts[0].closed,true);assert.equal(f.sockets[0].frames.at(-1).payload.length,0);f.recognition.abort();assert.equal(f.sockets[0].closed,true);
});
test('abort while microphone permission is pending stops any late stream without starting a socket',async()=>{
 let resolve;const f=fixture({mediaDevices:{getUserMedia:()=>new Promise(r=>resolve=r)}});f.recognition.start();f.recognition.abort();resolve(f.stream());await tick();assert.equal(f.tracks[0].stopped,true);assert.equal(f.sockets.length,0);
});
test('corrupt AWS response, backpressure and untrusted endpoints release media',async()=>{
 for(const mode of ['corrupt','backpressure','endpoint']){const f=fixture(mode==='endpoint'?{request:async()=>({url:'wss://evil.example:8443/stream-transcription-websocket',sampleRate:16000})}:{});let error;f.recognition.onerror=e=>error=e.error;f.recognition.start();await tick();if(mode==='corrupt'){f.sockets[0].open();f.sockets[0].onmessage({data:new Uint8Array(4).buffer});}if(mode==='backpressure'){f.sockets[0].open();f.sockets[0].bufferedAmount=256001;f.nodes[0].port.onmessage({data:new Uint8Array(2).buffer});}assert.equal(error,'network');assert.equal(f.tracks[0].stopped,true);assert.equal(f.recognition.active,false);}
});
test('worklet produces 16kHz little-endian mono PCM and flushes the trailing chunk',()=>{
 let Processor;const frames=[];class Base{constructor(){this.port={postMessage:value=>frames.push(value)};}}
 vm.runInNewContext(fs.readFileSync(require.resolve('../transcribe-worklet.js'),'utf8'),{AudioWorkletProcessor:Base,sampleRate:48000,Uint8Array,DataView,Math,registerProcessor:(name,type)=>{assert.equal(name,'kaalinga-pcm');Processor=type;}});const processor=new Processor();processor.process([[new Float32Array(4800).fill(0.5)]]);assert.equal(frames[0].byteLength,3200);assert.equal(new DataView(frames[0]).getInt16(0,true),16384);processor.process([[new Float32Array(300).fill(-1)]]);processor.port.onmessage({data:'flush'});assert.equal(frames[1].byteLength,200);assert.equal(new DataView(frames[1]).getInt16(0,true),-32768);assert.equal(frames[2].flushed,true);
});
