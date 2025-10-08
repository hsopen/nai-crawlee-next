@echo off
cd /d %~dp0

:: ������
powershell -Command "$localLatestTag = git describe --tags --abbrev=0 2>$null; if ($localLatestTag) { $localVersion = $localLatestTag -replace '^v', '' } else { $localVersion = '0.0.0' }; $latestRemoteTag = git ls-remote --tags https://github.com/hsopen/nai-crawlee-next.git | ForEach-Object { $_.Split()[1] } | Where-Object { $_ -match '^refs/tags/v' } | ForEach-Object { $_.Replace('refs/tags/v', '') } | Sort-Object -Descending | Select-Object -First 1; if ($latestRemoteTag -and ([version]$latestRemoteTag -gt [version]$localVersion)) { Write-Host \"[��ʾ] �����°汾 v$latestRemoteTag��������ȡ����...\"; git pull; if ($LASTEXITCODE -ne 0) { Write-Host '[����] ��ȡʧ�ܡ�'; pause; exit } }"

:: ��� node_modules �ļ����Ƿ����
powershell -Command "if (!(Test-Path 'node_modules')) { Write-Host '[��ʾ] δ��⵽ node_modules�����ڰ�װ����...'; pnpm i; if ($LASTEXITCODE -ne 0) { Write-Host '[����] ������װʧ�ܣ���������� pnpm ���á�'; pause; exit } }"
powershell -Command "if (!(Test-Path 'dist/main.js')) { Write-Host '[��ʾ] ���ڱ��� TypeScript...'; pnpm tsc; if ($LASTEXITCODE -ne 0) { Write-Host '[����] ����ʧ�ܡ�'; pause; exit } }"
powershell -Command "if (!(Test-Path 'tasksConfig')) { Write-Host '[��ʾ] ���� tasksConfig Ŀ¼...'; New-Item -ItemType Directory -Path 'tasksConfig' -Force }; if (!(Test-Path 'tasksConfig\tamplate.yaml')) { Write-Host '[��ʾ] ���� tamplate.yaml �ļ�...'; New-Item -ItemType File -Path 'tasksConfig\tamplate.yaml' -Force }; if (!(Test-Path 'tasksConfig\done')) { Write-Host '[��ʾ] ���� done Ŀ¼...'; New-Item -ItemType Directory -Path 'tasksConfig\done' -Force }; if (!(Test-Path 'tasksConfig\undone')) { Write-Host '[��ʾ] ���� undone Ŀ¼...'; New-Item -ItemType Directory -Path 'tasksConfig\undone' -Force }; if (!(Test-Path 'sitemap')) { Write-Host '[��ʾ] ���� sitemap Ŀ¼...'; New-Item -ItemType Directory -Path 'sitemap' -Force }"
powershell -Command "pnpm tsx ./dist/main.js"
pause
