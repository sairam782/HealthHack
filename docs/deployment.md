# Deploy Kaalinga

## Vercel with managed Postgres

The repository includes a Vercel Node API function and static build configuration. A database has not been provisioned or connected yet.

1. Import the repository into Vercel. If importing the parent repository, set Root Directory to `hhcode`. Select Framework Preset **Other**, Node.js **24.x**, Build Command `npm run build`, and Output Directory `public`. The included `vercel.json` defines the API rewrite and function duration.
2. In Vercel's Storage/Marketplace flow, create a managed Postgres integration, such as Neon, and connect it to the project. Use a dedicated hackathon database, preferably near the function region. Obtain its **pooled Postgres connection URL**, preserving provider TLS parameters.
3. Set these server variables in Production and, if needed, Preview:

   | Variable | Value |
   | --- | --- |
   | DATABASE_URL | Managed database pooled connection URL; map the integration's supplied URL to this name if necessary |
   | DEMO_PASSWORD | A private initial demo password of at least 10 characters, preferably 16 or more |
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

Current automated integration tests exercise SQLite, not a managed Postgres connection. Postgres uses the same parameterized operations through `pg`; live connectivity, provider TLS, and Vercel routing still require this hosted smoke test.

## AWS alternative

For Bedrock/Transcribe, configure runtime identity and provider variables in [AWS voice setup](aws-voice.md). Console access alone does not connect the app. Live AWS access is unverified.

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
