@echo off
setlocal enabledelayedexpansion
title Cloud Backup & Sync - Mitra Abadi Sindomas
echo ==================================================
echo    MITRA ABADI SINDOMAS - CLOUD SAVE SYSTEM
echo ==================================================
echo.

:: Step 1: Run local CMS sync
echo [1/3] Menjalankan Sinkronisasi Data Lokal...
echo --------------------------------------------------
node sync_cms.js
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Gagal menyinkronkan data Excel ke Database!
    echo Harap pastikan file Excel tidak sedang dibuka.
    pause
    exit /b %errorlevel%
)
node setup_brand_folders.js
echo [SUCCESS] Sinkronisasi data lokal selesai.
echo.

:: Step 2: Prepare Git Backup
echo [2/3] Menyiapkan Backup ke Cloud (GitHub)...
echo --------------------------------------------------
:: Get current date and time for commit message
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set dt=%%i
set datestamp=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%
set timestamp=%dt:~8,2%:%dt:~10,2%

echo Menambahkan perubahan ke staging area...
git add -A

echo Melakukan commit data...
git commit -m "Auto-Cloud-Save: %datestamp% %timestamp%"

:: Step 3: Push to Cloud
echo [3/3] Mengunggah ke GitHub...
echo --------------------------------------------------
git push origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Gagal mengunggah ke GitHub!
    echo Periksa koneksi internet Anda atau status repository.
    pause
    exit /b %errorlevel%
)

echo.
echo ==================================================
echo    [SUCCESS] SEMUA DATA TELAH TERSIMPAN DI CLOUD
echo ==================================================
echo Anda sekarang bisa melanjutkan di perangkat lain
echo dengan melakukan 'git pull' di folder project ini.
echo.
pause
