# Verification snapshot — October 10, 2026

- `npm test`: **90 passed**, zero failed or skipped. Includes 16 HTTP integration tests using temporary SQLite storage, routing fixtures, mocked provider failures, safety guards, and client login-response regressions.
- `npm run build`: succeeded; only app assets are copied to the static output.
- `npm run evaluate`: **38/38** expected synthetic routes matched in deterministic rules mode.
- Live Groq regression, `openai/gpt-oss-120b`: **38/38** expected synthetic routes matched. **16** requests used validated AI responses, **22** clinical cases bypassed AI through safety rules, and **0** used provider fallback. This evaluates the guarded application, not the model alone. Model confidence is not measured accuracy.
- Live ElevenLabs receipt endpoint: HTTP 200, `audio/mpeg`, nonempty output for a synthetic receipt.
- Browser checks: mobile patient and nursing controls, Hindi mixed clinical input → P1 nursing plus dietary task, staff acknowledgement → patient alert and status, coordinator queue. No browser errors or warnings observed in the final view.
- Login recheck: correct demo credentials succeed; incorrect credentials show the server's password message. HTML, empty/truncated JSON, invalid response objects, connection failures, and timeouts now produce controlled client errors. The previously reported intermittent JSON error was not reproduced against the running API.
- Hosted Postgres/Vercel smoke test: **pending database provisioning**. No public deployment or real Postgres integration test has been completed. Docker container execution is unverified because the local daemon is unavailable.

Machine-readable reports and screenshots are in local ignored `artifacts/`. Rerun the documented commands to regenerate reports. These cases demonstrate regressions, not clinical validation or a real-world accuracy estimate.
