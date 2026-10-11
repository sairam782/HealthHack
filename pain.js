(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.KaalingaPain=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const cue=/(?:^|[^\p{L}])(?:pain(?:ful)?|hurts?|aching|ache|dolor|duele|douleur|schmerz)(?=$|[^\p{L}])|दर्द|ألم|痛み|통증/u;
  const words={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,uno:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,un:1,deux:2,trois:3,quatre:4,cinq:5,sept:7,huit:8,neuf:9,dix:10,'एक':1,'दो':2,'तीन':3,'चार':4,'पाँच':5,'पांच':5,'छह':6,'सात':7,'आठ':8,'नौ':9,'दस':10};
  const normalize=text=>String(text).normalize('NFKC').toLowerCase().replace(/[०-९]/g,c=>String(c.charCodeAt(0)-0x0966)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x0660));
  function hasPain(text){return cue.test(normalize(text));}
  function reportedPain(text){return hasPain(text)&&!/(?:\b(?:no pain|not in pain|(?:don't|do not) have (?:any )?pain|sin dolor|pas de douleur)\b|दर्द नहीं)/iu.test(normalize(text));}
  function extractScore(text){
    const t=normalize(text);if(!hasPain(t))return null;
    const number='(?:\\d{1,2}|'+Object.keys(words).join('|')+')';
    const candidates=[];
    // Require a scale expression or a score directly attached to a pain label;
    // room numbers and medication doses never count as pain scores.
    for(const match of t.matchAll(new RegExp('(?:^|[^\\p{L}\\p{N}.])('+number+')\\s*(?:/\\s*10\\b|out of (?:10|ten)\\b|sobre (?:10|diez)\\b|sur (?:10|dix)\\b|में से (?:10|दस))','gu')))candidates.push(match[1]);
    for(const match of t.matchAll(new RegExp('(?:pain|dolor|douleur|दर्द)\\s*(?:(?:score|level|is|at|es|de|है|का स्तर)\\s*){0,2}[:=]?\\s*('+number+')(?!\\s*(?:mg|milligrams?|tablets?|pills?|hours?|days?|out of|/))(?=$|[^\\p{L}\\p{N}.])','gu')))candidates.push(match[1]);
    const scores=[...new Set(candidates.map(v=>words[v]??Number(v)))];
    return scores.length===1&&Number.isInteger(scores[0])&&scores[0]>=1&&scores[0]<=10?scores[0]:null;
  }
  function details(text,options={}){
    const selected=Number.isInteger(options.painScore)&&options.painScore>=1&&options.painScore<=10?options.painScore:null;
    const transcript=extractScore(text),score=selected??transcript;
    if(!hasPain(text)&&score===null&&!options.painWorsening)return null;
    const worsening=options.painWorsening===true||/pain.*(?:worse|worsening|suddenly|increas)|(?:worse|worsening|sudden).*pain|dolor.*(?:peor|aument)|douleur.*(?:augmente|aggrave)|दर्द.*(?:बढ़|अचानक)/iu.test(text);
    return {score,location:typeof options.painLocation==='string'?options.painLocation.trim():'',worsening,score_source:selected!==null?'selected':score!==null?'transcript':null,transcript_score:transcript,conflicting_score:selected!==null&&transcript!==null&&selected!==transcript,band:score===null?null:score<=3?'mild':score<=6?'moderate':'severe'};
  }
  const COPY={
    en:{title:'Tell us about your pain',score:'How strong is your pain?',low:'1 · Slight pain',high:'10 · Worst pain you can imagine',location:'Where does it hurt? (optional)',placeholder:'For example, lower back',worsening:'The pain is new or getting worse',skip:'You can send without choosing a number. A nurse will assess your pain.',recorded:n=>'Your reported pain score is '+n+' out of 10.',review:'Nursing will review your pain request.'},
    es:{title:'Cuéntenos sobre su dolor',score:'¿Qué intensidad tiene su dolor?',low:'1 · Dolor leve',high:'10 · El peor dolor imaginable',location:'¿Dónde le duele? (opcional)',placeholder:'Por ejemplo, zona lumbar',worsening:'El dolor es nuevo o está empeorando',skip:'Puede enviar sin elegir un número. Enfermería evaluará su dolor.',recorded:n=>'La intensidad de dolor que indicó es '+n+' de 10.',review:'Enfermería revisará su solicitud por dolor.'},
    hi:{title:'अपने दर्द के बारे में बताएं',score:'आपका दर्द कितना तेज़ है?',low:'1 · थोड़ा दर्द',high:'10 · सबसे तेज़ दर्द जिसकी कल्पना कर सकते हैं',location:'दर्द कहाँ है? (वैकल्पिक)',placeholder:'जैसे, कमर में',worsening:'दर्द नया है या बढ़ रहा है',skip:'बिना अंक चुने भी भेज सकते हैं। नर्स आपके दर्द का आकलन करेंगी।',recorded:n=>'आपके बताए दर्द का स्तर 10 में से '+n+' है।',review:'नर्स आपके दर्द के अनुरोध की समीक्षा करेंगी।'},
    fr:{title:'Parlez-nous de votre douleur',score:'Quelle est l’intensité de votre douleur ?',low:'1 · Douleur légère',high:'10 · La pire douleur imaginable',location:'Où avez-vous mal ? (facultatif)',placeholder:'Par exemple, le bas du dos',worsening:'La douleur est nouvelle ou s’aggrave',skip:'Vous pouvez envoyer sans choisir de nombre. Une infirmière évaluera votre douleur.',recorded:n=>'L’intensité de douleur que vous avez indiquée est de '+n+' sur 10.',review:'L’équipe infirmière examinera votre demande liée à la douleur.'}
  };
  const labels={
    en:{reported:'Reported pain',unscored:'Not scored',changed:'New or worsening',conflict:'The selected score differs from the spoken or typed score. Confirm with the patient.',option:n=>n+' out of 10'},
    es:{reported:'Dolor indicado',unscored:'Sin puntuación',changed:'Nuevo o empeorando',conflict:'La puntuación seleccionada difiere de la indicada. Confirme con el paciente.',option:n=>n+' de 10'},
    hi:{reported:'बताया गया दर्द',unscored:'अंक नहीं बताया',changed:'नया या बढ़ता दर्द',conflict:'चुना गया अंक बताए गए अंक से अलग है। मरीज से पुष्टि करें।',option:n=>'10 में से '+n},
    fr:{reported:'Douleur indiquée',unscored:'Sans score',changed:'Nouvelle ou aggravée',conflict:'Le score sélectionné diffère du score indiqué. Confirmez avec le patient.',option:n=>n+' sur 10'}
  };
  for(const code of Object.keys(labels))Object.assign(COPY[code],labels[code]);
  function receipt(pain,code='en'){if(!pain)return '';const copy=COPY[code]||COPY.en;return (pain.score!==null?copy.recorded(pain.score)+' ':'')+copy.review;}
  return {hasPain,reportedPain,extractScore,details,COPY,receipt};
});
