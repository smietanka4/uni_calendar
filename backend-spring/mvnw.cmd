@REM Maven Wrapper for Windows
@REM https://maven.apache.org/wrapper/

@echo off
setlocal

set "MAVEN_PROJECTBASEDIR=%~dp0"
set "MAVEN_WRAPPER_PROPERTIES=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.properties"
set "MAVEN_WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.jar"

for /f "tokens=2 delims==" %%a in ('findstr "distributionUrl" "%MAVEN_WRAPPER_PROPERTIES%"') do set "DIST_URL=%%a"
for /f "tokens=2 delims==" %%a in ('findstr "wrapperUrl" "%MAVEN_WRAPPER_PROPERTIES%"') do set "WRAPPER_URL=%%a"

if not exist "%MAVEN_WRAPPER_JAR%" (
    echo Downloading Maven Wrapper...
    powershell -Command "Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile '%MAVEN_WRAPPER_JAR%'"
)

set "MAVEN_HOME=%USERPROFILE%\.m2\wrapper\dists"

REM Use java -jar for wrapper or fallback to mvn
java -jar "%MAVEN_WRAPPER_JAR%" %*
if %ERRORLEVEL% neq 0 (
    REM Fallback: direct Maven download
    echo Falling back to direct Maven execution...
    powershell -Command "& { $url='%DIST_URL%'; $out='%TEMP%\maven.zip'; Invoke-WebRequest -Uri $url -OutFile $out; Expand-Archive -Path $out -DestinationPath '%MAVEN_HOME%' -Force }"
    for /f %%i in ('dir /s /b "%MAVEN_HOME%\mvn.cmd" 2^>nul') do set "MVN_CMD=%%i"
    if defined MVN_CMD (
        "%MVN_CMD%" %*
    ) else (
        echo Error: Could not find Maven executable
        exit /b 1
    )
)

endlocal
