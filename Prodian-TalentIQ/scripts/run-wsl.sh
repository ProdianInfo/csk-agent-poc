#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
if [ ! -f .env ]; then cp .env.example .env; echo 'Edit .env secrets before any wider use.'; fi
set -a; source .env; set +a
exec uvicorn backend.app:app --host 127.0.0.1 --port 8091
