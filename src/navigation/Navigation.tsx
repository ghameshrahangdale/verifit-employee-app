import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import AppStackNavigator from './AppStackNavigator';
import SplashScreen from '../screens/SplashScreen';
import BiometricGate from '../screens/BiometricGateScreen';
import { useBiometricAuth } from '../hooks/useBiometricAuth';

const Navigation: React.FC = () => {
  const { isAuthenticated, isLoading, isSigningUp } = useAuth();
  const { isBiometricEnabled, loadBiometricSettings } = useBiometricAuth();
  const [isBiometricLoaded, setIsBiometricLoaded] = useState(false);

  // Load biometric settings
  useEffect(() => {
    const loadSettings = async () => {
      await loadBiometricSettings();
      setIsBiometricLoaded(true);
    };
    
    loadSettings();
  }, []);

  // Show splash screen while loading
  if (isLoading || !isBiometricLoaded) {
    return <SplashScreen />;
  }

  // Handle authentication states
  if (!isAuthenticated || isSigningUp) {
    return <AuthNavigator />;
  }

  // Wrap authenticated app with biometric gate
  return (
    <BiometricGate
      onAuthSuccess={() => {
        // This callback is called when biometric auth succeeds
        console.log('Biometric authentication successful');
      }}
    >
      <AppStackNavigator />
    </BiometricGate>
  );
};

export default Navigation;