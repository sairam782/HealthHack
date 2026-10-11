import re
from collections import defaultdict
from sklearn.metrics import classification_report, accuracy_score, f1_score
from classifier_model.dataset_creation import DEPARTMENTS, to_vector
from classifier_model.routing import route_requests

LANGUAGES = ["English", "Spanish", "Hindi", "French"]
ENGLISH_WORDS = {"the", "i", "my", "is", "a", "and", "to", "can", "you", "me", "it", "in", "of", "for", "what", "how",
                 "where", "who", "this", "someone", "somebody", "need", "at", "with", "her", "she", "he"}
SPANISH_WORDS = {"el", "la", "los", "las", "mi", "una", "un", "que", "qué", "está", "por", "tengo", "hay", "puede",
                 "pueden", "nadie", "quiero", "y", "de", "del", "con", "para", "muy", "algo", "es", "cuándo", "dónde",
                 "hola", "buenas", "noches", "gracias"}
FRENCH_WORDS = {"je", "j", "le", "la", "les", "est", "mon", "ma", "mes", "une", "pas", "il", "ça", "vous", "pouvez",
                "qui", "où", "du", "des", "au", "avec", "dans", "et", "de", "ne", "peut", "suis", "ai", "plus", "quand",
                "un", "voudrais", "sans", "bonjour", "merci", "beaucoup"}

def language_of(text):
    # Rough heuristic, good enough to break down eval results - not used for routing
    if re.search(r"[ऀ-ॿ]", text):
        return "Hindi"
    lower = text.lower()
    words = re.findall(r"[a-zà-ÿœ]+", lower)
    scores = {
        "English": sum(w in ENGLISH_WORDS for w in words),
        "Spanish": sum(w in SPANISH_WORDS for w in words) + 2 * bool(re.search(r"[ñ¿¡áíóú]", lower)),
        "French": sum(w in FRENCH_WORDS for w in words) + 2 * bool(re.search(r"[èêçœàâùûî]", lower)),
    }
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "English"

def evaluate(name, model, texts, expected, use_rules=True):
    # "Needs Review" becomes an all-zero vector, so it only counts as correct when nothing was expected
    texts, expected = list(texts), list(expected)
    routes = route_requests(model, texts, use_rules=use_rules)
    pred_vectors = [to_vector(r["departments"]) for r in routes]
    true_vectors = [to_vector(e) for e in expected]
    print(f"\n===== {name} ({len(texts)} requests) =====")
    print(classification_report(true_vectors, pred_vectors, target_names=DEPARTMENTS, zero_division=0))
    print(f"Exact-match Accuracy: {accuracy_score(true_vectors, pred_vectors):.4f}")
    print(f"Macro F1: {f1_score(true_vectors, pred_vectors, average='macro', zero_division=0):.4f}")
    print(f"Red-flag escalations: {sum(r['urgent'] for r in routes)}")
    print_abstention(texts, expected, routes)
    return routes

def print_abstention(texts, expected, routes):
    # False rejection: in-scope request sent to Needs Review. False acceptance: out-of-scope request routed to a role.
    stats = defaultdict(lambda: {"in": 0, "rejected": 0, "out": 0, "accepted": 0})
    for text, exp, route in zip(texts, expected, routes):
        for key in (language_of(text), "All"):
            s = stats[key]
            if exp:
                s["in"] += 1
                s["rejected"] += route["needs_review"]
            else:
                s["out"] += 1
                s["accepted"] += not route["needs_review"]
    print(f"{'':>8}  {'false rejection (in-scope -> review)':<40}{'false acceptance (out-of-scope -> role)'}")
    for key in LANGUAGES + ["All"]:
        if key not in stats:
            continue
        s = stats[key]
        rejection = f"{s['rejected']}/{s['in']}" if s["in"] else "-"
        acceptance = f"{s['accepted']}/{s['out']}" if s["out"] else "-"
        print(f"{key:>8}  {rejection:<40}{acceptance}")

def print_misses(texts, expected, routes):
    print("\nMisrouted:")
    for text, exp, route in zip(texts, expected, routes):
        if set(exp or []) != set(d for d in route["departments"] if d in DEPARTMENTS):
            flags = "".join(f"  ({f})" for f in ("urgent",) if route[f])
            print(f"  {text}\n    expected: {exp or ['Needs Review']}\n    got:      {route['departments']}{flags}")
