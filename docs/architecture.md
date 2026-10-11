# Architecture

```mermaid
flowchart LR
  Patient[Patient account] --> API[Authenticated Node API]
  API --> Rules[Known clinical rules]
  Rules -->|Known clinical concern| Nurse[Nursing ticket]
  Nurse -->|P1 server policy| Medical[Linked Medical Team task]
  Medical --> DB
  Rules -->|Other request| Model[Groq or Bedrock structured classification]
  Model --> Guard[Schema and routing guards]
  Guard -->|Uncertain or invalid| Nurse
  Guard -->|Service request| Service[Department ticket]
  API --> DB[(Postgres on hosting / SQLite locally)]
  Nurse --> DB
  Service --> DB
  DB --> Staff[Scoped staff dashboards]
  Staff -->|Acknowledge / complete| API
  DB --> Alerts[Per-user notifications]
  Alerts --> Patient
```

`server.cjs` hosts the local app and `api/index.js` adapts it to Vercel. Both use `lib/handler.cjs`; classification and synthesis use server credentials, while optional Transcribe streams browser audio through an authenticated, short-lived signed WebSocket session. `routing.js` contains clinical precedence, model intent/evidence validation, canonical department policy, and receipt templates; `pain.js` provides patient-reported score parsing and localized pain controls. Additive migrations retain pain details, intents, and routing checks without replacing old tickets. `lib/auth.cjs` handles hashed passwords, hashed session tokens, and permissions. `lib/store.cjs` provides SQLite/Postgres operations and transactions.

Identity and room come from the server session. Patients read only their tickets. Staff read their department; charge nurse, manager, and coordinator have unit oversight. Acceptance requires a matching configured competency and on-shift status. Managers and observers monitor rather than accept. Sessions last eight hours with HttpOnly, SameSite=Lax cookies and Secure cookies on hosting. Origin checks protect browser mutations and login throttling limits failed attempts. These controls support synthetic demos; they do not establish hospital compliance or enterprise identity readiness.

Known clinical triggers, patient-reported pain, and the urgent button bypass AI. Every pain score stays with Nursing; emergency symptoms in the transcript or pain-location field outrank the number. Pain is optional to score, and the first spoken receipt includes a supplied score. Provider calls time out after six seconds. Outages use labelled rules fallback for clear routine requests and nursing for unclear input. Invalid or low-confidence model output goes to nursing. Server-derived tier/responder and fixed receipts prevent invented assignees and arrival promises. Confidence is model self-report.

An input creates a primary ticket and one linked task for each other requested department, with up to seven additional service tasks. Same-team needs share a task, such as food and water. Original clinical text stays on the nursing ticket; each support task contains only its service summary. Medication-only clinical requests may also dispatch toileting assistance; accompanying symptoms, falls, or mobility restrictions keep mobility assistance with nursing for assessment. Dietary tasks require verification of diet orders. The model's bounded `intents` array is checked against literal evidence, refusal/history context, clinical safety, and department policy. The server derives and deduplicates `additional_requests` from those intents; the legacy `secondary_request` field remains an alias for the first additional task. Creation and every linked task occur in one transaction, with patient-scoped retry identifiers preventing duplicate dispatch.

Patients see one grouped request with separate team statuses, ordered with open and higher-priority service tasks first. The initial text and spoken receipt name all dispatched teams. Acknowledgement and completion updates name only the team whose task actually changed; completing a dietary task leaves nursing and bedside assistance open. Staff may arrange additional linked consultation tasks with focused notes. Clinical consultation targets require an on-shift RN or charge nurse; nonclinical referral coordination is separate. Creation, referrals, escalations, and lifecycle updates store audit events. Per-service referral identifiers prevent duplicate referrals.

Status moves from NEW to ACKNOWLEDGED to RESOLVED through authorized staff actions. Durable notifications address eligible on-shift staff, unit coordination, and the originating patient. Uncovered queues notify available charge/manager accounts. Overdue Nursing requests generate one escalation when polling evaluates their age. Two-second polling works across Vercel instances without an in-memory event bus. Closed-browser push and hospital paging are not implemented.

Metrics derive from visible records. Non-clinical share measures requests/tasks, not proven avoided interruptions. Nursing minutes are an editable scenario estimate. Only primary tickets contribute to classifier duration, so generated service tasks do not lower its average.

Voice input uses browser SpeechRecognition or the AWS Transcribe adapter with the selected BCP-47 language. The patient reviews the transcript before submitting. Automatic ElevenLabs speech is enabled by default for typed, quick-button, and microphone requests, and later real staff acknowledgement/completion transitions. The public ticket's `status_message` is also displayed in the Latest update card and history. A per-account transition tracker prevents polling duplicates and suppresses historical updates at sign-in. The player queues stages rather than interrupting a previous sentence, and preserves pending updates after blocked autoplay for a user-initiated retry. Speech pauses during active microphone recognition. Starting the microphone, changing language, signing out, or changing accounts stops existing audio; Stop audio and disabling speech also cancel queued playback. Failure never resubmits a ticket. The player ignores events from cancelled/older streams.

The voice endpoint accepts a fixed `stage` (`NEW`, `ACKNOWLEDGED`, or `RESOLVED`). It verifies ticket visibility and requires the corresponding stored staff timestamp before speaking acknowledgement or completion. Fixed server templates determine the text; callers cannot submit arbitrary speech or fabricate a staff action. Explicit stages preserve the message for an earlier queued event even if the ticket advances before playback.

Main patient controls and voice controls have English, Spanish, Hindi, and French copy. Server-controlled clinical/service receipts and acknowledgement/completion templates cover 12 languages. The four primary languages name the core routed team; the other eight use a generic localized care-team label in lifecycle updates. Broader UI and referral notifications still include English. Updates follow each ticket's detected language, even if the language picker later changes. The selected Groq/Bedrock provider receives the original transcript and selected language and is asked for an English staff summary. Known multilingual symptom rules bypass the model, but the phrase list and language detection are not exhaustive. Unsupported, unclear, invalid, or low-confidence routing falls back to Nursing. Browser transcription language support and the pronunciation of every receipt have not been comprehensively evaluated.


Nurse check-ins use `lib/video-calls.cjs` for authenticated invitations, consent, temporary session descriptions/ICE candidates, expiry, and audit records. Only an eligible RN or charge nurse can invite a patient from an acknowledged open primary Nursing request. Call access is restricted to that nurse and patient; coordinator oversight does not confer access to media setup. A pending invitation expires after 90 seconds; accepted calls expire after 15 minutes. Ending, declining, failing, or expiring a call clears signaling data and leaves the care request unchanged.

`video-call.js` starts device capture only after a person chooses video or audio. Nurse preview remains local until patient acceptance. The nurse creates the WebRTC offer and the patient answers; participants exchange signals through one-second authenticated HTTP polling. Native peer connection state determines the Connected display. Local and remote tracks and the peer connection are released on end, failure, component disposal, or account change. Patient speech input/readback stops when joining, avoiding competing microphone/audio use. New pending invitations use fixed localized ElevenLabs speech, subject to the existing voice preference and autoplay handling.

Media is transported by WebRTC rather than through the Vercel function; no media recording is implemented. Local same-machine demos can connect without a relay. Public mode requires a TURN relay, forces relay transport, and supplies short-lived coturn REST credentials only to call participants. The shared relay secret remains on the server. Invitation/control copy supports English, Spanish, Hindi, and French with English fallback; conversations have no automatic translation or interpreter participation. See [video setup](video-calls.md).

Hey Kalinga uses an opt-in final-transcript listener with spoken draft review and a separate send command. Recognition pauses during prompts, page hiding, or competing tasks. See [AWS and hands-free details](aws-voice.md).

New P1 requests create a `clinical_escalation` Medical Team child in the primary transaction, with separate acknowledgement and role-scoped alerts. Clinical escalation children participate in patient task grouping and overdue checks alongside Nursing. The classifier itself retains Nursing as the emergency primary. See [MVP routing and safety](mvp-routing-safety.md).
