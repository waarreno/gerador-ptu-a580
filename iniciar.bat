@echo off
chcp 65001 >nul
title Gerador PTU A580
echo.
echo Iniciando aplicacao...
echo.

REM Define o diretorio da aplicacao
cd /d "%~dp0"

REM Verifica se o Node.js portavel existe
if not exist "node-portable\node.exe" (
    echo [INFO] Node.js portavel nao encontrado. Iniciando instalacao automatica...
    echo.
    call :install_nodejs
    if errorlevel 1 (
        echo.
        echo [ERRO] Falha ao instalar Node.js portavel!
        pause
        exit /b 1
    )
)

REM Adiciona o Node.js portavel ao PATH temporariamente
set PATH=%~dp0node-portable;%PATH%

REM Verifica se node_modules existe, senao instala dependencias
if not exist "node_modules" (
    echo [INFO] Instalando dependencias pela primeira vez...
    echo Isso pode levar alguns minutos...
    echo.
    call "%~dp0node-portable\node.exe" "%~dp0node-portable\node_modules\npm\bin\npm-cli.js" install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias!
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencias instaladas com sucesso!
    echo.
)

REM Cria arquivo de sinalizacao para fechar servidor quando navegador fechar
if exist "server.lock" del "server.lock"
echo running > "server.lock"

REM Salva o PID do script em arquivo
echo %TIME% > "launcher.pid"

REM Inicia o servidor Node.js em background e salva o PID
start /B "" "%~dp0node-portable\node.exe" "%~dp0server.js"

REM Aguarda 2 segundos para o servidor iniciar
timeout /t 2 /nobreak >nul

REM Abre o navegador
echo [INFO] Abrindo navegador...
start "" "http://localhost:3000"

REM Exibe informacoes
echo.
echo Executando aplicacao!
echo.

REM Aguarda o usuario pressionar qualquer tecla
echo Pressione qualquer tecla para encerrar o servidor...
pause >nul

REM Chama rotina de limpeza
goto cleanup

:install_nodejs
    echo [INFO] Detectando versao mais recente do Node.js...
    
    REM Cria diretorio temporario
    if not exist "temp_download" mkdir "temp_download"
    
    REM Tenta obter a versao mais recente via PowerShell
    powershell -Command "try { $response = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json' -TimeoutSec 10; $latestLTS = $response | Where-Object { $_.lts } | Select-Object -First 1; $latestLTS.version } catch { Write-Output 'v22.20.0' }" > "temp_download\version.txt"
    
    REM Le a versao do arquivo
    set /p NODE_VERSION=<"temp_download\version.txt"
    
    REM Remove espacos em branco
    for /f "tokens=* delims= " %%a in ("%NODE_VERSION%") do set NODE_VERSION=%%a
    
    REM Valida se obteve versao valida
    echo %NODE_VERSION% | findstr /R "^v[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*$" >nul
    if errorlevel 1 (
        echo [AVISO] Nao foi possivel detectar versao. Usando padrao v22.20.0
        set NODE_VERSION=v22.20.0
    )
    
    echo [INFO] Versao selecionada: %NODE_VERSION%
    echo.
    
    REM Define URL de download (Windows x64)
    set NODE_URL=https://nodejs.org/dist/%NODE_VERSION%/node-%NODE_VERSION%-win-x64.zip
    set ZIP_FILE=temp_download\nodejs.zip
    
    echo [INFO] Baixando Node.js portavel...
    echo URL: %NODE_URL%
    echo.
    echo Isso pode levar alguns minutos dependendo da sua conexao...
    echo.
    
    REM Baixa o arquivo usando PowerShell com barra de progresso
    powershell -Command "& {$ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%ZIP_FILE%' -TimeoutSec 300; if ($?) { Write-Host '[OK] Download concluido!' -ForegroundColor Green } else { Write-Host '[ERRO] Falha no download!' -ForegroundColor Red; exit 1 }}"
    
    if errorlevel 1 (
        echo [ERRO] Falha ao baixar Node.js!
        rmdir /s /q "temp_download" 2>nul
        exit /b 1
    )
    
    echo.
    echo [INFO] Extraindo arquivos...
    
    REM Extrai usando .NET System.IO.Compression (mais rapido que Expand-Archive)
    powershell -Command "& {$ProgressPreference = 'SilentlyContinue'; try { Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('%ZIP_FILE%', 'temp_download'); Write-Host '[OK] Extracao concluida!' -ForegroundColor Green; exit 0 } catch { Write-Host '[ERRO] Falha na extracao: ' $_.Exception.Message -ForegroundColor Red; exit 1 }}"
    
    if errorlevel 1 (
        echo [ERRO] Falha ao extrair arquivos!
        rmdir /s /q "temp_download" 2>nul
        exit /b 1
    )
    
    echo.
    echo [INFO] Organizando arquivos...
    
    REM Move a pasta extraida para node-portable
    for /d %%i in ("temp_download\node-*-win-x64") do (
        if exist "%%i" (
            echo Movendo: %%i para node-portable
            move "%%i" "node-portable" >nul 2>&1
            if errorlevel 1 (
                echo [AVISO] Erro ao mover pasta. Tentando copiar...
                xcopy "%%i" "node-portable" /E /I /H /Y >nul 2>&1
                if errorlevel 1 (
                    echo [ERRO] Falha ao copiar arquivos!
                    rmdir /s /q "temp_download" 2>nul
                    exit /b 1
                )
            )
        )
    )
    
    REM Verifica se os arquivos essenciais foram extraidos
    if not exist "node-portable\node.exe" (
        echo [ERRO] Arquivo node.exe nao encontrado apos extracao!
        rmdir /s /q "temp_download" 2>nul
        rmdir /s /q "node-portable" 2>nul
        exit /b 1
    )
    
    if not exist "node-portable\npm" (
        echo [AVISO] Pasta npm nao encontrada!
    )
    
    if not exist "node-portable\node_modules" (
        echo [AVISO] Pasta node_modules nao encontrada!
    )
    
    echo [OK] Estrutura de arquivos verificada com sucesso!
    
    REM Limpa arquivos temporarios
    echo [INFO] Limpando arquivos temporarios...
    rmdir /s /q "temp_download" 2>nul
    
    echo.
    echo [OK] Node.js %NODE_VERSION% instalado com sucesso!
    echo Localizacao: %~dp0node-portable
    echo.
    
    exit /b 0

:cleanup
    echo.
    echo [INFO] Encerrando servidor...
    
    REM Remove arquivo de lock
    if exist "server.lock" del "server.lock"
    if exist "launcher.pid" del "launcher.pid"
    
    REM Mata todos os processos node.exe relacionados
    for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq node.exe" /NH 2^>nul') do (
        wmic process where "ProcessId=%%a" get CommandLine 2>nul | findstr /C:"server.js" >nul
        if not errorlevel 1 (
            echo [INFO] Encerrando processo Node.js (PID: %%a^)
            taskkill /F /PID %%a >nul 2>&1
        )
    )
    
    echo [OK] Aplicacao encerrada com sucesso!
    timeout /t 2 /nobreak >nul
    exit /b 0