'use strict';
const h = React.createElement;
const {useState, useEffect, useRef} = React;
function Logo() {
  return h('svg', { viewBox:'0 0 32 32', width:18, height:18 },
    h('rect', { x:0, y:0, width:32, height:32, rx:7, fill:'transparent' }),
    h('path', { d:'M16 6C16 6 10 6 10 12C10 15 12 17 16 22C20 17 22 15 22 12C22 6 16 6 16 6Z', fill:'white', opacity:0.95 }),
    h('circle', { cx:16, cy:12, r:2.5, fill:'var(--brand)' }),
    h('path', { d:'M6 18 L11 18 L13 14 L15 22 L17 10 L19 18 L26 18', stroke:'white', strokeWidth:1.8, fill:'none', strokeLinecap:'round', strokeLinejoin:'round' })
  );
}

function ThemeSwitch() {
  const [theme,setTheme] = useState(()=>KaalingaTheme.get());
  useEffect(()=>{
    const update=()=>setTheme(KaalingaTheme.get());
    window.addEventListener('kaalinga-theme-change',update);
    return ()=>window.removeEventListener('kaalinga-theme-change',update);
  },[]);
  const dark=theme==='dark';
  const label='Switch to '+(dark?'light':'dark')+' mode';
  return h('button',{type:'button',className:'btn theme-switch',onClick:()=>KaalingaTheme.set(dark?'light':'dark'),'aria-label':label,title:label},
    h('svg',{width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round','aria-hidden':true},
      dark ? h(React.Fragment,null,h('circle',{cx:12,cy:12,r:4}),h('path',{d:'M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5'})) : h('path',{d:'M20.9 13A9 9 0 0111 3.1 9 9 0 1020.9 13Z'})
    ),dark?'Light mode':'Dark mode'
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
const SOURCE_LABELS = { safety_rule:'Safety rule', rules:'Routing rules', ai:'AI assisted', ai_fallback:'AI fallback · nurse review when uncertain', secondary_task:'Separated service task',staff_referral:'Staff-arranged referral',clinical_escalation:'Automatic emergency escalation' };
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
  return h('main', {className:'login-layout'},
    h('form', {className:'login-card', onSubmit:submit},
      h('span', {className:'eyebrow'}, 'Start here'),
      h('h2', null, 'Choose your role'),
      h('p', {className:'login-description'}, 'Sign in to request help or respond with your team.'),
      h('label', {className:'fl',htmlFor:'login-role'}, 'Role'),
      h('select', {id:'login-role',className:'fi',value:roleChoice,onChange:e=>chooseRole(e.target.value),disabled:!config || busy},
        h('option',{value:'patient'},'Patient'),
        mainRoles.map(id=>accounts.find(account=>account.id===id)).filter(Boolean).map(account=>h('option',{key:account.id,value:account.id},account.display_name)),
        h('option',{value:'other'},'Other hospital roles…')
      ),
      roleChoice==='patient' && h(React.Fragment,null,
        h('label', {className:'fl',htmlFor:'account'}, 'Patient room'),
        h('select', {id:'account',className:'fi',value:email,onChange:e=>{setEmail(e.target.value);setPatientEmail(e.target.value);setLoginError('');},disabled:!config || busy},
          patients.map(account=>h('option',{key:account.id,value:account.email},account.room.replace('RM ','Room ')))
        ),
        h('p',{className:'patient-picker-hint'},patients.length+' patients · separate requests and alerts')
      ),
      roleChoice==='other' && h('div',{className:'additional-roles'},
        h('label',{className:'fl',htmlFor:'account'},'Additional hospital role'),
        h('select',{id:'account',className:'fi',value:email,onChange:e=>setEmail(e.target.value),disabled:!config || busy},
          h('option',{value:'',disabled:true},'Choose an additional role'),
          Object.entries(config?.roleGroups||{}).map(([group,label])=>{
            const members=otherAccounts.filter(account=>account.group===group);
            return members.length ? h('optgroup',{key:group,label},members.map(account=>h('option',{key:account.id,value:account.email},account.display_name))) : null;
          })
        )
      ),
      selected?.mode==='consult' && h('p',{className:'role-hint'},'Receives staff-arranged consultations. The Medical Team also receives emergency alerts alongside Nursing.'),
      selected && roleChoice!=='patient' && h('p',{className:'selected-account'},selected.email),
      h('label', {className:'fl',htmlFor:'password'}, 'Demo password'),
      h('input', {id:'password',className:'fi',type:'password',value:password,autoComplete:'current-password',required:true,onChange:e=>setPassword(e.target.value),disabled:busy}),
      (loginError || error) && h('div', {className:'error-box',style:{margin:'0 0 14px'},role:'alert'}, loginError || error),
      h('button', {className:'go-btn',type:'submit',disabled:busy || !config || !email}, busy ? 'Signing in…' : 'Sign in'),
      !config && h('button', {className:'btn',type:'button',onClick:onReload,style:{marginTop:12}}, 'Retry connection'),
      h('details',{className:'login-help'},
        h('summary',null,'Demo access & setup'),
        selected && h('p',null,'Selected account: '+selected.email),
        config?.localDemo && h('p',null,'Local demo password: kaalinga-demo'),
        h('p',null,'For simultaneous patient and staff accounts, use the separate local test addresses, browser profiles, or a private window.'),
        h('p',null,'Use synthetic requests only. This is a hackathon demonstration.')
      )
    ),
    h('div', {className:'login-intro'},
      h('span', {className:'eyebrow'}, 'Rutgers Health Hack · Ops Unleashed'),
      h('h1', null, 'The right help.',h('br'),'The right team.'),
      h('p', null, 'A calmer way to connect patients with the people who can help.'),
      h('span',{className:'login-context'},patients.length+' patient rooms · coordinated care teams')
    ),
    h('section',{className:'login-proof','aria-label':'How it works'},
      h('div',null,h('span',{className:'proof-number'},'01'),h('strong',null,'Tell us what you need'),h('p',null,'Send a request from your room.')),
      h('div',null,h('span',{className:'proof-number'},'02'),h('strong',null,'Reach the right team'),h('p',null,'Clinical concerns stay with nursing.')),
      h('div',null,h('span',{className:'proof-number'},'03'),h('strong',null,'Follow the response'),h('p',null,'See receipt, acknowledgement, and completion.'))
    )
  );
}
function PainReport({pain,language,clinical=false}){
  const code=clinical?'en':Object.entries(KaalingaRouting.LANGUAGE_NAMES).find(([,name])=>name===language)?.[0]||'en';const copy=KaalingaPain.COPY[code]||KaalingaPain.COPY.en;
  return h('div',{className:'pain-report '+(pain.band||'unscored')},h('strong',null,copy.reported+' · '+(pain.score===null?copy.unscored:pain.score+'/10')),pain.location&&h('span',null,pain.location),pain.worsening&&h('span',null,copy.changed),pain.conflicting_score&&h('small',null,copy.conflict),clinical&&h('small',null,'Nursing assessment required'));
}
function PatientTicket({ticket, linkedTickets=[], copy, voiceConfigured, onReadback}) {
  const tier = TIERS[ticket.tier];
  return h('article', {className:'patient-ticket',style:{borderLeft:'4px solid '+tier.color}},
    h('div', {style:{display:'flex',justifyContent:'space-between',gap:10}},
      h('strong', null, ticket.department),
      h('span', {className:'status-step'+(ticket.status==='RESOLVED'?' done':'')}, ticket.status==='RESOLVED'?copy.resolved:ticket.status==='ACKNOWLEDGED'?copy.acknowledged:copy.received)
    ),
    h('p', {dir:'auto'}, ticket.original_text),
    ticket.pain&&h(PainReport,{pain:ticket.pain,language:ticket.detected_language}),
    h('p', {dir:'auto',style:{color:'var(--fg2)'}}, ticket.status_message || ticket.patient_summary),
    linkedTickets.length>0&&h('div',{className:'linked-patient-tasks','aria-label':'Linked team requests'},[...linkedTickets].sort((a,b)=>(a.status==='RESOLVED')-(b.status==='RESOLVED')||a.priority-b.priority).map(task=>h('div',{key:task.id,className:'linked-patient-task'},
      h('div',null,h('strong',null,task.department),h('span',{className:'status-step'+(task.status==='RESOLVED'?' done':'')},task.status==='RESOLVED'?copy.resolved:task.status==='ACKNOWLEDGED'?copy.acknowledged:copy.received)),
      h('p',null,task.summary),h('p',{dir:'auto'},task.status_message||task.patient_summary),
      voiceConfigured&&h('button',{className:'btn btn-sm',onClick:()=>onReadback(task)},'Read aloud')
    ))),
    h('div', {style:{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}},
      h('small', {style:{color:'var(--fg3)'}}, formatTime(ticket.created_at) + (ticket.parent_id ? (ticket.is_clinical?' · Clinical response':' · Service task') : '')),
      voiceConfigured && h('button', {className:'btn btn-sm',onClick:()=>onReadback(ticket)}, 'Read aloud')
    )
  );
}
function StaffTicket({ticket, now, onAction, pending, onReferral, referralTargets, canRefer, canVideo, videoBusy, onVideo}) {
  const [referralDepartment,setReferralDepartment]=useState('');
  const [referralNote,setReferralNote]=useState('');
  const tier = TIERS[ticket.tier];
  const urgent = ticket.priority <= 2 && ticket.status !== 'RESOLVED';
  const overdue = urgent && ticket.status==='NEW' && now-Date.parse(ticket.created_at) > (ticket.priority===1?30000:120000);
  return h('article', {className:'tk'+(urgent?' hot':'')+(ticket.status==='RESOLVED'?' closed':'')},
    h('div', {className:'tk-stripe',style:{background:tier.color}}),
    h('div', {className:'tk-body'},
      h('div', {className:'tk-r1'}, h('span',{className:'tk-room'},ticket.room), h('span',{className:'tk-time'},formatTime(ticket.created_at)+' · '+ageLabel(ticket.created_at,now)+' ago')),
      h('p', {className:'tk-task-label'},ticket.source==='clinical_escalation'?'Emergency medical assessment':'Task to respond to'),
      h('p', {className:'tk-task'}, ticket.summary),
      ticket.is_clinical && h('p', {className:'tk-msg',dir:'auto'}, ticket.original_text),
      ticket.source==='clinical_escalation' && h('p',{className:'notice-box'},'Nursing has a separate response task. Acknowledge your medical response here.'),
      ticket.pain&&h(PainReport,{pain:ticket.pain,clinical:true}),
      ticket.intents?.length>0&&h('details',{className:'intent-details'},h('summary',null,'What the patient needs'),ticket.intents.filter(intent=>intent.department===ticket.department).map((intent,index)=>h('div',{key:index},h('strong',null,intent.kind.replaceAll('_',' ')),h('p',null,intent.summary),intent.evidence.length>0&&h('small',{dir:'auto'},'Patient words: '+intent.evidence.join(' · '))))),
      h('div', {className:'tk-tags'},
        h('span', {className:'pill '+(urgent?'pill-urg':'pill-new')}, 'P'+ticket.priority+' · '+ticket.status),
        h('span', {className:'tk-tier',style:{color:tier.color}}, ticket.department),
        h('span', {className:'tk-lang'}, ticket.detected_language),
        ticket.parent_id && h('span', {className:'tk-lang'}, ticket.source==='staff_referral'?'Staff referral':ticket.source==='clinical_escalation'?'Emergency escalation':'Linked service task'),
        h('span', {className:'tk-who'}, ticket.responder)
      ),
      overdue && h('div', {className:'overdue',role:'status'}, ticket.department==='Nursing'?'Urgent request awaiting acknowledgement. Charge nurse review needed.':'Urgent consultation awaiting acknowledgement. Contact the assigned care team.'),
      h('div', {className:'ticket-actions'},
        ticket.canAct && ticket.status==='NEW' && h('button', {className:'btn btn-primary',disabled:pending,onClick:()=>onAction(ticket,'acknowledge')}, pending?'Saving…':'Acknowledge'),
        ticket.canAct && ticket.status==='ACKNOWLEDGED' && h('button', {className:'btn',disabled:pending,onClick:()=>onAction(ticket,'resolve')}, pending?'Saving…':'Mark complete'),
        canVideo && ticket.department==='Nursing' && !ticket.parent_id && ticket.status==='ACKNOWLEDGED' && h('button',{className:'btn btn-primary',disabled:videoBusy||pending,onClick:()=>onVideo(ticket)},'Offer video call'),
        ticket.status==='RESOLVED' && h('span', {className:'status-step done'}, 'Completed '+formatTime(ticket.resolved_at))
      ),
      h('details',{className:'routing-details'},h('summary',null,'Request and routing details'),
        !ticket.is_clinical && h('p',{className:'tk-msg',dir:'auto'},ticket.original_text),
        h('p',{className:'ticket-meta'},(SOURCE_LABELS[ticket.source]||ticket.source)+' · '+Math.round(ticket.classification_ms)+' ms'+(ticket.confidence===null?'':' · AI self-report '+Math.round(ticket.confidence*100)+'%')),
        h('p',{className:'ticket-meta'},'Checks: '+(ticket.routing_checks?.join(', ')||'Legacy request'))),
      ticket.referrals?.length>0 && h('p',{className:'ticket-meta'},'Consultations: '+ticket.referrals.map(item=>item.department+' · '+item.status).join(' / ')),
      canRefer && ticket.status!=='RESOLVED' && h('details',{className:'referral-form'},
        h('summary',null,'Arrange a consultation'),
        h('form',{onSubmit:async e=>{e.preventDefault();if(await onReferral(ticket,referralDepartment,referralNote))setReferralNote('');}},
          h('label',{className:'fl',htmlFor:'referral-'+ticket.id},'Consultation service'),
          h('select',{id:'referral-'+ticket.id,className:'fi',value:referralDepartment,onChange:e=>setReferralDepartment(e.target.value),required:true},h('option',{value:''},'Choose a service'),referralTargets.map(target=>h('option',{key:target.department,value:target.department},target.department))),
          h('label',{className:'fl',htmlFor:'referral-note-'+ticket.id},'Referral note'),
          h('textarea',{id:'referral-note-'+ticket.id,className:'fi',value:referralNote,onChange:e=>setReferralNote(e.target.value),maxLength:500,required:true,placeholder:'Share the specific task the service should review.'}),
          h('button',{className:'btn',disabled:pending||!referralDepartment||!referralNote.trim()},'Send referral')
        )
      )
    )
  );
}

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
  return h('section',{className:'video-call-panel','aria-label':copy.title},
    h('div',{className:'call-heading'},h('div',null,h('span',{className:'eyebrow'},call.room),h('h2',null,copy.title)),h('span',{className:'call-state'},terminal?copy.ended:state.status==='connected'?copy.connected:state.status==='connecting'?copy.connecting:call.status==='RINGING'?(patient?copy.invite:copy.waiting):copy.accepted)),
    h('p',{className:'call-privacy'},copy.privacy),
    (local||remote)&&h('div',{className:'call-videos'},
      h('div',{className:'call-tile'},remote&&h('video',{ref:remoteVideo,autoPlay:true,playsInline:true,controls:true,'aria-label':patient?copy.other:copy.patient}),!remote&&h('span',{className:'call-placeholder'},copy.remote),h('span',{className:'call-caption'},patient?copy.other:copy.patient)),
      h('div',{className:'call-tile local'},h('video',{ref:localVideo,autoPlay:true,playsInline:true,muted:true,'aria-label':copy.you}),h('span',{className:'call-caption'},copy.you))
    ),
    state.errorKey&&h('p',{className:'error-box',role:'alert'},copy[state.errorKey]),
    state.status==='preparing'&&h('p',{role:'status'},copy.preparing),
    h('div',{className:'call-controls'},
      !terminal&&!local&&h(React.Fragment,null,
        h('button',{className:'btn btn-primary',disabled:state.status==='preparing',onClick:()=>join(false)},patient?copy.join:copy.nurseJoin),
        h('button',{className:'btn',disabled:state.status==='preparing',onClick:()=>join(true)},patient?copy.audio:copy.nurseAudio)
      ),
      !terminal&&local&&h('button',{className:'btn','aria-pressed':muted,onClick:()=>{session.current.mute(!muted);setMuted(!muted);}},muted?copy.unmute:copy.mute),
      !terminal&&local?.getVideoTracks().length>0&&h('button',{className:'btn','aria-pressed':!camera,onClick:()=>{session.current.camera(!camera);setCamera(!camera);}},camera?copy.cameraOff:copy.cameraOn),
      audioBlocked&&remote&&h('button',{className:'btn btn-primary',onClick:()=>remoteVideo.current.play().then(()=>setAudioBlocked(false)).catch(()=>{})},copy.enableAudio),
      !terminal&&h('button',{className:'btn btn-warn',onClick:()=>session.current.end(patient&&call.status==='RINGING'?'decline':'end')},patient&&call.status==='RINGING'?copy.decline:copy.end),
      terminal&&h('button',{className:'btn',onClick:onDismiss},copy.dismiss)
    )
  );
}

const WAKE_COPY={
  en:{title:'Hey Kalinga',enable:'Enable hands-free',disable:'Stop hands-free',hint:'Say “Hey Kalinga, I need water.” Then say “Send request” or “Cancel”.',awsPrivacy:'Audio is streamed to Amazon Transcribe while listening. Stop hands-free to stop the microphone.',awsReview:'Voice input uses your selected language. Review the transcript before sending.',privacy:'Microphone stays active while this page is visible. Browser recognition may send audio to its speech service. This is an experimental browser feature.',wake:'Listening for “Hey Kalinga”…',capture:'Listening — tell me what you need.',confirm:'Say “Send request” to confirm, or “Cancel”.',sending:'Sending your request…',paused:'Listening paused during audio, a call, or another task.',starting:'Starting microphone…',off:'Hands-free is off.',error:'Hands-free stopped. Check microphone permission or use Voice input.',unavailable:'Hands-free needs supported browser speech recognition and configured voice replies.',play:'Play voice prompt'},
  es:{title:'Hey Kalinga',enable:'Activar manos libres',disable:'Detener manos libres',hint:'Diga “Hey Kalinga” y su solicitud. Después diga “Enviar solicitud” o “Cancelar”.',awsPrivacy:'El audio se envía a Amazon Transcribe mientras escucha. Detenga manos libres para apagar el micrófono.',awsReview:'La voz usa el idioma seleccionado. Revise la transcripción antes de enviar.',privacy:'El micrófono permanece activo mientras esta página está visible. El navegador puede enviar audio a su servicio de voz. Función experimental.',wake:'Esperando “Hey Kalinga”…',capture:'Le escucho. Dígame qué necesita.',confirm:'Diga “Enviar solicitud” o “Cancelar”.',sending:'Enviando su solicitud…',paused:'Escucha pausada durante audio, una llamada u otra tarea.',starting:'Iniciando micrófono…',off:'Manos libres desactivado.',error:'La escucha se detuvo. Revise el permiso del micrófono.',unavailable:'Requiere reconocimiento del navegador y respuestas de voz configuradas.',play:'Reproducir indicación'},
  hi:{title:'हे कालिंगा',enable:'हैंड्स-फ़्री चालू करें',disable:'हैंड्स-फ़्री बंद करें',hint:'“हे कालिंगा, मुझे पानी चाहिए” कहें। फिर “अनुरोध भेजें” या “रद्द करें” कहें।',awsPrivacy:'सुनते समय आवाज़ Amazon Transcribe को भेजी जाती है। माइक्रोफ़ोन रोकने के लिए हैंड्स-फ़्री बंद करें।',awsReview:'आवाज़ के लिए चुनी गई भाषा उपयोग होती है। भेजने से पहले लिखित अनुरोध जाँचें।',privacy:'यह पेज दिखाई देने पर माइक्रोफ़ोन चालू रहता है। ब्राउज़र आवाज़ अपनी पहचान सेवा को भेज सकता है। यह प्रयोगात्मक सुविधा है।',wake:'“हे कालिंगा” सुनने की प्रतीक्षा…',capture:'मैं सुन रही हूँ। बताइए आपको क्या चाहिए।',confirm:'“अनुरोध भेजें” या “रद्द करें” कहें।',sending:'आपका अनुरोध भेजा जा रहा है…',paused:'आवाज़, कॉल या अन्य काम के दौरान सुनना रुका है।',starting:'माइक्रोफ़ोन शुरू हो रहा है…',off:'हैंड्स-फ़्री बंद है।',error:'सुनना रुक गया। माइक्रोफ़ोन की अनुमति जाँचें।',unavailable:'ब्राउज़र में आवाज़ पहचान और कॉन्फ़िगर किए गए जवाब ज़रूरी हैं।',play:'आवाज़ का निर्देश सुनें'},
  fr:{title:'Hey Kalinga',enable:'Activer mains libres',disable:'Arrêter mains libres',hint:'Dites « Hey Kalinga » puis votre demande. Ensuite, dites « Envoyer la demande » ou « Annuler ».',awsPrivacy:'L’audio est transmis à Amazon Transcribe pendant l’écoute. Arrêtez mains libres pour couper le microphone.',awsReview:'La voix utilise la langue sélectionnée. Vérifiez la transcription avant l’envoi.',privacy:'Le microphone reste actif lorsque cette page est visible. Le navigateur peut envoyer l’audio à son service vocal. Fonction expérimentale.',wake:'En attente de « Hey Kalinga »…',capture:'Je vous écoute. Dites-moi ce dont vous avez besoin.',confirm:'Dites « Envoyer la demande » ou « Annuler ».',sending:'Envoi de votre demande…',paused:'Écoute suspendue pendant un audio, un appel ou une autre tâche.',starting:'Démarrage du microphone…',off:'Mains libres désactivé.',error:'Écoute arrêtée. Vérifiez l’autorisation du microphone.',unavailable:'Nécessite la reconnaissance du navigateur et des réponses vocales configurées.',play:'Lire l’instruction vocale'}
};
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
  const [englishSpeech,setEnglishSpeech]=useState('en-US');
  const [lastHeard,setLastHeard]=useState(null);
  const [text,setText] = useState('');
  const [painOpen,setPainOpen]=useState(false),[painScore,setPainScore]=useState(null),[painLocation,setPainLocation]=useState(''),[painWorsening,setPainWorsening]=useState(false);
  const painSettings=useRef(null);painSettings.current={open:painOpen,score:painScore,location:painLocation,worsening:painWorsening,text};
  const [processing,setProcessing] = useState(false);
  const [emergencyProcessing,setEmergencyProcessing] = useState(false);
  const [requestError,setRequestError] = useState('');
  const [retryRequest,setRetryRequest] = useState(null);
  const [recording,setRecording] = useState(false);
  const [voiceDraft,setVoiceDraft] = useState(false);
  const [assistantTurn,setAssistantTurn]=useState(null);
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
  const painCopy=KaalingaPain.COPY[language.split('-')[0]]||KaalingaPain.COPY.en;
  const painVisible=(painOpen||KaalingaPain.hasPain(text))&&KaalingaRouting.classifyLocal(text,{language}).priority!==1;
  const displayedPainScore=painScore??KaalingaPain.extractScore(text);
  const voiceCopy = VOICE_COPY[language.split('-')[0]] || VOICE_COPY.en;
  const isPatient = user?.role==='patient';
  const wakeCopy=WAKE_COPY[language.split('-')[0]]||WAKE_COPY.en;
  const speechLanguage=config?.voiceInputProvider==='browser'&&language.startsWith('en')?englishSpeech:language;
  const wakeSupported=Boolean(KaalingaTranscribe.getRecognition(config||{})&&WAKE_COPY[language.split('-')[0]]&&config?.voiceConfigured&&voiceReplies);

  function announce(message) {
    setToast(message); clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(()=>setToast(''),5000);
  }
  useEffect(()=>{setPainOpen(false);setPainScore(null);setPainLocation('');setPainWorsening(false);},[user?.id]);
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
    setLastHeard(null);setEnglishSpeech('en-US');
    setVoiceDraft(false); setAssistantTurn(null); voicePlayer.current.stop(); voiceUpdates.current.reset(); deferredVoice.current=[]; setPatientUpdate(null);
    setActiveCall(null);setVideoOpen(false);seenCalls.current.clear();
    const previous=recognitionRef.current; recognitionRef.current=null; previous?.abort(); setRecording(false);
  },[user?.id]);
  useEffect(()=>{
    if (recording || !voiceSettings.current.enabled) return;
    const waiting=deferredVoice.current; deferredVoice.current=[];
    for(const ticket of waiting) voicePlayer.current.enqueue(ticket);
  },[recording]);
  function stopWake(){
    setAssistantTurn(null);
    wakeListener.current?.dispose();wakeListener.current=null;
    setWakeState({enabled:false,phase:'wake',status:'off',error:null});
  }
  function toggleWake(){
    if(wakeState.enabled){stopWake();if(voicePlayback.ticket?.assistant_prompt)voicePlayer.current.stop();return;}
    stopWake();voicePlayer.current.stop();
    const speaker=activeUser.current;
    const controller=KaalingaWake.createListener({Recognition:KaalingaTranscribe.getRecognition(config),language:speechLanguage,onState:state=>{if(activeUser.current===speaker)setWakeState(state);},
      onHeard:heard=>{if(activeUser.current===speaker)setLastHeard(heard);},
      onDraft:draft=>{if(activeUser.current===speaker){setText(draft);setPainScore(null);setVoiceDraft(Boolean(draft));}},
      onPrompt:(prompt,draft)=>{
        if(activeUser.current!==speaker)return;
        showAssistantPrompt(prompt,draft);
        if(voiceSettings.current.enabled)controller.suspend('speech',true);
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
              try { new Notification('Kalinga · '+user.display_name,{body:notification.message,tag:notification.id}); } catch(_) {}
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
    const created=data.tickets||[data.ticket];
    for(const ticket of created)voiceUpdates.current.remember(ticket);
    setTickets(prev=>[...created,...prev.filter(ticket=>!created.some(item=>item.id===ticket.id))]);
    refresh().catch(()=>{});
    return data.ticket;
  }
  function showAssistantPrompt(prompt,draft='') {
    if(!KaalingaAssistant.COPY[language.split('-')[0]])return;
    const message=KaalingaAssistant.promptText({prompt,text:draft,language},draft?KaalingaRouting.classifyLocal(draft,{language}):null);
    if(!message)return;
    setAssistantTurn({prompt,draft,text:message});
    if(config?.voiceConfigured&&voiceSettings.current.enabled)voicePlayer.current.enqueue({id:crypto.randomUUID(),status:'ASSISTANT',assistant_prompt:prompt,language,draft});
  }
  async function send(input,urgent=false,retry=null,painOverride=null) {
    if (!input.trim() || (urgent?urgentBusy.current:normalBusy.current)) return;
    if(urgent) { urgentBusy.current=true; setEmergencyProcessing(true); }
    else { normalBusy.current=true; setProcessing(true); }
    setAssistantTurn(null);
    if(voicePlayback.ticket?.assistant_prompt)voicePlayer.current.stop();
    const painContext=painSettings.current;
    const painPayload=painOverride??(!urgent&&(KaalingaPain.hasPain(input)||(painContext.open&&input===painContext.text))?{painScore:painContext.score,painLocation:painContext.location,painWorsening:painContext.worsening}:{});
    const payload=retry ? {...retry} : {text:input.trim(),language,forceClinical:urgent,requestKey:crypto.randomUUID(),...painPayload};
    const sender=activeUser.current;
    const recognition=recognitionRef.current; recognitionRef.current=null; recognition?.abort(); setRecording(false);
    setRequestError(''); setRetryRequest(null);
    try {
      const ticket=await deliverRequest(payload);
      if(activeUser.current!==sender || ticket.patient_id!==sender) return;
      setText(current=>current===input?'':current);
      setPainOpen(false);setPainScore(null);setPainLocation('');setPainWorsening(false);
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
    const followUp=assistantTurn&&['pain_question','pain_retry'].includes(assistantTurn.prompt)?assistantTurn:null;
    stopWake();
    if(recording) { recognitionRef.current?.stop(); setRecording(false); return; }
    const Recognition=KaalingaTranscribe.getRecognition(config);
    if(!Recognition) { announce('Voice input is unavailable in this browser. You can type or use a quick request.'); return; }
    const recognition=new Recognition();
    const speaker=activeUser.current;
    voicePlayer.current.stop(); setVoiceDraft(false);
    recognition.lang=speechLanguage; recognition.continuous=false; recognition.interimResults=true;
    let finalTranscript='',recognitionFailed=false;
    recognition.onresult=e=>{
      if(activeUser.current!==speaker || recognitionRef.current!==recognition) return;
      const transcript=Array.from(e.results).map(result=>result[0].transcript).join(' ');
      finalTranscript=Array.from(e.results).filter(result=>result.isFinal).map(result=>result[0].transcript).join(' ').trim();
      if(finalTranscript)setLastHeard({transcript:finalTranscript,phase:'manual',wakeDetected:false});
      if(!followUp)setText(transcript);setVoiceDraft(Boolean(transcript.trim()));
    };
    recognition.onend=()=>{
      if(activeUser.current!==speaker||recognitionRef.current!==recognition)return;
      recognitionRef.current=null;setRecording(false);
      if(recognitionFailed||!finalTranscript)return;
      let draft=finalTranscript,prompt='confirm';
      if(followUp){
        const score=KaalingaAssistant.scoreAnswer(finalTranscript),command=KaalingaWake.command(finalTranscript);
        if(command==='cancel'){setText('');setVoiceDraft(false);showAssistantPrompt('cancelled');return;}
        if(command==='send'){setText(followUp.draft);send(followUp.draft);return;}
        draft=followUp.draft;
        if(score!==null)draft+=' '+KaalingaAssistant.copy(language).scoreLine(score);
        else if(command!=='skip'&&KaalingaRouting.classifyLocal(finalTranscript,{language}).priority===1)draft+=' '+finalTranscript;
        else if(command!=='skip'&&followUp.prompt==='pain_question')prompt='pain_retry';
      }else{
        const result=KaalingaRouting.classifyLocal(draft,{language});
        if(KaalingaAssistant.shouldAskPain(draft,result))prompt='pain_question';
      }
      setText(draft);setPainScore(null);showAssistantPrompt(prompt,draft);
    };
    recognition.onerror=()=>{recognitionFailed=true; if(activeUser.current===speaker && recognitionRef.current===recognition){setRecording(false);announce('Voice input stopped. You can still type your request.');} };
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

  const active=tickets.filter(t=>t.status!=='RESOLVED');
  const urgentCount=active.filter(t=>t.priority<=2).length;
  const nonClinical=tickets.filter(t=>!t.is_clinical).length;
  const primary=tickets.filter(t=>!t.parent_id);
  const avgLatency=primary.length ? Math.round(primary.reduce((sum,t)=>sum+t.classification_ms,0)/primary.length) : null;
  const unread=notifications.filter(n=>!n.read_at).length;
  const filtered=tickets.filter(t=>(showCompleted||t.status!=='RESOLVED')&&(filter==='all'||t.tier===filter)).sort((a,b)=>{
    const statusRank={NEW:0,ACKNOWLEDGED:1,RESOLVED:2};
    return Number(a.status==='RESOLVED')-Number(b.status==='RESOLVED') || a.priority-b.priority || statusRank[a.status]-statusRank[b.status] || (b.pain?.score||0)-(a.pain?.score||0) || Date.parse(a.created_at)-Date.parse(b.created_at);
  });
  const header=h('nav',{className:'topbar','aria-label':'Main'},
    h('div',{className:'topbar-left'},h('div',{className:'logo-mark','aria-hidden':true},h(Logo)),h('span',{className:'logo-text'},'Kalinga'),h('span',{className:'badge badge-brand'},'OPS UNLEASHED')),
    h('div',{className:'topbar-right'},
      user && h('div',{className:'account-actions'},
      h('span',{className:'role-name'},user.display_name),
      !isPatient && h('button',{className:'btn btn-sm',onClick:()=>setRosterOpen(!rosterOpen),'aria-expanded':rosterOpen},'Staffing roster'),
      h('button',{className:'btn btn-sm',onClick:toggleNotifications,'aria-expanded':notificationOpen},'Alerts'+(unread?' ('+unread+')':'')),
      notificationPermission!=='granted' && notificationPermission!=='denied' && notificationPermission!=='unsupported' && h('button',{className:'btn btn-sm',onClick:enableNotifications},'Enable browser alerts'),
      h('button',{className:'btn btn-sm',onClick:logout,disabled:processing||demoRunning||emergencyProcessing},'Sign out')
      ),
      h(ThemeSwitch)
    )
  );
  if(booting) return h('div',{id:'app'},header,h('main',{className:'empty-state'},h('div',{className:'spinner'}),h('p',null,'Connecting to Kalinga…')));
  if(!user) return h('div',{id:'app'},header,h(Login,{config,error:bootError,onLogin:login,onReload:boot}));
  return h('div',{id:'app'},header,
    h('div',{className:'prototype-bar'},
      h('span',null,'Hackathon demo · synthetic requests'),
      h('span',{className:'connection',role:'status'},h('span',{className:'room-dot'+(connected?'':' off')}),connected?'Live · updates every 2s':'Reconnecting…'),
      h('span',{className:'model-label'},config?.aiConfigured?(config.aiProvider==='bedrock'?'AWS Bedrock':'AI assisted')+' · '+config.model:'Routing rules · AI not configured')
    ),
    notificationOpen && h('section',{className:'notification-panel','aria-label':'Your notifications'},
      h('h2',null,'Your notifications'),
      notifications.length ? notifications.map(n=>h('div',{className:'notification-item'+(!n.read_at?' unread':''),key:n.id},n.message,h('time',{dateTime:n.created_at},formatTime(n.created_at)))) : h('p',null,'No alerts yet.')
    ),
    !isPatient && rosterOpen && h('section',{className:'roster-panel','aria-label':'Unit staffing roster'},
      h('h2',null,'Adult inpatient · demo staffing roster'),
      h('p',null,'Shift availability is saved and controls who receives and accepts new tasks. Role permissions are demo policy; RWJUH credentials, patient assignments, and delegation still need validation.'),
      Object.entries(config.roleGroups).map(([group,label])=>h('div',{key:group},h('h3',null,label),roster.filter(member=>member.group===group).map(member=>h('div',{className:'roster-member',key:member.id},
        h('div',null,h('strong',null,member.staff_role),h('p',null,(member.department||'Unit oversight')+' · '+member.mode),h('small',null,member.email)),
        user.manageRoster?h('label',null,h('input',{type:'checkbox',checked:member.on_shift,disabled:Boolean(rosterBusy),onChange:()=>shift(member),'aria-label':'On shift: '+member.staff_role}),' On shift'):h('span',null,member.on_shift?'On shift':'Off shift')
      ))))
    ),
    activeCall&&h(VideoCallPanel,{key:activeCall.id,call:activeCall,user,language,onBeforeJoin:stopPatientAudio,onMedia:setVideoOpen,onDismiss:()=>setActiveCall(null),onChange:next=>{if(activeUser.current===user.id)setActiveCall(previous=>previous?.id===next.id?next:previous);}}),
    isPatient ? h('main',{className:'p-panel',dir:language.startsWith('ar')?'rtl':'ltr'},
      h('div',{className:'p-header'},
        h('h1',null,copy.title),h('p',null,copy.intro),h('div',{className:'room-chip'},h('span',{className:'room-dot'}),h('strong',null,user.room)),
        h('div',{className:'patient-language'},h('label',{htmlFor:'patient-language'},'Language / भाषा'),h('select',{id:'patient-language',className:'language-select',value:language,onChange:e=>{stopWake();setLastHeard(null);const recognition=recognitionRef.current;recognitionRef.current=null;recognition?.abort();setRecording(false);setVoiceDraft(false);deferredVoice.current=[];voicePlayer.current.stop();setLanguage(e.target.value);},'aria-label':'Patient language'},LANGUAGES.map(([code,label])=>h('option',{key:code,value:code},label))))
      ),
      h('button',{className:'emergency-button',onClick:()=>{stopWake();send('Emergency help requested using the urgent call button.',true);},disabled:emergencyProcessing},h(IconPain),emergencyProcessing?'Sending urgent request…':copy.urgent),
      patientUpdate && h('section',{className:'notice-box voice-confirmation patient-update','aria-label':voiceCopy.latest,'aria-live':'polite'},
        h('strong',null,voiceCopy.latest),
        h('p',{dir:'auto'},patientUpdate.status_message || patientUpdate.patient_summary),
        voicePlayback.status!=='idle' && !voicePlayback.ticket?.assistant_prompt && h('div',{className:'update-controls'},
          h('span',null,voicePlayback.status==='loading'?voiceCopy.preparing:voicePlayback.status==='playing'?voiceCopy.playing:voicePlayback.status==='blocked'?voiceCopy.blocked:voiceCopy.failed),
          ['loading','playing'].includes(voicePlayback.status) ? h('button',{className:'btn btn-sm',onClick:()=>{deferredVoice.current=[];voicePlayer.current.stop();}},voiceCopy.stop) : h('button',{className:'btn btn-sm',onClick:()=>voicePlayer.current.retry(voicePlayback.ticket)},voiceCopy.play)
        )
      ),
      assistantTurn && h('section',{className:'notice-box assistant-conversation','aria-label':'Kalinga voice assistant','aria-live':'polite'},
        h('strong',null,'Kalinga'),h('p',null,assistantTurn.text),
        ['pain_question','pain_retry'].includes(assistantTurn.prompt)&&h('small',null,KaalingaAssistant.copy(language).replyHint),
        voicePlayback.ticket?.assistant_prompt&&['loading','playing'].includes(voicePlayback.status)&&h('button',{className:'btn btn-sm',onClick:()=>voicePlayer.current.stop()},voiceCopy.stop)),
      h('section',{className:'wake-panel','aria-label':wakeCopy.title},
        h('div',{className:'wake-heading'},h('strong',null,wakeCopy.title),h('button',{type:'button',className:'btn btn-sm'+(wakeState.enabled?' btn-warn':' btn-primary'),disabled:!wakeState.enabled&&(!wakeSupported||recording||processing||emergencyProcessing||demoRunning||videoOpen),onClick:toggleWake},wakeState.enabled?wakeCopy.disable:wakeCopy.enable)),
        h('p',{className:'wake-status',role:'status'},wakeState.error?wakeCopy.error:wakeState.status==='listening'?(wakeState.phase==='pain'?KaalingaAssistant.copy(language).listenPain:wakeCopy[wakeState.phase]):wakeCopy[wakeState.status]||wakeCopy.off),
        h('p',null,wakeCopy.hint),
        h('small',null,wakeSupported?(config.voiceInputProvider==='aws'?wakeCopy.awsPrivacy:wakeCopy.privacy):wakeCopy.unavailable),
        h('details',{className:'voice-options'},h('summary',null,language.startsWith('es')?'Opciones de voz':language.startsWith('hi')?'आवाज़ के विकल्प':language.startsWith('fr')?'Options vocales':'Voice options'),
          config.voiceInputProvider==='browser'&&language.startsWith('en')&&h('div',{className:'speech-profile'},h('label',{htmlFor:'english-speech'},'English speech setting'),h('select',{id:'english-speech',className:'language-select',value:englishSpeech,disabled:recording||processing||emergencyProcessing||videoOpen,onChange:e=>{stopWake();voicePlayer.current.stop();setLastHeard(null);setEnglishSpeech(e.target.value);}},[['en-US','United States'],['en-IN','India'],['en-GB','United Kingdom'],['en-AU','Australia']].map(([code,label])=>h('option',{key:code,value:code},label))),h('small',null,'Choose the setting closest to your speech, then enable hands-free again.')),
          h('small',null,language.startsWith('es')?'Pruebe « Hola, Kalinga ». El micrófono también funciona sin la frase.':language.startsWith('hi')?'“हे कालिंगा” बोलकर देखें। माइक्रोफ़ोन बटन से भी बोल सकते हैं।':language.startsWith('fr')?'Essayez « Salut, Kalinga ». Le bouton micro fonctionne aussi sans cette phrase.':'Try “Hello, Kalinga”. You can also tap the microphone without a wake phrase.'),
          lastHeard&&h('p',{className:'voice-heard',dir:'auto'},h('strong',null,language.startsWith('es')?'He oído: ':language.startsWith('hi')?'सुना: ':language.startsWith('fr')?'J’ai entendu : ':'Microphone heard: '),lastHeard.transcript),
          lastHeard?.wakeTranscript&&lastHeard.wakeTranscript!==lastHeard.transcript&&h('p',{className:'voice-heard',dir:'auto'},h('strong',null,language.startsWith('es')?'Frase detectada: ':language.startsWith('hi')?'पहचाना गया वाक्य: ':language.startsWith('fr')?'Phrase reconnue : ':'Recognized wake phrase: '),lastHeard.wakeTranscript),
          lastHeard?.phase==='wake'&&h('small',null,lastHeard.wakeDetected?(language.startsWith('es')?'Frase detectada.':language.startsWith('hi')?'जगाने वाला वाक्य पहचाना गया।':language.startsWith('fr')?'Phrase détectée.':'Wake phrase detected.'):(language.startsWith('es')?'Frase no detectada. Nada se ha enviado.':language.startsWith('hi')?'जगाने वाला वाक्य नहीं पहचाना गया। कुछ नहीं भेजा गया।':language.startsWith('fr')?'Phrase non détectée. Rien n’a été envoyé.':'Wake phrase not detected. Nothing was sent.'))),
        voicePlayback.ticket?.assistant_prompt&&['blocked','error'].includes(voicePlayback.status)&&h('button',{className:'btn btn-sm',onClick:()=>voicePlayer.current.retry(voicePlayback.ticket)},wakeCopy.play)
      ),
      h('div',{className:'quick-row'},[copy.water,copy.blanket,copy.bathroom,copy.pain].map((label,index)=>{
        const Icon=[IconWater,IconBlanket,IconBathroom,IconPain][index];
        return h('button',{key:index,className:'qb',disabled:processing||demoRunning,onClick:()=>{stopWake();setVoiceDraft(false);setText(copy.quick[index]);setPainScore(null);setPainLocation('');setPainWorsening(false);setPainOpen(index===3);if(index===3)showAssistantPrompt('pain_question',copy.quick[index]);else send(copy.quick[index],false,null,{});}},h('span',{className:'qb-ico'},h(Icon)),label);
      })),
      h('form',{className:'input-area',onSubmit:e=>{e.preventDefault();stopWake();send(text);}},
        h('label',{className:'input-label',htmlFor:'request'},copy.request),
        h('div',{className:'ta-wrap'},
          h('textarea',{id:'request',value:text,onChange:e=>{stopWake();setText(e.target.value);if(!e.target.value.trim())setVoiceDraft(false);},placeholder:copy.placeholder,maxLength:2000,dir:'auto',disabled:processing||demoRunning}),
          h('button',{type:'button',className:'mic-btn'+(recording?' recording':''),onClick:toggleRecording,'aria-label':recording?'Stop recording':copy.voice,disabled:processing||demoRunning},h('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,'aria-hidden':true},h('rect',{x:9,y:2,width:6,height:12,rx:3}),h('path',{d:'M5 10v2a7 7 0 0014 0v-2M12 19v3M8 22h8'})))
        ),
        painVisible&&h('fieldset',{className:'pain-scale',disabled:processing||demoRunning},
          h('legend',null,painCopy.title),h('p',{id:'pain-question'},painCopy.score),
          h('div',{className:'pain-options',role:'radiogroup','aria-labelledby':'pain-question'},Array.from({length:10},(_,i)=>i+1).map(score=>h('button',{key:score,type:'button',role:'radio','aria-checked':displayedPainScore===score,'aria-label':painCopy.option(score),className:'pain-option'+(displayedPainScore===score?' selected':''),onClick:()=>setPainScore(score)},score))),
          h('div',{className:'pain-endpoints'},h('span',null,painCopy.low),h('span',null,painCopy.high)),
          h('label',{htmlFor:'pain-location'},painCopy.location),h('input',{id:'pain-location',className:'fi',value:painLocation,maxLength:80,placeholder:painCopy.placeholder,onChange:e=>setPainLocation(e.target.value)}),
          h('label',{className:'pain-change'},h('input',{type:'checkbox',checked:painWorsening,onChange:e=>setPainWorsening(e.target.checked)}),painCopy.worsening),
          h('small',null,painCopy.skip)
        ),
        recording && h('div',{className:'voice-status',role:'status'},h('span',{className:'voice-dot'}),copy.listening),
        config.voiceInputProvider==='aws'&&h('p',{className:'transcript-review'},wakeCopy.awsReview),
        voiceDraft && !recording && h('p',{className:'transcript-review'},voiceCopy.review),
        config?.voiceConfigured && h('label',{className:'voice-reply-option'},h('input',{type:'checkbox',checked:voiceReplies,disabled:processing,onChange:e=>{setVoiceReplies(e.target.checked);if(!e.target.checked){stopWake();deferredVoice.current=[];voicePlayer.current.stop();}}}),voiceCopy.replies),
        h('button',{type:'submit',className:'go-btn',disabled:processing||demoRunning||recording||!text.trim()},processing?'Sending…':copy.send)
      ),
      requestError && h('div',{className:'error-box',role:'alert'},requestError,retryRequest&&h('button',{className:'btn',style:{marginTop:10},disabled:processing||emergencyProcessing,onClick:()=>{stopWake();send(retryRequest.text,retryRequest.forceClinical,retryRequest);}},'Retry the same request')),
      !patientUpdate && voicePlayback.status!=='idle' && !voicePlayback.ticket?.assistant_prompt && h('div',{className:'notice-box voice-confirmation',role:'status'},
        h('span',null,voicePlayback.status==='loading'?voiceCopy.preparing:voicePlayback.status==='playing'?voiceCopy.playing:voicePlayback.status==='blocked'?voiceCopy.blocked:voiceCopy.failed),
        ['loading','playing'].includes(voicePlayback.status) ? h('button',{className:'btn btn-sm',onClick:()=>voicePlayer.current.stop()},voiceCopy.stop) : h('button',{className:'btn btn-sm',onClick:()=>voicePlayer.current.retry(voicePlayback.ticket)},voiceCopy.play)
      ),
      h('section',{className:'patient-status','aria-label':copy.history},
        h('h2',null,copy.history),
        tickets.length ? tickets.filter(ticket=>!ticket.parent_id||!tickets.some(parent=>parent.id===ticket.parent_id)).slice(0,12).map(ticket=>h(PatientTicket,{key:ticket.id,ticket,linkedTickets:tickets.filter(task=>task.parent_id===ticket.id),copy,voiceConfigured:config?.voiceConfigured,onReadback:readback})) : h('p',{style:{color:'var(--fg2)'}},'Your requests will appear here after they are delivered.')
      ),
      h('div',{className:'notice-box'},'For immediate help, use the bedside call bell. This demo does not activate hospital paging equipment.'),
      h('button',{className:'btn btn-warn',style:{margin:'0 24px 20px',justifyContent:'center'},onClick:()=>{stopWake();runDemo();},disabled:demoRunning||processing},demoRunning?'Demo · '+demoStep:'Run the 8-request routing demo'),
      demoResults.length>0&&h('details',{className:'demo-results',open:!demoRunning},
        h('summary',null,'Demo results: '+demoResults.filter(r=>r.passed).length+'/'+demoResults.length+' expected routes matched'),
        demoResults.map(row=>h('div',{key:row.label,className:'demo-result '+(row.passed?'pass':'fail')},h('span',null,row.label),h('span',null,(row.passed?'PASS · ':'CHECK · ')+row.actual))),
        h('p',null,'These cases demonstrate routing behavior; they are not a clinical safety certification.')
      )
    ) : h('main',{className:'board-wrap'},
      h('div',{className:'board-heading'},h('div',null,h('h1',null,user.viewAll?user.staff_role+' · unit overview':user.department+' queue'),h('p',null,user.mode==='consult'?(user.department==='Medical Team'?'Emergency alerts and staff-arranged consultations. Nursing and Medical Team acknowledgements are tracked separately.':'Staff-arranged consultations for your service.'):user.mode==='observer'||user.mode==='oversight'?'Monitor requests and escalate to the assigned care team.':'Acknowledge a request to confirm the handoff. The patient receives a status update.')),h('label',{style:{fontSize:14,color:'var(--fg2)'}},h('input',{type:'checkbox',checked:showCompleted,onChange:e=>setShowCompleted(e.target.checked)}),' Show completed')),
      !user.on_shift && h('div',{className:'notice-box'},'You are off shift. New task notifications and task acceptance are paused.'),
      h('section',{className:'d-panel','aria-label':'Department dashboard'},
        h('div',{className:'kpi-row response-kpis'},[
          [active.length,'Open requests',null],[urgentCount,'Urgent','var(--red)'],[tickets.filter(t=>t.status==='RESOLVED').length,'Completed',null]
        ].map(([value,label,color])=>h('div',{key:label,className:'kpi'},h('div',{className:'kpi-val',style:{color:color||'var(--fg)'}},value),h('div',{className:'kpi-lbl'},label)))),
        user.viewAll&&h('div',{className:'tier-tabs','aria-label':'Filter by care team'},[{key:'all',label:'All teams'},...Object.entries(TIERS).map(([key,tier])=>({key,label:tier.label}))].map(tab=>h('button',{key:tab.key,className:'tt'+(filter===tab.key?' on':''),'aria-pressed':filter===tab.key,onClick:()=>setFilter(tab.key)},tab.label))),
        h('div',{className:'feed'},filtered.length ? filtered.map(ticket=>h(StaffTicket,{key:ticket.id,ticket,now,onAction:action,pending:pendingAction===ticket.id,onReferral:refer,canRefer:user.canRefer&&user.on_shift,referralTargets:config.referralTargets.filter(target=>!target.clinical||user.clinicalReferrals),canVideo:config.videoConfigured&&['nurse','charge'].includes(user.id)&&user.on_shift,videoBusy:videoBusy||Boolean(activeCall&&KaalingaVideo.ACTIVE.includes(activeCall.status)),onVideo:offerVideo})) : h('div',{className:'empty-state'},h('p',null,'No open requests for your team.'))),
        h('details',{className:'impact-panel'},h('summary',null,'Routing performance'),h('p',null,'Mean classification: '+(avgLatency===null?'—':avgLatency+' ms')+' · Non-clinical share: '+(tickets.length?Math.round(nonClinical/tickets.length*100)+'%':'—')),h('p',null,'Model confidence is self-reported. Synthetic benchmark results are not a guarantee of clinical safety.')),
        h('details',{className:'impact-panel'},h('summary',null,'Explore estimated nursing time freed'),h('p',null,nonClinical+' non-clinical service tasks × ',h('label',null,h('input',{type:'number',min:0,max:30,step:.5,value:minutes,'aria-label':'Assumed nursing minutes per task',onChange:e=>setMinutes(Math.min(30,Math.max(0,Number(e.target.value)||0)))}),' assumed nursing minutes per task'),' = ',h('strong',null,Math.round(nonClinical*minutes*10)/10+' estimated minutes'),'.'),h('p',null,'An adjustable demo assumption, not measured savings. A pilot should compare nursing interruptions and staff response times before and after routing.'))
      )
    ),
    h('div',{className:'toast'+(toast?' pop':''),role:'status','aria-live':'polite'},toast),
    h('footer',{className:'ui-footer'},'Kalinga · Rutgers Health Hack 2026 · Coordinated service requests, with clinical review kept in nursing.')
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(h(App));
