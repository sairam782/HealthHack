# Nurse video check-ins

This prototype adds an optional virtual conversation for patients in isolated rooms. It may help a nurse understand a request or answer a question before a room visit. Avoided visits or PPE savings have not been measured. Bedside response, examinations, treatment, and urgent escalation remain the existing care-team workflow; a video call never automatically resolves a request.

## Try locally

1. Open the separate patient and RN sign-ins from `npm run test:users`: `http://patient.localhost:8124` and `http://nurse.localhost:8125`.
2. The patient sends a Nursing request, for example the synthetic **Pain** button. The RN chooses **Acknowledge**, then **Offer video call**.
3. The patient receives text and an automatic spoken invitation when ElevenLabs and speech are enabled. Choose **Accept video call**, **Accept audio only**, or **Decline**. Camera/microphone permission is requested only after choosing to join. The nurse starts a local preview or audio separately; preview does not transmit until patient acceptance.
4. Once both participants join, **Connected** appears. Use mute, camera-off, or End call. The original request remains acknowledged and open until staff explicitly complete it.

Only an on-shift RN/charge nurse with Nursing competency can offer a call. Invitations expire after 90 seconds; accepted calls have a 15-minute limit. A nurse or patient has at most one active invitation/call. Reloading or closing a tab releases that tab's media; rejoining an already negotiated call after reload is not implemented. End/reoffer if necessary. The other side may take up to eight seconds to recognize a disconnected peer. Ending is observed on the next signaling poll.

Invitation and control text supports English, Spanish, Hindi, and French. Other languages fall back to English for calls. Live conversation translation, captions, recording, interpreter conferencing, room hardware integration, and background phone-like ringing are not implemented. Invitations arrive while the app is open. Audio-only currently uses the same call panel with blank video tiles.

## Hosted relay configuration

For the current hackathon demo, Vercel has an explicit `WEBRTC_DEMO_MODE=true` option. This enables direct WebRTC with public Google STUN discovery and reports `videoNetwork: demo-direct`. Start with the iPad and phone on the same Wi-Fi. Both must keep the app open; sign into a patient room on one device and RN on the other. Send a Nursing request, acknowledge it, offer the call, and let both participants choose to join. On Safari, allow the requested camera/microphone access and tap **Enable call audio** if playback is blocked.

Direct demo mode has no media relay and cannot guarantee connectivity across cellular, guest, isolated, or restrictive networks. Failed connections leave the care request open. Its server flag is off by default; a configured TURN relay takes precedence and retains relay-only transport. Participant authentication, nurse eligibility, acknowledgement, explicit patient acceptance, expiration, signaling privacy, and WebRTC encryption remain in place.

Use HTTPS for device capture outside local development, a durable managed Postgres database for signaling, and a reachable TURN relay. WebRTC signaling uses normal authenticated HTTP polling, so the Vercel API does not need persistent WebSockets. Media travels through WebRTC, not through the API function.

Configure coturn with REST authentication (`use-auth-secret` and the matching `static-auth-secret`), TLS certificates for TURNS, the appropriate realm, and its required listening/relay ports. Supply these app variables through server hosting settings:

```dotenv
WEBRTC_TURN_URLS=turns:relay.example.org:443?transport=tcp,turn:relay.example.org:3478?transport=udp
WEBRTC_TURN_SHARED_SECRET=your-server-only-relay-secret
```

These example URLs are placeholders. The app issues HMAC credentials with a 30-minute lifetime to authenticated participants and uses relay-only transport when configured. Never put the shared secret in browser environment variables or committed files. Hosted video is disabled without relay configuration unless the explicit direct demo flag is enabled. A relay is not yet provisioned or live-tested here.

References: [WebRTC peer connections and TURN](https://webrtc.org/getting-started/peer-connections), [coturn REST credentials](https://github.com/coturn/coturn/blob/master/README.turnserver), and [browser media capture requirements](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

## Verified scope

The browser test used two isolated demo sessions and generated canvas/oscillator streams. Real native WebRTC exchanged SDP/ICE, reached Connected on both sides, received audio bytes and decoded video frames in each direction, and stopped generated tracks and closed both peers when ended. A second test exercised audio-only, and the fixed invitation played through real ElevenLabs synthesis. No physical camera, microphone, or patient data was captured. Logs: `artifacts/video-call-browser-check.json`; screenshot: `artifacts/video-call-connected.jpg`.

Automated tests cover participant-only access, explicit acknowledgement/consent, eligibility, expiry, directional signaling, bounds, cleanup, voice privacy, capture denial, and late device-capture disposal. Real devices, hospital network restrictions, hosted TURN, managed Postgres, and Vercel end-to-end operation remain to be checked. This is a synthetic hackathon prototype, not a validated hospital communications service.
