# Hospital unit roles — reviewed prototype policy

The supplied document is a useful role catalogue for an adult inpatient prototype. It should not be presented as an official RWJUH medical-surgical staffing roster or a statement of task authorization. The stray “New Brunswick, NJ +1” and “Robert Wood Johnson Medical School +1” fragments are incomplete citations and should be replaced with actual sources.

[RWJUH patient care areas](https://www.rwjbh.org/rwj-university-hospital-new-brunswick/for-health-care-professionals/nursing/nursing-at-rwj-university-hospital-new-brunswick/our-patient-care-areas/) confirms that medical/surgical, critical care, oncology, pediatric, and other areas differ. [Rutgers Health surgical critical care](https://patientcare.rutgershealth.org/services/surgery/surgical-critical-care) describes a multidisciplinary team including nursing, NP/PA, case management, rehabilitation, pharmacy, nutrition, social work, speech therapy, and chaplaincy. Its critical-care description supports multidisciplinary roles; it does not establish med-surg shift staffing. [The RWJMS pulmonary/critical-care fellowship](https://rwjms.rutgers.edu/department/medicine/pulmonary/ccm/fellowship) describes fellow and attending responsibilities at RWJUH.

## Corrections and design decisions

- Clinical concerns stay with RN nursing. New P1 emergency requests additionally create a parallel Medical Team task for eligible on-shift medical staff. Non-emergency physician and other clinical consultations remain staff-arranged by an eligible RN or charge nurse; AI cannot directly select these consultation queues. The single-unit demo alerts all eligible on-shift Medical Team accounts; patient/provider assignments and clinical response protocols require local validation.
- Charge nurses see unit requests, receive clinical/coverage alerts, and can accept Nursing tasks while eligible and on shift. Nurse managers monitor the unit and manage shift availability; the app does not treat managers as bedside responders. Actual supervisory credentials and bedside assignments need local validation.
- PCT and nursing-assistant accounts share the Bedside Care queue. The observer account monitors that queue but cannot accept work or receive new task-dispatch alerts. Actual sitter-to-patient assignments are not represented yet.
- Transport is a separate operational queue for coordination between locations; ordinary toileting/mobility remains Bedside Care. Transport requires care-team authorization and a confirmed destination outside this prototype.
- Non-urgent specialist requests initially reach the referral coordinator. That account can arrange language access, social work, case management, advocacy, and spiritual support. It cannot initiate clinical consultations.
- The supplied document places blankets/water within potentially delegated bedside work. The challenge currently routes blankets/pillows to EVS and drinks to Dietary. These remain prototype policy choices, not RWJUH delegation rules. Water delivery still requires staff to verify diet/fluid orders; the app does not have an EHR diet-order feed.

## Implemented accounts and modes

All accounts below use the configured initial demo password. Eight additional accounts represent synthetic patients in separate rooms, listed in the [account directory](../README.md#run-locally). The four groups classify responsibilities; they do not confer credentials.

| Role | Group | Mode | Queue / access | Demo email |
| --- | --- | --- | --- | --- |
| Registered nurse (RN) | Clinical care | direct | Nursing | nurse@kaalinga.demo |
| Patient care technician (PCT) | Bedside assistance | direct | Bedside Care | bedside@kaalinga.demo |
| Nursing assistant | Bedside assistance | direct | Bedside Care | assistant@kaalinga.demo |
| Charge nurse | Clinical care | escalation | Nursing | charge@kaalinga.demo |
| Nurse manager / nursing supervisor | Clinical care | oversight | Unit overview | manager@kaalinga.demo |
| Hospitalist / attending physician | Clinical care | consult | Medical Team | physician@kaalinga.demo |
| Resident physician | Clinical care | consult | Medical Team | resident@kaalinga.demo |
| Fellow | Clinical care | consult | Medical Team | fellow@kaalinga.demo |
| Advanced practice provider (NP/PA) | Clinical care | consult | Medical Team | app@kaalinga.demo |
| Respiratory therapist (RT) | Clinical care | consult | Respiratory Therapy | respiratory@kaalinga.demo |
| Patient sitter / observer | Bedside assistance | observer | Bedside Care | observer@kaalinga.demo |
| Environmental services (EVS) | Environmental and operational support | direct | Environmental Services | housekeeping@kaalinga.demo |
| Dietary / food services | Environmental and operational support | direct | Food Services | dietary@kaalinga.demo |
| Facilities staff | Environmental and operational support | direct | Facilities | facilities@kaalinga.demo |
| Unit secretary / unit clerk | Environmental and operational support | direct | Unit Clerk | clerk@kaalinga.demo |
| Patient transport staff | Environmental and operational support | direct | Patient Transport | transport@kaalinga.demo |
| Specialist referral coordinator | Specialized and supportive care | coordination | Specialized Services | specialist@kaalinga.demo |
| Physical therapist (PT) | Specialized and supportive care | consult | Physical Therapy | pt@kaalinga.demo |
| Occupational therapist (OT) | Specialized and supportive care | consult | Occupational Therapy | ot@kaalinga.demo |
| Speech-language pathologist (SLP) | Specialized and supportive care | consult | Speech and Swallowing | slp@kaalinga.demo |
| Clinical pharmacist | Specialized and supportive care | consult | Pharmacy | pharmacist@kaalinga.demo |
| Registered dietitian | Specialized and supportive care | consult | Nutrition | dietitian@kaalinga.demo |
| Case manager | Specialized and supportive care | consult | Case Management | case-manager@kaalinga.demo |
| Social worker | Specialized and supportive care | consult | Social Work | social-worker@kaalinga.demo |
| Wound care nurse | Specialized and supportive care | consult | Wound Care | wound@kaalinga.demo |
| Patient advocate | Specialized and supportive care | consult | Patient Advocacy | advocate@kaalinga.demo |
| Interpreter / ASL interpreter | Specialized and supportive care | consult | Language Services | interpreter@kaalinga.demo |
| Chaplain / spiritual care | Specialized and supportive care | consult | Spiritual Care | chaplain@kaalinga.demo |
| Infection prevention personnel | Specialized and supportive care | consult | Infection Prevention | infection@kaalinga.demo |
| Unit coordinator | Environmental and operational support | coordination | Unit overview | coordinator@kaalinga.demo |

## Shift-aware routing and consultation workflow

The staffing roster is persisted separately from accounts. Charge nurse, manager, and unit coordinator can change availability. New task alerts and acknowledgement require both on-shift status and a matching configured role competency. Off-shift users retain authorized read access but cannot accept tasks. When a service has no eligible on-shift responder, the queue stays intact and available charge/manager accounts receive a coverage alert. Returning eligible staff receive alerts for waiting tasks.

These competencies are seeded demo policy, not verified licenses or skills records. The app does not query RWJUH staffing, HR, credentials, patient assignments, or delegation systems. A real pilot needs those inputs and unit approval.

Staff open “Arrange a consultation” on an unresolved request, choose the service, and enter a focused note. A separate linked referral reaches only the matching service queue; the original request stays with its first responder. The patient gets a consultation-request notification, and the originating ticket shows consultation status. Repeated referral submission to the same service produces one linked task.

Consultation queues: Medical Team, Respiratory Therapy, Physical Therapy, Occupational Therapy, Speech and Swallowing, Pharmacy, Nutrition, Case Management, Social Work, Wound Care, Patient Advocacy, Language Services, Spiritual Care, Infection Prevention.

P1 Nursing and automatic Medical Team requests still NEW after 30 seconds, and P2 Nursing requests after 120 seconds produce one persistent overdue alert for available charge nurse and manager accounts, plus an audit event. These thresholds are demo assumptions requiring unit validation. This escalation is evaluated when the app polls; it is not hospital paging or a background worker when every browser is closed. No automated diagnosis, treatment, or verified patient-to-clinician assignment is performed.

## Validate before a pilot

Review this catalogue with the nurse manager, charge nurse, and PCT for the selected unit. Confirm which tasks are delegated, which services are available each shift, who may arrange consultations, interpreter access, transport workflows, diet restrictions, patient assignments, and fallback escalation. The review should turn the demo competency policy into locally authorized task rules.
