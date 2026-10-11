'use strict';
const {randomUUID,createHmac}=require('node:crypto');
const auth=require('./auth.cjs');
const roles=require('./roles.cjs');
const ACTIVE=['RINGING','ACCEPTED','CONNECTED'];
const invitation={
  English:'Your nurse would like to speak with you. Accept the video call, choose audio only, or decline. Your camera stays off until you choose to join.',
  Spanish:'Su enfermera desea hablar con usted. Acepte la videollamada, elija solo audio o rechace la llamada. La cámara permanece apagada hasta que decida unirse.',
  Hindi:'नर्स आपसे बात करना चाहती हैं। वीडियो कॉल स्वीकार करें, केवल आवाज़ चुनें या मना करें। आपके शामिल होने तक कैमरा बंद रहेगा।',
  French:'Votre infirmière souhaite vous parler. Acceptez l’appel vidéo, choisissez uniquement l’audio ou refusez. Votre caméra reste éteinte jusqu’à votre accord.'
};
const fail=(status,message)=>{const error=new Error(message);error.status=status;throw error;};
function canCall(user){return ['nurse','charge'].includes(user.id)&&roles.canAccept(user,'Nursing');}
function relayConfig(options={}){
  const urls=(options.turnUrls ?? process.env.WEBRTC_TURN_URLS ?? '').split(',').map(url=>url.trim()).filter(Boolean);
  const secret=options.turnSecret ?? process.env.WEBRTC_TURN_SHARED_SECRET;
  if(urls.some(url=>!/^turns?:[a-zA-Z0-9.\[\]:-]+(?:\?transport=(?:udp|tcp))?$/.test(url))) fail(503,'TURN relay configuration needs attention.');
  return {configured:Boolean(urls.length&&secret),urls,secret};
}
function createVideoCalls({store,publicDeployment=false,readVoice,turnUrls,turnSecret,demoVideo}){
  const relay=relayConfig({turnUrls,turnSecret});
  const directDemo=(demoVideo??process.env.WEBRTC_DEMO_MODE)==='true'||demoVideo===true;
  const network=relay.configured?'relay':directDemo?'demo-direct':publicDeployment?'disabled':'local';
  const available=!publicDeployment||relay.configured||directDemo;
  function iceServers(user,call){
    if(!relay.configured)return directDemo?[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}]:[];
    const username=Math.floor(Date.now()/1000+1800)+':'+user.id+':'+call.id;
    return [{urls:relay.urls,username,credential:createHmac('sha1',relay.secret).update(username).digest('base64')}];
  }
  async function expire(tx){
    const now=new Date().toISOString();
    const expired=(await tx.query("SELECT * FROM video_calls WHERE status IN ('RINGING','ACCEPTED','CONNECTED') AND expires_at < ?",[now])).rows;
    for(const call of expired){
      await tx.query("UPDATE video_calls SET status = 'EXPIRED', updated_at = ?, ended_at = ? WHERE id = ?",[now,now,call.id]);
      await tx.query('DELETE FROM video_signals WHERE call_id = ?',[call.id]);
      await tx.query('INSERT INTO audit (id,ticket_id,actor_id,action,created_at) VALUES (?,?,?,?,?)',[randomUUID(),call.ticket_id,'system','VIDEO_EXPIRED',now]);
    }
  }
  async function getCall(tx,id,user){
    const call=(await tx.query('SELECT * FROM video_calls WHERE id = ?',[id])).rows[0];
    if(!call || ![call.patient_id,call.nurse_id].includes(user.id))fail(404,'Call not found.');
    return call;
  }
  async function view(call,tx=store){
    const ticket=(await tx.query('SELECT room, detected_language FROM tickets WHERE id = ?',[call.ticket_id])).rows[0];
    return {...call,room:ticket.room,network,nurse_name:roles.ROLES.find(role=>role.id===call.nurse_id)?.title||'Nurse',invitation_message:invitation[ticket.detected_language]||invitation.English};
  }
  async function handle(req,res,user,url,{json,body}){
    if(!url.pathname.startsWith('/api/calls'))return false;
    if(url.pathname==='/api/calls'&&req.method==='GET'){
      const calls=await store.transaction(async tx=>{await expire(tx);return (await tx.query('SELECT * FROM video_calls WHERE patient_id = ? OR nurse_id = ? ORDER BY created_at DESC LIMIT 10',[user.id,user.id])).rows;});
      json(res,200,{userId:user.id,calls:await Promise.all(calls.map(call=>view(call)))});return true;
    }
    if(url.pathname==='/api/calls'&&req.method==='POST'){
      if(!available)fail(503,'Video calls need a configured TURN relay on public hosting.');
      if(!canCall(user))fail(403,'An eligible on-shift RN or charge nurse must offer this call.');
      const input=await body(req);
      const created=await store.transaction(async tx=>{
        await expire(tx);
        const ticket=(await tx.query('SELECT * FROM tickets WHERE id = ?',[typeof input.ticketId==='string'?input.ticketId:''])).rows[0];
        if(!ticket||!auth.canSee(user,ticket))fail(404,'Request not found.');
        if(ticket.department!=='Nursing'||ticket.parent_id||ticket.resolved_at)fail(409,'Offer a call from an open primary Nursing request.');
        if(!ticket.acknowledged_at)fail(409,'Acknowledge the request before offering a call.');
        const busy=(await tx.query("SELECT id FROM video_calls WHERE status IN ('RINGING','ACCEPTED','CONNECTED') AND (patient_id = ? OR nurse_id = ?)",[ticket.patient_id,user.id])).rows;
        if(busy.length)fail(409,'The patient or nurse already has an active call.');
        const id=randomUUID(),now=new Date().toISOString();
        await tx.query('INSERT INTO video_calls (id,ticket_id,patient_id,nurse_id,status,created_at,updated_at,expires_at) VALUES (?,?,?,?,?,?,?,?)',[id,ticket.id,ticket.patient_id,user.id,'RINGING',now,now,new Date(Date.now()+90000).toISOString()]);
        await auth.notify(tx,ticket.patient_id,ticket.id,invitation[ticket.detected_language]||invitation.English,now);
        await tx.query('INSERT INTO audit (id,ticket_id,actor_id,action,created_at) VALUES (?,?,?,?,?)',[randomUUID(),ticket.id,user.id,'VIDEO_INVITED',now]);
        return view((await tx.query('SELECT * FROM video_calls WHERE id = ?',[id])).rows[0],tx);
      });
      json(res,201,{call:created});return true;
    }
    const match=url.pathname.match(/^\/api\/calls\/([a-f0-9-]{36})\/(action|signals|voice)$/);
    if(!match)fail(404,'Call endpoint not found.');
    const [,id,operation]=match;
    if(operation==='voice'&&req.method==='GET'){
      const call=await store.transaction(async tx=>{await expire(tx);return getCall(tx,id,user);});
      if(call.status!=='RINGING')fail(409,'This call invitation is no longer pending.');
      await readVoice(res,(await view(call)).invitation_message);return true;
    }
    if(operation==='action'&&req.method==='POST'){
      const input=await body(req);
      const updated=await store.transaction(async tx=>{
        await expire(tx);const call=await getCall(tx,id,user);
        if(!['accept','decline','end','connected','failed'].includes(input.action))fail(400,'Choose a valid call action.');
        if(['accept','decline'].includes(input.action)&&user.id!==call.patient_id)fail(403,'Only the invited patient can accept or decline.');
        if(!ACTIVE.includes(call.status))return view(call,tx);
        const now=new Date().toISOString();
        if(input.action==='accept'){
          if(call.status!=='RINGING')return view(call,tx);
          // The current roster, rather than the invitation alone, governs nurse eligibility.
          const row=(await tx.query('SELECT u.*, r.on_shift, r.competencies FROM users u JOIN staffing r ON r.user_id = u.id WHERE u.id = ?',[call.nurse_id])).rows[0];
          if(!row||!canCall(auth.publicUser(row)))fail(409,'The nurse is unavailable. Use the bedside call bell or send another request.');
          await tx.query("UPDATE video_calls SET status = 'ACCEPTED', consent_at = ?, updated_at = ?, expires_at = ? WHERE id = ?",[now,now,new Date(Date.now()+15*60000).toISOString(),id]);
        }else if(input.action==='connected'){
          if(!['ACCEPTED','CONNECTED'].includes(call.status))fail(409,'The patient must accept before connecting.');
          await tx.query("UPDATE video_calls SET status = 'CONNECTED', connected_at = COALESCE(connected_at, ?), updated_at = ? WHERE id = ?",[now,now,id]);
        }else{
          if(input.action==='decline'&&call.status!=='RINGING')fail(409,'This call was already accepted. Use End call.');
          const status=input.action==='decline'?'DECLINED':input.action==='failed'?'FAILED':'ENDED';
          await tx.query('UPDATE video_calls SET status = ?, ended_at = ?, updated_at = ? WHERE id = ?',[status,now,now,id]);
          await tx.query('DELETE FROM video_signals WHERE call_id = ?',[id]);
        }
        if(input.action!=='connected'||!call.connected_at)await tx.query('INSERT INTO audit (id,ticket_id,actor_id,action,created_at) VALUES (?,?,?,?,?)',[randomUUID(),call.ticket_id,user.id,'VIDEO_'+input.action.toUpperCase(),now]);
        return view((await tx.query('SELECT * FROM video_calls WHERE id = ?',[id])).rows[0],tx);
      });json(res,200,{call:updated});return true;
    }
    if(operation==='signals'&&req.method==='GET'){
      const result=await store.transaction(async tx=>{
        await expire(tx);const call=await getCall(tx,id,user);
        const signals=ACTIVE.includes(call.status)?(await tx.query('SELECT id,kind,payload FROM video_signals WHERE call_id = ? AND sender_id <> ? ORDER BY created_at,id',[id,user.id])).rows.map(signal=>({...signal,payload:JSON.parse(signal.payload)})):[];
        return {call:await view(call,tx),signals,iceServers:ACTIVE.includes(call.status)?iceServers(user,call):[],relayOnly:relay.configured};
      });json(res,200,result);return true;
    }
    if(operation==='signals'&&req.method==='POST'){
      const input=await body(req);
      await store.transaction(async tx=>{
        await expire(tx);const call=await getCall(tx,id,user);
        if(!['ACCEPTED','CONNECTED'].includes(call.status))fail(409,'Media setup requires an accepted active call.');
        if(user.id===call.nurse_id&&!canCall(user))fail(403,'The nurse is no longer eligible for this call.');
        if(!['offer','answer','candidate'].includes(input.kind)||!input.payload||typeof input.payload!=='object'||Array.isArray(input.payload))fail(400,'Invalid call signal.');
        if((input.kind==='offer'&&user.id!==call.nurse_id)||(input.kind==='answer'&&user.id!==call.patient_id))fail(403,'That signal belongs to the other participant.');
        if(['offer','answer'].includes(input.kind)){
          if(input.payload.type!==input.kind||typeof input.payload.sdp!=='string'||input.payload.sdp.length>12000||!input.payload.sdp.startsWith('v=0'))fail(400,'Invalid session description.');
          const previous=(await tx.query('SELECT id FROM video_signals WHERE call_id = ? AND kind = ?',[id,input.kind])).rows;
          if(previous.length)fail(409,'That session description was already sent.');
        }else if(typeof input.payload.candidate!=='string'||input.payload.candidate.length>2000)fail(400,'Invalid connection candidate.');
        const total=(await tx.query('SELECT COUNT(*) AS total FROM video_signals WHERE call_id = ?',[id])).rows[0].total;
        if(Number(total)>=128)fail(429,'Too many call signals. End and retry the call.');
        await tx.query('INSERT INTO video_signals (id,call_id,sender_id,kind,payload,created_at) VALUES (?,?,?,?,?,?)',[randomUUID(),id,user.id,input.kind,JSON.stringify(input.payload),new Date().toISOString()]);
      });json(res,200,{ok:true});return true;
    }
    fail(404,'Call endpoint not found.');
  }
  return {handle,available,network,canCall};
}
module.exports={createVideoCalls,canCall};
