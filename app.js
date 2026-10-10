'use strict';
const h = React.createElement;
const {useState, useEffect, useRef} = React;
function Logo() {
  return h('svg', { viewBox:'0 0 32 32', width:18, height:18 },
    h('rect', { x:0, y:0, width:32, height:32, rx:7, fill:'transparent' }),
    h('path', { d:'M16 6C16 6 10 6 10 12C10 15 12 17 16 22C20 17 22 15 22 12C22 6 16 6 16 6Z', fill:'white', opacity:0.95 }),
    h('circle', { cx:16, cy:12, r:2.5, fill:'#dc2626' }),
    h('path', { d:'M6 18 L11 18 L13 14 L15 22 L17 10 L19 18 L26 18', stroke:'white', strokeWidth:1.8, fill:'none', strokeLinecap:'round', strokeLinejoin:'round' })
  );
}

// ---- Tier Dot (CSS circle, no emoji) ----
function TierDot({ color, size }) {
  return h('span', { style:{ display:'inline-block', width:size||8, height:size||8, borderRadius:'50%', background:color, flexShrink:0 } });
}

// ---- SVG Quick Icons ----
function IconWater() {
  return h('svg', { width:24, height:24, viewBox:'0 0 24 24', fill:'none', stroke:'var(--violet)', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round' },
    h('path', { d:'M12 2.69l5.66 5.66a8 8 0 11-11.31 0z' })
  );
}
function IconBlanket() {
  return h('svg', { width:24, height:24, viewBox:'0 0 24 24', fill:'none', stroke:'var(--teal)', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round' },
    h('path', { d:'M3 7v11a2 2 0 002 2h14a2 2 0 002-2V7' }),
    h('path', { d:'M1 7h22' }),
    h('path', { d:'M6 11h12' })
  );
}
function IconBathroom() {
  return h('svg', { width:24, height:24, viewBox:'0 0 24 24', fill:'none', stroke:'var(--teal)', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round' },
    h('path', { d:'M4 4v16' }),
    h('path', { d:'M4 10h5a3 3 0 013 3v0' }),
    h('circle', { cx:12, cy:7, r:3 })
  );
}
function IconPain() {
  return h('svg', { width:24, height:24, viewBox:'0 0 24 24', fill:'none', stroke:'var(--red)', strokeWidth:2, strokeLinecap:'round', strokeLinejoin:'round' },
    h('path', { d:'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' }),
    h('line', { x1:12, y1:9, x2:12, y2:13 }),
    h('line', { x1:12, y1:17, x2:12.01, y2:17 })
  );
}

const TIERS = {
  clinical: { label:'Clinical care', color:'var(--red)', bg:'var(--red-bg)' },
  bedside: { label:'Bedside assistance', color:'var(--teal)', bg:'var(--teal-bg)' },
  envops: { label:'Hospital services', color:'var(--violet)', bg:'var(--violet-bg)' },
  specialized: { label:'Specialist coordination', color:'var(--sky)', bg:'var(--sky-bg)' }
};
const LANGUAGES = [
  ['en-US','English'], ['es-ES','Español'], ['hi-IN','हिन्दी'], ['fr-FR','Français'],
  ['pt-BR','Português'], ['zh-CN','中文'], ['ar-SA','العربية'], ['ko-KR','한국어'],
  ['tl-PH','Tagalog'], ['pl-PL','Polski'], ['de-DE','Deutsch'], ['ja-JP','日本語']
];
const COPY = {
  en: { title:'How can we help?', intro:'Choose a request, or tell us what you need.', request:'Describe your request', placeholder:'Type here, or use the microphone…', send:'Send request', urgent:'Urgent help — call nursing', water:'Water', blanket:'Blanket', bathroom:'Bathroom', pain:'Pain', listening:'Listening…', voice:'Voice input', history:'Your requests', received:'Received', acknowledged:'Staff acknowledged', resolved:'Completed', quick:['Can I get some water please?', 'I need an extra blanket.', 'I need help getting to the bathroom.', 'I am in pain and need help.'] },
  es: { title:'¿Cómo podemos ayudarle?', intro:'Elija una solicitud o díganos qué necesita.', request:'Describa su solicitud', placeholder:'Escriba aquí o use el micrófono…', send:'Enviar solicitud', urgent:'Ayuda urgente — llamar a enfermería', water:'Agua', blanket:'Manta', bathroom:'Baño', pain:'Dolor', listening:'Escuchando…', voice:'Entrada de voz', history:'Sus solicitudes', received:'Recibida', acknowledged:'Personal avisado', resolved:'Completada', quick:['¿Puedo tener agua, por favor?', 'Necesito una manta.', 'Necesito ayuda para ir al baño.', 'Tengo dolor y necesito ayuda.'] },
  hi: { title:'हम आपकी कैसे मदद करें?', intro:'अनुरोध चुनें या बताएं कि आपको क्या चाहिए।', request:'अपना अनुरोध बताएं', placeholder:'यहाँ लिखें या माइक्रोफ़ोन का उपयोग करें…', send:'अनुरोध भेजें', urgent:'तुरंत सहायता — नर्स को बुलाएं', water:'पानी', blanket:'कंबल', bathroom:'शौचालय', pain:'दर्द', listening:'सुन रहे हैं…', voice:'आवाज़ से अनुरोध', history:'आपके अनुरोध', received:'प्राप्त हुआ', acknowledged:'कर्मचारी ने स्वीकार किया', resolved:'पूरा हुआ', quick:['मुझे पानी चाहिए।', 'मुझे एक कंबल चाहिए।', 'मुझे शौचालय जाने में मदद चाहिए।', 'मुझे दर्द है और मदद चाहिए।'] },
  fr: { title:'Comment vous aider ?', intro:'Choisissez une demande ou dites-nous ce dont vous avez besoin.', request:'Décrivez votre demande', placeholder:'Écrivez ici ou utilisez le microphone…', send:'Envoyer la demande', urgent:'Aide urgente — appeler les infirmiers', water:'Eau', blanket:'Couverture', bathroom:'Toilettes', pain:'Douleur', listening:'Écoute…', voice:'Saisie vocale', history:'Vos demandes', received:'Reçue', acknowledged:'Personnel informé', resolved:'Terminée', quick:['Puis-je avoir de l’eau ?', 'Il me faut une couverture.', 'J’ai besoin d’aide pour aller aux toilettes.', 'J’ai une douleur et besoin d’aide.'] }
};
const SOURCE_LABELS = { safety_rule:'Safety rule', rules:'Routing rules', ai:'AI assisted', ai_fallback:'AI fallback · nurse review when uncertain', secondary_task:'Separated service task' };
const DEMO_SCENARIOS = [
  { label:'Extra pillow', text:'Can I get an extra pillow? Mine is flat.', tier:'envops', department:'Environmental Services' },
  { label:'Bathroom floor spill', text:'There is a spill on the bathroom floor and my lunch tray needs to be picked up.', tier:'envops', department:'Environmental Services' },
  { label:'Chest pressure', text:'I feel pressure in my chest and I am dizzy.', tier:'clinical', maxPriority:1 },
  { label:'Mixed request with choking', text:'I need water, I am choking.', tier:'clinical', maxPriority:1 },
  { label:'Fall with comfort request', text:'I fell and need a blanket.', tier:'clinical', maxPriority:2 },
  { label:'Spanish breathing difficulty', text:'Me duele mucho el pecho y no puedo respirar bien.', tier:'clinical', maxPriority:1 },
  { label:'Hindi breathing difficulty', text:'मुझे पानी चाहिए, मुझे सांस लेने में तकलीफ हो रही है', tier:'clinical', maxPriority:1 },
  { label:'Hindi water request', text:'मुझे पानी चाहिए, मुझे बहुत प्यास लगी है', tier:'envops', department:'Food Services' }
];
const api = KaalingaAPI.request;
const post = payload => ({ method:'POST', body:JSON.stringify(payload) });
const formatTime = value => new Date(value).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
function ageLabel(time, now) {
  const seconds = Math.max(0, Math.round((now - Date.parse(time)) / 1000));
  return seconds < 60 ? seconds + 's' : seconds < 3600 ? Math.floor(seconds / 60) + 'm' : Math.floor(seconds / 3600) + 'h';
}

function Login({ config, error, onLogin, onReload }) {
  const [email, setEmail] = useState('patient@kaalinga.demo');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  useEffect(() => { if (config?.localDemo) setPassword('kaalinga-demo'); }, [config]);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setLoginError('');
    try { await onLogin(email,password); } catch (err) { setLoginError(err.message); }
    finally { setBusy(false); }
  }
  return h('main', {className:'login-layout'},
    h('div', {className:'login-intro'},
      h('span', {className:'eyebrow'}, 'Rutgers Health Hack · Ops Unleashed'),
      h('h1', null, 'The right help.\nThe right team.'),
      h('p', null, 'Route routine hospital requests to support teams. Keep clinical concerns with nursing. Let every patient know their request was received.'),
      h('div', {className:'login-proof'},
        h('div', null, h('strong', null, 'Safety before classification'), 'Known urgent symptoms bypass the model.'),
        h('div', null, h('strong', null, 'One request, a coordinated response'), 'Separate clinical and service tasks reach the appropriate team.'),
        h('div', null, h('strong', null, 'A visible handoff'), 'Follow receipt, staff acknowledgement, and completion.')
      )
    ),
    h('form', {className:'login-card', onSubmit:submit},
      h('h2', null, 'Choose your demo account'),
      h('p', null, 'Open a patient account in one browser and a staff account in another browser or private window.'),
      h('label', {className:'fl',htmlFor:'account'}, 'Account'),
      h('select', {id:'account',className:'fi',value:email,onChange:e=>setEmail(e.target.value),disabled:!config},
        (config?.accounts || []).map(account=>h('option', {key:account.id,value:account.email}, account.display_name))
      ),
      h('label', {className:'fl',htmlFor:'password'}, 'Demo password'),
      h('input', {id:'password',className:'fi',type:'password',value:password,autoComplete:'current-password',required:true,onChange:e=>setPassword(e.target.value)}),
      config?.localDemo && h('p', null, 'Local demo password: kaalinga-demo'),
      (loginError || error) && h('div', {className:'error-box',style:{margin:'0 0 14px'},role:'alert'}, loginError || error),
      h('button', {className:'go-btn',type:'submit',disabled:busy || !config}, busy ? 'Signing in…' : 'Sign in'),
      !config && h('button', {className:'btn',type:'button',onClick:onReload,style:{marginTop:12}}, 'Retry connection'),
      h('p', {style:{fontSize:12}}, 'Synthetic patient requests only. This is a hackathon demonstration.')
    )
  );
}
function PatientTicket({ticket, copy, voiceConfigured, onReadback}) {
  const tier = TIERS[ticket.tier];
  return h('article', {className:'patient-ticket',style:{borderLeft:'4px solid '+tier.color}},
    h('div', {style:{display:'flex',justifyContent:'space-between',gap:10}},
      h('strong', null, ticket.department),
      h('span', {className:'status-step'+(ticket.status==='RESOLVED'?' done':'')}, ticket.status==='RESOLVED'?copy.resolved:ticket.status==='ACKNOWLEDGED'?copy.acknowledged:copy.received)
    ),
    h('p', {dir:'auto'}, ticket.original_text),
    h('p', {dir:'auto',style:{color:'var(--fg2)'}}, ticket.patient_summary),
    h('div', {style:{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}},
      h('small', {style:{color:'var(--fg3)'}}, formatTime(ticket.created_at) + (ticket.parent_id ? ' · Service task' : '')),
      voiceConfigured && h('button', {className:'btn btn-sm',onClick:()=>onReadback(ticket)}, 'Read aloud')
    )
  );
}
function StaffTicket({ticket, now, onAction, pending}) {
  const tier = TIERS[ticket.tier];
  const urgent = ticket.priority <= 2 && ticket.status !== 'RESOLVED';
  const overdue = urgent && ticket.status==='NEW' && now-Date.parse(ticket.created_at) > (ticket.priority===1?30000:120000);
  return h('article', {className:'tk'+(urgent?' hot':'')+(ticket.status==='RESOLVED'?' closed':'')},
    h('div', {className:'tk-stripe',style:{background:tier.color}}),
    h('div', {className:'tk-body'},
      h('div', {className:'tk-r1'}, h('span',{className:'tk-room'},ticket.room), h('span',{className:'tk-time'},formatTime(ticket.created_at)+' · '+ageLabel(ticket.created_at,now)+' ago')),
      h('p', {className:'tk-msg',dir:'auto'}, ticket.original_text),
      h('p', {className:'tk-summary'}, ticket.summary),
      h('div', {className:'tk-tags'},
        h('span', {className:'pill '+(urgent?'pill-urg':'pill-new')}, 'P'+ticket.priority+' · '+ticket.status),
        h('span', {className:'tk-tier',style:{color:tier.color}}, ticket.department),
        h('span', {className:'tk-lang'}, ticket.detected_language),
        ticket.parent_id && h('span', {className:'tk-lang'}, 'Linked service task'),
        h('span', {className:'tk-who'}, ticket.responder)
      ),
      overdue && h('div', {className:'overdue',role:'status'}, 'Urgent request awaiting acknowledgement. Charge nurse review needed.'),
      h('div', {className:'ticket-actions'},
        h('span', {className:'ticket-meta'}, (SOURCE_LABELS[ticket.source]||ticket.source)+' · '+Math.round(ticket.classification_ms)+' ms'+(ticket.confidence===null?'':' · AI self-report '+Math.round(ticket.confidence*100)+'%')),
        ticket.status==='NEW' && h('button', {className:'btn btn-primary',disabled:pending,onClick:()=>onAction(ticket,'acknowledge')}, pending?'Saving…':'Acknowledge'),
        ticket.status==='ACKNOWLEDGED' && h('button', {className:'btn',disabled:pending,onClick:()=>onAction(ticket,'resolve')}, pending?'Saving…':'Mark complete'),
        ticket.status==='RESOLVED' && h('span', {className:'status-step done'}, 'Completed '+formatTime(ticket.resolved_at))
      )
    )
  );
}

function App() {
  const [config,setConfig] = useState(null);
  const [user,setUser] = useState(null);
  const [booting,setBooting] = useState(true);
  const [bootError,setBootError] = useState('');
  const [tickets,setTickets] = useState([]);
  const [notifications,setNotifications] = useState([]);
  const [connected,setConnected] = useState(false);
  const [notificationOpen,setNotificationOpen] = useState(false);
  const [notificationPermission,setNotificationPermission] = useState(typeof Notification!=='undefined'?Notification.permission:'unsupported');
  const [language,setLanguage] = useState('en-US');
  const [text,setText] = useState('');
  const [processing,setProcessing] = useState(false);
  const [emergencyProcessing,setEmergencyProcessing] = useState(false);
  const [requestError,setRequestError] = useState('');
  const [retryRequest,setRetryRequest] = useState(null);
  const [recording,setRecording] = useState(false);
  const [ttsPlaying,setTtsPlaying] = useState(false);
  const [filter,setFilter] = useState('all');
  const [showCompleted,setShowCompleted] = useState(false);
  const [pendingAction,setPendingAction] = useState(null);
  const [toast,setToast] = useState('');
  const [now,setNow] = useState(Date.now());
  const [minutes,setMinutes] = useState(3);
  const [demoRunning,setDemoRunning] = useState(false);
  const [demoStep,setDemoStep] = useState('');
  const [demoResults,setDemoResults] = useState([]);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const toastTimer = useRef(null);
  const normalBusy = useRef(false);
  const urgentBusy = useRef(false);
  const pollBusy = useRef(false);
  const activeUser = useRef(null);
  const seenNotifications = useRef(new Set());
  const clockOffset = useRef(0);
  const copy = COPY[language.split('-')[0]] || COPY.en;
  const isPatient = user?.role==='patient';

  function announce(message) {
    setToast(message); clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(()=>setToast(''),5000);
  }
  async function boot() {
    setBootError(''); setBooting(true);
    try {
      setConfig(await api('/api/config'));
      try { const result=await api('/api/me'); activeUser.current=result.user.id; setUser(result.user); }
      catch(err) { if(err.status!==401) throw err; }
    } catch(err) { setBootError(err.message); }
    finally { setBooting(false); }
  }
  useEffect(()=>{ boot(); return ()=>{ clearTimeout(toastTimer.current); recognitionRef.current?.abort(); audioRef.current?.pause(); }; },[]);
  useEffect(()=>{
    const timer=setInterval(()=>setNow(Date.now()+clockOffset.current),1000);
    return ()=>clearInterval(timer);
  },[]);
  useEffect(()=>{
    if (!user) return;
    const id=user.id;
    seenNotifications.current=new Set();
    let first=true;
    let cancelled=false;
    async function poll() {
      if (pollBusy.current) return;
      pollBusy.current=true;
      try {
        const result=await api('/api/tickets');
        if (cancelled || activeUser.current!==id) return;
        if (result.user.id!==id) { activeUser.current=result.user.id; setUser(result.user); setTickets([]); setNotifications([]); return; }
        setTickets(result.tickets); setNotifications(result.notifications); setConnected(true);
        clockOffset.current=Date.parse(result.serverTime)-Date.now();
        for (const notification of [...result.notifications].reverse()) {
          if (!first && !notification.read_at && !seenNotifications.current.has(notification.id)) {
            announce(notification.message);
            if (typeof Notification!=='undefined' && Notification.permission==='granted') {
              try { new Notification('Kaalinga · '+user.display_name,{body:notification.message,tag:notification.id}); } catch(_) {}
            }
          }
          seenNotifications.current.add(notification.id);
        }
        first=false;
      } catch(err) {
        if (cancelled) return;
        setConnected(false);
        if(err.status===401) { activeUser.current=null; setUser(null); setTickets([]); setNotifications([]); }
      } finally { pollBusy.current=false; }
    }
    poll(); const timer=setInterval(poll,2000);
    return ()=>{ cancelled=true; clearInterval(timer); };
  },[user?.id]);
  async function login(email,password) {
    const result=await api('/api/login',post({email,password}));
    activeUser.current=result.user.id; setUser(result.user); setBootError('');
  }
  async function logout() {
    try { await api('/api/logout',post({})); }
    catch(err) { announce('Sign out failed. Please retry.'); return; }
    recognitionRef.current?.abort(); audioRef.current?.pause();
    activeUser.current=null; setUser(null); setTickets([]); setNotifications([]); setText(''); setNotificationOpen(false); setDemoResults([]); setConnected(false);
  }
  async function refresh() {
    const id=activeUser.current;
    const data=await api('/api/tickets');
    if(activeUser.current!==id) return;
    if(data.user.id!==id) { activeUser.current=data.user.id; setUser(data.user); setTickets([]); setNotifications([]); return; }
    setTickets(data.tickets); setNotifications(data.notifications); setConnected(true);
  }
  async function deliverRequest(payload) {
    const data=await api('/api/requests',post(payload));
    setTickets(prev=>[data.ticket,...prev.filter(t=>t.id!==data.ticket.id)]);
    refresh().catch(()=>{});
    return data.ticket;
  }
  async function send(input,urgent=false,retry=null) {
    if (!input.trim() || (urgent?urgentBusy.current:normalBusy.current)) return;
    if(urgent) { urgentBusy.current=true; setEmergencyProcessing(true); }
    else { normalBusy.current=true; setProcessing(true); }
    const payload=retry || {text:input.trim(),language,forceClinical:urgent,requestKey:crypto.randomUUID()};
    setRequestError(''); setRetryRequest(null);
    try {
      const ticket=await deliverRequest(payload);
      setText(current=>current===input?'':current);
      announce(ticket.patient_summary);
    } catch(err) {
      setRequestError('Your request was not confirmed as delivered. Retry, or use the bedside call bell for help.');
      setRetryRequest(payload); setConnected(false);
    } finally {
      if(urgent) { urgentBusy.current=false; setEmergencyProcessing(false); }
      else { normalBusy.current=false; setProcessing(false); }
    }
  }
  function toggleRecording() {
    if(recording) { recognitionRef.current?.stop(); setRecording(false); return; }
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recognition) { announce('Voice input is unavailable in this browser. You can type or use a quick request.'); return; }
    const recognition=new Recognition();
    recognition.lang=language; recognition.continuous=false; recognition.interimResults=true;
    recognition.onresult=e=>setText(Array.from(e.results).map(result=>result[0].transcript).join(' '));
    recognition.onend=()=>setRecording(false);
    recognition.onerror=()=>{ setRecording(false); announce('Voice input stopped. You can still type your request.'); };
    recognitionRef.current=recognition;
    try { recognition.start(); setRecording(true); } catch(_) { announce('Microphone could not start. Please type your request.'); }
  }
  async function readback(ticket) {
    audioRef.current?.pause(); setTtsPlaying(true);
    const audio=new Audio('/api/voice/'+ticket.id);
    audioRef.current=audio;
    audio.onended=()=>{ setTtsPlaying(false); audioRef.current=null; };
    audio.onerror=()=>{ setTtsPlaying(false); announce('Voice readback is unavailable. Your request is still delivered.'); };
    try { await audio.play(); } catch(_) { setTtsPlaying(false); announce('Use Read aloud again to play the message.'); }
  }
  async function action(ticket,actionName) {
    if(pendingAction) return;
    setPendingAction(ticket.id);
    try {
      const result=await api('/api/tickets/'+ticket.id,{method:'PATCH',body:JSON.stringify({action:actionName})});
      setTickets(prev=>prev.map(t=>t.id===ticket.id?result.ticket:t));
      announce(actionName==='acknowledge'?'Request acknowledged. The patient has been notified.':'Request completed. The patient has been notified.');
    } catch(err) { announce(err.message); }
    finally { setPendingAction(null); }
  }
  async function enableNotifications() {
    if(typeof Notification==='undefined') { announce('Browser alerts are unavailable here. In-app alerts remain active.'); return; }
    try { setNotificationPermission(await Notification.requestPermission()); } catch(_) { announce('In-app alerts remain active.'); }
  }
  async function toggleNotifications() {
    setNotificationOpen(!notificationOpen);
    if(!notificationOpen) {
      try { await api('/api/notifications/read',post({})); await refresh(); } catch(_) {}
    }
  }
  async function runDemo() {
    if(normalBusy.current || demoRunning) return;
    normalBusy.current=true; setDemoRunning(true); setDemoResults([]);
    const rows=[];
    try {
      for(let i=0;i<DEMO_SCENARIOS.length;i++) {
        if(activeUser.current!==user.id) break;
        const scenario=DEMO_SCENARIOS[i];
        setDemoStep((i+1)+'/'+DEMO_SCENARIOS.length+' · '+scenario.label);
        try {
          const ticket=await deliverRequest({text:scenario.text,language:'en-US',requestKey:crypto.randomUUID()});
          const passed=ticket.tier===scenario.tier && (!scenario.maxPriority||ticket.priority<=scenario.maxPriority) && (!scenario.department||ticket.department===scenario.department);
          rows.push({label:scenario.label,passed,actual:ticket.department+' · P'+ticket.priority});
        } catch(_) { rows.push({label:scenario.label,passed:false,actual:'Delivery failed'}); }
        setDemoResults([...rows]);
        await new Promise(resolve=>setTimeout(resolve,700));
      }
    } finally { setDemoRunning(false); setDemoStep(''); normalBusy.current=false; }
  }

  const active=tickets.filter(t=>t.status!=='RESOLVED');
  const urgentCount=active.filter(t=>t.priority<=2).length;
  const nonClinical=tickets.filter(t=>!t.is_clinical).length;
  const primary=tickets.filter(t=>!t.parent_id);
  const avgLatency=primary.length ? Math.round(primary.reduce((sum,t)=>sum+t.classification_ms,0)/primary.length) : null;
  const unread=notifications.filter(n=>!n.read_at).length;
  const filtered=tickets.filter(t=>(showCompleted||t.status!=='RESOLVED')&&(filter==='all'||t.tier===filter)).sort((a,b)=>{
    const statusRank={NEW:0,ACKNOWLEDGED:1,RESOLVED:2};
    return Number(a.status==='RESOLVED')-Number(b.status==='RESOLVED') || a.priority-b.priority || statusRank[a.status]-statusRank[b.status] || Date.parse(a.created_at)-Date.parse(b.created_at);
  });
  const header=h('nav',{className:'topbar','aria-label':'Main'},
    h('div',{className:'topbar-left'},h('div',{className:'logo-mark','aria-hidden':true},h(Logo)),h('span',{className:'logo-text'},'Kaalinga'),h('span',{className:'badge badge-brand'},'OPS UNLEASHED')),
    user && h('div',{className:'topbar-right'},
      h('span',{className:'role-name'},user.display_name),
      h('button',{className:'btn btn-sm',onClick:toggleNotifications,'aria-expanded':notificationOpen},'Alerts'+(unread?' ('+unread+')':'')),
      notificationPermission!=='granted' && notificationPermission!=='denied' && notificationPermission!=='unsupported' && h('button',{className:'btn btn-sm',onClick:enableNotifications},'Enable browser alerts'),
      h('button',{className:'btn btn-sm',onClick:logout,disabled:processing||demoRunning||emergencyProcessing},'Sign out')
    )
  );
  if(booting) return h('div',{id:'app'},header,h('main',{className:'empty-state'},h('div',{className:'spinner'}),h('p',null,'Connecting to Kaalinga…')));
  if(!user) return h('div',{id:'app'},header,h(Login,{config,error:bootError,onLogin:login,onReload:boot}));
  return h('div',{id:'app'},header,
    h('div',{className:'prototype-bar'},
      h('span',null,'Hackathon demo · synthetic requests'),
      h('span',{className:'connection',role:'status'},h('span',{className:'room-dot'+(connected?'':' off')}),connected?'Live · updates every 2s':'Reconnecting…'),
      h('span',{className:'model-label'},config?.aiConfigured?'AI assisted · '+config.model:'Routing rules · AI not configured')
    ),
    notificationOpen && h('section',{className:'notification-panel','aria-label':'Your notifications'},
      h('h2',null,'Your notifications'),
      notifications.length ? notifications.map(n=>h('div',{className:'notification-item'+(!n.read_at?' unread':''),key:n.id},n.message,h('time',{dateTime:n.created_at},formatTime(n.created_at)))) : h('p',null,'No alerts yet.')
    ),
    isPatient ? h('main',{className:'p-panel',dir:language.startsWith('ar')?'rtl':'ltr'},
      h('div',{className:'p-header'},
        h('h1',null,copy.title),h('p',null,copy.intro),h('div',{className:'room-chip'},h('span',{className:'room-dot'}),h('strong',null,user.room)),
        h('div',{className:'patient-language'},h('label',{htmlFor:'patient-language'},'Language / भाषा'),h('select',{id:'patient-language',className:'language-select',value:language,onChange:e=>{recognitionRef.current?.abort();setLanguage(e.target.value);},'aria-label':'Patient language'},LANGUAGES.map(([code,label])=>h('option',{key:code,value:code},label))))
      ),
      h('button',{className:'emergency-button',onClick:()=>send('Emergency help requested using the urgent call button.',true),disabled:emergencyProcessing},h(IconPain),emergencyProcessing?'Sending urgent request…':copy.urgent),
      h('div',{className:'quick-row'},[copy.water,copy.blanket,copy.bathroom,copy.pain].map((label,index)=>{
        const Icon=[IconWater,IconBlanket,IconBathroom,IconPain][index];
        return h('button',{key:index,className:'qb',disabled:processing||demoRunning,onClick:()=>{setText(copy.quick[index]);send(copy.quick[index]);}},h('span',{className:'qb-ico'},h(Icon)),label);
      })),
      h('form',{className:'input-area',onSubmit:e=>{e.preventDefault();send(text);}},
        h('label',{className:'input-label',htmlFor:'request'},copy.request),
        h('div',{className:'ta-wrap'},
          h('textarea',{id:'request',value:text,onChange:e=>setText(e.target.value),placeholder:copy.placeholder,maxLength:2000,dir:'auto',disabled:processing||demoRunning}),
          h('button',{type:'button',className:'mic-btn'+(recording?' recording':''),onClick:toggleRecording,'aria-label':recording?'Stop recording':copy.voice,disabled:processing||demoRunning},h('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,'aria-hidden':true},h('rect',{x:9,y:2,width:6,height:12,rx:3}),h('path',{d:'M5 10v2a7 7 0 0014 0v-2M12 19v3M8 22h8'})))
        ),
        recording && h('div',{className:'voice-status',role:'status'},h('span',{className:'voice-dot'}),copy.listening),
        h('button',{type:'submit',className:'go-btn',disabled:processing||demoRunning||!text.trim()},processing?'Sending…':copy.send)
      ),
      requestError && h('div',{className:'error-box',role:'alert'},requestError,retryRequest&&h('button',{className:'btn',style:{marginTop:10},disabled:processing||emergencyProcessing,onClick:()=>send(retryRequest.text,retryRequest.forceClinical,retryRequest)},'Retry the same request')),
      ttsPlaying&&h('div',{className:'notice-box'},'Reading your message…',h('button',{className:'btn btn-sm',style:{marginLeft:12},onClick:()=>{audioRef.current?.pause();setTtsPlaying(false);}},'Stop')),
      h('section',{className:'patient-status','aria-label':copy.history},
        h('h2',null,copy.history),
        tickets.length ? tickets.slice(0,12).map(ticket=>h(PatientTicket,{key:ticket.id,ticket,copy,voiceConfigured:config?.voiceConfigured,onReadback:readback})) : h('p',{style:{color:'var(--fg2)'}},'Your requests will appear here after they are delivered.')
      ),
      h('div',{className:'notice-box'},'For immediate help, use the bedside call bell. This demo does not activate hospital paging equipment.'),
      h('button',{className:'btn btn-warn',style:{margin:'0 24px 20px',justifyContent:'center'},onClick:runDemo,disabled:demoRunning||processing},demoRunning?'Demo · '+demoStep:'Run the 8-request routing demo'),
      demoResults.length>0&&h('details',{className:'demo-results',open:!demoRunning},
        h('summary',null,'Demo results: '+demoResults.filter(r=>r.passed).length+'/'+demoResults.length+' expected routes matched'),
        demoResults.map(row=>h('div',{key:row.label,className:'demo-result '+(row.passed?'pass':'fail')},h('span',null,row.label),h('span',null,(row.passed?'PASS · ':'CHECK · ')+row.actual))),
        h('p',null,'These cases demonstrate routing behavior; they are not a clinical safety certification.')
      )
    ) : h('main',{className:'board-wrap'},
      h('div',{className:'board-heading'},h('div',null,h('h1',null,user.role==='coordinator'?'Unit coordination':user.department+' queue'),h('p',null,'Acknowledge a request to confirm the handoff. The patient receives a status update.')),h('label',{style:{fontSize:14,color:'var(--fg2)'}},h('input',{type:'checkbox',checked:showCompleted,onChange:e=>setShowCompleted(e.target.checked)}),' Show completed')),
      h('section',{className:'d-panel','aria-label':'Department dashboard'},
        h('div',{className:'kpi-row'},[
          [active.length,'Open requests',null],[urgentCount,'Urgent','var(--red)'],[tickets.length?Math.round(nonClinical/tickets.length*100)+'%':'—','Non-clinical share','var(--green)'],[avgLatency===null?'—':avgLatency+' ms','Mean classification',null],[tickets.filter(t=>t.status==='RESOLVED').length,'Completed',null]
        ].map(([value,label,color])=>h('div',{key:label,className:'kpi'},h('div',{className:'kpi-val',style:{color:color||'var(--fg)'}},value),h('div',{className:'kpi-lbl'},label)))),
        user.role==='coordinator'&&h('div',{className:'tier-tabs','aria-label':'Filter by care team'},[{key:'all',label:'All teams'},...Object.entries(TIERS).map(([key,tier])=>({key,label:tier.label}))].map(tab=>h('button',{key:tab.key,className:'tt'+(filter===tab.key?' on':''),'aria-pressed':filter===tab.key,onClick:()=>setFilter(tab.key)},tab.label))),
        h('div',{className:'feed'},filtered.length ? filtered.map(ticket=>h(StaffTicket,{key:ticket.id,ticket,now,onAction:action,pending:pendingAction===ticket.id})) : h('div',{className:'empty-state'},h('p',null,'No open requests for your team.'))),
        h('details',{className:'impact-panel'},h('summary',null,'Explore estimated nursing time freed'),h('p',null,nonClinical+' non-clinical service tasks × ',h('label',null,h('input',{type:'number',min:0,max:30,step:.5,value:minutes,'aria-label':'Assumed nursing minutes per task',onChange:e=>setMinutes(Math.min(30,Math.max(0,Number(e.target.value)||0)))}),' assumed nursing minutes per task'),' = ',h('strong',null,Math.round(nonClinical*minutes*10)/10+' estimated minutes'),'.'),h('p',null,'An adjustable demo assumption, not measured savings. A pilot should compare nursing interruptions and staff response times before and after routing.'))
      )
    ),
    h('div',{className:'toast'+(toast?' pop':''),role:'status','aria-live':'polite'},toast),
    h('footer',{className:'ui-footer'},'Kaalinga · Rutgers Health Hack 2026 · Coordinated service requests, with clinical review kept in nursing.')
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(h(App));
