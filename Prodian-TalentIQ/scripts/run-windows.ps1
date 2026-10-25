$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if (!(Test-Path '.venv')) { py -m venv .venv }
& '.\.venv\Scripts\python.exe' -m pip install -r requirements.txt
if (!(Test-Path '.env')) { Copy-Item '.env.example' '.env' }
Get-Content '.env' | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
        $name, $value = $line.Split('=',2)
        [Environment]::SetEnvironmentVariable($name.Trim(),$value.Trim(),'Process')
    }
}
Write-Host 'Opening TalentIQ at http://localhost:8091'
& '.\.venv\Scripts\python.exe' -m uvicorn backend.app:app --host 127.0.0.1 --port 8091
