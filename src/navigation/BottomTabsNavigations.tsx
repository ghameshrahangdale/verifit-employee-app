import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
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

const AppNavigator: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const visibleTabs = TAB_CONFIG.filter(tab => {
    if (!user?.role) return false;
    return tab.roles.includes(user.role as any);
  });

  const getScreenComponent = (componentName: keyof typeof SCREEN_MAP) => {
    const Screen = SCREEN_MAP[componentName];

    if (!Screen) {
      console.warn(
        `⚠️ Screen "${componentName}" is not registered in SCREEN_MAP`
      );
      return SCREEN_MAP.FallbackScreen;
    }

    return Screen;
  };


  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = TAB_CONFIG.find(t => t.name === route.name);

        return {
          tabBarIcon: ({ color, size }) => (
            <Feather
              name={tab?.icon || 'circle'}
              size={size}
              color={color}
            />
          ),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: '#9CA3AF',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E5E7EB',
            height: 62,
            paddingBottom: 6,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontFamily: 'Rubik-Medium',
            fontSize: 12,
          },
        };
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
