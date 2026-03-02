import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Preferences } from '@capacitor/preferences';

const BIOMETRIC_KEY = 'biometric_enabled';

export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable;
  } catch {
    return false;
  }
}

export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const { value } = await Preferences.get({ key: BIOMETRIC_KEY });
    return value === 'true';
  } catch {
    return false;
  }
}

export async function enableBiometric(): Promise<void> {
  await Preferences.set({ key: BIOMETRIC_KEY, value: 'true' });
}

export async function disableBiometric(): Promise<void> {
  await Preferences.set({ key: BIOMETRIC_KEY, value: 'false' });
}

export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    await NativeBiometric.verifyIdentity({
      reason: 'Authenticate to access My Money',
      title: 'Authentication Required',
      subtitle: 'Verify your identity',
      description: 'Use your biometric credential to access the app',
    });
    return true;
  } catch (error) {
    console.error('Biometric auth failed:', error);
    return false;
  }
}

export async function getBiometricType(): Promise<string> {
  try {
    const result = await NativeBiometric.isAvailable();
    if (!result.isAvailable) return 'none';
    
    // The plugin returns biometryType
    const typeMap: Record<string, string> = {
      'FACE_ID': 'Face ID',
      'TOUCH_ID': 'Touch ID',
      'FINGERPRINT': 'Fingerprint',
      'FACE': 'Face Recognition',
      'IRIS': 'Iris Scan',
      'NONE': 'None'
    };
    
    return typeMap[result.biometryType] || 'Biometric';
  } catch {
    return 'none';
  }
}

// Store credentials securely with biometric
export async function storeCredentialsWithBiometric(
  username: string,
  password: string
): Promise<void> {
  try {
    await NativeBiometric.setCredentials({
      username,
      password,
      server: 'com.mymoney.app'
    });
  } catch (error) {
    console.error('Failed to store credentials:', error);
    throw error;
  }
}

// Retrieve credentials with biometric
export async function getCredentialsWithBiometric(): Promise<{ username: string; password: string } | null> {
  try {
    const credentials = await NativeBiometric.getCredentials({
      server: 'com.mymoney.app'
    });
    return credentials;
  } catch (error) {
    console.error('Failed to get credentials:', error);
    return null;
  }
}

// Delete stored credentials
export async function deleteStoredCredentials(): Promise<void> {
  try {
    await NativeBiometric.deleteCredentials({
      server: 'com.mymoney.app'
    });
  } catch (error) {
    console.error('Failed to delete credentials:', error);
  }
}
