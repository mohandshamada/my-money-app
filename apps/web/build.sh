#!/bin/bash

# My Money Mobile - Complete Build Script
# Usage: ./build.sh [android|ios|web|all]

set -e

PLATFORM=${1:-all}
ENV=${2:-debug}

echo "🚀 My Money Mobile Build"
echo "========================="
echo "Platform: $PLATFORM"
echo "Environment: $ENV"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Pre-build checks
check_prerequisites() {
    echo "🔍 Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found"
        exit 1
    fi
    
    # Check if dist exists
    if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
        log_warn "Web build not found. Building now..."
        npm run build
    fi
    
    log_info "Prerequisites OK"
}

# Build web assets
build_web() {
    echo ""
    echo "📦 Building Web Assets"
    echo "---------------------"
    
    npm run build
    
    log_info "Web build complete"
}

# Sync to native projects
sync_native() {
    echo ""
    echo "🔄 Syncing to Native Projects"
    echo "-----------------------------"
    
    npx cap sync
    
    log_info "Sync complete"
}

# Build Android
build_android() {
    echo ""
    echo "📱 Building Android"
    echo "------------------"
    
    # Check Android SDK
    if [ -z "$ANDROID_HOME" ] && [ ! -f "android/local.properties" ]; then
        log_error "Android SDK not configured"
        echo "Please set ANDROID_HOME or run ./setup-mobile.sh"
        exit 1
    fi
    
    cd android
    
    # Clean previous build
    ./gradlew clean
    
    if [ "$ENV" == "release" ]; then
        log_info "Building Release APK..."
        ./gradlew assembleRelease
        
        APK_PATH="app/build/outputs/apk/release/app-release-unsigned.apk"
        
        if [ -f "$APK_PATH" ]; then
            log_info "Release APK created:"
            echo "   📦 $APK_PATH"
            echo ""
            echo "⚠️  APK is unsigned. To sign:"
            echo "   jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \\"
            echo "     -keystore my-release-key.keystore \\"
            echo "     $APK_PATH alias_name"
        fi
    else
        log_info "Building Debug APK..."
        ./gradlew assembleDebug
        
        APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
        
        if [ -f "$APK_PATH" ]; then
            log_info "Debug APK created:"
            echo "   📦 $APK_PATH"
            echo ""
            echo "To install on device:"
            echo "   adb install $APK_PATH"
            echo ""
            echo "Or run directly:"
            echo "   npx cap run android"
        fi
    fi
    
    cd ..
}

# Build iOS
build_ios() {
    echo ""
    echo "🍎 Building iOS"
    echo "---------------"
    
    if [[ "$OSTYPE" != "darwin"* ]]; then
        log_error "iOS builds require macOS"
        return 1
    fi
    
    # Check Xcode
    if ! command -v xcodebuild &> /dev/null; then
        log_error "Xcode not found. Install from App Store."
        exit 1
    fi
    
    cd ios/App
    
    # Install pods if needed
    if [ ! -d "Pods" ]; then
        log_info "Installing CocoaPods..."
        pod install
    fi
    
    if [ "$ENV" == "release" ]; then
        log_info "Building Release Archive..."
        
        xcodebuild -workspace App.xcworkspace \
            -scheme App \
            -sdk iphoneos \
            -configuration Release \
            archive \
            -archivePath build/MyMoney.xcarchive
        
        log_info "Archive created at:"
        echo "   📦 build/MyMoney.xcarchive"
        echo ""
        echo "Export with:"
        echo "   xcodebuild -exportArchive \\"
        echo "     -archivePath build/MyMoney.xcarchive \\"
        echo "     -exportPath build/MyMoney.ipa \\"
        echo "     -exportOptionsPlist exportOptions.plist"
    else
        log_info "Building Debug..."
        
        xcodebuild -workspace App.xcworkspace \
            -scheme App \
            -sdk iphonesimulator \
            -configuration Debug \
            build
        
        log_info "Debug build complete"
        echo "   Open in Xcode: open App.xcworkspace"
        echo "   Or run: npx cap run ios"
    fi
    
    cd ../..
}

# Main build flow
main() {
    cd "$(dirname "$0")"
    
    # Pre-build checks
    check_prerequisites
    
    # Build web if needed
    if [ "$PLATFORM" == "web" ] || [ "$PLATFORM" == "all" ]; then
        build_web
    fi
    
    # Sync native projects
    if [ "$PLATFORM" != "web" ]; then
        sync_native
    fi
    
    # Build requested platforms
    case "$PLATFORM" in
        android)
            build_android
            ;;
        ios)
            build_ios
            ;;
        web)
            log_info "Web build only. Files in dist/"
            ;;
        all)
            build_android
            if [[ "$OSTYPE" == "darwin"* ]]; then
                build_ios
            fi
            ;;
        *)
            log_error "Unknown platform: $PLATFORM"
            echo "Usage: ./build.sh [android|ios|web|all] [debug|release]"
            exit 1
            ;;
    esac
    
    echo ""
    echo "========================="
    log_info "Build Complete!"
    echo "========================="
}

# Run main
main
