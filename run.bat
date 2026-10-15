@echo off
setlocal enabledelayedexpansion
title TraceEx - The Ultimate Expense Tracker

echo ===================================================
echo     Launching TraceEx Expense Tracker (Java)
echo ===================================================

rem Check for JDK in Corretto directory or system PATH
set "JAVAC_EXE=javac"
set "JAVA_EXE=java"

if exist "C:\Users\ROMIR RODRIGUES\.jdks\corretto-11.0.30\bin\javac.exe" (
    set "JAVAC_EXE=C:\Users\ROMIR RODRIGUES\.jdks\corretto-11.0.30\bin\javac.exe"
    set "JAVA_EXE=C:\Users\ROMIR RODRIGUES\.jdks\corretto-11.0.30\bin\java.exe"
) else if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\javac.exe" (
        set "JAVAC_EXE=%JAVA_HOME%\bin\javac.exe"
        set "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
    )
)

rem Create output directories if needed
if not exist "bin" mkdir "bin"
if not exist "data" mkdir "data"

echo [1/2] Compiling TraceEx Java backend...
dir /s /b src\*.java > sources.txt
"%JAVAC_EXE%" -encoding UTF-8 -d bin @sources.txt
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Compilation failed.
    del sources.txt 2>nul
    pause
    exit /b %ERRORLEVEL%
)
del sources.txt 2>nul

echo [2/2] Starting TraceEx Server...
echo.
"%JAVA_EXE%" -cp bin com.traceex.Main

pause
