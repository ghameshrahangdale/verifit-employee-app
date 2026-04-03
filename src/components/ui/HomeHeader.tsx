// components/common/HomeHeader.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleProp,
  ViewStyle,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import Avatar from './Avatar';
import Logo from '../common/Logo';
import NotificationButton from './NotificationButton';
import PressScaleView from './PressScaleView';

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
  showNotificationBadge = true,
  notificationBadgeCount,
}) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  
  // Entrance animations
  const logoAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const avatarRing = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoAnim, { toValue: 1, damping: 18, stiffness: 160, useNativeDriver: true }),
      Animated.spring(actionsAnim, { toValue: 1, damping: 18, stiffness: 160, delay: 80, useNativeDriver: true }),
    ]).start();
    
    // Avatar ring pulse
    Animated.sequence([
      Animated.delay(300),
      Animated.spring(avatarRing, { toValue: 1, damping: 10, stiffness: 120, useNativeDriver: true }),
    ]).start();
  }, []);
  
  const handleAvatarPress = () => navigation.navigate('Tabs', { screen: 'Account' });
  
  const surfaceBg = isDarkMode ? `${colors.primary}08` : `${colors.primary}06`;
  const borderColor = isDarkMode ? `${colors.primary}18` : `${colors.primary}14`;
  
  return (
    <>
      <View style={[{ backgroundColor: surfaceBg, borderBottomWidth: 1, borderBottomColor: borderColor }, style]}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 14,
          }}
        >
          {/* Left: Logo */}
          <Animated.View
            style={{
              opacity: logoAnim,
              transform: [
                {
                  translateX: logoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-18, 0],
                  }),
                },
              ],
            }}
          >
            <Logo size="md" />
          </Animated.View>
          
          {/* Right: Bell + Avatar */}
          <Animated.View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              opacity: actionsAnim,
              transform: [
                {
                  translateX: actionsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            }}
          >
            {/* Notification Button */}
            <NotificationButton
              onNotificationPress={onNotificationPress}
              showNotificationBadge={showNotificationBadge}
              notificationBadgeCount={notificationBadgeCount}
              size={42}
              iconSize={19}
              showAnimatedBadge={true}
            />
            
            {/* Avatar with animated primary ring */}
            {(avatarName || avatarEmail || avatarImageUrl) && (
              <PressScaleView onPress={handleAvatarPress}>
                <Animated.View
                  style={{
                    padding: 2,
                    borderRadius: 999,
                    borderWidth: 2,
                    borderColor: avatarRing.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['transparent', colors.primary],
                    }),
                  }}
                >
                  <Avatar 
                    size={avatarSize as any}

                  />
                </Animated.View>
              </PressScaleView>
            )}
          </Animated.View>
        </View>
      </View>
    </>
  );
};

export default HomeHeader;