# Gentle, task-aware patient voice

Kalinga is a request assistant. It helps patients describe needs and contact the right care team. It does not act as a nurse, diagnose symptoms, recommend medication, promise an arrival time, or tell a patient that they are safe.

## Conversation behavior

- Greeting: “Hello, I’m Kalinga, your request assistant. I’m listening. Tell me what you need.”
- Recap: recognized intents are summarized in plain language. Multiple needs remain separate, such as pain and water. Unclear requests receive an honest “I’m not sure I understood everything”; arbitrary instructions are not read back as a staff update.
- Pain: a brief sympathetic response precedes an optional 1–10 rating question. Patients can say a number, skip, cancel, or send without a rating. A valid spoken answer adds a localized score line to the draft so the existing server parser persists a transcript-sourced score. Dose, room number, decimal, out-of-range and ambiguous answers are rejected. One retry is allowed, then the patient can proceed unscored. Explicit pain denials avoid mismatched sympathy and rating questions; this conversation guard does not weaken conservative clinical routing.
- Corrections: in hands-free mode, “also…” adds a need, and “change my request to…” replaces the draft. Every revision still requires an explicit send command. Spanish, Hindi and French equivalents are supported.
- Emergency: known urgent symptoms skip pain-rating questions and optional correction instructions. The short voice prompt directs the patient to the bedside call bell and offers the explicit send command. An urgent symptom reported during a rating question replaces the question with urgent guidance. The on-screen urgent button sends directly; a voice draft still requires the patient's confirmation.
- Timing: audio playback pauses hands-free recognition to prevent the assistant from hearing itself. After a prompt ends, the listener resumes. The listener allows 60 seconds after prompt playback for a reply. Timeouts leave the draft on screen and say that it was not sent. Microphone permission, muted speech, errors and manual stop remain under patient control.
- Status: receipts use gentle wording, including “I’m sorry you’re hurting” for pain and “Thank you for telling me” for other requests. Team acknowledgements and completions remain grounded in real database actions. An assistant conversation never invents staff acknowledgement or an arrival time.

The Pain quick button offers the same spoken question. The microphone button now also asks and reads the optional pain question. The patient can tap it again to answer or use the ordinary Send request button without a score. A visible assistant transcript mirrors the spoken prompt. The regular voice preference disables these prompts as well as request readback; hands-free mode is unavailable while spoken replies are disabled.

## Language and speech

Hands-free wake detection now handles split greeting/name results, punctuation, and recognition alternatives. Patients using English browser recognition can choose a regional speech setting and inspect the latest microphone transcript under **Voice options**. See [real-speaker wake acceptance checks](wake-acceptance.md) for the limits, test protocol, and next provider comparison. This does not establish accent accuracy or enable AWS Transcribe.

The new conversational prompts are localized in English, Spanish, Hindi and French. Other languages retain their existing request/status readback; the app does not insert an English conversational question for those selections. Native-speaker and physical-device testing are still required.

Speech continues to use ElevenLabs multilingual v2 with the existing voice. Requests set speed to `0.94` and stability to `0.65`, aiming for a slightly slower and consistent delivery. This is a design choice, not a validated accessibility preference; patients should help evaluate pacing. See [ElevenLabs voice settings](https://elevenlabs.io/docs/api-reference/voices/settings/get) for the speed parameter.

## How the “intelligence” works

`patient-assistant.js` formats bounded prompts from recognized intents and reported pain; `wake-voice.js` manages follow-ups, edits, confirmation and cancellation. The same formatter is used by the browser's visible dialogue and the authenticated patient-only synthesis endpoint. Patient request routing still uses the existing safety rules and Bedrock classifier after confirmation. No second model, custom-trained conversational model, or open-ended medical chatbot was added.

`tests/gentle-dialogue.test.cjs` covers multilingual rating parsing, retention of needs across turns, refusal to invent scores, skipping, urgent bypass, explicit revisions, cancellation, bounded retries, unsupported prompt types and instruction-like input. Browser QA uses simulated recognition transcripts with real synthesis and native Audio playback. It does not validate physical microphone recognition, accents, clinical quality, perceived gentleness, or every language on a real patient.
