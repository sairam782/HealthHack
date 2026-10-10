'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.KaalingaWake=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const clean=value=>String(value||'').normalize('NFKC').trim().replace(/[.!?,;:।]+$/u,'').trim();
  function wakeRequest(value){
    const match=clean(value).match(/^(?:(?:hey|hi|hello|okay|ok|hé|oye|hola|salut)\s+(?:kaalinga|kalinga|kal inga)|(?:हे|हाय|हेलो|ए)\s+(?:कालिंगा|कालिंग|कालींगा|कालिङ्गा))(?:\s|[,!?:।-]|$)([\s\S]*)$/iu);
    return match?match[1].replace(/^[\s,!?:।-]+/u,'').trim():null;
  }
  function command(value){
    const text=clean(value).toLocaleLowerCase();
    if(['send request','send it','send','enviar solicitud','enviar','envoyer la demande','envoyer','अनुरोध भेजें','भेजें','भेजो','भेज दो'].includes(text))return 'send';
    if(['cancel','cancel request','cancelar','annuler','रद्द करें','रद्द','कैंसल'].includes(text))return 'cancel';
    return null;
  }
  function createListener({Recognition=globalThis.SpeechRecognition||globalThis.webkitSpeechRecognition,language='en-US',onState=()=>{},onDraft=()=>{},onPrompt=()=>{},onSend=async()=>{},restartMs=700,timeoutMs=30000}={}){
    let enabled=false,closed=false,recognition=null,phase='wake',draft='',restart=null,timeout=null;
    const pauses=new Set();let ends=[];
    const emit=(status,error=null)=>onState({enabled,phase,status,error,draft});
    function abort(){const old=recognition;recognition=null;if(old){old.onresult=old.onend=old.onerror=old.onstart=null;old.abort();}clearTimeout(restart);clearTimeout(timeout);}
    function reset(){phase='wake';draft='';clearTimeout(timeout);}
    function stop(){enabled=false;abort();reset();emit('off');}
    function dispose(){stop();closed=true;}
    function failed(error){enabled=false;abort();emit('error',error);}
    function deadline(){clearTimeout(timeout);if(!pauses.size&&(phase==='capture'||phase==='confirm'))timeout=setTimeout(()=>{if(!enabled||closed)return;reset();emit('listening');onPrompt('timeout');},timeoutMs);}
    function suspend(reason,value){
      if(value)pauses.add(reason);else pauses.delete(reason);
      if(!enabled||closed)return;
      if(pauses.size){abort();if(reason==='hidden'&&value)reset();emit('paused');}
      else if(!recognition){emit('starting');listen();}
    }
    async function deliver(){
      const payload=draft;phase='sending';abort();emit('sending');
      try{await onSend(payload);}finally{if(!closed&&enabled){reset();emit(pauses.size?'paused':'starting');if(!pauses.size)listen();}}
    }
    function hear(transcript){
      if(!enabled||closed||pauses.size||phase==='sending')return;
      const value=clean(transcript);if(!value)return;
      const action=command(value);
      if(phase!=='wake'&&action==='cancel'){reset();onDraft('');emit('listening');onPrompt('cancelled');return;}
      if(phase==='confirm'){
        if(action==='send'){deliver().catch(()=>failed('delivery'));return;}
        // A new wake phrase explicitly replaces the draft; unrelated speech never submits it.
        const replacement=wakeRequest(value);if(replacement!==null){reset();capture(replacement);}
        return;
      }
      if(phase==='capture'){if(action==='send')return;capture(value);return;}
      const request=wakeRequest(value);if(request!==null)capture(request);
    }
    function capture(value){
      if(!value){phase='capture';emit('listening');onPrompt('ready');deadline();return;}
      if(value.length>2000){reset();emit('listening','long');onPrompt('timeout');return;}
      draft=value;phase='confirm';onDraft(draft);emit('listening');onPrompt('confirm',draft);deadline();
    }
    function listen(){
      if(!enabled||closed||pauses.size||recognition||phase==='sending')return;
      const instance=new Recognition();recognition=instance;
      instance.lang=language;instance.continuous=true;instance.interimResults=false;
      instance.onstart=()=>{if(recognition===instance){emit('listening');deadline();}};
      instance.onresult=event=>{
        if(recognition!==instance)return;
        for(let index=event.resultIndex||0;index<event.results.length;index++){
          if(recognition!==instance||pauses.size)break;
          if(event.results[index].isFinal)hear(event.results[index][0].transcript);
        }
      };
      instance.onerror=event=>{if(recognition!==instance)return;if(event.error==='no-speech')return;failed(event.error==='not-allowed'||event.error==='service-not-allowed'?'permission':event.error==='audio-capture'?'device':'recognition');};
      instance.onend=()=>{
        if(recognition!==instance)return;recognition=null;if(!enabled||closed||pauses.size)return;
        const now=Date.now();ends=ends.filter(time=>now-time<30000);ends.push(now);
        if(ends.length>6){failed('recognition');return;}
        emit('starting');restart=setTimeout(listen,restartMs);
      };
      try{instance.start();}catch(_){failed('device');}
    }
    function start(){if(closed||enabled)return false;if(!Recognition){failed('unsupported');return false;}enabled=true;ends=[];reset();emit('starting');listen();return enabled;}
    return {start,stop,dispose,suspend};
  }
  return {createListener,wakeRequest,command};
});
