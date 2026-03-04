import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabsNavigations from './BottomTabsNavigations';
import AppInfoScreen from '../screens/AppInfoScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import AboutUsScreen from '../screens/AboutUsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsScreen from '../screens/TermsScreen';
import DocumentationScreen from '../screens/DocumentationScreen';
import InviteExEmployeeScreen from '../screens/InviteExEmployeeScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type AppStackParamList = {
  Tabs: undefined;
  AppInfo: undefined;
  MyProfile: undefined;
  Login:undefined;
  Support: undefined;
  AboutUs: undefined;
  PrivacyPolicy: undefined;
  Terms: undefined;
  Documentation: undefined;
  InviteExEmployee: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<AppStackParamList>();

const AppStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={BottomTabsNavigations} />
      <Stack.Screen name="AppInfo" component={AppInfoScreen} />
      <Stack.Screen name="MyProfile" component={ProfileScreen} />
      <Stack.Screen name="Support" component={HelpSupportScreen} />
      <Stack.Screen name="AboutUs" component={AboutUsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Documentation" component={DocumentationScreen} />
      <Stack.Screen name="InviteExEmployee" component={InviteExEmployeeScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};

export default AppStackNavigator;
