'use strict';
const {test,before,after}=require('node:test');const assert=require('node:assert/strict');const http=require('node:http');const {randomUUID,createHmac}=require('node:crypto');
const {createApplication}=require('../lib/handler.cjs');const {createStore}=require('../lib/store.cjs');
let app,server,base;const cookies={},spoken=[];
async function request(endpoint,role,options={}){
  const response=await fetch(base+endpoint,{...options,headers:{'Content-Type':'application/json',...(cookies[role]?{Cookie:cookies[role]}:{}),...options.headers}});
  return {response,data:/application\/json/.test(response.headers.get('content-type'))?await response.json():await response.arrayBuffer()};
}
const post=(endpoint,role,payload)=>request(endpoint,role,{method:'POST',body:JSON.stringify(payload)});
before(async()=>{
  app=createApplication({filename:':memory:',databaseUrl:'',demoPassword:'test-password',apiKey:'',elevenKey:'test-key',publicDeployment:false,turnUrls:'turns:relay.example:443?transport=tcp',turnSecret:'server-only-secret',fetch:async(url,options)=>{spoken.push(JSON.parse(options.body).text);return new Response(Buffer.from('synthetic-audio'));}});
  await app.initialize();server=http.createServer(app.handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port;
  for(const role of ['patient','patient2','nurse','charge','dietary','coordinator']){const login=await post('/api/login',null,{email:role+'@kaalinga.demo',password:'test-password'});assert.equal(login.response.status,200);cookies[role]=login.response.headers.get('set-cookie').split(';')[0];}
});
after(async()=>{await new Promise(resolve=>server.close(resolve));await app.close();});
async function ticket(role='patient',acknowledge=true,text='I am in pain and need help.'){
  const result=await post('/api/requests',role,{text,requestKey:randomUUID()});assert.equal(result.response.status,201);
  if(acknowledge)assert.equal((await request('/api/tickets/'+result.data.ticket.id,'nurse',{method:'PATCH',body:JSON.stringify({action:'acknowledge'})})).response.status,200);
  return result.data.ticket;
}
async function invite(requestTicket,role='nurse'){return post('/api/calls',role,{ticketId:requestTicket.id});}
const action=(call,role,act)=>post('/api/calls/'+call.id+'/action',role,{action:act});
const signal=(call,role,kind,payload)=>post('/api/calls/'+call.id+'/signals',role,{kind,payload});

test('only on-shift RN/charge nurses offer calls from acknowledged primary nursing requests',async()=>{
  const unacknowledged=await ticket('patient',false);
  assert.equal((await invite(unacknowledged)).response.status,409);
  for(const role of ['patient','dietary','coordinator'])assert.equal((await invite(unacknowledged,role)).response.status,403);
  const food=(await post('/api/requests','patient',{text:'Can I get water?',requestKey:randomUUID()})).data.ticket;
  assert.equal((await invite(food)).response.status,404);
  assert.equal((await post('/api/calls','nurse',{ticketId:'missing'})).response.status,404);
  const acknowledged=await ticket();
  await request('/api/roster/nurse','coordinator',{method:'PATCH',body:JSON.stringify({on_shift:false})});
  assert.equal((await invite(acknowledged)).response.status,403);
  await request('/api/roster/nurse','coordinator',{method:'PATCH',body:JSON.stringify({on_shift:true})});
});
test('invitation and signaling are visible only to the two participants, including against coordinator access',async()=>{
  const created=await invite(await ticket());assert.equal(created.response.status,201);const call=created.data.call;
  try{
    assert.equal(call.status,'RINGING');assert.match(call.invitation_message,/camera stays off/);
    for(const role of ['patient2','charge','coordinator','dietary']){
      assert.equal((await request('/api/calls/'+call.id+'/signals',role)).response.status,404);
      assert.equal((await action(call,role,'end')).response.status,404);
      assert.ok(!(await request('/api/calls',role)).data.calls.some(item=>item.id===call.id));
    }
    assert.equal((await action(call,'nurse','accept')).response.status,403);
    assert.equal((await action(call,'nurse','connected')).response.status,409);
    assert.equal((await signal(call,'nurse','offer',{type:'offer',sdp:'v=0\r\n'})).response.status,409);
  }finally{await action(call,'nurse','end');}
});
test('decline or ending a call never completes or cancels the care request',async()=>{
  const care=await ticket();const call=(await invite(care)).data.call;
  const declined=await action(call,'patient','decline');assert.equal(declined.data.call.status,'DECLINED');
  assert.equal((await action(call,'patient','accept')).data.call.status,'DECLINED');
  const careStatus=(await request('/api/tickets','patient')).data.tickets.find(item=>item.id===care.id);
  assert.equal(careStatus.status,'ACKNOWLEDGED');assert.equal(careStatus.resolved_at,null);
});
test('accepted calls exchange directional SDP and ICE, reject wrong roles and erase signals on end',async()=>{
  const call=(await invite(await ticket())).data.call;
  try{
    const accepted=await action(call,'patient','accept');assert.equal(accepted.data.call.status,'ACCEPTED');assert.ok(accepted.data.call.consent_at);
    assert.equal((await signal(call,'patient','offer',{type:'offer',sdp:'v=0\r\n'})).response.status,403);
    assert.equal((await signal(call,'nurse','answer',{type:'answer',sdp:'v=0\r\n'})).response.status,403);
    assert.equal((await signal(call,'nurse','offer',{type:'answer',sdp:'v=0\r\n'})).response.status,400);
    assert.equal((await signal(call,'nurse','candidate',{candidate:7})).response.status,400);
    assert.equal((await signal(call,'nurse','offer',{type:'offer',sdp:'v=0\r\n'})).response.status,200);
    assert.equal((await signal(call,'patient','answer',{type:'answer',sdp:'v=0\r\n'})).response.status,200);
    assert.equal((await signal(call,'nurse','candidate',{candidate:'candidate:synthetic',sdpMid:'0',sdpMLineIndex:0})).response.status,200);
    const patientSignals=(await request('/api/calls/'+call.id+'/signals','patient')).data;
    assert.equal(patientSignals.relayOnly,true);
    const credential=patientSignals.iceServers[0];
    assert.equal(credential.urls[0],'turns:relay.example:443?transport=tcp');
    assert.ok(credential.username.endsWith(':'+call.patient_id+':'+call.id));
    const expiry=Number(credential.username.split(':')[0]);
    assert.ok(expiry>Date.now()/1000+1700&&expiry<Date.now()/1000+1801);
    assert.equal(credential.credential,createHmac('sha1','server-only-secret').update(credential.username).digest('base64'));
    assert.ok(!JSON.stringify((await request('/api/config','patient')).data).includes('server-only-secret'));
    assert.deepEqual(patientSignals.signals.map(item=>item.kind).sort(),['candidate','offer']);
    assert.equal((await request('/api/calls/'+call.id+'/signals','nurse')).data.signals[0].kind,'answer');
    assert.equal((await signal(call,'nurse','offer',{type:'offer',sdp:'v=0\r\n'})).response.status,409);
    assert.equal((await action(call,'patient','connected')).data.call.status,'CONNECTED');
    assert.equal((await action(call,'nurse','end')).data.call.status,'ENDED');
    assert.equal((await signal(call,'nurse','candidate',{candidate:'candidate:late'})).response.status,409);
    assert.equal((await request('/api/calls/'+call.id+'/signals','patient')).data.signals.length,0);
    assert.equal((await app.store.query('SELECT id FROM video_signals WHERE call_id = ?',[call.id])).rows.length,0);
  }finally{await action(call,'nurse','end');}
});
test('one active call per nurse/patient prevents conflicting invitations',async()=>{
  const care=await ticket();const other=await ticket('patient2');const call=(await invite(care)).data.call;
  try{assert.equal((await invite(care,'charge')).response.status,409);assert.equal((await invite(other)).response.status,409);}
  finally{await action(call,'nurse','end');}
  const next=await invite(other);assert.equal(next.response.status,201);await action(next.data.call,'nurse','end');
});
test('expired invitations cannot be revived and nurse availability is rechecked on acceptance',async()=>{
  const care=await ticket();const call=(await invite(care)).data.call;
  await request('/api/roster/nurse','coordinator',{method:'PATCH',body:JSON.stringify({on_shift:false})});
  assert.equal((await action(call,'patient','accept')).response.status,409);
  await request('/api/roster/nurse','coordinator',{method:'PATCH',body:JSON.stringify({on_shift:true})});
  await app.store.query('UPDATE video_calls SET expires_at = ? WHERE id = ?',[new Date(Date.now()-1000).toISOString(),call.id]);
  assert.equal((await action(call,'patient','accept')).data.call.status,'EXPIRED');
  assert.equal((await request('/api/calls/'+call.id+'/voice','patient')).response.status,409);
});
test('spoken invitations are patient-specific, localized, and never expose another patient call',async()=>{
  const call=(await invite(await ticket('patient',true,'मुझे दर्द है और मदद चाहिए।'))).data.call;
  try{
    assert.equal((await request('/api/calls/'+call.id+'/voice','patient2')).response.status,404);
    assert.equal((await request('/api/calls/'+call.id+'/voice','patient')).response.status,200);
    assert.match(spoken.at(-1),/वीडियो कॉल स्वीकार/);
  }finally{await action(call,'nurse','end');}
});
test('public hosting disables video without relay configuration and keeps TURN shared secrets out of public config',async()=>{
  const store=createStore({filename:':memory:'});
  const publicApp=createApplication({store,databaseUrl:'postgres://test-config-only',demoPassword:'test-password',publicDeployment:true,apiKey:'',elevenKey:'',turnUrls:'',turnSecret:''});
  const localServer=http.createServer(publicApp.handler);await publicApp.initialize();await new Promise(resolve=>localServer.listen(0,'127.0.0.1',resolve));
  try{const config=await (await fetch('http://127.0.0.1:'+localServer.address().port+'/api/config')).json();assert.equal(config.videoConfigured,false);}
  finally{await new Promise(resolve=>localServer.close(resolve));await publicApp.close();}
  const {createVideoCalls}=require('../lib/video-calls.cjs');
  const relay=createVideoCalls({store:{},publicDeployment:true,readVoice:()=>{},turnUrls:'turns:relay.example:443?transport=tcp',turnSecret:'server-only-secret'});
  assert.equal(relay.available,true);assert.equal(relay.network,'relay');
});
