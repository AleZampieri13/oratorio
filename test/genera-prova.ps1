# Crea la copia di prova in test\ partendo da app\:
# - toglie Firebase vero e usa il finto database (mock-firebase.js)
# - ogni "telefono" della prova ha la sua memoria (__devStore) al posto di localStorage
# Uso: tasto destro → Esegui con PowerShell, oppure: powershell -File test\genera-prova.ps1
$root = Split-Path $PSScriptRoot -Parent
$app = Join-Path $root 'app'
$utf8 = New-Object Text.UTF8Encoding $false

$html = [IO.File]::ReadAllText((Join-Path $app 'index.html'))
$html = [regex]::Replace($html, '<script src="https://www\.gstatic\.com/firebasejs/[^"]+"></script>\s*', '')
$html = $html.Replace('<script src="js/config.js"></script>', "<script src=`"mock-firebase.js`"></script>`n<script src=`"js/config.js`"></script>")
$html = $html.Replace('<title>Ordini Oratorio</title>', '<title>PROVA - Ordini Oratorio</title>')
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'index.html'), $html, $utf8)

foreach ($d in 'js', 'css') { New-Item -ItemType Directory -Force (Join-Path $PSScriptRoot $d) | Out-Null }
Copy-Item (Join-Path $app 'css\*') (Join-Path $PSScriptRoot 'css') -Force
Get-ChildItem (Join-Path $app 'js') -File | ForEach-Object {
  $t = [IO.File]::ReadAllText($_.FullName).Replace('localStorage', '__devStore')
  [IO.File]::WriteAllText((Join-Path $PSScriptRoot ('js\' + $_.Name)), $t, $utf8)
}
Copy-Item (Join-Path $app '*.png'), (Join-Path $app 'manifest.webmanifest') $PSScriptRoot -Force
"Copia di prova aggiornata."
