'use strict';
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KaalingaVoice = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function createPlayer({AudioClass = Audio, onState = () => {}, fetchAudio = globalThis.fetch, URLClass = globalThis.URL} = {}) {
    let active = null;
    let waiting = [];
    let paused = false;
    const seen = new Set();
    const blobs = new WeakMap();
    let pending = null, generation = 0;
    function release(audio) {
      audio.onended = audio.onerror = audio.onplaying = null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      if(blobs.has(audio)){URLClass.revokeObjectURL(blobs.get(audio));blobs.delete(audio);}
    }
    function stop() {
      generation++;pending?.abort();pending=null;
      const previous = active;
      active = null;
      waiting = []; paused = false; seen.clear();
      if (previous) release(previous);
      onState({status:'idle',ticket:null});
    }
    async function start(ticket) {
      const version=++generation;
      const stage = ticket.audio_stage || ticket.status;
      const suffix = ['NEW','ACKNOWLEDGED','RESOLVED'].includes(stage) ? '?stage=' + stage : '';
      let audio;
      if(ticket.assistant_prompt){
        const operation=new AbortController();pending=operation;onState({status:'loading',ticket});
        try{
          const response=await fetchAudio('/api/assistant/voice',{method:'POST',headers:{'Content-Type':'application/json'},signal:operation.signal,body:JSON.stringify({prompt:ticket.assistant_prompt,language:ticket.language,text:ticket.draft,ticketId:ticket.pain_ticket_id})});
          if(!response.ok)throw new Error('Voice unavailable');
          const blob=await response.blob();if(version!==generation)return false;
          const src=URLClass.createObjectURL(blob);audio=new AudioClass(src);blobs.set(audio,src);pending=null;
        }catch(_){if(version===generation){pending=null;paused=true;onState({status:'error',ticket});}return false;}
      }else audio = new AudioClass(ticket.call_id ? '/api/calls/' + ticket.call_id + '/voice' : '/api/voice/' + ticket.id + suffix);
      active = audio;
      onState({status:'loading',ticket});
      function failed(error) {
        if (active !== audio) return;
        active = null;
        paused = true;
        release(audio);
        onState({status:error?.name === 'NotAllowedError' ? 'blocked' : 'error',ticket});
      }
      audio.onplaying = () => { if (active === audio) onState({status:'playing',ticket}); };
      audio.onended = () => {
        if (active !== audio) return;
        active = null; release(audio);
        if (waiting.length) start(waiting.shift());
        else onState({status:'idle',ticket:null});
      };
      audio.onerror = () => failed();
      try {
        await audio.play();
        if (active !== audio) return false;
        onState({status:'playing',ticket});
        return true;
      } catch (error) { failed(error); return false; }
    }
    function play(ticket) { stop(); return start(ticket); }
    function enqueue(ticket) {
      const key = ticket.id + ':' + (ticket.audio_stage || ticket.status || 'NEW');
      if (seen.has(key)) return Promise.resolve(false);
      seen.add(key);
      if (active || pending || paused) { waiting.push(ticket); return Promise.resolve(false); }
      return start(ticket);
    }
    function retry(ticket) { paused = false; return start(ticket); }
    return {play,enqueue,retry,stop};
  }
  function createUpdateTracker() {
    const stages = new Map();
    const rank = {NEW:1, ACKNOWLEDGED:2, RESOLVED:3};
    function remember(ticket) {
      if ((rank[ticket.status] || 0) >= (rank[stages.get(ticket.id)] || 0)) stages.set(ticket.id, ticket.status);
    }
    function observe(tickets, baseline = false) {
      const updates = [];
      for (const ticket of [...tickets].sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)))) {
        const previous = stages.get(ticket.id);
        if (rank[ticket.status] && ((previous && rank[ticket.status] > rank[previous]) || (!previous && !baseline))) updates.push(ticket);
        remember(ticket);
      }
      return updates;
    }
    return {remember,observe,reset:()=>stages.clear()};
  }
  // Unlock from a patient gesture; never request a microphone to play this cue.
  function createTurnCue({AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext}={}) {
    let context=null,closed=false,generation=0;
    const tones=new Set();
    async function unlock() {
      if(closed||!AudioContextClass)return false;
      try {context ||= new AudioContextClass();await context.resume();return !closed&&context.state==='running';}
      catch(_){return false;}
    }
    function stop() {
      generation++;
      for(const tone of tones){tone.oscillator.onended=null;try{tone.oscillator.stop();}catch(_){}tone.oscillator.disconnect();tone.gain.disconnect();}
      tones.clear();
    }
    async function play() {
      stop();const version=generation;
      if(!context||!await unlock()||closed||version!==generation)return false;
      try {
        const start=context.currentTime;
        for(const [offset,frequency] of [[0,660],[0.12,880]]) {
          const oscillator=context.createOscillator(),gain=context.createGain(),tone={oscillator,gain};
          oscillator.type='sine';oscillator.frequency.value=frequency;
          gain.gain.setValueAtTime(0,start+offset);
          gain.gain.linearRampToValueAtTime(0.045,start+offset+0.015);
          gain.gain.linearRampToValueAtTime(0,start+offset+0.11);
          oscillator.connect(gain);gain.connect(context.destination);tones.add(tone);
          oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();tones.delete(tone);};
          oscillator.start(start+offset);oscillator.stop(start+offset+0.12);
        }
        return true;
      }catch(_){stop();return false;}
    }
    function dispose(){closed=true;stop();const previous=context;context=null;if(previous)previous.close().catch(()=>{});}
    return {unlock,play,stop,dispose};
  }
  return {createPlayer,createUpdateTracker,createTurnCue};
});
