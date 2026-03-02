// hooks/useBiometricAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
  isSensorAvailable,
  simplePrompt,
  authenticateWithOptions,
} from '@sbaiahmed1/react-native-biometrics';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_REQUIRED_KEY = 'biometric_required';
const LAST_ACTIVE_KEY = 'last_active_time';

export const useBiometricAuth = () => {
  const navigation = useNavigation();
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isBiometricRequired, setIsBiometricRequired] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Load biometric settings
  const loadBiometricSettings = useCallback(async () => {
    try {
      const [enabled, required, sensorInfo] = await Promise.all([
        AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY),
        AsyncStorage.getItem(BIOMETRIC_REQUIRED_KEY),
        isSensorAvailable(),
      ]);

      setIsBiometricEnabled(enabled === 'true');
      setIsBiometricRequired(required === 'true');
      setIsBiometricAvailable(sensorInfo.available);

      return {
        enabled: enabled === 'true',
        required: required === 'true',
        available: sensorInfo.available,
      };
    } catch (error) {
      console.error('Error loading biometric settings:', error);
      return { enabled: false, required: false, available: false };
    }
  }, []);

  // Check if authentication is required
  const isAuthRequired = useCallback(async (): Promise<boolean> => {
    if (!isBiometricEnabled) return false;

    if (isBiometricRequired) {
      return true; // Always require for sensitive actions
    }

    // Check if app was in background for more than 30 seconds
    try {
      const lastActive = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
      if (!lastActive) return true;

      const lastActiveTime = parseInt(lastActive, 10);
      const currentTime = Date.now();
      const timeDiff = currentTime - lastActiveTime;

      // Require auth if app was in background for more than 30 seconds
      return timeDiff > 30000;
    } catch (error) {
      console.error('Error checking auth requirement:', error);
      return true; // Require auth on error for security
    }
  }, [isBiometricEnabled, isBiometricRequired]);

  // Perform biometric authentication
  const authenticate = useCallback(async (options?: {
    title?: string;
    subtitle?: string;
    description?: string;
  }): Promise<boolean> => {
    if (!isBiometricEnabled || !isBiometricAvailable) {
      return true; // Allow access if biometric is not enabled
    }

    try {
      setIsAuthenticating(true);

      const authResult = await authenticateWithOptions({
        title: options?.title || 'Authentication Required',
        subtitle: options?.subtitle || 'Verify your identity to continue',
        description: options?.description || 'Use your biometric to access the app',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        allowDeviceCredentials: true,
      });

      if (authResult.success) {
        // Update last active time
        await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [isBiometricEnabled, isBiometricAvailable]);

  // Check and require authentication when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        const authNeeded = await isAuthRequired();
        if (authNeeded && isBiometricEnabled) {
          const success = await authenticate({
            title: 'Welcome Back',
            subtitle: 'Authenticate to continue',
            description: 'Your session has expired. Please authenticate again.',
          });

          if (!success) {
            // If authentication failed, navigate to a safe screen or show error
            navigation.navigate('Home' as never);
          }
        }
      } else if (nextAppState === 'background') {
        // Store when app went to background
        await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [isBiometricEnabled, isAuthRequired, authenticate, navigation]);

  // Initialize on mount
  useEffect(() => {
    loadBiometricSettings();
  }, [loadBiometricSettings]);

  return {
    isBiometricEnabled,
    isBiometricAvailable,
    isBiometricRequired,
    isAuthenticating,
    authenticate,
    loadBiometricSettings,
  };
};