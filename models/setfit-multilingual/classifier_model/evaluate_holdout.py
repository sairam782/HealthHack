from setfit import SetFitModel
from classifier_model.eval_sets import HOLDOUT_SET
from classifier_model.evaluation import evaluate, print_misses
from pathlib import Path

MODEL_DIR = Path(__file__).resolve().parent / "setfit_multilingual_model"
HF_MODEL_ID = "priyadp1/setfit-multilingual"
# Use the local copy if present, otherwise download from Hugging Face Hub
model = SetFitModel.from_pretrained(str(MODEL_DIR) if MODEL_DIR.exists() else HF_MODEL_ID)

texts, expected = zip(*HOLDOUT_SET)
evaluate("Holdout - model only", model, texts, expected, use_rules=False)
routes = evaluate("Holdout - model + red-flag rules", model, texts, expected)
print_misses(texts, expected, routes)
