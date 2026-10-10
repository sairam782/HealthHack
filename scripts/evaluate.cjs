'use strict';
const fs=require('node:fs');
const path=require('node:path');
const routing=require('../routing.js');
const cases=require('../tests/cases.cjs');
const root=path.join(__dirname,'..');
const live=process.argv.includes('--live');
const intervalMs=Math.min(30000,Math.max(0,Number(process.argv.find(arg=>arg.startsWith('--interval-ms='))?.slice(14))||0));
const modelArgument=process.argv.find(arg=>arg.startsWith('--model='))?.slice(8);
if(live&&fs.existsSync(path.join(root,'.env'))) process.loadEnvFile(path.join(root,'.env'));
if(live&&!process.env.GROQ_API_KEY) { console.error('Live evaluation requires GROQ_API_KEY.'); process.exit(1); }
(async()=>{
  const results=[];
  for(const example of cases) {
    const started=performance.now();
    const result=await routing.classifyRequest(example.text,{},live?{apiKey:process.env.GROQ_API_KEY,model:modelArgument||process.env.GROQ_MODEL}:{});
    const passed=result.department===example.department&&(!example.maxPriority||result.priority<=example.maxPriority);
    results.push({name:example.name,expectedDepartment:example.department,department:result.department,priority:result.priority,source:result.source,passed,latencyMs:Math.round(performance.now()-started),flags:result.safety_flags});
    if(live&&intervalMs&&result.source!=='safety_rule') await new Promise(resolve=>setTimeout(resolve,intervalMs));
    console.log((passed?'PASS':'FAIL')+' · '+example.name+' → '+result.department+' P'+result.priority+' ('+result.source+')');
  }
  const report={evaluatedAt:new Date().toISOString(),mode:live?'live-provider':'deterministic-rules',model:live?(modelArgument||process.env.GROQ_MODEL||'openai/gpt-oss-120b'):null,total:results.length,passed:results.filter(r=>r.passed).length,aiResponses:results.filter(r=>r.source==='ai').length,fallbackResponses:results.filter(r=>r.source==='ai_fallback').length,results,limitation:'Synthetic regression cases only. Not clinical validation or an estimate of real-world accuracy.'};
  fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
  fs.writeFileSync(path.join(root,'artifacts',live?'live-'+(report.model.replaceAll('/','-'))+'.json':'rules-evaluation.json'),JSON.stringify(report,null,2)+'\n');
  console.log('\n'+report.passed+'/'+report.total+' expected routes matched.');
  if(report.passed!==report.total) process.exitCode=1;
})();
