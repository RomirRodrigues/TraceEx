# TraceEx PowerShell Runner
$ErrorActionPreference = "Stop"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    Launching TraceEx Expense Tracker (Java)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$correttoBin = "C:\Users\ROMIR RODRIGUES\.jdks\corretto-11.0.30\bin"
if (Test-Path "$correttoBin\javac.exe") {
    $javac = "$correttoBin\javac.exe"
    $java  = "$correttoBin\java.exe"
} elseif ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\javac.exe")) {
    $javac = "$env:JAVA_HOME\bin\javac.exe"
    $java  = "$env:JAVA_HOME\bin\java.exe"
} else {
    $javac = "javac"
    $java  = "java"
}

if (-not (Test-Path "bin"))  { New-Item -ItemType Directory -Path "bin"  | Out-Null }
if (-not (Test-Path "data")) { New-Item -ItemType Directory -Path "data" | Out-Null }

Write-Host "[1/2] Compiling TraceEx Java Backend..." -ForegroundColor Green
$files = Get-ChildItem -Path "src" -Filter "*.java" -Recurse | Select-Object -ExpandProperty FullName
& $javac -encoding UTF-8 -d bin $files

Write-Host "[2/2] Starting TraceEx Server on http://localhost:8080 ..." -ForegroundColor Green
& $java -cp bin com.traceex.Main
