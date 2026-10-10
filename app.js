'use strict';
const h = React.createElement;
const {useState, useEffect, useRef} = React;

// ---------------------------------------------------------------- Marks and icons
function Logo() {
  return h('svg', {viewBox:'0 0 32 32', width:19, height:19, 'aria-hidden':true},
    h('path', {d:'M16 25.5C16 25.5 5.5 19.4 5.5 12.6C5.5 9.2 8.1 6.5 11.4 6.5C13.3 6.5 15 7.5 16 9C17 7.5 18.7 6.5 20.6 6.5C23.9 6.5 26.5 9.2 26.5 12.6C26.5 19.4 16 25.5 16 25.5Z', fill:'var(--on-accent)', opacity:.92}),
    h('path', {d:'M9 15.4H13L14.4 12.4L16.3 18.4L18 14.4L19.4 15.4H23', stroke:'var(--accent)', strokeWidth:2, fill:'none', strokeLinecap:'round', strokeLinejoin:'round'})
  );
}
function Icon({path, size, stroke}) {
  return h('svg', {width:size||20, height:size||20, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor',
    strokeWidth:stroke||1.9, strokeLinecap:'round', strokeLinejoin:'round', 'aria-hidden':true},
    (Array.isArray(path)?path:[path]).map((d,i)=>h('path',{key:i,d})));
}
const GLYPH = {
  water:'M12 2.7l5.7 5.7a8 8 0 11-11.4 0z',
  blanket:['M3 7v11a2 2 0 002 2h14a2 2 0 002-2V7','M1 7h22','M6 11.5h12'],
  bathroom:['M12.7 4.3a1.7 1.7 0 11-3.4 0 1.7 1.7 0 013.4 0','M11 7.6v5.9','M11 13.5l-2.3 5.9M11 13.5l2.3 5.9','M7.6 10h6.8','M18.5 3.5v17'],
  alert:['M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z','M12 9v4','M12 17h.01'],
  mic:['M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3z','M5 11v1a7 7 0 0014 0v-1','M12 19v3','M8 22h8'],
  sun:['M12 8a4 4 0 100 8 4 4 0 000-8z','M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8'],
  moon:'M20.9 13A9 9 0 0111 3.1 9 9 0 1020.9 13Z',
  bell:['M18 9a6 6 0 10-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9z','M13.7 20a2 2 0 01-3.4 0'],
  team:['M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20','M10 11.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7','M20 20v-1.5a3.5 3.5 0 00-2.6-3.4','M15.5 4.7a3.5 3.5 0 010 6.8'],
  exit:['M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4','M16 17l5-5-5-5','M21 12H9'],
  speaker:['M11 5L6.5 9H3v6h3.5L11 19V5z','M15.5 8.5a5 5 0 010 7','M18.5 5.5a9 9 0 010 13']
};

// ---------------------------------------------------------------- Reference data
const TIERS = {
  clinical:    {label:'Clinical care',           color:'var(--t-clinical)'},
  bedside:     {label:'Bedside assistance',      color:'var(--t-bedside)'},
  envops:      {label:'Hospital services',       color:'var(--t-services)'},
  specialized: {label:'Specialist coordination', color:'var(--t-specialist)'}
};
const LANGUAGES = [
  ['en-US','English'], ['es-ES','Español'], ['hi-IN','हिन्दी'], ['fr-FR','Français'],
  ['pt-BR','Português'], ['zh-CN','中文'], ['ar-SA','العربية'], ['ko-KR','한국어'],
  ['tl-PH','Tagalog'], ['pl-PL','Polski'], ['de-DE','Deutsch'], ['ja-JP','日本語']
];
const COPY = {
  en: { title:'How can we help?', intro:'Choose a request, or tell us what you need.', request:'Describe your request', placeholder:'Type here, or use the microphone…', send:'Send request', urgent:'Urgent help — call nursing', urgentSub:'Goes straight to a nurse. No AI routing.', water:'Water', blanket:'Blanket', bathroom:'Bathroom', pain:'Pain', listening:'Listening…', voice:'Voice input', history:'Your requests', received:'Received', acknowledged:'Staff acknowledged', resolved:'Completed', quick:['Can I get some water please?', 'I need an extra blanket.', 'I need help getting to the bathroom.', 'I am in pain and need help.'] },
  es: { title:'¿Cómo podemos ayudarle?', intro:'Elija una solicitud o díganos qué necesita.', request:'Describa su solicitud', placeholder:'Escriba aquí o use el micrófono…', send:'Enviar solicitud', urgent:'Ayuda urgente — llamar a enfermería', urgentSub:'Llega directo a enfermería, sin clasificación por IA.', water:'Agua', blanket:'Manta', bathroom:'Baño', pain:'Dolor', listening:'Escuchando…', voice:'Entrada de voz', history:'Sus solicitudes', received:'Recibida', acknowledged:'Personal avisado', resolved:'Completada', quick:['¿Puedo tener agua, por favor?', 'Necesito una manta.', 'Necesito ayuda para ir al baño.', 'Tengo dolor y necesito ayuda.'] },
  hi: { title:'हम आपकी कैसे मदद करें?', intro:'अनुरोध चुनें या बताएं कि आपको क्या चाहिए।', request:'अपना अनुरोध बताएं', placeholder:'यहाँ लिखें या माइक्रोफ़ोन का उपयोग करें…', send:'अनुरोध भेजें', urgent:'तुरंत सहायता — नर्स को बुलाएं', urgentSub:'सीधे नर्स तक जाता है। एआई वर्गीकरण नहीं।', water:'पानी', blanket:'कंबल', bathroom:'शौचालय', pain:'दर्द', listening:'सुन रहे हैं…', voice:'आवाज़ से अनुरोध', history:'आपके अनुरोध', received:'प्राप्त हुआ', acknowledged:'कर्मचारी ने स्वीकार किया', resolved:'पूरा हुआ', quick:['मुझे पानी चाहिए।', 'मुझे एक कंबल चाहिए।', 'मुझे शौचालय जाने में मदद चाहिए।', 'मुझे दर्द है और मदद चाहिए।'] },
  fr: { title:'Comment vous aider ?', intro:'Choisissez une demande ou dites-nous ce dont vous avez besoin.', request:'Décrivez votre demande', placeholder:'Écrivez ici ou utilisez le microphone…', send:'Envoyer la demande', urgent:'Aide urgente — appeler les infirmiers', urgentSub:'Transmis directement aux infirmiers, sans tri par IA.', water:'Eau', blanket:'Couverture', bathroom:'Toilettes', pain:'Douleur', listening:'Écoute…', voice:'Saisie vocale', history:'Vos demandes', received:'Reçue', acknowledged:'Personnel informé', resolved:'Terminée', quick:['Puis-je avoir de l’eau ?', 'Il me faut une couverture.', 'J’ai besoin d’aide pour aller aux toilettes.', 'J’ai une douleur et besoin d’aide.'] }
};
const SOURCE_LABELS = { safety_rule:'Safety rule', rules:'Routing rules', ai:'AI assisted', ai_fallback:'AI fallback · nurse review when uncertain', secondary_task:'Separated service task', staff_referral:'Staff-arranged referral' };
const VOICE_COPY = {
  en:{replies:'Read requests and staff updates aloud',review:'Review the transcript, then send your request.',preparing:'Preparing spoken update…',playing:'Reading your update…',blocked:'Tap Play update to enable audio. Your request was delivered.',failed:'Audio is unavailable. Your request was still delivered.',play:'Play update',stop:'Stop audio',latest:'Latest update'},
  es:{replies:'Leer las solicitudes y las actualizaciones del personal',review:'Revise la transcripción y envíe su solicitud.',preparing:'Preparando la actualización de voz…',playing:'Leyendo su actualización…',blocked:'Pulse Reproducir actualización para activar el audio. Su solicitud fue enviada.',failed:'El audio no está disponible. Su solicitud fue enviada.',play:'Reproducir actualización',stop:'Detener audio',latest:'Última actualización'},
  hi:{replies:'अनुरोध और कर्मचारियों के अपडेट आवाज़ में सुनाएं',review:'बोले गए शब्द जाँचें, फिर अपना अनुरोध भेजें।',preparing:'आवाज़ में अपडेट तैयार हो रहा है…',playing:'आपका अपडेट पढ़ा जा रहा है…',blocked:'आवाज़ चालू करने के लिए अपडेट सुनें दबाएं। आपका अनुरोध भेज दिया गया है।',failed:'आवाज़ उपलब्ध नहीं है। आपका अनुरोध भेज दिया गया है।',play:'अपडेट सुनें',stop:'आवाज़ रोकें',latest:'नया अपडेट'},
  fr:{replies:'Lire les demandes et les mises à jour du personnel',review:'Vérifiez la transcription, puis envoyez votre demande.',preparing:'Préparation de la mise à jour vocale…',playing:'Lecture de votre mise à jour…',blocked:'Appuyez sur Écouter la mise à jour pour activer l’audio. Votre demande a été envoyée.',failed:'Audio indisponible. Votre demande a été envoyée.',play:'Écouter la mise à jour',stop:'Arrêter l’audio',latest:'Dernière mise à jour'}
};
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

// ---------------------------------------------------------------- Shared pieces
function ThemeSwitch() {
  const [theme,setTheme] = useState(()=>KaalingaTheme.get());
  useEffect(()=>{
    const update=()=>setTheme(KaalingaTheme.get());
    window.addEventListener('kaalinga-theme-change',update);
    return ()=>window.removeEventListener('kaalinga-theme-change',update);
  },[]);
  const dark=theme==='dark';
  const label='Switch to '+(dark?'light':'dark')+' mode';
  return h('button',{type:'button',className:'btn btn-quiet btn-sm',onClick:()=>KaalingaTheme.set(dark?'light':'dark'),'aria-label':label,title:label},
    h(Icon,{path:dark?GLYPH.sun:GLYPH.moon,size:16}));
}
function StatusTrack({status, copy}) {
  const reached = status==='RESOLVED' ? 2 : status==='ACKNOWLEDGED' ? 1 : 0;
  const steps = [copy.received, copy.acknowledged, copy.resolved];
  return h('div',{className:'track'}, steps.map((label,index)=>h('div',{
      key:label, className:'track-step'+(index<=reached?' on':'')+(index===2&&reached===2?' done':'')},
    h('span',{className:'track-dot'}),
    h('span',{className:'track-label'},label),
    index<2 && h('span',{className:'track-line'})
  )));
}

// ---------------------------------------------------------------- Sign in
function Login({ config, error, onLogin, onReload }) {
  const [email, setEmail] = useState('patient@kaalinga.demo');
  const [patientEmail, setPatientEmail] = useState('patient@kaalinga.demo');
  const [roleChoice, setRoleChoice] = useState('patient');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  const mainRoles = ['nurse','charge','bedside','housekeeping','dietary','coordinator'];
  const accounts = config?.accounts || [];
  const patients = accounts.filter(account=>account.role==='patient');
  const otherAccounts = accounts.filter(account=>account.role!=='patient' && !mainRoles.includes(account.id));
  const selected = accounts.find(account=>account.email===email);
  function chooseRole(value) {
    setRoleChoice(value); setLoginError('');
    setEmail(value==='patient' ? (patients.find(patient=>patient.email===patientEmail)?.email || patients[0]?.email || '') : value==='other' ? '' : (accounts.find(account=>account.id===value)?.email || ''));
  }
  useEffect(() => { if (config?.localDemo) setPassword('kaalinga-demo'); }, [config]);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setLoginError('');
    try { await onLogin(email,password); } catch (err) { setLoginError(err.message); }
    finally { setBusy(false); }
  }
  const steps = [
    ['Ask','Tell us what you need','Type it, speak it, or press one button — in your own language.'],
    ['Route','Reach the right team','Clinical concerns stay with nursing. Service tasks go to the service team.'],
    ['Follow','Watch the handoff','Receipt, acknowledgement, and completion, each confirmed back to the room.']
  ];
  return h('main',{className:'auth'},
    h('div',{className:'auth-lede'},
      h('span',{className:'eyebrow'},'Rutgers Health Hack · Ops Unleashed'),
      h('h1',null,'The right help, ',h('em',null,'from the right team'),'.'),
      h('p',null,'A calmer call bell. One request from the bed reaches the people who can answer it, and the room hears back at every step.'),
      h('div',{className:'auth-meta'},
        h('span',{className:'pill'},patients.length+' patient rooms'),
        h('span',{className:'pill'},'4 care teams'),
        h('span',{className:'pill'},'12 receipt languages')
      )
    ),
    h('section',{className:'auth-steps','aria-label':'How it works'},
      steps.map(([tag,title,body])=>h('div',{className:'step',key:tag},
        h('span',{className:'step-n'},tag.toUpperCase()),
        h('strong',null,title),
        h('p',null,body)
      ))
    ),
    h('form',{className:'auth-card',onSubmit:submit},
      h('div',null,
        h('span',{className:'eyebrow'},'Start here'),
        h('h2',{style:{marginTop:6}},'Choose your role'),
        h('p',{style:{marginTop:6}},'Sign in to request help, or to respond with your team.')
      ),
      h('div',{className:'field'},
        h('label',{className:'label',htmlFor:'login-role'},'Role'),
        h('select',{id:'login-role',className:'control',value:roleChoice,onChange:e=>chooseRole(e.target.value),disabled:!config || busy},
          h('option',{value:'patient'},'Patient'),
          mainRoles.map(id=>accounts.find(account=>account.id===id)).filter(Boolean).map(account=>h('option',{key:account.id,value:account.id},account.display_name)),
          h('option',{value:'other'},'Other hospital roles…')
        )
      ),
      roleChoice==='patient' && h('div',{className:'field'},
        h('label',{className:'label',htmlFor:'account'},'Patient room'),
        h('select',{id:'account',className:'control',value:email,onChange:e=>{setEmail(e.target.value);setPatientEmail(e.target.value);setLoginError('');},disabled:!config || busy},
          patients.map(account=>h('option',{key:account.id,value:account.email},account.room.replace('RM ','Room ')))
        ),
        h('p',{className:'hint'},patients.length+' patients · separate requests and alerts')
      ),
      roleChoice==='other' && h('div',{className:'field'},
        h('label',{className:'label',htmlFor:'account'},'Additional hospital role'),
        h('select',{id:'account',className:'control',value:email,onChange:e=>setEmail(e.target.value),disabled:!config || busy},
          h('option',{value:'',disabled:true},'Choose an additional role'),
          Object.entries(config?.roleGroups||{}).map(([group,label])=>{
            const members=otherAccounts.filter(account=>account.group===group);
            return members.length ? h('optgroup',{key:group,label},members.map(account=>h('option',{key:account.id,value:account.email},account.display_name))) : null;
          })
        )
      ),
      selected?.mode==='consult' && h('p',{className:'hint'},'Receives staff-arranged consultations. Patient clinical requests reach nursing first.'),
      selected && roleChoice!=='patient' && h('p',{className:'auth-selected'},selected.email),
      h('div',{className:'field'},
        h('label',{className:'label',htmlFor:'password'},'Demo password'),
        h('input',{id:'password',className:'control',type:'password',value:password,autoComplete:'current-password',required:true,onChange:e=>setPassword(e.target.value),disabled:busy})
      ),
      (loginError || error) && h('div',{className:'alert',role:'alert'},loginError || error),
      h('button',{className:'btn btn-primary btn-block',type:'submit',disabled:busy || !config || !email}, busy ? 'Signing in…' : 'Sign in'),
      !config && h('button',{className:'btn btn-block',type:'button',onClick:onReload},'Retry connection'),
      h('details',{className:'auth-help'},
        h('summary',null,'Demo access & setup'),
        selected && h('p',null,'Selected account: '+selected.email),
        config?.localDemo && h('p',null,'Local demo password: kaalinga-demo'),
        h('p',null,'For simultaneous patient and staff accounts, use the separate local test addresses, browser profiles, or a private window.'),
        h('p',null,'Use synthetic requests only. This is a hackathon demonstration.')
      )
    )
  );
}

// ---------------------------------------------------------------- Patient request card
function PatientTicket({ticket, copy, voiceConfigured, onReadback}) {
  const tier = TIERS[ticket.tier];
  const done = ticket.status==='RESOLVED';
  return h('article',{className:'req',style:{borderLeftColor:tier.color}},
    h('div',{className:'req-top'},
      h('strong',{style:{color:tier.color}},ticket.department),
      h('span',{className:'pill '+(done?'pill-ok':ticket.status==='ACKNOWLEDGED'?'pill-accent':'')},
        done?copy.resolved:ticket.status==='ACKNOWLEDGED'?copy.acknowledged:copy.received)
    ),
    h('p',{className:'req-text',dir:'auto'},ticket.original_text),
    h('p',{className:'req-status',dir:'auto'},ticket.status_message || ticket.patient_summary),
    h('div',{className:'req-foot'},
      h('span',null,formatTime(ticket.created_at)+(ticket.parent_id?' · Service task':'')),
      voiceConfigured && h('button',{className:'btn btn-quiet btn-sm',onClick:()=>onReadback(ticket)},
        h(Icon,{path:GLYPH.speaker,size:14}),'Read aloud')
    )
  );
}

// ---------------------------------------------------------------- Staff queue card
function StaffTicket({ticket, now, onAction, pending, onReferral, referralTargets, canRefer, canVideo, videoBusy, onVideo}) {
  const [referralDepartment,setReferralDepartment]=useState('');
  const [referralNote,setReferralNote]=useState('');
  const tier = TIERS[ticket.tier];
  const urgent = ticket.priority <= 2 && ticket.status !== 'RESOLVED';
  const overdue = urgent && ticket.status==='NEW' && now-Date.parse(ticket.created_at) > (ticket.priority===1?30000:120000);
  return h('article',{className:'ticket'+(urgent?' hot':'')+(ticket.status==='RESOLVED'?' closed':''),style:{borderLeftColor:tier.color}},
    h('div',{className:'tk-top'},
      h('span',{className:'tk-room'},ticket.room),
      h('span',{className:'tk-age'},ageLabel(ticket.created_at,now)+' ago · '+formatTime(ticket.created_at))
    ),
    h('p',{className:'tk-text',dir:'auto'},ticket.original_text),
    ticket.summary!==ticket.original_text && h('p',{className:'tk-summary'},ticket.summary),
    h('div',{className:'tk-tags'},
      h('span',{className:'pill '+(urgent?'pill-critical':ticket.status==='RESOLVED'?'pill-ok':ticket.status==='ACKNOWLEDGED'?'pill-accent':'')},'P'+ticket.priority+' · '+ticket.status),
      h('span',{className:'tk-team',style:{color:tier.color}},ticket.department),
      h('span',{className:'pill'},ticket.detected_language),
      ticket.parent_id && h('span',{className:'pill'},ticket.source==='staff_referral'?'Staff referral':'Linked service task'),
      h('span',{className:'pill'},ticket.responder)
    ),
    overdue && h('div',{className:'note note-warn',role:'status'},
      ticket.department==='Nursing'?'Urgent request awaiting acknowledgement. Charge nurse review needed.':'Urgent consultation awaiting acknowledgement. Contact the assigned care team.'),
    h('div',{className:'tk-actions'},
      h('span',{className:'tk-trace'},(SOURCE_LABELS[ticket.source]||ticket.source)+' · '+Math.round(ticket.classification_ms)+' ms'+(ticket.confidence===null?'':' · AI self-report '+Math.round(ticket.confidence*100)+'%')),
      ticket.canAct && ticket.status==='NEW' && h('button',{className:'btn btn-primary',disabled:pending,onClick:()=>onAction(ticket,'acknowledge')},pending?'Saving…':'Acknowledge'),
      ticket.canAct && ticket.status==='ACKNOWLEDGED' && h('button',{className:'btn',disabled:pending,onClick:()=>onAction(ticket,'resolve')},pending?'Saving…':'Mark complete'),
      canVideo && ticket.department==='Nursing' && !ticket.parent_id && ticket.status==='ACKNOWLEDGED' && h('button',{className:'btn btn-primary',disabled:videoBusy||pending,onClick:()=>onVideo(ticket)},'Offer video call'),
      ticket.status==='RESOLVED' && h('span',{className:'pill pill-ok'},'Completed '+formatTime(ticket.resolved_at))
    ),
    ticket.referrals?.length>0 && h('p',{className:'tk-trace'},'Consultations: '+ticket.referrals.map(item=>item.department+' · '+item.status).join(' / ')),
    canRefer && ticket.status!=='RESOLVED' && h('details',{className:'tk-refer'},
      h('summary',null,'Arrange a consultation'),
      h('form',{onSubmit:async e=>{e.preventDefault();if(await onReferral(ticket,referralDepartment,referralNote))setReferralNote('');}},
        h('div',{className:'field'},
          h('label',{className:'label',htmlFor:'referral-'+ticket.id},'Consultation service'),
          h('select',{id:'referral-'+ticket.id,className:'control',value:referralDepartment,onChange:e=>setReferralDepartment(e.target.value),required:true},
            h('option',{value:''},'Choose a service'),
            referralTargets.map(target=>h('option',{key:target.department,value:target.department},target.department)))
        ),
        h('div',{className:'field'},
          h('label',{className:'label',htmlFor:'referral-note-'+ticket.id},'Referral note'),
          h('textarea',{id:'referral-note-'+ticket.id,className:'control',value:referralNote,onChange:e=>setReferralNote(e.target.value),maxLength:500,required:true,placeholder:'Share the specific task the service should review.'})
        ),
        h('button',{className:'btn',disabled:pending||!referralDepartment||!referralNote.trim()},'Send referral')
      )
    )
  );
}

// ---------------------------------------------------------------- Video check-in
const VIDEO_COPY={
  en:{title:'Nurse check-in',invite:'Your nurse would like to speak with you.',privacy:'Camera and microphone start only when you choose to join. No recording.',waiting:'Waiting for the patient to accept.',accepted:'Patient accepted. Join when you are ready.',join:'Accept video call',audio:'Accept audio only',nurseJoin:'Start video preview',nurseAudio:'Start audio only',decline:'Decline',end:'End call',dismiss:'Dismiss',you:'You',other:'Your nurse',patient:'Patient',preparing:'Opening camera and microphone…',connecting:'Connecting…',connected:'Connected',ended:'Call ended. Your request stays in the care team’s queue.',permission:'Camera or microphone access was denied. Try audio only, or allow access in your browser.',device:'Camera or microphone is unavailable. Try audio only or another device.',unsupported:'Video calling is unavailable in this browser. Use the bedside call bell or your request.',network:'Connection unavailable. Your request is still with the care team.',connection:'The video connection failed. Your request remains open.',mute:'Mute microphone',unmute:'Unmute microphone',cameraOff:'Turn camera off',cameraOn:'Turn camera on',remote:'Waiting for the other person…',enableAudio:'Enable call audio'},
  es:{title:'Consulta con enfermería',invite:'Su enfermera desea hablar con usted.',privacy:'La cámara y el micrófono se activan cuando decide unirse. No se graba.',waiting:'Esperando la aceptación del paciente.',accepted:'El paciente aceptó. Únase cuando esté listo.',join:'Aceptar videollamada',audio:'Aceptar solo audio',nurseJoin:'Iniciar vista previa',nurseAudio:'Iniciar solo audio',decline:'Rechazar',end:'Finalizar llamada',dismiss:'Cerrar',you:'Usted',other:'Su enfermera',patient:'Paciente',preparing:'Abriendo cámara y micrófono…',connecting:'Conectando…',connected:'Conectado',ended:'La llamada terminó. Su solicitud sigue con el equipo de atención.',permission:'Acceso denegado. Pruebe solo audio o permita el acceso en su navegador.',device:'Cámara o micrófono no disponible. Pruebe solo audio.',unsupported:'Este navegador no permite videollamadas.',network:'Conexión no disponible. Su solicitud sigue con el equipo.',connection:'La conexión falló. Su solicitud permanece abierta.',mute:'Silenciar micrófono',unmute:'Activar micrófono',cameraOff:'Apagar cámara',cameraOn:'Encender cámara',remote:'Esperando a la otra persona…',enableAudio:'Activar audio'},
  hi:{title:'नर्स से बातचीत',invite:'नर्स आपसे बात करना चाहती हैं।',privacy:'शामिल होने पर ही कैमरा और माइक्रोफ़ोन चालू होंगे। रिकॉर्डिंग नहीं होगी।',waiting:'मरीज के स्वीकार करने की प्रतीक्षा है।',accepted:'मरीज ने स्वीकार किया है। तैयार होने पर जुड़ें।',join:'वीडियो कॉल स्वीकार करें',audio:'केवल आवाज़ से जुड़ें',nurseJoin:'वीडियो प्रीव्यू शुरू करें',nurseAudio:'केवल आवाज़ शुरू करें',decline:'मना करें',end:'कॉल समाप्त करें',dismiss:'बंद करें',you:'आप',other:'आपकी नर्स',patient:'मरीज',preparing:'कैमरा और माइक्रोफ़ोन शुरू हो रहे हैं…',connecting:'कनेक्ट हो रहा है…',connected:'कनेक्ट हो गया',ended:'कॉल समाप्त हुई। आपका अनुरोध देखभाल टीम के पास रहेगा।',permission:'कैमरा या माइक्रोफ़ोन की अनुमति नहीं मिली। केवल आवाज़ चुनें या ब्राउज़र में अनुमति दें।',device:'कैमरा या माइक्रोफ़ोन उपलब्ध नहीं है। केवल आवाज़ चुनें।',unsupported:'इस ब्राउज़र में वीडियो कॉल उपलब्ध नहीं है।',network:'कनेक्शन उपलब्ध नहीं है। आपका अनुरोध टीम के पास है।',connection:'वीडियो कनेक्शन नहीं हुआ। आपका अनुरोध खुला रहेगा।',mute:'माइक्रोफ़ोन बंद करें',unmute:'माइक्रोफ़ोन चालू करें',cameraOff:'कैमरा बंद करें',cameraOn:'कैमरा चालू करें',remote:'दूसरे व्यक्ति की प्रतीक्षा है…',enableAudio:'कॉल की आवाज़ चालू करें'},
  fr:{title:'Entretien infirmier',invite:'Votre infirmière souhaite vous parler.',privacy:'Caméra et microphone démarrent uniquement lorsque vous rejoignez l’appel. Aucun enregistrement.',waiting:'En attente de l’accord du patient.',accepted:'Le patient a accepté. Rejoignez l’appel quand vous êtes prêt.',join:'Accepter l’appel vidéo',audio:'Accepter en audio',nurseJoin:'Démarrer l’aperçu vidéo',nurseAudio:'Démarrer en audio',decline:'Refuser',end:'Terminer l’appel',dismiss:'Fermer',you:'Vous',other:'Votre infirmière',patient:'Patient',preparing:'Ouverture de la caméra et du microphone…',connecting:'Connexion…',connected:'Connecté',ended:'L’appel est terminé. Votre demande reste auprès de l’équipe.',permission:'Accès refusé. Essayez l’audio seul ou autorisez l’accès dans votre navigateur.',device:'Caméra ou microphone indisponible. Essayez l’audio seul.',unsupported:'Appel vidéo indisponible dans ce navigateur.',network:'Connexion indisponible. Votre demande reste auprès de l’équipe.',connection:'La connexion vidéo a échoué. Votre demande reste ouverte.',mute:'Couper le microphone',unmute:'Activer le microphone',cameraOff:'Couper la caméra',cameraOn:'Activer la caméra',remote:'En attente de l’autre personne…',enableAudio:'Activer l’audio'}
};
function VideoCallPanel({call,user,language,onChange,onDismiss,onMedia,onBeforeJoin}){
  const copy=VIDEO_COPY[language.split('-')[0]]||VIDEO_COPY.en;
  const patient=user.id===call.patient_id;
  const [state,setState]=useState({status:'waiting',errorKey:null});
  const [local,setLocal]=useState(null),[remote,setRemote]=useState(null);
  const [muted,setMuted]=useState(false),[camera,setCamera]=useState(true),[audioBlocked,setAudioBlocked]=useState(false);
  const session=useRef(null),localVideo=useRef(null),remoteVideo=useRef(null);
  useEffect(()=>{
    const controller=KaalingaVideo.createSession({call,userId:user.id,request:api,onState:setState,onCallChange:onChange,onLocalStream:stream=>{setLocal(stream);onMedia(Boolean(stream));},onRemoteStream:setRemote});
    session.current=controller;controller.poll();
    return()=>{controller.dispose();session.current=null;onMedia(false);};
  },[call.id,user.id]);
  useEffect(()=>{if(localVideo.current)localVideo.current.srcObject=local;},[local]);
  useEffect(()=>{if(remoteVideo.current){remoteVideo.current.srcObject=remote;if(remote)remoteVideo.current.play().catch(()=>setAudioBlocked(true));}},[remote]);
  const terminal=!KaalingaVideo.ACTIVE.includes(call.status)||state.status==='ended';
  async function join(audioOnly){onBeforeJoin();await session.current.start(audioOnly);}
  return h('section',{className:'call','aria-label':copy.title},
    h('div',{className:'call-inner'},
      h('div',{className:'call-head'},
        h('div',null,h('span',{className:'eyebrow'},call.room),h('h2',{style:{marginTop:4}},copy.title)),
        h('span',{className:'pill pill-accent'},terminal?copy.ended:state.status==='connected'?copy.connected:state.status==='connecting'?copy.connecting:call.status==='RINGING'?(patient?copy.invite:copy.waiting):copy.accepted)
      ),
      h('p',{className:'call-privacy'},copy.privacy),
      (local||remote)&&h('div',{className:'call-videos'},
        h('div',{className:'call-tile'},remote&&h('video',{ref:remoteVideo,autoPlay:true,playsInline:true,controls:true,'aria-label':patient?copy.other:copy.patient}),!remote&&h('span',{className:'call-placeholder'},copy.remote),h('span',{className:'call-caption'},patient?copy.other:copy.patient)),
        h('div',{className:'call-tile'},h('video',{ref:localVideo,autoPlay:true,playsInline:true,muted:true,'aria-label':copy.you}),h('span',{className:'call-caption'},copy.you))
      ),
      state.errorKey&&h('p',{className:'alert',role:'alert'},copy[state.errorKey]),
      state.status==='preparing'&&h('p',{className:'hint',role:'status'},copy.preparing),
      h('div',{className:'call-controls'},
        !terminal&&!local&&h(React.Fragment,null,
          h('button',{className:'btn btn-primary',disabled:state.status==='preparing',onClick:()=>join(false)},patient?copy.join:copy.nurseJoin),
          h('button',{className:'btn',disabled:state.status==='preparing',onClick:()=>join(true)},patient?copy.audio:copy.nurseAudio)
        ),
        !terminal&&local&&h('button',{className:'btn','aria-pressed':muted,onClick:()=>{session.current.mute(!muted);setMuted(!muted);}},muted?copy.unmute:copy.mute),
        !terminal&&local?.getVideoTracks().length>0&&h('button',{className:'btn','aria-pressed':!camera,onClick:()=>{session.current.camera(!camera);setCamera(!camera);}},camera?copy.cameraOff:copy.cameraOn),
        audioBlocked&&remote&&h('button',{className:'btn btn-primary',onClick:()=>remoteVideo.current.play().then(()=>setAudioBlocked(false)).catch(()=>{})},copy.enableAudio),
        !terminal&&h('button',{className:'btn btn-danger',onClick:()=>session.current.end(patient&&call.status==='RINGING'?'decline':'end')},patient&&call.status==='RINGING'?copy.decline:copy.end),
        terminal&&h('button',{className:'btn',onClick:onDismiss},copy.dismiss)
      )
    )
  );
}

const WAKE_COPY={
  en:{title:'Hey Kaalinga',enable:'Enable hands-free',disable:'Stop hands-free',hint:'Say “Hey Kaalinga, I need water.” Then say “Send request” or “Cancel”.',awsPrivacy:'Audio is streamed to Amazon Transcribe while listening. Stop hands-free to stop the microphone.',awsReview:'Voice input uses your selected language. Review the transcript before sending.',privacy:'Microphone stays active while this page is visible. Browser recognition may send audio to its speech service. This is an experimental browser feature.',wake:'Listening for “Hey Kaalinga”…',capture:'Listening — tell me what you need.',confirm:'Say “Send request” to confirm, or “Cancel”.',sending:'Sending your request…',paused:'Listening paused during audio, a call, or another task.',starting:'Starting microphone…',off:'Hands-free is off.',error:'Hands-free stopped. Check microphone permission or use Voice input.',unavailable:'Hands-free needs supported browser speech recognition and configured voice replies.',play:'Play voice prompt'},
  es:{title:'Hey Kaalinga',enable:'Activar manos libres',disable:'Detener manos libres',hint:'Diga “Hey Kaalinga” y su solicitud. Después diga “Enviar solicitud” o “Cancelar”.',awsPrivacy:'El audio se envía a Amazon Transcribe mientras escucha. Detenga manos libres para apagar el micrófono.',awsReview:'La voz usa el idioma seleccionado. Revise la transcripción antes de enviar.',privacy:'El micrófono permanece activo mientras esta página está visible. El navegador puede enviar audio a su servicio de voz. Función experimental.',wake:'Esperando “Hey Kaalinga”…',capture:'Le escucho. Dígame qué necesita.',confirm:'Diga “Enviar solicitud” o “Cancelar”.',sending:'Enviando su solicitud…',paused:'Escucha pausada durante audio, una llamada u otra tarea.',starting:'Iniciando micrófono…',off:'Manos libres desactivado.',error:'La escucha se detuvo. Revise el permiso del micrófono.',unavailable:'Requiere reconocimiento del navegador y respuestas de voz configuradas.',play:'Reproducir indicación'},
  hi:{title:'हे कालिंगा',enable:'हैंड्स-फ़्री चालू करें',disable:'हैंड्स-फ़्री बंद करें',hint:'“हे कालिंगा, मुझे पानी चाहिए” कहें। फिर “अनुरोध भेजें” या “रद्द करें” कहें।',awsPrivacy:'सुनते समय आवाज़ Amazon Transcribe को भेजी जाती है। माइक्रोफ़ोन रोकने के लिए हैंड्स-फ़्री बंद करें।',awsReview:'आवाज़ के लिए चुनी गई भाषा उपयोग होती है। भेजने से पहले लिखित अनुरोध जाँचें।',privacy:'यह पेज दिखाई देने पर माइक्रोफ़ोन चालू रहता है। ब्राउज़र आवाज़ अपनी पहचान सेवा को भेज सकता है। यह प्रयोगात्मक सुविधा है।',wake:'“हे कालिंगा” सुनने की प्रतीक्षा…',capture:'मैं सुन रही हूँ। बताइए आपको क्या चाहिए।',confirm:'“अनुरोध भेजें” या “रद्द करें” कहें।',sending:'आपका अनुरोध भेजा जा रहा है…',paused:'आवाज़, कॉल या अन्य काम के दौरान सुनना रुका है।',starting:'माइक्रोफ़ोन शुरू हो रहा है…',off:'हैंड्स-फ़्री बंद है।',error:'सुनना रुक गया। माइक्रोफ़ोन की अनुमति जाँचें।',unavailable:'ब्राउज़र में आवाज़ पहचान और कॉन्फ़िगर किए गए जवाब ज़रूरी हैं।',play:'आवाज़ का निर्देश सुनें'},
  fr:{title:'Hey Kaalinga',enable:'Activer mains libres',disable:'Arrêter mains libres',hint:'Dites « Hey Kaalinga » puis votre demande. Ensuite, dites « Envoyer la demande » ou « Annuler ».',awsPrivacy:'L’audio est transmis à Amazon Transcribe pendant l’écoute. Arrêtez mains libres pour couper le microphone.',awsReview:'La voix utilise la langue sélectionnée. Vérifiez la transcription avant l’envoi.',privacy:'Le microphone reste actif lorsque cette page est visible. Le navigateur peut envoyer l’audio à son service vocal. Fonction expérimentale.',wake:'En attente de « Hey Kaalinga »…',capture:'Je vous écoute. Dites-moi ce dont vous avez besoin.',confirm:'Dites « Envoyer la demande » ou « Annuler ».',sending:'Envoi de votre demande…',paused:'Écoute suspendue pendant un audio, un appel ou une autre tâche.',starting:'Démarrage du microphone…',off:'Mains libres désactivé.',error:'Écoute arrêtée. Vérifiez l’autorisation du microphone.',unavailable:'Nécessite la reconnaissance du navigateur et des réponses vocales configurées.',play:'Lire l’instruction vocale'}
};

// ---------------------------------------------------------------- Application
function App() {
  const [config,setConfig] = useState(null);
  const [user,setUser] = useState(null);
  const [booting,setBooting] = useState(true);
  const [bootError,setBootError] = useState('');
  const [tickets,setTickets] = useState([]);
  const [notifications,setNotifications] = useState([]);
  const [roster,setRoster] = useState([]);
  const [rosterOpen,setRosterOpen] = useState(false);
  const [rosterBusy,setRosterBusy] = useState('');
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
  const [voiceDraft,setVoiceDraft] = useState(false);
  const [voiceReplies,setVoiceReplies] = useState(true);
  const [voicePlayback,setVoicePlayback] = useState({status:'idle',ticket:null});
  const [patientUpdate,setPatientUpdate] = useState(null);
  const [activeCall,setActiveCall]=useState(null),[videoBusy,setVideoBusy]=useState(false),[videoOpen,setVideoOpen]=useState(false);
  const seenCalls=useRef(new Set());
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
  const wakeListener = useRef(null);
  const [wakeState,setWakeState]=useState({enabled:false,phase:'wake',status:'off',error:null});
  const voicePlayer = useRef(null);
  if (!voicePlayer.current) voicePlayer.current = KaalingaVoice.createPlayer({onState:state=>{setVoicePlayback(state);wakeListener.current?.suspend('speech',state.status!=='idle');}});
  const voiceUpdates = useRef(KaalingaVoice.createUpdateTracker());
  const deferredVoice = useRef([]);
  const voiceSettings = useRef(null);
  voiceSettings.current = {enabled:Boolean(config?.voiceConfigured && voiceReplies && !videoOpen)};
  const toastTimer = useRef(null);
  const normalBusy = useRef(false);
  const urgentBusy = useRef(false);
  const pollBusy = useRef(false);
  const activeUser = useRef(null);
  const seenNotifications = useRef(new Set());
  const clockOffset = useRef(0);
  const copy = COPY[language.split('-')[0]] || COPY.en;
  const voiceCopy = VOICE_COPY[language.split('-')[0]] || VOICE_COPY.en;
  const isPatient = user?.role==='patient';
  const wakeCopy=WAKE_COPY[language.split('-')[0]]||WAKE_COPY.en;
  const wakeSupported=Boolean(KaalingaTranscribe.getRecognition(config||{})&&WAKE_COPY[language.split('-')[0]]&&config?.voiceConfigured);

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
  useEffect(()=>{ boot(); return ()=>{ clearTimeout(toastTimer.current); wakeListener.current?.dispose(); recognitionRef.current?.abort(); voicePlayer.current.stop(); }; },[]);
  useEffect(()=>{
    stopWake();
    setVoiceDraft(false); voicePlayer.current.stop(); voiceUpdates.current.reset(); deferredVoice.current=[]; setPatientUpdate(null);
    setActiveCall(null);setVideoOpen(false);seenCalls.current.clear();
    const previous=recognitionRef.current; recognitionRef.current=null; previous?.abort(); setRecording(false);
  },[user?.id]);
  useEffect(()=>{
    if (recording || !voiceSettings.current.enabled) return;
    const waiting=deferredVoice.current; deferredVoice.current=[];
    for(const ticket of waiting) voicePlayer.current.enqueue(ticket);
  },[recording]);
  function stopWake(){
    wakeListener.current?.dispose();wakeListener.current=null;
    setWakeState({enabled:false,phase:'wake',status:'off',error:null});
  }
  function toggleWake(){
    if(wakeState.enabled){stopWake();if(voicePlayback.ticket?.assistant_prompt)voicePlayer.current.stop();return;}
    stopWake();voicePlayer.current.stop();
    const speaker=activeUser.current;
    const controller=KaalingaWake.createListener({Recognition:KaalingaTranscribe.getRecognition(config),language,onState:state=>{if(activeUser.current===speaker)setWakeState(state);},
      onDraft:draft=>{if(activeUser.current===speaker){setText(draft);setVoiceDraft(Boolean(draft));}},
      onPrompt:(prompt,draft)=>{
        if(activeUser.current!==speaker)return;
        controller.suspend('speech',true);
        voicePlayer.current.enqueue({id:crypto.randomUUID(),status:'ASSISTANT',assistant_prompt:prompt,language,draft});
      },
      onSend:draft=>activeUser.current===speaker?send(draft):Promise.resolve(false)
    });
    wakeListener.current=controller;
    controller.suspend('hidden',document.hidden);
    controller.start();
  }
  useEffect(()=>{
    const changed=()=>wakeListener.current?.suspend('hidden',document.hidden);
    document.addEventListener('visibilitychange',changed);
    return()=>document.removeEventListener('visibilitychange',changed);
  },[]);
  useEffect(()=>{
    wakeListener.current?.suspend('busy',processing||emergencyProcessing||demoRunning);
    wakeListener.current?.suspend('video',videoOpen);
    wakeListener.current?.suspend('manual',recording);
  },[processing,emergencyProcessing,demoRunning,videoOpen,recording]);
  function patientFeedback(ticket) {
    setPatientUpdate(ticket);
    if (!voiceSettings.current.enabled) return;
    if (recognitionRef.current) deferredVoice.current.push(ticket);
    else voicePlayer.current.enqueue(ticket);
  }
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
        setUser(result.user); setTickets(result.tickets); setNotifications(result.notifications); setConnected(true);
        if(result.user.role==='patient') {
          for(const ticket of voiceUpdates.current.observe(result.tickets,first)) patientFeedback(ticket);
        }
        if(result.user.role==='patient'||['nurse','charge'].includes(result.user.id)){
          const calls=await api('/api/calls');
          if(cancelled||activeUser.current!==id||calls.userId!==id)return;
          const current=calls.calls.find(call=>KaalingaVideo.ACTIVE.includes(call.status));
          setActiveCall(previous=>current||calls.calls.find(call=>call.id===previous?.id)||null);
          if(result.user.role==='patient'&&current?.status==='RINGING'&&!seenCalls.current.has(current.id)){
            seenCalls.current.add(current.id);
            patientFeedback({id:current.id,call_id:current.id,status:'CALL_INVITE',status_message:current.invitation_message});
          }
        }
        if(result.user.role!=='patient') {
          const staffing=await api('/api/roster');
          if(!cancelled && activeUser.current===id && staffing.userId===id) setRoster(staffing.roster);
        }
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
    stopWake();recognitionRef.current?.abort(); deferredVoice.current=[]; voicePlayer.current.stop();
    activeUser.current=null; setUser(null); setTickets([]); setNotifications([]); setRoster([]); setRosterOpen(false); setText(''); setNotificationOpen(false); setDemoResults([]); setConnected(false);
  }
  async function refresh() {
    const id=activeUser.current;
    const data=await api('/api/tickets');
    if(activeUser.current!==id) return;
    if(data.user.id!==id) { activeUser.current=data.user.id; setUser(data.user); setTickets([]); setNotifications([]); return; }
    setUser(data.user); setTickets(data.tickets); setNotifications(data.notifications); setConnected(true);
  }
  async function deliverRequest(payload) {
    const sender=activeUser.current;
    const data=await api('/api/requests',post(payload));
    if(activeUser.current!==sender || data.ticket.patient_id!==sender) return data.ticket;
    voiceUpdates.current.remember(data.ticket);
    setTickets(prev=>[data.ticket,...prev.filter(t=>t.id!==data.ticket.id)]);
    refresh().catch(()=>{});
    return data.ticket;
  }
  async function send(input,urgent=false,retry=null) {
    if (!input.trim() || (urgent?urgentBusy.current:normalBusy.current)) return;
    if(urgent) { urgentBusy.current=true; setEmergencyProcessing(true); }
    else { normalBusy.current=true; setProcessing(true); }
    const payload=retry ? {text:retry.text,language:retry.language,forceClinical:retry.forceClinical,requestKey:retry.requestKey} : {text:input.trim(),language,forceClinical:urgent,requestKey:crypto.randomUUID()};
    const sender=activeUser.current;
    const recognition=recognitionRef.current; recognitionRef.current=null; recognition?.abort(); setRecording(false);
    setRequestError(''); setRetryRequest(null);
    try {
      const ticket=await deliverRequest(payload);
      if(activeUser.current!==sender || ticket.patient_id!==sender) return;
      setText(current=>current===input?'':current);
      setVoiceDraft(false);
      announce(ticket.status_message || ticket.patient_summary);
      patientFeedback(ticket);
      return true;
    } catch(err) {
      if(activeUser.current!==sender) return;
      setRequestError('Your request was not confirmed as delivered. Retry, or use the bedside call bell for help.');
      setRetryRequest(payload); setConnected(false);
      return false;
    } finally {
      if(urgent) { urgentBusy.current=false; setEmergencyProcessing(false); }
      else { normalBusy.current=false; setProcessing(false); }
    }
  }
  function toggleRecording() {
    stopWake();
    if(recording) { recognitionRef.current?.stop(); setRecording(false); return; }
    const Recognition=KaalingaTranscribe.getRecognition(config);
    if(!Recognition) { announce('Voice input is unavailable in this browser. You can type or use a quick request.'); return; }
    const recognition=new Recognition();
    const speaker=activeUser.current;
    voicePlayer.current.stop(); setVoiceDraft(false);
    recognition.lang=language; recognition.continuous=false; recognition.interimResults=true;
    recognition.onresult=e=>{
      if(activeUser.current!==speaker || recognitionRef.current!==recognition) return;
      const transcript=Array.from(e.results).map(result=>result[0].transcript).join(' ');
      setText(transcript); setVoiceDraft(Boolean(transcript.trim()));
    };
    recognition.onend=()=>{if(recognitionRef.current===recognition){recognitionRef.current=null;setRecording(false);}};
    recognition.onerror=()=>{ if(activeUser.current===speaker && recognitionRef.current===recognition){setRecording(false);announce('Voice input stopped. You can still type your request.');} };
    recognitionRef.current=recognition;
    try { recognition.start(); setRecording(true); } catch(_) { announce('Microphone could not start. Please type your request.'); }
  }
  async function readback(ticket) {
    const recognition=recognitionRef.current; recognitionRef.current=null; recognition?.abort(); setRecording(false);
    return voicePlayer.current.play(ticket);
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
  async function refer(ticket,department,note) {
    if(pendingAction) return false;
    setPendingAction(ticket.id);
    try {
      await api('/api/tickets/'+ticket.id+'/referrals',post({department,note}));
      await refresh(); announce('Referral saved. The consultation queue has been updated.'); return true;
    } catch(err) { announce(err.message); return false; }
    finally { setPendingAction(null); }
  }
  function stopPatientAudio(){
    stopWake();
    const recognition=recognitionRef.current;recognitionRef.current=null;recognition?.abort();setRecording(false);deferredVoice.current=[];voicePlayer.current.stop();
  }
  async function offerVideo(ticket){
    if(videoBusy)return;setVideoBusy(true);const sender=activeUser.current;
    try{const result=await api('/api/calls',post({ticketId:ticket.id}));if(activeUser.current===sender){setActiveCall(result.call);announce('Video invitation sent. The patient chooses whether to join.');}}
    catch(err){announce(err.message);}finally{setVideoBusy(false);}
  }
  async function shift(member) {
    if(rosterBusy) return;
    setRosterBusy(member.id);
    try { const result=await api('/api/roster/'+member.id,{method:'PATCH',body:JSON.stringify({on_shift:!member.on_shift})});setRoster(result.roster);await refresh(); }
    catch(err) { announce(err.message); }
    finally { setRosterBusy(''); }
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

  // ------------------------------------------------------------ Derived values
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
  const voiceStatusText=voicePlayback.status==='loading'?voiceCopy.preparing:voicePlayback.status==='playing'?voiceCopy.playing:voicePlayback.status==='blocked'?voiceCopy.blocked:voiceCopy.failed;
  const showVoiceRow=voicePlayback.status!=='idle' && !voicePlayback.ticket?.assistant_prompt;
  const audioControl=['loading','playing'].includes(voicePlayback.status)
    ? h('button',{className:'btn btn-sm',onClick:()=>{deferredVoice.current=[];voicePlayer.current.stop();}},voiceCopy.stop)
    : h('button',{className:'btn btn-sm btn-primary',onClick:()=>voicePlayer.current.retry(voicePlayback.ticket)},voiceCopy.play);

  // ------------------------------------------------------------ Chrome
  const header=h('nav',{className:'topbar','aria-label':'Main'},
    h('div',{className:'brand'},
      h('span',{className:'brand-mark'},h(Logo)),
      h('span',null,
        h('span',{className:'brand-name'},'Kaalinga'),
        h('span',{className:'brand-unit'},'Adult inpatient')
      )
    ),
    h('div',{className:'bar-actions'},
      user && h(React.Fragment,null,
        h('span',{className:'whoami'},
          h('strong',null,user.display_name),
          h('span',null,isPatient?user.room:(user.department||'Unit oversight'))
        ),
        !isPatient && h('button',{className:'btn btn-sm',onClick:()=>setRosterOpen(!rosterOpen),'aria-expanded':rosterOpen},
          h(Icon,{path:GLYPH.team,size:14}),'Roster'),
        h('button',{className:'btn btn-sm',onClick:toggleNotifications,'aria-expanded':notificationOpen},
          h(Icon,{path:GLYPH.bell,size:14}),'Alerts',unread?h('span',{className:'count'},unread):null),
        notificationPermission!=='granted' && notificationPermission!=='denied' && notificationPermission!=='unsupported' &&
          h('button',{className:'btn btn-sm btn-quiet',onClick:enableNotifications},'Browser alerts'),
        h('button',{className:'btn btn-sm btn-quiet',onClick:logout,disabled:processing||demoRunning||emergencyProcessing,'aria-label':'Sign out',title:'Sign out'},
          h(Icon,{path:GLYPH.exit,size:15}))
      ),
      h(ThemeSwitch)
    )
  );
  const statusline=h('div',{className:'statusline'},
    h('span',{className:'conn',role:'status'},h('span',{className:'dot'+(connected?'':' off')}),connected?'Live · 2s refresh':'Reconnecting…'),
    h('span',null,'Synthetic requests · hackathon demo'),
    h('span',{className:'spacer'}),
    h('span',{className:'model'},config?.aiConfigured?(config.aiProvider==='bedrock'?'AWS Bedrock':'AI assisted')+' · '+config.model:'Routing rules · AI not configured')
  );
  const footer=h('footer',{className:'footer'},'Kaalinga · Rutgers Health Hack 2026 · Coordinated service requests, with clinical review kept in nursing.');

  if(booting) return h('div',{className:'app'},header,
    h('main',{className:'blank'},h('div',{className:'spinner'}),h('p',null,'Connecting to Kaalinga…')));
  if(!user) return h('div',{className:'app'},header,h(Login,{config,error:bootError,onLogin:login,onReload:boot}),footer);

  const alertSheet=notificationOpen && h('section',{className:'sheet','aria-label':'Your notifications'},
    h('div',{className:'sheet-inner'},
      h('h2',null,'Your notifications'),
      h('p',{className:'sheet-sub'},'Durable in-app alerts. Closed-browser push, SMS, and email are not part of this demo.'),
      notifications.length
        ? notifications.map(n=>h('div',{className:'feed-item'+(!n.read_at?' unread':''),key:n.id},n.message,h('time',{dateTime:n.created_at},formatTime(n.created_at))))
        : h('p',{className:'hint'},'No alerts yet.')
    )
  );
  const rosterSheet=!isPatient && rosterOpen && h('section',{className:'sheet','aria-label':'Unit staffing roster'},
    h('div',{className:'sheet-inner'},
      h('h2',null,'Adult inpatient · demo staffing roster'),
      h('p',{className:'sheet-sub'},'Shift availability is saved and controls who receives and accepts new tasks. Role permissions are demo policy; RWJUH credentials, patient assignments, and delegation still need validation.'),
      Object.entries(config.roleGroups).map(([group,label])=>h('div',{key:group,className:'roster-group'},
        h('h3',null,label),
        roster.filter(member=>member.group===group).map(member=>h('div',{className:'roster-row',key:member.id},
          h('div',{style:{minWidth:0}},
            h('strong',null,member.staff_role),
            h('p',null,(member.department||'Unit oversight')+' · '+member.mode),
            h('small',null,member.email)
          ),
          user.manageRoster
            ? h('label',null,h('input',{type:'checkbox',checked:member.on_shift,disabled:Boolean(rosterBusy),onChange:()=>shift(member),'aria-label':'On shift: '+member.staff_role}),'On shift')
            : h('span',{className:'pill '+(member.on_shift?'pill-ok':'')},member.on_shift?'On shift':'Off shift')
        ))
      ))
    )
  );
  const call=activeCall&&h(VideoCallPanel,{key:activeCall.id,call:activeCall,user,language,onBeforeJoin:stopPatientAudio,onMedia:setVideoOpen,
    onDismiss:()=>setActiveCall(null),onChange:next=>{if(activeUser.current===user.id)setActiveCall(previous=>previous?.id===next.id?next:previous);}});

  // ------------------------------------------------------------ Patient
  if(isPatient) {
    const quickIcons=[GLYPH.water,GLYPH.blanket,GLYPH.bathroom,GLYPH.alert];
    const quickColors=['var(--t-services)','var(--t-bedside)','var(--t-bedside)','var(--critical)'];
    const tracked=['NEW','ACKNOWLEDGED','RESOLVED'].includes(patientUpdate?.status);
    return h('div',{className:'app'},header,statusline,alertSheet,call,
      h('main',{className:'patient',dir:language.startsWith('ar')?'rtl':'ltr'},
        h('div',{className:'p-greeting'},
          h('span',{className:'p-room'},h('span',{className:'dot'}),user.room),
          h('h1',null,copy.title),
          h('p',null,copy.intro),
          h('div',{className:'p-lang'},
            h('label',{htmlFor:'patient-language'},'Language / भाषा'),
            h('select',{id:'patient-language',className:'control',value:language,'aria-label':'Patient language',
              onChange:e=>{stopWake();const recognition=recognitionRef.current;recognitionRef.current=null;recognition?.abort();setRecording(false);setVoiceDraft(false);deferredVoice.current=[];voicePlayer.current.stop();setLanguage(e.target.value);}},
              LANGUAGES.map(([code,label])=>h('option',{key:code,value:code},label)))
          )
        ),
        h('button',{className:'urgent',disabled:emergencyProcessing,
          onClick:()=>{stopWake();send('Emergency help requested using the urgent call button.',true);}},
          h('span',{className:'urgent-ico'},h(Icon,{path:GLYPH.alert,size:22,stroke:2.1})),
          h('span',null,emergencyProcessing?'Sending urgent request…':copy.urgent,h('small',null,copy.urgentSub))
        ),
        patientUpdate && h('section',{className:'live','aria-label':voiceCopy.latest,'aria-live':'polite'},
          h('div',{className:'live-head'},
            h('span',{className:'eyebrow'},voiceCopy.latest),
            patientUpdate.created_at && h('span',{className:'mono',style:{fontSize:11,color:'var(--ink-3)'}},formatTime(patientUpdate.created_at))
          ),
          h('div',{className:'live-body'},
            h('p',{dir:'auto'},patientUpdate.status_message || patientUpdate.patient_summary),
            tracked && h(StatusTrack,{status:patientUpdate.status,copy}),
            showVoiceRow && h('div',{className:'audio-row'},h('span',null,voiceStatusText),audioControl)
          )
        ),
        !patientUpdate && showVoiceRow && h('div',{className:'card'},
          h('div',{className:'audio-row',style:{borderTop:0,paddingTop:0},role:'status'},h('span',null,voiceStatusText),audioControl)),
        h('div',{className:'quick'},[copy.water,copy.blanket,copy.bathroom,copy.pain].map((label,index)=>
          h('button',{key:index,className:'qb',disabled:processing||demoRunning,
            onClick:()=>{stopWake();setVoiceDraft(false);setText(copy.quick[index]);send(copy.quick[index]);}},
            h('span',{className:'qb-ico',style:{color:quickColors[index]}},h(Icon,{path:quickIcons[index],size:24})),
            label))),
        h('form',{className:'card composer',onSubmit:e=>{e.preventDefault();stopWake();send(text);}},
          h('div',{className:'composer-head'},
            h('label',{className:'eyebrow',htmlFor:'request'},copy.request),
            h('span',{className:'mono',style:{fontSize:11,color:'var(--ink-3)'}},text.length+'/2000')
          ),
          h('div',{className:'ta-wrap'},
            h('textarea',{id:'request',className:'control',value:text,placeholder:copy.placeholder,maxLength:2000,dir:'auto',disabled:processing||demoRunning,
              onChange:e=>{stopWake();setText(e.target.value);if(!e.target.value.trim())setVoiceDraft(false);}}),
            h('button',{type:'button',className:'mic'+(recording?' on':''),onClick:toggleRecording,disabled:processing||demoRunning,
              'aria-label':recording?'Stop recording':copy.voice,title:recording?'Stop recording':copy.voice},h(Icon,{path:GLYPH.mic,size:19}))
          ),
          recording && h('div',{className:'listening',role:'status'},h('span',{className:'dot'}),copy.listening),
          config.voiceInputProvider==='aws' && h('p',{className:'hint'},wakeCopy.awsReview),
          voiceDraft && !recording && h('p',{className:'hint'},voiceCopy.review),
          config?.voiceConfigured && h('label',{className:'toggle-row'},
            h('input',{type:'checkbox',checked:voiceReplies,disabled:processing,
              onChange:e=>{setVoiceReplies(e.target.checked);if(!e.target.checked){deferredVoice.current=[];voicePlayer.current.stop();}}}),
            voiceCopy.replies),
          h('button',{type:'submit',className:'btn btn-primary btn-block',disabled:processing||demoRunning||recording||!text.trim()},processing?'Sending…':copy.send)
        ),
        requestError && h('div',{className:'alert',role:'alert'},
          h('span',null,requestError),
          retryRequest && h('button',{className:'btn btn-sm',disabled:processing||emergencyProcessing,
            onClick:()=>{stopWake();send(retryRequest.text,retryRequest.forceClinical,retryRequest);}},'Retry the same request')),
        h('section',{className:'card handsfree','aria-label':wakeCopy.title},
          h('div',{className:'handsfree-head'},
            h('strong',null,wakeCopy.title),
            h('button',{type:'button',className:'btn btn-sm'+(wakeState.enabled?' btn-warn':' btn-primary'),onClick:toggleWake,
              disabled:!wakeState.enabled&&(!wakeSupported||recording||processing||emergencyProcessing||demoRunning||videoOpen)},
              wakeState.enabled?wakeCopy.disable:wakeCopy.enable)
          ),
          h('p',{className:'handsfree-status',role:'status'},
            h('span',{className:'dot'+(wakeState.enabled&&wakeState.status==='listening'?'':' off')}),
            wakeState.error?wakeCopy.error:wakeState.status==='listening'?wakeCopy[wakeState.phase]:wakeCopy[wakeState.status]||wakeCopy.off),
          h('p',null,wakeCopy.hint),
          h('small',null,wakeSupported?(config.voiceInputProvider==='aws'?wakeCopy.awsPrivacy:wakeCopy.privacy):wakeCopy.unavailable),
          voicePlayback.ticket?.assistant_prompt&&['blocked','error'].includes(voicePlayback.status)&&
            h('button',{className:'btn btn-sm',onClick:()=>voicePlayer.current.retry(voicePlayback.ticket)},wakeCopy.play)
        ),
        h('section',{className:'history','aria-label':copy.history},
          h('h2',null,copy.history),
          tickets.length
            ? tickets.slice(0,12).map(ticket=>h(PatientTicket,{key:ticket.id,ticket,copy,voiceConfigured:config?.voiceConfigured,onReadback:readback}))
            : h('p',{className:'hint'},'Your requests will appear here after they are delivered.')
        ),
        h('div',{className:'note'},'For immediate help, use the bedside call bell. This demo does not activate hospital paging equipment.'),
        h('section',{className:'card demo'},
          h('div',{className:'composer-head'},
            h('span',{className:'eyebrow'},'Judging aid'),
            demoResults.length>0 && h('span',{className:'pill'},demoResults.filter(r=>r.passed).length+'/'+demoResults.length+' matched')
          ),
          h('button',{className:'btn btn-warn btn-block',onClick:()=>{stopWake();runDemo();},disabled:demoRunning||processing},
            demoRunning?'Running · '+demoStep:'Run the 8-request routing demo'),
          demoResults.length>0 && h('div',null,
            demoResults.map(row=>h('div',{key:row.label,className:'demo-row '+(row.passed?'pass':'fail')},
              h('span',null,row.label),h('span',{className:'outcome'},(row.passed?'PASS · ':'CHECK · ')+row.actual))),
            h('p',{className:'hint',style:{marginTop:8}},'These cases demonstrate routing behavior; they are not a clinical safety certification.'))
        )
      ),
      h('div',{className:'toast'+(toast?' show':''),role:'status','aria-live':'polite'},toast),
      footer
    );
  }

  // ------------------------------------------------------------ Staff
  const stats=[
    [active.length,'Open requests',null],
    [urgentCount,'Urgent',urgentCount?'var(--critical)':null],
    [tickets.length?Math.round(nonClinical/tickets.length*100)+'%':'—','Non-clinical share','var(--ok)'],
    [avgLatency===null?'—':avgLatency+' ms','Mean classification',null],
    [tickets.filter(t=>t.status==='RESOLVED').length,'Completed',null]
  ];
  return h('div',{className:'app'},header,statusline,alertSheet,rosterSheet,call,
    h('main',{className:'board'},
      h('div',{className:'board-head'},
        h('div',{style:{minWidth:0}},
          h('h1',null,user.viewAll?user.staff_role+' · unit overview':user.department+' queue'),
          h('p',null,user.mode==='consult'?'Staff-arranged consultations for your service.'
            :user.mode==='observer'||user.mode==='oversight'?'Monitor requests and escalate to the assigned care team.'
            :'Acknowledge a request to confirm the handoff. The patient receives a status update.')
        ),
        h('label',{className:'toggle-row'},
          h('input',{type:'checkbox',checked:showCompleted,onChange:e=>setShowCompleted(e.target.checked)}),'Show completed')
      ),
      !user.on_shift && h('div',{className:'note note-warn'},'You are off shift. New task notifications and task acceptance are paused.'),
      h('div',{className:'stats'},stats.map(([value,label,color])=>h('div',{key:label,className:'stat'},
        h('div',{className:'stat-v',style:{color:color||'var(--ink)'}},value),
        h('div',{className:'stat-l'},label)
      ))),
      user.viewAll && h('div',{className:'tabs','aria-label':'Filter by care team'},
        [{key:'all',label:'All teams'},...Object.entries(TIERS).map(([key,tier])=>({key,label:tier.label}))].map(tab=>
          h('button',{key:tab.key,className:'tab'+(filter===tab.key?' on':''),'aria-pressed':filter===tab.key,onClick:()=>setFilter(tab.key)},tab.label))),
      filtered.length
        ? h('div',{className:'queue'},filtered.map(ticket=>h(StaffTicket,{key:ticket.id,ticket,now,onAction:action,pending:pendingAction===ticket.id,
            onReferral:refer,canRefer:user.canRefer&&user.on_shift,
            referralTargets:config.referralTargets.filter(target=>!target.clinical||user.clinicalReferrals),
            canVideo:config.videoConfigured&&['nurse','charge'].includes(user.id)&&user.on_shift,
            videoBusy:videoBusy||Boolean(activeCall&&KaalingaVideo.ACTIVE.includes(activeCall.status)),onVideo:offerVideo})))
        : h('div',{className:'card blank'},h('p',null,'No open requests for your team.')),
      h('details',{className:'card impact'},
        h('summary',null,'Estimated nursing time freed'),
        h('p',null,nonClinical+' non-clinical service tasks × ',
          h('label',null,h('input',{type:'number',min:0,max:30,step:.5,value:minutes,'aria-label':'Assumed nursing minutes per task',
            onChange:e=>setMinutes(Math.min(30,Math.max(0,Number(e.target.value)||0)))}),' assumed nursing minutes per task'),
          ' = ',h('strong',null,Math.round(nonClinical*minutes*10)/10+' estimated minutes'),'.'),
        h('p',null,'An adjustable demo assumption, not measured savings. A pilot should compare nursing interruptions and staff response times before and after routing.')
      )
    ),
    h('div',{className:'toast'+(toast?' show':''),role:'status','aria-live':'polite'},toast),
    footer
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(h(App));
