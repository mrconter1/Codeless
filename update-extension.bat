@echo off
echo Building and installing extension...

rem Build the extension
call npm run compile
if %errorlevel% neq 0 goto :error

rem Package the extension
call vsce package --no-yarn --allow-missing-repository
if %errorlevel% neq 0 goto :error

rem Find the latest .vsix file
for /f "delims=" %%i in ('dir /b /o-d *.vsix') do set LATEST_VSIX=%%i

if not defined LATEST_VSIX (
    echo No .vsix file found.
    goto :error
)

echo Installing %LATEST_VSIX%...
call code --install-extension %LATEST_VSIX%
if %errorlevel% neq 0 goto :error

echo Extension built and installed successfully. Please reload VS Code.
goto :end

:error
echo An error occurred. Please check the output above for details.

:end
pause