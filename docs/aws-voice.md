# AWS classification and multilingual input

Bedrock classification has passed a live four-language smoke test using Nova 2 Lite in us-west-2 with a short-term bearer key. ElevenLabs receipt synthesis passed for the same four languages. Transcribe adapters are tested with simulated responses; live Transcribe authentication and physical microphone quality remain unverified. The current local configuration uses Bedrock/browser recognition with ElevenLabs replies. Without provider settings, the defaults remain Groq/browser recognition.

## Short-term Bedrock key

For classification, a Bedrock API key is sufficient; full AWS credentials are not required. Set AWS_BEARER_TOKEN_BEDROCK in the private server .env file, together with AI_PROVIDER=bedrock, AWS_REGION=us-east-1, and BEDROCK_MODEL_ID=us.amazon.nova-2-lite-v1:0. Restart after replacing an expired key. [Short-term keys](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys.html) last up to 12 hours or the generating session duration, whichever is shorter, and inherit its permissions. The app explicitly uses bearer authentication when this key is present; a mocked SDK transport test verifies zero AWS credential lookups.

[Bedrock keys](https://docs.aws.amazon.com/bedrock/latest/userguide/api-keys-use.html) are limited to Bedrock/Bedrock Runtime and cannot sign Transcribe sessions. With only this key, leave VOICE_INPUT_PROVIDER=browser and retain ElevenLabs output. Enable AWS transcription after establishing the separate AWS identity described below. The key must permit the selected inference profile and destination models. The live check passed in us-west-2; short-term keys must match the generation region.

## Runtime identity for Transcribe or role-based Bedrock

On AWS hosting, attach a least-privilege runtime role to the App Runner instance or ECS task. The official SDK uses its credential chain. Locally, use temporary credentials or IAM Identity Center through AWS CLI and AWS_PROFILE. Keep credentials out of chat, Git, browser code, and screenshots. For Vercel, configure a supported workload identity/assume-role flow or temporary server credentials with refresh; a console session is insufficient.

The role needs bedrock:InvokeModel on the selected model/inference profile and destination foundation models. Default: us.amazon.nova-2-lite-v1:0. Check account/model access and cross-region constraints; access to us-east-1/us-west-2 alone does not prove the default US profile is permitted. Override BEDROCK_MODEL_ID with an accessible Converse model supporting forced tool choice, or arrange appropriate profile access through your administrator.

It also needs transcribe:StartStreamTranscriptionWebSocket on Resource "*", as documented in [AWS streaming setup](https://docs.aws.amazon.com/transcribe/latest/dg/streaming-setting-up.html). Scope to your chosen region with applicable IAM conditions. These instructions do not create or grant IAM access.

After establishing identity, set server variables and restart:

```dotenv
AI_PROVIDER=bedrock
VOICE_INPUT_PROVIDER=aws
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=us.amazon.nova-2-lite-v1:0
```

us-west-2 is also supported. Providers switch independently: AI_PROVIDER=groq|bedrock|rules and VOICE_INPUT_PROVIDER=browser|aws. Keep ElevenLabs variables. Classifier outages return labelled rules fallback; AWS speech failure leaves typed requests available. Public provider configuration is not proof of live access.

## Voice behavior

The patient selects a language before recording. Twelve codes are supported: English, Spanish, Hindi, French, Portuguese, Mandarin, Arabic, Korean, Tagalog, Polish, German, Japanese. This is explicit language selection, not automatic detection, code switching, or a live interpreter. Confirm region/language support in the [Transcribe table](https://docs.aws.amazon.com/transcribe/latest/dg/supported-languages.html). Staff summaries are requested in English. Native-speaker checks remain necessary.

Voice input produces a transcript for review. Hey Kaalinga is opt-in hands-free capture, with prompts and send/cancel commands in English, Spanish, Hindi, French. It speaks the draft, pauses recognition during playback, then requires a separate send command. Cancel creates no request. Receipt speech follows submission; acknowledgement/completion speech follows actual staff actions. Blocked autoplay offers Play voice prompt.

Hands-free is a visible-page browser prototype, not an OS assistant or offline wake-word engine. AWS streams audio while listening, including speech before a wake phrase. Stop, page hiding, account/language changes, and calls stop capture. Wake matching uses final transcripts. Streams last at most 60 seconds and restart while enabled; the server limits each patient to 30 sessions in five minutes. Physical-device wake accuracy is unmeasured.

Authenticated patients receive a signed WebSocket URL valid for 60 seconds. Treat this temporary streaming capability as sensitive; never log/share it. Audio streams directly to fixed Transcribe endpoints as mono 16 kHz PCM with checked EventStream framing. The app saves no audio recordings; request text uses the existing database. Errors release microphone/audio resources and create no requests. AWS secrets never appear in /api/config.

## Live acceptance check

1. Establish identity and model permissions; enable AWS in a dedicated synthetic demo environment.
2. Submit water and verify a validated AI route rather than ai_fallback. Submit urgent symptoms and verify Nursing P1 without model wait.
3. Record synthetic requests in each intended language, stop, review final transcripts, submit, and check native-language receipt plus English staff summary.
4. Enable hands-free, say wake phrase plus a request, and verify spoken draft with zero tickets before Send request. Cancel another draft. Test Stop, hidden page, microphone denial, network errors, and sign-out.
5. Have staff acknowledge and complete; only that patient should receive those true status updates.
6. Test HTTPS, WebSocket port 8443 on the intended network, service costs/quotas, and concurrent streams.

Video remains as previously implemented; no AWS video migration is included. Hosted database and physical-device tests remain pending.
