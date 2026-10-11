from classifier_model.dataset_creation import RN, PCT, CHARGE, PROVIDER, EVS, DIETARY

# Labels follow ROUTING_POLICY.md. An empty list means the correct answer is "Needs Review".

# DEV: the original challenge set with corrected labels. It has been looked at while iterating,
# so use it for tuning (thresholds, new examples) - not as evidence of generalization.
DEV_SET = [
    # English
    ("It's freezing in this room", [PCT]),
    ("Could somebody help me get out of bed?", [PCT]),
    ("My chest feels unusually tight", [RN, PROVIDER]),
    ("I feel like I'm going to faint", [RN, PROVIDER]),
    ("Do you have any vegetarian meals?", [DIETARY]),

    # Spanish
    ("¿Podrían traerme algo para beber?", [PCT]),
    ("El control remoto dejó de funcionar", [PCT]),
    ("Me siento muy mareado", [RN]),
    ("Tengo una presión extraña en el pecho", [RN, PROVIDER]),
    ("¿Qué opciones hay para cenar?", [DIETARY]),

    # Hindi
    ("मुझे बहुत ठंड लग रही है", [PCT]),
    ("क्या कोई मुझे उठने में मदद कर सकता है?", [PCT]),
    ("मेरा सिर बहुत घूम रहा है", [RN]),
    ("मेरे सीने में जकड़न महसूस हो रही है", [RN, PROVIDER]),
    ("क्या शाकाहारी भोजन उपलब्ध है?", [DIETARY]),

    # French
    ("J'ai vraiment froid dans cette chambre", [PCT]),
    ("Pourriez-vous m'aider à me lever ?", [PCT]),
    ("J'ai l'impression de m'évanouir", [RN, PROVIDER]),
    ("Je ressens une pression dans ma poitrine", [RN, PROVIDER]),
    ("Quels plats végétariens proposez-vous ?", [DIETARY]),

    # Multiple requests
    ("I'm freezing and my chest feels tight", [RN, PCT, PROVIDER]),
    ("¿Podrían traerme agua y algo para cenar?", [PCT, DIETARY]),
    ("मुझे चक्कर आ रहे हैं और मुझे शाकाहारी खाना चाहिए", [RN, DIETARY]),
    ("La télécommande ne marche pas, j'ai faim et j'ai mal à la tête", [RN, PCT, DIETARY]),

    # Other roles
    ("Somebody knocked over a cup and the floor is wet", [EVS]),
    ("I rang for help almost an hour ago and I'm still waiting", [CHARGE]),
    ("¿El doctor puede venir a hablar sobre mis resultados?", [PROVIDER]),
    ("La salle de bain est sale et personne n'a répondu à mon appel", [CHARGE, EVS]),
]

# DEV 2: the first holdout. Its errors were used to add training rows and red-flag rules,
# so it is development data now.
DEV_SET_2 = [
    # English
    ("The air conditioning is blasting and I'm shivering", [PCT]),
    ("My call button fell behind the bed, can someone grab it?", [PCT]),
    ("The stitches on my belly are oozing yellow stuff", [RN]),
    ("My heart is pounding really fast and I feel lightheaded", [RN, PROVIDER]),
    ("I haven't had a bowel movement in four days", [RN]),
    ("When is my next dose of antibiotics?", [RN]),
    ("Has anyone decided whether I'm getting the procedure or not?", [PROVIDER]),
    ("I'd like someone to explain what my echo showed", [PROVIDER]),
    ("The aide rolled her eyes at me and I want a supervisor to know", [CHARGE]),
    ("Can I get oatmeal instead of eggs tomorrow?", [DIETARY]),
    ("The tray they brought has peanuts and I'm allergic", [DIETARY, RN]),
    ("Someone left used gloves on my bedside table", [EVS]),
    ("The toilet keeps running and there's water on the floor", [EVS]),
    ("I've been lying in a wet bed for 45 minutes waiting for someone", [PCT, CHARGE]),
    ("My pain pill was supposed to come two hours ago and no one has brought it", [RN, CHARGE]),
    ("I can't catch my breath when I talk", [RN, PROVIDER]),
    ("I'm bleeding through my dressing and it won't stop", [RN, PROVIDER]),
    ("I need to pee and I'd like to order lunch", [PCT, DIETARY]),
    ("My chest hurts and the room is a mess", [RN, PROVIDER, EVS]),
    ("Can the doctor come by? My stomach pain is way worse than yesterday", [RN, PROVIDER]),
    ("What time do they pick up the menu for tomorrow?", [DIETARY]),

    # Spanish
    ("Tengo frío, ¿me pueden traer otra almohada y cerrar la ventana?", [PCT]),
    ("Necesito ayuda para voltearme en la cama", [PCT]),
    ("Me arde mucho donde tengo el suero", [RN]),
    ("Lo veo todo negro y siento que me caigo", [RN, PROVIDER]),
    ("¿Cuándo me van a quitar los puntos? Quiero preguntarle al doctor", [PROVIDER]),
    ("Llevo casi una hora esperando que alguien me ayude a ir al baño", [PCT, CHARGE]),
    ("El piso del baño está lleno de agua y tengo hambre", [EVS, DIETARY]),
    ("Quiero quejarme de cómo me trató el personal anoche", [CHARGE]),
    ("¿Me pueden traer la cena sin sal?", [DIETARY]),

    # Hindi
    ("मुझे बहुत गर्मी लग रही है, क्या पंखा चला सकते हैं?", [PCT]),
    ("खाना खाने के बाद से पेट में ऐंठन हो रही है", [RN]),
    ("मेरी छाती में दबाव जैसा लग रहा है", [RN, PROVIDER]),
    ("डॉक्टर से पूछना है कि मेरी रिपोर्ट में क्या आया", [PROVIDER]),
    ("कमरे में बहुत गंदगी है और किसी ने मेरी घंटी का जवाब नहीं दिया", [EVS, CHARGE]),
    ("मुझे रात का खाना चाहिए और एक तकिया भी", [PCT, DIETARY]),
    ("क्या मेरे बेटे को रात में यहाँ रुकने दिया जाएगा?", [CHARGE]),

    # French
    ("Il fait trop chaud dans la chambre", [PCT]),
    ("Ma perfusion me fait mal au bras", [RN]),
    ("J'ai une douleur qui serre dans la poitrine", [RN, PROVIDER]),
    ("Le médecin peut-il m'expliquer quand je pourrai rentrer ?", [PROVIDER]),
    ("Ça fait une heure que j'ai sonné, personne ne vient", [CHARGE]),
    ("Mon repas est arrivé froid, puis-je en avoir un autre ?", [DIETARY]),
    ("J'ai renversé de l'eau par terre et j'ai besoin d'aide pour aller aux toilettes", [EVS, PCT]),

    # Out of scope - should come back as Needs Review
    ("What's the wifi password?", []),
    ("asdf jkl", []),
    ("Who won the game last night?", []),
    ("¿Dónde está la capilla?", []),
    ("Can you call me a taxi?", []),
]

# HOLDOUT: written after the DEV_SET_2 fixes, independently of the training data. Do not tune on it -
# change the model, then look at this once. Ideally a teammate replaces it with requests they wrote.
HOLDOUT_SET = [
    # English
    ("The heater in here isn't doing anything and my feet are ice cold", [PCT]),
    ("Can someone tuck in my sheets? They keep coming loose", [PCT]),
    ("I need a hand getting back into bed from the chair", [PCT]),
    ("My bed pad is wet again", [PCT]),
    ("My throat is really sore and it hurts to swallow", [RN]),
    ("I've been itching all over since that new pill", [RN]),
    ("Am I due for my pain shot soon?", [RN]),
    ("My arm with the IV looks red and puffy", [RN]),
    ("There's a crushing feeling behind my breastbone", [RN, PROVIDER]),
    ("I nearly collapsed in the bathroom just now", [RN, PROVIDER]),
    ("Can someone tell me what the plan is for my kidneys?", [PROVIDER]),
    ("When will I know if I need another scan?", [PROVIDER]),
    ("I'd like to understand the risks before I sign the consent form", [PROVIDER]),
    ("Nobody has come to check my vitals all night and I'm worried", [RN, CHARGE]),
    ("I'm upset about how the staff handled my discharge", [CHARGE]),
    ("Can my sister bring my kids to visit tonight?", [CHARGE]),
    ("Could I get a vegan option for dinner?", [DIETARY]),
    ("My breakfast had shellfish in it and I told them I'm allergic", [DIETARY, RN]),
    ("There's a dirty towel on the bathroom floor and the sink is clogged", [EVS]),
    ("My lunch tray never came and I'm starving", [DIETARY, CHARGE]),
    ("I need the bedpan and my stomach is cramping", [PCT, RN]),
    ("Can you bring more pillows and something to drink?", [PCT]),
    ("The trash is overflowing and I'd like to order dinner", [EVS, DIETARY]),

    # Spanish
    ("Me hice pipí en la cama, perdón", [PCT]),
    ("Me duele la garganta y tengo tos", [RN]),
    ("¿Ya me toca la inyección para la presión?", [RN]),
    ("Me sangra la herida y no para", [RN, PROVIDER]),
    ("¿El médico ya decidió si me opera?", [PROVIDER]),
    ("Nadie me ha traído la comida y ya son las tres", [DIETARY, CHARGE]),
    ("El baño huele horrible y no hay jabón", [EVS]),
    ("¿Pueden dejar que mi mamá se quede esta noche?", [CHARGE]),

    # Hindi
    ("मुझे बहुत पसीना आ रहा है और सीने में दर्द है", [RN, PROVIDER]),
    ("मुझे उल्टी जैसा महसूस हो रहा है और कुछ खाया नहीं जा रहा", [RN]),
    ("डॉक्टर बताएँ कि मुझे कितने दिन और रुकना होगा", [PROVIDER]),
    ("बिस्तर की चादर बदलनी है और पानी भी चाहिए", [PCT]),
    ("मेरे कमरे में कॉकरोच है", [EVS]),
    ("एक घंटे से नर्स को बुला रहा हूँ, कोई नहीं आया", [CHARGE]),

    # French
    ("Mon pansement est plein de sang et ça ne s'arrête pas", [RN, PROVIDER]),
    ("Pouvez-vous baisser la lumière et m'aider à me tourner ?", [PCT]),
    ("Est-ce que c'est l'heure de mes cachets ?", [RN]),
    ("J'aimerais comprendre les résultats de ma prise de sang", [PROVIDER]),
    ("Il n'y a plus de serviettes dans la salle de bain", [EVS]),
    ("Je voudrais un repas sans lactose", [DIETARY]),
    ("L'infirmière de nuit a été très désagréable avec moi", [CHARGE]),

    # Out of scope - should come back as Needs Review
    ("Will my insurance cover this stay?", []),
    ("What's the best pizza place nearby?", []),
    ("How do I change the language on my phone?", []),
    ("What's the score of the Knicks game?", []),
    ("Can you play some music?", []),
    ("I want to buy a lottery ticket", []),
    ("blah blah", []),
    ("123456", []),
    ("Where's the nearest bus stop?", []),
    ("¿Qué día es hoy?", []),
    ("¿Dónde queda la farmacia de la calle?", []),
    ("buenas noches", []),
    ("दिल्ली की ट्रेन कब है?", []),
    ("मुझे क्रिकेट का स्कोर बताओ", []),
    ("Comment s'appelle le président ?", []),
    ("Où puis-je acheter un journal ?", []),
    ("merci beaucoup", []),
    ("Ma voiture est garée où ?", []),
]
