# TalentIQ v0.1.1 – PDF import and HR correction patch

## What is fixed

- Candidate name extraction no longer interprets headings such as `B.E. Computer Science And` as the person's name.
- Handles explicit `Name:` fields, conservative top-of-resume headings, document filenames and email-based fallback.
- Better matching of phrases such as `Total Experience: 4 years and 6 months` and `5.5 years of experience`.
- Candidate detail screen now has **Review / Edit details** for HR/Admin, allowing verified corrections to name, email, phone, experience, skills, location, availability.
- Verification is recorded through an audited PATCH endpoint; original uploaded resume and candidate ID remain unchanged.
- Retains the prior `/api/jobs/{id}/matches` `limit=100` bug fix.

## Install on Windows into your EXISTING project

1. Stop server (`Ctrl+C`). Make a separate backup of your project, particularly `data/`.
2. Extract this patch archive **into** `C:\Guru\Prodian\Projects\Prodian-TalentIQ\`. It contains `backend/`, `web/`, `tests/` and this note. Allow overwriting the files in those folders.
3. No data files or `.env` files are included in this patch. Do not delete `data/talentiq.sqlite3`.
4. In VS Code PowerShell terminal, run `.\.venv\Scripts\python.exe -m pytest -q`.
5. Start the existing server using `.\scripts\run-windows.ps1` and refresh browser with `Ctrl+Shift+R`.
6. Search for the previously imported candidate, choose **View** -> **Review / Edit details**. Compare the original CV, correct details, check confirmation, Save.

## Limitations

- This is an improved heuristic parser, not guaranteed correct for any specific real CV layout. HR review is still mandatory.
- Existing candidate rows do not reparse automatically; use the new edit screen for the current incorrect row.
- Tesseract must be installed and configured on Windows for scanned PDF OCR.
- Matching and OCR remain POC-grade; more robust extraction, CV previews, scoring and SSO are future milestones.
- Keep real resumes, the SQLite DB, `.env`, local secrets and personal information out of PUBLIC GitHub.
