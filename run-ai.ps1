param(
    [switch]$NoInstall
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$aiDir = Join-Path $root "ai-engine"

if (-not (Test-Path $aiDir)) {
    throw "ai-engine folder not found at: $aiDir"
}

Set-Location $aiDir

$python = Join-Path $aiDir ".venv311\Scripts\python.exe"

if (-not (Test-Path $python)) {
    Write-Host "Creating Python 3.11 virtual environment (.venv311)..."
    py -3.11 -m venv .venv311
}

if (-not $NoInstall) {
    Write-Host "Installing/updating AI engine dependencies..."
    & $python -m pip install --upgrade pip
    & $python -m pip install -r requirements.txt
}

Write-Host "Starting AI engine at http://127.0.0.1:8000 ..."
& $python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload