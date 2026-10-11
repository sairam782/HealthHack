from pathlib import Path
from setfit import SetFitModel
from classifier_model.routing import route_requests

MODEL_PATH = Path(__file__).resolve().parent / "setfit_multilingual_model"
HF_MODEL_ID = "priyadp1/setfit-multilingual"
# Use the local copy if present, otherwise download from Hugging Face Hub
model = SetFitModel.from_pretrained(str(MODEL_PATH) if MODEL_PATH.exists() else HF_MODEL_ID)

def predict_department(request: str) -> dict:
    # {"departments": [...] or ["Needs Review"], "urgent": bool, "needs_review": bool, "requires_acknowledgment": bool}
    if not isinstance(request, str) or not request.strip():
        raise ValueError("Patient request must be a non-empty string.")
    return route_requests(model, [request.strip()])[0]


def main():
    requests = [
        "My room is cold and the bathroom floor is sticky.",
        "The television remote isn't changing channels.",
        "My surgical incision is throbbing and I feel dizzy.",
        "My chest feels heavy and I'm sweating",
        "What's the wifi password?",
    ]

    for request in requests:
        print(f"{request} -> {predict_department(request)}")

if __name__ == "__main__":
    main()
