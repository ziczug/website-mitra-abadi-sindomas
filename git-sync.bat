@echo off
TITLE FULL SYNC - MITRA ABADI
SETLOCAL EnableDelayedExpansion

:: Colors
SET "cyan=[96m"
SET "green=[92m"
SET "yellow=[93m"
SET "red=[91m"
SET "reset=[0m"
SET "bold=[1m"

for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do set "ESC=%%b"

CLS
echo %ESC%%cyan%============================================================%ESC%%reset%
echo %ESC%%cyan%  %ESC%%bold%MITRA ABADI%ESC%%reset%%ESC%%cyan% - FULL GIT SYNC (PULL ^& PUSH)%ESC%%reset%
echo %ESC%%cyan%============================================================%ESC%%reset%
echo.

:: Step 1: Pull
echo %ESC%%cyan%[1/4] Menarik data terbaru dari GitHub...%ESC%%reset%
git pull origin main
if %ERRORLEVEL% NEQ 0 (
    echo %ESC%%yellow%[!] Terjadi konflik atau masalah koneksi saat Pull.%ESC%%reset%
) ELSE (
    echo %ESC%%green%[+] Repository sudah up-to-date.%ESC%%reset%
)
echo.

:: Step 2: Add
echo %ESC%%cyan%[2/4] Menambahkan perubahan...%ESC%%reset%
git add .
echo %ESC%%green%[+] Perubahan ditambahkan.%ESC%%reset%
echo.

:: Step 3: Commit
echo %ESC%%cyan%[3/4] Membuat commit...%ESC%%reset%
set "commit_msg=chore: sync data %date% %time%"
echo %ESC%%yellow%Masukkan pesan commit (atau tekan Enter untuk default):%ESC%%reset%
set /p user_msg="> "
if not "!user_msg!"=="" set "commit_msg=!user_msg!"

git commit -m "!commit_msg!"
if %ERRORLEVEL% NEQ 0 (
    echo %ESC%%yellow%[!] Tidak ada perubahan baru untuk di-commit.%ESC%%reset%
) ELSE (
    echo %ESC%%green%[+] Commit berhasil: !commit_msg!%ESC%%reset%
)
echo.

:: Step 4: Push
echo %ESC%%cyan%[4/4] Mengirim ke GitHub...%ESC%%reset%
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo %ESC%%red%[X] Gagal push ke GitHub. Periksa koneksi atau konflik.%ESC%%reset%
    pause
    exit /b 1
) ELSE (
    echo %ESC%%green%[+] Berhasil! Semua data telah tersinkronisasi.%ESC%%reset%
)

echo.
echo %ESC%%cyan%============================================================%ESC%%reset%
echo %ESC%%green%  SINKRONISASI SELESAI%ESC%%reset%
echo %ESC%%cyan%============================================================%ESC%%reset%
echo.
pause
