import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.morador.app',
  appName: 'morador-hub',
  webDir: 'dist',
  server: {
    url: 'https://c6512143-7fca-4957-8025-576dccbd06ec.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    // version é exibida ao usuário (CFBundleShortVersionString)
    // build é o número interno (CFBundleVersion)
    scheme: 'morador-hub',
  },
  android: {
    // versionName e versionCode são definidos no build.gradle
  },
};

export default config;
