import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Switch, Alert, ActivityIndicator, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/ui/Header';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isSensorAvailable,
  simplePrompt,
  authenticateWithOptions,
  createKeys,
  deleteKeys,
} from '@sbaiahmed1/react-native-biometrics';

// Storage keys
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

const SettingsScreen: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [photoURL] = useState(user?.photoURL || '');
  const { colors } = useTheme();
  
  // Biometric state
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modal state for authentication prompt
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInProgress, setAuthInProgress] = useState(false);

  // Load biometric settings on mount
  useEffect(() => {
    loadBiometricSettings();
  }, []);

  const loadBiometricSettings = async () => {
    try {
      setLoading(true);
      
      // Check if biometric sensor is available
      const sensorInfo = await isSensorAvailable();
      setBiometricAvailable(sensorInfo.available);
      setBiometricType(sensorInfo.biometryType || '');
      
      // Load stored biometric setting
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      setBiometricEnabled(enabled === 'true');
    } catch (error) {
      console.error('Error loading biometric settings:', error);
      setBiometricAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const getBiometricIcon = () => {
    switch (biometricType) {
      case 'FaceID':
        return 'smile';
      case 'TouchID':
        return 'fingerprint';
      case 'Fingerprint':
        return 'fingerprint';
      default:
        return 'lock';
    }
  };

  const getBiometricName = () => {
    switch (biometricType) {
      case 'FaceID':
        return 'Face ID';
      case 'TouchID':
        return 'Touch ID';
      case 'Fingerprint':
        return 'Fingerprint';
      default:
        return 'Biometric';
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      // Enable biometric - show authentication modal
      setShowAuthModal(true);
    } else {
      // Disable biometric - verify user identity first
      try {
        const authResult = await simplePrompt(
          'Confirm your identity to disable app lock'
        );

        if (!authResult) {
          Alert.alert(
            'Authentication Required',
            'You must authenticate to disable biometric lock.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Delete biometric keys
        await deleteKeys();

        // Save setting
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');
        setBiometricEnabled(false);

        Alert.alert(
          'Biometric Lock Disabled',
          'App lock has been disabled.',
          [{ text: 'OK' }]
        );

      } catch (error) {
        console.error('Error disabling biometric:', error);
        Alert.alert(
          'Error',
          'Failed to disable biometric lock. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleEnableBiometric = async () => {
    try {
      setAuthInProgress(true);
      
      // First, verify biometric authentication works
      const authResult = await authenticateWithOptions({
        title: 'Enable Biometric Lock',
        subtitle: `Authenticate to enable ${getBiometricName()}`,
        description: 'This will secure your app with biometric authentication',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        allowDeviceCredentials: true,
      });

      if (!authResult.success) {
        Alert.alert(
          'Authentication Failed',
          `Unable to enable ${getBiometricName()} lock. Please try again.`,
          [{ text: 'OK' }]
        );
        return false;
      }

      // Create biometric keys for secure storage
      await createKeys();

      // Save setting
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      setBiometricEnabled(true);
      setShowAuthModal(false);

      Alert.alert(
        'Biometric Lock Enabled',
        `App lock has been enabled with ${getBiometricName()}.`,
        [{ text: 'OK' }]
      );

      return true;

    } catch (error) {
      console.error('Error enabling biometric:', error);
      Alert.alert(
        'Error',
        'Failed to enable biometric lock. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    } finally {
      setAuthInProgress(false);
    }
  };

  const renderBiometricStatus = () => {
    if (!biometricAvailable) {
      return (
        <Text className="text-sm font-rubik text-gray-500 mt-1">
          Biometric authentication is not available on this device
        </Text>
      );
    }

    if (biometricEnabled) {
      return (
        <Text className="text-sm font-rubik text-gray-500 mt-1">
          {getBiometricName()} is enabled for app security
        </Text>
      );
    }

    return (
      <Text className="text-sm font-rubik text-gray-500 mt-1">
        Tap to enable {getBiometricName().toLowerCase()} authentication
      </Text>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-gray-600 font-rubik mt-3">
          Loading settings...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header 
        title="Settings" 
        avatarImageUrl={photoURL || undefined}
      />

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Preferences */}
        <View className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <Text className="text-base font-rubik-bold text-gray-900 mb-4">
            Preferences
          </Text>

          <SettingRow
            icon="bell"
            title="Notifications"
            description="Enable or disable app notifications"
            color={colors.primary}
          />
        </View>

        {/* Security */}
        <View className="bg-white rounded-2xl p-5 shadow-sm">
          <Text className="text-base font-rubik-bold text-gray-900 mb-4">
            Security
          </Text>

          <SettingRow
            icon={getBiometricIcon()}
            title={`${getBiometricName()} Lock`}
            description={renderBiometricStatus()}
            color={colors.primary}
            showSwitch={biometricAvailable}
            switchValue={biometricEnabled}
            onSwitchChange={handleBiometricToggle}
          />
        </View>
      </ScrollView>

      {/* Authentication Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showAuthModal}
        onRequestClose={() => setShowAuthModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: colors.primary + '15' }}
              >
                <Feather name={getBiometricIcon()} size={32} color={colors.primary} />
              </View>
              <Text className="text-xl font-rubik-bold text-gray-900 mb-2">
                Enable {getBiometricName()} Lock
              </Text>
              <Text className="text-base font-rubik text-gray-600 text-center">
                Authenticate to enable biometric security for your app
              </Text>
            </View>

            {authInProgress ? (
              <View className="items-center py-4">
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="text-gray-600 font-rubik mt-3">
                  Waiting for authentication...
                </Text>
              </View>
            ) : (
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 py-4 rounded-xl"
                  style={{ backgroundColor: colors.primary }}
                  onPress={handleEnableBiometric}
                  disabled={authInProgress}
                >
                  <Text className="text-white font-rubik-medium text-center">
                    Authenticate
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="flex-1 py-4 rounded-xl border border-gray-300"
                  onPress={() => setShowAuthModal(false)}
                  disabled={authInProgress}
                >
                  <Text className="text-gray-700 font-rubik-medium text-center">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

interface SettingRowProps {
  icon: string;
  title: string;
  description: string | React.ReactNode;
  color: string;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  title,
  description,
  color,
  showSwitch = false,
  switchValue = false,
  onSwitchChange = () => {},
}) => (
  <View className="flex-row items-center py-4 border-b border-gray-200 last:border-b-0">
    <View
      className="w-10 h-10 rounded-full items-center justify-center mr-4"
      style={{ backgroundColor: color + '15' }}
    >
      <Feather name={icon as any} size={20} color={color} />
    </View>

    <View className="flex-1">
      <Text className="font-rubik-medium text-gray-900">
        {title}
      </Text>
      {typeof description === 'string' ? (
        <Text className="text-sm font-rubik text-gray-500 mt-0.5">
          {description}
        </Text>
      ) : (
        description
      )}
    </View>

    {showSwitch && (
      <Switch
        value={switchValue}
        onValueChange={onSwitchChange}
        trackColor={{ false: '#f3f4f6', true: color + '40' }}
        thumbColor={switchValue ? color : '#9ca3af'}
      />
    )}
  </View>
);

export default SettingsScreen;