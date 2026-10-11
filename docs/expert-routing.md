# Independent routing experts

Kalinga now supports a guarded ensemble: Amazon Nova 2 Lite on Bedrock is the primary structured intent extractor; GPT-OSS 120B on Groq supplies an independent structured second opinion. This is application-level expert selection and agreement checking, not a new mixture-of-experts model trained by our team. Each expert uses the existing exact-evidence, intent, department, uncertainty and clinical guards before its route is compared.

Set `AI_ROUTING_MODE=ensemble`, `AI_SECONDARY_PROVIDER=groq`, and `AI_SECONDARY_MODEL=openai/gpt-oss-120b`. Existing server-side Groq and AWS credentials are reused. Single mode remains the default when the environment flag is absent. The mode and configured expert IDs appear in `/api/config`; this describes configuration, not proof that a call occurred.

## Decisions

- Known emergencies, pain, medication concerns and clinical restrictions route immediately through safety rules, without waiting for either model. P1 Nursing and Medical Team escalation remains controlled by the server.
- Other requests call the two configured experts concurrently. Total expert wait is bounded; existing per-provider timeouts remain active.
- Agreement compares guarded department sets, intent kinds, and primary priority. It does not compare prose or average self-reported confidence. Agreement is not a clinical accuracy score.
- If a validated expert identifies a clinical concern, clinical routing takes precedence. Among conflicting clinical routes, the more urgent priority wins.
- Conflicting nonclinical routes require Nursing review. Clearly requested operational tasks from the primary route can remain separate; bedside mobility is held for Nursing assessment.
- If only one structured expert returns a valid route, the app uses that guarded route and records the other expert's failure. If neither validates, deterministic routing remains active. It never labels fallback or skipped calls as agreement.
- A Groq HTTP 429 is recorded explicitly and triggers a 60-second cooldown in that warm application instance. Other instances may have independent cooldowns; provider quotas still apply. See [Groq rate limits](https://console.groq.com/docs/rate-limits).

## Review records and privacy

Each primary ticket stores provider, model, status, latency, and proposed guarded departments in an additive `model_reviews` column. No credentials, original model response, or free-form hidden reasoning are stored in these records. A fallback can record a bounded failure code; a skipped rate-limited expert records `skipped_rate_limit`. RN/charge and unit-wide authorized viewers can inspect **Request and routing details → Model review**. Patients and nonclinical department staff do not receive the cross-team model records; linked service tickets do not copy them. Duplicate completed request keys return the stored ticket without new model calls.

## Teammate SetFit integration

The [team model](https://huggingface.co/priyadp1/setfit-multilingual) publishes a multilingual MiniLM body, a OneVsRest classification head, a 128-token sequence limit, and six responder labels. Its model card says `inference: false`; the Hub API returned an empty inference-provider mapping during our check. A repository link provides artifacts and metadata, not a working prediction endpoint.

Set `AI_SECONDARY_PROVIDER=setfit`, `SETFIT_ENDPOINT_URL`, and optionally the server-only `SETFIT_API_TOKEN` to replace the Groq reviewer with a hosted SetFit expert. The adapter expects the Hugging Face text-classification convention: a list (or one nested list) containing exactly six `{label, score}` entries. Unknown/duplicate labels, nonfinite scores, missing classes, malformed output, timeout and HTTP errors are rejected. A score of 0.5 is a provisional label threshold, not calibrated clinical confidence.

Label mapping: Registered Nurse, Charge Nurse and Provider flag Nursing review; Patient Care Technician maps to Bedside Care; Environmental Services and Dietary map to their existing service teams. SetFit does not assign physicians or infer urgency, pain ratings, evidence spans, or all requested intents. It is an advisory responder expert; the full extractor and rules retain those responsibilities. A clinical vote can escalate to Nursing but an operational vote cannot downgrade a clinical or uncertain request. The six labels also do not cover all of our service departments. Its sequence limit and real language performance require endpoint-level testing.

A teammate-owned endpoint can adapt `SetFitModel.predict_proba(text)` to the six-entry response. Load the team's verified artifacts in that service, preserve label order from `config_setfit.json`, validate input length, and test English/Spanish/Hindi/French plus multi-intent requests before enabling it. Model training hyperparameters and lower training loss alone do not establish held-out accuracy. [SetFit inference reference](https://huggingface.co/docs/setfit/reference/main).

## What we can say in the demo

“We ran real Bedrock and Groq inference calls, validate each expert's route, and keep urgent dispatch independent of model latency. Our team trained a separate SetFit responder model; we inspected it through the Hugging Face Hub API and prepared an inference adapter. SetFit prediction inference is not connected yet.”

Do not say we called SetFit inference until a hosted prediction request actually succeeds. Hub metadata requests are recorded separately from model inference.

## Validation

`node scripts/check-experts.cjs` sends only synthetic benchmark text and creates no care tickets. The initial live run passed 32/32 expected application routes with zero emergency downgrades; both experts validated 7 of the 16 cases that reached the model layer. Bedrock validated 15; Groq validated 7, with provider limits affecting subsequent calls. This is not evidence of improvement over the previous primary classifier. A separate browser smoke test subsequently recorded both real experts validating a drink/TV paraphrase, with agreement and private persisted review records. Reports are in ignored `artifacts/`.

235 automated tests pass. Eleven added expert-routing checks cover concurrency, safety bypass, clinical precedence, conservative disagreement, fallback, timeout, SetFit response validation, privacy/persistence, duplicate retries and rate-limit cooldown. SetFit inference and physical patient use remain unverified.
