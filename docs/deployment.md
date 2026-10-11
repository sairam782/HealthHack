# Deploy Kalinga

## Vercel with managed Postgres

The hosted hackathon demo is live at **https://kalinga-three.vercel.app**, in the `abhi-1a06/kalinga` project. It uses a dedicated free Neon Postgres resource, `kalinga-postgres`, in `iad1`, and Node.js 24. Production AI and voice secrets are configured only on the server. The private initial demo password is stored locally in the ignored `.vercel/demo-access.md` file.

Hosted smoke checks verified 38 seeded accounts, independent patient/staff sessions, secure cookies, live Bedrock classification, real ElevenLabs output, staff alerts, cross-account permissions, retry deduplication, multi-team routing, parallel urgent Nursing/Medical Team escalation, and an 8/10 pain report. Synthetic smoke requests were acknowledged and completed by their respective test staff accounts. The nonsecret report is `artifacts/vercel-smoke.json`.

The current voice input provider is browser speech recognition. Video is disabled on the hosted app until TURN is configured. The short-term Bedrock key must be renewed before expiration; provider failures retain the app's labelled rules fallback. Local SQLite history is separate from the new managed database.

To reproduce the deployment in another project:

1. Import the repository into Vercel. If importing the parent repository, set Root Directory to `hhcode`. Select Framework Preset **Other**, Node.js **24.x**, Build Command `npm run build`, and Output Directory `public`. The included `vercel.json` defines the API rewrite and function duration.
2. In Vercel's Storage/Marketplace flow, create a managed Postgres integration, such as Neon, and connect it to the project. Use a dedicated hackathon database, preferably near the function region. Obtain its **pooled Postgres connection URL**, preserving provider TLS parameters.
3. Set these server variables in Production and, if needed, Preview:

   | Variable | Value |
   | --- | --- |
   | DATABASE_URL | Managed database pooled connection URL; map the integration's supplied URL to this name if necessary |
   | DEMO_PASSWORD | A private initial demo password of at least 10 characters, preferably 16 or more |
   | AI_PROVIDER | `bedrock` for the current deployment |
   | AWS_REGION | `us-west-2`, matching the current bearer key's region |
   | BEDROCK_MODEL_ID | `us.amazon.nova-2-lite-v1:0` |
   | AWS_BEARER_TOKEN_BEDROCK | Short-term Bedrock API key; refresh before expiry |
   | VOICE_INPUT_PROVIDER | `browser` until a separate Transcribe identity is configured |
   | GROQ_API_KEY | Existing Groq key |
   | GROQ_MODEL | `openai/gpt-oss-120b` |
   | ELEVENLABS_API_KEY | Existing ElevenLabs key; optional for audio |
   | ELEVENLABS_VOICE_ID | Optional override; default `21m00Tcm4TlvDq8ikWAM` |
   | WEBRTC_TURN_URLS | Comma-separated TURN/TURNS URLs; required to enable hosted video |
   | WEBRTC_TURN_SHARED_SECRET | Server-only coturn REST shared secret |

   Enter credentials through hosting environment settings, never frontend prefixes. Do not upload `.env` or paste secrets into issue/PR descriptions. If an integration exports `POSTGRES_URL`, explicitly map its pooled value to `DATABASE_URL`.
4. Deploy. The first API call initializes tables, indexes, and 38 demo accounts (30 staff profiles and eight patients). All seeded accounts initially use `DEMO_PASSWORD`. Existing account passwords and staffing availability are preserved on reseeding.
5. Complete the smoke test below before sharing the judging URL. Missing database/password configuration produces an error instead of silently using local storage.

Changing `DEMO_PASSWORD` does not reset existing hashes. This demo has no password-management flow. Use a fresh dedicated database for a separate demonstration or implement account management before adopting it outside the hackathon. Preserve any database containing needed data.

## Hosted smoke test

Use separate browser profiles or a private window for independent sessions.

1. Sign into patient room 412B and dietary. Submit water. Dietary should receive a ticket and alert within roughly two seconds; nursing and room 413A should not see it.
2. Acknowledge, then complete the dietary ticket. Room 412B should see the status changes and personal alerts.
3. Submit “I need water, I am choking.” Nursing should get P1. Dietary should get a separate water task without clinical text.
4. Attempt another department's ticket mutation: API access must be rejected.
5. Redeploy or restart the hosting runtime. Sign in and verify the same history remains. This verifies the managed database rather than a function filesystem.
6. Check translated input, receipt readback, mobile staff controls, and rules fallback with provider keys disabled on a separate Preview deployment.
7. With TURN configured, acknowledge a Nursing request, offer a video call, and join from two separate devices/networks. Check both directions, audio-only, decline, permission denial, and end-call cleanup. Verify relay traffic using peer connection stats. See [video setup](video-calls.md).

The automated integration suite primarily exercises SQLite. The hosted smoke test also passed against real managed Postgres through the Vercel function; it verified login, persistent requests, routing, permissions, and status updates. Physical microphone, native-speaker quality, and cross-network video tests remain separate acceptance checks.

## AWS alternative

For Bedrock/Transcribe, configure runtime identity and provider variables in [AWS voice setup](aws-voice.md). Bedrock has passed both local and hosted live checks. Transcribe still needs a separate AWS identity; console access alone does not connect it.

The Dockerfile runs the same frontend and API on port 8080 with Node 24. Use an HTTPS container host such as App Runner or ECS and a reachable managed Postgres database such as RDS. Supply the same variables through secret configuration, set port 8080, and use `/api/config` as a readiness check. Public mode requires Postgres and a private demo password.

```sh
docker build -t kaalinga .
# Dedicated production environment file; never commit it.
docker run --rm -p 8080:8080 --env-file .env.production kaalinga
```

Configure HTTPS at the hosting layer because deployed session cookies are Secure. This container path is prepared but has not been run here because the local Docker daemon is unavailable.

## Notification and scale limits

Notifications are stored per user in Postgres and delivered through authenticated polling while the app is open. Optional browser notifications do not create closed-browser web push. Email/SMS and device subscriptions need a delivery service and worker.

The shared transaction lock protects concurrent retry deduplication and schema creation across function instances. It serializes writes and suits a small demo. The app retrieves complete scoped ticket history, seeds shared-password demo identities, and has no ward/tenant administration or live hospital staffing/credential feed. Shift states and task competencies use demonstration policy. Extend those parts before a larger pilot.
