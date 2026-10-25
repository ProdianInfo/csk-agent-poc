# TalentIQ Local POC — Operations Runbook

## Start / stop
```bash
cd ~/projects/Prodian-TalentIQ
source .venv/bin/activate
set -a; source .env; set +a
uvicorn backend.app:app --host 127.0.0.1 --port 8091 --reload
```
Stop with Ctrl+C. Do not run on `0.0.0.0` with seeded demo credentials.

## Check
```bash
curl -sS http://127.0.0.1:8091/api/ops/health
python -m pytest -q tests
```
Inspect terminal for `request trace=... path=... status=... ms=...` lines. Logs intentionally avoid resume body or candidate contact fields.

## OCR failure diagnostic
- Check Tesseract: `tesseract --version`.
- Check Python packages: `python -c "import fitz,pytesseract,docx,pypdf;print('OK')"`.
- Scanned PDFs must be correctly rendered; first 12 pages OCRed, up to 30 PDF pages allowed, large images limited.
- If TXT/DOCX parses but scanned PDF fails, isolate Tesseract installation or PDF rendering, not the candidate DB.
- If `.doc` fails, check LibreOffice is installed or convert manually to DOCX.

## Import failures
- A repeated SHA-256 file is flagged duplicate.
- A repeated email is flagged duplicate; HR should review rather than create a second unrelated record.
- Invalid type, empty, >10MB or unreadable files are rejected. Import Center shows per-file outcome.
- Data quality is heuristic; all imported profiles need human verification.

## Search failure triage
- Trace route `GET /api/candidates` in `backend/app.py`.
- Ranking is `backend/matcher.py:rank_candidate()`; persistence in `backend/db.py`.
- Table `candidates`, indexed `email`/`resume_hash`; production skill indexing is not available yet.
- If candidate misses matching despite a skill, verify alias normalization and parser extraction. Use a known synthetic sample to reproduce.

## Simulated errors
Admin opens TELA Lab and injects incident. This writes a **simulated incident**, not a real service error. Read incident `trace_id` and `/api/ops/dependency-map`, analyze with TELA, then use the separate HR/admin approval workflow to resolve lab status. Never interpret this as autonomous production patching.

## Backup / restore (local lab only)
- Stop server first, then copy `data/talentiq.sqlite3` and `data/resumes/` together to an encrypted local backup location.
- SQLite WAL files may exist; use SQLite backup API or `sqlite3 .backup` for online backups.
- Do not commit `data/` or resumes to Git.
- To reset **synthetic lab only**, stop service and remove local `data/talentiq.sqlite3`; it will reseed. This destroys locally imported candidate records, so never run after adding real data.

## Incident severity
- `critical` search failure blocks candidate shortlist.
- `high` importer/OCR failure blocks onboarding of resumes.
- `medium` latency slows HR productivity.
- The synthetic incident severity is a demo label, not an operational SLO measurement.

## Reproduce isolated HTTP errors
In TELA Lab use **Reproduce HTTP** for a real HTTP 500/422 or delayed response on the isolated `POST /api/ops/lab/reproduce` endpoint. That endpoint logs `LAB_REPRODUCED` with trace ID, but **never damages or disables the normal candidate-search or importer endpoints**. Create a synthetic incident separately via **Create incident**. For production-like RCA, deploy a disposable integration test environment with genuine errors in the business code.
