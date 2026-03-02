# 📱 My Money Mobile App

Native iOS and Android apps powered by Capacitor, sharing your existing React web codebase.

## ✅ What's Ready

### Features Implemented
| Feature | Status | Description |
|---------|--------|-------------|
| Biometric Auth | ✅ | Face ID / Touch ID / Fingerprint login |
| Push Notifications | ✅ | Budget alerts, reminders, weekly reports |
| Deep Linking | ✅ | Handle email verification, password reset links |
| Camera Access | ✅ | Receipt photo capture |
| File Upload | ✅ | Import bank statements |
| Offline Storage | ✅ | Secure local data persistence |

### Native Plugins Installed
- `@capacitor/app` - App lifecycle and deep links
- `@capacitor/biometric-auth` - Face ID / Touch ID
- `@capacitor/camera` - Photo capture
- `@capacitor/filesystem` - File system access
- `@capacitor/keyboard` - Native keyboard handling
- `@capacitor/local-notifications` - Push notifications
- `@capacitor/preferences` - Secure storage
- `@capacitor/splash-screen` - Launch screen
- `@capacitor/status-bar` - Status bar styling

---

## 🚀 Quick Build (Tonight)

### Option 1: One Command Setup + Build

```bash
cd /root/cashflow/apps/web

# 1. Setup environment
./setup-mobile.sh

# 2. Build Android
./build.sh android

# Or build both (Android only on Linux)
./build.sh all
```

### Option 2: Manual Step-by-Step

```bash
cd /root/cashflow/apps/web

# 1. Install dependencies
npm install

# 2. Build web assets
npm run build

# 3. Sync to native projects
npx cap sync

# 4. Build Android
./build.sh android
```

---

## 📱 Android Build

### Prerequisites
1. **Android Studio** (latest stable)
   ```bash
   # Download from: https://developer.android.com/studio
   ```

2. **Set ANDROID_HOME environment variable**
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

3. **Install SDK components via Android Studio:**
   - SDK Platform (API 34)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
   - Android Emulator (optional)

### Build Commands

```bash
# Debug APK (for testing)
./build.sh android debug

# Release APK (for Play Store)
./build.sh android release

# Install on connected device
npx cap run android

# Open in Android Studio
npx cap open android
```

### Output Location
- **Debug:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release:** `android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## 🍎 iOS Build (macOS Only)

### Prerequisites
1. **macOS** with Xcode 14+
2. **Xcode** from App Store
3. **CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

### Build Commands

```bash
# Setup
./setup-mobile.sh

# Build
./build.sh ios debug

# Or open in Xcode for manual build
npx cap open ios
```

### Archive for App Store
1. Open `ios/App/App.xcworkspace` in Xcode
2. Select "Any iOS Device" as target
3. Product → Archive
4. Distribute App → App Store Connect

---

## 🔧 Environment Setup Details

### Script: `setup-mobile.sh`

This script sets up everything automatically:

```bash
./setup-mobile.sh
```

**What it does:**
- ✅ Checks Node.js version (18+)
- ✅ Installs npm dependencies
- ✅ Installs Capacitor plugins
- ✅ Syncs web assets to native projects
- ✅ Configures Android SDK paths
- ✅ Installs iOS pods (macOS)
- ✅ Creates icon directories
- ✅ Generates build info

### Script: `build.sh`

Main build script with options:

```bash
# Usage: ./build.sh [platform] [environment]

./build.sh android debug      # Debug APK
./build.sh android release    # Release APK
./build.sh ios debug          # iOS debug build
./build.sh ios release        # iOS archive
./build.sh web               # Web only
./build.sh all               # Everything
```

---

## 🎨 App Icons & Splash Screens

Before building, you should customize the app icons:

### Generate Icons

1. Place your icon (1024x1024 PNG) at `resources/icon.png`
2. Place splash (2732x2732 PNG) at `resources/splash.png`
3. Run:
   ```bash
   npx capacitor-assets generate
   ```

### Manual Icon Placement

**Android:**
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- Sizes: 48x48, 72x72, 96x96, 144x144, 192x192

**iOS:**
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Use Xcode's asset catalog

---

## 🔐 Signing for Release

### Android

1. **Generate keystore:**
   ```bash
   keytool -genkey -v -keystore my-release-key.keystore \
     -alias mymoney -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure in `android/app/build.gradle`:**
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file("my-release-key.keystore")
               storePassword "password"
               keyAlias "mymoney"
               keyPassword "password"
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
           }
       }
   }
   ```

3. **Build signed APK:**
   ```bash
   ./build.sh android release
   ```

### iOS

1. Open `ios/App/App.xcworkspace` in Xcode
2. Go to Signing & Capabilities
3. Select your Apple Developer Team
4. Build archive: Product → Archive

---

## 🌐 Deep Links Configuration

The app handles these URLs:

| URL Pattern | Action |
|-------------|--------|
| `mymoney://verify-email` | Email verification |
| `mymoney://reset-password` | Password reset |
| `mymoney://transaction?id=xxx` | Open transaction |
| `mymoney://budget-alert` | Budget alert |

### iOS Setup
Add to `ios/App/App/Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.mymoney.app</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>mymoney</string>
    </array>
  </dict>
</array>
```

### Android Setup
Already configured in `AndroidManifest.xml` via Capacitor.

---

## 🔔 Push Notifications

### Firebase Setup (Android)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project → Add Android app
3. Download `google-services.json`
4. Place in `android/app/google-services.json`
5. Build again

### APNs Setup (iOS)

1. Apple Developer Portal → Certificates, Identifiers & Profiles
2. Create Push Notification certificate
3. Upload to Firebase or your push provider
4. Configure in Xcode

---

## 📱 Testing on Device

### Android

```bash
# Connect device with USB debugging enabled
adb devices  # Verify connection

# Install and run
npx cap run android

# Or install APK manually
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### iOS

```bash
# Connect iPhone, trust this computer
npx cap run ios --target="Your Device Name"

# Or open in Xcode for device setup
npx cap open ios
```

---

## 📦 Project Structure

```
apps/web/
├── src/                     # React source (shared)
│   ├── services/
│   │   ├── biometric.ts     # Biometric auth
│   │   └── notifications.ts # Push notifications
│   └── ...
├── dist/                    # Web build output
├── ios/                     # iOS native project
│   └── App/
│       ├── App.xcodeproj
│       └── App.xcworkspace
├── android/                 # Android native project
│   └── app/
│       ├── src/main/
│       └── build.gradle
├── capacitor.config.ts      # Capacitor config
├── build.sh                 # Main build script
├── setup-mobile.sh          # Environment setup
└── MOBILE.md               # This file
```

---

## 🆘 Troubleshooting

### Android Build Fails

```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug

# Check SDK path
echo $ANDROID_HOME

# Sync again
npx cap sync android
```

### iOS Build Fails

```bash
# Reinstall pods
cd ios/App
rm -rf Pods Podfile.lock
pod install
cd ../..
npx cap sync ios
```

### Web Assets Not Syncing

```bash
# Force rebuild and sync
npm run build
npx cap sync
```

### Biometric Auth Not Working

- iOS: Add `NSFaceIDUsageDescription` to Info.plist
- Android: Check `USE_BIOMETRIC` permission in manifest

---

## 📚 Next Steps After Build

1. **Test thoroughly** on real devices
2. **Set up CI/CD** for automated builds
3. **Create app store listings**
4. **Add analytics** (Firebase, Mixpanel)
5. **Beta testing** via TestFlight / Play Console

---

## 💡 Tips

- Always test on real devices before submitting
- Use release builds for performance testing
- Enable ProGuard for Android release builds
- Use TestFlight for iOS beta testing
- Monitor crash reports in production

---

## 📞 Support

- Capacitor Docs: https://capacitorjs.com/docs
- iOS Publishing: https://capacitorjs.com/docs/ios/deploying-to-app-store
- Android Publishing: https://capacitorjs.com/docs/android/deploying-to-google-play

**Good luck with your build tonight! 🚀**
