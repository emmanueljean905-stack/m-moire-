@echo off
title Tunnel Ngrok - Beautiful Women
echo ==========================================================
echo           TUNNEL STABLE NGROK - BEAUTIFUL WOMEN          
echo ==========================================================
echo Etape 1: Creez un compte gratuit sur https://ngrok.com
echo Etape 2: Recuperez votre Token d'authentification sur le site
echo Etape 3: Recuperez votre "Static Domain" gratuit dans votre dashboard
echo ==========================================================
echo.
echo [CONFIG] Pour enregistrer votre Token (a ne faire qu'une seule fois) :
echo Ouvrez une commande et tapez : ngrok config add-authtoken <VOTRE_TOKEN>
echo.
set /p DOMAIN="Entrez votre domaine gratuit Ngrok (ex: votredomaine.ngrok-free.app) : "
if "%DOMAIN%"=="" (
    echo Aucun domaine specifie, demarrage standard (URL temporaire)...
    ngrok http 3000
) else (
    echo Demarrage du tunnel stable sur : https://%DOMAIN%
    ngrok http 3000 --domain=%DOMAIN%
)
pause
