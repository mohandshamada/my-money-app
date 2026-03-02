import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mymoney.app',
  appName: 'My Money',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'MyMoney'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      releaseType: 'APK'
    },
    allowMixedContent: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#4F46E5'
    },
    Keyboard: {
      resize: 'body',
      style: 'dark'
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#4F46E5'
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#4F46E5',
      sound: 'default'
    },
    BiometricAuth: {
      allowDeviceCredential: true
    }
  }
};

export default config;
