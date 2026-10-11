'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const http=require('node:http');
const {createApplication}=require('../lib/handler.cjs');const {createPlayer}=require('../voice-reply.js');const {promptText}=require('../lib/assistant-prompts.cjs');
test('assistant prompts distinguish unsent drafts from delivered care requests',()=>{
 assert.equal(promptText({prompt:'fake-acknowledgement'}),null);assert.equal(promptText({prompt:'confirm',text:''}),null);
 assert.equal(promptText({prompt:'confirm',text:'x'.repeat(2001)}),null);
 assert.match(promptText({prompt:'confirm',text:'I need water',language:'en-US'}),/I understood that you need water or a drink.*not been sent yet.*Say send request/);
 assert.match(promptText({prompt:'cancelled',language:'hi-IN'}),/नहीं भेजा गया/);
});
test('assistant voice is authenticated, patient-only, bounded and does not create a ticket',async()=>{
 const spoken=[];const app=createApplication({filename:':memory:',databaseUrl:'',publicDeployment:false,demoPassword:'test-password',apiKey:'',elevenKey:'test-key',fetch:async(url,options)=>{spoken.push(JSON.parse(options.body).text);return new Response('test-audio');}});
 await app.initialize();const server=http.createServer(app.handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 async function post(path,payload,cookie){return fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(payload)});}
 try{
 assert.equal((await post('/api/assistant/voice',{prompt:'ready'})).status,401);
 const cookies={};for(const role of ['patient','nurse']){const login=await post('/api/login',{email:role+'@kaalinga.demo',password:'test-password'});cookies[role]=login.headers.get('set-cookie').split(';')[0];}
 assert.equal((await post('/api/assistant/voice',{prompt:'ready'},cookies.nurse)).status,403);
 assert.equal((await post('/api/assistant/voice',{prompt:'staff-acknowledged'},cookies.patient)).status,400);
 assert.equal((await post('/api/assistant/voice',{prompt:'confirm',text:'x'.repeat(2001)},cookies.patient)).status,400);
 assert.equal((await post('/api/assistant/voice',{prompt:'confirm',language:'en-US',text:'I need water'},cookies.patient)).status,200);
 assert.match(spoken.at(-1),/I understood that you need water or a drink/);assert.equal((await app.store.query('SELECT COUNT(*) AS total FROM tickets')).rows[0].total,0);
 }finally{await new Promise(resolve=>server.close(resolve));await app.close();}
});
test('assistant playback posts draft text, preserves queued receipts and revokes its blob',async()=>{
 const instances=[],revoked=[],requests=[];
 class Audio{constructor(src){this.src=src;instances.push(this);}async play(){}pause(){}removeAttribute(){}load(){}}
 const player=createPlayer({AudioClass:Audio,fetchAudio:async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return new Response('audio');},URLClass:{createObjectURL:()=> 'blob:assistant',revokeObjectURL:src=>revoked.push(src)}});
 try{const played=player.enqueue({id:'prompt',assistant_prompt:'confirm',language:'en-US',draft:'water'});player.enqueue({id:'receipt',status:'NEW'});assert.equal(await played,true);assert.equal(instances[0].src,'blob:assistant');assert.equal(requests[0].body.text,'water');instances[0].onended();assert.equal(instances[1].src,'/api/voice/receipt?stage=NEW');assert.deepEqual(revoked,['blob:assistant']);}finally{player.stop();}
});
test('stopping a pending assistant synthesis cannot later activate audio',async()=>{
 let resolve;const states=[],instances=[];
 class Audio{constructor(){instances.push(this);}async play(){}}
 const player=createPlayer({AudioClass:Audio,onState:s=>states.push(s),fetchAudio:()=>new Promise(r=>{resolve=r;}),URLClass:{createObjectURL:()=>{throw new Error('must not create');}}});
 const pending=player.play({id:'prompt',assistant_prompt:'ready'});player.stop();resolve(new Response('audio'));assert.equal(await pending,false);assert.equal(instances.length,0);assert.equal(states.at(-1).status,'idle');
});
