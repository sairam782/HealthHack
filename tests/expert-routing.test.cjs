'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createExpertRouter,createSetFitExpert,SETFIT_LABELS}=require('../lib/expert-routing.cjs');
const routing=require('../routing.js');
const value=(kind='drink',evidence='sip')=>({priority:kind==='toileting'?3:4,department:routing.INTENT_DEPARTMENTS[kind],summary:kind==='drink'?'Water requested':'Bathroom assistance requested',patient_summary:'Received',detected_language:'English',confidence:0.95,reasoning:'Exact need',intents:[{kind,department:routing.INTENT_DEPARTMENTS[kind],summary:kind==='drink'?'Water requested':'Bathroom assistance requested',evidence:[evidence]}]});
const expert=(provider,response,model=provider+'-model')=>({provider,model,config:{classify:async()=>typeof response==='function'?response():response}});
test('emergency, pain, medication, restrictions and explicit urgent requests call neither expert',async()=>{
 let calls=0;const bad=()=>{calls++;throw new Error('must bypass');};const router=createExpertRouter({mode:'ensemble',primary:expert('bedrock',bad),secondary:expert('groq',bad)});
 for(const [text,options] of [['I cannot breathe and want water',{}],['pain 8/10',{}],['I need meds and water',{}],['I am NPO and want water',{}],['help',{forceClinical:true}]]){
  const result=await router.classify(text,options);assert.equal(result.source,'safety_rule');assert.deepEqual(result.model_reviews,[]);assert.ok(result.routing_checks.includes('experts_bypassed_for_safety'));
 }assert.equal(calls,0);
});
test('two experts run concurrently and record guarded route agreement',async()=>{
 const pending=[];const slow=()=>new Promise(resolve=>pending.push(resolve));const router=createExpertRouter({mode:'ensemble',primary:expert('bedrock',slow),secondary:expert('groq',slow)});
 const result=router.classify('Could somebody bring me a sip?');await new Promise(resolve=>setImmediate(resolve));assert.equal(pending.length,2);
 pending.forEach(resolve=>resolve(value()));const routed=await result;assert.equal(routed.source,'ai');assert.equal(routed.department,'Food Services');assert.ok(routed.routing_checks.includes('two_experts_agree'));assert.equal(routed.model_reviews.length,2);assert.ok(routed.model_reviews.every(r=>r.status==='validated'));
});
test('nonclinical disagreements reach nursing and retain only safe service tasks',async()=>{
 const router=createExpertRouter({mode:'ensemble',primary:expert('bedrock',value()),secondary:expert('groq',value('toileting','assistance'))});
 const result=await router.classify('Could somebody bring me a sip and some assistance?');assert.equal(result.department,'Nursing');assert.equal(result.priority,3);assert.ok(result.routing_checks.includes('expert_disagreement_nursing_review'));assert.deepEqual(result.additional_requests.map(t=>t.department),['Food Services']);
});
test('clinical expert priority wins without support-team mobility dispatch',async()=>{
 const clinical={...value(),priority:1,department:'Nursing',summary:'Urgent medical assessment',intents:[{kind:'clinical_review',department:'Nursing',summary:'Urgent breathing trouble',evidence:['something is wrong']}]};
 const router=createExpertRouter({mode:'ensemble',primary:expert('bedrock',value()),secondary:expert('groq',clinical)});const result=await router.classify('Could somebody bring me a sip? I think something is wrong');
 assert.equal(result.department,'Nursing');assert.equal(result.priority,1);assert.ok(result.routing_checks.includes('expert_disagreement_clinical_priority'));assert.ok(!result.additional_requests.some(t=>t.department==='Bedside Care'));
});
test('one unavailable expert never pretends to agree; a validated backup can recover',async()=>{
 for(const failedPrimary of [false,true]){
  const bad=expert('groq',()=>{throw new Error('secret token must not leak');}),good=expert('bedrock',value());const router=createExpertRouter({mode:'ensemble',primary:failedPrimary?bad:good,secondary:failedPrimary?good:bad});const result=await router.classify('Could somebody bring me a sip?');
  assert.equal(result.department,'Food Services');assert.ok(result.model_reviews.some(r=>r.status==='fallback'));assert.ok(!result.routing_checks.includes('two_experts_agree'));assert.doesNotMatch(JSON.stringify(result),/secret token/);
 }
});
test('timeouts are bounded and late expert completion cannot mutate dispatch',async()=>{
 const router=createExpertRouter({mode:'ensemble',primary:expert('bedrock',value()),secondary:expert('groq',()=>new Promise(()=>{})),budgetMs:15});const result=await router.classify('Could somebody bring me a sip?');assert.equal(result.department,'Food Services');assert.equal(result.model_reviews[1].status,'unavailable');
});
test('SetFit endpoint validates all six labels and only supplies advisory routing',async()=>{
 let request;const scores=Object.keys(SETFIT_LABELS).map(label=>({label,score:label==='Dietary'?0.9:0.1}));const second=createSetFitExpert({endpoint:'https://example.com/predict',token:'server-secret',fetch:async(url,options)=>{request={url,options};return new Response(JSON.stringify([scores]));}});
 const router=createExpertRouter({mode:'ensemble',primary:expert('bedrock',value()),secondary:second});const result=await router.classify('Could somebody bring me a sip?');assert.equal(result.department,'Food Services');assert.ok(result.routing_checks.includes('setfit_team_agreement'));assert.equal(request.options.redirect,'error');assert.equal(JSON.parse(request.options.body).inputs,'Could somebody bring me a sip?');assert.equal(result.model_reviews[1].provider,'setfit');assert.doesNotMatch(JSON.stringify(result),/server-secret/);
});
test('SetFit clinical votes escalate even if the main model is unavailable',async()=>{
 const scores=Object.keys(SETFIT_LABELS).map(label=>({label,score:label==='Provider'?0.9:0.1}));const second=createSetFitExpert({endpoint:'https://example.com',fetch:async()=>new Response(JSON.stringify(scores))});
 const result=await createExpertRouter({mode:'ensemble',primary:expert('bedrock',()=>{throw new Error();}),secondary:second}).classify('I want water');assert.equal(result.department,'Nursing');assert.ok(result.routing_checks.includes('setfit_clinical_review'));assert.ok(result.additional_requests.some(t=>t.department==='Food Services'));
});
test('SetFit never downgrades an uncertain request and rejects malformed labels or insecure endpoints',async()=>{
 assert.equal(createSetFitExpert(),null);for(const endpoint of ['http://example.com','https://secret:token@example.com','https://example.com?token=secret'])assert.throws(()=>createSetFitExpert({endpoint,publicDeployment:true}));
 for(const response of [[{label:'Dietary',score:.95}],Object.keys(SETFIT_LABELS).map(label=>({label,score:2})),Object.keys(SETFIT_LABELS).map(label=>({label,score:.1}))]){
  const secondary=createSetFitExpert({endpoint:'https://example.com',fetch:async()=>new Response(JSON.stringify(response))});const result=await createExpertRouter({mode:'ensemble',primary:expert('bedrock',()=>{throw new Error();}),secondary}).classify('Please help me with that thing');assert.equal(result.department,'Nursing');assert.notEqual(result.model_reviews[1].status,'validated');
 }
});
test('API persists model review receipts, keeps them private, and does not rerun duplicate requests',async()=>{
 const http=require('node:http'),{randomUUID}=require('node:crypto'),{createApplication}=require('../lib/handler.cjs');let calls=0;
 const app=createApplication({filename:':memory:',databaseUrl:'',publicDeployment:false,demoPassword:'test-password',aiProvider:'bedrock',voiceInputProvider:'browser',routingMode:'ensemble',secondaryApiKey:'test-key',elevenKey:'',bedrockClient:{send:async()=>{calls++;return {stopReason:'tool_use',output:{message:{content:[{toolUse:{name:'call_bell_route',input:value()}}]}}};}},fetch:async()=>{calls++;return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify(value())}}]}));}});
 await app.initialize();const server=http.createServer(app.handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port,cookies={};
 const request=async(path,role,body)=>{const response=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(cookies[role]?{Cookie:cookies[role]}:{})},...(body?{body:JSON.stringify(body)}:{})});assert.ok(response.status<400);return {data:await response.json(),response};};
 try{
  for(const role of ['patient','nurse','dietary','coordinator']){const login=await request('/api/login',null,{email:role+'@kaalinga.demo',password:'test-password'});cookies[role]=login.response.headers.get('set-cookie').split(';')[0];}
  const payload={text:'Could somebody bring me a sip?',requestKey:randomUUID()};const created=await request('/api/requests','patient',payload);assert.equal(created.data.ticket.model_reviews,undefined);assert.equal(calls,2);
  await request('/api/requests','patient',payload);assert.equal(calls,2);
  const row=(await app.store.query('SELECT model_reviews FROM tickets WHERE id = ?',[created.data.ticket.id])).rows[0];assert.equal(JSON.parse(row.model_reviews).length,2);
  const coordinator=await request('/api/tickets','coordinator');assert.equal(coordinator.data.tickets[0].model_reviews.length,2);assert.ok(coordinator.data.tickets[0].routing_checks.includes('two_experts_agree'));
  const dietary=await request('/api/tickets','dietary');assert.equal(dietary.data.tickets[0].model_reviews,undefined);
  const config=await request('/api/config');assert.equal(config.data.routingMode,'ensemble');assert.equal(config.data.routingExperts.length,2);assert.doesNotMatch(JSON.stringify(config.data),/test-key/);
  const urgent=await request('/api/requests','patient',{text:'I cannot breathe',requestKey:randomUUID()});assert.equal(calls,2);assert.deepEqual(new Set(urgent.data.tickets.map(t=>t.department)),new Set(['Nursing','Medical Team']));
 }finally{await new Promise(resolve=>server.close(resolve));await app.close();}
});
test('rate-limited expert cools down without fake calls or agreement',async()=>{
 let calls=0;const secondary={provider:'groq',model:'secondary',config:{apiKey:'test',fetch:async()=>{calls++;return new Response('{}',{status:429});}}};
 const router=createExpertRouter({mode:'ensemble',primary:expert('bedrock',value()),secondary});
 const first=await router.classify('Could somebody bring me a sip?');assert.equal(first.model_reviews[1].failure_code,'provider_http_429');
 const second=await router.classify('Could somebody bring me a sip?');assert.equal(calls,1);assert.equal(second.department,'Food Services');assert.equal(second.model_reviews[1].status,'skipped_rate_limit');assert.ok(!second.routing_checks.includes('two_experts_agree'));
});
