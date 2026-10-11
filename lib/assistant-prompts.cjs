'use strict';
const assistant=require('../patient-assistant.js');
const routing=require('../routing.js');
function promptText(input,ticket=null){return assistant.promptText(input,typeof input.text==='string'?routing.classifyLocal(input.text,{language:input.language||'en-US'}):null,ticket);}
module.exports={promptText};
