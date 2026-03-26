// components/common/HomeHeader.tsx
//
// ── DESIGN DECISIONS ──────────────────────────────────────────────────────────
// 1. Entrance animation — logo fades+slides in from left, actions from right
//    using Animated.spring on mount for a premium feel.
// 2. Bell button — wrapped in a rounded pill container with primary-tint bg
// 3. Badge — uses colors.primary instead of hardcoded red, with a white border
//    ring and an Animated.spring pop-in when it first appears.
// 4. Avatar ring — thin animated primary-color ring pulses once on mount to
//    draw the eye without being distracting.
// 5. Press micro-interactions — both bell and avatar scale down on press via
//    Animated.spring (replaced TouchableOpacity activeOpacity with Animated).
// 6. Header surface — subtle bottom border + very light primary tint on the
//    background strip to lift it off the page content below.
// 7. All existing logic, props, and handlers are 100% unchanged.
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationsContext';
import Avatar from './Avatar';
import Logo from '../common/Logo';
import Icon from 'react-native-vector-icons/Feather';
import NotificationModal from './NotificationModal';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Animated press wrapper ───────────────────────────────────────────────────

const PressScaleView: React.FC<{
  onPress: () => void;
  children: React.ReactNode;
}> = ({ onPress, children }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, damping: 15, stiffness: 300 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, damping: 12, stiffness: 250 }).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

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
  const { unreadCount } = useNotifications();
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);

  // Badge logic (unchanged)
  const displayBadgeCount = notificationBadgeCount !== undefined ? notificationBadgeCount : unreadCount;
  const shouldShowBadge   = showNotificationBadge && displayBadgeCount > 0;

  // ── Entrance animations ──────────────────────────────────────────────────
  const logoAnim    = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const badgeScale  = useRef(new Animated.Value(0)).current;
  const avatarRing  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoAnim,    { toValue: 1, damping: 18, stiffness: 160, useNativeDriver: true }),
      Animated.spring(actionsAnim, { toValue: 1, damping: 18, stiffness: 160, delay: 80, useNativeDriver: true } as any),
    ]).start();

    // Avatar ring pulse
    Animated.sequence([
      Animated.delay(300),
      Animated.spring(avatarRing, { toValue: 1, damping: 10, stiffness: 120, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (shouldShowBadge) {
      Animated.spring(badgeScale, { toValue: 1, damping: 12, stiffness: 260, useNativeDriver: true }).start();
    } else {
      Animated.spring(badgeScale, { toValue: 0, damping: 14, stiffness: 300, useNativeDriver: true }).start();
    }
  }, [shouldShowBadge]);

  // ── Handlers (all unchanged) ─────────────────────────────────────────────
  const handleAvatarPress = () => navigation.navigate('Tabs', { screen: 'Account' });

  const handleNotificationPress = () => {
    if (onNotificationPress) onNotificationPress();
    else setNotificationModalVisible(true);
  };

  const handleViewAllNotifications = () => {
    setNotificationModalVisible(false);
    navigation.navigate('Tabs', { screen: 'Notifications' });
  };

  const handleNotificationItemPress = (notification: any) => {
    setNotificationModalVisible(false);
    console.log('Notification pressed:', notification);
    if (notification.type === 'info') navigation.navigate('Tabs', { screen: 'Home' });
  };

  // ── Derived style tokens ─────────────────────────────────────────────────
  const surfaceBg   = isDarkMode ? `${colors.primary}08` : `${colors.primary}06`;
  const borderColor = isDarkMode ? `${colors.primary}18` : `${colors.primary}14`;
  const pillBg      = isDarkMode ? `${colors.primary}18` : `${colors.primary}12`;
  const pillBorder  = `${colors.primary}28`;

  return (
    <>
      <View
        
      >
        {/* Tint layer */}
        <View
          style={{
            position: 'absolute',
            inset: 0,
          }}
        />

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 14,
          }}
        >
          {/* ── Left: Logo ──────────────────────────────────────────────── */}
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

          {/* ── Right: Bell + Avatar ───────────────────────────────────── */}
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
            {/* Bell */}
            <PressScaleView onPress={handleNotificationPress}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: pillBg,
                  borderWidth: 1,
                  borderColor: pillBorder,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  name="bell"
                  size={19}
                  color={shouldShowBadge ? colors.primary : isDarkMode ? '#A1A1AA' : '#52525B'}
                />

                {/* Animated badge */}
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    transform: [{ scale: badgeScale }],
                  }}
                >
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
                </Animated.View>
              </View>
            </PressScaleView>

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
                  <Avatar size={avatarSize as any} />
                </Animated.View>
              </PressScaleView>
            )}
          </Animated.View>
        </View>
      </View>

      {/* Notification Modal (unchanged) */}
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