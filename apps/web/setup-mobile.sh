#!/bin/bash

# My Money Mobile App - Environment Setup Script
# Run this before building to configure everything

set -e

echo "🚀 My Money Mobile Setup"
echo "========================="
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✅ npm $(npm -v)"

echo ""
echo "📦 Installing dependencies..."
cd "$(dirname "$0")"
npm install

# Install Capacitor plugins
echo ""
echo "🔌 Installing native plugins..."
npm install @capacitor/app
npm install @capacitor/biometric-auth

echo ""
echo "🔄 Syncing native projects..."
npx cap sync

echo ""
echo "🔧 Configuring native projects..."

# Android Setup
echo ""
echo "📱 Android Configuration"
echo "------------------------"

# Create local.properties for Android SDK if ANDROID_HOME is set
if [ -n "$ANDROID_HOME" ]; then
    echo "sdk.dir=$ANDROID_HOME" > android/local.properties
    echo "✅ Android SDK configured: $ANDROID_HOME"
else
    echo "⚠️  ANDROID_HOME not set. You'll need to:"
    echo "   1. Install Android Studio"
    echo "   2. Set ANDROID_HOME environment variable"
    echo "   3. Or create android/local.properties with:"
    echo "      sdk.dir=/path/to/android/sdk"
fi

# iOS Setup (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo ""
    echo "🍎 iOS Configuration"
    echo "-------------------"
    
    if command -v pod &> /dev/null; then
        echo "✅ CocoaPods found"
        
        # Install iOS pods
        cd ios/App
        if [ ! -d "Pods" ]; then
            echo "📥 Installing iOS dependencies..."
            pod install
        fi
        cd ../..
        echo "✅ iOS pods installed"
    else
        echo "⚠️  CocoaPods not found. Install with:"
        echo "   sudo gem install cocoapods"
    fi
    
    # Check Xcode
    if command -v xcodebuild &> /dev/null; then
        XCODE_VERSION=$(xcodebuild -version | head -1)
        echo "✅ $XCODE_VERSION"
    else
        echo "⚠️  Xcode not found. Install from App Store."
    fi
else
    echo ""
    echo "ℹ️  iOS builds require macOS. Skipping iOS setup."
fi

echo ""
echo "🎨 Setting up app icons and splash screens..."

# Create icon directories if they don't exist
mkdir -p android/app/src/main/res/mipmap-hdpi
mkdir -p android/app/src/main/res/mipmap-mdpi
mkdir -p android/app/src/main/res/mipmap-xhdpi
mkdir -p android/app/src/main/res/mipmap-xxhdpi
mkdir -p android/app/src/main/res/mipmap-xxxhdpi
mkdir -p android/app/src/main/res/drawable

echo "✅ Icon directories created"

echo ""
echo "📝 Creating build configuration..."

# Create a build info file
cat > build-info.json << EOF
{
  "appName": "My Money",
  "appId": "com.mymoney.app",
  "version": "1.0.0",
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "platforms": {
    "android": {
      "configured": true,
      "minSdk": 22,
      "targetSdk": 34
    },
    "ios": {
      "configured": $([ "$OSTYPE" == "darwin"* ] && echo "true" || echo "false"),
      "minVersion": "14.0"
    }
  },
  "features": [
    "Biometric Authentication",
    "Push Notifications",
    "Deep Linking",
    "Camera Access",
    "File Upload",
    "Offline Storage"
  ]
}
EOF

echo "✅ Build info created"

echo ""
echo "========================="
echo "✅ Setup Complete!"
echo "========================="
echo ""
echo "Next steps for building:"
echo ""
echo "📱 Android:"
echo "   1. Install Android Studio"
echo "   2. Set ANDROID_HOME environment variable"
echo "   3. Run: ./build-mobile.sh android"
echo ""
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 iOS:"
    echo "   1. Open ios/App/App.xcworkspace in Xcode"
    echo "   2. Configure signing in Xcode"
    echo "   3. Run: ./build-mobile.sh ios"
    echo ""
fi
echo "🌐 Web (for testing):"
echo "   npm run dev"
echo ""
echo "📚 Documentation:"
echo "   cat MOBILE.md"
echo ""
