# TalentIQ — Product Requirements (PRD)

## Business outcome
Create Prodian's internal, searchable candidate repository. HR bulk-imports resumes and authorized exports, Delivery/Technical Leads view skills-based shortlists, recruitment workflow is trackable, and management gets an overview. Simultaneously, provide a realistic *target application* against which TELA can demonstrate application understanding, knowledge grounding, incident triage, impact mapping and approved automation.

## Personas
| Persona | Needed function | Information access |
|---|---|---|
| HR recruiter | Import, review, search, contact, shortlist, interview | Candidate PII, only where authorized |
| Delivery head | Search requirements, view candidate fit, pipeline | Skills and limited data; contacts by explicit authorization |
| Technical lead | Inspect technology fit and interview feedback | Skills and relevant interview data; no bulk PII export by default |
| Tenant admin | Provision roles, retention rules, integrations | Admin access, audited |
| TELA service | Answer architecture questions and limited operational read tools | Non-PII search summaries, opaque candidate IDs |

## MVP workflows (v0.1)
1. Authorized user signs in to **local demonstration**.
2. HR picks 1–80 PDF/DOCX/images/TXT/CSV files or a browser-accessible folder.
3. Backend validates allowed types/size; extracts text or OCRs scanned content locally.
4. Heuristic parser proposes name, email, phone, years and skills; import records are marked for HR validation.
5. Duplicate hash/email checks prevent obvious duplicate records.
6. HR searches by skill list, experience, keyword and location, and sees matching/absent skills and transparent score.
7. HR opens a profile, sees allowed contact fields, assigns recruitment stage.
8. HR creates a job requirement and retrieves candidate matches.
9. Admin uses TELA Lab to record simulated failure traces and dependencies.

## Required complete product capabilities (roadmap, NOT v0.1 implementation)
- JD DOCX/PDF extraction, recruiter-defined required-vs-optional skill weights, semantic search via local embeddings, role taxonomy, skills synonym management, CV version history, skills with evidence and years *per skill*.
- Existing folder sync, Microsoft 365 monitored mailbox with approval and opt-out, self-service applicants, consent verification, deletion and retention.
- Interview scheduling, notes, feedback, approval workflow, email/SMS notifications, audit and SLA reminders.
- LinkedIn official Talent Solutions partner integrations if approved and licensed; Naukri authorized Resdex downloads/imports subject to customer terms; no scraping.
- SSO, PostgreSQL, file malware scanning, encrypted object storage, per-tenant data isolation, comprehensive observability and backups.
- TELA live telemetry connector, grounded RCA/Impact and approved remediation tool calling; UI-form generation subject to schema validation and human acceptance.

## Matching behavior
Scores use skills 65, experience 20, location 10 and availability 5. Display matched/missing skills and score components. No rejection or selection may be performed automatically based on the score alone. HR verifies parser results; skills should be validated in interview.

## Nonfunctional requirements
- Local-first data path initially. Sensitive resumes must not be sent to third-party LLM endpoints without explicit policy approval.
- Future target: 10,000 candidates, response p95 <1.5s for indexed search, upload processing via worker queue, 99.9% uptime target after production design, full retention/deletion governance.
- Current POC *does not* claim to satisfy those targets.

## Acceptance criteria for v0.1
- At least 3 representative sample formats ingest: DOCX, text PDF, scanned PDF OCR.
- Search returns candidate name, years, skills, status and, for HR only, email/phone; score reasons can be inspected.
- Duplicate resume is rejected, upload failure is visible, logged import event recorded.
- Non-HR `lead` role cannot read contact details or create candidates.
- Admin can generate synthetic incidents with a trace ID; read-only TELA tool requires service secret.
- App runs alongside TELA without modifying its database or source.
