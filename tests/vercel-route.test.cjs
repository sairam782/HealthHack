'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
test('Vercel API rewrite preserves the requested voice stage instead of reading a newer status',async()=>{
  let received;const context={module:{exports:{}},URL,require:()=>({createApplication:()=>({handler:req=>{received=req.url;}})})};
  vm.runInNewContext(fs.readFileSync(require.resolve('../api/index.js'),'utf8'),context);
  await context.module.exports({url:'/api/index?route=voice%2Fticket-id&stage=NEW',query:{route:'voice/ticket-id'}},{});
  assert.equal(received,'/api/voice/ticket-id?stage=NEW');
});
