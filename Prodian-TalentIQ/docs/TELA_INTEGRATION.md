# Connecting the existing TELA POC to TalentIQ

## Goal
Use TalentIQ as a **known, controllable application** to explore the actual TELA instance's Admin, Knowledge, Assist, Insight, Triage, Impact, and Agent Orchestrator implementations. Some TELA features may be in development; this guide does not claim a working connector where no connector has been verified.

## Keep the two installations separate
- Existing TELA POC stays in its own WSL directory and existing Docker environment.
- TalentIQ runs at `http://127.0.0.1:8091`, separate DB under `data/talentiq.sqlite3` and uploads under `data/resumes`.
- Do not copy actual candidate files into the TELA knowledge store by default.
- TELA should learn the *application*, not ingest its HR database or raw CVs as platform knowledge.

## 1. Prepare TELA Knowledge input
Onboard the following documents and source files through your **installed version's supported Knowledge onboarding workflow**. Verify exact UI names/API routes instead of guessing.

| Artifact | Why TELA needs it |
|---|---|
| `README.md` | Application purpose and running instructions |
| `docs/PRODUCT_REQUIREMENTS.md` | Functional workflow and roles |
| `docs/ARCHITECTURE.md` | Components and data flow |
| `docs/DATA_MODEL.md` | Candidate/jobs/imports/incidents tables |
| `docs/API_REFERENCE.md` and `openapi.json` | REST routes, request/response structure |
| `backend/app.py` | Endpoint orchestration, permissions, telemetry |
| `backend/parser.py` | PDF/Word/OCR processing paths |
| `backend/matcher.py` | Exact ranking algorithm |
| `backend/db.py` | Physical DB schema and seeded synthetic dataset |
| `docs/OPERATIONS_RUNBOOK.md` | Diagnostic guidance and interventions |
| `docs/TELA_TEST_MATRIX.md` | Evidence-backed acceptance scenarios |

**Test the onboarding flow**: source type -> chunking -> local/approved embedding -> search retrieval -> human review/approval -> Assist answer with citations/source attribution. Capture chunk count, job failures and embedding model used. Do not claim TELA understood documents without validating answers against source.

## 2. Validate Assist (source-based questions)
Try:
1. "Which REST API handles candidate search? Show relevant file and function."
2. "How does the application extract text from searchable and scanned PDF files?"
3. "Which columns are stored in the candidates table?"
4. "Explain the score weights and the missing-skill handling."
5. "Can a Delivery Lead view phone numbers? Prove the authorization check."
6. "What remains unimplemented for production HR usage?"

**Expected:** TELA cites onboarded code/docs and accurately distinguishes a proposed feature from existing code. If not, fix ingestion/chunking/retrieval/approval before proceeding.

## 3. Live data is NOT the same as Knowledge
Source document ingestion does **not** magically give TELA access to the latest candidates in SQLite. Use a secured API tool. TalentIQ exposes a protected endpoint with a model-safe response:

```http
POST http://127.0.0.1:8091/api/tela/tools/search-candidates
X-TELA-Service-Key: <set in TALENTIQ_TELA_KEY>
Content-Type: application/json

{"skills":"Java, Spring Boot","min_years":3,"limit":5}
```

Response has anonymized `candidate_ref`, skills, years, score and reasons, **not contact PII**. An HR user with authorization opens the candidate in TalentIQ to see contact information. Even a server-side service key is not a substitute for end-user HR authorization. Model-safe tool output is an intentional architectural choice, not a limitation of TalentIQ HR search.

**Integration steps once TELA's API/tool capability is verified:**
- Set a strong `TALENTIQ_TELA_KEY` on TalentIQ and restart only TalentIQ.
- Register or implement an MCP/HTTP tool adapter in the actual TELA runtime (do not assume that the installed TELA Assist automatically accepts any MCP server).
- Define tool's JSON schema from `openapi.json`, whitelist endpoint and scopes; use service secrets from TELA Vault/approved storage, not prompt text.
- Put TELA and TalentIQ on a reachable, authenticated network; localhost inside a Docker container is **that container**, not WSL host. Choose tested bridge hostname/URL.
- Test with synthetic data and observe audit log; enforce per-user context before exposing PII.
- Validate that TELA prompts cause only allowlisted read-only tool operations.

## 4. Incident + Triage
Go to TalentIQ **TELA Lab** and inject `search_500`. It creates a synthetic incident with trace ID. Inspect `GET /api/ops/incidents` and the application log. Provide the sanitized event and dependency map to TELA through whatever log/incident ingestion mechanism exists in your build (or manually upload a synthetic JSON runbook entry).

Ask:
- "What operation is affected and what evidence supports this diagnosis?"
- "What code path, API, and DB table may be involved?"
- "Which additional log or trace is needed before declaring root cause?"
- "What customer/business operations become unavailable?"

Do not call a generated incident a real search failure: **the v0.1 injector records a synthetic failure but intentionally does not break the live app**. For true RCA testing, later deploy a disposable test stack and introduce actual exceptions, trace and monitoring integration.

## 5. Impact
Supply or ingest `GET /api/ops/dependency-map` into TELA. Have it explain ripple effects of a hypothetical `candidates.skills` column rename: parser/indexing, candidate search API, JD matching and GUI. Verify these against source. This tests candidate/role/API/table relationships; automated dynamic graph building is not asserted.

## 6. Agents + governance
V0.1 supports a **bounded lab resolution**:
1. HR asks `POST /api/ops/reprocess/prepare` with a synthetic incident ID.
2. A *different* `admin` user approves using `POST /api/ops/reprocess/{approval_id}/approve`.
3. Admin executes `POST /api/ops/reprocess/{approval_id}/execute`.
4. Audit log records the action; the result is a synthetic incident status change only.

This is the target controlled workflow for later TELA Agents. Never permit a TELA model unrestricted database modifications, filesystem access, code execution or automatic candidate rejection.

## 7. TELA-generated forms experiment
TalentIQ exposes an existing form schema from `/api/form-definitions/candidate-search`. Feed this contract and the frontend source to TELA Knowledge, then prompt:

> "Propose a candidate search form that uses only TalentIQ's existing search API, with skills, min/max experience, location and result limit. Return a validated JSON field schema and API mapping. Do not call unknown endpoints."

TELA may currently **explain** the source or provide a draft schema. A simple **allowlisted schema-driven form renderer** is provided in TELA Lab for this known TalentIQ search form. However, TELA-generated schemas still require a separate schema-validator/approval workflow and API-action integration before claiming TELA can dynamically construct and execute new forms.

## 8. Evidence to keep for POC review
Capture: screenshots of Knowledge approval, retrieval source references, correct/incorrect Assist answers, tool-call audit, injected incident trace ID, source-to-API impact response, approval IDs and remediation audit. Mark each outcome as `PASS / PARTIAL / NOT IMPLEMENTED / FAIL`.

### Isolated HTTP reproduction
Alongside an injected synthetic incident, TalentIQ offers **Reproduce HTTP** to produce a real non-2xx or delayed response on its *isolated lab endpoint* (`POST /api/ops/lab/reproduce`). It emits a trace ID and log event without breaking the core recruitment workflows. This tests telemetry/API error handling but is **not** equivalent to a real search-service outage. Supply both kinds of evidence to TELA and check if its answer distinguishes simulation from observed failure.
