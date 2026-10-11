(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KalingaUploadVoice=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const LANGUAGES=['en-US','es-ES','es-MX','hi-IN','fr-FR','pt-BR','zh-CN','ar-SA','ko-KR','tl-PH','pl-PL','de-DE','ja-JP'];
  function createRecognitionClass(deps={}){
    const media=deps.mediaDevices||globalThis.navigator?.mediaDevices,Recorder=deps.MediaRecorderClass||globalThis.MediaRecorder;
    const request=deps.request||async function(payload,signal){const response=await fetch('/api/transcribe/recording',{method:'POST',headers:{'Content-Type':'application/json'},signal,body:JSON.stringify(payload)});const data=await response.json();if(!response.ok)throw Object.assign(new Error('Transcription failed'),{code:data.code||'network'});return data;};
    const encode=deps.encode||function(bytes){let text='';for(let offset=0;offset<bytes.length;offset+=8192)text+=String.fromCharCode(...bytes.subarray(offset,offset+8192));return btoa(text);};
    return class RecordingRecognition{
      constructor(){this.lang='en-US';this.continuous=false;this.active=false;this.generation=0;}
      start(){if(this.active)throw new Error('Already listening');this.active=true;this.finishing=false;const version=++this.generation;this.open(version).catch(error=>{if(this.valid(version))this.fail(error.name==='NotAllowedError'?'not-allowed':error.name==='NotFoundError'?'audio-capture':'network');});}
      valid(version){return this.active&&this.generation===version;}
      async open(version){
        const stream=await media.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true},video:false});
        if(!this.valid(version)){stream.getTracks().forEach(track=>track.stop());return;}
        this.stream=stream;this.chunks=[];this.bytes=0;
        const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(value=>Recorder.isTypeSupported?.(value));
        const recorder=new Recorder(stream,{...(mime?{mimeType:mime}:{}),audioBitsPerSecond:64000});this.recorder=recorder;
        recorder.ondataavailable=event=>{if(!this.valid(version)||!event.data.size)return;this.bytes+=event.data.size;if(this.bytes>1000000){this.fail('too-large');return;}this.chunks.push(event.data);};
        recorder.onerror=()=>{if(this.valid(version))this.fail('audio-capture');};
        recorder.onstop=()=>{if(!this.valid(version))return;this.upload(version,mime||recorder.mimeType).catch(error=>{if(this.valid(version))this.fail(error.code||'network');});};
        recorder.onstart=()=>{if(this.valid(version))this.onstart?.();};
        recorder.start(1000);this.duration=setTimeout(()=>this.stop(),30000);
      }
      stop(){if(!this.active||this.finishing)return;this.finishing=true;clearTimeout(this.duration);if(this.recorder?.state==='recording'){this.recorder.stop();this.releaseStream();this.onprocessing?.();}else this.abort();}
      releaseStream(){this.stream?.getTracks().forEach(track=>track.stop());this.stream=null;clearTimeout(this.duration);}
      async upload(version,mime){
        this.releaseStream();this.onprocessing?.();
        const blob=new Blob(this.chunks,{type:mime});this.chunks=[];
        if(blob.size<200){this.fail('no-speech');return;}
        const bytes=new Uint8Array(await blob.arrayBuffer());if(!this.valid(version))return;
        const controller=new AbortController();this.controller=controller;
        let data;try{data=await request({language:this.lang,mime:blob.type.split(';')[0],audio:encode(bytes)},controller.signal);}finally{if(this.controller===controller)this.controller=null;}
        if(!this.valid(version))return;
        if(typeof data.text!=='string'||!data.text.trim()||data.text.length>2000){this.fail('no-speech');return;}
        const result=[{transcript:data.text.trim()}];result.isFinal=true;
        this.onresult?.({resultIndex:0,results:[result]});
        if(this.valid(version)){this.active=false;this.generation++;this.onend?.();}
      }
      fail(error){this.onerror?.({error});this.abort();}
      abort(){const wasActive=this.active;this.active=false;this.generation++;this.controller?.abort();this.controller=null;this.releaseStream();const recorder=this.recorder;this.recorder=null;if(recorder){recorder.ondataavailable=recorder.onstop=recorder.onerror=recorder.onstart=null;if(recorder.state==='recording')recorder.stop();}this.chunks=[];if(wasActive)this.onend?.();}
    };
  }
  function available(){return Boolean(globalThis.navigator?.mediaDevices?.getUserMedia&&globalThis.MediaRecorder);}
  return {LANGUAGES,createRecognitionClass,available};
});
