#!/bin/bash

# Environment Check Script for My Money Mobile
# Run this before building to verify everything is ready

echo "🔍 My Money Mobile - Environment Check"
echo "======================================="
echo ""

ERRORS=0
WARNINGS=0

# Helper functions
pass() {
    echo "✅ $1"
}

warn() {
    echo "⚠️  $1"
    ((WARNINGS++))
}

fail() {
    echo "❌ $1"
    ((ERRORS++))
}

# Check Node.js
echo "📦 Node.js"
echo "----------"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    pass "Node.js installed: $NODE_VERSION"
    
    # Check version 18+
    NODE_MAJOR=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        pass "Node.js version is 18+"
    else
        fail "Node.js version must be 18 or higher"
    fi
else
    fail "Node.js not found"
fi

# Check npm
if command -v npm &> /dev/null; then
    pass "npm installed: $(npm -v)"
else
    fail "npm not found"
fi

echo ""

# Check Project
echo "📁 Project"
echo "----------"
if [ -d "node_modules" ]; then
    pass "node_modules exists"
else
    warn "node_modules missing - run: npm install"
fi

if [ -d "dist" ] && [ "$(ls -A dist 2>/dev/null)" ]; then
    pass "Web build (dist/) exists"
else
    warn "Web build missing - run: npm run build"
fi

if [ -d "ios" ]; then
    pass "iOS project exists"
else
    warn "iOS project missing - run: npx cap add ios"
fi

if [ -d "android" ]; then
    pass "Android project exists"
else
    warn "Android project missing - run: npx cap add android"
fi

echo ""

# Check Android
echo "📱 Android"
echo "----------"
if [ -n "$ANDROID_HOME" ]; then
    pass "ANDROID_HOME set: $ANDROID_HOME"
    
    if [ -d "$ANDROID_HOME" ]; then
        pass "Android SDK directory exists"
    else
        fail "ANDROID_HOME directory does not exist"
    fi
else
    fail "ANDROID_HOME not set"
    echo "   Set it in your shell profile:"
    echo "   export ANDROID_HOME=\$HOME/Android/Sdk"
fi

if [ -f "android/local.properties" ]; then
    pass "local.properties exists"
else
    warn "local.properties missing - will be created during setup"
fi

if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'"' -f2)
    pass "Java installed: $JAVA_VERSION"
else
    warn "Java not found - Android builds require Java"
fi

echo ""

# Check iOS (macOS only)
echo "🍎 iOS"
echo "------"
if [[ "$OSTYPE" == "darwin"* ]]; then
    pass "Running on macOS"
    
    if command -v xcodebuild &> /dev/null; then
        XCODE_VERSION=$(xcodebuild -version | head -1)
        pass "$XCODE_VERSION"
    else
        fail "Xcode not found - install from App Store"
    fi
    
    if command -v pod &> /dev/null; then
        pass "CocoaPods installed: $(pod --version)"
    else
        warn "CocoaPods not found - install with: sudo gem install cocoapods"
    fi
    
    if [ -d "ios/App/Pods" ]; then
        pass "iOS pods installed"
    else
        warn "iOS pods missing - run: cd ios/App && pod install"
    fi
else
    echo "ℹ️  iOS builds require macOS (not available on this system)"
fi

echo ""

# Summary
echo "======================================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ All checks passed! Ready to build."
    echo ""
    echo "Build commands:"
    echo "  ./build.sh android    # Build Android"
    echo "  ./build.sh ios        # Build iOS (macOS only)"
    echo "  ./build.sh all        # Build all platforms"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  $WARNINGS warning(s) found. You can build but some features may not work."
    echo ""
    echo "To fix warnings, run: ./setup-mobile.sh"
    exit 0
else
    echo "❌ $ERRORS error(s) and $WARNINGS warning(s) found."
    echo ""
    echo "Please fix the errors above before building."
    echo "Run: ./setup-mobile.sh"
    exit 1
fi
