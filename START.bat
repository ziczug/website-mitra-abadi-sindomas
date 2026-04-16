@echo off
TITLE MITRA ABADI - Development Server
SETLOCAL EnableDelayedExpansion

:: Warna (Hanya berfungsi di Windows 10+ / Terminal modern)
SET "cyan=[96m"
SET "green=[92m"
SET "yellow=[93m"
SET "red=[91m"
SET "reset=[0m"
SET "bold=[1m"

:: Generate ESC character for ANSI colors
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do set "ESC=%%b"

CLS
echo %ESC%%cyan%============================================================%ESC%%reset%
echo %ESC%%cyan%  %ESC%%bold%MITRA ABADI SINDOMAS%ESC%%reset%%ESC%%cyan% - DEVELOPMENT SERVER%ESC%%reset%
echo %ESC%%cyan%============================================================%ESC%%reset%
echo.

:: 1. Verifikasi node_modules
IF NOT EXIST "node_modules\" (
    echo %ESC%%yellow%[!] node_modules tidak ditemukan. Menginstal dependensi...%ESC%%reset%
    call npm install
    IF %ERRORLEVEL% NEQ 0 (
        echo %ESC%%red%[X] Gagal menginstal dependensi. Pastikan Node.js sudah terinstal.%ESC%%reset%
        pause
        exit /b %ERRORLEVEL%
    )
    echo %ESC%%green%[+] Dependensi berhasil diinstal.%ESC%%reset%
    echo.
)

:: 2. Otomatisasi Sinkronisasi CMS sebelum Start
echo %ESC%%cyan%[1/2] Menyiapkan data CMS...%ESC%%reset%
IF EXIST "sync_cms.js" (
    node sync_cms.js
    IF %ERRORLEVEL% NEQ 0 (
        echo %ESC%%yellow%[!] Tips: Sinkronisasi CMS gagal, tetapi mencoba melanjutkan...%ESC%%reset%
    ) ELSE (
        echo %ESC%%green%[+] Data CMS terbaru berhasil dimuat.%ESC%%reset%
    )
) ELSE (
    echo %ESC%%yellow%[!] sync_cms.js tidak ditemukan, melewati langkah ini...%ESC%%reset%
)
echo.

:: 3. Jalankan Server
echo %ESC%%cyan%[2/2] Menjalankan Vite Server...%ESC%%reset%
echo %ESC%%cyan%------------------------------------------------------------%ESC%%reset%
echo.

:: Menjalankan npm start (yang memanggil vite)
npm start

:: Jika server berhenti
echo.
echo %ESC%%cyan%------------------------------------------------------------%ESC%%reset%
echo %ESC%%yellow%[!] Server telah dihentikan.%ESC%%reset%
echo.
pause
