import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MenuScreen from '../screens/MenuScreen';
import FallbackScreen from '../screens/FallbackScreen';
import EmployeeListScreen from '../screens/EmployeeListScreen';
import VerifiedEmployeeListScreen from '../screens/VerifiedEmployeeListScreen';
import TeamManagementScreen from '../screens/TeamManagementScreen';
import EmployeeVerification from '../components/employee/EmployeeVerifications'; // Create this
import PendingInvitationsScreen from '../screens/PendingInvitationsScreen';
import SettingsScreen from '../screens/SettingsScreen'; // Create this

export const SCREEN_MAP = {
  HomeScreen,
  ProfileScreen,
  MenuScreen,
  FallbackScreen,
  EmployeeListScreen,
  VerifiedEmployeeListScreen,
  TeamManagementScreen,
  EmployeeVerification, // Add this
  PendingInvitationsScreen, // Add this
  SettingsScreen, // Add this
} as const;