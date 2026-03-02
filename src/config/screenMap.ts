import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MenuScreen from '../screens/MenuScreen';
import FallbackScreen from '../screens/FallbackScreen';
import SettingsScreen from '../screens/SettingsScreen';

export const SCREEN_MAP = {
  HomeScreen,
  ProfileScreen,
  MenuScreen,
  FallbackScreen,
  SettingsScreen,
} as const;
