# MVP routing and responder alerts

The MVP validates the full path from a patient request to an actionable task, eligible staff alert, real acknowledgement, and patient update. It uses a pretrained Amazon Nova 2 Lite model through Bedrock, deterministic clinical rules, and server validation of the model's structured intents. No custom model training or fine-tuning has been performed.

## Action-oriented categories

| Category | First response | Examples / constraints |
| --- | --- | --- |
| Emergency clinical concern | Nursing **and a parallel Medical Team task** | Known emergency triggers or the urgent button; P1; bypass model inference. |
| Clinical concern / medication | Nursing | Pain, symptoms, medication questions and care restrictions; known triggers P2. Pain score alone does not establish an emergency. |
| Bedside assistance | Eligible PCT / nursing assistant | Toileting, repositioning, mobility; symptoms hold mobility with Nursing for assessment. |
| Meals / drinks | Dietary / food services | Food and water are distinct intents in one team task; diet/fluid orders must be checked. |
| Comfort / cleaning | EVS | Blankets, pillows, linen, spills and cleaning within the demo service policy. |
| Room environment | Facilities | Heating, cooling, room temperature. |
| Administrative / device help | Unit clerk | TV, remote, phone and other routine coordination. |
| Transport coordination | Patient transport | Authorized movement between hospital locations; not routine bathroom assistance. |
| Specialized support | Referral coordinator | Interpreter, spiritual support, discharge or rehabilitation coordination; staff arrange targeted consultations. |
| Uncertain / invalid / unsupported | Nursing review | Never silently dismiss the request or guess a service team. |

A request can create multiple team tasks. Tasks for the same department are combined, while each intent remains available for inspection. Service teams receive only their own task text and evidence, not the patient's clinical text or pain details.

## Emergency response policy in this prototype

For every **new P1 Nursing request**, the server creates both the Nursing task and a linked `clinical_escalation` Medical Team task. Both are saved with their staff notifications in the same transaction and with the same creation timestamp. Known emergency triggers do not wait for Bedrock, transcription, voice synthesis, or a pain score. The Medical Team escalation is server policy; model output cannot directly select a physician consultation department.

On-shift staff with the configured departmental competency receive alerts. This single-unit demo uses all eligible on-shift Medical Team accounts, including attending, resident, fellow and NP/PA demo roles; it does not claim a verified patient-to-physician assignment. If no eligible Medical Team responder is available, the medical task remains queued and available unit leadership receives a coverage alert. Staff returning to the shift receive notifications for waiting tasks. Existing requests are preserved; historical tickets are not retroactively given medical tasks.

Nursing and Medical Team must acknowledge and complete their own tasks. A physician acknowledgement does not mark Nursing as acknowledged. Retrying the same patient request produces no duplicate tasks or alerts; a manual Medical Team referral reuses an existing automatic emergency task. Patient text and voice describe the actual team's acknowledgement or completion, never an invented response or promised arrival. Emergency receipts in English, Spanish, Hindi and French also direct the patient to the bedside call bell for immediate help.

P1 tasks still unacknowledged after 30 seconds, and P2 Nursing tasks after 120 seconds, produce one overdue alert per task to available charge/manager accounts. These thresholds are **demo assumptions**, not a validated clinical response protocol. Overdue detection runs when dashboards poll.

## Staff screens

Each service screen shows room, actionable task, priority/status, waiting time, and Acknowledge / Mark complete. Clinical screens retain the original patient words and pain report. Model timing, source, confidence and routing checks are expandable details; performance metrics appear below the task queue. The Medical Team screen explicitly states that Nursing has a separate response task. Department scope and eligibility are enforced by the API, not only the UI.

## Validation and limits

`tests/emergency-response.test.cjs` covers emergency inference bypass, common stroke-sign wording, uncontrolled bleeding, overdose/self-harm wording, multilingual known triggers, urgent-button use, simultaneous retries, missing coverage, late coverage, clinical-data isolation, independent acknowledgements, truthful voice updates, and overdue escalation. These are synthetic software regressions. The 38-case primary-routing and 32-case intent benchmarks measure the guarded classifier, not clinical outcomes; the latter does not count the API's additional Medical Team escalation task.

“Immediate” means alerts are persisted during request creation, without a model wait for known triggers. Open dashboards poll every two seconds. Optional browser notifications are not guaranteed paging, and there is no closed-browser delivery worker or physical hospital call-bell integration. Unknown urgent paraphrases, recognition errors, unusual spellings, languages outside the tested phrases, and service-policy mismatches can still be missed. The app is not a substitute for the existing bedside call bell or a hospital rapid response system.

Before a hospital pilot, the unit's clinicians need to approve trigger definitions, clinical escalation recipients, staff scope, response thresholds and fallback delivery. AHRQ describes rapid response systems as coordinated mechanisms for recognition and clinical response, including staff and patient concerns: [AHRQ PSNet rapid response systems](https://psnet.ahrq.gov/curated-library/rapid-response-systems). The added conservative face/speech/one-sided weakness and blue-lip triggers are informed by [NHS stroke symptoms](https://www.nhs.uk/conditions/stroke/symptoms/) and [NHS cyanosis guidance](https://www.nhs.uk/symptoms/blue-skin-or-lips-cyanosis/); these references are not RWJUH protocol validation.

## Accurate pitch wording

“Kalinga extracts multiple actionable needs from patient requests, applies clinical safety rules before AI routing, and validates each intent before notifying eligible care teams. Known emergency requests create parallel Nursing and Medical Team alerts. Routine needs reach the appropriate support service with independent acknowledgement and accessible text and spoken updates. Our MVP is evaluated on synthetic routing and workflow cases; clinical policies and real-world performance require unit validation.”

Avoid claiming an “airtight” safety guarantee, a trained custom NLP model, measured nursing time saved, or integration with hospital paging equipment.
