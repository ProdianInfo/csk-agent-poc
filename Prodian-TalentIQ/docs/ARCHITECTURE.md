# TalentIQ — Technical and Integration Architecture

## Current executable POC

```mermaid
flowchart TD
    HR[HR Browser / Chrome / Edge] --> UI[Responsive TalentIQ UI\nHTML + JS + CSS]
    UI -->|Cookie Session + REST| API[FastAPI :8091]
    API --> Candidate[Candidate Search / JD Matching]
    API --> Import[Document Import Service]
    API --> Workflow[Recruitment Workflow]
    Candidate --> DB[(SQLite candidate DB)]
    Workflow --> DB
    Import --> OCR[Python parser / pypdf / docx / Tesseract OCR]
    OCR --> DB
    Import --> Files[(Separate resume file store)]
    API --> Ops[Structured logs / incidents / dependency map]
    TELA[TELA independent platform] -.->|approved read-only API, service key| API
    TELA -.->|manual knowledge onboarding| Docs[Architecture / OpenAPI / Code / Schema / Runbooks]
```

## Boundary ownership
- **TalentIQ** owns resumes, candidate records, HR workflow, ranking, matching and recruitment state.
- **TELA** owns enterprise knowledge, prompts/retrieval, grounded application interpretation, diagnostic workflows and agent orchestration once implemented/configured.
- TalentIQ has no direct dependency on TELA to run.
- They use separate database/storage, credentials and ports.

## Data processing
`User selects local files -> browser multipart upload -> type/size/hash checks -> parser (PDF/DOCX/OCR/CSV) -> candidate record + original file -> search/match UI`. Original resumes stay in local `data/resumes`. No external OCR/LLM calls are made by TalentIQ v0.1.

## Search and ranking
Candidate skills stored as normalized comma-separated technical terms in prototype. Search uses application code and SQLite rows. Production architecture should move to normalized skills tables + PostgreSQL indexes, and optionally pgvector for **local** semantic matching. Keep scoring explainable and separate from optional LLM recommendations.

## TELA flows
1. **Knowledge**: repo files / markdown / OpenAPI / schema are ingested via supported TELA UI/capability; chunks embedded and approved under configured TELA governance.
2. **Assist architecture**: TELA retrieves relevant knowledge to explain endpoint, modules, data flow with citations.
3. **Assist operational query**: authorized tool uses POST `/api/tela/tools/search-candidates`; only returns anonymized candidate refs and skill-match evidence. HR user opens the corresponding record in TalentIQ for contact details.
4. **Triage**: lab incident logs/trace plus approved knowledge become the diagnostic input. In v0.1 ingestion of this telemetry into TELA is **manual**, unless an actual connector has been configured.
5. **Impact**: GET `/api/ops/dependency-map` tells which code, APIs and tables a simulated failure affects. Graph automation is a future increment.
6. **Agents**: a prepare/approve/execute loop resolves a synthetic incident status after four-eyes approval. Real production remediation remains disabled.

## Target production architecture (not delivered yet)
```mermaid
flowchart LR
    FE[React + TS / SSO] --> BE[Spring Boot or hardened FastAPI]
    BE --> DB[(PostgreSQL / pgvector)]
    BE --> OBJ[(Encrypted object store)]
    BE --> W[Queue + sandboxed OCR workers]
    BE --> OBS[OpenTelemetry / logs]
    TELA[TELA] --> GW[Policy API / MCP gateway]
    GW --> BE
    OBS --> TELA
```

## Privacy boundary
TalentIQ is the source of truth for PII; model-facing tools return candidate references instead of names, phones, emails and raw resume text. This differs from a direct HR UI search, where role-approved contact fields are displayed. Any future tool that releases contact details needs explicit per-user authorization, audit and deployment-specific LLM policy.
