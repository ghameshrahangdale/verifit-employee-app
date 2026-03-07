// screens/MenuScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/ui/Header';
import Avatar from '../components/ui/Avatar';
import Toast from 'react-native-toast-message';
import ConfirmationPopup from '../components/ui/ConfirmationPopup';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import { getApplicationName } from 'react-native-device-info';
import { MENU_ITEMS } from '../config/menu.config';


const MenuScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { logout, user } = useAuth(); // Get logout function and user from auth context

  const [showLogout, setShowLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Use actual user data from auth context if available, otherwise fallback to static data
  const displayUser = {
    displayName: user 
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'User'
      : "user",
    email: user?.email ,
    photoURL: user?.photoURL,
  };

  const handleShareApp = async () => {
    try {
      const appName = getApplicationName();
      const message =
        Platform.OS === 'android'
          ? `Check out ${appName} on Google Play Store: https://play.google.com/store/apps/details?id=rn_boilerplate`
          : `Check out ${appName} on App Store: https://apps.apple.com/app/id`;

      await Share.share({ message });
    } catch {
      Alert.alert('Error', 'Unable to share the app.');
    }
  };

  const handleMenuPress = (item: any) => {
    if (item.route) {
      navigation.navigate(item.route);
      return;
    }

    if (item.action === 'share') {
      handleShareApp();
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Call logout from auth context
      await logout();
      
      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Logged out',
        text2: 'You have been logged out successfully',
        position: 'bottom',
        visibilityTime: 3000,
      });

      // Reset navigation to Auth stack
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Auth' }], // Make sure this matches your auth navigator name
        })
      );
      
    } catch (error: any) {
      console.error('Logout error:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Logout failed',
        text2: error.message || 'Please try again',
        position: 'bottom',
        visibilityTime: 4000,
      });
    } finally {
      setIsLoggingOut(false);
      setShowLogout(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <Header
        title="Account & Menu"
        // avatarImageUrl={displayUser.photoURL}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View
          className="bg-white mx-4 mt-6 p-5 rounded-2xl flex-row items-center"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Avatar imageUrl={displayUser.photoURL} size="xl" />

          <View className="ml-4 flex-1">
            <Text className="text-xl font-rubik-bold text-gray-900">
              {displayUser.displayName}
            </Text>
            <Text className="text-sm font-rubik text-gray-500 mt-1">
              {displayUser.email}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View
          className="bg-white mx-4 mt-6 rounded-2xl overflow-hidden"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          {MENU_ITEMS.map((item, index) => (
            <MenuItem
              key={index}
              icon={item.icon}
              label={item.label}
              subtitle={item.subtitle}
              color={colors.primary}
              onPress={() => handleMenuPress(item)}
            />
          ))}
        </View>

        {/* Logout */}
        <View
          className="bg-white mx-4 mt-6 rounded-2xl"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <TouchableOpacity
            onPress={() => setShowLogout(true)}
            className="flex-row items-center px-5 py-4"
            disabled={isLoggingOut}
          >
            <Feather 
              name={isLoggingOut ? "loader" : "log-out"} 
              size={20} 
              color={colors.error} 
            />
            <Text className="ml-4 text-red-500 font-rubik-medium">
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="h-10" />
      </ScrollView>

      <ConfirmationPopup
        visible={showLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        onCancel={() => setShowLogout(false)}
        onConfirm={handleLogout}
        // isLoading={isLoggingOut} // If your ConfirmationPopup supports loading state
      />
    </View>
  );
};

const MenuItem = ({
  icon,
  label,
  subtitle,
  onPress,
  color,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  color: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center px-5 py-4 border-b border-gray-100 last:border-b-0"
    activeOpacity={0.7}
  >
    <Feather name={icon as any} size={20} color={color} />

    <View className="ml-4 flex-1">
      <Text className="text-gray-800 font-rubik">
        {label}
      </Text>

      {subtitle ? (
        <Text className="text-xs text-gray-500 font-rubik mt-0.5">
          {subtitle}
        </Text>
      ) : null}
    </View>

    <Feather name="chevron-right" size={18} color="#9CA3AF" />
  </TouchableOpacity>
);

export default MenuScreen;