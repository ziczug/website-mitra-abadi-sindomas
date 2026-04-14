@echo off
setlocal

echo ==========================================
echo [1/4] MENJALANKAN SINKRONISASI CMS...
echo ==========================================
node sync_cms.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] ERROR: Sinkronisasi gagal. Menghentikan proses Git.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==========================================
echo [2/4] MENAMBAHKAN PERUBAHAN KE GIT...
echo ==========================================
git add .

echo.
echo ==========================================
echo [3/4] MELAKUKAN COMMIT...
echo ==========================================
set "commit_msg=chore: auto sync cms and products backup"
set /p user_msg="Masukkan pesan commit (biarkan kosong untuk default): "
if not "%user_msg%"=="" set "commit_msg=%user_msg%"

git commit -m "%commit_msg%"

echo.
echo ==========================================
echo [4/4] MENGUNGGAH KE GITHUB (PUSH)...
echo ==========================================
git push origin main

echo.
echo ==========================================
echo SIKRONISASI DAN BACKUP SELESAI!
echo ==========================================
pause
