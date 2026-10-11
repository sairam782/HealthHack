'use strict';
class KaalingaPcm extends AudioWorkletProcessor{
 constructor(){super();this.phase=0;this.total=0;this.count=0;this.buffer=new Uint8Array(3200);this.offset=0;this.port.onmessage=event=>{if(event.data==='flush'){if(this.offset)this.port.postMessage(this.buffer.slice(0,this.offset).buffer);this.offset=0;this.port.postMessage({flushed:true});}};}
 process(inputs){const input=inputs[0]?.[0];if(input)for(const sample of input){this.total+=sample;this.count++;this.phase+=16000;if(this.phase>=sampleRate){const value=Math.max(-1,Math.min(1,this.total/this.count));new DataView(this.buffer.buffer).setInt16(this.offset,Math.round(value*(value<0?32768:32767)),true);this.offset+=2;this.phase-=sampleRate;this.total=0;this.count=0;if(this.offset===this.buffer.length){this.port.postMessage(this.buffer.buffer,[this.buffer.buffer]);this.buffer=new Uint8Array(3200);this.offset=0;}}}return true;}
}
registerProcessor('kaalinga-pcm',KaalingaPcm);
