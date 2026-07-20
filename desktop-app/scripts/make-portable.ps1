$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$electronDist = Join-Path $root 'node_modules\electron\dist'
$releaseRoot = Join-Path $root 'release'
$buildStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$appRoot = Join-Path $releaseRoot ("Token Balance-" + $buildStamp)
$iconScript = Join-Path $PSScriptRoot 'create-icon.ps1'
$iconPath = Join-Path $root 'assets\balance-center.ico'
$rcedit = Join-Path $root 'node_modules\electron-winstaller\vendor\rcedit.exe'

if (-not (Test-Path $electronDist)) {
  throw 'Electron runtime is missing. Run npm install first.'
}

& $iconScript
if (-not (Test-Path $iconPath)) {
  throw 'Could not generate the application icon.'
}

if (-not (Test-Path $rcedit)) {
  throw 'rcedit is missing. Run npm install first.'
}

New-Item -ItemType Directory -Path $appRoot -Force | Out-Null
Copy-Item -Path (Join-Path $electronDist '*') -Destination $appRoot -Recurse -Force

$appResources = Join-Path $appRoot 'resources\app'
New-Item -ItemType Directory -Path $appResources -Force | Out-Null
Copy-Item -Path (Join-Path $root 'main.cjs') -Destination $appResources
Copy-Item -Path (Join-Path $root 'preload.cjs') -Destination $appResources
Copy-Item -Path (Join-Path $root 'package.json') -Destination $appResources
Copy-Item -Path (Join-Path $root 'renderer') -Destination $appResources -Recurse
Copy-Item -Path (Join-Path $root 'assets') -Destination $appResources -Recurse

$sourceExecutable = Join-Path $appRoot 'electron.exe'
$rceditExecutable = Join-Path (Join-Path 'release' ("Token Balance-" + $buildStamp)) 'electron.exe'
Push-Location $root
& $rcedit $rceditExecutable --set-icon 'assets\balance-center.ico'
$rceditExitCode = $LASTEXITCODE
Pop-Location
if ($rceditExitCode -ne 0) {
  throw 'Could not apply the application icon.'
}
Rename-Item -Path $sourceExecutable -NewName 'Token Balance.exe'
$appExecutable = Join-Path $appRoot 'Token Balance.exe'

$archivePath = Join-Path $releaseRoot ("Balance-Center-Windows-Portable-" + $buildStamp + '.zip')
Compress-Archive -Path (Join-Path $appRoot '*') -DestinationPath $archivePath -CompressionLevel Optimal -Force
Write-Output "Portable app created: $appExecutable"
Write-Output "Release archive created: $archivePath"
