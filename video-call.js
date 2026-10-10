'use strict';
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();else root.KaalingaVideo=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const ACTIVE=['RINGING','ACCEPTED','CONNECTED'];
  function createSession({call,userId,request,mediaDevices=globalThis.navigator?.mediaDevices,PeerConnection=globalThis.RTCPeerConnection,MediaStreamClass=globalThis.MediaStream,onState=()=>{},onLocalStream=()=>{},onRemoteStream=()=>{},onCallChange=()=>{},pollInterval=1000}){
    let current=call,stream=null,remote=null,peer=null,closed=false,busy=false,starting=false,offered=false;
    let connectionTimer=null,disconnectTimer=null;
    const seen=new Set(),candidates=[];
    const endpoint='/api/calls/'+call.id;
    const post=(route,payload)=>request(endpoint+route,{method:'POST',body:JSON.stringify(payload)});
    function state(status,errorKey=null){if(!closed)onState({status,errorKey});}
    function update(next){current=next;onCallChange(next);}
    function release(){
      clearTimeout(connectionTimer);clearTimeout(disconnectTimer);
      if(peer){peer.onicecandidate=peer.ontrack=peer.onconnectionstatechange=null;peer.close();peer=null;}
      stream?.getTracks().forEach(track=>track.stop());stream=null;
      remote?.getTracks().forEach(track=>track.stop());remote=null;
      onLocalStream(null);onRemoteStream(null);
    }
    function dispose(){if(closed)return;closed=true;clearInterval(timer);release();}
    async function end(action='end'){
      if(closed)return;
      dispose();
      onState({status:'ended',errorKey:action==='failed'?'connection':null});
      try{const result=await post('/action',{action});update(result.call);onState({status:'ended',errorKey:action==='failed'?'connection':null});}
      catch(_){onState({status:'ended',errorKey:'network'});}
    }
    async function fail(){if(closed)return;state('error','connection');await end('failed');}
    async function signal(kind,payload){await post('/signals',{kind,payload});}
    function createPeer(config){
      if(peer)return peer;
      peer=new PeerConnection({iceServers:config.iceServers,iceTransportPolicy:config.relayOnly?'relay':'all'});
      for(const track of stream.getTracks())peer.addTrack(track,stream);
      peer.onicecandidate=event=>{if(event.candidate&&!closed)signal('candidate',event.candidate.toJSON()).catch(()=>fail());};
      peer.ontrack=event=>{
        if(closed)return;
        remote=remote||event.streams[0]||new MediaStreamClass();
        if(!remote.getTracks().some(track=>track.id===event.track.id))remote.addTrack(event.track);
        onRemoteStream(remote);
      };
      peer.onconnectionstatechange=()=>{
        if(closed||!peer)return;
        if(peer.connectionState==='connected'){
          clearTimeout(connectionTimer);clearTimeout(disconnectTimer);state('connected');
          post('/action',{action:'connected'}).then(result=>{if(!closed)update(result.call);}).catch(()=>fail());
        }else if(peer.connectionState==='failed')fail();
        else if(peer.connectionState==='disconnected'){clearTimeout(disconnectTimer);disconnectTimer=setTimeout(()=>fail(),8000);}
      };
      connectionTimer=setTimeout(()=>fail(),30000);state('connecting');
      return peer;
    }
    async function poll(){
      if(closed||busy)return;busy=true;
      try{
        const result=await request(endpoint+'/signals');if(closed)return;
        update(result.call);
        if(!ACTIVE.includes(current.status)){onState({status:'ended',errorKey:null});dispose();return;}
        if(!stream||current.status==='RINGING')return;
        const connection=createPeer(result);
        if(userId===current.nurse_id&&!offered){
          offered=true;
          const offer=await connection.createOffer();await connection.setLocalDescription(offer);
          if(closed)return;
          await signal('offer',{type:connection.localDescription.type,sdp:connection.localDescription.sdp});
        }
        for(const item of result.signals){
          if(seen.has(item.id)||closed)continue;
          if(item.kind==='candidate')candidates.push(item.payload);
          else{
            await connection.setRemoteDescription(item.payload);
            if(item.kind==='offer'){
              const answer=await connection.createAnswer();await connection.setLocalDescription(answer);
              if(closed)return;
              await signal('answer',{type:connection.localDescription.type,sdp:connection.localDescription.sdp});
            }
          }
          seen.add(item.id);
        }
        if(connection.remoteDescription){while(candidates.length&&!closed)await connection.addIceCandidate(candidates.shift());}
      }catch(_){if(!closed){if(peer)await fail();else state('error','network');}}
      finally{busy=false;}
    }
    async function start(audioOnly=false){
      if(closed||starting||stream)return false;starting=true;state('preparing');
      try{
        if(!mediaDevices?.getUserMedia||!PeerConnection){state('error','unsupported');return false;}
        let captured;
        try{captured=await mediaDevices.getUserMedia({audio:true,video:audioOnly?false:{width:{ideal:640},height:{ideal:480}}});}
        catch(error){state('error',error.name==='NotAllowedError'?'permission':'device');return false;}
        if(closed){captured.getTracks().forEach(track=>track.stop());return false;}
        stream=captured;onLocalStream(stream);state('waiting');
        if(userId===current.patient_id&&current.status==='RINGING'){
          const result=await post('/action',{action:'accept'});
          if(closed)return false;update(result.call);
          if(!ACTIVE.includes(current.status)){release();state('ended');return false;}
        }
        await poll();return !closed;
      }catch(_){release();state('error','network');return false;}
      finally{starting=false;}
    }
    function mute(muted){stream?.getAudioTracks().forEach(track=>{track.enabled=!muted;});}
    function camera(enabled){stream?.getVideoTracks().forEach(track=>{track.enabled=enabled;});}
    const timer=setInterval(poll,pollInterval);
    return {start,poll,end,dispose,mute,camera};
  }
  return {createSession,ACTIVE};
});
