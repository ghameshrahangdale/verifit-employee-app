// src/navigation/Navigation.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppStackNavigator from './AppStackNavigator';
import SplashScreen from '../screens/SplashScreen';
import BiometricGate from '../screens/BiometricGateScreen';
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import { Screen } from '../components/layout/Screen';

const SPLASH_MIN_DURATION = 3000; // ms

const Navigation: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isBiometricEnabled, loadBiometricSettings } = useBiometricAuth();

  const [isBiometricLoaded, setIsBiometricLoaded] = useState(false);
  const [minTimerDone, setMinTimerDone] = useState(false);

  // Enforce minimum splash duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimerDone(true);
    }, SPLASH_MIN_DURATION);
    return () => clearTimeout(timer);
  }, []);

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

  // Show splash until BOTH the min timer AND all loading is done
  const showSplash = !minTimerDone || isLoading || !isBiometricLoaded;

  if (showSplash) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

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

  return (
    <Screen>
      <AppStackNavigator />
    </Screen>
  );
};

export default Navigation;