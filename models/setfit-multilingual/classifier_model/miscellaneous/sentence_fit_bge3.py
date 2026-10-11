from setfit import SetFitModel, Trainer, TrainingArguments
from datasets import Dataset
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, f1_score
import pandas as pd
import random
import numpy as np
import torch

random.seed(42)
np.random.seed(42)
torch.manual_seed(42)

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

        # Complaint / Unresolved Issue - 12
        "I want to file a complaint about my care",
        "This keeps happening every day and nobody fixes it",
        "Quiero presentar una queja",
        "मैं शिकायत दर्ज करना चाहता हूँ",
        "Je voudrais déposer une plainte",
        "I'd like to speak with the nurse manager",
        "There aren't enough staff on this floor",
        "I've reported this problem three times already",
        "The staff were rude to me and I want someone to know",
        "Siempre tardan horas en responder, esto es inaceptable",
        "Quiero hablar con la supervisora de enfermería",
        "मैं नर्सिंग सुपरवाइज़र से बात करना चाहता हूँ",
        "यह समस्या बार-बार हो रही है और कोई ठीक नहीं करता",
        "Je veux parler à la responsable des infirmières",
        "Ce problème revient tous les jours et rien ne change",

        # Doctor / Provider Request - 13
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
        "Le médecin peut-il m'expliquer mes résultats ?"
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
        *([13] * 15)
    ]
}

# Routing roles from the RWJUH med-surg unit staffing breakdown
RN = "Registered Nurse"
PCT = "Patient Care Technician"
CHARGE = "Charge Nurse"
MANAGER = "Nurse Manager"
PROVIDER = "Provider"  # hospitalist / attending, resident / fellow, NP / PA
EVS = "Environmental Services"
DIETARY = "Dietary"
DEPARTMENTS = [RN, PCT, CHARGE, MANAGER, PROVIDER, EVS, DIETARY]

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
    12: [MANAGER],         # Complaint / Unresolved Issue
    13: [PROVIDER],        # Doctor / Provider Request
}

def to_vector(names):
    return [int(name in names) for name in DEPARTMENTS]

def predict_departments(model, texts, threshold=0.5):
    # Every department above the threshold; fall back to the most likely one so a request is never unrouted
    probs = np.asarray(model.predict_proba(texts, as_numpy=True))
    results = []
    for row in probs:
        picked = [name for name, p in zip(DEPARTMENTS, row) if p >= threshold]
        results.append(picked or [DEPARTMENTS[int(row.argmax())]])
    return results

df = pd.DataFrame(data)
df["label"] = df["label"].map(lambda intent: to_vector(intent_to_departments[intent]))
multi_df = pd.DataFrame(multi_data, columns=["text", "label"])
multi_df["label"] = multi_df["label"].map(to_vector)
df = pd.concat([df, multi_df], ignore_index=True)
train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df["label"].astype(str))
train_dataset = Dataset.from_pandas(train_df.reset_index(drop=True))
test_dataset = Dataset.from_pandas(test_df.reset_index(drop=True))
model = SetFitModel.from_pretrained(
    "BAAI/bge-m3",
    labels=DEPARTMENTS,
    multi_target_strategy="one-vs-rest",
)
args = TrainingArguments( batch_size = 4, num_epochs = 2, num_iterations=10, seed=42)
trainer = Trainer(model=model, train_dataset=train_dataset, eval_dataset=test_dataset, args=args)
trainer.train()
preds = [to_vector(depts) for depts in predict_departments(model, test_dataset["text"])]
true_labels = test_dataset["label"]
print("Classification Report:")
print(classification_report(true_labels, preds, target_names=DEPARTMENTS, zero_division=0))
print(f"Exact-match Accuracy: {accuracy_score(true_labels, preds):.4f}")
print(f"Macro F1: {f1_score(true_labels, preds, average='macro', zero_division=0):.4f}")
model.save_pretrained("setfit_multilingual_bge3_model")
print("Model saved to 'setfit_multilingual_bge3_model' directory.")
test_requests = [ 
    "I need another blanket",
    "Necesito agua",
    "मुझे बाथरूम जाना है",
    "Je ne peux pas respirer",
    "I feel like vomiting",
    "I'm hungry and my head hurts",
    "Can I get dinner, a blanket, and something for the pain?"]

pred_labels = predict_departments(model, test_requests)
for text, label in zip(test_requests, pred_labels):
    print(f"Test Request: '{text}' -> Predicted Departments: {label}")


challenge_requests = [
    # English
    "It's freezing in this room",
    "Could somebody help me get out of bed?",
    "My chest feels unusually tight",
    "I feel like I'm going to faint",
    "Do you have any vegetarian meals?",

    # Spanish
    "¿Podrían traerme algo para beber?",
    "El control remoto dejó de funcionar",
    "Me siento muy mareado",
    "Tengo una presión extraña en el pecho",
    "¿Qué opciones hay para cenar?",

    # Hindi
    "मुझे बहुत ठंड लग रही है",
    "क्या कोई मुझे उठने में मदद कर सकता है?",
    "मेरा सिर बहुत घूम रहा है",
    "मेरे सीने में जकड़न महसूस हो रही है",
    "क्या शाकाहारी भोजन उपलब्ध है?",

    # French
    "J'ai vraiment froid dans cette chambre",
    "Pourriez-vous m'aider à me lever ?",
    "J'ai l'impression de m'évanouir",
    "Je ressens une pression dans ma poitrine",
    "Quels plats végétariens proposez-vous ?",

    # Multiple requests
    "I'm freezing and my chest feels tight",
    "¿Podrían traerme agua y algo para cenar?",
    "मुझे चक्कर आ रहे हैं और मुझे शाकाहारी खाना चाहिए",
    "La télécommande ne marche pas, j'ai faim et j'ai mal à la tête",

    # New roles
    "Somebody knocked over a cup and the floor is wet",
    "I rang for help almost an hour ago and I'm still waiting",
    "I want to speak to a supervisor about how I'm being treated",
    "¿El doctor puede venir a hablar sobre mis resultados?",
    "La salle de bain est sale et personne n'a répondu à mon appel",
]

expected_labels = [[PCT], [PCT], [RN, PROVIDER], [RN], [DIETARY]] * 4 + [
    [RN, PCT, PROVIDER],
    [PCT, DIETARY],
    [RN, DIETARY],
    [RN, PCT, DIETARY],
    [EVS],
    [CHARGE],
    [MANAGER],
    [PROVIDER],
    [CHARGE, EVS],
]
challenge_preds = predict_departments(model, challenge_requests)
expected_vectors = [to_vector(depts) for depts in expected_labels]
pred_vectors = [to_vector(depts) for depts in challenge_preds]
print(f"\nChallenge Results:")
print(classification_report(expected_vectors, pred_vectors, target_names=DEPARTMENTS, zero_division=0))
print(f"Exact-match Accuracy: {accuracy_score(expected_vectors, pred_vectors):.4f}")
print(f"Macro F1: {f1_score(expected_vectors, pred_vectors, average='macro', zero_division=0):.4f}")
for text, label in zip(challenge_requests, challenge_preds):
    print(f"Challenge Request: '{text}' -> Predicted Departments: {label}")

print("\nMisclassified Challenge Requests:")
for text, expected, predicted in zip(challenge_requests,expected_labels,challenge_preds):
    if set(expected) != set(predicted):
        print(f"Request: {text}")
        print(f"Expected: {expected}")
        print(f"Predicted: {predicted}")