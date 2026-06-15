@echo off
TITLE MITRA ABADI - Dev Server & Auto Sync
SETLOCAL EnableDelayedExpansion

:: Setup modern ANSI colors
SET "cyan=[96m"
SET "green=[92m"
SET "yellow=[93m"
SET "red=[91m"
SET "reset=[0m"
SET "bold=[1m"

for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do set "ESC=%%b"

CLS
echo %ESC%%cyan%============================================================%ESC%%reset%
echo %ESC%%cyan%  %ESC%%bold%MITRA ABADI SINDOMAS%ESC%%reset%%ESC%%cyan% - AUTOMATED START & SYNC%ESC%%reset%
echo %ESC%%cyan%============================================================%ESC%%reset%
echo.

:: 1. Sync Git Repository
echo %ESC%%cyan%[1/4] Menarik update kode terbaru dari GitHub...%ESC%%reset%
git pull origin main
IF %ERRORLEVEL% NEQ 0 (
    echo %ESC%%yellow%[!] Warning: Gagal melakukan git pull. Melanjutkan dengan file lokal...%ESC%%reset%
) ELSE (
    echo %ESC%%green%[+] Sinkronisasi kode berhasil.%ESC%%reset%
)
echo.

:: 2. Verify node_modules
IF NOT EXIST "node_modules\" (
    echo %ESC%%yellow%[!] Folder node_modules tidak ditemukan. Menginstal dependensi...%ESC%%reset%
    call npm.cmd install
    IF %ERRORLEVEL% NEQ 0 (
        echo %ESC%%red%[X] Gagal menginstal dependensi. Pastikan Node.js terinstal.%ESC%%reset%
        pause
        exit /b %ERRORLEVEL%
    )
    echo %ESC%%green%[+] Dependensi berhasil diinstal.%ESC%%reset%
    echo.
)

:: 3. Synchronize CMS Data from Excel
echo %ESC%%cyan%[3/4] Menjalankan Sinkronisasi Database CMS...%ESC%%reset%
IF EXIST "sync_cms.js" (
    node sync_cms.js
    IF %ERRORLEVEL% NEQ 0 (
        echo %ESC%%yellow%[!] Warning: Gagal sinkronisasi CMS. Melanjutkan...%ESC%%reset%
    ) ELSE (
        echo %ESC%%green%[+] Database CMS disinkronkan dengan sukses.%ESC%%reset%
    )
) ELSE (
    echo %ESC%%red%[X] Script sync_cms.js tidak ditemukan.%ESC%%reset%
)

IF EXIST "setup_brand_folders.js" (
    node setup_brand_folders.js
    IF %ERRORLEVEL% NEQ 0 (
        echo %ESC%%yellow%[!] Warning: Gagal setup folder brand.%ESC%%reset%
    ) ELSE (
        echo %ESC%%green%[+] Folder brand disiapkan.%ESC%%reset%
    )
)
echo.

:: 4. Run Development Server
echo %ESC%%cyan%[4/4] Menjalankan Server Development (Vite)...%ESC%%reset%
echo %ESC%%cyan%------------------------------------------------------------%ESC%%reset%
echo.

call npm.cmd start

echo.
echo %ESC%%cyan%------------------------------------------------------------%ESC%%reset%
echo %ESC%%yellow%[!] Server dihentikan.%ESC%%reset%
echo.
pause
