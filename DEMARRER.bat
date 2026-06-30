@echo off
chcp 65001 >nul
title 🌺 Beautiful Women - Démarrage complet

echo.
echo  ============================================
echo    🌺 BEAUTIFUL WOMEN - Démarrage du projet
echo  ============================================
echo.

:: ── 1. Démarrer MySQL via XAMPP ──────────────────────────────
echo  [1/3] Démarrage de MySQL (XAMPP)...
start "" "C:\xampp\mysql_start.bat"
timeout /t 5 /nobreak >nul

:: Vérifier que MySQL est bien lancé
:CHECK_MYSQL
"C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo  ⏳ Attente de MySQL...
    timeout /t 3 /nobreak >nul
    goto CHECK_MYSQL
)
echo  ✅ MySQL est prêt !

:: ── 2. Démarrer le serveur Node.js ───────────────────────────
echo  [2/3] Démarrage du serveur Node.js (port 3000)...
start "🌺 Beautiful Women - Backend" cmd /k "cd /d C:\xampp\htdocs\memoire 1\backend && node server.js"
timeout /t 3 /nobreak >nul
echo  ✅ Serveur Node lancé !

:: ── 3. Ouvrir le navigateur ───────────────────────────────────
echo  [3/3] Ouverture de l'application dans Chrome...
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"

echo.
echo  ============================================
echo    ✅ Tout est lancé !
echo    👉 http://localhost:3000
echo  ============================================
echo.
echo  💡 Pour arrêter : fermez la fenêtre "Backend" et arrêtez MySQL dans XAMPP.
echo.
pause
