@echo off
title Git Save & Sync - PT Mitra Abadi Sindomas
color 0A

echo ================================================
echo   GIT SAVE ^& SYNC - PT Mitra Abadi Sindomas
echo ================================================
echo.

:: Pindah ke folder project
cd /d "d:\2025\PT MASFOOD WEB\mitra-abadi"

:: Cek status
echo [1/4] Mengecek status file...
git status
echo.

:: Tambahkan semua perubahan
echo [2/4] Menambahkan semua perubahan...
git add .
echo Done.
echo.

:: Buat pesan commit dengan timestamp otomatis
echo [3/4] Membuat commit...
set DATESTAMP=%date:~6,4%-%date:~3,2%-%date:~0,2%
set TIMESTAMP=%time:~0,2%:%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%
set MSG=Update: Save %DATESTAMP% %TIMESTAMP%

:: Cek apakah ada sesuatu untuk di-commit
git diff --cached --quiet
IF %ERRORLEVEL% == 0 (
    echo Tidak ada perubahan baru untuk di-commit.
) ELSE (
    git commit -m "%MSG%"
    echo Commit berhasil: %MSG%
)
echo.

:: Push ke GitHub
echo [4/4] Mengirim ke GitHub...
git push
IF %ERRORLEVEL% == 0 (
    echo.
    echo ================================================
    echo   SUKSES! Semua perubahan telah disimpan.
    echo ================================================
) ELSE (
    echo.
    echo ================================================
    echo   ERROR: Gagal push ke GitHub. Cek koneksi.
    echo ================================================
)

echo.
pause
