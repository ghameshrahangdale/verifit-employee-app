// screens/MenuScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/ui/Header';
import Avatar from '../components/ui/Avatar';
import Toast from 'react-native-toast-message';
import ConfirmationPopup from '../components/ui/ConfirmationPopup';
import { useAuth } from '../context/AuthContext';
import { getApplicationName } from 'react-native-device-info';
import { MENU_ITEMS } from '../config/menu.config';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROLES } from '../constants/roles';

const { width: W, height: H } = Dimensions.get('window');

// ─── Role badge color map ─────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  admin:    { bg: 'rgba(254,243,199,0.9)', text: '#D97706', dot: '#F59E0B' },
  manager:  { bg: 'rgba(237,233,254,0.9)', text: '#7C3AED', dot: '#8B5CF6' },
  employee: { bg: 'rgba(236,253,245,0.9)', text: '#059669', dot: '#10B981' },
  default:  { bg: 'rgba(239,246,255,0.9)', text: '#3B82F6', dot: '#60A5FA' },
};

const getRoleColors = (role?: string) =>
  (role && ROLE_COLORS[role.toLowerCase()]) || ROLE_COLORS.default;

// ─── Staggered entrance hook ──────────────────────────────────────────────────
const useStaggeredEntrance = (count: number, baseDelay = 55) => {
  const anims = useRef(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;

  useEffect(() => {
    const animations = anims.map((anim, i) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 340,
          delay: i * baseDelay,
          useNativeDriver: true,
        }),
        Animated.spring(anim.translateY, {
          toValue: 0,
          delay: i * baseDelay,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.stagger(baseDelay, animations).start();
  }, []);

  return anims;
};

// ─── MenuItem ─────────────────────────────────────────────────────────────────
const MenuItem = ({
  icon,
  label,
  subtitle,
  onPress,
  color,
  isLast,
  animOpacity,
  animTranslateY,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  color: string;
  isLast: boolean;
  animOpacity: Animated.Value;
  animTranslateY: Animated.Value;
}) => {
  const pressScale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(pressScale, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();

  const onPressOut = () =>
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 7,
    }).start();

  return (
    <Animated.View
      style={{
        opacity: animOpacity,
        transform: [{ translateY: animTranslateY }, { scale: pressScale }],
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      >
        {/* Icon bubble */}
        <View style={[styles.menuIconBubble, { backgroundColor: color + '22' }]}>
          <Feather name={icon as any} size={18} color={color} />
        </View>

        <View style={styles.menuItemText}>
          <Text style={styles.menuItemLabel}>{label}</Text>
          {subtitle ? (
            <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
          ) : null}
        </View>

        <View style={styles.menuChevronWrap}>
          <Feather name="chevron-right" size={15} color="rgba(100,116,139,0.7)" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── MenuScreen ───────────────────────────────────────────────────────────────
const MenuScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { logout, user } = useAuth();
  const insets = useSafeAreaInsets();

  const [showLogout, setShowLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const visibleMenuItems = MENU_ITEMS.filter(item => {
  if (!item.roles) return true;

  const hasAccess = user?.role && item.roles.includes(user.role as any);

  // 🚫 Hide Sub Organizations if admin has parentOrganizationId
  if (
    item.route === 'subOrganizations' &&
    user?.role === ROLES.ADMIN &&
    user?.organization?.parentOrganizationId
  ) {
    return false;
  }

  return hasAccess;
});

  const displayUser = {
    displayName: user
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        user.email?.split('@')[0] ||
        'User'
      : 'User',
    email: user?.email,
    photoURL: user?.photoURL,
  };

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'User';

  const roleColors = getRoleColors(user?.role);

  const totalItems = 2 + visibleMenuItems.length;
  const entrance = useStaggeredEntrance(totalItems, 55);

  // Profile card entrance
  const profileScale = useRef(new Animated.Value(0.95)).current;
  const profileOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(profileScale, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(profileOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Logout press anim
  const logoutScale = useRef(new Animated.Value(1)).current;
  const onLogoutPressIn = () =>
    Animated.spring(logoutScale, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 10 }).start();
  const onLogoutPressOut = () =>
    Animated.spring(logoutScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 7 }).start();

  // ── Logic (unchanged) ──
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
    if (item.action === 'share') handleShareApp();
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      Toast.show({
        type: 'success',
        text1: 'Logged out',
        text2: 'You have been logged out successfully',
        position: 'bottom',
        visibilityTime: 3000,
      });
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
    <View style={styles.root}>

      {/* ── Aurora background ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Light base */}
        <View style={styles.auroraBase} />
        {/* Blob 1 — top-left indigo */}
        <View style={styles.blob1} />
        {/* Blob 2 — top-right cyan */}
        <View style={styles.blob2} />
        {/* Blob 3 — mid violet */}
        <View style={styles.blob3} />
        {/* Blob 4 — bottom-right rose */}
        <View style={styles.blob4} />
        {/* Light overlay to soften blobs */}
        <View style={styles.auroraOverlay} />
      </View>

      <Header title="Account & Menu" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 8) + 100 },
        ]}
      >
        {/* ── Profile glass card ── */}
        <Animated.View
          style={[
            styles.glassCard,
            styles.profileCard,
            {
              borderColor: colors.primary + '35',
              opacity: profileOpacity,
              transform: [{ scale: profileScale }],
            },
          ]}
        >
          {/* Accent stripe */}
          <View style={[styles.profileAccentStripe, { backgroundColor: colors.primary + '30' }]} />

          <View style={styles.profileCardInner}>
            {/* Avatar ring */}
            <View style={[styles.avatarRing, { borderColor: colors.primary + 'BB' }]}>
              <View style={styles.avatarInner}>
                <Avatar size="xl" />
              </View>
            </View>

            {/* Info */}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {displayUser.displayName}
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {displayUser.email}
              </Text>

              {user?.role && (
                <View style={[styles.roleBadge, { backgroundColor: roleColors.bg }]}>
                  <View style={[styles.roleDot, { backgroundColor: roleColors.dot }]} />
                  <Text style={[styles.roleText, { color: roleColors.text }]}>
                    {roleLabel}
                  </Text>
                </View>
              )}
            </View>

            {/* Arrow */}
            <View style={[styles.profileArrow, { backgroundColor: colors.primary + '20' }]}>
              <Feather name="chevron-right" size={16} color={colors.primary} />
            </View>
          </View>
        </Animated.View>

        {/* ── Section label ── */}
        <Animated.Text
          style={[
            styles.sectionLabel,
            { opacity: entrance[1]?.opacity ?? new Animated.Value(1) },
          ]}
        >
          SETTINGS & MORE
        </Animated.Text>

        {/* ── Menu glass card ── */}
        <Animated.View
          style={[
            styles.glassCard,
            styles.menuCard,
            {
              opacity: entrance[1]?.opacity ?? new Animated.Value(1),
              transform: [{ translateY: entrance[1]?.translateY ?? new Animated.Value(0) }],
            },
          ]}
        >
          {visibleMenuItems.map((item, index) => (
            <MenuItem
              key={index}
              icon={item.icon}
              label={item.label}
              subtitle={item.subtitle}
              color={colors.primary}
              isLast={index === visibleMenuItems.length - 1}
              onPress={() => handleMenuPress(item)}
              animOpacity={entrance[2 + index]?.opacity ?? new Animated.Value(1)}
              animTranslateY={entrance[2 + index]?.translateY ?? new Animated.Value(0)}
            />
          ))}
        </Animated.View>

         {/* ── Section label ── */}
        <Animated.Text
          style={[
            styles.sectionLabel,
            { opacity: entrance[1]?.opacity ?? new Animated.Value(1) },
          ]}
        >
          Logout
        </Animated.Text>

        {/* ── Logout glass card ── */}
        <Animated.View
          style={{
            opacity:
              entrance[Math.min(2 + visibleMenuItems.length, totalItems - 1)]?.opacity ??
              new Animated.Value(1),
            transform: [
              {
                translateY:
                  entrance[Math.min(2 + visibleMenuItems.length, totalItems - 1)]
                    ?.translateY ?? new Animated.Value(0),
              },
            ],
          }}
        >
          <Animated.View
            style={[
              styles.glassCard,
              styles.logoutCard,
              { transform: [{ scale: logoutScale }] },
            ]}
          >
            <TouchableOpacity
              onPress={() => setShowLogout(true)}
              onPressIn={onLogoutPressIn}
              onPressOut={onLogoutPressOut}
              disabled={isLoggingOut}
              activeOpacity={1}
              style={styles.logoutButton}
            >
              <View style={styles.logoutIconBubble}>
                <Feather
                  name={isLoggingOut ? 'loader' : 'log-out'}
                  size={18}
                  color="#F87171"
                />
              </View>

              <View style={styles.menuItemText}>
                <Text style={styles.logoutLabel}>
                  {isLoggingOut ? 'Signing out…' : 'Sign out'}
                </Text>
                <Text style={styles.logoutSubtitle}>
                  {isLoggingOut ? 'Please wait' : 'Log out of your account'}
                </Text>
              </View>

              <View style={styles.menuChevronWrap}>
                <Feather name="chevron-right" size={15} color="rgba(239,68,68,0.6)" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      <ConfirmationPopup
        visible={showLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        onCancel={() => setShowLogout(false)}
        onConfirm={handleLogout}
      />
    </View>
  );
};

export default MenuScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // ── Aurora blobs ─────────────────────────────────────────────────────────────
  auroraBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8FAFC',
  },

  blob1: {
    position: 'absolute',
    width: W * 1.1,
    height: W * 1.1,
    borderRadius: W * 0.55,
    top: -W * 0.45,
    left: -W * 0.28,
    backgroundColor: 'rgba(99,102,241,0.12)',
  },

  blob2: {
    position: 'absolute',
    width: W * 0.95,
    height: W * 0.95,
    borderRadius: W * 0.48,
    top: -W * 0.18,
    right: -W * 0.22,
    backgroundColor: 'rgba(6,182,212,0.10)',
  },

  blob3: {
    position: 'absolute',
    width: W * 0.88,
    height: W * 0.88,
    borderRadius: W * 0.44,
    top: H * 0.3,
    left: -W * 0.22,
    backgroundColor: 'rgba(139,92,246,0.08)',
  },

  blob4: {
    position: 'absolute',
    width: W * 0.72,
    height: W * 0.72,
    borderRadius: W * 0.36,
    bottom: H * 0.08,
    right: -W * 0.12,
    backgroundColor: 'rgba(244,114,182,0.07)',
  },

  auroraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248,250,252,0.5)',
  },

  // ── Scroll ──
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // ── Shared glass card (fixed overflow issues) ────────────────────────────────
  glassCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    
  },

  // ── Profile card ──
  profileCard: {
    marginTop: 16,
    marginBottom: 20,
  },

  profileAccentStripe: {
    height: 4,
    width: '100%',
  },

  profileCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },

  avatarRing: {
    borderWidth: 2,
    borderRadius: 999,
    padding: 2,
  },

  avatarInner: {
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },

  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },

  profileName: {
    fontSize: 17,
    fontFamily: 'Rubik-Bold',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  profileEmail: {
    fontSize: 13,
    fontFamily: 'Rubik-Regular',
    color: '#475569',
    marginTop: 2,
  },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },

  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  roleText: {
    fontSize: 11,
    fontFamily: 'Rubik-Medium',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  profileArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  // ── Section label ──
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Rubik-Regular',
    color: '#64748B',
    letterSpacing: 1.3,
    marginBottom: 10,
    marginLeft: 4,
  },

  // ── Menu card ──
  menuCard: {
    marginBottom: 12,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  menuIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuItemText: {
    flex: 1,
    marginLeft: 14,
  },

  menuItemLabel: {
    fontSize: 15,
    fontFamily: 'Rubik-Medium',
    color: '#0F172A',
    letterSpacing: -0.2,
  },

  menuItemSubtitle: {
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    color: '#64748B',
    marginTop: 2,
  },

  menuChevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Logout card ──
  logoutCard: {
    marginBottom: 12,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  logoutIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutLabel: {
    fontSize: 15,
    fontFamily: 'Rubik-Medium',
    color: '#EF4444',
    letterSpacing: -0.2,
  },

  logoutSubtitle: {
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
    color: '#F87171',
    marginTop: 2,
  },
});