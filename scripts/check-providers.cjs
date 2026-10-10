'use strict';
// Explicit live check: sends synthetic text to the configured providers, uses
// an isolated database, and reports only provider metadata (never credentials).
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const envFile=path.join(__dirname,'..','.env');
if(fs.existsSync(envFile)) process.loadEnvFile(envFile);
const {createApplication}=require('../lib/handler.cjs');
const {BedrockRuntimeClient}=require('@aws-sdk/client-bedrock-runtime');

async function main() {
  const provider=process.env.AI_PROVIDER||'groq';
  if(!['groq','bedrock'].includes(provider)||!process.env.ELEVENLABS_API_KEY||(provider==='groq'&&!process.env.GROQ_API_KEY))throw new Error('Configure the classifier and ElevenLabs before running this live check.');
  const calls=[];
  const trackedFetch=async(url,options)=>{
    const response=await fetch(url,options);
    calls.push({host:new URL(url).hostname,status:response.status});
    return response;
  };
  const region=process.env.AWS_REGION||'us-east-1';
  const bedrock=provider==='bedrock'?new BedrockRuntimeClient({region,maxAttempts:1,...(process.env.AWS_BEARER_TOKEN_BEDROCK?{token:{token:process.env.AWS_BEARER_TOKEN_BEDROCK},authSchemePreference:['httpBearerAuth']}:{})}):null;
  const bedrockClient=bedrock?{send:async(command,options)=>{try{const result=await bedrock.send(command,options);calls.push({host:'bedrock-runtime.'+region+'.amazonaws.com',status:result.$metadata.httpStatusCode});return result;}catch(error){calls.push({host:'bedrock-runtime.'+region+'.amazonaws.com',status:error.$metadata?.httpStatusCode||null,error:error.name});throw error;}},destroy:()=>bedrock.destroy()}:undefined;
  const app=createApplication({filename:':memory:',databaseUrl:'',demoPassword:'provider-check-password',publicDeployment:false,fetch:trackedFetch,bedrockClient});
  const report={checkedAt:new Date().toISOString(),provider,region:provider==='bedrock'?region:null,calls,classifications:[],voices:[],urgentBypassedProviders:false};
  const server=http.createServer(app.handler);
  try {
    await app.initialize();
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
    const base='http://127.0.0.1:'+server.address().port;
    const login=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'patient8@kaalinga.demo',password:'provider-check-password'})});
    assert.equal(login.status,200,'New patient login must succeed');
    const cookie=login.headers.get('set-cookie').split(';')[0];
    const create=async(text,language='en-US',forceClinical=false)=>{
      const response=await fetch(base+'/api/requests',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({text,language,forceClinical,requestKey:randomUUID()})});
      assert.equal(response.status,201,'Synthetic request must be created');
      return (await response.json()).ticket;
    };
    for(const [language,text,detected] of [['en-US','Can I have some water, please?','English'],['es-ES','Necesito agua, por favor.','Spanish'],['hi-IN','मुझे पानी चाहिए।','Hindi'],['fr-FR','Je voudrais de l’eau, s’il vous plaît.','French']]){
      const ticket=await create(text,language);
      report.classifications.push({language,model:provider==='bedrock'?(process.env.BEDROCK_MODEL_ID||'us.amazon.nova-2-lite-v1:0'):(process.env.GROQ_MODEL||'openai/gpt-oss-120b'),source:ticket.source,department:ticket.department,detectedLanguage:ticket.detected_language,latencyMs:Math.round(ticket.classification_ms),flags:ticket.safety_flags});
      assert.equal(ticket.source,'ai','Classification must use a validated live AI response, not fallback');assert.equal(ticket.department,'Food Services');assert.equal(ticket.detected_language,detected);
      const voice=await fetch(base+'/api/voice/'+ticket.id,{headers:{Cookie:cookie}});const audioBytes=(await voice.arrayBuffer()).byteLength;
      report.voices.push({language,status:voice.status,contentType:voice.headers.get('content-type'),audioBytes});assert.equal(voice.status,200,'Live receipt audio must succeed');assert.match(voice.headers.get('content-type'),/audio\/mpeg/);assert.ok(audioBytes>0);
    }
    assert.ok(calls.some(call=>call.host===(provider==='bedrock'?'bedrock-runtime.'+region+'.amazonaws.com':'api.groq.com')&&call.status===200));
    const previousCalls=calls.length;
    const urgent=await create('Please send help now.','en-US',true);
    assert.equal(urgent.department,'Nursing');assert.equal(urgent.priority,1);
    assert.equal(calls.length,previousCalls,'Urgent button must bypass the model');
    report.urgentBypassedProviders=true;report.passed=true;
  } catch(error){
    report.passed=false;report.failure=error.name;process.exitCode=1;
  } finally {
    const output=path.join(__dirname,'..','artifacts');
    fs.mkdirSync(output,{recursive:true});
    fs.writeFileSync(path.join(output,'provider-check.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
    if(server.listening) await new Promise(resolve=>server.close(resolve));
    await app.close();
  }
}
main().catch(error=>{console.error('Provider check failed:',error.name);process.exitCode=1;});
