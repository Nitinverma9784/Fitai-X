import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resolves the backend root URL (e.g., http://10.0.2.2:5000 or http://localhost:5000 or http://192.168.x.x:5000)
 */
export function getBackendBaseUrl(): string {
  // 1. Explicit environment variable override
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/?$/, '');
  }

  // 2. Web browser environment
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }

  const isAndroid = Platform.OS === 'android';
  const isEmulator = Constants.isDevice === false;

  // On Android emulator, 10.0.2.2 is required to reach host machine's localhost (port 5000).
  if (isAndroid && isEmulator) {
    return 'http://10.0.2.2:5000';
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const devMachineIp = hostUri.split(':')[0];
    if (devMachineIp && devMachineIp !== 'localhost' && devMachineIp !== '127.0.0.1') {
      return `http://${devMachineIp}:5000`;
    }
  }

  return isAndroid ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
}

/**
 * Resolves the API base URL (e.g., http://10.0.2.2:5000/api)
 */
export function getApiBaseUrl(): string {
  return `${getBackendBaseUrl()}/api`;
}
