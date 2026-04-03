import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { TAB_CONFIG } from '../config/tabs.config';
import { SCREEN_MAP } from '../config/screenMap';
import { useAuth } from '../context/AuthContext';

export type AppTabParamList = {
  Home: undefined;
  Profile: undefined;
  Menu: undefined;
  Verified: undefined;
  EmployeeListScreen: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

// ─── Icon map: filled variants via Feather substitutions ─────────────────────
// Feather is outline-only; we simulate "filled" by swapping to heavier-weight
// icon names or using a tinted background pill behind the active icon.
const FILLED_ICON_MAP: Record<string, string> = {
  home: 'home',
  user: 'user',
  menu: 'menu',
  'check-circle': 'check-circle',
  users: 'users',
  circle: 'circle',
};

// ─── Single animated tab button ──────────────────────────────────────────────
interface TabButtonProps {
  isFocused: boolean;
  label: string;
  iconName: string;
  activeColor: string;
  onPress: () => void;
  onLongPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({
  isFocused,
  label,
  iconName,
  activeColor,
  onPress,
  onLongPress,
}) => {
  // Scale for press bounce micro-interaction
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Circle background scale: pops in when tab becomes active
  const circleScale = useRef(new Animated.Value(isFocused ? 1 : 0.4)).current;
  // Circle opacity
  const circleOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(circleScale, {
        toValue: isFocused ? 1 : 0.4,
        useNativeDriver: true,
        tension: 120,
        friction: 7,
      }),
      Animated.spring(circleOpacity, {
        toValue: isFocused ? 1 : 0,
        useNativeDriver: true,
        tension: 120,
        friction: 7,
      }),
    ]).start();
  }, [isFocused]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.85,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 180,
      friction: 6,
    }).start();
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={styles.tabButton}
    >
      <Animated.View
        style={[styles.tabInner, { transform: [{ scale: scaleAnim }] }]}
      >
        {/* Icon container — circle only wraps the icon */}
        <View style={styles.iconContainer}>
          {/* Animated circle background */}
          <Animated.View
            style={[
              styles.activeCircle,
              {
                backgroundColor: activeColor,
                opacity: circleOpacity,
                transform: [{ scale: circleScale }],
              },
            ]}
          />
          <Feather
            name={FILLED_ICON_MAP[iconName] || iconName}
            size={20}
            color={isFocused ? '#FFFFFF' : '#94A3B8'}
          />
        </View>

        {/* Label always below the icon circle */}
        <Animated.Text
          style={[
            styles.tabLabel,
            {
              color: isFocused ? activeColor : '#94A3B8',
              fontFamily: 'Rubik-Medium',
              opacity: isFocused ? 1 : 0.6,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Custom floating tab bar ──────────────────────────────────────────────────
const FloatingTabBar: React.FC<BottomTabBarProps & { activeColor: string; visibleTabs: (typeof TAB_CONFIG)[number][] }> = ({
  state,
  descriptors,
  navigation,
  activeColor,
  visibleTabs,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBarOuter,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
      pointerEvents="box-none"
    >
      {/* Frosted glass card */}
      <View style={[styles.tabBarCard, { shadowColor: activeColor }]}>
        {/* Subtle top highlight line for glass effect */}
        <View style={styles.glassHighlight} />

        <View style={styles.tabBarRow}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const tab = visibleTabs.find(t => t.name === route.name);
            const label = tab?.label ?? route.name;
            const iconName = tab?.icon ?? 'circle';
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <TabButton
                key={route.key}
                isFocused={isFocused}
                label={label}
                iconName={iconName}
                activeColor={activeColor}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

// ─── Main navigator ───────────────────────────────────────────────────────────
const AppNavigator: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const visibleTabs = TAB_CONFIG.filter(tab => {
    if (!user?.role) return false;
    return tab.roles.includes(user?.role);
  });

  const getScreenComponent = (componentName: keyof typeof SCREEN_MAP) => {
    const Screen = SCREEN_MAP[componentName];
    if (!Screen) {
      console.warn(`⚠️ Screen "${componentName}" is not registered in SCREEN_MAP`);
      return SCREEN_MAP.FallbackScreen;
    }
    return Screen;
  };

  return (
    <Tab.Navigator
      tabBar={props => (
        <FloatingTabBar
          {...props}
          activeColor={colors.primary}
          visibleTabs={visibleTabs}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      {visibleTabs.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name as keyof AppTabParamList}
          component={getScreenComponent(tab.component)}
          options={{ tabBarLabel: tab.label }}
        />
      ))}
    </Tab.Navigator>
  );
};

export default AppNavigator;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Outer container — sits above screen content, transparent
  tabBarOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    // Transparent so screen content can scroll under it
    backgroundColor: 'transparent',
  },

  // The floating card itself
  tabBarCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 28,
    overflow: 'hidden',
    // Frosted glass simulation: near-white with high opacity
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    // Layered shadow for depth
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
      android: {
        elevation: 16,
      },
    }),
    // Subtle border for glass edge
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },

  // 1px highlight along the top edge — classic glass trick
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },

  tabBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },

  // Each tab occupies equal flex space
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },

  // Stacks icon circle and label vertically, centered
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  // Fixed-size box that holds the circle background + icon
  // Circle is absolute behind the icon so layout never shifts
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // The circle — same size as iconContainer, centered absolutely
  activeCircle: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  // Label always below, primary color when active, muted when not
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.1,
    fontFamily: 'Rubik-Medium',
  },
});