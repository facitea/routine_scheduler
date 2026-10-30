@echo off
if exist "%~dp0tools\firebase-tools-win.exe" (
  "%~dp0tools\firebase-tools-win.exe" %*
) else (
  npx --yes firebase-tools %*
)
