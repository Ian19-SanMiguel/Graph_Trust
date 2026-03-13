param(
    [switch]$NoInstall,
    [switch]$Reload
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$aiDir = Join-Path $root "ai-engine"

if (-not (Test-Path $aiDir)) {
    throw "ai-engine folder not found at: $aiDir"
}

Set-Location $aiDir

if (-not $env:GRAPH_STORE_BACKEND) {
    $env:GRAPH_STORE_BACKEND = "firestore"
}

if (-not $env:AI_ALLOW_SQLITE_FALLBACK) {
    $env:AI_ALLOW_SQLITE_FALLBACK = "false"
}

if (-not $env:AI_HOST) {
    $env:AI_HOST = "127.0.0.1"
}

if (-not $env:AI_PORT) {
    $env:AI_PORT = "8000"
}

if (-not $env:FIREBASE_PROJECT_ID) {
    $backendEnvPath = Join-Path $root "backend\.env"
    if (Test-Path $backendEnvPath) {
        $projectLine = Get-Content $backendEnvPath | Where-Object { $_ -match '^FIREBASE_PROJECT_ID=' } | Select-Object -First 1
        if ($projectLine) {
            $env:FIREBASE_PROJECT_ID = ($projectLine -replace '^FIREBASE_PROJECT_ID=', '').Trim()
        }
    }
}

if (-not $env:FIREBASE_CREDENTIALS_PATH) {
    $backendEnvPath = Join-Path $root "backend\.env"
    if (Test-Path $backendEnvPath) {
        $credPathLine = Get-Content $backendEnvPath | Where-Object { $_ -match '^FIREBASE_CREDENTIALS_PATH=' } | Select-Object -First 1
        if ($credPathLine) {
            $env:FIREBASE_CREDENTIALS_PATH = ($credPathLine -replace '^FIREBASE_CREDENTIALS_PATH=', '').Trim()
        }
    }
}

if (-not $env:FIREBASE_SERVICE_ACCOUNT_JSON) {
    $backendEnvPath = Join-Path $root "backend\.env"
    if (Test-Path $backendEnvPath) {
        $jsonLine = Get-Content $backendEnvPath | Where-Object { $_ -match '^FIREBASE_SERVICE_ACCOUNT_JSON=' } | Select-Object -First 1
        if ($jsonLine) {
            $env:FIREBASE_SERVICE_ACCOUNT_JSON = ($jsonLine -replace '^FIREBASE_SERVICE_ACCOUNT_JSON=', '').Trim()
        }
    }
}

if ($env:FIREBASE_CREDENTIALS_PATH -and -not [System.IO.Path]::IsPathRooted($env:FIREBASE_CREDENTIALS_PATH)) {
    $env:FIREBASE_CREDENTIALS_PATH = Join-Path $root $env:FIREBASE_CREDENTIALS_PATH
}

if (-not $env:FIREBASE_CREDENTIALS_PATH) {
    $defaultCredPath = Join-Path $root "backend\credentials\firebase-service-account.json"
    if (Test-Path $defaultCredPath) {
        $env:FIREBASE_CREDENTIALS_PATH = $defaultCredPath
    }
}

if ($env:GRAPH_STORE_BACKEND -eq "firestore") {
    $hasInlineJson = -not [string]::IsNullOrWhiteSpace($env:FIREBASE_SERVICE_ACCOUNT_JSON)
    $hasCredPath = -not [string]::IsNullOrWhiteSpace($env:FIREBASE_CREDENTIALS_PATH)
    $hasAdcPath = -not [string]::IsNullOrWhiteSpace($env:GOOGLE_APPLICATION_CREDENTIALS)
    $hasAnyCredentialHint = $hasInlineJson -or $hasCredPath -or $hasAdcPath

    if (-not $hasAnyCredentialHint) {
        throw @"
Missing Firebase Admin credentials for AI Firestore mode.

Set one of these before running:
  1) FIREBASE_CREDENTIALS_PATH=C:\path\to\service-account.json
  2) GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\service-account.json
  3) FIREBASE_SERVICE_ACCOUNT_JSON=<single-line service account json>

You can place FIREBASE_CREDENTIALS_PATH in backend/.env and this script will auto-load it.
"@
    }

    if ($hasCredPath -and -not (Test-Path $env:FIREBASE_CREDENTIALS_PATH)) {
        $defaultCredPath = Join-Path $root "backend\credentials\firebase-service-account.json"
        if (Test-Path $defaultCredPath) {
            $env:FIREBASE_CREDENTIALS_PATH = $defaultCredPath
        }
        else {
            throw "FIREBASE_CREDENTIALS_PATH does not exist: $($env:FIREBASE_CREDENTIALS_PATH)"
        }
    }

    if ($hasAdcPath -and -not (Test-Path $env:GOOGLE_APPLICATION_CREDENTIALS)) {
        throw "GOOGLE_APPLICATION_CREDENTIALS does not exist: $($env:GOOGLE_APPLICATION_CREDENTIALS)"
    }
}

$venvDir = Join-Path $aiDir ".venv"
$python = Join-Path $venvDir "Scripts\python.exe"

if (-not (Test-Path $python)) {
    Write-Host "Creating Python virtual environment (.venv)..."

    $pyCommand = Get-Command py -ErrorAction SilentlyContinue
    if ($pyCommand) {
        & py -3.11 -m venv $venvDir
    }
    else {
        $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
        if (-not $pythonCommand) {
            throw "Python was not found. Install Python 3.11+ and ensure 'py' or 'python' is in PATH."
        }

        & python -m venv $venvDir
    }

    if (-not (Test-Path $python)) {
        throw "Virtual environment creation failed. Expected interpreter at: $python"
    }
}

if (-not $NoInstall) {
    Write-Host "Installing/updating AI engine dependencies..."
    & $python -m pip install --upgrade pip
    & $python -m pip install -r requirements.txt
}

Write-Host "Starting AI engine at http://$($env:AI_HOST):$($env:AI_PORT) ..."

$uvicornArgs = @("-m", "uvicorn", "main:app", "--host", $env:AI_HOST, "--port", $env:AI_PORT)
if ($Reload) {
    $uvicornArgs += "--reload"
}

& $python @uvicornArgs