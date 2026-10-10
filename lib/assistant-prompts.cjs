'use strict';
const PROMPTS={
 en:{ready:'I am listening. Tell me what you need.',confirm:'I heard your request: ',finish:' Say send request to deliver it, or cancel to discard it.',cancelled:'Cancelled. This voice request was not sent.',timeout:'Your voice request was not sent. Say Hey Kaalinga to start again.'},
 es:{ready:'Le escucho. Dígame qué necesita.',confirm:'He escuchado su solicitud: ',finish:' Diga enviar solicitud para enviarla, o cancelar.',cancelled:'Cancelado. Esta solicitud de voz no se ha enviado.',timeout:'Su solicitud de voz no se ha enviado. Diga Hey Kaalinga para comenzar de nuevo.'},
 hi:{ready:'मैं सुन रही हूँ। बताइए आपको क्या चाहिए।',confirm:'मैंने आपका अनुरोध सुना: ',finish:' भेजने के लिए अनुरोध भेजें कहें, या रद्द करें कहें।',cancelled:'रद्द किया गया। यह आवाज़ का अनुरोध नहीं भेजा गया।',timeout:'आपका आवाज़ का अनुरोध नहीं भेजा गया। दोबारा शुरू करने के लिए हे कालिंगा कहें।'},
 fr:{ready:'Je vous écoute. Dites-moi ce dont vous avez besoin.',confirm:'J’ai entendu votre demande : ',finish:' Dites envoyer la demande pour l’envoyer, ou annuler.',cancelled:'Annulé. Cette demande vocale n’a pas été envoyée.',timeout:'Votre demande vocale n’a pas été envoyée. Dites Hey Kaalinga pour recommencer.'}
};
function promptText(input){
 const language=typeof input.language==='string'?input.language.split('-')[0]:'en';
 const copy=PROMPTS[language]||PROMPTS.en;
 if(!['ready','confirm','cancelled','timeout'].includes(input.prompt))return null;
 if(input.prompt!=='confirm')return copy[input.prompt];
 if(typeof input.text!=='string'||!input.text.trim()||input.text.length>2000)return null;
 return copy.confirm+input.text.trim()+copy.finish;
}
module.exports={promptText};
