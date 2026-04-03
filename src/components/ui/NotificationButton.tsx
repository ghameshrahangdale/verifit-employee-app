// components/common/NotificationButton.tsx

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationsContext';
import PressScaleView from './PressScaleView';

interface NotificationButtonProps {
  onNotificationPress?: () => void;
  showNotificationBadge?: boolean;
  notificationBadgeCount?: number;
  size?: number;
  iconSize?: number;
  showAnimatedBadge?: boolean;
}

const NotificationButton: React.FC<NotificationButtonProps> = ({
  onNotificationPress,
  showNotificationBadge = true,
  notificationBadgeCount,
  size = 42,
  iconSize = 19,
  showAnimatedBadge = true,
}) => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const { unreadCount } = useNotifications();
  
  // Badge logic
  const displayBadgeCount = notificationBadgeCount !== undefined ? notificationBadgeCount : unreadCount;
  const shouldShowBadge = showNotificationBadge && displayBadgeCount > 0;
  
  // Badge animation
  const badgeScale = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (shouldShowBadge && showAnimatedBadge) {
      Animated.spring(badgeScale, { 
        toValue: 1, 
        damping: 12, 
        stiffness: 260, 
        useNativeDriver: true 
      }).start();
    } else if (!shouldShowBadge && showAnimatedBadge) {
      Animated.spring(badgeScale, { 
        toValue: 0, 
        damping: 14, 
        stiffness: 300, 
        useNativeDriver: true 
      }).start();
    }
  }, [shouldShowBadge, showAnimatedBadge]);
  
  // Handler - navigate to Notifications screen
  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      navigation.navigate('Notifications');
    }
  };
  
  // Derived style tokens
  const pillBg = isDarkMode ? `${colors.primary}18` : `${colors.primary}12`;
  const pillBorder = `${colors.primary}28`;
  
  return (
    <PressScaleView onPress={handleNotificationPress}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.33,
          backgroundColor: pillBg,
          borderWidth: 1,
          borderColor: pillBorder,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Icon
          name="bell"
          size={iconSize}
          color={shouldShowBadge ? colors.primary : isDarkMode ? '#A1A1AA' : '#52525B'}
        />
        
        {/* Animated badge */}
        {showAnimatedBadge ? (
          <Animated.View
            style={{
              position: 'absolute',
              top: -5,
              right: -5,
              transform: [{ scale: badgeScale }],
            }}
          >
            {shouldShowBadge && (
              <View
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                  minWidth: 18,
                  height: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 4,
                  borderWidth: 2,
                  borderColor: colors.background,
                }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontFamily: 'Rubik-Bold',
                  }}
                >
                  {displayBadgeCount > 99 ? '99+' : displayBadgeCount}
                </Text>
              </View>
            )}
          </Animated.View>
        ) : (
          shouldShowBadge && (
            <View
              style={{
                position: 'absolute',
                top: -5,
                right: -5,
                backgroundColor: colors.primary,
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 4,
                borderWidth: 2,
                borderColor: colors.background,
              }}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontFamily: 'Rubik-Bold',
                }}
              >
                {displayBadgeCount > 99 ? '99+' : displayBadgeCount}
              </Text>
            </View>
          )
        )}
      </View>
    </PressScaleView>
  );
};

export default NotificationButton;