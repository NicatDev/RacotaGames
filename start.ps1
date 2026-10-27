$ErrorActionPreference = 'Stop'
$racotaRoot = $PSScriptRoot
$racotaPython = Join-Path $racotaRoot '.venv/Scripts/python.exe'
if (!(Test-Path -LiteralPath $racotaPython)) { throw 'First create .venv and install backend/requirements.txt. See README.md.' }
& $racotaPython (Join-Path $racotaRoot 'backend/manage.py') migrate
if ($LASTEXITCODE -ne 0) { throw 'Database migration failed.' }
$racotaBackend = Start-Process -FilePath $racotaPython -ArgumentList @('backend/manage.py','runserver','127.0.0.1:8010','--noreload') -WorkingDirectory $racotaRoot -WindowStyle Hidden -PassThru
try {
    Push-Location $racotaRoot
    npm.cmd --prefix frontend run dev
} finally {
    Pop-Location
    if (!$racotaBackend.HasExited) { Stop-Process -Id $racotaBackend.Id }
}
