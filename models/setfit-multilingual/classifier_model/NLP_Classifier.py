from setfit import SetFitModel, Trainer, TrainingArguments
from datasets import Dataset
from sklearn.model_selection import StratifiedGroupKFold
from classifier_model.dataset_creation import DEPARTMENTS, load_dataset
from classifier_model.eval_sets import DEV_SET, DEV_SET_2, HOLDOUT_SET
from classifier_model.evaluation import evaluate, print_misses
import random
import numpy as np
import torch

random.seed(42)
np.random.seed(42)
torch.manual_seed(42)

MODEL_DIR = "setfit_multilingual_model"
df = load_dataset()
splitter = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)
train_idx, test_idx = next(splitter.split(df, df["label"].astype(str), groups=df["group"]))
train_df, test_df = df.iloc[train_idx], df.iloc[test_idx]
assert not set(train_df["group"]) & set(test_df["group"])
print(f"Train: {len(train_df)} requests / {train_df['group'].nunique()} groups, "
      f"test: {len(test_df)} requests / {test_df['group'].nunique()} groups")

eval_texts = {t for t, _ in DEV_SET + DEV_SET_2 + HOLDOUT_SET}
overlap = eval_texts & set(df["text"])
assert not overlap, f"Eval requests also in training data: {overlap}"

train_dataset = Dataset.from_pandas(train_df[["text", "label"]].reset_index(drop=True))
test_dataset = Dataset.from_pandas(test_df[["text", "label"]].reset_index(drop=True))
model = SetFitModel.from_pretrained(
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    labels=DEPARTMENTS,
    multi_target_strategy="one-vs-rest",
)
args = TrainingArguments( batch_size = 4, num_epochs = 2, num_iterations=10, seed=42)
trainer = Trainer(model=model, train_dataset=train_dataset, eval_dataset=test_dataset, args=args)
trainer.train()
model.save_pretrained(MODEL_DIR)
print(f"Model saved to '{MODEL_DIR}' directory.")

test_texts = test_dataset["text"]
test_expected = [[d for d, v in zip(DEPARTMENTS, vec) if v] for vec in test_dataset["label"]]
evaluate("Grouped test split", model, test_texts, test_expected)

for name, eval_set in [("Dev set", DEV_SET), ("Dev set 2 (old holdout)", DEV_SET_2)]:
    texts, expected = zip(*eval_set)
    routes = evaluate(name, model, texts, expected)
    print_misses(texts, expected, routes)

