Set-Location $PSScriptRoot

# ������
$localLatestTag = git describe --tags --abbrev=0
if ($LASTEXITCODE -eq 0) { $localVersion = $localLatestTag -replace '^v', '' } else { $localVersion = '0.0.0' }
$latestRemoteTag = git ls-remote --tags https://github.com/hsopen/nai-crawlee-next.git | ForEach-Object { $_.Split()[1] } | Where-Object { $_ -match '^refs/tags/v' } | ForEach-Object { $_.Replace('refs/tags/v', '') } | Sort-Object -Descending | Select-Object -First 1
$remoteDisplay = if ($latestRemoteTag) { "v$latestRemoteTag" } else { "��" }
Write-Host "���ذ汾��v$localVersion"
Write-Host "Զ�̰汾��$remoteDisplay"
if (!(Test-Path '.git')) {
    Write-Host "[��ʾ] ���ز��� Git �ֿ⣬���ڳ�ʼ������ȡ���°汾 v$latestRemoteTag..."
    git init
    git remote add origin https://github.com/hsopen/nai-crawlee-next.git
    git fetch --tags
    git checkout v$latestRemoteTag
    if ($LASTEXITCODE -ne 0) { Write-Host '[����] ��ȡʧ�ܡ�'; Read-Host "Press Enter to exit"; exit }
    # ���°�װ�����ͱ���
    Write-Host '[��ʾ] �������°�װ����...'
    pnpm i
    if ($LASTEXITCODE -ne 0) { Write-Host '[����] ������װʧ�ܡ�'; Read-Host "Press Enter to exit"; exit }
    Write-Host '[��ʾ] �������±��� TypeScript...'
    pnpm tsc
    if ($LASTEXITCODE -ne 0) { Write-Host '[����] ����ʧ�ܡ�'; Read-Host "Press Enter to exit"; exit }
} elseif ($latestRemoteTag -and ([version]$latestRemoteTag -gt [version]$localVersion)) {
    Write-Host "[��ʾ] �����°汾 v$latestRemoteTag��������ȡ����..."
    git pull
    if ($LASTEXITCODE -ne 0) { Write-Host '[����] ��ȡʧ�ܡ�'; Read-Host "Press Enter to exit"; exit }
    # ���°�װ�����ͱ���
    Write-Host '[��ʾ] �������°�װ����...'
    pnpm i
    if ($LASTEXITCODE -ne 0) { Write-Host '[����] ������װʧ�ܡ�'; Read-Host "Press Enter to exit"; exit }
    Write-Host '[��ʾ] �������±��� TypeScript...'
    pnpm tsc
    if ($LASTEXITCODE -ne 0) { Write-Host '[����] ����ʧ�ܡ�'; Read-Host "Press Enter to exit"; exit }
}

# ��� node_modules �ļ����Ƿ����
if (!(Test-Path 'node_modules')) { Write-Host '[��ʾ] δ��⵽ node_modules�����ڰ�װ����...'; pnpm i; if ($LASTEXITCODE -ne 0) { Write-Host '[����] ������װʧ�ܣ���������� pnpm ���á�'; Read-Host "Press Enter to exit"; exit } }

# ������
if (!(Test-Path 'dist/main.js')) { Write-Host '[��ʾ] ���ڱ��� TypeScript...'; pnpm tsc; if ($LASTEXITCODE -ne 0) { Write-Host '[����] ����ʧ�ܡ�'; Read-Host "Press Enter to exit"; exit } }

# ������Ҫ�ļ�
if (!(Test-Path 'tasksConfig')) { Write-Host '[��ʾ] ���� tasksConfig Ŀ¼...'; New-Item -ItemType Directory -Path 'tasksConfig' -Force }
if (!(Test-Path 'tasksConfig\tamplate.yaml')) { Write-Host '[��ʾ] ���� tamplate.yaml �ļ�...'; New-Item -ItemType File -Path 'tasksConfig\tamplate.yaml' -Force }
if (!(Test-Path 'tasksConfig\done')) { Write-Host '[��ʾ] ���� done Ŀ¼...'; New-Item -ItemType Directory -Path 'tasksConfig\done' -Force }
if (!(Test-Path 'tasksConfig\undone')) { Write-Host '[��ʾ] ���� undone Ŀ¼...'; New-Item -ItemType Directory -Path 'tasksConfig\undone' -Force }
if (!(Test-Path 'sitemap')) { Write-Host '[��ʾ] ���� sitemap Ŀ¼...'; New-Item -ItemType Directory -Path 'sitemap' -Force }

# ����������
pnpm exec tsx ./dist/main.js

Read-Host "Press Enter to continue"