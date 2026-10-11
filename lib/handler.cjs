'use strict';
const { randomUUID, createHash } = require('node:crypto');
const { performance } = require('node:perf_hooks');
const { createStore, initializeSchema } = require('./store.cjs');
const auth = require('./auth.cjs');
const routing = require('../routing.js');
const roles = require('./roles.cjs');
const {createVideoCalls}=require('./video-calls.cjs');
const {promptText}=require('./assistant-prompts.cjs');
const {createAwsServices,TRANSCRIBE_LANGUAGES}=require('./aws-services.cjs');
const {createExpertRouter,createSetFitExpert}=require('./expert-routing.cjs');

function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(body));
}
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
async function body(req) {
  const validate = value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'A JSON object is required.');
    return value;
  };
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      if (Buffer.byteLength(req.body) > 16000) throw new HttpError(413, 'Request is too large.');
      try { return validate(JSON.parse(req.body)); } catch (_) { throw new HttpError(400, 'Invalid JSON object.'); }
    }
    if (Buffer.byteLength(JSON.stringify(req.body)) > 16000) throw new HttpError(413, 'Request is too large.');
    return validate(req.body);
  }
  let data = '';
  for await (const part of req) {
    data += part.toString();
    if (Buffer.byteLength(data) > 16000) throw new HttpError(413, 'Request is too large.');
  }
  try { return validate(JSON.parse(data || '{}')); } catch (_) { throw new HttpError(400, 'Invalid JSON object.'); }
}
function checkOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin) {
    try { if (new URL(origin).host !== host) throw new Error('origin'); }
    catch (_) { throw new HttpError(403, 'Request origin is not allowed.'); }
  }
  if (req.headers['sec-fetch-site'] === 'cross-site') throw new HttpError(403, 'Cross-site requests are not allowed.');
}
function hydrate(row) {
  const {pain_details,intents,routing_checks,model_reviews,...fields}=row;
  return { ...fields, model_reviews:model_reviews?JSON.parse(model_reviews):[], pain:pain_details?JSON.parse(pain_details):null, intents:intents?JSON.parse(intents):[], routing_checks:routing_checks?JSON.parse(routing_checks):[], is_clinical: Boolean(row.is_clinical), safety_flags: JSON.parse(row.safety_flags), secondary_request: row.secondary_request ? JSON.parse(row.secondary_request) : null,
    status: row.resolved_at ? 'RESOLVED' : row.acknowledged_at ? 'ACKNOWLEDGED' : 'NEW' };
}
function scope(user) {
  if (user.role === 'patient') return { sql: 'patient_id = ?', args: [user.id] };
  if (user.viewAll) return { sql: '1 = 1', args: [] };
  if (user.role === 'staff') return { sql: 'department = ?', args: [user.department] };
  return { sql: '1 = 0', args: [] };
}
function publicTicket(row, user, related=[]) {
  const ticket = hydrate(row);
  ticket.related_tasks=related.filter(item=>item.parent_id===row.id).map(item=>({id:item.id,department:item.department,status:item.resolved_at?'RESOLVED':item.acknowledged_at?'ACKNOWLEDGED':'NEW'}));
  ticket.status_message = routing.patientMessage(ticket);
  if(user.role==='staff'&&!user.viewAll)ticket.intents=ticket.intents.filter(intent=>intent.department===ticket.department);
  delete ticket.request_key;
  ticket.canAct=roles.canAccept(user,ticket.department);
  // Staff receive only the task assigned to their department. A secondary task has its own text.
  if (user.role === 'patient') { delete ticket.reasoning; delete ticket.acknowledged_by; }
  if(!user.viewAll&&user.department!=='Nursing')delete ticket.model_reviews;
  return ticket;
}
function createApplication(config = {}) {
  const publicDeployment = config.publicDeployment ?? Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production');
  const databaseUrl = config.databaseUrl ?? process.env.DATABASE_URL;
  const demoPassword = config.demoPassword ?? (process.env.DEMO_PASSWORD || (publicDeployment ? null : 'kaalinga-demo'));
  if (publicDeployment && (!databaseUrl || !demoPassword)) throw new Error('Public hosting requires DATABASE_URL and DEMO_PASSWORD.');
  const store = config.store || createStore({ databaseUrl, filename: config.filename });
  const apiKey = config.apiKey ?? process.env.GROQ_API_KEY;
  const elevenKey = config.elevenKey ?? process.env.ELEVENLABS_API_KEY;
  const aiProvider=config.aiProvider||process.env.AI_PROVIDER||'groq';
  const voiceInputProvider=config.voiceInputProvider||process.env.VOICE_INPUT_PROVIDER||'browser';
  if(!['groq','bedrock','rules'].includes(aiProvider)||!['browser','aws'].includes(voiceInputProvider))throw new Error('Choose a valid AI_PROVIDER and VOICE_INPUT_PROVIDER.');
  const aws=aiProvider==='bedrock'||voiceInputProvider==='aws'?createAwsServices(config):null;
  const model = aiProvider==='bedrock'?aws.model:config.model || process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  const routingMode=config.routingMode||process.env.AI_ROUTING_MODE||'single';
  const secondaryProvider=config.secondaryProvider||process.env.AI_SECONDARY_PROVIDER||'groq';
  if(!['groq','setfit'].includes(secondaryProvider))throw new Error('Choose AI_SECONDARY_PROVIDER groq or setfit.');
  const primary=aiProvider==='rules'||(aiProvider==='groq'&&!apiKey)?null:{provider:aiProvider,model,config:{apiKey:aiProvider==='groq'?apiKey:null,classify:aiProvider==='bedrock'?aws.classify:null,model,fetch:config.fetch,timeoutMs:config.timeoutMs}};
  const secondKey=config.secondaryApiKey??apiKey,secondModel=config.secondaryModel||process.env.AI_SECONDARY_MODEL||'openai/gpt-oss-120b';
  const secondary=routingMode!=='ensemble'?null:secondaryProvider==='setfit'?createSetFitExpert({endpoint:config.setfitEndpoint??process.env.SETFIT_ENDPOINT_URL,token:config.setfitToken??process.env.SETFIT_API_TOKEN,fetch:config.fetch,publicDeployment}):secondKey?{provider:'groq',model:secondModel,config:{apiKey:secondKey,model:secondModel,fetch:config.fetch,timeoutMs:config.timeoutMs}}:null;
  if(routingMode==='ensemble'&&primary&&secondary&&primary.provider===secondary.provider&&primary.model===secondary.model)throw new Error('Use different primary and secondary experts.');
  const expertRouter=createExpertRouter({mode:routingMode,primary,secondary,budgetMs:config.expertBudgetMs});
  async function readVoice(res,text) {
    if(!elevenKey)throw new HttpError(503,'Voice readback is not configured.');
    const voiceId=process.env.ELEVENLABS_VOICE_ID||'21m00Tcm4TlvDq8ikWAM';
    if(!/^[a-zA-Z0-9]{16,64}$/.test(voiceId))throw new HttpError(503,'Voice configuration needs attention.');
    const response=await (config.fetch||fetch)('https://api.elevenlabs.io/v1/text-to-speech/'+voiceId,{
      method:'POST',signal:AbortSignal.timeout(8000),headers:{'xi-api-key':elevenKey,'Content-Type':'application/json'},
      body:JSON.stringify({text,model_id:'eleven_multilingual_v2',voice_settings:{stability:0.65,similarity_boost:0.75,speed:0.94}})
    });
    if(!response.ok)throw new HttpError(503,'Voice is temporarily unavailable. Check the on-screen request status.');
    res.writeHead(200,{'Content-Type':'audio/mpeg','Cache-Control':'no-store'});
    res.end(Buffer.from(await response.arrayBuffer()));
  }
  const videoCalls=createVideoCalls({store,publicDeployment,readVoice,turnUrls:config.turnUrls,turnSecret:config.turnSecret,demoVideo:config.demoVideo});
  let ready;
  async function initialize() {
    if (!ready) ready = (async () => {
      await initializeSchema(store);
      await auth.seedUsers(store, demoPassword);
    })().catch(error => { ready = null; throw error; });
    return ready;
  }
  function setCookie(res, token, clear = false) {
    res.setHeader('Set-Cookie', 'kaalinga_session=' + (clear ? '' : token) + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + (clear ? '0' : '28800') + (publicDeployment ? '; Secure' : ''));
  }
  async function roster(tx=store) {
    const result=await tx.query('SELECT u.*, r.on_shift, r.competencies FROM users u JOIN staffing r ON r.user_id = u.id ORDER BY u.id');
    return result.rows.map(auth.publicUser);
  }
  async function notifyCoverage(tx,ticket,user,result,now) {
    const staff=await roster(tx);
    const eligible=staff.filter(member=>roles.canAccept(member,result.department));
    const recipients=staff.filter(member=>member.on_shift && (eligible.some(candidate=>candidate.id===member.id) || member.id==='coordinator' || (member.id==='charge' && (result.is_clinical || eligible.length===0)) || (member.id==='manager' && eligible.length===0)));
    for (const recipient of recipients) await auth.notify(tx,recipient.id,ticket.id,(eligible.length===0?'No eligible on-shift responder · ':'')+(result.priority<=2?'Urgent · ':'')+user.room+' · '+result.summary,now);
  }
  async function escalateOverdue() {
    await store.transaction(async tx=>{
      const cutoff=new Date(Date.now()-30000).toISOString();
      const candidates=await tx.query("SELECT * FROM tickets WHERE (department = 'Nursing' OR source = 'clinical_escalation') AND priority <= 2 AND acknowledged_at IS NULL AND resolved_at IS NULL AND created_at < ?",[cutoff]);
      const leaders=(await roster(tx)).filter(member=>member.on_shift && ['charge','manager'].includes(member.id));
      for(const ticket of candidates.rows) {
        if(Date.now()-Date.parse(ticket.created_at)<(ticket.priority===1?30000:120000) || !leaders.length) continue;
        const prior=await tx.query("SELECT id FROM audit WHERE ticket_id = ? AND action = 'ESCALATED'",[ticket.id]);
        if(prior.rows.length) continue;
        const now=new Date().toISOString();
        for(const leader of leaders) await auth.notify(tx,leader.id,ticket.id,'Overdue P'+ticket.priority+' · '+ticket.room+' · '+ticket.department+' acknowledgement required.',now);
        await tx.query('INSERT INTO audit (id, ticket_id, actor_id, action, created_at) VALUES (?, ?, ?, ?, ?)',[randomUUID(),ticket.id,'system','ESCALATED',now]);
      }
    });
  }
  async function createTicket(tx, user, text, result, key, latency, now, parentId = null, actorId = user.id) {
    const id = randomUUID();
    const fields = ['id', 'patient_id', 'room', 'original_text', 'summary', 'tier', 'priority', 'department', 'responder', 'is_clinical', 'confidence', 'reasoning', 'patient_summary', 'detected_language', 'source', 'safety_flags', 'secondary_request', 'parent_id', 'created_at', 'classification_ms', 'request_key','pain_details','intents','routing_checks','model_reviews'];
    const values = [id, user.id, user.room, text, result.summary, result.tier, result.priority, result.department, result.responder, Number(result.is_clinical), result.confidence, result.reasoning, result.patient_summary, result.detected_language, result.source, JSON.stringify(result.safety_flags), result.secondary_request ? JSON.stringify(result.secondary_request) : null, parentId, now, latency, key,result.pain?JSON.stringify(result.pain):null,JSON.stringify(result.intents||[]),JSON.stringify(result.routing_checks||[]),JSON.stringify(result.model_reviews||[])];
    await tx.query('INSERT INTO tickets (' + fields.join(', ') + ') VALUES (' + fields.map(() => '?').join(', ') + ')', values);
    await tx.query('INSERT INTO audit (id, ticket_id, actor_id, action, created_at) VALUES (?, ?, ?, ?, ?)', [randomUUID(), id, actorId, 'CREATED', now]);
    const row = (await tx.query('SELECT * FROM tickets WHERE id = ?', [id])).rows[0];
    await notifyCoverage(tx,row,user,result,now);
    return row;
  }
  async function createMedicalEscalation(tx,user,text,result,key,now,parentId) {
    // Demo emergency policy: a separate medical response accompanies the Nursing task.
    // This is server-controlled; the model cannot dispatch physician consultations.
    if(result.department!=='Nursing'||!result.is_clinical||result.priority!==1)return null;
    const target=roles.REFERRAL_TARGETS.find(item=>item.department==='Medical Team');
    const medical={...result,department:target.department,responder:target.responder,
      summary:'Emergency clinical assessment · '+result.summary,
      source:'clinical_escalation',confidence:null,reasoning:'Automatic P1 Medical Team escalation; Nursing retains its own response task.',
      intents:(result.intents||[]).filter(intent=>intent.department==='Nursing').map(intent=>({...intent,department:target.department})),
      secondary_request:null,additional_requests:[],routing_checks:['emergency_medical_escalation','department_policy']};
    const row=await createTicket(tx,user,text,medical,key+':medical',0,now,parentId,'system');
    await tx.query('INSERT INTO audit (id, ticket_id, actor_id, action, created_at) VALUES (?, ?, ?, ?, ?)',[randomUUID(),row.id,'system','MEDICAL_ESCALATED',now]);
    return row;
  }
  async function handler(req, res) {
    try {
      await initialize();
      const url = new URL(req.url, 'http://localhost');
      const pathname = url.pathname;
      if (['POST', 'PATCH', 'DELETE'].includes(req.method)) checkOrigin(req);
      if (req.method === 'GET' && pathname === '/api/config') {
        return json(res, 200, { aiConfigured: aiProvider==='bedrock'||(aiProvider==='groq'&&Boolean(apiKey)), aiProvider, routingMode:expertRouter.mode, routingExperts:expertRouter.experts, voiceConfigured: Boolean(elevenKey), model: aiProvider==='bedrock'||(aiProvider==='groq'&&apiKey)?model:null,
          voiceInputProvider, voiceInputLanguages:voiceInputProvider==='aws'?TRANSCRIBE_LANGUAGES:null,
          storage: store.kind, localDemo: !publicDeployment, videoConfigured:videoCalls.available, videoNetwork:videoCalls.network,
          accounts: auth.DEMO_USERS.map(auth.publicUser), roleGroups:roles.groups, staffRoles:roles.ROLES, referralTargets:roles.REFERRAL_TARGETS });
      }
      if (req.method === 'POST' && pathname === '/api/login') {
        const input = await body(req);
        if (typeof input.email !== 'string' || typeof input.password !== 'string' || input.password.length > 200) throw new HttpError(400, 'Email and password are required.');
        const email = input.email.trim().toLowerCase();
        const accountKey = createHash('sha256').update(email).digest('hex');
        const recent = new Date(Date.now() - 15 * 60000).toISOString();
        const attempts = await store.query('SELECT COUNT(*) AS total FROM login_attempts WHERE account_key = ? AND created_at > ?', [accountKey, recent]);
        if (Number(attempts.rows[0].total) >= 10) throw new HttpError(429, 'Too many sign-in attempts. Try again in 15 minutes.');
        const result = await store.query('SELECT * FROM users WHERE email = ?', [email]);
        if (!result.rows[0] || !auth.verifyPassword(input.password, result.rows[0].password_hash)) {
          await store.query('INSERT INTO login_attempts (id, account_key, created_at) VALUES (?, ?, ?)', [randomUUID(), accountKey, new Date().toISOString()]);
          throw new HttpError(401, 'Check your account and password.');
        }
        await store.query('DELETE FROM login_attempts WHERE account_key = ?', [accountKey]);
        setCookie(res, await auth.createSession(store, result.rows[0].id));
        return json(res, 200, { user: auth.publicUser(result.rows[0]) });
      }
      const user = await auth.getUser(store, req);
      if (!user) throw new HttpError(401, 'Sign in to continue.');
      if(req.method==='POST'&&pathname==='/api/transcribe/session'){
        if(user.role!=='patient')throw new HttpError(403,'Patient access required.');
        if(voiceInputProvider!=='aws')throw new HttpError(503,'AWS transcription is not configured.');
        const input=await body(req);
        if(!TRANSCRIBE_LANGUAGES.includes(input.language))throw new HttpError(400,'Choose a supported transcription language.');
        const recent=new Date(Date.now()-5*60000).toISOString();
        await store.transaction(async tx=>{
          await tx.query('DELETE FROM speech_sessions WHERE created_at < ?',[new Date(Date.now()-24*60*60000).toISOString()]);
          const count=(await tx.query('SELECT COUNT(*) AS total FROM speech_sessions WHERE user_id = ? AND created_at > ?',[user.id,recent])).rows[0].total;
          if(Number(count)>=30)throw new HttpError(429,'Voice session limit reached. Please wait or use a typed request.');
          await tx.query('INSERT INTO speech_sessions (id,user_id,created_at) VALUES (?,?,?)',[randomUUID(),user.id,new Date().toISOString()]);
        });
        try{return json(res,200,await aws.transcribeSession(input.language));}
        catch(error){if(error.status===400)throw error;throw new HttpError(503,'AWS voice input is unavailable. Check the server AWS identity and Transcribe permission.');}
      }
      if(req.method==='POST'&&pathname==='/api/assistant/voice'){
        if(user.role!=='patient')throw new HttpError(403,'Patient access required.');
        const input=await body(req);
        let ticket=null;
        if(['pain_notified','pain_followup_retry','pain_saved','pain_skipped','pain_escalated'].includes(input.prompt)){
          const row=(await store.query('SELECT * FROM tickets WHERE id = ?',[typeof input.ticketId==='string'?input.ticketId:''])).rows[0];
          if(!row||row.patient_id!==user.id||row.department!=='Nursing'||!row.pain_details)throw new HttpError(404,'Pain request not found.');
          ticket=hydrate(row);
        }
        const text=promptText(input,ticket);
        if(!text)throw new HttpError(400,'Choose a valid assistant prompt and request.');
        await readVoice(res,text);return;
      }
      if(await videoCalls.handle(req,res,user,url,{json,body}))return;
      if(req.method==='GET' && pathname==='/api/roster') {
        if(user.role==='patient') throw new HttpError(403,'Staff access required.');
        return json(res,200,{userId:user.id,roster:await roster(),canManage:user.manageRoster});
      }
      const rosterMatch=pathname.match(/^\/api\/roster\/([a-z-]+)$/);
      if(req.method==='PATCH' && rosterMatch) {
        if(!user.manageRoster) throw new HttpError(403,'Charge nurse or unit leadership access required.');
        const input=await body(req);
        if(typeof input.on_shift!=='boolean' || !roles.ROLES.some(role=>role.id===rosterMatch[1])) throw new HttpError(400,'A valid staff account and shift state are required.');
        await store.transaction(async tx=>{
          const previous=(await roster(tx)).find(member=>member.id===rosterMatch[1]);
          await tx.query('UPDATE staffing SET on_shift = ? WHERE user_id = ?',[Number(input.on_shift),rosterMatch[1]]);
          if(input.on_shift && !previous.on_shift) {
            const member=(await roster(tx)).find(item=>item.id===rosterMatch[1]);
            const waiting=await tx.query('SELECT * FROM tickets WHERE department = ? AND acknowledged_at IS NULL AND resolved_at IS NULL',[member.department]);
            for(const ticket of waiting.rows) if(roles.canAccept(member,ticket.department)) await auth.notify(tx,member.id,ticket.id,'Waiting request · '+ticket.room+' · '+ticket.summary,new Date().toISOString());
          }
        });
        return json(res,200,{roster:await roster()});
      }
      if (req.method === 'GET' && pathname === '/api/me') return json(res, 200, { user });
      if (req.method === 'POST' && pathname === '/api/logout') {
        const token = auth.cookie(req);
        if (token) await store.query('DELETE FROM sessions WHERE id = ?', [auth.hashSession(token)]);
        setCookie(res, '', true);
        return json(res, 200, { ok: true });
      }
      if (req.method === 'GET' && pathname === '/api/tickets') {
        await escalateOverdue();
        const access = scope(user);
        const tickets = await store.query('SELECT * FROM tickets WHERE ' + access.sql + ' ORDER BY created_at DESC', access.args);
        const notifications = await store.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [user.id]);
        const referrals=await store.query("SELECT parent_id, department, acknowledged_at, resolved_at FROM tickets WHERE source = 'staff_referral'");
        const linked=await store.query("SELECT id,parent_id,department,acknowledged_at,resolved_at FROM tickets WHERE source IN ('secondary_task','clinical_escalation') AND parent_id IN (SELECT id FROM tickets WHERE "+access.sql+")",access.args);
        return json(res, 200, { user, tickets: tickets.rows.map(row => ({...publicTicket(row,user,linked.rows),referrals:referrals.rows.filter(item=>item.parent_id===row.id).map(item=>({department:item.department,status:item.resolved_at?'RESOLVED':item.acknowledged_at?'ACKNOWLEDGED':'NEW'}))})), notifications: notifications.rows, serverTime: new Date().toISOString() });
      }
      const referralMatch=pathname.match(/^\/api\/tickets\/([a-f0-9-]{36})\/referrals$/);
      if(req.method==='POST' && referralMatch) {
        if(!user.canRefer || !user.on_shift) throw new HttpError(403,'An on-shift nurse or referral coordinator must arrange referrals.');
        const input=await body(req);
        const target=roles.REFERRAL_TARGETS.find(item=>item.department===input.department);
        if(!target) throw new HttpError(400,'Choose a supported consultation service.');
        if(target.clinical && (!user.clinicalReferrals || !roles.canAccept(user,'Nursing'))) throw new HttpError(403,'An eligible registered nurse must arrange this clinical consultation.');
        if(typeof input.note!=='string' || !input.note.trim() || input.note.length>500) throw new HttpError(400,'Enter a referral note of 1–500 characters.');
        const created=await store.transaction(async tx=>{
          const parent=(await tx.query('SELECT * FROM tickets WHERE id = ?',[referralMatch[1]])).rows[0];
          if(!parent || !auth.canSee(user,parent)) throw new HttpError(404,'Ticket not found.');
          if(parent.resolved_at) throw new HttpError(409,'This request is already complete.');
          const key='referral:'+parent.id+':'+target.department;
          if(target.department==='Medical Team') {
            const automatic=(await tx.query("SELECT * FROM tickets WHERE parent_id = ? AND source = 'clinical_escalation'",[parent.id])).rows[0];
            if(automatic)return automatic;
          }
          const existing=(await tx.query('SELECT * FROM tickets WHERE request_key = ?',[key])).rows[0];
          if(existing) return existing;
          const patient=(await tx.query('SELECT * FROM users WHERE id = ?',[parent.patient_id])).rows[0];
          const summary=input.note.trim();
          const result={tier:target.tier,department:target.department,responder:target.responder,priority:target.clinical?Math.min(parent.priority,3):4,is_clinical:target.clinical,confidence:null,summary,patient_summary:parent.patient_summary,detected_language:parent.detected_language,reasoning:'Staff-arranged consultation, not automatic call-bell dispatch.',source:'staff_referral',safety_flags:[],secondary_request:null};
          const ticket=await createTicket(tx,patient,summary,result,key,0,new Date().toISOString(),parent.id,user.id);
          await tx.query('INSERT INTO audit (id, ticket_id, actor_id, action, created_at) VALUES (?, ?, ?, ?, ?)',[randomUUID(),ticket.id,user.id,'REFERRED',new Date().toISOString()]);
          await auth.notify(tx,patient.id,ticket.id,'Your care team requested support from '+target.department+'.',new Date().toISOString());
          return ticket;
        });
        return json(res,201,{ticket:publicTicket(created,user)});
      }
      if (req.method === 'POST' && pathname === '/api/requests') {
        if (user.role !== 'patient') throw new HttpError(403, 'Only patient accounts can submit a call bell request.');
        const input = await body(req);
        if (typeof input.text !== 'string' || !input.text.trim() || input.text.length > 2000) throw new HttpError(400, 'Enter a request of 1–2000 characters.');
        if (typeof input.requestKey !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(input.requestKey)) throw new HttpError(400, 'A valid request identifier is required.');
        if(input.painScore!==undefined&&input.painScore!==null&&(!Number.isInteger(input.painScore)||input.painScore<1||input.painScore>10))throw new HttpError(400,'Choose a whole-number pain score from 1 to 10, or leave it unanswered.');
        if(input.painLocation!==undefined&&(typeof input.painLocation!=='string'||input.painLocation.length>80))throw new HttpError(400,'Pain location must be text of at most 80 characters.');
        if(input.painWorsening!==undefined&&typeof input.painWorsening!=='boolean')throw new HttpError(400,'Pain change must be true or false.');
        const language = typeof input.language === 'string' && /^[a-z]{2}(?:-[A-Z]{2})?$/.test(input.language) ? input.language : 'en-US';
        const key = user.id + ':' + input.requestKey;
        const existing = await store.query('SELECT * FROM tickets WHERE request_key = ?', [key]);
        const responseTickets=async(row,duplicate=false)=>{
          const linked=(await store.query("SELECT * FROM tickets WHERE parent_id = ? AND source IN ('secondary_task','clinical_escalation') ORDER BY department",[row.id])).rows;
          const primary=publicTicket(row,user,linked);
          return {ticket:primary,tickets:[primary,...linked.map(task=>publicTicket(task,user))],...(duplicate?{duplicate:true}:{})};
        };
        if (existing.rows[0]) return json(res, 200, await responseTickets(existing.rows[0],true));
        const start = performance.now();
        const result = await expertRouter.classify(input.text.trim(), { language, forceClinical: input.forceClinical === true,painScore:input.painScore,painLocation:input.painLocation,painWorsening:input.painWorsening });
        const latency = Math.round((performance.now() - start) * 10) / 10;
        const now = new Date().toISOString();
        const saved = await store.transaction(async tx => {
          const retry = await tx.query('SELECT * FROM tickets WHERE request_key = ?', [key]);
          if (retry.rows[0]) return retry.rows[0];
          const primary = await createTicket(tx, user, input.text.trim(), result, key, latency, now);
          const tasks=result.additional_requests??(result.secondary_request?[result.secondary_request]:[]);
          const linked=[];
          const medical=await createMedicalEscalation(tx,user,input.text.trim(),result,key,now,primary.id);
          if(medical)linked.push(medical);
          for (const secondary of tasks) {
            const secondaryResult = { ...routing.classifyLocal(secondary.summary, { language }), ...secondary,
              responder: routing.ROUTES[secondary.department].responder, priority: secondary.department==='Bedside Care'?3:secondary.department==='Unit Clerk'?5:4, is_clinical: false, confidence: null,
              patient_summary: routing.readback(routing.detectLanguage(input.text, language), false),
              detected_language: result.detected_language, reasoning: 'Service task separated from the primary request.',
              source: 'secondary_task', safety_flags: [], secondary_request: null,model_reviews:[],pain:null,intents:secondary.intents||[],routing_checks:['department_policy','service_text_only'] };
            // Only service text reaches the operational team; the clinical concern stays with nursing.
            linked.push(await createTicket(tx, user, secondary.summary, secondaryResult, key + ':secondary:'+secondary.department, 0, now, primary.id));
          }
          await auth.notify(tx, user.id, primary.id, routing.patientMessage(publicTicket(primary,user,linked), 'NEW'), now);
          return primary;
        });
        return json(res, 201, await responseTickets(saved));
      }
      const painMatch=pathname.match(/^\/api\/tickets\/([a-f0-9-]{36})\/pain$/);
      if(req.method==='PATCH'&&painMatch){
        if(user.role!=='patient')throw new HttpError(403,'Only the patient can report their pain.');
        const input=await body(req);
        if(input.painScore!==undefined&&(!Number.isInteger(input.painScore)||input.painScore<1||input.painScore>10))throw new HttpError(400,'Choose a whole-number pain score from 1 to 10.');
        if(input.painLocation!==undefined&&(typeof input.painLocation!=='string'||input.painLocation.length>80))throw new HttpError(400,'Pain location must be text of at most 80 characters.');
        if(input.painWorsening!==undefined&&typeof input.painWorsening!=='boolean')throw new HttpError(400,'Pain change must be true or false.');
        if(input.context!==undefined&&(typeof input.context!=='string'||input.context.length>500))throw new HttpError(400,'Pain follow-up must be text of at most 500 characters.');
        if(!['painScore','painLocation','painWorsening','context'].some(key=>input[key]!==undefined))throw new HttpError(400,'Provide a pain update.');
        if(!Number.isInteger(input.revision)||input.revision<0)throw new HttpError(400,'Provide the current pain revision.');
        const saved=await store.transaction(async tx=>{
          const row=(await tx.query('SELECT * FROM tickets WHERE id = ?',[painMatch[1]])).rows[0];
          if(!row||row.patient_id!==user.id||row.department!=='Nursing'||!row.pain_details)throw new HttpError(404,'Pain request not found.');
          if(row.resolved_at)throw new HttpError(409,'This request is complete. Send a new request if you need help again.');
          const previous=hydrate(row),old=previous.pain;
          const options={painScore:input.painScore??old.score,painLocation:input.painLocation??old.location,painWorsening:input.painWorsening??old.worsening,language:row.detected_language};
          const context=input.context?.trim()||old.followup_text||'';
          // Retain all original red flags; a follow-up can raise urgency, never lower it.
          const result=routing.classifyLocal(row.original_text+(context?' '+context:''),options);
          const next={...result.pain,followup_text:context};
          if(['score','location','worsening','followup_text'].every(key=>next[key]===(old[key]??(key==='followup_text'? '':undefined))))return row;
          if(input.revision!==(old.revision||0))throw new HttpError(409,'This pain report changed. Refresh before updating it again.');
          const now=new Date().toISOString();next.revision=(old.revision||0)+1;next.updated_at=now;
          const priority=Math.min(row.priority,result.priority);
          const flags=[...new Set([...previous.safety_flags.filter(flag=>!/^pain_(?:score_not_provided|mild|moderate|severe|scores_differ|new_or_worsening)$/.test(flag)),...result.safety_flags])];
          const intents=previous.intents.map(intent=>intent.kind==='pain'?{...intent,summary:result.summary}:intent);
          await tx.query('UPDATE tickets SET pain_details = ?, summary = ?, priority = ?, safety_flags = ?, intents = ? WHERE id = ?',[JSON.stringify(next),result.summary,priority,JSON.stringify(flags),JSON.stringify(intents),row.id]);
          const updated=(await tx.query('SELECT * FROM tickets WHERE id = ?',[row.id])).rows[0];
          await notifyCoverage(tx,updated,user,{...result,priority,summary:'Pain update · '+result.summary},now);
          const medical=(await tx.query("SELECT * FROM tickets WHERE parent_id = ? AND source = 'clinical_escalation'",[row.id])).rows[0];
          if(priority===1&&!medical)await createMedicalEscalation(tx,user,row.original_text,{...result,priority},row.request_key,now,row.id);
          if(medical){
            await tx.query('UPDATE tickets SET pain_details = ?, summary = ? WHERE id = ?',[JSON.stringify(next),'Emergency clinical assessment · '+result.summary,medical.id]);
            if(!medical.resolved_at)await notifyCoverage(tx,medical,user,{...result,department:'Medical Team',priority,summary:'Pain update · '+result.summary},now);
          }
          await tx.query('INSERT INTO audit (id, ticket_id, actor_id, action, created_at) VALUES (?, ?, ?, ?, ?)',[randomUUID(),row.id,user.id,'PAIN_UPDATED',now]);
          return updated;
        });
        const linked=(await store.query("SELECT * FROM tickets WHERE parent_id = ? AND source IN ('secondary_task','clinical_escalation')",[saved.id])).rows;
        return json(res,200,{ticket:publicTicket(saved,user,linked)});
      }
      const ticketMatch = pathname.match(/^\/api\/tickets\/([a-f0-9-]{36})$/);
      if (req.method === 'PATCH' && ticketMatch) {
        if (user.role === 'patient') throw new HttpError(403, 'Staff acknowledgement is required.');
        const input = await body(req);
        if (!['acknowledge', 'resolve'].includes(input.action)) throw new HttpError(400, 'Unknown ticket action.');
        const updated = await store.transaction(async tx => {
          const row = (await tx.query('SELECT * FROM tickets WHERE id = ?', [ticketMatch[1]])).rows[0];
          if (!row || !auth.canSee(user, row)) throw new HttpError(404, 'Ticket not found.');
          if(!roles.canAccept(user,row.department)) throw new HttpError(403,'Only an eligible on-shift responder can accept or complete this task.');
          if (row.resolved_at || (input.action === 'acknowledge' && row.acknowledged_at)) return row;
          if (input.action === 'resolve' && !row.acknowledged_at) throw new HttpError(409, 'Acknowledge the request before resolving it.');
          const now = new Date().toISOString();
          if (input.action === 'acknowledge') await tx.query('UPDATE tickets SET acknowledged_at = ?, acknowledged_by = ? WHERE id = ?', [now, user.id, row.id]);
          else await tx.query('UPDATE tickets SET resolved_at = ? WHERE id = ?', [now, row.id]);
          await tx.query('INSERT INTO audit (id, ticket_id, actor_id, action, created_at) VALUES (?, ?, ?, ?, ?)', [randomUUID(), row.id, user.id, input.action.toUpperCase(), now]);
          const message = routing.patientMessage(row, input.action === 'acknowledge' ? 'ACKNOWLEDGED' : 'RESOLVED');
          await auth.notify(tx, row.patient_id, row.id, message, now);
          return (await tx.query('SELECT * FROM tickets WHERE id = ?', [row.id])).rows[0];
        });
        return json(res, 200, { ticket: publicTicket(updated, user) });
      }
      if (req.method === 'POST' && pathname === '/api/notifications/read') {
        await store.query('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL', [new Date().toISOString(), user.id]);
        return json(res, 200, { ok: true });
      }
      const voiceMatch = pathname.match(/^\/api\/voice\/([a-f0-9-]{36})$/);
      if (req.method === 'GET' && voiceMatch) {
        if (!elevenKey) throw new HttpError(503, 'Voice readback is not configured.');
        const ticket = (await store.query('SELECT * FROM tickets WHERE id = ?', [voiceMatch[1]])).rows[0];
        if (!ticket || !auth.canSee(user, ticket)) throw new HttpError(404, 'Ticket not found.');
        const stage = new URL(req.url, 'http://localhost').searchParams.get('stage') || (ticket.resolved_at ? 'RESOLVED' : ticket.acknowledged_at ? 'ACKNOWLEDGED' : 'NEW');
        if (!['NEW', 'ACKNOWLEDGED', 'RESOLVED'].includes(stage)) throw new HttpError(400, 'Unknown voice update.');
        if ((stage === 'ACKNOWLEDGED' && !ticket.acknowledged_at) || (stage === 'RESOLVED' && !ticket.resolved_at)) throw new HttpError(409, 'That staff update has not happened yet.');
        const linked=stage==='NEW'?(await store.query("SELECT id,parent_id,department,acknowledged_at,resolved_at FROM tickets WHERE parent_id = ? AND source IN ('secondary_task','clinical_escalation')",[ticket.id])).rows:[];
        return await readVoice(res,routing.patientMessage(publicTicket(ticket,user,linked),stage));
      }
      throw new HttpError(404, 'Endpoint not found.');
    } catch (error) {
      if (!res.headersSent) json(res, error.status || 500, { error: error.status ? error.message : 'The service is temporarily unavailable. Please retry.' });
      else res.end();
      if (!error.status) console.error('Request failed:', error.code || error.name); // Never log credentials or patient input.
    }
  }
  return { handler, initialize, store, close: () => {aws?.close();return store.close();} };
}
module.exports = { createApplication };
