# Hands-free wake acceptance check

## Current implementation

The Vercel app uses browser speech recognition, followed by text matching. Bedrock classifies a confirmed request; it does not listen for the wake word. The new matcher accepts greeting punctuation and spacing, requests up to three recognition alternatives, and joins a greeting and name split across adjacent final results within three seconds. Alternative transcripts are considered only while waiting for the wake phrase. Sending, cancelling, pain ratings, and corrections continue to use the primary final transcript. An alternative can open a draft, but never authorize sending it.

English browser recognition can use `en-US`, `en-IN`, `en-GB`, or `en-AU` from **Voice options → English speech setting**. This selects the recognition locale; it is not accent detection or a guarantee that a browser has a separate model for that locale. Changing it stops capture; the patient explicitly enables hands-free again. The selected request/readback language remains independent. The prepared AWS adapter retains its currently supported locale list.

**Voice options** shows the latest final transcript, whether the wake phrase matched, and the recognized alternative when it differed from the primary result. This feedback stays in the current page's memory, clears on account/language changes, and is not added to tickets or server logs. A confirmed patient request is saved through the existing normal request flow. The browser speech service still receives microphone audio as described on the listening panel.

The patch has automated transcript-level checks. It has no measured physical microphone or accent accuracy yet. Recognition alternatives may be absent; the code still works with a single result. An entirely misheard name cannot be recovered reliably by text matching alone.

## A small real-speaker test

Start with six consenting volunteers with varied English accents, including the people presenting the demo. Use synthetic phrases below. Test their chosen English setting, first in a quiet room and then with ordinary background conversation, on a laptop and a phone if available. Run each wake phrase three times. Keep speaker IDs rather than names; avoid recording audio unless the speaker agrees.

| Phase | Say | Expected |
| --- | --- | --- |
| Wake | Hey Kalinga | Greeting, then listens for a need; no ticket |
| Wake | Hello, Kalinga | Same behavior |
| Wake | Hey [short pause] Kalinga, I need water | Water draft; no ticket yet |
| Wake | Hey Kalinga, I need water and the bathroom | Both needs retained; no ticket yet |
| Confirm | Cancel | Draft discarded; no ticket |
| Confirm | Do not send request | No ticket |
| Confirm | Send request | One request, after explicit confirmation |
| Wake | The television is on / I mentioned Hey Kalinga | No activation or ticket |
| Wake | Hey Kalinga, I have chest pain | Urgent guidance; after confirmation, P1 Nursing and Medical Team |

For each attempt, note speaker ID, device/browser, locale, quiet/noisy setting, what was said, **Microphone heard**, wake detected/missed, time from speaking to response, and whether any request was wrongly sent. Score separately: wake recall, accidental activation, correct intent retention, and send/cancel correctness. Report results per speaker/setting, not just an aggregate that hides a struggling speaker.

Proposed demo acceptance targets: at least 95% wake recall in quiet trials, no unconfirmed sends, and correct cancellation/urgent behavior in every scripted trial. These are targets, not claimed results or clinical validation. Any unsafe send blocks release of that wake path. If a speaker still cannot trigger it, retain the microphone button and bedside call bell while investigating the exact transcript.

## Next experiment if the name is still missed

Compare browser speech recognition with Amazon Transcribe using the same consented synthetic recordings or repeated live phrases. Confirm separate AWS Transcribe credentials first; a Bedrock bearer key cannot authenticate it. A custom vocabulary can bias terms such as Kalinga, but does not prove accent robustness. Prefer measured wake recall and intent retention over vendor claims.

A dedicated audio wake detector is a separate possible design: detect the name from audio before opening request transcription. It needs its own keyword model, browser/device integration, false-activation tests, and privacy/latency measurements. It has not been installed or enabled by this patch. Do not use broad fuzzy matching or an LLM to guess that unclear speech meant “send”.

References: [browser recognition language](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/lang), [Amazon Transcribe behavior and vocabulary](https://docs.aws.amazon.com/ai/responsible-ai/transcribe-speech-recognition/overview.html).
