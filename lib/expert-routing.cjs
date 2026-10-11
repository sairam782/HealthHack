'use strict';
const routing=require('../routing.js');
const SETFIT_MODEL='priyadp1/setfit-multilingual';
const SETFIT_LABELS={'Registered Nurse':'Nursing','Patient Care Technician':'Bedside Care','Charge Nurse':'Nursing','Provider':'Nursing','Environmental Services':'Environmental Services','Dietary':'Food Services'};
const teams=result=>[...new Set([result.department,...(result.additional_requests||[]).map(t=>t.department)])].sort();
const signature=result=>JSON.stringify({teams:teams(result),kinds:[...new Set((result.intents||[]).map(i=>i.kind))].sort(),priority:result.priority});
function createSetFitExpert({endpoint,token,fetch:fetcher=fetch,publicDeployment=false,timeoutMs=2500}={}){
 if(!endpoint)return null;
 const url=new URL(endpoint);
 if(url.username||url.password||url.hash||url.search||!(url.protocol==='https:'||(!publicDeployment&&url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname))))throw new Error('SetFit requires an HTTPS endpoint without embedded credentials.');
 return {provider:'setfit',model:SETFIT_MODEL,async predict(text){
  const response=await fetcher(url.href,{method:'POST',redirect:'error',signal:AbortSignal.timeout(timeoutMs),headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({inputs:text,parameters:{top_k:null}})});
  if(!response.ok)throw new Error('setfit_unavailable');
  const raw=await response.text();if(raw.length>12000)throw new Error('setfit_invalid');
  let scores=JSON.parse(raw);if(Array.isArray(scores)&&scores.length===1&&Array.isArray(scores[0]))scores=scores[0];
  if(!Array.isArray(scores)||scores.length!==6||new Set(scores.map(s=>s?.label)).size!==6||scores.some(s=>!s||!Object.hasOwn(SETFIT_LABELS,s.label)||typeof s.score!=='number'||!Number.isFinite(s.score)||s.score<0||s.score>1))throw new Error('setfit_invalid');
  const selected=scores.filter(s=>s.score>=0.5);if(!selected.length)throw new Error('setfit_uncertain');
  return {advisory:true,teams:[...new Set(selected.map(s=>SETFIT_LABELS[s.label]))].sort(),scores:scores.map(s=>({label:s.label,score:s.score}))};
 }};
}
function createExpertRouter({mode='single',primary,secondary,budgetMs=7000}={}){
 if(!['single','ensemble'].includes(mode))throw new Error('Choose AI_ROUTING_MODE single or ensemble.');
 const cooldown=new Map();
 async function invoke(expert,text,options){
  const start=performance.now();let timer;
  if((cooldown.get(expert)||0)>Date.now())return {result:null,review:{provider:expert.provider,model:expert.model,status:'skipped_rate_limit',latency_ms:0}};
  try{
   const result=await Promise.race([Promise.resolve().then(()=>expert.predict?expert.predict(text,options):routing.classifyRequest(text,options,expert.config)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('expert_timeout')),budgetMs);})]);
   const validated=result.advisory||result.source==='ai';
   const failure=!validated?(result.safety_flags||[]).find(flag=>/^provider_http_\d{3}$|^provider_unavailable$/.test(flag))||'response_rejected':null;
   if(failure==='provider_http_429')cooldown.set(expert,Date.now()+60000);
   return {result,review:{provider:expert.provider,model:expert.model,status:validated?'validated':'fallback',latency_ms:Math.round(performance.now()-start),teams:result.advisory?result.teams:teams(result),...(failure?{failure_code:failure}:{}),...(result.advisory?{scores:result.scores}:{})}};
  }catch(_){return {result:null,review:{provider:expert.provider,model:expert.model,status:'unavailable',latency_ms:Math.round(performance.now()-start)}};}
  finally{clearTimeout(timer);}
 }
 async function classify(text,options={}){
  const local=routing.classifyLocal(text,options);
  if(local.source==='safety_rule')return {...local,model_reviews:[],routing_checks:[...local.routing_checks,'experts_bypassed_for_safety']};
  if(!primary)return {...local,model_reviews:[]};
  const expertList=mode==='ensemble'&&secondary?[primary,secondary]:[primary];
  const outcomes=await Promise.all(expertList.map(expert=>invoke(expert,text,options)));
  const reviews=outcomes.map(o=>o.review),valid=outcomes.filter(o=>o.review.status==='validated');
  const finish=(result,check)=>({...result,model_reviews:reviews,routing_checks:[...(result.routing_checks||[]),check]});
  const first=outcomes[0],second=outcomes[1];
  if(!second)return finish(first.result||{...local,source:'ai_fallback'},mode==='ensemble'?'second_expert_not_configured':'single_expert');
  if(!valid.length)return finish(first.result||{...local,source:'ai_fallback'},'experts_unavailable_fallback');
  if(second.result?.advisory){
   const selected=second.result.teams;
   if(selected.includes('Nursing')&&!(first.result||local).is_clinical)return finish(routing.nursingReview(text,options,first.result||local,'SetFit identified a clinical concern; nursing review required.'),'setfit_clinical_review');
   if(first.review.status!=='validated')return finish(first.result||{...local,source:'ai_fallback'},'setfit_advisory_only');
   const covered=teams(first.result).filter(t=>Object.values(SETFIT_LABELS).includes(t));
   return JSON.stringify(covered)===JSON.stringify(selected)?finish(first.result,'setfit_team_agreement'):finish(routing.nursingReview(text,options,first.result,'The classifier and SetFit responder labels disagreed; nursing review required.'),'setfit_disagreement_nursing_review');
  }
  if(valid.length===1)return finish(valid[0].result,first.review.status==='validated'?'second_expert_unavailable':'validated_backup_expert');
  if(signature(first.result)===signature(second.result))return finish(first.result,'two_experts_agree');
  const clinical=[first.result,second.result].filter(r=>r.is_clinical).sort((a,b)=>a.priority-b.priority);
  if(clinical.length)return finish(clinical[0],'expert_disagreement_clinical_priority');
  return finish(routing.nursingReview(text,options,first.result,'The routing experts disagreed; nursing review required.'),'expert_disagreement_nursing_review');
 }
 return {classify,mode,experts:[primary,...(mode==='ensemble'?[secondary]:[])].filter(Boolean).map(e=>({provider:e.provider,model:e.model}))};
}
module.exports={createExpertRouter,createSetFitExpert,SETFIT_LABELS,SETFIT_MODEL};
