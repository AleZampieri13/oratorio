@echo off
rem Doppio clic: prepara la copia di prova, accende il server di prova e apre la serata simulata.
rem Per spegnere il server chiudi la finestra «Server prova».
cd /d "%~dp0"
echo Preparo la copia di prova (database finto, i dati veri non vengono toccati)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0genera-prova.ps1"
where py >nul 2>nul && (set PY=py) || (set PY=python)
start "Server prova" %PY% "%~dp0server.py" 5520
timeout /t 2 /nobreak >nul
start "" "http://localhost:5520/serata.html"
echo.
echo Serata simulata:      http://localhost:5520/serata.html
echo App di prova a mano:  http://localhost:5520/
echo Per spegnere il server chiudi la finestra «Server prova».
timeout /t 8 >nul
