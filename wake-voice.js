'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./routing.js'),require('./patient-assistant.js'));else root.KaalingaWake=factory(root.KaalingaRouting,root.KaalingaAssistant);})(typeof globalThis!=='undefined'?globalThis:this,function(Routing,Assistant){
  const clean=value=>String(value||'').normalize('NFKC').trim().replace(/[.!?,;:।]+$/u,'').trim();
  function wakeRequest(value){
    const match=clean(value).match(/^(?:(?:hey|hi|hello|okay|ok|hé|oye|hola|salut)[\s,!?:.-]+(?:kaalinga|kalinga|ka?l[\s-]+inga)|(?:हे|हाय|हेलो|ए)[\s,!?:।-]+(?:कालिंगा|कालिंग|कालींगा|कालिङ्गा))(?:\s|[,!?:।-]|$)([\s\S]*)$/iu);
    return match?match[1].replace(/^[\s,!?:।-]+/u,'').trim():null;
  }
  function command(value){
    const text=clean(value).toLocaleLowerCase();
    if(['send request','send it','send','enviar solicitud','enviar','envoyer la demande','envoyer','अनुरोध भेजें','भेजें','भेजो','भेज दो'].includes(text))return 'send';
    if(['cancel','cancel request','cancelar','annuler','रद्द करें','रद्द','कैंसल'].includes(text))return 'cancel';
    if(['skip','skip question',"i don't know",'not sure','omitir','no sé','passer','je ne sais pas','छोड़ें','पता नहीं'].includes(text))return 'skip';
    return null;
  }
  function createListener({Recognition=globalThis.SpeechRecognition||globalThis.webkitSpeechRecognition,language='en-US',onState=()=>{},onDraft=()=>{},onPrompt=()=>{},onHeard=()=>{},onSend=async()=>{},restartMs=700,timeoutMs=60000,now=()=>Date.now()}={}){
    let enabled=false,closed=false,recognition=null,phase='wake',draft='',restart=null,timeout=null,painAttempts=0,wakePrefix=null;
    const pauses=new Set();let ends=[];
    const emit=(status,error=null)=>onState({enabled,phase,status,error,draft});
    function abort(){wakePrefix=null;const old=recognition;recognition=null;if(old){old.onresult=old.onend=old.onerror=old.onstart=null;old.abort();}clearTimeout(restart);clearTimeout(timeout);}
    function reset(){phase='wake';draft='';painAttempts=0;wakePrefix=null;clearTimeout(timeout);}
    function stop(){enabled=false;abort();reset();emit('off');}
    function dispose(){stop();closed=true;}
    function failed(error){enabled=false;abort();emit('error',error);}
    function deadline(){clearTimeout(timeout);if(!pauses.size&&(phase==='capture'||phase==='confirm'||phase==='pain'))timeout=setTimeout(()=>{if(!enabled||closed)return;reset();emit('listening');onPrompt('timeout');},timeoutMs);}
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
      if(phase==='confirm'||phase==='pain'){
        if(action==='send'){deliver().catch(()=>failed('delivery'));return;}
        const replacement=wakeRequest(value);if(replacement!==null){reset();capture(replacement);return;}
        const correction=value.match(/^(?:change (?:my |the )?request to|actually[, ]+|cambia mi solicitud a|en realidad[, ]+|change ma demande(?: pour)?|en fait[, ]+|अनुरोध बदलें)\s*([\s\S]+)$/iu);
        const addition=value.match(/^(?:also|también|aussi|और)[, ]+([\s\S]+)$/iu);
        if(correction){reset();capture(correction[1]);return;}
        if(addition){capture(draft+'. '+addition[1],phase==='pain');return;}
        if(phase==='pain'){
          if(action==='skip'){confirm();return;}
          const score=Assistant.scoreAnswer(value);
          if(score!==null){draft+=' '+Assistant.copy(language).scoreLine(score);onDraft(draft);confirm();return;}
          if(Routing.classifyLocal(value,{language}).priority===1){capture(draft+'. '+value,true);return;}
          if(++painAttempts>=2){confirm();return;}
          emit('listening');onPrompt('pain_retry',draft);deadline();
        }
        return;
      }
      if(phase==='capture'){if(action==='send')return;capture(value);return;}
      const request=wakeRequest(value);if(request!==null)capture(request);
    }
    function confirm(){phase='confirm';emit('listening');onPrompt('confirm',draft);deadline();}
    function capture(value,skipPain=false){
      if(!value){phase='capture';emit('listening');onPrompt('ready');deadline();return;}
      if(value.length>2000){reset();emit('listening','long');onPrompt('timeout');return;}
      draft=value;onDraft(draft);
      const result=Routing.classifyLocal(draft,{language});
      if(!skipPain&&Assistant.shouldAskPain(draft,result)){phase='pain';painAttempts=0;emit('listening');onPrompt('pain_question',draft);deadline();}
      else confirm();
    }
    function listen(){
      if(!enabled||closed||pauses.size||recognition||phase==='sending')return;
      const instance=new Recognition();recognition=instance;
      instance.lang=language;instance.continuous=true;instance.interimResults=false;instance.maxAlternatives=3;
      instance.onstart=()=>{if(recognition===instance){emit('listening');deadline();}};
      instance.onresult=event=>{
        if(recognition!==instance)return;
        for(let index=event.resultIndex||0;index<event.results.length;index++){
          if(recognition!==instance||pauses.size)break;
          if(event.results[index].isFinal){
            const alternatives=Array.from(event.results[index]).slice(0,3).map(item=>clean(item.transcript)).filter(Boolean);
            const primary=alternatives[0];if(!primary)continue;
            let selected=primary,detected=false;
            if(phase==='wake'){
              // Alternatives can activate a draft, never authorize sending it.
              let match=alternatives.find(value=>wakeRequest(value)!==null);
              if(!match&&wakePrefix&&now()-wakePrefix.at<=3000)match=alternatives.map(value=>wakePrefix.text+' '+value).find(value=>wakeRequest(value)!==null);
              wakePrefix=null;
              if(match){selected=match;detected=true;}
              else if(/^(?:hey|hi|hello|okay|ok|hé|oye|hola|salut|हे|हाय|हेलो|ए)$/iu.test(primary))wakePrefix={text:primary,at:now()};
            }
            onHeard({transcript:primary.slice(0,2000),phase,wakeDetected:detected,wakeTranscript:detected?selected.slice(0,2000):null});
            hear(selected);
          }
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
