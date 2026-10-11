# Kalinga
## Live Demo [**Kalinga – Try the App**](https://kalinga-three.vercel.app)
Route a patient's hospital request to the right team, track the handoff, and notify the patient when staff acknowledge or complete it. Built for [Rutgers Health Hack 2026](https://ruhealthhack.com/), Ops Unleashed, Challenge 2: Inpatient Services.

## Run locally

Use Node.js 24 LTS (minimum 22.13).

```sh
npm ci
npm start
```

Open **http://127.0.0.1:8123**. Local demo password: **kaalinga-demo**. Data persists in `data/kaalinga.sqlite`. The existing `.env` is loaded automatically; keys stay on the server. Do not open `index.html` directly: accounts and tickets require the API.

For simultaneous demo sign-ins in ordinary tabs, run **`npm run test:users`** in another terminal. This starts six loopback listeners sharing the same database and API. Keep the different `.localhost` hostnames: cookies are shared across ports on the same hostname, while these host-only cookies stay separate.

| Local address | Select at sign-in |
| --- | --- |
| http://patient.localhost:8124 | Patient → Room 412-B |
| http://nurse.localhost:8125 | Registered nurse (RN) |
| http://dietary.localhost:8126 | Dietary / food services |
| http://patient2.localhost:8127 | Patient → Room 413-A |
| http://coordinator.localhost:8128 | Unit coordinator |
| http://bedside.localhost:8129 | Patient care technician (PCT) |

Use the same demo password. All eight patients and all staff roles remain available at every address; the labels are a suggested test setup. On Chromium browsers these `.localhost` names resolve to loopback without editing the hosts file. If your browser cannot resolve them, use separate browser profiles for http://127.0.0.1:8123 instead.

Try water from Room 412-B: Food Services should receive it, the nurse and Room 413-A should not, and acknowledgement should notify only Room 412-B. Logging out at one hostname should leave the other sign-ins intact. Stop the additional listeners with Ctrl+C in their terminal. This command uses existing demo accounts; it does not create new registrations.

The login starts with commonly used roles. Choose **Patient** and then a room, or choose a core care-team role directly. **Other hospital roles…** opens the additional grouped account selector. Demo setup notes are below the sign-in action.

All eight patients remain in the room picker. Light mode is the default; the header's light/dark switch saves your preference in this browser and remains available after sign-in.

Patients can opt into **Hey Kalinga**: say the wake phrase and request, hear the draft, then say **Send request** or **Cancel**. Capture runs while enabled on a visible page. Hands-free commands support English, Spanish, Hindi, and French and require configured spoken replies. This is a browser prototype.

AWS Bedrock classification and multilingual Transcribe input are available through server provider settings. ElevenLabs stays in place. Local defaults remain Groq/browser until an AWS runtime identity is configured. See [AWS setup](docs/aws-voice.md).

| Account | Access |
| --- | --- |
| patient@kaalinga.demo | Room 412B; own requests and notifications |
| patient2@kaalinga.demo | Room 413A; separate requests and notifications |
| patient3@kaalinga.demo | Room 414A; own requests and notifications |
| patient4@kaalinga.demo | Room 415B; own requests and notifications |
| patient5@kaalinga.demo | Room 416A; own requests and notifications |
| patient6@kaalinga.demo | Room 417B; own requests and notifications |
| patient7@kaalinga.demo | Room 418A; own requests and notifications |
| patient8@kaalinga.demo | Room 419B; own requests and notifications |
| nurse@kaalinga.demo | Nursing |
| bedside@kaalinga.demo | Bedside Care |
| housekeeping@kaalinga.demo | Environmental Services |
| dietary@kaalinga.demo | Food Services |
| facilities@kaalinga.demo | Facilities |
| clerk@kaalinga.demo | Unit Clerk |
| specialist@kaalinga.demo | Specialized Services |
| coordinator@kaalinga.demo | All departments, operational metrics, and staffing roster |

password: uepoZ5C90yOd2fNiXJT1v7Uk

The app also includes charge nurse, nurse manager, nursing assistant, hospitalist, resident, fellow, NP/PA, RT, observer, transport, rehabilitation, pharmacy, nutrition, social work, case management, wound care, advocacy, interpreter/ASL, chaplain, and infection-prevention accounts. [Full role review and account directory](docs/staff-roles.md).

These are demonstration identities, not patient registration or hospital identity integration. `DEMO_PASSWORD` sets their initial password; changing it does not rotate existing database passwords.

## What works

- Patient, department staff, and coordinator views, with access enforced by the API.
- A persisted demo staffing roster across 30 staff profiles and four role groups. Eligibility and shift availability control task alerts and acceptance; managers and observers have monitoring access.
- Targeted staff-arranged consultation queues. Routine clinical consultations require an on-shift RN or charge nurse. New P1 requests create parallel Nursing and Medical Team response tasks.
- Overdue Nursing requests and uncovered service queues notify available charge/manager accounts. Overdue evaluation runs on app polling.
- Database-backed requests, sessions, personal notifications, acknowledgement, completion, and audit events.
- Nurse-initiated WebRTC video or audio check-ins from acknowledged Nursing requests. Patients receive a spoken invitation and choose video, audio only, or decline. Mute, camera-off, and end controls release media without resolving the care request. [Video workflow and relay setup](docs/video-calls.md).
- Known clinical triggers route to nursing before a model call. An urgent button also bypasses AI. Unknown requests and uncertain or invalid model output go to nursing for review.
- Configurable Bedrock Nova 2 Lite or Groq classification (`AI_PROVIDER`); the verified local setup uses Bedrock in us-west-2. Groq defaults to `openai/gpt-oss-120b`. Known routine requests follow the challenge routing policy. Provider outages use labelled rules fallback.
- ElevenLabs automatically reads receipts and actual staff acknowledgement/completion updates with `eleven_multilingual_v2`. **Read requests and staff updates aloud** is on by default for microphone, typed, and quick-button requests. Text remains visible in a prominent Latest update card and request history. Updates play sequentially; polling does not repeat them or read old sign-in history. Patients can stop audio, turn speech off, or use **Read aloud**. Blocked autoplay offers **Play update**, preserving queued updates for manual retry. Speech errors never resubmit a request. Microphone transcription uses browser recognition by default, or the selected-language AWS Transcribe adapter when configured. Groq is an alternate inference provider; xAI Grok is not configured.
- Mixed requests create one linked task per requested team. For example, bathroom assistance + food/water + medication creates Bedside Care, Food Services, and Nursing tasks. Food and water share one task; support staff receive only their service details. The patient sees a single grouped request, receives one combined spoken receipt, and hears each team's actual acknowledgement/completion independently.
- The **Pain** button opens an optional 1–10 scale with location and new/worsening details. Nursing receives the reported score and a visible pain badge; the patient automatically hears the score in the receipt. Pain always stays with Nursing, emergency symptoms outrank the number, and support tasks exclude pain details.
- The classifier extracts explicit intents with original-language evidence, combines same-team needs, rejects refused/historical requests, and verifies department policy before dispatch. Staff can expand **What the patient needs** to inspect the intent and supporting patient words. See [pain and intent design](docs/pain-and-intents.md).
- Patient controls in English, Spanish, Hindi, and French, receipt templates in 12 languages, optional speech input with transcript review, and ElevenLabs receipt readback. Other selected languages retain English controls. Offline recognition covers selected phrases, not all speech in those languages.
- Durable in-app alerts update every two seconds while the app is open. Optional browser alerts need permission. Closed-browser push, SMS, and email are not implemented.
- Mobile patient and staff views, priority ordering, overdue review indicators, and an eight-request demo.

## Routing policy

| Request | Team | Priority |
| --- | --- | --- |
| Known emergency symptoms or urgent button | Nursing + parallel Medical Team task | P1 |
| Known clinical concern, fall, medication, or diet restriction | Nursing | P2 |
| Uncertain meaning or uncertain AI output | Nursing | P3 |
| Toileting, mobility, repositioning | Bedside Care | P3 |
| Cleaning, pillow, blanket, linen | Environmental Services | P4 |
| Water, drinks, meals | Food Services | P4; verify diet orders |
| Room temperature | Facilities | P4 |
| TV, remote, room amenities | Unit Clerk | P5 |
| Non-urgent interpreter, spiritual, rehab, discharge coordination | Specialized Services | P4 |

This is a routing demonstration, not clinical triage validation. Known symptoms bypass AI; unfamiliar wording can still be missed. The app is not connected to hospital paging or the physical call bell. Escalations create in-app alerts without claiming a hospital page was sent. Staff qualifications are demo policy, not RWJUH credential verification. Use synthetic requests for the hackathon.

## Hosting and verification

See `.env.example` and [the deployment guide](docs/deployment.md). Public hosting requires `DATABASE_URL` and `DEMO_PASSWORD`; it refuses ephemeral SQLite and the default local password. Schema and demo accounts initialize on first API use.

React and frontend assets are served locally without a live CDN dependency. `npm run build` copies only public app files into `public/`, excluding secrets and backend data.

```sh
npm test
npm run evaluate:intents
npm run build
npm run evaluate
# Optional live checks; consume provider usage:
npm run evaluate:intents -- --live
node scripts/check-providers.cjs
# Full classification regression:
node scripts/evaluate.cjs --live --model=openai/gpt-oss-120b --interval-ms=8000
```

Tests cover routing guards, account isolation, targeted alerts, mixed-task privacy, acknowledgement/completion, retry deduplication, origin checks, and restart persistence. Reports go to ignored `artifacts/`. The 38 routing examples are synthetic regressions, not real-world accuracy estimates. HTTP integration tests use SQLite; a hosted Postgres smoke test remains necessary.

Dashboards put open requests, urgency, task summaries and response actions first; non-clinical share and classification duration are expandable below the queue. Estimated nursing minutes use an editable assumption per non-clinical request, not measured labor savings. Model confidence is self-reported, not calibrated accuracy.

[Video calls](docs/video-calls.md) · [Architecture](docs/architecture.md) · [Judging demo](docs/demo.md) · [Deployment](docs/deployment.md)

The core routing categories, emergency escalation policy, staff alert screens, validation limits and accurate pitch wording are documented in [MVP routing and safety](docs/mvp-routing-safety.md).

Patient voice now supports gentle intent recaps, optional spoken pain ratings, explicit corrections/additions and short urgent guidance. See [patient voice behavior](docs/patient-voice.md) for supported languages, consent and validation limits.
