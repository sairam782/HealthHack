# Judging demo

Prepare a patient browser and a separate coordinator browser. Keep nursing and dietary sign-ins ready. Use synthetic text. Open both views before judging so authentication does not consume presentation time.

## A 90-second story

**0–15 seconds:** “A patient needs water; a nurse receives the interruption. Kaalinga sends routine requests to support teams while keeping clinical concerns with nursing, and shows the patient what happened.” Frame this as the challenge's problem, not a measured prototype outcome.

**15–35 seconds:** As room 412B, send a pillow request. Show Environmental Services receiving it. Acknowledge as staff and show the patient's acknowledgement status and alert. The visible handoff is the central demo.

**35–60 seconds:** Send “I need water, I am choking.” Show nursing P1 through the safety rule and a separate dietary task containing only the water request. Known clinical triggers do not wait for AI; uncertainty defaults to nursing.

**60–75 seconds:** Select Hindi and send “मुझे पानी चाहिए, मुझे सांस लेने में तकलीफ हो रही है”. Show nursing and the Hindi receipt. Read aloud if audio is configured. Explain limited offline phrase coverage rather than claiming universal language safety.

**75–90 seconds:** Show actual non-clinical share, open urgent requests, classification duration, and completed tasks. Label nursing minutes as an editable assumption. Finish with the next validation step: staff-supervised labelled requests, diet-order integration, and the existing hospital call-bell workflow.

## Backup and evidence

- `Run 8-request demo` creates actual synthetic requests and reports observed routing; it does not reset history or fake passes.
- Provider outages use labelled rules fallback for recognized requests. Show the label.
- `npm test` checks isolation, targeted notifications, persistence, retry protection, and routing guards. `npm run evaluate` checks 38 synthetic examples. Keep live provider results separate and count fallbacks.
- Acknowledgement is an actual staff action; it still does not prove physical arrival.
- This prototype has demo identities, no hospital paging or clinical validation, and no SMS/email or closed-browser push.

Build the pitch around the observable chain: request → appropriate queue → authorized acknowledgement → patient notification. Present operational savings as a hypothesis to test.
