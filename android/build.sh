#!/bin/bash
# Android Build Script for ChordMini
# Automatically sets up environment and builds APK

set -e

echo ""
echo "========================================"
echo "ChordMini Android Build Script"
echo "========================================"
echo ""

# Set Android SDK path
if [ -z "$ANDROID_HOME" ]; then
    # Try common Android Studio installation paths
    if [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
    elif [ -d "$HOME/.android/sdk" ]; then
        export ANDROID_HOME="$HOME/.android/sdk"
    else
        echo "ERROR: Android SDK not found"
        echo "Please install Android SDK or set ANDROID_HOME environment variable"
        exit 1
    fi
fi

echo "Android SDK: $ANDROID_HOME"

if [ ! -d "$ANDROID_HOME" ]; then
    echo "ERROR: Android SDK directory not found at $ANDROID_HOME"
    exit 1
fi

# Check Java version
echo ""
echo "Checking Java installation..."
if ! command -v java &> /dev/null; then
    echo "ERROR: Java not found. Please install Java 17 or higher"
    echo "Download from: https://adoptium.net/"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | grep -oP 'version "\K[^"]*' | cut -d. -f1)
echo "Java found: $JAVA_VERSION"

if [ "$JAVA_VERSION" -lt 11 ]; then
    echo "ERROR: Java 11 or higher required (found version $JAVA_VERSION)"
    exit 1
fi

# Parse arguments
BUILD_TYPE="${1:-debug}"

case "$BUILD_TYPE" in
    debug)
        echo ""
        echo "Building DEBUG APK..."
        echo ""
        ./gradlew assembleDebug "${@:2}"
        echo ""
        echo "BUILD SUCCESSFUL"
        echo "APK location: app/build/outputs/apk/debug/app-debug.apk"
        ;;
    release)
        echo ""
        echo "Building RELEASE APK..."
        echo ""
        ./gradlew assembleRelease "${@:2}"
        echo ""
        echo "BUILD SUCCESSFUL"
        echo "APK location: app/build/outputs/apk/release/app-release.apk"
        ;;
    clean)
        echo ""
        echo "Cleaning build directory..."
        echo ""
        ./gradlew clean "${@:2}"
        echo ""
        echo "Clean complete"
        ;;
    install)
        echo ""
        echo "Building and installing DEBUG APK to connected device..."
        echo ""
        ./gradlew installDebug "${@:2}"
        echo ""
        echo "INSTALL SUCCESSFUL"
        ;;
    help|--help|-h)
        cat << EOF

Usage: ./build.sh [command] [options]

Commands:
  debug       Build debug APK (default)
  release     Build release APK
  clean       Clean build directory
  install     Build and install to device
  help        Show this help message

Examples:
  ./build.sh               - Build debug APK
  ./build.sh release       - Build release APK
  ./build.sh install       - Install to connected device
  ./build.sh debug -x lint - Build debug without lint checks

EOF
        ;;
    *)
        echo "Unknown command: $BUILD_TYPE"
        echo "Run './build.sh help' for usage information"
        exit 1
        ;;
esac
