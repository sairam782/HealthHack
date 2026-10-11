'use strict';
const {randomUUID}=require('node:crypto');
const {BedrockRuntimeClient,ConverseCommand}=require('@aws-sdk/client-bedrock-runtime');
const {defaultProvider}=require('@aws-sdk/credential-provider-node');
const {SignatureV4}=require('@smithy/signature-v4');const {HttpRequest}=require('@smithy/protocol-http');const {Sha256}=require('@aws-crypto/sha256-js');
const TRANSCRIBE_LANGUAGES=['en-US','es-ES','hi-IN','fr-FR','pt-BR','zh-CN','ar-SA','ko-KR','tl-PH','pl-PL','de-DE','ja-JP'];
function createAwsServices(config={}){
 const region=config.awsRegion||process.env.AWS_REGION||process.env.AWS_DEFAULT_REGION||'us-east-1';
 if(!['us-east-1','us-west-2'].includes(region))throw new Error('Choose supported AWS region us-east-1 or us-west-2.');
 const model=config.bedrockModel||process.env.BEDROCK_MODEL_ID||'us.amazon.nova-2-lite-v1:0';
 const bedrockToken=config.bedrockToken??process.env.AWS_BEARER_TOKEN_BEDROCK;
 const credentials=config.awsCredentials||defaultProvider();let client=config.bedrockClient;
 async function classify({text,language,systemPrompt,schema}){
  client=client||new BedrockRuntimeClient({region,maxAttempts:1,...(bedrockToken?{token:{token:bedrockToken},authSchemePreference:['httpBearerAuth']}:{credentials}),...(config.bedrockRequestHandler?{requestHandler:config.bedrockRequestHandler}:{})});
  const response=await client.send(new ConverseCommand({modelId:model,system:[{text:systemPrompt}],messages:[{role:'user',content:[{text:JSON.stringify({request:text,preferred_language:language})}]}],inferenceConfig:{temperature:0,maxTokens:2400},toolConfig:{tools:[{toolSpec:{name:'call_bell_route',description:'Return every patient intent with exact source evidence and its department. This does not notify staff or perform an action.',inputSchema:{json:schema}}}],toolChoice:{tool:{name:'call_bell_route'}}}}),{abortSignal:AbortSignal.timeout(config.timeoutMs||6000)});
  const blocks=response.output?.message?.content||[];
  const tools=blocks.filter(block=>block.toolUse);
  if(response.stopReason!=='tool_use'||tools.length!==1||tools[0].toolUse.name!=='call_bell_route')throw Object.assign(new Error('Invalid Bedrock classification'),{code:'bedrock_invalid_response'});
  return tools[0].toolUse.input;
 }
 async function transcribeSession(language){
  if(!TRANSCRIBE_LANGUAGES.includes(language))throw Object.assign(new Error('Choose a supported transcription language.'),{status:400});
  const hostname='transcribestreaming.'+region+'.amazonaws.com';
  const signer=new SignatureV4({service:'transcribe',region,credentials,sha256:Sha256});
  const signed=await signer.presign(new HttpRequest({protocol:'https:',hostname,port:8443,method:'GET',path:'/stream-transcription-websocket',headers:{host:hostname+':8443'},query:{'language-code':language,'media-encoding':'pcm','sample-rate':'16000','session-id':randomUUID()},body:''}),{expiresIn:60});
  const query=new URLSearchParams(signed.query).toString();
  return {url:'wss://'+hostname+':8443'+signed.path+'?'+query,language,sampleRate:16000,maxDurationMs:60000};
 }
 function close(){client?.destroy?.();}
 return {region,model,classify,transcribeSession,close};
}
module.exports={createAwsServices,TRANSCRIBE_LANGUAGES};
