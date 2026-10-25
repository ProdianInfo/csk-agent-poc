# TELA Component Test Matrix for TalentIQ

| # | TELA capability | Target POC experiment | Evidence / acceptance | Current TalentIQ support |
|---|---|---|---|---|
| A01 | Admin | Onboard TalentIQ as application with distinct roles | Authorized application, model config, tenant/role evidence | Docs ready; configure in actual TELA |
| K01 | Knowledge | Ingest MD, source, OpenAPI/schema | Indexed chunks + versions + approval record | Artifacts provided; TELA ingestion unverified |
| K02 | Knowledge | Search "OCR pipeline" | Correct files/code cited | Artifacts provided |
| K03 | Knowledge | Modify ranking file, re-onboard | Versioning/approval shows changed source | Perform in TELA |
| AS01 | Assist | "What endpoint searches candidates?" | Grounded `GET /api/candidates` source citation | Code/docs ready |
| AS02 | Assist | "Explain score weights" | Exact 65/20/10/5 and missing skills | Code/docs ready |
| AS03 | Assist + tool | "Find Java, 3+ years" | Approved tool called with correct filters; no PII in model context | Protected API exists; connector not shipped |
| AS04 | Assist UI | "Generate candidate-search form" | Structured schema validated before rendering | Static form schema and allowlisted runtime preview exist; generation by TELA not shipped |
| IN01 | Insight | Candidate skill distribution | Compare result to TalentIQ dashboard | Dashboard exists; TELA connection not shipped |
| TR01 | Triage | Inject OCR incident | Trace + impacted parser path + missing evidence | Synthetic injector exists |
| TR02 | Triage | Inject candidate search 500 incident | Trace + correct affected API/table | Synthetic injector exists |
| IM01 | Impact | Rename `candidates.skills` hypothetically | Identify search/matcher/import/UI changes | Curated dependency map exists |
| AG01 | Agents | Prepare safe resolution | Approval request generated | Local API exists; TELA agent connector not shipped |
| AG02 | Agents | Four-eyes authorization | Requester cannot approve own action | Local API + tests exist |
| GOV01 | Governance | Lead attempts contact view | Redaction and HTTP 403 for writes | Demo check exists; production RBAC not shipped |
| GOV02 | Governance | External model receives only non-PII tool payload | No name/email/phone in tool response | Tool redaction implemented |
| OBS01 | Observability | Associate incident with trace ID | Trace available in log and incident API | Structured local logs; TELA telemetry ingestion not shipped |

## Deliberate defect catalogue
1. `resume_parser_error`: planned OCR import failure with `backend/parser.py` dependency.
2. `search_500`: planned search API HTTP 500 with matcher/DB dependency.
3. `schema_drift`: mismatch between candidate table and matcher queries.
4. `search_latency`: lookup slowdown, query/index analysis.

**Important:** These four scenarios currently generate labelled **synthetic lab events** only; they do not actually throw HTTP 500, migrate schema or degrade request latency. Later, isolate real bug fixtures under a disposable test deployment for end-to-end incident ingestion and RCA evaluation.

## TELA evaluation scorecard
Per test record: Test ID, TELA version/commit, ingestion source/version, query, intended answer, actual answer, source citations, tool-call evidence, outcome, gap type (knowledge/retrieval/tool/auth/graph/agent), owner and fix.
