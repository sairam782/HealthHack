from pathlib import Path
import pandas as pd

DATASET_PATH = Path(__file__).resolve().parent / "dataset.csv"

data = {
    "text": [
        # Blanket - 0
        "I need a blanket",
        "Can I have another blanket?",
        "Necesito una manta",
        "मुझे एक कंबल चाहिए",
        "J'ai besoin d'une couverture",
        "Could you bring me an extra blanket?",
        "I'd like a warmer blanket please",
        "Can I get a thicker cover for my bed?",
        "Please bring me one more blanket",
        "¿Me puede traer otra cobija?",
        "Quisiera una manta extra, por favor",
        "क्या मुझे एक और कंबल मिल सकता है?",
        "कृपया मेरे लिए कंबल ले आइए",
        "Pourriez-vous m'apporter une autre couverture ?",
        "Je voudrais une couverture supplémentaire",

        # Nausea - 1
        "I'm feeling nauseous",
        "I feel like throwing up",
        "Tengo náuseas",
        "मुझे उल्टी जैसा लग रहा है",
        "J'ai envie de vomir",
        "I think I'm going to be sick",
        "My stomach feels queasy",
        "I just vomited",
        "I need a bag, I might throw up",
        "Tengo ganas de vomitar",
        "Acabo de vomitar",
        "मुझे मतली हो रही है",
        "मैंने अभी उल्टी की है",
        "J'ai la nausée",
        "Je viens de vomir",

        # Food - 2
        "Can I get lunch?",
        "I would like some food",
        "Quiero algo de comer",
        "मुझे खाना चाहिए",
        "J'ai faim",
        "When is breakfast being served?",
        "I'm hungry, can I order a meal?",
        "Can I see the menu?",
        "I'd like a snack please",
        "Tengo hambre",
        "¿Puedo pedir el almuerzo?",
        "मुझे भूख लगी है",
        "क्या मुझे नाश्ता मिल सकता है?",
        "Est-ce que je peux avoir le déjeuner ?",
        "Je voudrais quelque chose à manger",

        # Bathroom - 3
        "I need to use the bathroom",
        "Can someone help me to the toilet?",
        "Necesito ir al baño",
        "मुझे बाथरूम जाना है",
        "Je dois aller aux toilettes",
        "I need help getting to the restroom",
        "Can I get a bedpan?",
        "I have to pee",
        "Please help me walk to the bathroom",
        "¿Me puede ayudar a ir al baño?",
        "Necesito un orinal",
        "मुझे शौचालय जाने में मदद चाहिए",
        "मुझे पेशाब करना है",
        "Pouvez-vous m'aider à aller aux toilettes ?",
        "J'ai besoin d'un bassin",

        # TV Assistance - 4
        "My TV isn't working",
        "Can someone fix the television?",
        "Mi televisor no funciona",
        "मेरा टीवी काम नहीं कर रहा है",
        "Ma télévision ne fonctionne pas",
        "The TV screen is black",
        "There's no sound coming from the TV",
        "How do I change the channel?",
        "Can someone turn on the television for me?",
        "La televisión no tiene sonido",
        "¿Alguien puede encender la tele?",
        "टीवी की आवाज़ नहीं आ रही है",
        "कृपया मेरा टीवी चालू कर दीजिए",
        "La télé n'a pas de son",
        "Pouvez-vous allumer la télévision ?",

        # Pain - 5
        "I'm experiencing pain",
        "My stomach hurts badly",
        "Tengo mucho dolor",
        "मुझे बहुत दर्द हो रहा है",
        "J'ai très mal",
        "My head is pounding",
        "My back is really sore",
        "Can I get some pain medication?",
        "The pain in my leg is getting worse",
        "Me duele mucho la cabeza",
        "Necesito algo para el dolor",
        "मेरे सिर में बहुत दर्द है",
        "मुझे दर्द की दवा चाहिए",
        "J'ai mal au dos",
        "J'ai besoin d'un antidouleur",

        # Water - 6
        "Can I have some water?",
        "Please bring me water",
        "Necesito agua",
        "मुझे पानी चाहिए",
        "J'ai besoin d'eau",
        "I'm really thirsty",
        "Could you refill my water cup?",
        "May I have a glass of water?",
        "My water jug is empty",
        "Tengo mucha sed",
        "¿Me trae un vaso de agua?",
        "मुझे बहुत प्यास लगी है",
        "क्या मुझे एक गिलास पानी मिल सकता है?",
        "J'ai très soif",
        "Pourriez-vous me donner un verre d'eau ?",

        # Ice Chips - 7
        "Can I get some ice chips?",
        "Please bring me crushed ice",
        "Necesito hielo picado",
        "मुझे बर्फ के छोटे टुकड़े चाहिए",
        "Je voudrais de la glace pilée",
        "I'd like a cup of ice chips",
        "My mouth is dry, can I have ice chips?",
        "Could you bring more ice chips?",
        "Can I have some ice to suck on?",
        "¿Me puede traer trocitos de hielo?",
        "Quisiera un vaso con hielo",
        "क्या मुझे थोड़ी बर्फ मिल सकती है?",
        "कृपया बर्फ के टुकड़े ले आइए",
        "Puis-je avoir des glaçons ?",
        "Pourriez-vous m'apporter des morceaux de glace ?",

        # General Discomfort - 8
        "I'm not feeling well",
        "Something doesn't feel right",
        "No me siento bien",
        "मेरी तबीयत ठीक नहीं है",
        "Je ne me sens pas bien",
        "I feel off today",
        "I'm really uncomfortable",
        "I can't get comfortable in this bed",
        "I feel weak and tired",
        "Me siento incómodo",
        "Algo no está bien conmigo",
        "मुझे बेचैनी हो रही है",
        "मुझे कमजोरी महसूस हो रही है",
        "Je me sens mal à l'aise",
        "Quelque chose ne va pas",

        # Emergency - 9
        "I can't breathe",
        "I'm having severe chest pain",
        "No puedo respirar",
        "मुझे सांस लेने में परेशानी हो रही है",
        "Je n'arrive pas à respirer",
        "Help, I'm having trouble breathing",
        "I think I'm having a heart attack",
        "Someone come quickly, it's an emergency",
        "I'm bleeding heavily",
        "¡Ayuda, es una emergencia!",
        "Me falta el aire",
        "मदद कीजिए, यह आपातकाल है",
        "मुझे बहुत ज़्यादा खून बह रहा है",
        "Au secours, c'est une urgence !",
        "J'ai du mal à respirer",

        # Cleaning / Spills - 10
        "There's a spill on the floor",
        "Can someone clean my room?",
        "Hay algo derramado en el piso",
        "फर्श पर कुछ गिर गया है",
        "Il y a un dégât sur le sol",
        "The bathroom is dirty",
        "My trash can is overflowing",
        "The bathroom floor is sticky",
        "Someone spilled juice all over the table",
        "El baño está sucio",
        "¿Pueden vaciar la basura?",
        "बाथरूम बहुत गंदा है",
        "कृपया मेरा कमरा साफ कर दीजिए",
        "La salle de bain est sale",
        "Pouvez-vous vider la poubelle ?",

        # Unanswered / Overdue Request - 11
        "I've been waiting a long time and nobody has come",
        "I pressed the call button an hour ago",
        "Llevo mucho tiempo esperando y nadie viene",
        "मैं बहुत देर से इंतज़ार कर रहा हूँ, कोई नहीं आया",
        "J'attends depuis longtemps et personne ne vient",
        "Nobody has answered my call light",
        "I don't know who my nurse is today",
        "I asked for help twenty minutes ago and I'm still waiting",
        "Can I speak to the nurse in charge of the floor right now?",
        "Nadie ha respondido a mi llamada",
        "No sé quién es mi enfermera hoy",
        "मेरी कॉल का किसी ने जवाब नहीं दिया",
        "आज मेरी नर्स कौन है, मुझे नहीं पता",
        "Personne n'a répondu à mon appel",
        "Je ne sais pas qui est mon infirmière aujourd'hui",

        # Doctor / Provider Request - 12
        "When is the doctor coming to see me?",
        "I have questions about my diagnosis",
        "¿Cuándo viene el médico?",
        "डॉक्टर मुझे कब देखने आएंगे?",
        "Quand est-ce que le médecin va passer ?",
        "Can the doctor explain my test results?",
        "I want to talk to my doctor about my treatment plan",
        "I'd like to ask the physician about my surgery",
        "Can the nurse practitioner come by?",
        "Tengo preguntas sobre mi diagnóstico",
        "Quiero hablar con mi doctor sobre el tratamiento",
        "मुझे अपनी रिपोर्ट के बारे में डॉक्टर से बात करनी है",
        "मेरे इलाज के बारे में डॉक्टर से सवाल हैं",
        "J'ai des questions sur mon diagnostic",
        "Le médecin peut-il m'expliquer mes résultats ?",
    ],

    "label": [
        *([0] * 15),
        *([1] * 15),
        *([2] * 15),
        *([3] * 15),
        *([4] * 15),
        *([5] * 15),
        *([6] * 15),
        *([7] * 15),
        *([8] * 15),
        *([9] * 15),
        *([10] * 15),
        *([11] * 15),
        *([12] * 15),
    ]
}

# Routing roles from the RWJUH med-surg unit staffing breakdown
RN = "Registered Nurse"
PCT = "Patient Care Technician"
CHARGE = "Charge Nurse"
PROVIDER = "Provider"  # hospitalist / attending, resident / fellow, NP / PA
EVS = "Environmental Services"
DIETARY = "Dietary"
DEPARTMENTS = [RN, PCT, CHARGE, PROVIDER, EVS, DIETARY]

# Multiple requests at once - labeled directly with every role that should respond
multi_data = [
    # PCT only
    ("I need a blanket and some water", [PCT]),
    ("Can someone help me to the bathroom and bring me some ice chips?", [PCT]),
    ("Necesito una manta y un vaso de agua", [PCT]),
    ("मुझे कंबल और पानी चाहिए", [PCT]),
    ("J'ai besoin d'une couverture et d'un verre d'eau", [PCT]),
    ("My TV isn't working and I'm also thirsty", [PCT]),
    ("Could you bring me ice chips and another blanket?", [PCT]),
    ("I need to use the restroom, and can you turn on the TV after?", [PCT]),
    ("Can I get more water and some crushed ice?", [PCT]),
    ("¿Me puede ayudar a ir al baño y traerme agua?", [PCT]),
    ("La televisión no funciona y necesito otra cobija", [PCT]),
    ("कृपया मुझे बाथरूम ले चलिए और फिर टीवी चालू कर दीजिए", [PCT]),
    ("क्या मुझे बर्फ के टुकड़े और एक कंबल मिल सकता है?", [PCT]),
    ("Pouvez-vous m'aider à aller aux toilettes et m'apporter des glaçons ?", [PCT]),
    ("Ma télé ne marche pas et j'ai besoin d'eau", [PCT]),

    # RN + PCT
    ("I'm in a lot of pain and I need some water", [RN, PCT]),
    ("I feel nauseous, can someone bring me ice chips?", [RN, PCT]),
    ("My back hurts and I need help getting to the bathroom", [RN, PCT]),
    ("I don't feel well and my TV won't turn on", [RN, PCT]),
    ("Tengo dolor de cabeza y necesito una manta", [RN, PCT]),
    ("Me siento mal y necesito ir al baño", [RN, PCT]),
    ("मुझे दर्द हो रहा है और पानी चाहिए", [RN, PCT]),
    ("J'ai la nausée et j'ai besoin d'aller aux toilettes", [RN, PCT]),

    # PCT + Dietary
    ("Can I get lunch and another blanket?", [PCT, DIETARY]),
    ("I'm hungry and thirsty, can I have some food and water?", [PCT, DIETARY]),
    ("Can I see the menu? Also my TV isn't working", [PCT, DIETARY]),
    ("Help me to the bathroom, then I'd like breakfast", [PCT, DIETARY]),
    ("Quiero algo de comer y una cobija, por favor", [PCT, DIETARY]),
    ("मुझे भूख लगी है और कंबल भी चाहिए", [PCT, DIETARY]),
    ("Je voudrais le déjeuner et une couverture", [PCT, DIETARY]),
    ("Pouvez-vous allumer la télé et m'apporter quelque chose à manger ?", [PCT, DIETARY]),

    # RN + Dietary
    ("I'm hungry but my stomach really hurts", [RN, DIETARY]),
    ("Can I order dinner? Also I need pain medication", [RN, DIETARY]),
    ("I feel nauseous, is there something light I can eat?", [RN, DIETARY]),
    ("I'm not feeling well, can I get some soup?", [RN, DIETARY]),
    ("Tengo hambre y me duele la cabeza", [RN, DIETARY]),
    ("Necesito algo para el dolor y quiero almorzar", [RN, DIETARY]),
    ("मुझे भूख लगी है और सिर में दर्द है", [RN, DIETARY]),
    ("J'ai faim et j'ai mal au dos", [RN, DIETARY]),

    # RN + PCT + Dietary
    ("I'm in pain, I'm hungry, and I need a blanket", [RN, PCT, DIETARY]),
    ("Can I get lunch, some water, and something for my headache?", [RN, PCT, DIETARY]),
    ("I feel sick, I'm cold, and I haven't eaten all day", [RN, PCT, DIETARY]),
    ("My stomach hurts, my TV is broken, and I'd like dinner", [RN, PCT, DIETARY]),
    ("Tengo dolor, tengo hambre y necesito ir al baño", [RN, PCT, DIETARY]),
    ("Necesito agua, comida y algo para las náuseas", [RN, PCT, DIETARY]),
    ("मुझे दर्द है, भूख लगी है और कंबल चाहिए", [RN, PCT, DIETARY]),
    ("J'ai mal, j'ai faim et j'ai besoin d'une couverture", [RN, PCT, DIETARY]),

    # PCT + EVS
    ("There's a spill by my bed and I need another blanket", [PCT, EVS]),
    ("The bathroom is dirty and I need help getting there", [PCT, EVS]),
    ("Hay agua en el piso y necesito una cobija", [PCT, EVS]),
    ("La poubelle déborde et j'ai besoin d'eau", [PCT, EVS]),

    # EVS + Dietary
    ("My lunch tray has no utensils and the trash is full", [EVS, DIETARY]),
    ("I spilled my soup everywhere, can I get another bowl?", [EVS, DIETARY]),
    ("मेरा खाना फर्श पर गिर गया, क्या मुझे दूसरा मिल सकता है?", [EVS, DIETARY]),

    # PCT + Charge Nurse
    ("I've been waiting 30 minutes for help to the bathroom", [PCT, CHARGE]),
    ("Llevo una hora esperando una cobija", [PCT, CHARGE]),
    ("J'ai demandé de l'eau il y a une heure et personne n'est venu", [PCT, CHARGE]),

    # RN + Charge Nurse
    ("I asked for pain medicine an hour ago and nobody came", [RN, CHARGE]),
    ("Pedí algo para las náuseas hace mucho y nadie ha venido", [RN, CHARGE]),
    ("मैंने दर्द की दवा एक घंटे पहले मांगी थी, कोई नहीं आया", [RN, CHARGE]),

    # RN + Provider
    ("My pain is getting worse and I want the doctor to look at it", [RN, PROVIDER]),
    ("Me siento peor que ayer, quiero ver al médico", [RN, PROVIDER]),
    ("Mon incision est rouge et gonflée, le médecin peut-il venir ?", [RN, PROVIDER]),
]

intent_to_departments = {
    0: [PCT],              # Blanket
    1: [RN],               # Nausea
    2: [DIETARY],          # Food
    3: [PCT],              # Bathroom
    4: [PCT],              # TV Assistance
    5: [RN],               # Pain
    6: [PCT],              # Water
    7: [PCT],              # Ice Chips
    8: [RN],               # General Discomfort
    9: [RN, PROVIDER],     # Emergency
    10: [EVS],             # Cleaning / Spills
    11: [CHARGE],          # Unanswered / Overdue Request
    12: [PROVIDER],        # Doctor / Provider Request
}

# Extra examples so every role ends up with the same number of samples
balance_data = [
    # Charge Nurse only - overdue requests and unit coordination
    ("I've been waiting over an hour for someone to answer my call light", [CHARGE]),
    ("No one has checked on me since this morning", [CHARGE]),
    ("Who is in charge of this floor today?", [CHARGE]),
    ("I keep pressing the button and nobody shows up", [CHARGE]),
    ("My nurse went on break and nobody is covering for her", [CHARGE]),
    ("I'd like to request a different nurse for my next shift", [CHARGE]),
    ("Can I talk to whoever is running the unit tonight?", [CHARGE]),
    ("Nadie ha venido a verme desde la mañana", [CHARGE]),
    ("¿Quién está a cargo del piso hoy?", [CHARGE]),
    ("Sigo presionando el botón y nadie aparece", [CHARGE]),
    ("सुबह से कोई मुझे देखने नहीं आया", [CHARGE]),
    ("आज इस मंज़िल का इंचार्ज कौन है?", [CHARGE]),
    ("मैं बार-बार बटन दबा रहा हूँ पर कोई नहीं आता", [CHARGE]),
    ("Personne n'est venu me voir depuis ce matin", [CHARGE]),
    ("Qui est responsable de l'étage aujourd'hui ?", [CHARGE]),

    # Charge Nurse only - overdue requests escalated into complaints
    ("Nobody answered my call light again and I want to file a complaint", [CHARGE]),
    ("This is the third night in a row I've waited hours for help, I want a supervisor", [CHARGE]),
    ("I've been ignored all day and I want to report it", [CHARGE]),
    ("The night staff never come when I call, someone needs to fix this", [CHARGE]),
    ("I waited two hours for help and the staff were rude about it", [CHARGE]),
    ("I want to talk to the charge nurse and the manager about how long I've been waiting", [CHARGE]),
    ("Every time I ring the bell it takes forever, I want this escalated", [CHARGE]),
    ("Nadie contesta mi llamada otra vez y quiero poner una queja", [CHARGE]),
    ("Llevo horas esperando todos los días, quiero hablar con un supervisor", [CHARGE]),
    ("Me han ignorado todo el día y quiero reportarlo", [CHARGE]),
    ("फिर से किसी ने मेरी कॉल का जवाब नहीं दिया, मैं शिकायत करना चाहता हूँ", [CHARGE]),
    ("मुझे रोज़ घंटों इंतज़ार करना पड़ता है, मुझे सुपरवाइज़र से बात करनी है", [CHARGE]),
    ("पूरे दिन मुझे नज़रअंदाज़ किया गया, मैं इसकी रिपोर्ट करना चाहता हूँ", [CHARGE]),
    ("Personne ne répond encore à mon appel, je veux porter plainte", [CHARGE]),
    ("J'attends des heures chaque nuit, je veux parler à un responsable", [CHARGE]),

    # Charge Nurse only - assignments, room changes, unit coordination
    ("Can I be moved to a private room?", [CHARGE]),
    ("My roommate snores all night, can I switch rooms?", [CHARGE]),
    ("Which nurse is assigned to me this shift?", [CHARGE]),
    ("I haven't seen a nurse since shift change", [CHARGE]),
    ("Is there a quieter room available on this floor?", [CHARGE]),
    ("My nurse seems overwhelmed, can someone else help her?", [CHARGE]),
    ("Can my wife stay overnight in my room?", [CHARGE]),
    ("Can my family visit after visiting hours tonight?", [CHARGE]),
    ("I was told I'd be transferred to another unit, when is that happening?", [CHARGE]),
    ("The nurse said she'd be right back but that was forty-five minutes ago", [CHARGE]),
    ("Nobody told me who my nurse is tonight", [CHARGE]),
    ("Can you find out why nobody is answering the call bell?", [CHARGE]),
    ("I'd prefer a female nurse, is that possible?", [CHARGE]),
    ("My roommate's TV is blasting and I can't sleep, can I move?", [CHARGE]),
    ("Who can I talk to about how this unit is being run tonight?", [CHARGE]),
    ("It's been ages since anyone came by to check on me", [CHARGE]),
    ("My nurse keeps changing every few hours and I'm confused", [CHARGE]),
    ("Can someone coordinate my care? Everyone tells me something different", [CHARGE]),
    ("I need to speak to whoever is supervising the nurses right now", [CHARGE]),
    ("Can my son bring our dog in to visit?", [CHARGE]),
    ("I've been sitting in the hallway bed for hours, when will I get a room?", [CHARGE]),
    ("Why does it take so long for anyone to respond on this floor?", [CHARGE]),
    ("I asked to be moved closer to the nurses' station, has that been approved?", [CHARGE]),
    ("The night shift never introduced themselves to me", [CHARGE]),
    ("Can more than two visitors come in at once?", [CHARGE]),
    ("¿Puedo cambiarme a una habitación privada?", [CHARGE]),
    ("¿Qué enfermera me toca en este turno?", [CHARGE]),
    ("No he visto a ninguna enfermera desde el cambio de turno", [CHARGE]),
    ("¿Puede mi esposo quedarse a dormir conmigo?", [CHARGE]),
    ("Mi compañero de cuarto ronca mucho, ¿me pueden cambiar?", [CHARGE]),
    ("¿Cuándo me van a trasladar a otra unidad?", [CHARGE]),
    ("Prefiero una enfermera mujer, ¿es posible?", [CHARGE]),
    ("La enfermera dijo que volvía enseguida y ya pasó casi una hora", [CHARGE]),
    ("¿Mi familia puede visitarme después del horario?", [CHARGE]),
    ("Quiero hablar con quien supervisa a las enfermeras ahora", [CHARGE]),
    ("क्या मुझे अलग कमरा मिल सकता है?", [CHARGE]),
    ("इस शिफ़्ट में मेरी नर्स कौन है?", [CHARGE]),
    ("शिफ़्ट बदलने के बाद से कोई नर्स नहीं आई", [CHARGE]),
    ("क्या मेरी पत्नी रात को मेरे साथ रुक सकती है?", [CHARGE]),
    ("मेरे कमरे का साथी बहुत खर्राटे लेता है, क्या मेरा कमरा बदल सकता है?", [CHARGE]),
    ("मुझे दूसरे वार्ड में कब भेजा जाएगा?", [CHARGE]),
    ("क्या मुझे महिला नर्स मिल सकती है?", [CHARGE]),
    ("नर्स ने कहा था अभी आती हूँ, पर एक घंटा हो गया", [CHARGE]),
    ("क्या मेरा परिवार मिलने के समय के बाद आ सकता है?", [CHARGE]),
    ("मुझे नर्सों के इंचार्ज से अभी बात करनी है", [CHARGE]),
    ("Puis-je avoir une chambre individuelle ?", [CHARGE]),
    ("Quelle infirmière s'occupe de moi pendant ce service ?", [CHARGE]),
    ("Je n'ai vu aucune infirmière depuis la relève", [CHARGE]),
    ("Mon mari peut-il rester dormir avec moi ?", [CHARGE]),
    ("Mon voisin de chambre ronfle, puis-je changer de chambre ?", [CHARGE]),
    ("Quand serai-je transféré dans un autre service ?", [CHARGE]),
    ("Je préférerais une infirmière, est-ce possible ?", [CHARGE]),
    ("L'infirmière a dit qu'elle revenait tout de suite, ça fait presque une heure", [CHARGE]),
    ("Ma famille peut-elle venir après les heures de visite ?", [CHARGE]),
    ("Je veux parler à la personne qui encadre les infirmières ce soir", [CHARGE]),

    # RN only - medications, IVs, vitals, wound care
    ("My IV pump keeps beeping", [RN]),
    ("My IV site is swollen and sore", [RN]),
    ("Is it time for my evening medications?", [RN]),
    ("My bandage is soaked through, can someone change it?", [RN]),
    ("Can someone check my blood sugar?", [RN]),
    ("Mi suero se terminó y la máquina está sonando", [RN]),
    ("¿Me pueden cambiar el vendaje?", [RN]),
    ("मेरी ड्रिप की मशीन बार-बार बीप कर रही है", [RN]),
    ("क्या मेरी शाम की दवा का समय हो गया है?", [RN]),
    ("Ma perfusion est terminée et la machine sonne", [RN]),
    ("Pouvez-vous vérifier ma glycémie ?", [RN]),

    # Dietary + Charge Nurse - meals that never showed up
    ("I ordered breakfast two hours ago and it never came", [DIETARY, CHARGE]),
    ("My lunch still hasn't arrived and it's almost dinner time", [DIETARY, CHARGE]),
    ("I've been waiting forever for my meal tray", [DIETARY, CHARGE]),
    ("I called down for food an hour ago and nobody brought anything", [DIETARY, CHARGE]),
    ("Everyone else got dinner but I'm still waiting for mine", [DIETARY, CHARGE]),
    ("My food order seems to have been lost, it's been ages", [DIETARY, CHARGE]),
    ("I asked for a snack a long time ago and nobody came back", [DIETARY, CHARGE]),
    ("Pedí el desayuno hace dos horas y nunca llegó", [DIETARY, CHARGE]),
    ("Mi almuerzo todavía no ha llegado", [DIETARY, CHARGE]),
    ("Llevo una hora esperando mi bandeja de comida", [DIETARY, CHARGE]),
    ("मैंने दो घंटे पहले नाश्ता मंगवाया था, अब तक नहीं आया", [DIETARY, CHARGE]),
    ("मेरा दोपहर का खाना अभी तक नहीं आया", [DIETARY, CHARGE]),
    ("मैं बहुत देर से अपने खाने का इंतज़ार कर रहा हूँ", [DIETARY, CHARGE]),
    ("J'ai commandé mon petit-déjeuner il y a deux heures et rien n'est arrivé", [DIETARY, CHARGE]),
    ("Mon déjeuner n'est toujours pas arrivé", [DIETARY, CHARGE]),

    # EVS only - cleaning problems that keep getting ignored
    ("My room has been dirty for three days and I want to complain", [EVS]),
    ("I keep asking for the bathroom to be cleaned and it never happens", [EVS]),
    ("The trash hasn't been emptied since I got here, this is unacceptable", [EVS]),
    ("There's still a stain on the floor I reported yesterday, I want to talk to a manager", [EVS]),
    ("The bathroom smells terrible and nobody cares, I'm filing a complaint", [EVS]),
    ("Housekeeping skipped my room again today", [EVS]),
    ("I've reported the dirty floor twice and nothing has been done", [EVS]),
    ("Mi cuarto lleva tres días sucio y quiero quejarme", [EVS]),
    ("Siempre pido que limpien el baño y nunca lo hacen", [EVS]),
    ("No han sacado la basura desde que llegué, es inaceptable", [EVS]),
    ("मेरा कमरा तीन दिन से गंदा है, मैं शिकायत करना चाहता हूँ", [EVS]),
    ("मैं बार-बार बाथरूम साफ़ करने को कहता हूँ पर कोई नहीं करता", [EVS]),
    ("जब से मैं आया हूँ कूड़ा नहीं उठाया गया, यह ठीक नहीं है", [EVS]),
    ("Ma chambre est sale depuis trois jours, je veux me plaindre", [EVS]),
    ("Je demande sans cesse qu'on nettoie la salle de bain et rien n'est fait", [EVS]),

    # Dietary only - repeated meal problems (allergen exposure also needs the RN, see ROUTING_POLICY.md)
    ("They keep bringing me food I'm allergic to and I want to complain", [DIETARY, RN]),
    ("Every meal has been cold this week, I want to speak to someone about it", [DIETARY]),
    ("I've told them three times I'm diabetic and they still send desserts", [DIETARY]),
    ("The food here is awful and nobody listens when I complain", [DIETARY]),
    ("My meal orders are wrong every single day", [DIETARY]),
    ("I asked for halal meals and they keep sending pork, this is unacceptable", [DIETARY]),
    ("I want to report that my dietary restrictions keep being ignored", [DIETARY]),
    ("Siempre me traen comida a la que soy alérgico y quiero quejarme", [DIETARY, RN]),
    ("Toda la comida ha llegado fría esta semana, quiero hablar con alguien", [DIETARY]),
    ("Mis pedidos de comida vienen mal todos los días", [DIETARY]),
    ("मुझे बार-बार वही खाना भेजा जाता है जिससे मुझे एलर्जी है, मैं शिकायत करना चाहता हूँ", [DIETARY, RN]),
    ("मैंने कई बार कहा कि मैं शाकाहारी हूँ, फिर भी मांस भेजा जाता है", [DIETARY]),
    ("हर दिन मेरा खाने का ऑर्डर गलत आता है", [DIETARY]),
    ("On m'apporte toujours des plats auxquels je suis allergique, je veux me plaindre", [DIETARY, RN]),
    ("Mes repas sont froids tous les jours, je veux en parler à un responsable", [DIETARY]),

    # EVS only - cleaning, spills, restocking
    ("Can housekeeping come clean my room?", [EVS]),
    ("There's water all over the bathroom floor", [EVS]),
    ("The toilet is clogged", [EVS]),
    ("The sink is clogged and dirty", [EVS]),
    ("Someone tracked mud across my floor", [EVS]),
    ("There's broken glass on the floor", [EVS]),
    ("The trash smells really bad", [EVS]),
    ("My room hasn't been cleaned today", [EVS]),
    ("Can someone mop the floor? It's slippery", [EVS]),
    ("There's a puddle near the door", [EVS]),
    ("The shower is moldy", [EVS]),
    ("Coffee got spilled all over the chair", [EVS]),
    ("The window is filthy", [EVS]),
    ("There are crumbs and wrappers everywhere", [EVS]),
    ("The bathroom needs more toilet paper and paper towels", [EVS]),
    ("Can someone empty the trash bin?", [EVS]),
    ("There's something sticky on my bedside table", [EVS]),
    ("The floor by my bed is wet", [EVS]),
    ("The room smells like urine", [EVS]),
    ("There's dust everywhere in this room", [EVS]),
    ("Can you send someone to disinfect the bathroom?", [EVS]),
    ("There's hair all over the shower", [EVS]),
    ("I knocked over my juice and it's all over the floor", [EVS]),
    ("The hand sanitizer dispenser is empty", [EVS]),
    ("There's a bug in my room", [EVS]),
    ("¿Puede venir alguien a limpiar mi habitación?", [EVS]),
    ("Hay agua por todo el piso del baño", [EVS]),
    ("El inodoro está tapado", [EVS]),
    ("Hay vidrios rotos en el suelo", [EVS]),
    ("La basura huele muy mal", [EVS]),
    ("No han limpiado mi cuarto hoy", [EVS]),
    ("El piso está resbaloso, ¿pueden trapearlo?", [EVS]),
    ("La ducha tiene moho", [EVS]),
    ("Se derramó café en la silla", [EVS]),
    ("Se acabó el papel higiénico", [EVS]),
    ("La habitación huele a orina", [EVS]),
    ("Hay un insecto en mi cuarto", [EVS]),
    ("क्या कोई मेरा कमरा साफ़ करने आ सकता है?", [EVS]),
    ("बाथरूम के फ़र्श पर पानी भरा है", [EVS]),
    ("टॉयलेट जाम हो गया है", [EVS]),
    ("फ़र्श पर टूटा हुआ काँच पड़ा है", [EVS]),
    ("कूड़ेदान से बहुत बदबू आ रही है", [EVS]),
    ("आज मेरा कमरा साफ़ नहीं हुआ", [EVS]),
    ("फ़र्श फिसलन भरा है, कृपया पोछा लगा दीजिए", [EVS]),
    ("शॉवर में फफूंद लगी है", [EVS]),
    ("कुर्सी पर चाय गिर गई है", [EVS]),
    ("टॉयलेट पेपर खत्म हो गया है", [EVS]),
    ("कमरे में पेशाब की बदबू आ रही है", [EVS]),
    ("Quelqu'un peut venir nettoyer ma chambre ?", [EVS]),
    ("Il y a de l'eau partout sur le sol de la salle de bain", [EVS]),
    ("Les toilettes sont bouchées", [EVS]),
    ("Il y a du verre cassé par terre", [EVS]),
    ("La poubelle sent très mauvais", [EVS]),
    ("Ma chambre n'a pas été nettoyée aujourd'hui", [EVS]),
    ("Le sol est glissant, pouvez-vous passer la serpillière ?", [EVS]),
    ("Il y a de la moisissure dans la douche", [EVS]),
    ("Du café s'est renversé sur le fauteuil", [EVS]),
    ("Il n'y a plus de papier toilette", [EVS]),
    ("Il y a un insecte dans ma chambre", [EVS]),

    # EVS + Dietary - dropped or spilled food that needs replacing
    ("I dropped my dinner tray on the floor, can I get a new one?", [EVS, DIETARY]),
    ("My juice spilled all over the table and I'd like another", [EVS, DIETARY]),
    ("Can someone take away my old food trays and bring me a snack?", [EVS, DIETARY]),
    ("The soup spilled everywhere, can you clean it and send another bowl?", [EVS, DIETARY]),
    ("My breakfast fell off the table and the floor is a mess", [EVS, DIETARY]),
    ("I knocked my coffee over, I need a new cup and the floor cleaned", [EVS, DIETARY]),
    ("There's spilled milk on the floor and I still want my milk", [EVS, DIETARY]),
    ("Se me cayó la bandeja de la cena al piso, ¿me traen otra?", [EVS, DIETARY]),
    ("Se derramó mi jugo en la mesa y quisiera otro", [EVS, DIETARY]),
    ("La sopa se cayó por todas partes, ¿pueden limpiar y traer otra?", [EVS, DIETARY]),
    ("मेरी खाने की थाली फ़र्श पर गिर गई, क्या नई मिल सकती है?", [EVS, DIETARY]),
    ("मेरा जूस मेज़ पर गिर गया, मुझे दूसरा चाहिए", [EVS, DIETARY]),
    ("मेरा नाश्ता गिर गया और फ़र्श गंदा हो गया", [EVS, DIETARY]),
    ("J'ai fait tomber mon plateau-repas, puis-je en avoir un autre ?", [EVS, DIETARY]),
    ("Mon jus s'est renversé sur la table, j'en voudrais un autre", [EVS, DIETARY]),

    # RN + EVS - symptoms that also left a mess
    ("I threw up all over the floor and I still feel sick", [RN, EVS]),
    ("I vomited in the bathroom and I feel dizzy", [RN, EVS]),
    ("There's blood on the floor from my IV site and it's still bleeding", [RN, EVS]),
    ("I got sick on the floor and my stomach really hurts", [RN, EVS]),
    ("Vomité en el piso y todavía me siento mal", [RN, EVS]),
    ("Hay sangre en el suelo y mi herida sigue sangrando", [RN, EVS]),
    ("मैंने फ़र्श पर उल्टी कर दी और अब भी जी मिचला रहा है", [RN, EVS]),
    ("फ़र्श पर खून है और मेरा घाव अभी भी बह रहा है", [RN, EVS]),
    ("J'ai vomi par terre et j'ai encore la nausée", [RN, EVS]),
    ("Il y a du sang par terre et ma plaie saigne encore", [RN, EVS]),

    # Dietary only
    ("What's on the dinner menu tonight?", [DIETARY]),
    ("Can I order a sandwich?", [DIETARY]),
    ("Do you have gluten-free options?", [DIETARY]),
    ("I'd like to order my meals for tomorrow", [DIETARY]),
    ("Can I get a cup of coffee with breakfast?", [DIETARY]),
    ("Is there a low-sodium meal I can order?", [DIETARY]),
    ("Can I get some fruit?", [DIETARY]),
    ("I didn't like my lunch, can I order something else?", [DIETARY]),
    ("Can I have extra bread with my dinner?", [DIETARY]),
    ("What time does the kitchen stop taking orders?", [DIETARY]),
    ("¿Qué hay en el menú de la cena?", [DIETARY]),
    ("¿Puedo pedir un sándwich?", [DIETARY]),
    ("¿Tienen opciones sin gluten?", [DIETARY]),
    ("Quisiera un café con el desayuno", [DIETARY]),
    ("¿Me pueden traer fruta?", [DIETARY]),
    ("आज रात के खाने में क्या है?", [DIETARY]),
    ("क्या मैं एक सैंडविच मंगवा सकता हूँ?", [DIETARY]),
    ("क्या कम नमक वाला खाना मिल सकता है?", [DIETARY]),
    ("मुझे नाश्ते के साथ चाय चाहिए", [DIETARY]),
    ("क्या मुझे कुछ फल मिल सकते हैं?", [DIETARY]),
    ("Qu'y a-t-il au menu ce soir ?", [DIETARY]),
    ("Est-ce que je peux commander un sandwich ?", [DIETARY]),
    ("Avez-vous des plats sans gluten ?", [DIETARY]),
    ("Je voudrais un café avec mon petit-déjeuner", [DIETARY]),

    # Provider + Dietary - diet orders that need a provider
    ("Can the doctor clear me to eat? I'm starving", [PROVIDER, DIETARY]),
    ("I'm on a liquid diet, can I ask the doctor if I can have real food?", [PROVIDER, DIETARY]),
    ("When will the doctor let me eat solid food? I'd like to order lunch", [PROVIDER, DIETARY]),
    ("Can my doctor change my diet so I can order a regular meal?", [PROVIDER, DIETARY]),
    ("¿El médico puede autorizarme a comer? Tengo mucha hambre", [PROVIDER, DIETARY]),
    ("¿Cuándo me dejará el doctor comer comida sólida?", [PROVIDER, DIETARY]),
    ("क्या डॉक्टर मुझे खाना खाने की इजाज़त दे सकते हैं? मुझे बहुत भूख लगी है", [PROVIDER, DIETARY]),
    ("डॉक्टर मुझे ठोस खाना कब खाने देंगे?", [PROVIDER, DIETARY]),
    ("Le médecin peut-il m'autoriser à manger ? J'ai très faim", [PROVIDER, DIETARY]),
    ("Quand le médecin me laissera-t-il manger normalement ?", [PROVIDER, DIETARY]),

    # RN + Provider - worsening symptoms that need a provider
    ("My incision is leaking and I want the surgeon to see it", [RN, PROVIDER]),
    ("I've had a fever all night, can the doctor come?", [RN, PROVIDER]),
    ("My leg is swollen and painful, I want a doctor to check it", [RN, PROVIDER]),
    ("The new medicine is making me itchy and dizzy, can the doctor review it?", [RN, PROVIDER]),
    ("Tengo fiebre desde anoche, ¿puede venir el doctor?", [RN, PROVIDER]),
    ("Mi pierna está hinchada y me duele, quiero que me vea un médico", [RN, PROVIDER]),
    ("मुझे रात भर से बुखार है, क्या डॉक्टर आ सकते हैं?", [RN, PROVIDER]),
    ("मेरा पैर सूजा हुआ है और दर्द है, डॉक्टर को दिखाना है", [RN, PROVIDER]),
    ("J'ai de la fièvre depuis cette nuit, le médecin peut-il venir ?", [RN, PROVIDER]),
    ("Ma jambe est enflée et douloureuse, je veux voir un médecin", [RN, PROVIDER]),

    # Provider only - results, discharge, treatment questions
    ("When can I be discharged?", [PROVIDER]),
    ("I want to know when I can go home", [PROVIDER]),
    ("Can the doctor explain why I'm on this medication?", [PROVIDER]),
    ("Has the doctor reviewed my scan yet?", [PROVIDER]),
    ("I'd like a second opinion on my diagnosis", [PROVIDER]),
    ("Can I talk to the surgeon before my operation?", [PROVIDER]),
    ("What did my blood work show?", [PROVIDER]),
    ("Is the doctor going to round on me today?", [PROVIDER]),
    ("I want to discuss stopping one of my medications with the doctor", [PROVIDER]),
    ("Can the resident come back and answer a few questions?", [PROVIDER]),
    ("Who is my attending physician?", [PROVIDER]),
    ("I need the doctor to sign my discharge paperwork", [PROVIDER]),
    ("Can the PA explain the procedure to me again?", [PROVIDER]),
    ("I'd like to know the results of my biopsy", [PROVIDER]),
    ("My family wants to speak with the doctor about my prognosis", [PROVIDER]),
    ("Can the doctor call my daughter with an update?", [PROVIDER]),
    ("I have questions about the side effects of my treatment", [PROVIDER]),
    ("Will I need surgery? I want to ask the doctor", [PROVIDER]),
    ("Can the doctor refill my home prescription before I leave?", [PROVIDER]),
    ("I need a doctor's note for work", [PROVIDER]),
    ("How long does the doctor think I'll be in the hospital?", [PROVIDER]),
    ("Can the specialist come see me today?", [PROVIDER]),
    ("I want to go over my MRI results with the physician", [PROVIDER]),
    ("Can the hospitalist stop by this afternoon?", [PROVIDER]),
    ("I'm confused about my diagnosis and need the doctor to explain it", [PROVIDER]),
    ("Can I see the cardiologist?", [PROVIDER]),
    ("I'd like to talk about my pain management plan with the doctor", [PROVIDER]),
    ("Can the doctor tell me if I can shower with my stitches?", [PROVIDER]),
    ("¿Cuándo me pueden dar de alta?", [PROVIDER]),
    ("Quiero saber cuándo puedo irme a casa", [PROVIDER]),
    ("¿El médico ya revisó mi tomografía?", [PROVIDER]),
    ("Quisiera una segunda opinión sobre mi diagnóstico", [PROVIDER]),
    ("¿Puedo hablar con el cirujano antes de la operación?", [PROVIDER]),
    ("¿Qué salió en mis análisis de sangre?", [PROVIDER]),
    ("¿El doctor va a pasar a verme hoy?", [PROVIDER]),
    ("¿Quién es mi médico de cabecera aquí?", [PROVIDER]),
    ("Necesito que el doctor firme mi alta", [PROVIDER]),
    ("Quiero saber los resultados de mi biopsia", [PROVIDER]),
    ("Mi familia quiere hablar con el médico sobre mi pronóstico", [PROVIDER]),
    ("Tengo preguntas sobre los efectos secundarios del tratamiento", [PROVIDER]),
    ("Necesito una nota médica para el trabajo", [PROVIDER]),
    ("¿Puede venir el especialista hoy?", [PROVIDER]),
    ("मुझे अस्पताल से छुट्टी कब मिलेगी?", [PROVIDER]),
    ("मैं जानना चाहता हूँ कि मैं घर कब जा सकता हूँ", [PROVIDER]),
    ("क्या डॉक्टर ने मेरा स्कैन देख लिया है?", [PROVIDER]),
    ("मुझे अपनी बीमारी के बारे में दूसरी राय चाहिए", [PROVIDER]),
    ("क्या मैं ऑपरेशन से पहले सर्जन से बात कर सकता हूँ?", [PROVIDER]),
    ("मेरी खून की जाँच में क्या आया?", [PROVIDER]),
    ("क्या डॉक्टर आज मुझे देखने आएंगे?", [PROVIDER]),
    ("मेरे मुख्य डॉक्टर कौन हैं?", [PROVIDER]),
    ("मुझे डिस्चार्ज के कागज़ों पर डॉक्टर के हस्ताक्षर चाहिए", [PROVIDER]),
    ("मुझे अपनी बायोप्सी का नतीजा जानना है", [PROVIDER]),
    ("मेरा परिवार डॉक्टर से मेरी हालत के बारे में बात करना चाहता है", [PROVIDER]),
    ("मुझे इलाज के साइड इफ़ेक्ट्स के बारे में पूछना है", [PROVIDER]),
    ("क्या विशेषज्ञ डॉक्टर आज आ सकते हैं?", [PROVIDER]),
    ("Quand est-ce que je pourrai sortir de l'hôpital ?", [PROVIDER]),
    ("Je veux savoir quand je peux rentrer chez moi", [PROVIDER]),
    ("Le médecin a-t-il regardé mon scanner ?", [PROVIDER]),
    ("Je voudrais un deuxième avis sur mon diagnostic", [PROVIDER]),
    ("Puis-je parler au chirurgien avant l'opération ?", [PROVIDER]),
    ("Qu'ont montré mes analyses de sang ?", [PROVIDER]),
    ("Le médecin va-t-il passer me voir aujourd'hui ?", [PROVIDER]),
    ("Qui est mon médecin référent ?", [PROVIDER]),
    ("J'ai besoin que le médecin signe ma sortie", [PROVIDER]),
    ("Je voudrais connaître les résultats de ma biopsie", [PROVIDER]),
    ("Ma famille veut parler au médecin de mon pronostic", [PROVIDER]),
    ("J'ai des questions sur les effets secondaires de mon traitement", [PROVIDER]),
    ("Le spécialiste peut-il venir me voir aujourd'hui ?", [PROVIDER]),
]

# Gap-filling examples written per ROUTING_POLICY.md (independently phrased, not translations of each other)
policy_data = [
    # PCT only - room temperature, positioning, mobility
    ("Can you turn the heat up in here?", [PCT]),
    ("This room is way too cold for me", [PCT]),
    ("Could you help me sit up in bed?", [PCT]),
    ("Can someone help me move into the chair?", [PCT]),
    ("I'd like to walk the hallway but I need someone with me", [PCT]),
    ("Can I get new batteries for the TV remote?", [PCT]),
    ("¿Pueden subir la calefacción? Hace frío", [PCT]),
    ("¿Me ayudan a sentarme en la silla?", [PCT]),
    ("कमरे में बहुत ठंड है, हीटर चला दीजिए", [PCT]),
    ("मुझे बिस्तर से उठकर कुर्सी पर बैठना है", [PCT]),
    ("Il fait froid ici, pouvez-vous monter le chauffage ?", [PCT]),
    ("Pouvez-vous m'aider à m'asseoir dans le fauteuil ?", [PCT]),

    # RN only - dizziness without red flags
    ("I feel a little dizzy", [RN]),
    ("I get lightheaded every time I stand up", [RN]),
    ("Estoy un poco mareada", [RN]),
    ("मुझे हल्का चक्कर आ रहा है", [RN]),
    ("J'ai un peu la tête qui tourne", [RN]),

    # RN + Provider - red-flag symptoms
    ("There's a heavy pressure in my chest", [RN, PROVIDER]),
    ("I feel like I might pass out", [RN, PROVIDER]),
    ("I almost blacked out when I stood up", [RN, PROVIDER]),
    ("My heart is racing and it won't slow down", [RN, PROVIDER]),
    ("I'm short of breath even lying still", [RN, PROVIDER]),
    ("Siento una opresión fuerte en el pecho", [RN, PROVIDER]),
    ("Creo que me voy a desmayar", [RN, PROVIDER]),
    ("Me cuesta mucho respirar", [RN, PROVIDER]),
    ("मुझे लग रहा है कि मैं बेहोश हो जाऊँगा", [RN, PROVIDER]),
    ("सीने में बहुत भारीपन है", [RN, PROVIDER]),
    ("Je sens que je vais tomber dans les pommes", [RN, PROVIDER]),
    ("J'ai le cœur qui bat très vite", [RN, PROVIDER]),

    # Provider only - treatment, medication changes, plans after discharge
    ("Why did they switch my blood pressure medicine?", [PROVIDER]),
    ("What did the ultrasound show?", [PROVIDER]),
    ("Will I need physical therapy or rehab after I leave?", [PROVIDER]),
    ("I want to understand what my diagnosis actually means", [PROVIDER]),
    ("Is it safe for me to take my home medications here?", [PROVIDER]),
    ("I'd like to talk about whether I really need this surgery", [PROVIDER]),
    ("When will I find out if the infection is gone?", [PROVIDER]),
    ("¿Por qué me cambiaron la medicina de la presión?", [PROVIDER]),
    ("¿Voy a necesitar terapia física después del alta?", [PROVIDER]),
    ("मेरी दवा क्यों बदली गई, डॉक्टर से जानना है", [PROVIDER]),
    ("क्या मुझे घर जाने के बाद फिज़ियोथेरेपी की ज़रूरत होगी?", [PROVIDER]),
    ("Pourquoi a-t-on changé mon traitement pour la tension ?", [PROVIDER]),
    ("Est-ce que j'aurai besoin de rééducation après ma sortie ?", [PROVIDER]),
    ("Le médecin peut-il passer pour parler de mon opération ?", [PROVIDER]),

    # Charge Nurse only - responsiveness and staff conduct
    ("It's been forever since I pushed the call button", [CHARGE]),
    ("Is anyone actually working on this floor tonight?", [CHARGE]),
    ("I'm unhappy with the way a staff member spoke to me", [CHARGE]),
    ("Who do I talk to about a problem with my care here?", [CHARGE]),
    ("Staff keep forgetting what I ask for", [CHARGE]),
    ("No estoy contento con cómo me habló una enfermera", [CHARGE]),
    ("मेरी घंटी का जवाब देने में हमेशा बहुत देर लगती है", [CHARGE]),
    ("किसी स्टाफ ने मुझसे बदतमीज़ी से बात की, मुझे शिकायत करनी है", [CHARGE]),
    ("Je ne suis pas content de la façon dont on m'a parlé", [CHARGE]),

    # RN + Charge Nurse - overdue clinical needs
    ("Nobody came when my IV alarm went off", [RN, CHARGE]),
    ("I asked for my medicine ages ago and I'm still waiting", [RN, CHARGE]),
    ("Nadie vino cuando sonó la alarma de mi suero", [RN, CHARGE]),
    ("Personne n'est venu quand l'alarme de ma perfusion a sonné", [RN, CHARGE]),

    # RN only - medication timing (questions about *why* a medication changed go to Provider)
    ("When is my next dose due?", [RN]),
    ("Can I have my meds now?", [RN]),
    ("I think I missed my 2 o'clock pill", [RN]),
    ("Is it time for my insulin yet?", [RN]),
    ("Can I take my sleeping pill now?", [RN]),
    ("Did I already get my blood thinner today?", [RN]),
    ("¿A qué hora me toca la próxima dosis?", [RN]),
    ("¿Me pueden dar mis pastillas ahora?", [RN]),
    ("Creo que no me dieron la medicina de las dos", [RN]),
    ("मेरी अगली दवा कब मिलेगी?", [RN]),
    ("क्या अभी मुझे मेरी गोलियाँ मिल सकती हैं?", [RN]),
    ("À quelle heure est ma prochaine dose ?", [RN]),
    ("Est-ce que je peux prendre mes médicaments maintenant ?", [RN]),

    # PCT only - bedding, linens, pillows, gowns
    ("My bed is soaked, I need clean sheets", [PCT]),
    ("Can someone change my sheets?", [PCT]),
    ("Can I get an extra pillow?", [PCT]),
    ("My pillow is flat, can I have another one?", [PCT]),
    ("I had an accident in the bed", [PCT]),
    ("My blankets fell on the floor, can someone fix my bed?", [PCT]),
    ("I need a fresh gown", [PCT]),
    ("Mis sábanas están mojadas, ¿me las cambian?", [PCT]),
    ("¿Me pueden traer otra almohada?", [PCT]),
    ("Necesito una bata limpia", [PCT]),
    ("मेरी चादर गीली है, कृपया बदल दीजिए", [PCT]),
    ("क्या मुझे एक और तकिया मिल सकता है?", [PCT]),
    ("Mes draps sont mouillés, pouvez-vous les changer ?", [PCT]),
    ("Puis-je avoir un autre oreiller ?", [PCT]),
    ("J'ai besoin d'une blouse propre", [PCT]),

    # Compound requests involving bedding
    ("Can I get clean sheets and some breakfast?", [PCT, DIETARY]),
    ("Necesito otra almohada y algo para el dolor", [PCT, RN]),
    ("मेरी चादर गीली है और आधे घंटे से कोई नहीं आया", [PCT, CHARGE]),
    ("Je voudrais un oreiller et mon dîner, s'il vous plaît", [PCT, DIETARY]),
]

# Out of scope - labelled with no roles so the model learns to keep every probability low (-> Needs Review)
out_of_scope_data = [
    ("How do I get on the guest wifi?", []),
    ("Where can my family park?", []),
    ("Is there a gift shop downstairs?", []),
    ("What's the weather supposed to be tomorrow?", []),
    ("Who won the election?", []),
    ("Can you recommend a good movie?", []),
    ("What time is it in Tokyo?", []),
    ("Tell me a joke", []),
    ("How much does parking cost?", []),
    ("Where is the nearest ATM?", []),
    ("Can you order me an Uber?", []),
    ("Do you know a good lawyer?", []),
    ("My phone screen cracked", []),
    ("What's two plus two?", []),
    ("hello", []),
    ("ok thanks", []),
    ("qwerty", []),
    ("zzzz", []),
    ("¿Cuál es la contraseña del internet?", []),
    ("¿Dónde pueden estacionar mis hijos?", []),
    ("¿Hay una tienda de regalos?", []),
    ("¿Quién ganó el partido de fútbol?", []),
    ("Cuéntame un chiste", []),
    ("hola", []),
    ("¿Dónde hay un cajero automático?", []),
    ("वाईफाई का पासवर्ड क्या है?", []),
    ("पार्किंग कहाँ है?", []),
    ("कल मौसम कैसा रहेगा?", []),
    ("मुझे एक चुटकुला सुनाओ", []),
    ("नमस्ते", []),
    ("क्या यहाँ एटीएम है?", []),
    ("Quel est le code du wifi ?", []),
    ("Où est-ce que ma famille peut se garer ?", []),
    ("Il y a une boutique de cadeaux ?", []),
    ("Qui a gagné le match hier soir ?", []),
    ("Raconte-moi une blague", []),
    ("bonjour", []),
    ("Où se trouve le distributeur de billets ?", []),
]

# Encoder used only to find translations / close paraphrases so they land on the same side of the split
GROUPING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
GROUPING_THRESHOLD = 0.75       # link each request to its nearest same-label request at or above this
GROUPING_PAIR_THRESHOLD = 0.85  # also link every same-label pair at or above this (NN alone misses some translations)

def to_vector(names):
    return [int(name in names) for name in DEPARTMENTS]

def build_dataset():
    # One row per request, label is a multi-hot vector over DEPARTMENTS
    df = pd.DataFrame(data)
    df["label"] = df["label"].map(lambda intent: to_vector(intent_to_departments[intent]))
    extra_df = pd.DataFrame(multi_data + balance_data + policy_data + out_of_scope_data, columns=["text", "label"])
    extra_df["label"] = extra_df["label"].map(to_vector)
    df = pd.concat([df, extra_df], ignore_index=True)

    duplicates = df[df["text"].duplicated()]["text"].tolist()
    if duplicates:
        raise ValueError(f"Duplicate requests in dataset: {duplicates}")
    df["group"] = assign_groups(df)
    return df

def assign_groups(df):
    # Link each request to its most similar request with the same labels (if similar enough), plus every
    # very similar same-label pair; connected components become groups, so translations of one intent share an id.
    # Only same-label requests are linked: the cross-label near-matches are single vs compound requests
    # ("I want food" vs "I want food and a blanket"), which are different requests, not leakage.
    import numpy as np
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import connected_components
    from sentence_transformers import SentenceTransformer

    encoder = SentenceTransformer(GROUPING_MODEL)
    emb = encoder.encode(df["text"].tolist(), normalize_embeddings=True).astype(np.float64)
    sim = np.einsum("id,jd->ij", emb, emb)
    labels = df["label"].astype(str).values
    sim[labels[:, None] != labels[None, :]] = -1
    np.fill_diagonal(sim, -1)
    nearest, best = sim.argmax(axis=1), sim.max(axis=1)
    linked = np.where(best >= GROUPING_THRESHOLD)[0]
    pair_rows, pair_cols = np.where(sim >= GROUPING_PAIR_THRESHOLD)
    rows = np.concatenate([linked, pair_rows])
    cols = np.concatenate([nearest[linked], pair_cols])
    graph = coo_matrix((np.ones(len(rows)), (rows, cols)), shape=(len(df), len(df)))
    _, groups = connected_components(graph, directed=False)
    return groups

def label_counts(df):
    totals = [sum(column) for column in zip(*df["label"])]
    return dict(zip(DEPARTMENTS, totals))

def save_dataset(df, path=DATASET_PATH):
    # One 0/1 column per department so the CSV is readable without decoding vectors
    out = pd.DataFrame(df["label"].tolist(), columns=DEPARTMENTS)
    out.insert(0, "text", df["text"])
    out["group"] = df["group"]
    out.to_csv(path, index=False, encoding="utf-8")

def load_dataset(path=DATASET_PATH):
    if not Path(path).exists():
        raise FileNotFoundError(f"{path} not found - run `python dataset_creation.py` first.")
    csv = pd.read_csv(path, encoding="utf-8")
    if "group" not in csv:
        raise ValueError(f"{path} has no 'group' column - rerun `python dataset_creation.py`.")
    return pd.DataFrame({"text": csv["text"], "label": csv[DEPARTMENTS].values.tolist(), "group": csv["group"]})


if __name__ == "__main__":
    df = build_dataset()
    save_dataset(df)
    print(f"Saved {len(df)} requests ({df['group'].nunique()} paraphrase groups) to {DATASET_PATH}")
    for name, count in label_counts(df).items():
        print(f"{name:>25}: {count}")
