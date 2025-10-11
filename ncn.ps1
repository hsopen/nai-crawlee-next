
Set-Location $PSScriptRoot

function Show-Info($msg) { Write-Host "[信息] $msg" }
function Show-Warn($msg) { Write-Host "[警告] $msg" }
function Show-Error($msg) { Write-Host "[错误] $msg" }

# 创建目录/文件工具
function Ensure-Exists($type, $path) {
    if (!(Test-Path $path)) {
        if ($type -eq 'Directory') {
            Show-Info "创建目录 $path ..."
            New-Item -ItemType Directory -Path $path -Force | Out-Null
        } elseif ($type -eq 'File') {
            Show-Info "创建文件 $path ..."
            New-Item -ItemType File -Path $path -Force | Out-Null
        }
    }
}

# 检查更新
$localLatestTag = git describe --tags --abbrev=0
if ($LASTEXITCODE -eq 0) { $localVersion = $localLatestTag -replace '^v', '' } else { $localVersion = '0.0.0' }
$latestRemoteTag = $null
try {
    $latestRemoteTag = git ls-remote --tags https://github.com/hsopen/nai-crawlee-next.git | ForEach-Object { $_.Split()[1] } | Where-Object { $_ -match '^refs/tags/v' } | ForEach-Object { $_.Replace('refs/tags/v', '') } | Sort-Object -Descending | Select-Object -First 1
} catch {
    Show-Warn "远程版本获取失败，网络或 GitHub 可能异常。"
}
$remoteDisplay = if ($latestRemoteTag) { "v$latestRemoteTag" } else { "无" }
Show-Info "本地版本：v$localVersion"
Show-Info "远程版本：$remoteDisplay"

if (!(Test-Path '.git')) {
    Show-Info "本地不是 Git 仓库，正在初始化并拉取最新版本 v$latestRemoteTag ..."
    git init
    git remote add origin https://github.com/hsopen/nai-crawlee-next.git
    git fetch --tags
    git checkout v$latestRemoteTag
    if ($LASTEXITCODE -ne 0) { Show-Error "拉取失败。"; Read-Host "按回车退出"; exit }
    Show-Info "正在重新安装依赖 ..."
    pnpm i
    if ($LASTEXITCODE -ne 0) { Show-Error "依赖安装失败。"; Read-Host "按回车退出"; exit }
    Show-Info "正在重新编译 TypeScript ..."
    pnpm tsc
    if ($LASTEXITCODE -ne 0) { Show-Error "编译失败。"; Read-Host "按回车退出"; exit }
} elseif ($latestRemoteTag -and ([version]($latestRemoteTag -replace '^refs/tags/v', '') -gt [version]$localVersion)) {
    Show-Info "发现新版本 v$latestRemoteTag，正在拉取更新 ..."
    git pull
    if ($LASTEXITCODE -ne 0) { Show-Error "拉取失败。"; Read-Host "按回车退出"; exit }
    Show-Info "正在重新安装依赖 ..."
    pnpm i
    if ($LASTEXITCODE -ne 0) { Show-Error "依赖安装失败。"; Read-Host "按回车退出"; exit }
    Show-Info "正在重新编译 TypeScript ..."
    pnpm tsc
    if ($LASTEXITCODE -ne 0) { Show-Error "编译失败。"; Read-Host "按回车退出"; exit }
}

# 检查 node_modules 文件夹是否存在
if (!(Test-Path 'node_modules')) {
    Show-Info "未检测到 node_modules，正在安装依赖 ..."
    pnpm i
    if ($LASTEXITCODE -ne 0) { Show-Error "依赖安装失败，请检查网络或 pnpm 配置。"; Read-Host "按回车退出"; exit }
}

# 检查编译
if (!(Test-Path 'dist/main.js')) {
    Show-Info "正在编译 TypeScript ..."
    pnpm tsc
    if ($LASTEXITCODE -ne 0) { Show-Error "编译失败。"; Read-Host "按回车退出"; exit }
}

# 创建必要文件和目录
Ensure-Exists Directory 'tasksConfig'
Ensure-Exists File 'tasksConfig\tamplate.yaml'
Ensure-Exists Directory 'tasksConfig\done'
Ensure-Exists Directory 'tasksConfig\undone'
Ensure-Exists Directory 'sitemap'

# 运行主程序
try {
    pnpm exec tsx ./dist/main.js
    if ($LASTEXITCODE -ne 0) { throw "主程序运行失败。" }
} catch {
    Show-Error $_
    Read-Host "按回车退出"
    exit
}

Read-Host "按回车继续"