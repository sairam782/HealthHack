'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const http=require('node:http');
const {createAwsServices,TRANSCRIBE_LANGUAGES}=require('../lib/aws-services.cjs');const routing=require('../routing.js');const {createApplication}=require('../lib/handler.cjs');
const credentials={accessKeyId:'FAKE_TEST_ACCESS',secretAccessKey:'fake-test-secret',sessionToken:'fake/test+token'};
const value={priority:4,department:'Food Services',summary:'Water request',patient_summary:'Received',detected_language:'Spanish',confidence:0.95,reasoning:'Routine drink',secondary_request:null};
test('short-term Bedrock bearer authentication works without AWS credential lookup',async()=>{
 const {Readable}=require('node:stream');let requests=0,credentialLookups=0;
 const aws=createAwsServices({bedrockToken:'FAKE_BEDROCK_TEST_TOKEN',awsCredentials:async()=>{credentialLookups++;throw new Error('No AWS credentials');},bedrockRequestHandler:{handle:async request=>{
  requests++;assert.equal(request.headers.Authorization,'Bearer FAKE_BEDROCK_TEST_TOKEN');assert.equal(request.hostname,'bedrock-runtime.us-east-1.amazonaws.com');assert.equal(request.method,'POST');assert.ok(request.path.includes('nova-2-lite'));assert.equal(JSON.parse(Buffer.from(request.body).toString()).toolConfig.toolChoice.tool.name,'call_bell_route');
  return {response:{statusCode:200,headers:{'content-type':'application/json'},body:Readable.from([Buffer.from(JSON.stringify({stopReason:'tool_use',output:{message:{role:'assistant',content:[{toolUse:{toolUseId:'test',name:'call_bell_route',input:value}}]}}}))])}};
 }}});
 try{const result=await routing.classifyRequest('Necesito agua',{language:'es-ES'},{classify:aws.classify});assert.equal(result.source,'ai');assert.equal(requests,1);assert.equal(credentialLookups,0);}finally{aws.close();}
});
test('Bedrock tool output uses the shared schema, selected language and safety guards',async()=>{
 const commands=[];const aws=createAwsServices({awsCredentials:credentials,bedrockClient:{send:async command=>{commands.push(command.input);return {stopReason:'tool_use',output:{message:{content:[{toolUse:{name:'call_bell_route',input:value}}]}}};}}});
 assert.equal((await routing.classifyRequest('Necesito agua',{language:'es-ES'},{classify:aws.classify})).department,'Food Services');
 assert.equal(commands[0].toolConfig.toolChoice.tool.name,'call_bell_route');assert.equal(JSON.parse(commands[0].messages[0].content[0].text).preferred_language,'es-ES');assert.deepEqual(commands[0].toolConfig.tools[0].toolSpec.inputSchema.json,routing.RESPONSE_SCHEMA);
 const urgent=await routing.classifyRequest('I am choking',{language:'en-US'},{classify:aws.classify});assert.equal(urgent.priority,1);assert.equal(urgent.source,'safety_rule');assert.equal(commands.length,1);
 const uncertain=await routing.classifyRequest('help please',{}, {classify:async()=>({...value,confidence:0.1})});assert.equal(uncertain.department,'Nursing');assert.equal(uncertain.source,'ai_fallback');aws.close();
});
test('Bedrock outage and malformed tool responses produce labelled safe fallback',async()=>{
 for(const response of [{stopReason:'end_turn',output:{message:{content:[{text:'not JSON'}]}}},{stopReason:'tool_use',output:{message:{content:[{toolUse:{name:'other',input:value}}]}}}]){
  const aws=createAwsServices({bedrockClient:{send:async()=>response}});const result=await routing.classifyRequest('Please review this',{}, {classify:aws.classify});assert.equal(result.department,'Nursing');assert.equal(result.source,'ai_fallback');assert.ok(result.safety_flags.includes('bedrock_invalid_response'));
 }
 const result=await routing.classifyRequest('water',{}, {classify:async()=>{throw new Error('AWS unavailable');}});assert.equal(result.department,'Food Services');assert.equal(result.source,'ai_fallback');
});
test('Transcribe presigned sessions are scoped to the selected region, language and short expiry',async()=>{
 for(const region of ['us-east-1','us-west-2']){const aws=createAwsServices({awsRegion:region,awsCredentials:credentials});const session=await aws.transcribeSession('hi-IN');const url=new URL(session.url);assert.equal(url.protocol,'wss:');assert.equal(url.hostname,'transcribestreaming.'+region+'.amazonaws.com');assert.equal(url.port,'8443');assert.equal(url.searchParams.get('language-code'),'hi-IN');assert.equal(url.searchParams.get('X-Amz-Expires'),'60');assert.equal(url.searchParams.get('X-Amz-Security-Token'),credentials.sessionToken);assert.match(url.searchParams.get('X-Amz-Signature'),/^[a-f0-9]{64}$/);assert.equal(session.sampleRate,16000);assert.equal(session.maxDurationMs,60000);assert.ok(!session.url.includes(credentials.secretAccessKey));await assert.rejects(aws.transcribeSession('xx-XX'));aws.close();}
 assert.throws(()=>createAwsServices({awsRegion:'eu-west-1'}));assert.equal(TRANSCRIBE_LANGUAGES.length,12);
});
test('AWS speech sessions are authenticated, patient-only, language bounded and rate limited',async()=>{
 const app=createApplication({filename:':memory:',databaseUrl:'',publicDeployment:false,demoPassword:'test-password',aiProvider:'rules',voiceInputProvider:'aws',awsCredentials:credentials,elevenKey:''});await app.initialize();const server=http.createServer(app.handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 const post=(path,data,cookie)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(data)});
 try{assert.equal((await post('/api/transcribe/session',{language:'en-US'})).status,401);const cookies={};for(const role of ['patient','nurse'])cookies[role]=(await post('/api/login',{email:role+'@kaalinga.demo',password:'test-password'})).headers.get('set-cookie').split(';')[0];assert.equal((await post('/api/transcribe/session',{language:'en-US'},cookies.nurse)).status,403);assert.equal((await post('/api/transcribe/session',{language:'xx'},cookies.patient)).status,400);
 for(let i=0;i<30;i++)assert.equal((await post('/api/transcribe/session',{language:'en-US'},cookies.patient)).status,200);assert.equal((await post('/api/transcribe/session',{language:'en-US'},cookies.patient)).status,429);
 const config=await (await fetch(base+'/api/config')).json();assert.equal(config.voiceInputProvider,'aws');assert.ok(!JSON.stringify(config).includes(credentials.accessKeyId));assert.equal((await app.store.query('SELECT COUNT(*) AS total FROM tickets')).rows[0].total,0);
 }finally{await new Promise(resolve=>server.close(resolve));await app.close();}
});
test('credential failure gives a sanitized voice error without creating requests',async()=>{
 const app=createApplication({filename:':memory:',databaseUrl:'',publicDeployment:false,demoPassword:'test-password',aiProvider:'rules',voiceInputProvider:'aws',awsCredentials:async()=>{throw new Error('SECRET_MUST_NOT_LEAK');}});await app.initialize();const server=http.createServer(app.handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 try{const login=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'patient@kaalinga.demo',password:'test-password'})});const response=await fetch(base+'/api/transcribe/session',{method:'POST',headers:{'Content-Type':'application/json',Cookie:login.headers.get('set-cookie').split(';')[0]},body:JSON.stringify({language:'en-US'})});assert.equal(response.status,503);assert.ok(!(await response.text()).includes('SECRET_MUST_NOT_LEAK'));}finally{await new Promise(resolve=>server.close(resolve));await app.close();}
});
