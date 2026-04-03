// components/common/Header.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import Avatar from './Avatar';
import NotificationButton from './NotificationButton';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showNotification?: boolean;
  avatarName?: string;
  avatarEmail?: string;
  avatarImageUrl?: string;
  avatarSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | number;
  style?: StyleProp<ViewStyle>;
  onNotificationPress?: () => void;
  showNotificationBadge?: boolean;
  notificationBadgeCount?: number;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBack = true,
  showNotification = true,
  avatarName,
  avatarEmail,
  avatarImageUrl,
  avatarSize = 'md',
  style,
  onNotificationPress,
  showNotificationBadge = true,
  notificationBadgeCount,
}) => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  
  const USER = {
    displayName: 'Ghamesh Rahangdale',
    email: 'ghamesh@example.com',
    photoURL: 'https://i.pravatar.cc/150?img=12',
  };
  
  const handleAvatarPress = () => {
    navigation.navigate('Tabs', {
      screen: 'Account',
    });
  };
  
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: '#fff',
          justifyContent: 'space-between',
          elevation: 2,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        },
        style,
      ]}
    >
      {/* Left Section */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {showBack && (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
        
        <Text
          style={{
            marginLeft: showBack ? 12 : 0,
            fontSize: 14,
            fontFamily: 'Rubik-Regular',
            color: colors.text,
          }}
        >
          {title}
        </Text>
      </View>
      
      {/* Right Section */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Notification Button */}
        {showNotification && (
          <NotificationButton
            onNotificationPress={onNotificationPress}
            showNotificationBadge={showNotificationBadge}
            notificationBadgeCount={notificationBadgeCount}
            size={36}
            iconSize={16}
            showAnimatedBadge={false} // Optional: disable animation for simpler header
          />
        )}
        
        {/* Avatar */}
        <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7}>
          <Avatar
           
            size={avatarSize as any}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;