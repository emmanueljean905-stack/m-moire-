@echo off
title Beautiful Women - Serveur Backend
color 0A
echo.
echo ============================================================
echo   BEAUTIFUL WOMEN - Demarrage du Serveur Backend
echo ============================================================
echo.

REM Verifier si MySQL est lance sur le port 3306
netstat -an | findstr ":3306" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo [ATTENTION] MySQL ne semble pas etre demarre !
    echo.
    echo ETAPES :
    echo  1. Ouvrez le panneau XAMPP Control Panel
    echo  2. Cliquez sur "Start" a cote de "MySQL"
    echo  3. Attendez que le statut devienne vert
    echo  4. Relancez ce script
    echo.
    pause
    exit /b 1
)

echo [OK] MySQL est bien actif sur le port 3306
echo.
echo [INFO] Demarrage du serveur Node.js...
echo [INFO] Acces : http://localhost:3000
echo [INFO] API   : http://localhost:3000/api/health
echo.

cd /d "%~dp0backend"
node server.js

pause
