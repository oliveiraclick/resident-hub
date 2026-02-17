import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.morador.app',
  appName: 'O Morador',
  webDir: 'dist',
  server: {
    allowNavigation: ['*'],
    cleartext: true
  },
  ios: {
    contentInset: 'always',
    scheme: 'morador-hub'
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1A1A2E',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#FBBF24'
    }
  }
};

export default config;