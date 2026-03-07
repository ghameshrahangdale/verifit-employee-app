import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MenuScreen from '../screens/MenuScreen';
import FallbackScreen from '../screens/FallbackScreen';
import EmployeeListScreen from '../screens/EmployeeListScreen';
import VerifiedEmployeeListScreen from '../screens/VerifiedEmployeeListScreen';
import TeamManagementScreen from '../screens/TeamManagementScreen';

export const SCREEN_MAP = {
  HomeScreen,
  ProfileScreen,
  MenuScreen,
  FallbackScreen,
  EmployeeListScreen,
  VerifiedEmployeeListScreen,
  TeamManagementScreen
} as const;
