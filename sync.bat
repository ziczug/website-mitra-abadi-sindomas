@echo off
title Sync Excel to CMS - Mitra Abadi Sindomas
echo ==========================================
echo    MITRA ABADI SINDOMAS - DATA SYNC
echo ==========================================
echo.
echo Sedang menyinkronkan data dari Excel ke Database...
echo.

node sync_cms.js

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Terjadi kesalahan saat sinkronisasi!
    echo Harap pastikan file Excel tidak sedang dibuka di aplikasi lain.
    echo.
    pause
    exit /b %errorlevel%
)

echo.
echo [SUCCESS] Sinkronisasi Berhasil!
echo Data produk, brand, dan kategori telah diperbarui.
echo.
echo Menjalankan folder setup untuk memastikan gambar brand sinkron...
node setup_brand_folders.js

echo.
echo Semua proses selesai.
echo.
pause
