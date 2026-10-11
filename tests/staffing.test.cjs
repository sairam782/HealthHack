'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const {randomUUID}=require('node:crypto');
const {createApplication}=require('../lib/handler.cjs');
const roles=require('../lib/roles.cjs');
const auth=require('../lib/auth.cjs');
const routing=require('../routing.js');
let app,server,url;
const cookies={};
async function request(endpoint,role,method='GET',payload) {
  const response=await fetch(url+endpoint,{method,headers:{'Content-Type':'application/json',...(role?{Cookie:cookies[role]}:{})},...(payload?{body:JSON.stringify(payload)}:{})});
  return {status:response.status,data:await response.json()};
}
const create=text=>request('/api/requests','patient','POST',{text,requestKey:randomUUID()});
const act=(ticket,role)=>request('/api/tickets/'+ticket.id,role,'PATCH',{action:'acknowledge'});
const shift=(role,on_shift)=>request('/api/roster/'+role,'charge','PATCH',{on_shift});
const refer=(ticket,role,department,note='Please review the requested service.')=>request('/api/tickets/'+ticket.id+'/referrals',role,'POST',{department,note});
before(async()=>{
  app=createApplication({filename:':memory:',demoPassword:'test-password',apiKey:'',elevenKey:'',publicDeployment:false});
  await app.initialize();server=http.createServer(app.handler);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));url='http://127.0.0.1:'+server.address().port;
  for(const id of ['patient','nurse','bedside','assistant','charge','manager','coordinator','dietary','observer','respiratory','physician','pt','ot','specialist','interpreter']) {
    const login=await fetch(url+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:id+'@kaalinga.demo',password:'test-password'})});
    assert.equal(login.status,200);cookies[id]=login.headers.get('set-cookie').split(';')[0];
  }
});
after(async()=>{await new Promise(resolve=>server.close(resolve));await app.close();});
test('role directory covers the supplied hospital roles and four routing groups',async()=>{
  const config=(await request('/api/config')).data;
  assert.equal(config.staffRoles.length,30);assert.equal(config.accounts.length,38);
  assert.equal(new Set(config.staffRoles.map(role=>role.group)).size,4);
  for(const id of ['charge','manager','physician','resident','fellow','app','respiratory','transport','observer','pt','ot','slp','pharmacist','dietitian','case-manager','social-worker','wound','advocate','interpreter','chaplain','infection']) assert.ok(config.staffRoles.some(role=>role.id===id),id);
});
test('roster requires staff access and shift changes require leadership',async()=>{
  assert.equal((await request('/api/roster','patient')).status,403);
  assert.equal((await request('/api/roster','dietary')).data.canManage,false);
  assert.equal((await request('/api/roster/nurse','dietary','PATCH',{on_shift:false})).status,403);
  assert.equal((await request('/api/roster','manager')).data.canManage,true);
});
test('clinical symptoms remain with nursing instead of physician or RT queues',async()=>{
  const {data}=await create('I cannot breathe and need help.');
  assert.equal(data.ticket.department,'Nursing');assert.equal(data.ticket.priority,1);
  for(const id of ['respiratory','physician']) {
    const result=(await request('/api/tickets',id)).data;
    assert.ok(!result.tickets.some(ticket=>ticket.id===data.ticket.id));
    assert.ok(!result.notifications.some(alert=>alert.ticket_id===data.ticket.id));
  }
  const charge=(await request('/api/tickets','charge')).data;
  assert.ok(charge.notifications.some(alert=>alert.ticket_id===data.ticket.id));
});
test('PCT and nursing assistant can accept bedside work; observer cannot',async()=>{
  const {data}=await create('I need help getting to the bathroom.');
  assert.equal(data.ticket.department,'Bedside Care');
  for(const id of ['bedside','assistant']) assert.ok((await request('/api/tickets',id)).data.notifications.some(alert=>alert.ticket_id===data.ticket.id));
  assert.equal((await act(data.ticket,'observer')).status,403);
  assert.equal((await act(data.ticket,'assistant')).status,200);
});
test('manager monitors the unit without accepting clinical work',async()=>{
  const {data}=await create('My chest hurts.');
  assert.ok((await request('/api/tickets','manager')).data.tickets.some(ticket=>ticket.id===data.ticket.id));
  assert.equal((await act(data.ticket,'manager')).status,403);
});
test('off-shift responder gets no new task alert and cannot accept; leadership receives coverage alert',async()=>{
  await shift('dietary',false);
  const {data}=await create('Can I have water?');
  const alerts=(await request('/api/tickets','dietary')).data.notifications;
  assert.ok(!alerts.some(alert=>alert.ticket_id===data.ticket.id));
  assert.equal((await act(data.ticket,'dietary')).status,403);
  for(const leader of ['charge','manager']) assert.ok((await request('/api/tickets',leader)).data.notifications.some(alert=>alert.ticket_id===data.ticket.id&&alert.message.includes('No eligible')));
  await shift('dietary',true);
  let assigned=(await request('/api/tickets','dietary')).data.notifications.filter(alert=>alert.ticket_id===data.ticket.id);
  assert.equal(assigned.length,1);
  await shift('dietary',true);
  assigned=(await request('/api/tickets','dietary')).data.notifications.filter(alert=>alert.ticket_id===data.ticket.id);
  assert.equal(assigned.length,1);assert.equal((await act(data.ticket,'dietary')).status,200);
});
test('role title alone cannot authorize work without the configured competency',async()=>{
  const {data}=await create('I feel dizzy.');
  await app.store.query('UPDATE staffing SET competencies = ? WHERE user_id = ?',['[]','nurse']);
  assert.equal((await act(data.ticket,'nurse')).status,403);
  assert.equal((await refer(data.ticket,'nurse','Medical Team')).status,403);
  await app.store.query('UPDATE staffing SET competencies = ? WHERE user_id = ?',[JSON.stringify(['Nursing']),'nurse']);
});
test('RN arranges targeted RT referral without removing primary nursing responsibility',async()=>{
  const parent=(await create('I cannot breathe.')).data.ticket;
  const result=await refer(parent,'nurse','Respiratory Therapy','Please review respiratory equipment with the bedside nurse.');
  assert.equal(result.status,201);assert.equal(result.data.ticket.source,'staff_referral');assert.equal(result.data.ticket.parent_id,parent.id);
  const rt=(await request('/api/tickets','respiratory')).data;
  assert.ok(rt.tickets.some(ticket=>ticket.id===result.data.ticket.id));assert.ok(rt.notifications.some(alert=>alert.ticket_id===result.data.ticket.id));
  assert.equal((await act(parent,'respiratory')).status,404);
  assert.equal((await act(result.data.ticket,'respiratory')).status,200);
  const nursing=(await request('/api/tickets','nurse')).data.tickets.find(ticket=>ticket.id===parent.id);
  assert.equal(nursing.status,'NEW');assert.ok(nursing.referrals.some(item=>item.department==='Respiratory Therapy'&&item.status==='ACKNOWLEDGED'));
  const patient=(await request('/api/tickets','patient')).data;
  assert.ok(patient.notifications.some(alert=>alert.message.includes('Respiratory Therapy')));
});
test('patients and nonclinical coordinators cannot initiate clinical consultations',async()=>{
  const parent=(await create('Can you send an interpreter?')).data.ticket;
  assert.equal((await refer(parent,'patient','Language Services')).status,403);
  assert.equal((await refer(parent,'specialist','Pharmacy')).status,403);
  assert.equal((await refer(parent,'coordinator','Respiratory Therapy')).status,403);
  assert.equal((await refer(parent,'specialist','Language Services','Please arrange an ASL interpreter.')).status,201);
});
test('consultation queues are separate, and duplicate referrals produce one task',async()=>{
  const parent=(await create('I need help getting to the bathroom.')).data.ticket;
  await act(parent,'bedside');
  // The RN can arrange consultations only for nursing requests in its scope.
  const clinical=(await create('My leg hurts.')).data.ticket;
  const requests=await Promise.all([refer(clinical,'nurse','Physical Therapy'),refer(clinical,'nurse','Physical Therapy')]);
  assert.equal(requests[0].data.ticket.id,requests[1].data.ticket.id);
  const id=requests[0].data.ticket.id;
  assert.ok((await request('/api/tickets','pt')).data.tickets.some(ticket=>ticket.id===id));
  assert.ok(!(await request('/api/tickets','ot')).data.tickets.some(ticket=>ticket.id===id));
  assert.equal((await act(requests[0].data.ticket,'ot')).status,404);
});
test('overdue nursing requests notify charge nurse and manager once, with an audit event',async()=>{
  const ticket=(await create('My chest hurts.')).data.ticket;
  await app.store.query('UPDATE tickets SET created_at = ? WHERE id = ?',[new Date(Date.now()-180000).toISOString(),ticket.id]);
  await request('/api/tickets','patient');await request('/api/tickets','patient');
  for(const leader of ['charge','manager']) {
    const alerts=(await request('/api/tickets',leader)).data.notifications.filter(alert=>alert.ticket_id===ticket.id&&alert.message.startsWith('Overdue'));
    assert.equal(alerts.length,1);
  }
  const audit=await app.store.query("SELECT * FROM audit WHERE ticket_id = ? AND action = 'ESCALATED'",[ticket.id]);assert.equal(audit.rows.length,1);
});
test('persisted shift state is not overwritten by account seeding',async()=>{
  await shift('dietary',false);await auth.seedUsers(app.store,'test-password');
  assert.equal((await request('/api/roster','manager')).data.roster.find(member=>member.id==='dietary').on_shift,false);
  await shift('dietary',true);
});
test('transport coordination is distinct from ordinary bedside assistance',()=>{
  assert.equal(routing.classifyLocal('I need transport coordination please.').department,'Patient Transport');
  assert.equal(routing.classifyLocal('I need help getting to the bathroom.').department,'Bedside Care');
  assert.equal(routing.classifyLocal('I need transport and cannot breathe.').department,'Nursing');
});
