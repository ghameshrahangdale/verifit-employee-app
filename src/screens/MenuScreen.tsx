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
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/ui/Header';
import Avatar from '../components/ui/Avatar';
import Toast from 'react-native-toast-message';
import ConfirmationPopup from '../components/ui/ConfirmationPopup';
import { AuthService } from '../services/auth';
import { getApplicationName } from 'react-native-device-info';

import { MENU_ITEMS } from '../config/menu.config';

const MenuScreen: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const [photoURL] = useState(user?.photoURL || '');
  const [showLogout, setShowLogout] = useState(false);

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
      await AuthService.logout();

      Toast.show({
        type: 'success',
        text1: 'Logged out',
        text2: 'You have been logged out successfully',
        position: 'bottom',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Logout failed',
        text2: 'Please try again',
        position: 'bottom',
      });
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <Header
        title="Account & Menu"
        avatarImageUrl={photoURL || undefined}
      />

      <ScrollView>
        {/* Profile Card */}
        <View className="bg-white mx-4 mt-6 p-5 rounded-2xl shadow-sm flex-row items-center">
          <Avatar imageUrl={photoURL || undefined} size="xl" />

          <View className="ml-4 flex-1">
            <Text className="text-xl font-rubik-bold text-gray-900">
              {user?.displayName || 'User'}
            </Text>
            <Text className="text-sm font-rubik text-gray-500 mt-1">
              {user?.email}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View className="bg-white mx-4 mt-6 rounded-2xl shadow-sm overflow-hidden">
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
        <View className="bg-white mx-4 mt-6 rounded-2xl shadow-sm">
          <TouchableOpacity
            onPress={() => setShowLogout(true)}
            className="flex-row items-center px-5 py-4"
          >
            <Feather name="log-out" size={20} color={colors.error} />
            <Text className="ml-4 text-red-500 font-rubik-medium">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmationPopup
        visible={showLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        onCancel={() => setShowLogout(false)}
        onConfirm={() => {
          setShowLogout(false);
          handleLogout();
        }}
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
    className="flex-row items-center px-5 py-4 border-b border-gray-200 last:border-b-0"
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

    <Feather
      name="chevron-right"
      size={18}
      color="#9CA3AF"
    />
  </TouchableOpacity>
);


export default MenuScreen;
