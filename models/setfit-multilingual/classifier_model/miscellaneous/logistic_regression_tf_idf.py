from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, f1_score
import pandas as pd
import joblib

data = {
    "text": [
        # Blanket - 0
        "I need a blanket",
        "Can I have another blanket?",
        "Necesito una manta",
        "मुझे एक कंबल चाहिए",
        "J'ai besoin d'une couverture",

        # Nausea - 1
        "I'm feeling nauseous",
        "I feel like throwing up",
        "Tengo náuseas",
        "मुझे उल्टी जैसा लग रहा है",
        "J'ai envie de vomir",

        # Food - 2
        "Can I get lunch?",
        "I would like some food",
        "Quiero algo de comer",
        "मुझे खाना चाहिए",
        "J'ai faim",

        # Bathroom - 3
        "I need to use the bathroom",
        "Can someone help me to the toilet?",
        "Necesito ir al baño",
        "मुझे बाथरूम जाना है",
        "Je dois aller aux toilettes",

        # TV Assistance - 4
        "My TV isn't working",
        "Can someone fix the television?",
        "Mi televisor no funciona",
        "मेरा टीवी काम नहीं कर रहा है",
        "Ma télévision ne fonctionne pas",

        # Pain - 5
        "I'm experiencing pain",
        "My stomach hurts badly",
        "Tengo mucho dolor",
        "मुझे बहुत दर्द हो रहा है",
        "J'ai très mal",

        # Water - 6
        "Can I have some water?",
        "Please bring me water",
        "Necesito agua",
        "मुझे पानी चाहिए",
        "J'ai besoin d'eau",

        # Ice Chips - 7
        "Can I get some ice chips?",
        "Please bring me crushed ice",
        "Necesito hielo picado",
        "मुझे बर्फ के छोटे टुकड़े चाहिए",
        "Je voudrais de la glace pilée",

        # General Discomfort - 8
        "I'm not feeling well",
        "Something doesn't feel right",
        "No me siento bien",
        "मेरी तबीयत ठीक नहीं है",
        "Je ne me sens pas bien",

        # Emergency - 9
        "I can't breathe",
        "I'm having severe chest pain",
        "No puedo respirar",
        "मुझे सांस लेने में परेशानी हो रही है",
        "Je n'arrive pas à respirer"
    ],

    "label": [
        *([0] * 5),
        *([1] * 5),
        *([2] * 5),
        *([3] * 5),
        *([4] * 5),
        *([5] * 5),
        *([6] * 5),
        *([7] * 5),
        *([8] * 5),
        *([9] * 5)
    ]
}

label_mapping = {
    0: "Med Tech",
    1: "Nurse",
    2: "Dietician"
}
intent_to_department = {
    0: 0,  
    1: 1,  
    2: 2,  
    3: 0,  
    4: 0,  
    5: 1, 
    6: 0,  
    7: 0, 
    8: 1,  
    9: 1   
}
df = pd.DataFrame(data)
df["label"] = df["label"].map(intent_to_department)
train_df, test_df = train_test_split(df, test_size=0.2, random_state=42, stratify=df['label'])
model = Pipeline([("tfidf", TfidfVectorizer(analyzer="char_wb",ngram_range=(2, 5),sublinear_tf=True)),("classifier", LogisticRegression(max_iter=1000,class_weight="balanced",random_state=42))])
model.fit(train_df["text"],train_df["label"])
preds = model.predict(test_df["text"])
true_labels = [label_mapping[int(label)] for label in test_df["label"]]
pred_labels = [label_mapping[int(label)]for label in preds]
print("Classification Report:")
print(classification_report(true_labels,pred_labels,labels=["Med Tech", "Nurse", "Dietician"],zero_division=0))
print(f"Accuracy: "f"{accuracy_score(true_labels, pred_labels):.4f}")
print(f"Macro F1: "f"{f1_score(true_labels, pred_labels, average='macro'):.4f}")
joblib.dump(model, "tfidf_logistic_regression_model.joblib")
print("Model saved to 'tfidf_logistic_regression_model.joblib'.")
test_requests = [
    "I need another blanket",
    "Necesito agua",
    "मुझे बाथरूम जाना है",
    "Je ne peux pas respirer",
    "I feel like vomiting"
]

predictions = model.predict(test_requests)
for text, label in zip(test_requests, predictions):
    print(f"Text: '{text}' -> "f"Predicted Label: '{label_mapping[int(label)]}'")


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
    "Quels plats végétariens proposez-vous ?"
]

expected_labels = ["Med Tech", "Med Tech", "Nurse", "Nurse", "Dietician"] * 4
challenge_preds = model.predict(challenge_requests)
challenge_pred_labels = [label_mapping[int(label)]for label in challenge_preds]
print(f"\nChallenge Results:")
print(classification_report(expected_labels,challenge_pred_labels,labels=["Med Tech", "Nurse", "Dietician"],zero_division=0))
for text, label in zip(challenge_requests, challenge_pred_labels):
    print(f"Challenge Request: '{text}' -> Predicted Label: '{label}'")