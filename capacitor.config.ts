
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f67059b223a446f8bf2e3f97ab6b202d',
  appName: 'f-2639',
  webDir: 'dist',
  server: {
    url: 'https://f67059b2-23a4-46f8-bf2e-3f97ab6b202d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
