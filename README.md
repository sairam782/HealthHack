# CallBell Router

AI-powered call bell triage system that classifies patient requests and routes non-clinical ones to the right department -- so nurses can focus on patient care.

Built for [Rutgers Health Hackathon 2026 "Ops Unleashed"](https://www.youtube.com/shorts/B_YMUvPV_eA) -- Challenge 2: Inpatient Services.

## The Problem

60-70% of hospital call bell activations are for non-clinical needs (water, blankets, room cleaning, TV help). Every one of these defaults to a nurse, creating alarm fatigue, clinical bottlenecks, and delayed response times.

- **33M** US hospitalizations per year ([HCUP NIS](https://hcup-us.ahrq.gov/nisoverview.jsp))
- **4.4** call bell presses per patient per day ([Tzeng & Yin, 2009](https://pubmed.ncbi.nlm.nih.gov/19525764/))
- **25%** of nursing shift time lost to non-clinical tasks ([Becker's Hospital Review](https://beckershospitalreview.com/news-analysis/hospital-nurses-spend-25-of-time-on-non-patient-care.html))

## How It Works

```
Patient Request --> AI Classifier --> Route to Department
                                          |
                        +-----------------+-----------------+
                        |        |        |        |
                     Nursing  Housekeeping  Food   IT
                    (clinical)  (non-clinical routes)
```

1. Patient types or speaks a request on their bedside tablet
2. LLM classifies the request into a category with a priority score (P1-P5)
3. Clinical requests escalate immediately to nursing staff
4. Non-clinical requests route to the correct department dashboard
5. Mixed requests (clinical + non-clinical) split -- clinical part always escalates

### Safety Guardrails

- Any mention of pain, breathing, chest, dizziness, bleeding --> instant nurse escalation
- Ambiguous or uncertain requests default to nursing (fail-safe)
- Mixed requests always flag the clinical component, even if buried in a casual ask
- Confidence scores on every classification

## Tech Stack

- **Frontend:** HTML/CSS/JS (single-page app)
- **AI Classification:** Groq API (Llama 3) with structured JSON output
- **UI:** Split-screen -- patient input panel + department dashboard
- **Deployment:** Static site (GitHub Pages / Vercel)

## Project Structure

```
call-bell-router/
├── index.html          # Main application
├── README.md
└── docs/
    └── architecture.md # System design notes
```

## Running Locally

Open `index.html` in a browser. That's it.

For LLM classification, add your Groq API key in the settings panel.

## Routing Matrix

| Category | Department | Priority | Example |
|----------|-----------|----------|---------|
| Clinical / Urgent | Nursing | P1-P2 | "My chest hurts", "I fell" |
| Housekeeping | Facilities | P3-P4 | "Room needs cleaning", "Extra blanket" |
| Food & Beverage | Food Services | P4 | "Can I get water", "Meal question" |
| Technical / IT | IT Support | P3-P5 | "TV not working", "Wi-Fi down" |
| Comfort / General | Housekeeping | P4-P5 | "Room is cold", "Need a pillow" |

## Team

Rutgers Health Hackathon 2026 -- Ops Unleashed, Challenge 2

## License

MIT