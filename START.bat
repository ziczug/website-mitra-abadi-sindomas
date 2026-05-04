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

:: 1. Sinkronisasi Git (Pull terbaru)
echo %ESC%%cyan%[1/4] Sinkronisasi data dari GitHub...%ESC%%reset%
git pull origin main
IF %ERRORLEVEL% NEQ 0 (
    echo %ESC%%yellow%[!] Warning: Gagal menarik data terbaru. Mungkin ada konflik atau masalah koneksi.%ESC%%reset%
) ELSE (
    echo %ESC%%green%[+] Sinkronisasi repository berhasil.%ESC%%reset%
)
echo.

:: 2. Verifikasi node_modules
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

:: 3. Otomatisasi Sinkronisasi CMS & Folder
echo %ESC%%cyan%[3/4] Menyiapkan data CMS & Folder Produk...%ESC%%reset%
IF EXIST "sync_cms.js" (
    node sync_cms.js
    IF %ERRORLEVEL% NEQ 0 (
        echo %ESC%%yellow%[!] Tips: Sinkronisasi CMS gagal, tetapi mencoba melanjutkan...%ESC%%reset%
    ) ELSE (
        echo %ESC%%green%[+] Data CMS terbaru berhasil dimuat.%ESC%%reset%
    )
)

IF EXIST "setup_brand_folders.js" (
    node setup_brand_folders.js
    IF %ERRORLEVEL% NEQ 0 (
        echo %ESC%%yellow%[!] Tips: Setup folder brand gagal.%ESC%%reset%
    ) ELSE (
        echo %ESC%%green%[+] Folder brand sudah siap.%ESC%%reset%
    )
)
echo.

:: 4. Jalankan Server
echo %ESC%%cyan%[4/4] Menjalankan Vite Server...%ESC%%reset%
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

