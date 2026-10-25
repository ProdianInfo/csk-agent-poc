# TalentIQ — REST API Reference

**OpenAPI:** `/openapi.json`; Swagger: `/docs`; offline frozen contract in root `openapi.json`.

## Auth
- `POST /api/auth/login` — demo `username,password`; session cookie.
- `GET /api/auth/me`; `POST /api/auth/logout`.
- Roles `admin`, `hr`, `lead`; access is a **local demonstration** only.

## Candidate operations
- `GET /api/dashboard` — KPIs + skills distribution.
- `GET /api/candidates?q=&skills=Java,Spring Boot&min_years=3&max_years=6&location=Chennai` — candidate summaries and explainable score.
- `POST /api/candidates` — manual HR entry.
- `GET /api/candidates/{candidate_id}` — HR: contacts; lead: redacted contacts.
- `PATCH /api/candidates/{candidate_id}/stage` — HR workflow update.
- `GET /api/candidates/{candidate_id}/resume` — HR-controlled file download.

## Resume import
- `POST /api/imports/upload` — multipart with repeated `files` fields, max 80 files and 10 MB each. Format: PDF, DOC/DOCX, TXT, PNG/JPG/TIFF, CSV.
- `GET /api/imports` — recent import results.
- CSV minimum: `name`; optional: `email,phone,skills,years,location,availability`.

## Hiring requirements
- `GET /api/jobs`; `POST /api/jobs` — skills + exp ranges + location.
- `GET /api/jobs/{job_id}/matches` — ranking against candidate pool.
- `GET /api/pipeline` — stage-based cards.

## Observability and learning lab
- `GET /api/ops/health` — unauthenticated local health.
- `GET /api/ops/dependency-map` — curated dependency data (session needed).
- `POST /api/ops/inject` — admin, synthetic fault only; e.g. `{"kind":"search_500"}`.
- `GET /api/ops/incidents` — trace IDs and synthetic evidence (session needed).
- `GET /api/ops/audit` — admin audit records.
- `POST /api/ops/reprocess/prepare` — HR prepares **synthetic** resolution.
- `POST /api/ops/reprocess/{id}/approve` — distinct admin approval.
- `POST /api/ops/reprocess/{id}/execute` — admin marks lab incident resolved.

## TELA tool adapter boundary
- `POST /api/tela/tools/search-candidates` — requires `X-TELA-Service-Key`; request `{ "skills": "Java, Spring Boot", "min_years": 3, "limit": 10 }`; **output omits candidate name, email and phone** and uses opaque candidate refs. Do not place PII into an external model.
- `GET /api/tela/tools/application-map` — requires service key.
- `GET /api/form-definitions/candidate-search` — static schema for a possible TELA-generated UI exercise, session needed.

## Cautions
This API has no production identity provider and no enterprise rate limiting. Do not forward port 8091 or publish Swagger externally. When integrating TELA, implement per-user delegated authorization instead of shared service identity for access to contact data.
