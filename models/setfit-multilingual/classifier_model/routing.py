import re
import numpy as np
from classifier_model.dataset_creation import RN, PROVIDER, DEPARTMENTS

NEEDS_REVIEW = "Needs Review"  
THRESHOLD = 0.5

# Red flags from ROUTING_POLICY.md: always page RN + Provider, whatever the model says
RED_FLAG_PATTERNS = [re.compile(p, re.IGNORECASE) for p in [
    # English
    r"chest.{0,25}(pain|hurt|tight|pressure|heavy)|(pain|tight|pressure|heav\w*).{0,25}chest",
    r"can'?t breathe|cannot breathe|(trouble|hard|difficult\w*) breathing|short of breath|catch my breath",
    r"faint|pass(ing)? out|black(ed|ing)? out|(everything|vision|it)('s| is)? (going|went|turning) (black|dark)",
    r"heart (is )?(racing|pounding)|heart attack",
    r"bleeding (heavily|a lot|badly)|bleed\w*.{0,40}(won'?t|doesn'?t|can'?t|isn'?t) stop|won'?t stop bleeding|emergency",
    # Spanish
    r"pecho|no puedo respirar|me falta el aire|(cuesta( mucho)?|dificultad para) respirar|desmay|emergencia",
    r"sangr\w* mucho|sangr\w*.{0,30}no (para|se detiene)|(veo|se me pone|se me puso) todo negro|siento que me caigo",
    # French
    r"poitrine|(du mal|n'arrive pas|ne peux pas) à respirer|respire mal|évanou|tomber dans les pommes|urgence"
    r"|cœur qui bat (très )?vite|saigne beaucoup|saign\w*.{0,30}(ne s'arrête pas|n'arrête pas)|je vois (tout )?noir",
    # Hindi
    r"सीने|छाती|सांस|साँस|बेहोश|आपातकाल|खून बह|खून.{0,20}(रुक नहीं|बंद नहीं)|आँखों के सामने अंधेरा",
]]

def is_red_flag(text):
    return any(p.search(text) for p in RED_FLAG_PATTERNS)

def route_requests(model, texts, threshold=THRESHOLD, use_rules=True):
    texts = list(texts)
    probs = np.asarray(model.predict_proba(texts, as_numpy=True))
    results = []
    for text, row in zip(texts, probs):
        picked = [name for name, p in zip(model.labels, row) if p >= threshold]
        urgent = use_rules and is_red_flag(text)
        if urgent:
            picked = [d for d in DEPARTMENTS if d in picked or d in (RN, PROVIDER)]
        results.append({
            "departments": picked or [NEEDS_REVIEW],
            "urgent": urgent,
            "needs_review": not picked,
            "requires_acknowledgment": urgent or not picked,
        })
    return results
