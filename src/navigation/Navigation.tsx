// src/navigation/Navigation.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Changed from '../hooks/useAuth'
import AuthNavigator from './AuthNavigator';
import AppStackNavigator from './AppStackNavigator';
import SplashScreen from '../screens/SplashScreen';
import BiometricGate from '../screens/BiometricGateScreen';
import { useBiometricAuth } from '../hooks/useBiometricAuth';

const Navigation: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth(); // Removed isSigningUp as it might not exist in AuthContext
  const { isBiometricEnabled, loadBiometricSettings } = useBiometricAuth();
  const [isBiometricLoaded, setIsBiometricLoaded] = useState(false);

  // Load biometric settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        await loadBiometricSettings();
      } catch (error) {
        console.error('Error loading biometric settings:', error);
      } finally {
        setIsBiometricLoaded(true);
      }
    };
    
    loadSettings();
  }, []);

  if (isLoading || !isBiometricLoaded) {
    return <SplashScreen />;
  }

  // Handle authentication states
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Check if biometric is enabled
  if (isBiometricEnabled) {
    return (
      <BiometricGate
        onAuthSuccess={() => {
          console.log('Biometric authentication successful');
        }}
      >
        <AppStackNavigator />
      </BiometricGate>
    );
  }

  // If biometric is not enabled, go directly to app
  return <AppStackNavigator />;
};

export default Navigation;