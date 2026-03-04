// components/common/HomeHeader.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import Avatar from './Avatar';
import Logo from '../common/Logo';
import Icon from 'react-native-vector-icons/Feather';
import NotificationModal from './NotificationModal';
import { name as clientName } from '../../../app.json';

interface HomeHeaderProps {
  avatarImageUrl?: string;
  avatarName?: string;
  avatarEmail?: string;
  avatarSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | number;
  style?: StyleProp<ViewStyle>;
  onNotificationPress?: () => void;
  showNotificationBadge?: boolean;
  notificationBadgeCount?: number;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  avatarImageUrl,
  avatarName,
  avatarEmail,
  avatarSize = 'md',
  style,
  onNotificationPress,
  showNotificationBadge = false,
  notificationBadgeCount = 0,
}) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);

  const handleAvatarPress = () => {
    navigation.navigate('Tabs', {
      screen: 'Account',
    });
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      setNotificationModalVisible(true);
    }
  };

  const handleViewAllNotifications = () => {
    setNotificationModalVisible(false);
    navigation.navigate('Tabs', {
      screen: 'Notifications',
    });
  };

  const handleNotificationItemPress = (notification: any) => {
    setNotificationModalVisible(false);
    // Handle individual notification press
    console.log('Notification pressed:', notification);
    // You can navigate to specific screens based on notification type
    if (notification.type === 'info') {
      navigation.navigate('Tabs', {
        screen: 'Home',
      });
    }
  };

  return (
    <>
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: colors.background,
            elevation: isDarkMode ? 0 : 1,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          },
          style,
        ]}
      >
        {/* Left: Logo */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Logo size="md" />
        </View>

        {/* Right: Actions + Avatar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          {/* Notification Button */}
          <TouchableOpacity onPress={handleNotificationPress} activeOpacity={0.7}>
            <View>
              <Icon
                name="bell"
                size={20}
                color={colors.text}
              />
              {showNotificationBadge && notificationBadgeCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    backgroundColor: colors.error,
                    borderRadius: 10,
                    minWidth: 18,
                    height: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontWeight: 'bold',
                    }}
                  >
                    {notificationBadgeCount > 99 ? '99+' : notificationBadgeCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Avatar */}
          {(avatarName || avatarEmail || avatarImageUrl) && (
            <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7}>
              <Avatar
                name={avatarName}
                email={avatarEmail}
                imageUrl={avatarImageUrl || undefined}
                size={avatarSize as any}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notification Modal */}
      <NotificationModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
        onViewAllPress={handleViewAllNotifications}
        onNotificationPress={handleNotificationItemPress}
      />
    </>
  );
};

export default HomeHeader;