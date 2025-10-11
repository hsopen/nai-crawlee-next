
Set-Location $PSScriptRoot

function Show-Info($msg) { Write-Host "[��Ϣ] $msg" }
function Show-Warn($msg) { Write-Host "[����] $msg" }
function Show-Error($msg) { Write-Host "[����] $msg" }

# ����Ŀ¼/�ļ�����
function Ensure-Exists($type, $path) {
    if (!(Test-Path $path)) {
        if ($type -eq 'Directory') {
            Show-Info "����Ŀ¼ $path ..."
            New-Item -ItemType Directory -Path $path -Force | Out-Null
        } elseif ($type -eq 'File') {
            Show-Info "�����ļ� $path ..."
            New-Item -ItemType File -Path $path -Force | Out-Null
        }
    }
}

# ������
$localLatestTag = git describe --tags --abbrev=0
if ($LASTEXITCODE -eq 0) { $localVersion = $localLatestTag -replace '^v', '' } else { $localVersion = '0.0.0' }
$latestRemoteTag = $null
try {
    $latestRemoteTag = git ls-remote --tags https://github.com/hsopen/nai-crawlee-next.git | ForEach-Object { $_.Split()[1] } | Where-Object { $_ -match '^refs/tags/v' } | ForEach-Object { $_.Replace('refs/tags/v', '') } | Sort-Object -Descending | Select-Object -First 1
} catch {
    Show-Warn "Զ�̰汾��ȡʧ�ܣ������ GitHub �����쳣��"
}
$remoteDisplay = if ($latestRemoteTag) { "v$latestRemoteTag" } else { "��" }
Show-Info "���ذ汾��v$localVersion"
Show-Info "Զ�̰汾��$remoteDisplay"

if (!(Test-Path '.git')) {
    Show-Info "���ز��� Git �ֿ⣬���ڳ�ʼ������ȡ���°汾 v$latestRemoteTag ..."
    git init
    git remote add origin https://github.com/hsopen/nai-crawlee-next.git
    git fetch --tags
    git checkout v$latestRemoteTag
    if ($LASTEXITCODE -ne 0) { Show-Error "��ȡʧ�ܡ�"; Read-Host "���س��˳�"; exit }
    Show-Info "�������°�װ���� ..."
    pnpm i
    if ($LASTEXITCODE -ne 0) { Show-Error "������װʧ�ܡ�"; Read-Host "���س��˳�"; exit }
    Show-Info "�������±��� TypeScript ..."
    pnpm tsc
    if ($LASTEXITCODE -ne 0) { Show-Error "����ʧ�ܡ�"; Read-Host "���س��˳�"; exit }
} elseif ($latestRemoteTag -and ([version]($latestRemoteTag -replace '^refs/tags/v', '') -gt [version]$localVersion)) {
    Show-Info "�����°汾 v$latestRemoteTag��������ȡ���� ..."
    git pull
    if ($LASTEXITCODE -ne 0) { Show-Error "��ȡʧ�ܡ�"; Read-Host "���س��˳�"; exit }
    Show-Info "�������°�װ���� ..."
    pnpm i
    if ($LASTEXITCODE -ne 0) { Show-Error "������װʧ�ܡ�"; Read-Host "���س��˳�"; exit }
    Show-Info "�������±��� TypeScript ..."
    pnpm tsc
    if ($LASTEXITCODE -ne 0) { Show-Error "����ʧ�ܡ�"; Read-Host "���س��˳�"; exit }
}

# ��� node_modules �ļ����Ƿ����
if (!(Test-Path 'node_modules')) {
    Show-Info "δ��⵽ node_modules�����ڰ�װ���� ..."
    pnpm i
    if ($LASTEXITCODE -ne 0) { Show-Error "������װʧ�ܣ���������� pnpm ���á�"; Read-Host "���س��˳�"; exit }
}

# ������
if (!(Test-Path 'dist/main.js')) {
    Show-Info "���ڱ��� TypeScript ..."
    pnpm tsc
    if ($LASTEXITCODE -ne 0) { Show-Error "����ʧ�ܡ�"; Read-Host "���س��˳�"; exit }
}

# ������Ҫ�ļ���Ŀ¼
Ensure-Exists Directory 'tasksConfig'
Ensure-Exists File 'tasksConfig\tamplate.yaml'
Ensure-Exists Directory 'tasksConfig\done'
Ensure-Exists Directory 'tasksConfig\undone'
Ensure-Exists Directory 'sitemap'

# ����������
try {
    pnpm exec tsx ./dist/main.js
    if ($LASTEXITCODE -ne 0) { throw "����������ʧ�ܡ�" }
} catch {
    Show-Error $_
    Read-Host "���س��˳�"
    exit
}

Read-Host "���س�����"