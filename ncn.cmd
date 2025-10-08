@echo off
cd /d %~dp0

:: ��� node_modules �ļ����Ƿ����
powershell -Command "if (!(Test-Path 'node_modules')) { Write-Host '[��ʾ] δ��⵽ node_modules�����ڰ�װ����...'; pnpm i; if ($LASTEXITCODE -ne 0) { Write-Host '[����] ������װʧ�ܣ���������� pnpm ���á�'; pause; exit } }"
powershell -Command "if (!(Test-Path 'dist/main.js')) { Write-Host '[��ʾ] ���ڱ��� TypeScript...'; pnpm tsc; if ($LASTEXITCODE -ne 0) { Write-Host '[����] ����ʧ�ܡ�'; pause; exit } }"
powershell -Command "if (!(Test-Path 'tasksConfig')) { Write-Host '[��ʾ] ���� tasksConfig Ŀ¼...'; New-Item -ItemType Directory -Path 'tasksConfig' -Force }; if (!(Test-Path 'tasksConfig\tamplate.yaml')) { Write-Host '[��ʾ] ���� tamplate.yaml �ļ�...'; New-Item -ItemType File -Path 'tasksConfig\tamplate.yaml' -Force }; if (!(Test-Path 'tasksConfig\done')) { Write-Host '[��ʾ] ���� done Ŀ¼...'; New-Item -ItemType Directory -Path 'tasksConfig\done' -Force }; if (!(Test-Path 'tasksConfig\undone')) { Write-Host '[��ʾ] ���� undone Ŀ¼...'; New-Item -ItemType Directory -Path 'tasksConfig\undone' -Force }; if (!(Test-Path 'sitemap')) { Write-Host '[��ʾ] ���� sitemap Ŀ¼...'; New-Item -ItemType Directory -Path 'sitemap' -Force }"
powershell -Command "pnpm tsx ./dist/main.js"
pause
