'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const {randomUUID}=require('node:crypto');
const routing=require('../routing.js');
const {createApplication}=require('../lib/handler.cjs');

for(const text of [
  'I need water but my speech is slurred.', 'My face is drooping and I need a blanket.',
  'One side of my body is numb.', 'My arm is weak on one side.',
  'I have heavy bleeding.', "The bleeding won't stop.", 'My lips have turned blue.',
  'I cant get air.', 'I took an overdose.', 'I want to hurt myself.',
  'No puedo respirar, necesito agua.', 'मुझे साँस लेने में कठिनाई है और पानी चाहिए।',
  'Je ne peux pas respirer et je veux de l’eau.'
])test('emergency bypasses inference: '+text,async()=>{
  let calls=0;
  const result=await routing.classifyRequest(text,{}, {classify:async()=>{calls++;throw new Error('Unavailable provider');}});
  assert.equal(result.priority,1);assert.equal(result.department,'Nursing');
  assert.equal(result.source,'safety_rule');assert.equal(calls,0);
  assert.ok(!result.additional_requests.some(task=>task.department==='Bedside Care'));
});

async function fixture(run) {
  let modelCalls=0;const spoken=[];
  const app=createApplication({filename:':memory:',databaseUrl:'',publicDeployment:false,demoPassword:'test-password',
    aiProvider:'bedrock',voiceInputProvider:'browser',bedrockClient:{send:async()=>{modelCalls++;throw new Error('Provider unavailable');}},
    elevenKey:'synthetic-key',fetch:async(url,options)=>{spoken.push(JSON.parse(options.body).text);return new Response('synthetic-audio');}});
  await app.initialize();const server=http.createServer(app.handler);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;const cookies={};
  async function request(path,role,method='GET',data) {
    const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(cookies[role]?{Cookie:cookies[role]}:{})},...(data?{body:JSON.stringify(data)}:{})});
    return {status:response.status,data:response.headers.get('content-type')?.includes('json')?await response.json():await response.text()};
  }
  try {
    for(const role of ['patient','patient2','nurse','charge','manager','coordinator','physician','resident','fellow','app','dietary','housekeeping','bedside']) {
      const response=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:role+'@kaalinga.demo',password:'test-password'})});
      assert.equal(response.status,200);cookies[role]=response.headers.get('set-cookie').split(';')[0];
    }
    await run({app,request,spoken,modelCalls:()=>modelCalls});
  }finally{await new Promise(resolve=>server.close(resolve));await app.close();}
}

test('P1 creates immediate independent Nursing and Medical tasks, private services and one alert per eligible recipient',()=>fixture(async({app,request,modelCalls,spoken})=>{
  await app.store.query('UPDATE staffing SET on_shift = 0 WHERE user_id IN (?, ?)',['physician','fellow']);
  await app.store.query('UPDATE staffing SET competencies = ? WHERE user_id = ?',['[]','app']);
  const payload={text:'I have chest pain, need water and a blanket and help going to the bathroom.',painScore:2,requestKey:randomUUID()};
  const creates=await Promise.all([request('/api/requests','patient','POST',payload),request('/api/requests','patient','POST',payload)]);
  assert.equal(creates[0].data.ticket.id,creates[1].data.ticket.id);assert.equal(modelCalls(),0);
  const {ticket:parent,tickets}=creates[0].data;assert.equal(tickets.length,4);
  const medical=tickets.find(item=>item.department==='Medical Team');
  assert.equal(parent.priority,1);assert.equal(medical.priority,1);assert.equal(medical.is_clinical,true);
  assert.equal(medical.source,'clinical_escalation');assert.equal(medical.parent_id,parent.id);
  assert.equal(medical.created_at,parent.created_at);assert.equal(medical.pain.score,2);
  assert.ok(medical.intents.every(intent=>intent.department==='Medical Team'));
  assert.deepEqual(new Set(tickets.map(item=>item.department)),new Set(['Nursing','Medical Team','Food Services','Environmental Services']));
  assert.match(parent.status_message,/Nursing.*Medical Team/);assert.doesNotMatch(parent.status_message,/has acknowledged/);
  await request('/api/voice/'+parent.id+'?stage=NEW','patient');
  assert.match(spoken.at(-1),/Urgent request received/);
  assert.match(spoken.at(-1),/Nursing.*Medical Team/);
  assert.match(spoken.at(-1),/bedside call bell/);
  assert.match(spoken.at(-1),/Food Services/);
  for(const [role,id] of [['nurse',parent.id],['resident',medical.id],['dietary',tickets.find(t=>t.department==='Food Services').id],['housekeeping',tickets.find(t=>t.department==='Environmental Services').id]]) {
    const result=(await request('/api/tickets',role)).data;
    assert.equal(result.tickets.length,1);assert.equal(result.tickets[0].id,id);
    assert.equal(result.notifications.filter(item=>item.ticket_id===id).length,1);
    if(['dietary','housekeeping'].includes(role)) {
      assert.equal(result.tickets[0].pain,null);
      assert.doesNotMatch(JSON.stringify(result),/chest|2\/10|Medical Team/i);
    }
  }
  for(const role of ['physician','fellow','app','bedside','patient2'])assert.equal((await request('/api/tickets',role)).data.notifications.length,0);
  for(const role of ['nurse','charge','resident'])assert.ok((await request('/api/tickets',role)).data.notifications.some(n=>n.message.startsWith('Urgent')));
  assert.equal((await request('/api/tickets/'+parent.id,'resident','PATCH',{action:'acknowledge'})).status,404);
  assert.equal((await request('/api/tickets/'+medical.id,'nurse','PATCH',{action:'acknowledge'})).status,404);
  assert.equal((await request('/api/tickets/'+medical.id,'app','PATCH',{action:'acknowledge'})).status,403);
  const referral=await request('/api/tickets/'+parent.id+'/referrals','nurse','POST',{department:'Medical Team',note:'Please assess.'});
  assert.equal(referral.data.ticket.id,medical.id);
  await app.store.query('UPDATE tickets SET created_at = ? WHERE id IN (?, ?)',[new Date(Date.now()-60000).toISOString(),parent.id,medical.id]);
  await request('/api/tickets','charge');await request('/api/tickets','charge');
  const overdue=(await app.store.query("SELECT * FROM audit WHERE action = 'ESCALATED'")).rows;
  assert.equal(overdue.length,2);assert.deepEqual(new Set(overdue.map(row=>row.ticket_id)),new Set([parent.id,medical.id]));
  await request('/api/tickets/'+medical.id,'resident','PATCH',{action:'acknowledge'});
  const history=(await request('/api/tickets','patient')).data;
  assert.equal(history.tickets.find(t=>t.id===parent.id).status,'NEW');
  assert.equal(history.tickets.find(t=>t.id===parent.id).related_tasks.find(t=>t.id===medical.id).status,'ACKNOWLEDGED');
  await request('/api/voice/'+medical.id,'patient');assert.match(spoken.at(-1),/Medical Team has acknowledged/);
  assert.doesNotMatch(spoken.at(-1),/Nursing has acknowledged/);
  const count=(await app.store.query('SELECT COUNT(*) AS total FROM tickets')).rows[0].total;assert.equal(count,4);
}));

test('missing medical coverage leaves a visible emergency task and alerts unit leadership; returning coverage is notified',()=>fixture(async({app,request})=>{
  await app.store.query("UPDATE staffing SET on_shift = 0 WHERE user_id IN ('physician','resident','fellow','app')");
  const created=await request('/api/requests','patient','POST',{text:'I cannot breathe.',requestKey:randomUUID()});
  const medical=created.data.tickets.find(t=>t.department==='Medical Team');assert.ok(medical);
  for(const role of ['charge','manager','coordinator']) {
    const alerts=(await request('/api/tickets',role)).data.notifications;
    assert.ok(alerts.some(n=>n.ticket_id===medical.id&&n.message.includes('No eligible on-shift responder')));
  }
  assert.equal((await request('/api/tickets','physician')).data.tickets[0].canAct,false);
  assert.equal((await request('/api/tickets/'+medical.id,'physician','PATCH',{action:'acknowledge'})).status,403);
  assert.equal((await request('/api/roster/physician','charge','PATCH',{on_shift:true})).status,200);
  const physician=(await request('/api/tickets','physician')).data;
  assert.ok(physician.notifications.some(n=>n.ticket_id===medical.id));assert.equal(physician.tickets[0].canAct,true);
}));

test('P2 pain or medication and model failures stay in Nursing; ordinary service requests do not create physician alerts',()=>fixture(async({request,modelCalls})=>{
  for(const text of ['My leg hurts, pain 10/10.','I need some meds.','Something is wrong.','Can I have water?']) {
    const created=await request('/api/requests','patient','POST',{text,requestKey:randomUUID()});assert.equal(created.status,201);
    assert.ok(!created.data.tickets.some(t=>t.department==='Medical Team'));
    if(text!=='Can I have water?')assert.equal(created.data.ticket.department,'Nursing');
  }
  assert.equal(modelCalls(),2);
  assert.equal((await request('/api/tickets','physician')).data.notifications.length,0);
}));

test('urgent button and multilingual emergencies notify the medical team with localized truthful receipts',()=>fixture(async({request,modelCalls})=>{
  for(const [text,language,extra,team] of [
    ['Please help.','en-US',{forceClinical:true},'Medical Team'],
    ['No puedo respirar.','es-ES',{},'equipo médico'],
    ['मुझे साँस नहीं आ रही।','hi-IN',{},'चिकित्सा टीम'],
    ['Je ne peux pas respirer.','fr-FR',{},'équipe médicale']
  ]) {
    const response=await request('/api/requests','patient','POST',{text,language,...extra,requestKey:randomUUID()});
    assert.equal(response.status,201);assert.equal(response.data.tickets.length,2);
    assert.ok(response.data.ticket.status_message.includes(team));
    assert.ok(response.data.tickets.every(t=>t.status==='NEW'&&t.priority===1));
  }
  assert.equal(modelCalls(),0);
}));
