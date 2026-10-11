'use strict';
// Sends only synthetic benchmark text; never logs credentials or creates care tickets.
const fs=require('node:fs'),path=require('node:path'),routing=require('../routing.js'),cases=require('../tests/intent-cases.cjs');
const root=path.join(__dirname,'..');if(fs.existsSync(path.join(root,'.env')))process.loadEnvFile(path.join(root,'.env'));
const {createAwsServices}=require('../lib/aws-services.cjs'),{createExpertRouter}=require('../lib/expert-routing.cjs');
if(!process.env.GROQ_API_KEY)throw new Error('Configure server-side GROQ_API_KEY.');
const aws=createAwsServices(),router=createExpertRouter({mode:'ensemble',primary:{provider:'bedrock',model:aws.model,config:{classify:aws.classify}},secondary:{provider:'groq',model:'openai/gpt-oss-120b',config:{apiKey:process.env.GROQ_API_KEY,model:'openai/gpt-oss-120b'}}});
(async()=>{
 const results=[];for(const example of cases){const start=performance.now(),result=await router.classify(example.text,{language:example.language||'en-US',...example.options});
  const actual=[result.department,...result.additional_requests.map(t=>t.department)],expected=example.teams;const kinds=[...new Set(result.intents.map(i=>i.kind))];
  const missed=expected.filter(t=>!actual.includes(t)),extra=actual.filter(t=>!expected.includes(t)),missingKinds=example.kinds.filter(k=>!kinds.includes(k)),unwanted=(example.forbiddenKinds||[]).filter(k=>kinds.includes(k));
  const undertriage=Boolean(example.maxPriority&&result.priority>example.maxPriority),wrongPain=Object.hasOwn(example,'painScore')&&(result.pain?.score??null)!==example.painScore;
  const passed=!missed.length&&!extra.length&&!missingKinds.length&&!unwanted.length&&!undertriage&&!wrongPain;
  results.push({name:example.name,actual,expected,kinds,missed,extra,missingKinds,unwanted,undertriage,wrongPain,passed,latency_ms:Math.round(performance.now()-start),checks:result.routing_checks,reviews:result.model_reviews});
  console.log((passed?'PASS':'FAIL')+' '+example.name+' · '+actual.join(', ')+' · '+result.model_reviews.map(r=>r.provider+':'+r.status).join(' / '));
 }
 const hf=await fetch('https://huggingface.co/api/models/priyadp1/setfit-multilingual?expand=inferenceProviderMapping');const metadata=await hf.json();
 const report={checkedAt:new Date().toISOString(),total:results.length,passed:results.filter(r=>r.passed).length,undertriage:results.filter(r=>r.undertriage).length,twoValidated:results.filter(r=>r.reviews.length===2&&r.reviews.every(m=>m.status==='validated')).length,huggingFace:{metadataApiStatus:hf.status,model:'priyadp1/setfit-multilingual',providerMapping:metadata.inferenceProviderMapping||{},inferenceCalled:false},results,limitation:'Synthetic application regression; no clinical validation or comparative accuracy claim. Hugging Face call is metadata only.'};
 fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts','expert-routing-live-check.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({total:report.total,passed:report.passed,undertriage:report.undertriage,twoValidated:report.twoValidated,huggingFace:report.huggingFace}));if(report.passed!==report.total)process.exitCode=1;
})().catch(e=>{console.error('Expert check failed: '+e.name);process.exitCode=1;}).finally(()=>aws.close());
