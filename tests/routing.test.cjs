'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const routing = require('../routing.js');
const cases = require('./cases.cjs');
const valid = () => ({ tier:'envops',priority:4,department:'Food Services',summary:'Refreshment request.',patient_summary:'Request received.',detected_language:'English',is_clinical:false,confidence:0.95,reasoning:'Routine request.',secondary_request:null });
for (const example of cases) test('local route: ' + example.name, () => {
  const result = routing.classifyLocal(example.text);
  assert.equal(result.department, example.department);
  if (example.maxPriority) assert.ok(result.priority <= example.maxPriority);
  assert.equal(result.is_clinical, result.tier === 'clinical');
  assert.equal(result.confidence, null);
  assert.equal(result.responder, routing.ROUTES[result.department].responder);
});
test('urgent request never waits for or calls a model', async () => {
  let called = false;
  const result = await routing.classifyRequest('I need water and I am choking.', {}, { apiKey:'test-only',fetch:async()=>{called=true;throw new Error('Should not run');} });
  assert.equal(called,false); assert.equal(result.priority,1); assert.equal(result.department,'Nursing');
  assert.equal(result.secondary_request.department,'Food Services');
});
test('safety override replaces the full clinical route and preserves P1', () => {
  const result = routing.validateAndGuard(valid(),'My chest hurts and I need water.');
  assert.equal(result.tier,'clinical'); assert.equal(result.priority,1); assert.equal(result.department,'Nursing'); assert.equal(result.responder,'Registered Nurse');
  assert.match(result.patient_summary,/nurse/); assert.doesNotMatch(result.patient_summary,/on the way|coming|Dietary/);
});
test('an inconsistent clinical flag cannot evade safety', () => {
  const result=routing.validateAndGuard({...valid(),is_clinical:true},'My chest hurts');
  assert.equal(result.department,'Nursing'); assert.equal(result.priority,1);
});
for(const [name,change] of [
  ['unknown tier',{tier:'unknown'}], ['unknown department',{department:'__proto__',tier:undefined}],
  ['bad priority',{priority:99}], ['string priority',{priority:'4'}], ['bad confidence',{confidence:7}],
  ['zero confidence',{confidence:0}], ['NaN confidence',{confidence:NaN}], ['missing language',{detected_language:null}],
  ['contradictory clinical flag',{is_clinical:true}], ['missing secondary field',{secondary_request:undefined}],
  ['unsafe secondary',{secondary_request:{tier:'envops',department:'Food Services',summary:'Water and chest pain'}}],
  ['clinical concern in service summary',{summary:'Water request, patient is choking'}]
]) test('invalid or unsafe AI response: '+name, () => {
  const result=routing.validateAndGuard({...valid(),...change},'Can I get water?');
  assert.equal(result.department,'Nursing'); assert.equal(result.priority,3);
});
test('low model confidence defaults to nursing',()=>{
  const result=routing.validateAndGuard({...valid(),confidence:0.6},'Can you get something for me?');
  assert.equal(result.department,'Nursing'); assert.equal(result.confidence,null);
});
test('server chooses responder and safe receipt wording',()=>{
  const result=routing.validateAndGuard({...valid(),responder:'Physician',patient_summary:'Staff will arrive in 30 seconds.'},'Can I get water?');
  assert.equal(result.department,'Food Services'); assert.equal(result.responder,'Dietary Staff'); assert.doesNotMatch(result.patient_summary,/30 seconds|arrive/);
});
test('model clinical priority is never downgraded to P5',()=>{
  const result=routing.validateAndGuard({...valid(),tier:'clinical',department:'Nursing',is_clinical:true,priority:5},'Please check on me.');
  assert.equal(result.priority,3); assert.equal(result.department,'Nursing');
});
test('AI errors visibly fall back; unknown meaning stays with nursing',async()=>{
  const result=await routing.classifyRequest('Something is wrong.',{}, {apiKey:'test-only',fetch:async()=>{throw new Error('outage');}});
  assert.equal(result.department,'Nursing'); assert.equal(result.source,'ai_fallback');
});
test('invalid JSON goes to nursing even on a normally routine input',async()=>{
  const result=await routing.classifyRequest('Can I get water?',{}, {apiKey:'test-only',fetch:async()=>({ok:true,json:async()=>({choices:[{message:{content:'not JSON'}}]})})});
  assert.equal(result.department,'Nursing'); assert.equal(result.source,'ai_fallback');
});
test('unknown multilingual input is never assumed safe because it mentions an English service',()=>{
  const result=routing.classifyLocal('Ninakosa pumzi and water please');
  assert.equal(result.department,'Nursing');
});
test('force clinical call button bypasses model and routes P1',async()=>{
  const result=await routing.classifyRequest('Emergency help requested using the urgent call button.',{forceClinical:true},{apiKey:'test-only',fetch:()=>{throw new Error('not called');}});
  assert.equal(result.priority,1); assert.equal(result.department,'Nursing');
});
test('multiple services become separate tasks, following the known routing policy',()=>{
  const local=routing.classifyLocal('My room is cold and the bathroom floor is sticky.');
  assert.equal(local.department,'Environmental Services'); assert.equal(local.secondary_request.department,'Facilities');
  const ai=routing.validateAndGuard({...valid(),department:'Facilities',summary:'Temperature request'},'My room is cold and the bathroom floor is sticky.');
  assert.equal(ai.department,'Environmental Services'); assert.equal(ai.secondary_request.department,'Facilities');
});
test('department is the source of truth for tier and clinical flag in the model schema',()=>{
  const value=valid(); delete value.tier; delete value.is_clinical;
  const result=routing.validateAndGuard(value,'Can I have water?');
  assert.equal(result.tier,'envops'); assert.equal(result.is_clinical,false); assert.equal(result.source,'ai');
});
test('non-urgent service summary does not trigger urgent symptom rules',()=>{
  for (const label of ['non-urgent','non‑urgent','non urgent']) {
    const value={...valid(),department:'Specialized Services',tier:'specialized',summary:'Patient requests a '+label+' interpreter.'};
    const result=routing.validateAndGuard(value,'I need an interpreter please.');
    assert.equal(result.department,'Specialized Services'); assert.equal(result.source,'ai');
  }
  const result=routing.validateAndGuard({...valid(),summary:'Non-urgent water request; patient also has chest pain.'},'Can I get water?');
  assert.equal(result.department,'Nursing');
  assert.equal(routing.classifyLocal('An urgent interpreter is needed.').department,'Nursing');
});
