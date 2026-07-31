import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolves the backend root URL (e.g., http://10.0.2.2:5000 or http://localhost:5000 or http://192.168.x.x:5000)
 */
export function getBackendBaseUrl(): string {
  // Web browser environment
  if (Platform.OS === 'web') {
    if (process.env.EXPO_PUBLIC_API_URL && !process.env.EXPO_PUBLIC_API_URL.includes('localhost')) {
      return process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/?$/, '');
    }
    return 'http://localhost:5000';
  }

  const isAndroid = Platform.OS === 'android';
  const isEmulator = Constants.isDevice === false;

  // On Android emulator, 10.0.2.2 is required to reach host machine's localhost (port 5000).
  if (isAndroid && isEmulator) {
    return 'http://10.0.2.2:5000';
  }

  // Extract host IP when running on Expo Go or physical device connected over local Wi-Fi
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const devMachineIp = hostUri.split(':')[0];
    if (devMachineIp && devMachineIp !== 'localhost' && devMachineIp !== '127.0.0.1') {
      return `http://${devMachineIp}:5000`;
    }
  }

  // 1. Explicit environment variable override
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/?$/, '');
  }

  return isAndroid ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
}

/**
 * Resolves the API base URL (e.g., http://10.0.2.2:5000/api)
 */
export function getApiBaseUrl(): string {
  return `${getBackendBaseUrl()}/api`;
}
