@echo off
REM Android Build Script for ChordMini
REM Automatically sets up environment and builds APK

setlocal enabledelayedexpansion

echo.
echo ========================================
echo ChordMini Android Build Script
echo ========================================
echo.

REM Set Android SDK path
set ANDROID_HOME=%APPDATA%\..\Local\Android\Sdk
if not exist "%ANDROID_HOME%" (
    echo ERROR: Android SDK not found at %ANDROID_HOME%
    echo Please install Android SDK or set ANDROID_HOME environment variable
    pause
    exit /b 1
)

echo Android SDK: %ANDROID_HOME%

REM Check Java version
echo.
echo Checking Java installation...
java -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java not found. Please install Java 17 or higher
    echo Download from: https://adoptium.net/
    pause
    exit /b 1
)

for /f "tokens=3" %%g in ('java -version 2^>^&1 ^| find /i "version"') do (
    echo Java found: %%g
)

REM Validate build type
set BUILD_TYPE=%1
if "%BUILD_TYPE%"=="" set BUILD_TYPE=debug
if /i "%BUILD_TYPE%"=="help" goto :show_help
if /i "%BUILD_TYPE%"=="debug" goto :build_debug
if /i "%BUILD_TYPE%"=="release" goto :build_release
if /i "%BUILD_TYPE%"=="clean" goto :build_clean
if /i "%BUILD_TYPE%"=="install" goto :build_install

echo Unknown build type: %BUILD_TYPE%
goto :show_help

:build_debug
echo.
echo Building DEBUG APK...
echo.
call gradlew.bat assembleDebug %2 %3 %4 %5
if errorlevel 1 (
    echo.
    echo BUILD FAILED
    pause
    exit /b 1
)
echo.
echo BUILD SUCCESSFUL
echo APK location: app\build\outputs\apk\debug\app-debug.apk
goto :end

:build_release
echo.
echo Building RELEASE APK...
echo.
call gradlew.bat assembleRelease %2 %3 %4 %5
if errorlevel 1 (
    echo.
    echo BUILD FAILED
    pause
    exit /b 1
)
echo.
echo BUILD SUCCESSFUL
echo APK location: app\build\outputs\apk\release\app-release.apk
goto :end

:build_clean
echo.
echo Cleaning build directory...
echo.
call gradlew.bat clean %2 %3 %4 %5
echo.
echo Clean complete
goto :end

:build_install
echo.
echo Building and installing DEBUG APK to connected device...
echo.
call gradlew.bat installDebug %2 %3 %4 %5
if errorlevel 1 (
    echo.
    echo INSTALL FAILED
    pause
    exit /b 1
)
echo.
echo INSTALL SUCCESSFUL
goto :end

:show_help
echo.
echo Usage: build.bat [command]
echo.
echo Commands:
echo   debug       Build debug APK (default)
echo   release     Build release APK
echo   clean       Clean build directory
echo   install     Build and install to device
echo   help        Show this help message
echo.
echo Examples:
echo   build.bat               - Build debug APK
echo   build.bat release       - Build release APK
echo   build.bat install       - Install to connected device
echo   build.bat debug -x lint - Build debug without lint checks
echo.

:end
endlocal
