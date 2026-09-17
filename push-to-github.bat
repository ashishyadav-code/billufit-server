@echo off
echo ===================================================
echo   Pushing BilluFit Server to GitHub (ashishyadav-code)
echo ===================================================
cd /d "%~dp0"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/ashishyadav-code/billufit-server.git
git push -u origin main
echo ===================================================
echo   Done! Now go to https://dashboard.render.com/
echo   Click "New +" -> "Web Service" -> Select billufit-server
echo ===================================================
pause
