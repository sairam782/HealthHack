'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http'),{randomUUID}=require('node:crypto');
const {createApplication}=require('../lib/handler.cjs');
const {promptText}=require('../lib/assistant-prompts.cjs');
const {createListener}=require('../wake-voice.js');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('pain alerts are committed before rating, then securely update the same acknowledged request',async t=>{
 const spoken=[];let modelCalls=0;
 const app=createApplication({filename:':memory:',databaseUrl:'',publicDeployment:false,demoPassword:'test-password',aiProvider:'groq',apiKey:'test-model',elevenKey:'test-key',fetch:async(url,options)=>{if(!url.includes('elevenlabs')){modelCalls++;throw new Error('Pain must bypass models');}spoken.push(JSON.parse(options.body).text);return new Response('audio');}});
 await app.initialize();const server=http.createServer(app.handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port,cookies={};
 async function request(path,role='patient',method='GET',data){return fetch(base+path,{method,headers:{'Content-Type':'application/json',Cookie:cookies[role]||''},...(data?{body:JSON.stringify(data)}:{})});}
 try{
  for(const role of ['patient','patient2','nurse','dietary']){const res=await request('/api/login',role,'POST',{email:role+'@kaalinga.demo',password:'test-password'});cookies[role]=res.headers.get('set-cookie').split(';')[0];}
  const created=await(await request('/api/requests','patient','POST',{text:'I have pain and need water',requestKey:randomUUID()})).json(),id=created.ticket.id;
  await t.test('initial nursing alert and separate water task exist with an unanswered pain score',async()=>{
   assert.equal(created.ticket.pain.score,null);assert.equal(created.ticket.priority,2);assert.equal(created.tickets.length,2);assert.equal(modelCalls,0);
   const nurse=await(await request('/api/tickets','nurse')).json();assert.equal(nurse.tickets[0].id,id);assert.ok(nurse.notifications.some(n=>n.ticket_id===id));
   const food=await(await request('/api/tickets','dietary')).json();assert.equal(food.tickets.length,1);assert.equal(food.tickets[0].pain,null);assert.doesNotMatch(food.tickets[0].original_text,/pain/);
   assert.equal((await request('/api/assistant/voice','patient','POST',{prompt:'pain_notified',ticketId:id,language:'en-US'})).status,200);assert.match(spoken.at(-1),/sent to Nursing.*one to ten/);assert.doesNotMatch(spoken.at(-1),/acknowledged|on the way|not been sent/);
  });
  await t.test('other patients, staff, non-pain tickets and malformed updates are rejected',async()=>{
   const valid={painScore:8,revision:0};assert.equal((await request('/api/tickets/'+id+'/pain','patient2','PATCH',valid)).status,404);assert.equal((await request('/api/tickets/'+id+'/pain','nurse','PATCH',valid)).status,403);
   assert.equal((await request('/api/assistant/voice','patient2','POST',{prompt:'pain_notified',ticketId:id})).status,404);
   assert.equal((await request('/api/tickets/'+created.tickets[1].id+'/pain','patient','PATCH',valid)).status,404);
   for(const input of [{painScore:0,revision:0},{painScore:11,revision:0},{painScore:'8',revision:0},{painScore:8},{painLocation:[],revision:0},{painWorsening:'yes',revision:0},{context:'x'.repeat(501),revision:0}])assert.equal((await request('/api/tickets/'+id+'/pain','patient','PATCH',input)).status,400);
   assert.equal((await request('/api/assistant/voice','patient','POST',{prompt:'pain_saved',ticketId:id})).status,400);
  });
  await request('/api/tickets/'+id,'nurse','PATCH',{action:'acknowledge'});
  let updated;
  await t.test('score update preserves ID, staff acknowledgement, services and adds a nursing notification',async()=>{
   const res=await request('/api/tickets/'+id+'/pain','patient','PATCH',{painScore:8,painLocation:'lower back',painWorsening:true,revision:0});assert.equal(res.status,200);updated=(await res.json()).ticket;
   assert.equal(updated.id,id);assert.equal(updated.status,'ACKNOWLEDGED');assert.equal(updated.pain.score,8);assert.equal(updated.pain.revision,1);assert.ok(updated.pain.updated_at);assert.equal(updated.priority,2);
   const nurse=await(await request('/api/tickets','nurse')).json();assert.match(nurse.tickets[0].summary,/8\/10.*lower back/);assert.ok(nurse.notifications.some(n=>/Pain update.*8\/10/.test(n.message)));
   assert.equal((await app.store.query('SELECT COUNT(*) AS total FROM tickets')).rows[0].total,2);
   const food=await(await request('/api/tickets','dietary')).json();assert.equal(food.tickets[0].pain,null);assert.ok(!food.notifications.some(n=>/8\/10/.test(n.message)));
   for(const language of ['en-US','es-ES','hi-IN','fr-FR'])assert.equal((await request('/api/assistant/voice','patient','POST',{prompt:'pain_saved',ticketId:id,language})).status,200);
  });
  await t.test('identical retries do not duplicate notifications; stale conflicting updates are rejected',async()=>{
   const before=(await app.store.query('SELECT COUNT(*) AS total FROM notifications')).rows[0].total;
   const retry=await request('/api/tickets/'+id+'/pain','patient','PATCH',{painScore:8,painLocation:'lower back',painWorsening:true,revision:0});assert.equal(retry.status,200);assert.equal((await retry.json()).ticket.pain.revision,1);
   assert.equal((await app.store.query('SELECT COUNT(*) AS total FROM notifications')).rows[0].total,before);
   assert.equal((await request('/api/tickets/'+id+'/pain','patient','PATCH',{painScore:3,revision:0})).status,409);
  });
  await t.test('new urgent symptoms raise existing request to P1 and create only one medical escalation',async()=>{
   const res=await request('/api/tickets/'+id+'/pain','patient','PATCH',{context:'I cannot breathe',revision:1});assert.equal(res.status,200);updated=(await res.json()).ticket;assert.equal(updated.priority,1);assert.equal(updated.status,'ACKNOWLEDGED');assert.equal(updated.pain.score,8);
   assert.equal((await app.store.query("SELECT COUNT(*) AS total FROM tickets WHERE parent_id = ? AND source = 'clinical_escalation'",[id])).rows[0].total,1);
   const next=await(await request('/api/tickets/'+id+'/pain','patient','PATCH',{painScore:1,revision:2})).json();assert.equal(next.ticket.priority,1);assert.equal(next.ticket.pain.score,1);
   assert.equal((await app.store.query("SELECT COUNT(*) AS total FROM tickets WHERE parent_id = ? AND source = 'clinical_escalation'",[id])).rows[0].total,1);
   assert.equal((await request('/api/assistant/voice','patient','POST',{prompt:'pain_notified',ticketId:id})).status,400);
  });
  await t.test('resolved pain requests cannot be reopened through a score update',async()=>{
   await request('/api/tickets/'+id,'nurse','PATCH',{action:'resolve'});
   assert.equal((await request('/api/tickets/'+id+'/pain','patient','PATCH',{painScore:5,revision:3})).status,409);
  });
 }finally{await new Promise(resolve=>server.close(resolve));await app.close();}
});
function voice(options={}){
 const instances=[],prompts=[],states=[];class Recognition{constructor(){instances.push(this);}start(){this.onstart?.();}abort(){}hear(text){const result=[{transcript:text}];result.isFinal=true;this.onresult?.({results:[result]});}}
 const listener=createListener({Recognition,onState:s=>states.push(s),onPrompt:(prompt,text,ticket)=>prompts.push({prompt,ticket}),...options});return {listener,instances,prompts,states,hear:text=>instances.at(-1).hear(text)};
}
test('hands-free sends pain before asking, then spoken multilingual score updates that ticket without Send',async()=>{
 for(const answer of ['eight','ocho','आठ','huit']){
  let release,alerts=0;const updates=[],ticket={id:randomUUID(),department:'Nursing',pain:{score:null},priority:2};const x=voice({onPainAlert:async()=>{alerts++;return new Promise(resolve=>release=()=>resolve(ticket));},onPainUpdate:async(received,update)=>{updates.push({received,update});return {...ticket,pain:{score:update.painScore}};}});
  try{x.listener.start();x.hear('Hey Kalinga, I have pain');assert.equal(alerts,1);assert.equal(x.prompts.length,0);release();await tick();assert.equal(x.prompts[0].prompt,'pain_notified');assert.equal(x.prompts[0].ticket.id,ticket.id);x.hear(answer);await tick();assert.equal(updates[0].received.id,ticket.id);assert.equal(updates[0].update.painScore,8);assert.equal(alerts,1);assert.equal(x.prompts.at(-1).prompt,'pain_saved');}finally{x.listener.dispose();}
 }
});
test('skip after notification leaves the request active and says so; failed alert never claims delivery',async()=>{
 let skipped=0;const ticket={id:randomUUID(),department:'Nursing',priority:2,pain:{score:null}};const x=voice({onPainAlert:async()=>ticket,onPainSkip:()=>skipped++});
 try{x.listener.start();x.hear('Hey Kalinga, I have pain');await tick();x.hear('cancel');assert.equal(skipped,1);assert.equal(x.prompts.at(-1).prompt,'pain_skipped');assert.doesNotMatch(promptText({prompt:'pain_skipped'},ticket),/not been sent/);}finally{x.listener.dispose();}
 const failed=voice({onPainAlert:async()=>false});try{failed.listener.start();failed.hear('Hey Kalinga, I have pain');await tick();assert.equal(failed.prompts.length,0);assert.equal(failed.states.at(-1).phase,'wake');}finally{failed.listener.dispose();}
});
test('urgent pain is delivered immediately and never waits for a pain scale; stopped listeners ignore late success',async()=>{
 let alerts=0;const urgent=voice({onPainAlert:async()=>{alerts++;return {priority:1,pain:{score:null}};}});try{urgent.listener.start();urgent.hear('Hey Kalinga, I have chest pain');await tick();assert.equal(alerts,1);assert.equal(urgent.prompts.length,0);}finally{urgent.listener.dispose();}
 let release;const stale=voice({onPainAlert:()=>new Promise(resolve=>release=resolve)});stale.listener.start();stale.hear('Hey Kalinga, I have pain');stale.listener.dispose();release({id:randomUUID(),priority:2,pain:{score:null}});await tick();assert.equal(stale.prompts.length,0);
});
