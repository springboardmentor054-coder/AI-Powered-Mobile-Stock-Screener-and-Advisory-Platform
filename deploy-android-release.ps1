param(
    [Parameter(Mandatory = $true)]
    [string]$ApiBaseUrl,

    [switch]$SkipApk
)

$ErrorActionPreference = "Stop"

Write-Host "Building Android release with API_BASE_URL=$ApiBaseUrl" -ForegroundColor Cyan

Set-Location "$PSScriptRoot\stock_screener_app"

flutter pub get

if (-not $SkipApk) {
    flutter build apk --release --dart-define=API_BASE_URL=$ApiBaseUrl
}

flutter build appbundle --release --dart-define=API_BASE_URL=$ApiBaseUrl

Write-Host ""
Write-Host "Build completed." -ForegroundColor Green
Write-Host "APK: stock_screener_app\build\app\outputs\flutter-apk\app-release.apk"
Write-Host "AAB: stock_screener_app\build\app\outputs\bundle\release\app-release.aab"
