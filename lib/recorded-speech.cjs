'use strict';
const {LANGUAGES}=require('../upload-voice.js');
const TYPES={'audio/webm':'webm','audio/mp4':'m4a','audio/ogg':'ogg','audio/wav':'wav','audio/mpeg':'mp3'};
function error(status,code,message){return Object.assign(new Error(message),{status,code});}
function validate(input){
 if(!LANGUAGES.includes(input.language))throw error(400,'language-not-supported','Choose a supported voice language.');
 if(!Object.hasOwn(TYPES,input.mime)||typeof input.audio!=='string'||input.audio.length>1333340||!input.audio.length||input.audio.length%4||!/^[A-Za-z0-9+/]+={0,2}$/.test(input.audio))throw error(400,'invalid-audio','Provide a supported short audio recording.');
 const audio=Buffer.from(input.audio,'base64');if(audio.length<200||audio.length>1000000||audio.toString('base64')!==input.audio)throw error(400,'invalid-audio','Provide a supported short audio recording.');
 const valid=input.mime==='audio/webm'?audio.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])):input.mime==='audio/mp4'?audio.toString('ascii',4,8)==='ftyp':input.mime==='audio/ogg'?audio.toString('ascii',0,4)==='OggS':input.mime==='audio/wav'?audio.toString('ascii',0,4)==='RIFF'&&audio.toString('ascii',8,12)==='WAVE':audio.toString('ascii',0,3)==='ID3'||audio[0]===255&&(audio[1]&224)===224;
 if(!valid)throw error(400,'invalid-audio','The recording format could not be read.');
 return {audio,language:input.language.split('-')[0],mime:input.mime,extension:TYPES[input.mime]};
}
async function transcribe(input,{apiKey,fetch:fetcher=fetch}={}){
 const {audio,language,mime,extension}=validate(input);
 if(!apiKey)throw error(503,'network','Multilingual recording is not configured.');
 const form=new FormData();form.set('file',new Blob([audio],{type:mime}),'patient-request.'+extension);form.set('model','whisper-large-v3');form.set('language',language);form.set('response_format','verbose_json');form.set('temperature','0');
 let response;try{response=await fetcher('https://api.groq.com/openai/v1/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+apiKey},body:form,signal:AbortSignal.timeout(12000)});}catch(_){throw error(503,'network','Voice transcription is temporarily unavailable. Please retry or type your request.');}
 if(!response.ok)throw error(response.status===429?429:503,'network','Voice transcription is temporarily unavailable. Please retry or type your request.');
 let data;try{data=await response.json();}catch(_){throw error(503,'network','Voice transcription could not be read.');}
 const segments=Array.isArray(data.segments)?data.segments:[];
 if(typeof data.text!=='string'||!data.text.trim()||data.text.length>2000||!segments.length||segments.some(segment=>!Number.isFinite(segment.no_speech_prob)||segment.no_speech_prob>0.85||!Number.isFinite(segment.avg_logprob)||segment.avg_logprob < -1||!Number.isFinite(segment.compression_ratio)||segment.compression_ratio>2.4))throw error(422,'no-speech','I could not clearly hear a request. Please try again or type it.');
 return {text:data.text.trim(),language:input.language,provider:'groq',model:'whisper-large-v3'};
}
module.exports={validate,transcribe};
