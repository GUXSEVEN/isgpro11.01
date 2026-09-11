# İSG Proje Panel Senkronizasyon Scripti
$SourceDir = "C:\Users\İBRAHİM\Desktop\isg-projesi - Copy"
$DestDir = Join-Path -Path $PSScriptRoot -ChildPath "..\panel-dist"

Write-Host ">>> ISG Proje (Panel) build başlatılıyor..." -ForegroundColor Cyan

if (-not (Test-Path $SourceDir)) {
    Write-Error "Kaynak klasör bulunamadı: $SourceDir"
    exit 1
}

Push-Location $SourceDir
try {
    Write-Host ">>> Vite build --base=/panel/ çalıştırılıyor..." -ForegroundColor Yellow
    npx vite build --base=/panel/
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Vite build başarısız oldu!"
        exit 1
    }
} finally {
    Pop-Location
}

Write-Host ">>> Build edilen dist klasörü panel-dist'e kopyalanıyor..." -ForegroundColor Yellow
if (-not (Test-Path $DestDir)) {
    New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
}

$SourceDist = Join-Path $SourceDir "dist"
Copy-Item -Path "$SourceDist\*" -Destination $DestDir -Recurse -Force

Write-Host ">>> Başarılı! İSG Paneli güncellendi ve panel-dist klasörüne aktarıldı." -ForegroundColor Green
