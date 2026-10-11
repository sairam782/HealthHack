# Fine-tuned multilingual responder model

This branch adds our teammate’s SetFit training and evaluation work alongside Kalinga. It preserves the source files from [priyadp1/RutgersHealthHack2026](https://github.com/priyadp1/RutgersHealthHack2026), revision `896190f899a01b5a90589c13620127bad706a337`, authored by **Prisha Priyadarshini** under the [MIT license](LICENSE). Exact imported file checksums are in [SOURCE.json](SOURCE.json); the original project notes are in [UPSTREAM_README.md](UPSTREAM_README.md).

## What is included

- `classifier_model/NLP_Classifier.py`: fine-tunes `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` using SetFit and a one-vs-rest multi-label head. The script uses grouped train/test splitting and checks that evaluation text is absent from training data.
- `dataset_creation.py` and `dataset.csv`: training examples and label definitions.
- `eval_sets.py`, `evaluation.py`, `evaluate_holdout.py`: development/holdout examples and evaluation tooling.
- `predict.py` and `routing.py`: local/Hugging Face model loading, responder suggestions, and red-flag routing rules.
- `ROUTING_POLICY.md`: the source model’s responder policy.
- `miscellaneous/`: the source repository’s alternative TF-IDF/logistic regression and BGE experiments.

The six responder labels are Registered Nurse, Provider, Charge Nurse, Patient Care Technician, Environmental Services, and Dietary. The published model is [priyadp1/setfit-multilingual](https://huggingface.co/priyadp1/setfit-multilingual). Model weights are not included in this Git branch.

## Run the teammate model separately

Use an isolated Python environment, from this directory:

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m classifier_model.predict
python -m classifier_model.evaluate_holdout
```

Prediction and holdout evaluation download the Hugging Face model if a local model is absent. The upstream requirements are preserved and are not version-pinned; inference/training have not been run as part of this source import.

To train a fresh model:

```sh
python -m classifier_model.NLP_Classifier
mv setfit_multilingual_model classifier_model/setfit_multilingual_model
python -m classifier_model.evaluate_holdout
```

The move aligns the training script’s working-directory output with the predictor/evaluator’s expected local path. Only do it when the destination does not already contain a model you need. Training and evaluation results must be measured before claiming accuracy or improvement.

## Relationship to the deployed Kalinga app

Importing this source does **not** enable SetFit prediction in the deployed app. Kalinga currently uses Bedrock Nova 2 Lite plus a Groq GPT-OSS 120B reviewer, with server safety rules. Its optional SetFit HTTP adapter is documented in [expert routing](../../docs/expert-routing.md).

The upstream predictor returns a routed summary; Kalinga’s SetFit adapter expects six raw `{label, score}` probability entries. A hosted wrapper must expose the adapter’s response contract before enabling `AI_SECONDARY_PROVIDER=setfit` and configuring `SETFIT_ENDPOINT_URL`. No working inference endpoint is added by this branch.

The source model also routes water and blankets to Patient Care Technician, whereas Kalinga currently routes water to Food Services and blankets to Environmental Services. Validate the policy mapping with the intended unit before enabling this reviewer. Keep Kalinga’s urgent dispatch and clinical escalation independent of model output.

The source model’s clinical heuristics and multilingual coverage are research/prototype code, not a validated clinical safety system. This branch preserves provenance and allows separate evaluation; it makes no new clinical accuracy claim.
