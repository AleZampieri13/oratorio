@echo off
rem Doppio clic: prepara la copia di prova, avvia un piccolo server e apre la serata simulata.
rem Per fermare tutto chiudi la finestra «Server prova».
cd /d "%~dp0"
echo Preparo la copia di prova (database finto, i dati veri non vengono toccati)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0genera-prova.ps1"
where py >nul 2>nul && (set PY=py) || (set PY=python)
start "Server prova" /min %PY% -m http.server 5501 --bind 127.0.0.1 --directory "%~dp0."
timeout /t 2 /nobreak >nul
start "" "http://localhost:5501/serata.html"
echo.
echo Serata simulata aperta nel browser: http://localhost:5501/serata.html
echo App di prova a mano:                 http://localhost:5501/
echo Per fermare il server chiudi la finestra «Server prova».
pause
