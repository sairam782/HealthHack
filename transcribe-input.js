'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.KaalingaTranscribe=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const encoder=new TextEncoder(),decoder=new TextDecoder();
 const table=Array.from({length:256},(_,index)=>{let value=index;for(let bit=0;bit<8;bit++)value=value&1?0xedb88320^(value>>>1):value>>>1;return value>>>0;});
 function crc32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=table[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
 function encodeFrame(payload,headers={':content-type':'application/octet-stream',':event-type':'AudioEvent',':message-type':'event'}){
  const parts=Object.entries(headers).map(([name,value])=>{const key=encoder.encode(name),text=encoder.encode(value);const bytes=new Uint8Array(1+key.length+3+text.length);bytes[0]=key.length;bytes.set(key,1);bytes[1+key.length]=7;new DataView(bytes.buffer).setUint16(2+key.length,text.length);bytes.set(text,4+key.length);return bytes;});
  const size=parts.reduce((sum,part)=>sum+part.length,0);const bytes=new Uint8Array(16+size+payload.length);const view=new DataView(bytes.buffer);view.setUint32(0,bytes.length);view.setUint32(4,size);view.setUint32(8,crc32(bytes.subarray(0,8)));let offset=12;for(const part of parts){bytes.set(part,offset);offset+=part.length;}bytes.set(payload,offset);view.setUint32(bytes.length-4,crc32(bytes.subarray(0,-4)));return bytes;
 }
 function decodeFrame(input){
  const bytes=input instanceof Uint8Array?input:new Uint8Array(input);if(bytes.length<16||bytes.length>1024*1024)throw new Error('Invalid speech frame');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),total=view.getUint32(0),size=view.getUint32(4);
  if(total!==bytes.length||size>total-16||view.getUint32(8)!==crc32(bytes.subarray(0,8))||view.getUint32(total-4)!==crc32(bytes.subarray(0,-4)))throw new Error('Invalid speech checksum');
  const headers={};let offset=12;const end=12+size;
  while(offset<end){const length=bytes[offset++];if(offset+length+3>end)throw new Error('Invalid speech header');const name=decoder.decode(bytes.subarray(offset,offset+length));offset+=length;if(bytes[offset++]!==7)throw new Error('Unsupported speech header');const valueLength=view.getUint16(offset);offset+=2;if(offset+valueLength>end)throw new Error('Invalid speech header');headers[name]=decoder.decode(bytes.subarray(offset,offset+valueLength));offset+=valueLength;}
  return {headers,payload:bytes.subarray(end,total-4)};
 }
 function createRecognitionClass(dependencies={}){
  const mediaDevices=dependencies.mediaDevices||globalThis.navigator?.mediaDevices;
  const AudioContextClass=dependencies.AudioContextClass||globalThis.AudioContext||globalThis.webkitAudioContext;
  const AudioWorkletNodeClass=dependencies.AudioWorkletNodeClass||globalThis.AudioWorkletNode;
  const WebSocketClass=dependencies.WebSocketClass||globalThis.WebSocket;
  const request=dependencies.request||((url,options)=>fetch(url,options).then(async response=>{if(!response.ok)throw new Error('AWS speech unavailable');return response.json();}));
  return class AwsRecognition{
   constructor(){this.lang='en-US';this.continuous=false;this.interimResults=true;this.results=[];this.index=new Map();this.active=false;this.generation=0;}
   start(){if(this.active)throw new Error('Recognition already started');this.active=true;this.finishing=false;this.results=[];this.index.clear();const version=++this.generation;this.open(version).catch(error=>{if(this.active&&version===this.generation)this.fail(error.name==='NotAllowedError'?'not-allowed':error.name==='NotFoundError'?'audio-capture':'network');});}
   async open(version){
    if(!mediaDevices?.getUserMedia||!AudioContextClass||!AudioWorkletNodeClass||!WebSocketClass)throw new Error('Unsupported browser');
    const stream=await mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true},video:false});
    if(!this.active||version!==this.generation){stream.getTracks().forEach(track=>track.stop());return;}
    this.stream=stream;
    const config=await request('/api/transcribe/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language:this.lang})});
    if(!this.active||version!==this.generation)return;
    const url=new URL(config.url);if(!/^transcribestreaming\.(us-east-1|us-west-2)\.amazonaws\.com$/.test(url.hostname)||url.protocol!=='wss:'||url.port!=='8443'||url.pathname!=='/stream-transcription-websocket'||config.sampleRate!==16000)throw new Error('Invalid speech session');
    const context=new AudioContextClass();this.context=context;await context.audioWorklet.addModule('/transcribe-worklet.js');if(!this.active||version!==this.generation)return;await context.resume();if(!this.active||version!==this.generation)return;
    const node=new AudioWorkletNodeClass(context,'kaalinga-pcm');this.node=node;const source=context.createMediaStreamSource(stream);this.source=source;
    const gain=context.createGain();gain.gain.value=0;this.gain=gain;source.connect(node);node.connect(gain);gain.connect(context.destination);
    const socket=new WebSocketClass(config.url);this.socket=socket;socket.binaryType='arraybuffer';
    node.port.onmessage=event=>{if(event.data?.flushed){if(this.active&&this.finishing)this.completeInput();return;}if(this.active&&socket.readyState===1){if(socket.bufferedAmount>256000){this.fail('network');return;}socket.send(encodeFrame(new Uint8Array(event.data)));}};
    socket.onopen=()=>{if(!this.active||version!==this.generation)return;this.onstart?.();this.duration=setTimeout(()=>this.stop(),Math.min(Number(config.maxDurationMs)||60000,60000));};
    socket.onmessage=event=>{if(!this.active||version!==this.generation)return;try{const frame=decodeFrame(event.data);if(frame.headers[':message-type']!=='event'||frame.headers[':event-type']!=='TranscriptEvent')throw new Error('Speech service exception');this.transcript(JSON.parse(decoder.decode(frame.payload)));}catch(_){this.fail('network');}};
    socket.onerror=()=>{if(this.active&&version===this.generation)this.fail('network');};
    socket.onclose=()=>{if(this.active&&version===this.generation)this.finish();};
   }
   transcript(data){
    for(const item of data.Transcript?.Results||[]){
     const text=item.Alternatives?.[0]?.Transcript;if(!text||!item.ResultId)continue;
     let index=this.index.get(item.ResultId);if(index!==undefined&&this.results[index].isFinal)continue;
     if(index===undefined){if(this.results.length>=300){this.fail('network');return;}index=this.results.length;this.index.set(item.ResultId,index);}
     const result=[{transcript:text}];result.isFinal=!item.IsPartial;this.results[index]=result;
     if(result.isFinal||this.interimResults)this.onresult?.({resultIndex:index,results:this.results});
     if(result.isFinal&&!this.continuous){this.stop();return;}
    }
   }
   releaseMedia(){clearTimeout(this.duration);if(this.node){this.node.port.onmessage=null;this.node.disconnect();this.node=null;}this.source?.disconnect();this.source=null;this.gain?.disconnect();this.gain=null;this.stream?.getTracks().forEach(track=>track.stop());this.stream=null;const context=this.context;this.context=null;if(context)context.close().catch(()=>{});}
   stop(){if(!this.active||this.finishing)return;this.finishing=true;clearTimeout(this.duration);this.stream?.getTracks().forEach(track=>track.stop());if(this.node&&this.socket?.readyState===1){this.flushTimer=setTimeout(()=>this.completeInput(),500);this.node.port.postMessage('flush');}else this.completeInput();}
   completeInput(){clearTimeout(this.flushTimer);this.releaseMedia();if(this.socket?.readyState===1){this.socket.send(encodeFrame(new Uint8Array()));this.endTimer=setTimeout(()=>this.finish(),5000);}else this.finish();}
   finish(){if(!this.active)return;this.active=false;this.generation++;this.releaseMedia();clearTimeout(this.endTimer);clearTimeout(this.flushTimer);if(this.socket){this.socket.onopen=this.socket.onmessage=this.socket.onerror=this.socket.onclose=null;this.socket.close();this.socket=null;}this.onend?.();}
   fail(error){if(!this.active)return;this.onerror?.({error});this.finish();}
   abort(){this.finish();}
  };
 }
 function getRecognition(config={}){return config.voiceInputProvider==='aws'?(globalThis.navigator?.mediaDevices?.getUserMedia&&(globalThis.AudioContext||globalThis.webkitAudioContext)&&globalThis.AudioWorkletNode&&globalThis.WebSocket?createRecognitionClass():undefined):globalThis.SpeechRecognition||globalThis.webkitSpeechRecognition;}
 return {crc32,encodeFrame,decodeFrame,createRecognitionClass,getRecognition};
});
