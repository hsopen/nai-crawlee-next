@echo off
cd /d %~dp0

:: 检查更新
powershell -Command "$localLatestTag = git describe --tags --abbrev=0 2>$null; if ($localLatestTag) { $localVersion = $localLatestTag -replace '^v', '' } else { $localVersion = '0.0.0' }; $latestRemoteTag = git ls-remote --tags https://github.com/hsopen/nai-crawlee-next.git | ForEach-Object { $_.Split()[1] } | Where-Object { $_ -match '^refs/tags/v' } | ForEach-Object { $_.Replace('refs/tags/v', '') } | Sort-Object -Descending | Select-Object -First 1; if ($latestRemoteTag -and ([version]$latestRemoteTag -gt [version]$localVersion)) { Write-Host \"[提示] 发现新版本 v$latestRemoteTag，正在拉取更新...\"; git pull; if ($LASTEXITCODE -ne 0) { Write-Host '[错误] 拉取失败。'; pause; exit } }"

:: 检查 node_modules 文件夹是否存在
powershell -Command "if (!(Test-Path 'node_modules')) { Write-Host '[提示] 未检测到 node_modules，正在安装依赖...'; pnpm i; if ($LASTEXITCODE -ne 0) { Write-Host '[错误] 依赖安装失败，请检查网络或 pnpm 配置。'; pause; exit } }"
powershell -Command "if (!(Test-Path 'dist/main.js')) { Write-Host '[提示] 正在编译 TypeScript...'; pnpm tsc; if ($LASTEXITCODE -ne 0) { Write-Host '[错误] 编译失败。'; pause; exit } }"
powershell -Command "if (!(Test-Path 'tasksConfig')) { Write-Host '[提示] 创建 tasksConfig 目录...'; New-Item -ItemType Directory -Path 'tasksConfig' -Force }; if (!(Test-Path 'tasksConfig\tamplate.yaml')) { Write-Host '[提示] 创建 tamplate.yaml 文件...'; New-Item -ItemType File -Path 'tasksConfig\tamplate.yaml' -Force }; if (!(Test-Path 'tasksConfig\done')) { Write-Host '[提示] 创建 done 目录...'; New-Item -ItemType Directory -Path 'tasksConfig\done' -Force }; if (!(Test-Path 'tasksConfig\undone')) { Write-Host '[提示] 创建 undone 目录...'; New-Item -ItemType Directory -Path 'tasksConfig\undone' -Force }; if (!(Test-Path 'sitemap')) { Write-Host '[提示] 创建 sitemap 目录...'; New-Item -ItemType Directory -Path 'sitemap' -Force }"
powershell -Command "pnpm tsx ./dist/main.js"
pause
