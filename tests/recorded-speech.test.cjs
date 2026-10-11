'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http');
const speech=require('../lib/recorded-speech.cjs'),upload=require('../upload-voice.js');const {createApplication}=require('../lib/handler.cjs');
const audio=Buffer.alloc(244);audio.write('RIFF');audio.write('WAVE',8);
const payload=(language='hi-IN')=>({language,mime:'audio/wav',audio:audio.toString('base64')});
const clean=text=>({text,segments:[{text,no_speech_prob:0.01,avg_logprob:-0.2,compression_ratio:1.2}]});
const routing=require('../routing.js'),Pain=require('../pain.js');
test('observed Hindi ASR pain spelling retains fast clinical routing and separated water intent',()=>{const text='मुझे दर्ध हो रहा है और मुझे पानी चाहिए।';const result=routing.classifyLocal(text,{language:'hi-IN'});assert.equal(result.priority,2);assert.equal(result.department,'Nursing');assert.ok(result.additional_requests.some(task=>task.department==='Food Services'));assert.ok(result.pain);assert.equal(result.pain.score,null);assert.equal(Pain.reportedPain('दर्ध नहीं है'),false);});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('recorded multilingual input sends Hindi, Mexican Spanish, Spanish and French to transcription without translation',async()=>{
 for(const [language,text] of [['hi-IN','मुझे पानी चाहिए।'],['es-MX','Necesito agua, por favor.'],['es-ES','Quiero agua.'],['fr-FR','Je voudrais de l’eau.']]){
  const result=await speech.transcribe(payload(language),{apiKey:'test-only',fetch:async(url,options)=>{assert.equal(url,'https://api.groq.com/openai/v1/audio/transcriptions');assert.equal(options.headers.Authorization,'Bearer test-only');assert.equal(options.body.get('language'),language.split('-')[0]);assert.equal(options.body.get('model'),'whisper-large-v3');assert.equal(options.body.get('prompt'),null);assert.equal(options.body.get('file').size,audio.length);return Response.json(clean(text));}});
  assert.equal(result.text,text);assert.equal(result.language,language);
 }
});
test('invalid format, unsupported locales, oversized recordings and malformed base64 never reach a provider',()=>{
 for(const change of [{language:'xx-XX'},{mime:'text/plain'},{audio:'bad!'},{audio:''},{audio:Buffer.alloc(1000001).toString('base64')},{audio:Buffer.alloc(244).toString('base64')}])assert.throws(()=>speech.validate({...payload(),...change}));
});
test('silence, suspicious metadata, oversized transcript and provider failures cannot become patient requests',async()=>{
 for(const data of [{text:'Thanks for watching',segments:[]},clean(''),clean('x'.repeat(2001)),{...clean('test'),segments:[{no_speech_prob:0.99,avg_logprob:-0.1,compression_ratio:1}]},{...clean('test'),segments:[{no_speech_prob:0.1,avg_logprob:-1.2,compression_ratio:1}]},{...clean('test'),segments:[{no_speech_prob:0.1,avg_logprob:-0.1,compression_ratio:3}]}])await assert.rejects(speech.transcribe(payload(),{apiKey:'test',fetch:async()=>Response.json(data)}),error=>error.status===422);
 await assert.rejects(speech.transcribe(payload(),{apiKey:'test',fetch:async()=>new Response('PRIVATE_PROVIDER_ERROR',{status:429})}),error=>error.status===429&&!error.message.includes('PRIVATE'));
 await assert.rejects(speech.transcribe(payload(),{apiKey:'test',fetch:async()=>{throw new Error('SECRET_MUST_NOT_LEAK');}}),error=>error.status===503&&!error.message.includes('SECRET'));
});
function fixture(options={}){
 const tracks=[],recorders=[],requests=[],events=[];const stream=()=>{const track={stopped:false,stop(){this.stopped=true;}};tracks.push(track);return {getTracks:()=>[track]};};
 class Recorder{static isTypeSupported(mime){return mime==='audio/mp4';}constructor(media,settings){recorders.push(this);this.mimeType=settings.mimeType;this.state='inactive';}start(){this.state='recording';this.onstart?.();}stop(){this.state='inactive';this.ondataavailable?.({data:new Blob([audio])});this.onstop?.();}}
 const Recognition=upload.createRecognitionClass({MediaRecorderClass:Recorder,mediaDevices:{getUserMedia:async()=>stream()},encode:bytes=>Buffer.from(bytes).toString('base64'),request:async(data,signal)=>{requests.push({data,signal});return {text:'मुझे पानी चाहिए।'};},...options});const recognition=new Recognition();recognition.onstart=()=>events.push('ready');recognition.onprocessing=()=>events.push('processing');recognition.onresult=event=>events.push(event.results[0][0].transcript);recognition.onend=()=>events.push('end');return {recognition,tracks,recorders,requests,events,stream};
}
test('iOS MP4 choice, selected locale, explicit stop and media release precede transcription',async()=>{
 const f=fixture();f.recognition.lang='hi-IN';f.recognition.start();await tick();assert.equal(f.requests.length,0);assert.equal(f.recorders[0].mimeType,'audio/mp4');assert.ok(f.events.includes('ready'));f.recognition.stop();assert.equal(f.tracks[0].stopped,true);await tick();assert.equal(f.requests[0].data.language,'hi-IN');assert.equal(f.requests[0].data.mime,'audio/mp4');assert.ok(f.events.includes('मुझे पानी चाहिए।'));assert.equal(f.events.at(-1),'end');assert.equal(f.recognition.active,false);
});
test('cancel while permission is pending stops the late stream and creates no recorder',async()=>{
 let release;const f=fixture({mediaDevices:{getUserMedia:()=>new Promise(resolve=>release=resolve)}});f.recognition.start();f.recognition.abort();release(f.stream());await tick();assert.equal(f.tracks[0].stopped,true);assert.equal(f.recorders.length,0);assert.equal(f.requests.length,0);
});
test('cancel during upload aborts the HTTP request and rejects a late transcript',async()=>{
 let release,signal;const f=fixture({request:(data,received)=>{signal=received;return new Promise(resolve=>release=resolve);}});f.recognition.start();await tick();f.recognition.stop();await tick();f.recognition.abort();assert.equal(signal.aborted,true);release({text:'must not become a ticket'});await tick();assert.ok(!f.events.includes('must not become a ticket'));assert.equal(f.events.filter(event=>event==='end').length,1);
});
test('recording endpoint is authenticated, patient-only, bounded, rate limited and does not create care tickets',async()=>{
 let calls=0;const app=createApplication({filename:':memory:',databaseUrl:'',publicDeployment:false,demoPassword:'test-password',aiProvider:'rules',apiKey:'test',fetch:async()=>{calls++;return Response.json(clean('मुझे पानी चाहिए।'));}});await app.initialize();const server=http.createServer(app.handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port,cookies={};
 async function post(route,role,data){return fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',...(cookies[role]?{Cookie:cookies[role]}:{})},body:JSON.stringify(data)});}
 try{
  assert.equal((await post('/api/transcribe/recording','patient',payload())).status,401);
  for(const role of ['patient','nurse'])cookies[role]=(await post('/api/login',role,{email:role+'@kaalinga.demo',password:'test-password'})).headers.get('set-cookie').split(';')[0];
  assert.equal((await post('/api/transcribe/recording','nurse',payload())).status,403);
  assert.equal((await post('/api/transcribe/recording','patient',{...payload(),language:'xx'})).status,400);assert.equal(calls,0);
  const response=await post('/api/transcribe/recording','patient',payload());assert.equal(response.status,200);assert.equal((await response.json()).text,'मुझे पानी चाहिए।');
  for(let i=1;i<30;i++)assert.equal((await post('/api/transcribe/recording','patient',payload())).status,200);
  assert.equal((await post('/api/transcribe/recording','patient',payload())).status,429);assert.equal(calls,30);
  assert.equal((await post('/api/transcribe/recording','patient',{...payload(),audio:'a'.repeat(1400001)})).status,413);
  assert.equal((await app.store.query('SELECT COUNT(*) AS total FROM tickets')).rows[0].total,0);
 }finally{await new Promise(resolve=>server.close(resolve));await app.close();}
});
