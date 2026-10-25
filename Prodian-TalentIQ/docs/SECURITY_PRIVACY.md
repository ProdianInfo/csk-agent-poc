# TalentIQ — Security, Privacy and HR Data Controls

## Deployment gate: no real CVs until controls are implemented
This project is a **working POC**, not an approved HR data-processing system. Candidate CVs contain personal information. A real Prodian rollout requires documented notice/consent or other appropriate lawful basis, secure retention/deletion process, authorized access and audit, and management/security signoff under applicable law and company policy.

## Existing POC controls
- TalentIQ uses its **own local** SQLite and file storage; no ingestion of real CVs into TELA knowledge by default.
- Browser session cookie is signed, HttpOnly and SameSite Strict, with demo roles; `lead` cannot see contact data or upload.
- TELA tool path requires a separate shared service secret and **omits name, phone, email and raw resume text**.
- Default server should bind `127.0.0.1` only.
- Import whitelist, size cap, duplicate-file hash, minimal request tracing and audit records.
- Four-eyes approval for an intentionally narrow synthetic action.

## Serious limitations of current code
- Single shared demo password, no IdP, no password rotation/lockout or brute-force protection, shared session secret example, no formal CSRF design across all routes.
- No data encryption at rest, malware scanning, true document sandbox, DLP, rate limiting, structured SIEM pipeline, immutable audit, tenant isolation or production backup/restore.
- No completed consent register, retention purge workflow, right-to-access/correction/deletion automation or signed processing agreements.
- SQLite stores extracted resume body as plaintext; contact PII remains on local disk.
- OCR/parser heuristics can be inaccurate; score should not automatically make hiring decisions.
- Displaying `name` in the HR UI is permitted by demo role; the TELA tool returns opaque references because the user's LLM deployment/policy is not validated.
- Import of untrusted documents should use anti-malware scans and resource-constrained sandboxed workers in production.
- Third-party CV source licensing/terms, data transfers and data residency need legal/HR approval.

## Production actions (mandatory)
1. Replace demo auth with Entra ID/Keycloak SSO, per-action RBAC, conditional access, delegated access to contact fields and secure session management.
2. Migrate to PostgreSQL, encrypted object store, per-tenant constraints and key rotation in Key Vault/Vault.
3. Add AV and quarantined document ingest worker with parser timeouts, content sniffing and size/page/resource caps.
4. Add explicit source/consent metadata, right-to-delete and retention jobs; log every contact reveal/export.
5. Establish whether TELA models are on-prem or external. Never send real resumes or contact data to LLM without approved processing and data-flow rules.
6. Establish tests for prompt injection hidden inside PDFs/Word content: extracted content is untrusted data, never instructions.
7. Review fairness of skills-based matching, accuracy benchmarks, accessibility, human decision checkpoints and appeal/correction process.
8. Conduct vulnerability assessment, privacy impact assessment, penetration testing, DR rehearsal and production approval.

## LinkedIn / Naukri sources
- LinkedIn's User Agreement prohibits unauthorized scraping. LinkedIn Talent Solutions Recruiter System Connect and related API products need partner approval and contractual terms.
- Naukri Resdex provides licensed resume search and CV downloads, subject to its terms and subscription limits. Confirm whether Prodian's account permits the proposed export, storage, redisplay and retention.
- The v0.1 app implements **no automated LinkedIn or Naukri connector**. Import only resumes lawfully obtained for the recruitment purpose.

Official documentation:
- https://www.linkedin.com/help/linkedin/answer/a1341387/prohibition-of-scraping-software
- https://learn.microsoft.com/en-us/linkedin/talent/recruiter-system-connect?view=li-lts-2026-03
- https://www.naukri.com/recruit/resume-database-access-resdex
