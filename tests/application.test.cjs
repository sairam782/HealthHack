'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {createApplication}=require('../lib/handler.cjs');
let app,server,url;
const sessions={};
async function request(endpoint,role=null,options={}) {
  const response=await fetch(url+endpoint,{...options,headers:{'Content-Type':'application/json',...(role?{Cookie:sessions[role]}:{}),...options.headers}});
  return {response,data:await response.json()};
}
async function login(role,email=role+'@kaalinga.demo') {
  const {response,data}=await request('/api/login',null,{method:'POST',body:JSON.stringify({email,password:'test-password'})});
  assert.equal(response.status,200); sessions[role]=response.headers.get('set-cookie').split(';')[0]; return data.user;
}
before(async()=>{
  app=createApplication({filename:':memory:',apiKey:'',elevenKey:'',demoPassword:'test-password',publicDeployment:false});
  await app.initialize(); server=http.createServer(app.handler);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve)); url='http://127.0.0.1:'+server.address().port;
  for(const role of ['patient','patient2','nurse','housekeeping','dietary','coordinator']) await login(role);
});
after(async()=>{await new Promise(resolve=>server.close(resolve));await app.close();});
async function create(text,role='patient',key=randomUUID(),extra={}) {
  return request('/api/requests',role,{method:'POST',body:JSON.stringify({text,requestKey:key,...extra})});
}
test('anonymous users cannot read tickets',async()=>{
  const result=await request('/api/tickets'); assert.equal(result.response.status,401);
});
test('keys are never returned in public configuration',async()=>{
  const {data}=await request('/api/config'); assert.equal(data.storage,'sqlite'); assert.ok(!JSON.stringify(data).includes('test-password')); assert.ok(!('apiKey' in data));
});
test('login returns JSON for incorrect credentials and malformed input',async()=>{
  for (const [body,status] of [[JSON.stringify({email:'clerk@kaalinga.demo',password:'wrong-password'}),401],['{',400],['null',400],[JSON.stringify({email:'clerk@kaalinga.demo'}),400]]) {
    const result=await request('/api/login',null,{method:'POST',body});
    assert.equal(result.response.status,status); assert.match(result.response.headers.get('content-type'),/application\/json/);
    assert.equal(typeof result.data.error,'string');
  }
});
test('water reaches dietary and excludes nursing and other patients',async()=>{
  const created=await create('Can I get water?'); assert.equal(created.response.status,201);
  const id=created.data.ticket.id;
  assert.equal(created.data.ticket.department,'Food Services');
  for(const [role,visible] of [['dietary',true],['coordinator',true],['patient',true],['nurse',false],['housekeeping',false],['patient2',false]]) {
    const {data}=await request('/api/tickets',role); assert.equal(data.tickets.some(t=>t.id===id),visible,role);
    if(role==='dietary') assert.ok(data.notifications.some(n=>n.ticket_id===id));
    if(role==='nurse') assert.ok(!data.notifications.some(n=>n.ticket_id===id));
  }
});
test('mixed urgent request creates separate task with no clinical text for dietary',async()=>{
  const {data}=await create('I need water, I am choking'); const id=data.ticket.id;
  assert.equal(data.ticket.priority,1); assert.equal(data.ticket.department,'Nursing');
  const nursing=(await request('/api/tickets','nurse')).data;
  assert.ok(nursing.tickets.some(t=>t.id===id)); assert.ok(nursing.notifications.some(n=>n.ticket_id===id));
  const dietary=(await request('/api/tickets','dietary')).data;
  const secondary=dietary.tickets.find(t=>t.parent_id===id);
  assert.ok(secondary); assert.doesNotMatch(secondary.original_text,/chok/i); assert.equal(secondary.is_clinical,false);
});
test('staff may update only their department, patients cannot update',async()=>{
  const {data}=await create('I need a pillow');
  for(const role of ['nurse','patient']) {
    const result=await request('/api/tickets/'+data.ticket.id,role,{method:'PATCH',body:JSON.stringify({action:'acknowledge'})});
    assert.ok([403,404].includes(result.response.status));
  }
  const ok=await request('/api/tickets/'+data.ticket.id,'housekeeping',{method:'PATCH',body:JSON.stringify({action:'acknowledge'})});
  assert.equal(ok.response.status,200); assert.equal(ok.data.ticket.status,'ACKNOWLEDGED');
});
test('patient is notified on acknowledgement and completion, state survives polling',async()=>{
  const {data}=await create('Can I get another pillow?'); const id=data.ticket.id;
  const premature=await request('/api/tickets/'+id,'housekeeping',{method:'PATCH',body:JSON.stringify({action:'resolve'})}); assert.equal(premature.response.status,409);
  for(const action of ['acknowledge','resolve']) {
    const result=await request('/api/tickets/'+id,'housekeeping',{method:'PATCH',body:JSON.stringify({action})}); assert.equal(result.response.status,200);
  }
  const patient=(await request('/api/tickets','patient')).data;
  assert.equal(patient.tickets.find(t=>t.id===id).status,'RESOLVED');
  assert.ok(patient.notifications.some(n=>n.ticket_id===id&&n.message.includes('acknowledged')));
  assert.ok(patient.notifications.some(n=>n.ticket_id===id&&n.message.includes('complete')));
});
test('retry identifiers prevent duplicate requests, including concurrent retries',async()=>{
  const key=randomUUID(); const results=await Promise.all([create('Can I get water?','patient',key),create('Can I get water?','patient',key)]);
  assert.equal(results[0].data.ticket.id,results[1].data.ticket.id);
  const all=(await request('/api/tickets','patient')).data;
  assert.equal(all.tickets.filter(t=>t.id===results[0].data.ticket.id).length,1);
});
test('patient identity and room come from authentication, not submitted fields',async()=>{
  const result=await create('Can I have water?','patient',randomUUID(),{patient_id:'patient-413',room:'RM 999',forceClinical:false});
  assert.equal(result.data.ticket.patient_id,'patient-412'); assert.equal(result.data.ticket.room,'RM 412-B');
});
test('staff cannot submit patient requests',async()=>{
  const result=await create('water','nurse'); assert.equal(result.response.status,403);
});
test('cross-site modifications are rejected',async()=>{
  const result=await request('/api/requests','patient',{method:'POST',headers:{Origin:'https://other.example'},body:JSON.stringify({text:'water',requestKey:randomUUID()})}); assert.equal(result.response.status,403);
});
test('invalid request bodies are rejected',async()=>{
  const empty=await create(' '); assert.equal(empty.response.status,400);
  const big=await create('x'.repeat(2001)); assert.equal(big.response.status,400);
  const badKey=await create('water','patient','bad'); assert.equal(badKey.response.status,400);
  const nullBody=await request('/api/requests','patient',{method:'POST',body:'null'}); assert.equal(nullBody.response.status,400);
});
test('notifications can be marked read only for the authenticated account',async()=>{
  const before=(await request('/api/tickets','dietary')).data.notifications.filter(n=>!n.read_at).length;
  assert.ok(before>0);
  await request('/api/notifications/read','dietary',{method:'POST',body:'{}'});
  assert.equal((await request('/api/tickets','dietary')).data.notifications.filter(n=>!n.read_at).length,0);
});
test('logout invalidates the server-side session',async()=>{
  await login('temporary','patient2@kaalinga.demo');
  await request('/api/logout','temporary',{method:'POST',body:'{}'});
  assert.equal((await request('/api/me','temporary')).response.status,401);
});
test('public hosting refuses to use ephemeral local storage or a default password',()=>{
  assert.throws(()=>createApplication({publicDeployment:true,databaseUrl:'',demoPassword:null}),/DATABASE_URL/);
});
test('tickets and accounts survive a backend restart',async()=>{
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'kaalinga-test-'));
  const filename=path.join(folder,'store.sqlite');
  let application=createApplication({filename,apiKey:'',elevenKey:'',demoPassword:'test-password'});
  await application.initialize();
  await application.store.query('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',['persistent-test','patient-412','2099-01-01T00:00:00.000Z']);
  await application.store.query("INSERT INTO tickets (id,patient_id,room,original_text,summary,tier,priority,department,responder,is_clinical,confidence,reasoning,patient_summary,detected_language,source,safety_flags,created_at,classification_ms,request_key) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",['persistent-ticket','patient-412','RM 412-B','water','Water request','envops',4,'Food Services','Dietary Staff',0,null,'Rules','Received','English','rules','[]',new Date().toISOString(),1,'persistent-key']);
  await application.close();
  application=createApplication({filename,apiKey:'',elevenKey:'',demoPassword:'test-password'});
  await application.initialize();
  const result=await application.store.query('SELECT user_id FROM sessions WHERE id = ?',['persistent-test']); assert.equal(result.rows[0].user_id,'patient-412');
  const ticket=await application.store.query('SELECT department FROM tickets WHERE id = ?',['persistent-ticket']); assert.equal(ticket.rows[0].department,'Food Services');
  await application.close(); fs.rmSync(folder,{recursive:true,force:true});
});
