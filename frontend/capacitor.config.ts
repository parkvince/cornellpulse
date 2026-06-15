import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cornellpulse.app',
  appName: 'CornellPulse',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0f0f0f",
      showSpinner: false,
    },
  },
};

export default config;