# Routing Policy

The labels in `dataset_creation.py`, `eval_sets.py` and the red-flag rules in `routing.py` all follow this policy. 

| Request | Route to |
|---|---|
| Comfort and mobility: blankets, pillows, sheets / linens, gowns, wet bed, water, ice chips, toileting, getting up or repositioning, room temperature, TV / remote | Patient Care Technician |
| Symptoms without red flags: pain, nausea, dizziness, feeling unwell. Medications and dose timing, IVs, dressings, vitals, blood sugar | Registered Nurse |
| **Red flags**: chest pain / pressure / tightness, trouble breathing, fainting or feeling about to faint, racing heart, heavy bleeding, "emergency" | Registered Nurse + Provider (urgent) |
| A symptom plus an explicit request to see the doctor | Registered Nurse + Provider |
| Results, diagnosis, discharge, treatment plan, why a medication changed, consults, paperwork | Provider |
| Overdue requests ("nobody came", waiting 20+ minutes), staff conduct complaints, nurse assignment, room changes, visitors | Charge Nurse |
| Overdue request for a specific need | Charge Nurse + the role for that need |
| Cleaning, spills, trash, restocking, pests (including complaints about cleaning) | Environmental Services |
| Meals, menus, diet options, meal complaints | Dietary |
| Served a food the patient is allergic to | Dietary + Registered Nurse |
| Overdue meal | Dietary + Charge Nurse |
| Anything else (wifi, parking, billing, small talk, gibberish), or nothing the model is confident about | **Needs Review**: a human at the unit desk triages it |

Compound requests get every role their parts need.

The model only *suggests* roles. Red-flag phrases always add Registered Nurse + Provider and mark the request urgent, whatever the model predicts. Who actually gets paged (staffing, availability) is decided outside the classifier.
