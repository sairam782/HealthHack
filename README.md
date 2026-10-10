# Kaalinga

Route a patient's hospital request to the right team, track the handoff, and notify the patient when staff acknowledge or complete it. Built for [Rutgers Health Hack 2026](https://ruhealthhack.com/), Ops Unleashed, Challenge 2: Inpatient Services.

## Run locally

Use Node.js 24 LTS (minimum 22.13).

```sh
npm ci
npm start
```

Open **http://127.0.0.1:8123**. Local demo password: **kaalinga-demo**. Data persists in `data/kaalinga.sqlite`. The existing `.env` is loaded automatically; keys stay on the server. Do not open `index.html` directly: accounts and tickets require the API.

Use separate browser profiles or a private window for simultaneous accounts. Tabs in one profile share a sign-in session.

| Account | Access |
| --- | --- |
| patient@kaalinga.demo | Room 412B; own requests and notifications |
| patient2@kaalinga.demo | Room 413A; separate requests and notifications |
| nurse@kaalinga.demo | Nursing |
| bedside@kaalinga.demo | Bedside Care |
| housekeeping@kaalinga.demo | Environmental Services |
| dietary@kaalinga.demo | Food Services |
| facilities@kaalinga.demo | Facilities |
| clerk@kaalinga.demo | Unit Clerk |
| specialist@kaalinga.demo | Specialized Services |
| coordinator@kaalinga.demo | All departments and operational metrics |

These are demonstration identities, not patient registration or hospital identity integration. `DEMO_PASSWORD` sets their initial password; changing it does not rotate existing database passwords.

## What works

- Patient, department staff, and coordinator views, with access enforced by the API.
- Database-backed requests, sessions, personal notifications, acknowledgement, completion, and audit events.
- Known clinical triggers route to nursing before a model call. An urgent button also bypasses AI. Unknown requests and uncertain or invalid model output go to nursing for review.
- Groq classification, defaulting to `openai/gpt-oss-120b`. Known routine requests follow the challenge routing policy. Provider outages use labelled rules fallback.
- Mixed requests create a nursing ticket plus one separate service task. Support staff receive service text only.
- Patient controls in English, Spanish, Hindi, and French, receipt templates in 12 languages, optional speech input with transcript review, and ElevenLabs receipt readback. Other selected languages retain English controls. Offline recognition covers selected phrases, not all speech in those languages.
- Durable in-app alerts update every two seconds while the app is open. Optional browser alerts need permission. Closed-browser push, SMS, and email are not implemented.
- Mobile patient and staff views, priority ordering, overdue review indicators, and an eight-request demo.

## Routing policy

| Request | Team | Priority |
| --- | --- | --- |
| Known emergency symptoms or urgent button | Nursing | P1 |
| Known clinical concern, fall, medication, or diet restriction | Nursing | P2 |
| Uncertain meaning or uncertain AI output | Nursing | P3 |
| Toileting, mobility, repositioning | Bedside Care | P3 |
| Cleaning, pillow, blanket, linen | Environmental Services | P4 |
| Water, drinks, meals | Food Services | P4; verify diet orders |
| Room temperature | Facilities | P4 |
| TV, remote, room amenities | Unit Clerk | P5 |
| Non-urgent interpreter, spiritual, rehab, discharge coordination | Specialized Services | P4 |

This is a routing demonstration, not clinical triage validation. Known symptoms bypass AI; unfamiliar wording can still be missed. The app is not connected to hospital paging or the physical call bell. Overdue indicators prompt dashboard review without claiming a page was sent. Use synthetic requests for the hackathon.

## Hosting and verification

See `.env.example` and [the deployment guide](docs/deployment.md). Public hosting requires `DATABASE_URL` and `DEMO_PASSWORD`; it refuses ephemeral SQLite and the default local password. Schema and demo accounts initialize on first API use.

React and frontend assets are served locally without a live CDN dependency. `npm run build` copies only public app files into `public/`, excluding secrets and backend data.

```sh
npm test
npm run build
npm run evaluate
# Optional live provider regression; consumes provider usage:
node scripts/evaluate.cjs --live --model=openai/gpt-oss-120b --interval-ms=8000
```

Tests cover routing guards, account isolation, targeted alerts, mixed-task privacy, acknowledgement/completion, retry deduplication, origin checks, and restart persistence. Reports go to ignored `artifacts/`. The 38 routing examples are synthetic regressions, not real-world accuracy estimates. HTTP integration tests use SQLite; a hosted Postgres smoke test remains necessary.

Dashboard values include actual non-clinical share, classification duration, open urgent requests, and completion. Estimated nursing minutes use an editable assumption per non-clinical request, not measured labor savings. Model confidence is self-reported, not calibrated accuracy.

[Architecture](docs/architecture.md) · [Judging demo](docs/demo.md) · [Deployment](docs/deployment.md)
