# TalentIQ — Delivery Roadmap

## P0 — Delivered now (local lab)
Local UI, synthetic candidates, OCR ingest, manual/CSV candidate import, explainable skills-first ranking, JD records and match lists, pipeline, basic demo role boundaries, lab incidents/trace IDs, dependency map, TELA tool boundary and documentation/tests.

## P1 — HR pilot candidate (next implementation)
- HR-verified structured resume parsing; candidate detail editing; true experience-per-skill, skills aliases and duplicate merging.
- PostgreSQL migrations, object storage, antivirus, audit/consent/retention, Keycloak/Entra SSO and deployment CI/CD.
- Background import workers, resumable batches, folder sync agent and reliable file processing queues.
- JD document upload and automatic field extraction with human approval.
- Better matching evaluation including synonyms/embeddings, explainability and candidate feedback.

## P2 — TELA functional demonstration
- Register TalentIQ as approved application in TELA with source/version/ingestion job states.
- Knowledge Q&A verification with evidence; approved API/MCP tool configured against anonymized live data.
- OpenTelemetry integration with collection into TELA Triage, live source-impact dependency graph, approved incident templates.
- Form JSON schema generator + validator + browser renderer; no arbitrary dynamic code execution.
- Read-only investigation agent, human-gated incident remediation and signed audit proof.

## P3 — Full recruitment product
Interview schedules, evaluation forms, recruiter mailbox integration, dashboards by demand/fulfillment, consent ledger, secure sourcing integrations (when licensed), production support and policy governance.

## Platform stack decision
FastAPI/SQLite/dependency-free web is an intentional **rapid POC delivery**, not a commitment to long-term Prodian standards. Decide whether to keep this stack or migrate API to Spring Boot 3.x, UI to React+TS and database to PostgreSQL in P1. Preserve OpenAPI contracts and skill-ranking behavior during migration.
