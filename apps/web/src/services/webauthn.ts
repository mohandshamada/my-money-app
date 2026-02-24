import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const AUTH_BASE = API_URL.startsWith('http') ? `${API_URL}/api` : API_URL;

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const registerPasskey = async (name: string = 'My Passkey') => {
  try {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      throw new Error('WebAuthn is not supported in this browser. Please use Chrome, Safari, or Edge.');
    }

    // Check if platform authenticator is available
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) {
      throw new Error('Platform authenticator not available. Your device may not support passkeys.');
    }

    // 1. Get options from server
    console.log('📡 Fetching registration options...');
    const startResp = await axios.post(
      `${AUTH_BASE}/auth/passkey/register/start`,
      {},
      { headers: getAuthHeaders() }
    );

    console.log('📦 Raw response:', startResp.data);

    const { options, challengeToken, error } = startResp.data;

    if (error) {
      throw new Error(`Server error: ${error}`);
    }

    if (!options) {
      throw new Error('No registration options received from server');
    }

    // Validate all required fields
    const requiredFields = ['challenge', 'rp', 'user', 'pubKeyCredParams'];
    for (const field of requiredFields) {
      if (!options[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    console.log('✅ Options validation passed:', {
      challenge: options.challenge?.substring(0, 20) + '...',
      rpId: options.rp?.id,
      userId: options.user?.id?.substring(0, 20) + '...',
    });

    // 2. Call WebAuthn API directly first to test
    console.log('🚀 Calling startRegistration...');
    console.log('Options being passed:', JSON.stringify(options, null, 2));
    
    let credential;
    try {
      // Use simplewebauthn's startRegistration
      credential = await startRegistration(options);
      console.log('✅ Registration successful:', credential);
    } catch (webAuthnError: any) {
      console.error('❌ WebAuthn Error:', webAuthnError);
      
      // Provide specific error messages
      if (webAuthnError.name === 'NotAllowedError') {
        throw new Error('Registration was cancelled or not allowed. Make sure to use your device\'s biometric or PIN when prompted.');
      } else if (webAuthnError.name === 'SecurityError') {
        throw new Error('Security error: The current origin is not allowed to use WebAuthn.');
      } else if (webAuthnError.name === 'InvalidStateError') {
        throw new Error('This passkey may already be registered.');
      } else {
        throw new Error(`WebAuthn error: ${webAuthnError.message || 'Unknown error'}`);
      }
    }

    // 3. Verify with server
    console.log('📡 Verifying registration with server...');
    const verifyResp = await axios.post(
      `${AUTH_BASE}/auth/passkey/register/verify`,
      {
        credential,
        challengeToken,
        name
      },
      { headers: getAuthHeaders() }
    );

    console.log('✅ Passkey registered successfully!');
    return verifyResp.data;
  } catch (error: any) {
    console.error('Passkey registration failed:', error);
    throw error;
  }
};

export const authenticatePasskey = async () => {
  try {
    // 1. Get options from server
    const startResp = await axios.post(`${AUTH_BASE}/auth/passkey/authenticate/start`);
    
    const { options, challengeToken } = startResp.data;

    // 2. Pass options to browser authenticator
    const credential = await startAuthentication(options);

    // 3. Verify with server
    const verifyResp = await axios.post(`${AUTH_BASE}/auth/passkey/authenticate/verify`, {
      credential,
      challengeToken
    });

    return verifyResp.data;
  } catch (error) {
    console.error('Passkey authentication failed:', error);
    throw error;
  }
};

export const listPasskeys = async () => {
  const response = await axios.get(
    `${AUTH_BASE}/auth/passkeys`,
    { headers: getAuthHeaders() }
  );
  return response.data.passkeys;
};

export const deletePasskey = async (id: string) => {
  await axios.delete(
    `${AUTH_BASE}/auth/passkeys/${id}`,
    { headers: getAuthHeaders() }
  );
};
