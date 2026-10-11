'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const {randomUUID}=require('node:crypto');
const routing=require('../routing.js');
const {createApplication}=require('../lib/handler.cjs');

test('patient updates name the routed team and distinguish receipt from actual staff action',()=>{
  const ticket={department:'Food Services',detected_language:'English',patient_summary:routing.readback('en',false),status:'NEW'};
  assert.match(routing.patientMessage(ticket),/sent to Food Services/);
  assert.doesNotMatch(routing.patientMessage(ticket),/has acknowledged/);
  assert.equal(routing.patientMessage(ticket,'ACKNOWLEDGED'),'Food Services has acknowledged your request.');
  assert.equal(routing.patientMessage(ticket,'RESOLVED'),'Food Services has marked your request complete.');
  for(const [language,team] of [['Spanish','alimentación'],['Hindi','भोजन सेवा'],['French','restauration']]) {
    const localized={...ticket,detected_language:language};
    assert.ok(routing.patientMessage(localized,'ACKNOWLEDGED').includes(team));
    assert.doesNotMatch(routing.patientMessage(localized,'ACKNOWLEDGED'),/Food Services/);
  }
  for(const language of Object.values(routing.LANGUAGE_NAMES)) {
    for(const stage of ['NEW','ACKNOWLEDGED','RESOLVED']) assert.ok(routing.patientMessage({...ticket,detected_language:language},stage).length>10);
  }
});

test('voice API reads authorized real lifecycle events and refuses fabricated acknowledgements',async()=>{
  const spoken=[];
  const app=createApplication({filename:':memory:',databaseUrl:'',demoPassword:'test-password',publicDeployment:false,apiKey:'',elevenKey:'test-voice-key',fetch:async(url,options)=>{
    assert.equal(new URL(url).hostname,'api.elevenlabs.io');spoken.push(JSON.parse(options.body).text);
    return new Response(Buffer.from('synthetic-audio'),{headers:{'Content-Type':'audio/mpeg'}});
  }});
  let server;
  try {
    await app.initialize();server=http.createServer(app.handler);
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
    const cookies={};
    async function request(endpoint,role,options={}) {
      return fetch(base+endpoint,{...options,headers:{'Content-Type':'application/json',...(cookies[role]?{Cookie:cookies[role]}:{}),...options.headers}});
    }
    for(const role of ['patient','patient2','dietary','nurse']) {
      const response=await request('/api/login',null,{method:'POST',body:JSON.stringify({email:role+'@kaalinga.demo',password:'test-password'})});
      assert.equal(response.status,200);cookies[role]=response.headers.get('set-cookie').split(';')[0];
    }
    const created=await request('/api/requests','patient',{method:'POST',body:JSON.stringify({text:'Can I get water?',requestKey:randomUUID()})});
    const {ticket}=await created.json();const voice='/api/voice/'+ticket.id;
    assert.equal((await request(voice+'?stage=ACKNOWLEDGED','patient')).status,409);
    assert.equal((await request(voice+'?stage=RESOLVED','patient')).status,409);
    assert.equal((await request(voice+'?stage=unknown','patient')).status,400);
    assert.equal((await request(voice,'patient2')).status,404);
    assert.equal(spoken.length,0);
    const receipt=await request(voice+'?stage=NEW','patient');assert.equal(receipt.status,200);
    assert.equal(spoken.at(-1),ticket.status_message);assert.doesNotMatch(spoken.at(-1),/has acknowledged/);
    for(const [action,stage] of [['acknowledge','ACKNOWLEDGED'],['resolve','RESOLVED']]) {
      const updated=await request('/api/tickets/'+ticket.id,'dietary',{method:'PATCH',body:JSON.stringify({action})});
      assert.equal(updated.status,200);const next=(await updated.json()).ticket;
      assert.equal((await request(voice+'?stage='+stage,'patient')).status,200);
      assert.equal(spoken.at(-1),next.status_message);
      const visible=await (await request('/api/tickets','patient')).json();
      assert.ok(visible.notifications.some(notification=>notification.ticket_id===ticket.id && notification.message===next.status_message));
    }
    // Even after completion, a queued receipt remains a receipt rather than changing its spoken stage.
    assert.equal((await request(voice+'?stage=NEW','patient')).status,200);
    assert.equal(spoken.at(-1),ticket.status_message);
    const hindi=await request('/api/requests','patient',{method:'POST',body:JSON.stringify({text:'मुझे दर्द है और मदद चाहिए।',language:'hi-IN',requestKey:randomUUID()})});
    const hindiTicket=(await hindi.json()).ticket;
    await request('/api/tickets/'+hindiTicket.id,'nurse',{method:'PATCH',body:JSON.stringify({action:'acknowledge'})});
    assert.equal((await request('/api/voice/'+hindiTicket.id+'?stage=ACKNOWLEDGED','patient')).status,200);
    assert.match(spoken.at(-1),/नर्सिंग टीम.*स्वीकार/);
  } finally {
    if(server) await new Promise(resolve=>server.close(resolve));await app.close();
  }
});
