$token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImM0YjZiMjg3LWIwNGItNDRkNi1iMzk1LTIwZTY2N2MxNTU4NCIsInVzdWFyaW8iOiJDcmlzdGFsIiwicm9sX2lkIjoiYmE4ODZjNTMtMmNmOS00NTdhLTliMGYtMzZhZGY2YzQ1YTJlIiwiaWF0IjoxNzc4ODk3MDM1LCJlcSI6MTc3ODkyNTgzNX0.jS0YW2gbE8J7tTyvfrbNn9XwuNuDlT4pPhseu-9Ts5I'

function CallAPI($method, $url, $body = $null) {
    try {
        $params = @{Method = $method; Uri = $url; Headers = @{Authorization = "Bearer $token"}; UseBasicParsing = $true}
        if ($body) { $params.ContentType = 'application/json'; $params.Body = ($body | ConvertTo-Json -Compress -Depth 3) }
        $r = Invoke-WebRequest @params
        $content = $r.Content
        if ($content.Length -gt 250) { $content = $content.Substring(0,250) + '...' }
        return "OK: $content"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        try { $responseStream = $_.Exception.Response.GetResponseStream(); $responseStream.Seek(0, 'Begin') | Out-Null; $reader = New-Object System.IO.StreamReader($responseStream); $errBody = $reader.ReadToEnd() } catch { $errBody = 'no body' }
        if ($errBody.Length -gt 250) { $errBody = $errBody.Substring(0,250) + '...' }
        return "ERR($code): $errBody"
    }
}

function GetFirst($url) {
    $r = Invoke-RestMethod -Uri $url -Headers @{Authorization = "Bearer $token"} -UseBasicParsing
    return ($r | Select-Object -Last 1).id
}

Write-Host "======= FULL CRUD TEST SUITE =======" -ForegroundColor Magenta

Write-Host "`n=== 1. CATEGORIAS ===" -ForegroundColor Cyan
Write-Host "1a. Create: " -NoNewline; CallAPI POST 'http://localhost:4000/api/categorias' @{nombre='TEST-MEDICION'; descripcion='Test cat'}
Write-Host "1b. Dup(case): " -NoNewline; CallAPI POST 'http://localhost:4000/api/categorias' @{nombre='test-medicion'; descripcion='Dup'}

$catId = GetFirst 'http://localhost:4000/api/categorias'
Write-Host "1c. Update: " -NoNewline; CallAPI PUT "http://localhost:4000/api/categorias/$catId" @{nombre='TEST-MEDICION-UPD'}
Write-Host "1d. Delete: " -NoNewline; CallAPI DELETE "http://localhost:4000/api/categorias/$catId"

Write-Host "`n=== 2. PERSONAS ===" -ForegroundColor Cyan
Write-Host "2a. Student: " -NoNewline; CallAPI POST 'http://localhost:4000/api/personas' @{matricula='2025-0001'; nombres='Juan'; apellidos='Perez'; tipo='Estudiante'; curso='Mecanica'}
Write-Host "2b. Prof: " -NoNewline; CallAPI POST 'http://localhost:4000/api/personas' @{matricula='2025-0002'; nombres='Maria'; apellidos='Lopez'; tipo='Profesor'; curso='Electronica'}
Write-Host "2c. Dup mat: " -NoNewline; CallAPI POST 'http://localhost:4000/api/personas' @{matricula='2025-0001'; nombres='Dup'; apellidos='Test'; tipo='Estudiante'}
Write-Host "2d. Bad fmt: " -NoNewline; CallAPI POST 'http://localhost:4000/api/personas' @{matricula='bad'; nombres='X'; apellidos='Y'; tipo='Estudiante'}

Write-Host "`n=== 3. UBICACIONES ===" -ForegroundColor Cyan
Write-Host "3a. Create: " -NoNewline; CallAPI POST 'http://localhost:4000/api/ubicaciones' @{codigo='TEST-01'; nombre='Test Loc'; tipo='Estante'}
$ubId = GetFirst 'http://localhost:4000/api/ubicaciones'
Write-Host "3b. Update: " -NoNewline; CallAPI PUT "http://localhost:4000/api/ubicaciones/$ubId" @{nombre='Test Loc Updated'}
Write-Host "3c. Dup cod: " -NoNewline; CallAPI POST 'http://localhost:4000/api/ubicaciones' @{codigo='TEST-01'; nombre='Dup'; tipo='Caja'}
Write-Host "3d. Delete: " -NoNewline; CallAPI DELETE "http://localhost:4000/api/ubicaciones/$ubId"

Write-Host "`n=== 4. INVENTARIO ===" -ForegroundColor Cyan
$cats = Invoke-RestMethod -Uri 'http://localhost:4000/api/categorias' -Headers @{Authorization = "Bearer $token"} -UseBasicParsing
$cid = $cats[0].id
Write-Host "4a. Create: " -NoNewline; CallAPI POST 'http://localhost:4000/api/inventario' @{codigo='TEST-H001'; nombre='Test Hammer'; categoria_id=$cid; cantidad_total=10; cantidad_disponible=8; cantidad_danada=2; stock_minimo=2}
Write-Host "4b. Create 2: " -NoNewline; CallAPI POST 'http://localhost:4000/api/inventario' @{codigo='TEST-H002'; nombre='Test Drill'; cantidad_total=5; cantidad_disponible=0; cantidad_danada=5; stock_minimo=2}
Write-Host "4c. Dup cod: " -NoNewline; CallAPI POST 'http://localhost:4000/api/inventario' @{codigo='TEST-H001'; nombre='Dup Code'; cantidad_total=5; cantidad_disponible=5}
$iid = GetFirst 'http://localhost:4000/api/inventario'
Write-Host "4d. Update: " -NoNewline; CallAPI PUT "http://localhost:4000/api/inventario/$iid" @{nombre='Test Drill Updated'}