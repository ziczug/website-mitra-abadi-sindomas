@echo off
TITLE QUICK SAVE - MITRA ABADI
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
echo %ESC%%cyan%  %ESC%%bold%MITRA ABADI%ESC%%reset%%ESC%%cyan% - QUICK SAVE ^& PUSH%ESC%%reset%
echo %ESC%%cyan%============================================================%ESC%%reset%
echo.

:: Check status
echo %ESC%%cyan%[1/3] Menambahkan perubahan...%ESC%%reset%
git add .
echo %ESC%%green%[+] Perubahan ditambahkan.%ESC%%reset%
echo.

:: Commit with timestamp
echo %ESC%%cyan%[2/3] Membuat commit...%ESC%%reset%
set "datestamp=%date:~6,4%-%date:~3,2%-%date:~0,2%"
set "timestamp=%time:~0,2%:%time:~3,2%"
set "timestamp=%timestamp: =0%"
set "msg=Quick Save: %datestamp% %timestamp%"

git commit -m "%msg%"
if %ERRORLEVEL% NEQ 0 (
    echo %ESC%%yellow%[!] Tidak ada perubahan baru untuk disimpan.%ESC%%reset%
) ELSE (
    echo %ESC%%green%[+] Commit berhasil: %msg%%ESC%%reset%
)
echo.

:: Push
echo %ESC%%cyan%[3/3] Mengirim ke GitHub...%ESC%%reset%
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo %ESC%%red%[X] Gagal push ke GitHub. Pastikan koneksi internet aktif.%ESC%%reset%
) ELSE (
    echo %ESC%%green%[+] Berhasil! Data Anda sudah aman di GitHub.%ESC%%reset%
)

echo.
echo %ESC%%cyan%============================================================%ESC%%reset%
echo %ESC%%green%  PROSES SELESAI%ESC%%reset%
echo %ESC%%cyan%============================================================%ESC%%reset%
echo.
pause
