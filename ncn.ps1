Set-Location $PSScriptRoot

# 检查更新
$localLatestTag = git describe --tags --abbrev=0
if ($LASTEXITCODE -eq 0) { $localVersion = $localLatestTag -replace '^v', '' } else { $localVersion = '0.0.0' }
$latestRemoteTag = git ls-remote --tags https://github.com/hsopen/nai-crawlee-next.git | ForEach-Object { $_.Split()[1] } | Where-Object { $_ -match '^refs/tags/v' } | ForEach-Object { $_.Replace('refs/tags/v', '') } | Sort-Object -Descending | Select-Object -First 1
$remoteDisplay = if ($latestRemoteTag) { "v$latestRemoteTag" } else { "无" }
Write-Host "本地版本：v$localVersion"
Write-Host "远程版本：$remoteDisplay"
if (!(Test-Path '.git')) {
    Write-Host "[提示] 本地不是 Git 仓库，正在初始化并拉取最新版本 v$latestRemoteTag..."
    git init
    git remote add origin https://github.com/hsopen/nai-crawlee-next.git
    git fetch --tags
    git checkout v$latestRemoteTag
    if ($LASTEXITCODE -ne 0) { Write-Host '[错误] 拉取失败。'; Read-Host "Press Enter to exit"; exit }
    # 重新安装依赖和编译
    Write-Host '[提示] 正在重新安装依赖...'
    pnpm i
    if ($LASTEXITCODE -ne 0) { Write-Host '[错误] 依赖安装失败。'; Read-Host "Press Enter to exit"; exit }
    Write-Host '[提示] 正在重新编译 TypeScript...'
    pnpm tsc
    if ($LASTEXITCODE -ne 0) { Write-Host '[错误] 编译失败。'; Read-Host "Press Enter to exit"; exit }
} elseif ($latestRemoteTag -and ([version]$latestRemoteTag -gt [version]$localVersion)) {
    Write-Host "[提示] 发现新版本 v$latestRemoteTag，正在拉取更新..."
    git pull
    if ($LASTEXITCODE -ne 0) { Write-Host '[错误] 拉取失败。'; Read-Host "Press Enter to exit"; exit }
    # 重新安装依赖和编译
    Write-Host '[提示] 正在重新安装依赖...'
    pnpm i
    if ($LASTEXITCODE -ne 0) { Write-Host '[错误] 依赖安装失败。'; Read-Host "Press Enter to exit"; exit }
    Write-Host '[提示] 正在重新编译 TypeScript...'
    pnpm tsc
    if ($LASTEXITCODE -ne 0) { Write-Host '[错误] 编译失败。'; Read-Host "Press Enter to exit"; exit }
}

# 检查 node_modules 文件夹是否存在
if (!(Test-Path 'node_modules')) { Write-Host '[提示] 未检测到 node_modules，正在安装依赖...'; pnpm i; if ($LASTEXITCODE -ne 0) { Write-Host '[错误] 依赖安装失败，请检查网络或 pnpm 配置。'; Read-Host "Press Enter to exit"; exit } }

# 检查编译
if (!(Test-Path 'dist/main.js')) { Write-Host '[提示] 正在编译 TypeScript...'; pnpm tsc; if ($LASTEXITCODE -ne 0) { Write-Host '[错误] 编译失败。'; Read-Host "Press Enter to exit"; exit } }

# 创建必要文件
if (!(Test-Path 'tasksConfig')) { Write-Host '[提示] 创建 tasksConfig 目录...'; New-Item -ItemType Directory -Path 'tasksConfig' -Force }
if (!(Test-Path 'tasksConfig\tamplate.yaml')) { Write-Host '[提示] 创建 tamplate.yaml 文件...'; New-Item -ItemType File -Path 'tasksConfig\tamplate.yaml' -Force }
if (!(Test-Path 'tasksConfig\done')) { Write-Host '[提示] 创建 done 目录...'; New-Item -ItemType Directory -Path 'tasksConfig\done' -Force }
if (!(Test-Path 'tasksConfig\undone')) { Write-Host '[提示] 创建 undone 目录...'; New-Item -ItemType Directory -Path 'tasksConfig\undone' -Force }
if (!(Test-Path 'sitemap')) { Write-Host '[提示] 创建 sitemap 目录...'; New-Item -ItemType Directory -Path 'sitemap' -Force }

# 运行主程序
pnpm exec tsx ./dist/main.js

Read-Host "Press Enter to continue"