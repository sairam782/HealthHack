'use strict';
const fs=require('node:fs'),path=require('node:path'),routing=require('../routing.js'),cases=require('../tests/intent-cases.cjs');
const live=process.argv.includes('--live');const root=path.resolve(__dirname,'..');
if(live&&fs.existsSync(path.join(root,'.env')))process.loadEnvFile(path.join(root,'.env'));
const provider=process.env.AI_PROVIDER||'bedrock';
const aws=live&&provider==='bedrock'?require('../lib/aws-services.cjs').createAwsServices():null;
const settings=live?(aws?{classify:aws.classify}:{apiKey:process.env.GROQ_API_KEY,model:process.env.GROQ_MODEL}):{};
(async()=>{
 const results=[];for(const example of cases){
  const start=performance.now();const result=await routing.classifyRequest(example.text,{language:example.language||'en-US',...example.options},settings);
  const expected=!live&&example.semantic?['Nursing']:example.teams;
  const actual=[result.department,...result.additional_requests.map(t=>t.department)];const kinds=[...new Set(result.intents.map(i=>i.kind))];
  const missing=expected.filter(d=>!actual.includes(d)),extra=actual.filter(d=>!expected.includes(d));
  const missingKinds=!live&&example.semantic?[]:example.kinds.filter(k=>!kinds.includes(k));const unwantedKinds=(example.forbiddenKinds||[]).filter(k=>kinds.includes(k));
  const wrongPain=Object.hasOwn(example,'painScore')&&(result.pain?.score??null)!==example.painScore;
  const undertriage=example.maxPriority&&result.priority>example.maxPriority;
  const semanticFallback=live&&example.semantic&&example.primary!=='Nursing'&&result.source!=='ai';
  const passed=!missing.length&&!extra.length&&!missingKinds.length&&!unwantedKinds.length&&!wrongPain&&!undertriage&&!semanticFallback;
  results.push({name:example.name,expected,actual,kinds,missingKinds,unwantedKinds,missingTeams:missing,extraTeams:extra,painScore:result.pain?.score??null,wrongPain,undertriage:Boolean(undertriage),semanticFallback:Boolean(semanticFallback),source:result.source,checks:result.routing_checks,flags:result.safety_flags,latencyMs:Math.round(performance.now()-start),passed});
  console.log((passed?'PASS':'FAIL')+' · '+example.name+' → '+actual.join(', ')+' ('+result.source+')');
 }
 const latencies=results.map(r=>r.latencyMs).sort((a,b)=>a-b);const report={evaluatedAt:new Date().toISOString(),mode:live?'live-'+provider:'deterministic-rules',total:results.length,passed:results.filter(r=>r.passed).length,missedTeams:results.reduce((n,r)=>n+r.missingTeams.length,0),extraTeams:results.reduce((n,r)=>n+r.extraTeams.length,0),undertriage:results.filter(r=>r.undertriage).length,wrongPainScores:results.filter(r=>r.wrongPain).length,aiResponses:results.filter(r=>r.source==='ai').length,fallbacks:results.filter(r=>r.source==='ai_fallback').length,p95LatencyMs:latencies[Math.ceil(latencies.length*.95)-1],results,limitation:'Synthetic targets for the guarded application, not clinical validation or real-world accuracy. Rules mode expects ambiguous semantic cases to remain with Nursing.'};
 fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts',live?'live-intent-evaluation.json':'rules-intent-evaluation.json'),JSON.stringify(report,null,2)+'\n');
 console.log(report.passed+'/'+report.total+' passed; missed teams '+report.missedTeams+'; extra teams '+report.extraTeams+'; undertriage '+report.undertriage+'.');if(report.passed!==report.total)process.exitCode=1;
})().catch(error=>{console.error('Intent evaluation failed:',error.name);process.exitCode=1;}).finally(()=>aws?.close());
