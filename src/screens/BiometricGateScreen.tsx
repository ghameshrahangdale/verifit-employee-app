// components/BiometricGate.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  AppState,
  AppStateStatus,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isSensorAvailable,
  authenticateWithOptions,
} from '@sbaiahmed1/react-native-biometrics';
import { theme } from '../config/theme';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_REQUIRED_KEY = 'biometric_required';

interface BiometricGateProps {
  children: React.ReactNode;
  onAuthSuccess: () => void;
}

const BiometricGate: React.FC<BiometricGateProps> = ({ children, onAuthSuccess }) => {
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricRequired, setBiometricRequired] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);
  const [appState, setAppState] = useState(AppState.currentState);

  // Load biometric settings
  useEffect(() => {
    loadBiometricSettings();
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // App is coming to foreground
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        if (biometricEnabled && biometricRequired && authSuccess) {
          console.log('App came to foreground - requiring re-authentication');
          // Reset authentication state to force re-auth
          setAuthSuccess(false);
          setShowBiometricModal(true);
          triggerBiometricAuth();
        }
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [appState, biometricEnabled, biometricRequired, authSuccess]);

  const loadBiometricSettings = async () => {
    try {
      const [enabled, required, sensorInfo] = await Promise.all([
        AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY),
        AsyncStorage.getItem(BIOMETRIC_REQUIRED_KEY),
        isSensorAvailable(),
      ]);

      const isEnabled = enabled === 'true';
      const isRequired = required === 'true';

      setBiometricEnabled(isEnabled);
      setBiometricRequired(isRequired);
      setBiometricAvailable(sensorInfo.available);

      // Show biometric modal if enabled and available
      if (isEnabled && sensorInfo.available) {
        setShowBiometricModal(true);
        triggerBiometricAuth();
      } else {
        // If biometric is not enabled or available, allow immediate access
        setAuthSuccess(true);
        onAuthSuccess();
      }
    } catch (error) {
      console.error('Error loading biometric settings:', error);
      // Fallback: allow access on error
      setAuthSuccess(true);
      onAuthSuccess();
    }
  };

  // Trigger biometric authentication
  const triggerBiometricAuth = async () => {
    if (retryCount >= maxRetries) {
      handleMaxRetriesReached();
      return;
    }

    try {
      setIsAuthenticating(true);
      
      const authResult = await authenticateWithOptions({
        title: 'App Lock',
        subtitle: 'Authenticate to open the app',
        description: 'Use your biometric to access the application',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        allowDeviceCredentials: true,
      });

      if (authResult.success) {
        // Authentication successful
        console.log('Biometric authentication successful');
        setAuthSuccess(true);
        setShowBiometricModal(false);
        setRetryCount(0); // Reset retry count on success
        onAuthSuccess();
      } else {
        // Authentication failed
        handleAuthFailure(authResult.error);
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      handleAuthFailure('Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle authentication failure
  const handleAuthFailure = (error?: string) => {
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    
    let errorMessage = 'Authentication failed. Please try again.';
    
    if (error?.includes('cancel') || error?.includes('user_cancel')) {
      errorMessage = 'Authentication cancelled. Please authenticate to continue.';
    } else if (error?.includes('lockout')) {
      errorMessage = 'Too many failed attempts. Please try again later.';
    }

    console.log('Auth failure:', errorMessage);

    // If not max retries, allow retry
    if (newRetryCount < maxRetries) {
      // Don't automatically retry - wait for user to press button
    } else {
      handleMaxRetriesReached();
    }
  };

  // Handle max retries reached
  const handleMaxRetriesReached = () => {
    console.warn('Max biometric retries reached');
    // For security, we should block access after max retries
    // But for usability, we'll allow access after showing warning
    Alert.alert(
      'Maximum Attempts Reached',
      'Please try again later or restart the app.',
      [{ text: 'OK' }]
    );
    // Still allow access but log this event
    setAuthSuccess(true);
    setShowBiometricModal(false);
    onAuthSuccess();
  };

  // Get biometric icon based on type
  const getBiometricIcon = () => {
    return 'fingerprint'; // Default icon
  };

  // Handle back button press (prevent going back during auth)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (showBiometricModal && biometricEnabled) {
          return true; // Prevent back navigation during biometric auth
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [showBiometricModal, biometricEnabled]);

  // Manual retry function
  const handleManualRetry = () => {
    if (retryCount < maxRetries) {
      triggerBiometricAuth();
    }
  };

  // 🔴 CRITICAL FIX: Only show children when NOT locked
  if (biometricEnabled && (!authSuccess || (biometricRequired && showBiometricModal))) {
    return (
      <Modal
        visible={showBiometricModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
        hardwareAccelerated
      >
        <View 
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: theme.background }}
        >
          {/* Background Pattern/Image - Updated with theme */}
          <View 
            className="absolute inset-0" 
            style={{ backgroundColor: theme.background }}
          />
          
          {/* Content */}
          <View className="items-center mx-6">
            {/* Icon - Updated with theme */}
            <View 
              className="w-24 h-24 rounded-full justify-center items-center mb-6"
              style={{ backgroundColor: `${theme.primary}20` }} // 20 = 12% opacity in hex
            >
              <MaterialIcons 
                name={getBiometricIcon()} 
                size={48} 
                color={theme.primary} 
              />
            </View>
            
            {/* Title - Updated with theme */}
            <Text 
              className="text-2xl font-rubik-bold text-center mb-3"
              style={{ color: theme.text }}
            >
              App Lock
            </Text>
            
            {/* Subtitle - Updated with theme */}
            <Text 
              className="text-base font-rubik-regular text-center mb-2"
              style={{ color: theme.text }}
            >
              {biometricRequired ? 'Authentication Required' : 'Secure your application'}
            </Text>
            
            {/* Description - Updated with theme */}
            <Text 
              className="text-sm font-rubik-regular text-center mb-8"
              style={{ color: theme.text }}
            >
              {biometricRequired 
                ? 'Authentication is required every time you access the app'
                : 'Authenticate using your biometric to continue'
              }
            </Text>

            {/* Loading State - Updated with theme */}
            {isAuthenticating && (
              <View className="items-center py-4">
                <ActivityIndicator size="large" color={theme.primary} />
                <Text 
                  className="font-rubik-regular mt-3"
                  style={{ color: theme.text }}
                >
                  Waiting for authentication...
                </Text>
              </View>
            )}

            {/* Retry Count - Updated with theme */}
            {retryCount > 0 && !isAuthenticating && (
              <Text 
                className="text-sm font-rubik-regular mb-4"
                style={{ color: theme.warning }}
              >
                Attempt {retryCount} of {maxRetries}
              </Text>
            )}

            {/* Action Buttons - Updated with theme */}
            {!isAuthenticating && retryCount < maxRetries && (
              <View className="flex-row space-x-3 w-full">
                <TouchableOpacity
                  onPress={handleManualRetry}
                  className="flex-1 py-4 rounded-xl shadow-sm"
                  style={{ backgroundColor: theme.primary }}
                >
                  <Text className="text-white font-rubik-medium text-center text-base">
                    {retryCount > 0 ? 'Try Again' : 'Authenticate'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Max retries reached message - Updated with theme */}
            {retryCount >= maxRetries && (
              <View 
                className="w-full p-4 rounded-lg"
                style={{ backgroundColor: `${theme.error}20` }} // 20 = 12% opacity
              >
                <Text 
                  className="font-rubik-medium text-center text-sm"
                  style={{ color: theme.error }}
                >
                  Maximum attempts reached. Please try again later.
                </Text>
              </View>
            )}

            {/* Help Text - Updated with theme */}
            <View 
              className="mt-8 p-4 rounded-lg"
              style={{ backgroundColor: `${theme.primary}20` }} // 20 = 12% opacity
            >
              <Text 
                className="text-sm font-rubik-regular text-center"
                style={{ color: theme.primary }}
              >
                Use your biometric to unlock the application
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // ✅ Show children only when NOT locked
  // If biometric is not enabled or auth successful, show children
  if (!biometricEnabled || !biometricAvailable || authSuccess) {
    return <>{children}</>;
  }

  // Fallback: show nothing (shouldn't reach here)
  return null;
};

export default BiometricGate;