#!/bin/bash

# My Money Mobile App Build Script
# Usage: ./build-mobile.sh [ios|android|both]

set -e

PLATFORM=${1:-both}

echo "🚀 My Money Mobile App Builder"
echo "================================"

# Check if dist folder exists and has content
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    echo "📦 Building web app first..."
    npm run build
fi

# Sync web assets to native projects
echo "🔄 Syncing web assets to native projects..."
npx cap sync

if [ "$PLATFORM" == "ios" ] || [ "$PLATFORM" == "both" ]; then
    echo ""
    echo "📱 Building iOS app..."
    echo "================================"
    
    # Check if we're on macOS (required for iOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        cd ios/App
        
        # Install pods if needed
        if [ ! -d "Pods" ]; then
            echo "📥 Installing CocoaPods dependencies..."
            pod install
        fi
        
        cd ../..
        
        echo "✅ iOS project ready!"
        echo ""
        echo "To build and run on iOS:"
        echo "  npx cap open ios"
        echo ""
        echo "Or use Xcode to build and deploy to device/simulator"
    else
        echo "⚠️  iOS builds require macOS with Xcode installed"
        echo "   Skipping iOS build..."
    fi
fi

if [ "$PLATFORM" == "android" ] || [ "$PLATFORM" == "both" ]; then
    echo ""
    echo "🤖 Building Android app..."
    echo "================================"
    
    cd android
    
    # Make gradlew executable
    chmod +x gradlew
    
    # Build debug APK
    echo "🔨 Building debug APK..."
    ./gradlew assembleDebug
    
    cd ..
    
    echo "✅ Android build complete!"
    echo ""
    echo "APK location:"
    echo "  android/app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "To install on connected device:"
    echo "  npx cap run android"
    echo ""
    echo "To open in Android Studio:"
    echo "  npx cap open android"
fi

echo ""
echo "🎉 Mobile app build complete!"
echo ""
echo "Next steps:"
echo "  - For iOS: npx cap open ios (requires macOS + Xcode)"
echo "  - For Android: npx cap open android"
echo "  - For testing: npx cap run android"
