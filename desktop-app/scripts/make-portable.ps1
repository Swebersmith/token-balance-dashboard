$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$electronDist = Join-Path $root 'node_modules\electron\dist'
$releaseRoot = Join-Path $root 'release'
$appRoot = Join-Path $releaseRoot ("Token Balance-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))

if (-not (Test-Path $electronDist)) {
  throw 'Electron runtime is missing. Run npm install first.'
}

New-Item -ItemType Directory -Path $appRoot -Force | Out-Null
Copy-Item -Path (Join-Path $electronDist '*') -Destination $appRoot -Recurse -Force

$appResources = Join-Path $appRoot 'resources\app'
New-Item -ItemType Directory -Path $appResources -Force | Out-Null
Copy-Item -Path (Join-Path $root 'main.cjs') -Destination $appResources
Copy-Item -Path (Join-Path $root 'preload.cjs') -Destination $appResources
Copy-Item -Path (Join-Path $root 'package.json') -Destination $appResources
Copy-Item -Path (Join-Path $root 'renderer') -Destination $appResources -Recurse

Rename-Item -Path (Join-Path $appRoot 'electron.exe') -NewName 'Token Balance.exe'
Write-Output "Portable app created: $(Join-Path $appRoot 'Token Balance.exe')"
