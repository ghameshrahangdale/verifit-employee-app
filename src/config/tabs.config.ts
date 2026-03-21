import { ROLES } from "../constants/roles";

export const TAB_CONFIG = [
  {
    name: 'Home',
    component: 'HomeScreen',
    icon: 'home',
    label: 'Home',
    roles: [ROLES.ADMIN, ROLES.HR,],
  },
  {
    name: 'Employees',
    component: 'EmployeeListScreen',
    icon: 'users',
    label: 'Employees',
    roles: [ROLES.ADMIN, ROLES.HR],
  },
  {
    name: 'HR',
    component: 'TeamManagementScreen',
    icon: 'briefcase',
    label: 'HRM',
    roles: [ROLES.ADMIN],
  },
  {
    name: 'Requests',
    component: 'EmployeeVerification', // You'll need to create this screen
    icon: 'file-text',
    label: 'Requests',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  },
  {
    name: 'Invitations',
    component: 'PendingInvitationsScreen', // You'll need to create this screen
    icon: 'mail',
    label: 'Invitations',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  },
 
  {
    name: 'Profile',
    component: 'MenuScreen',
    icon: 'user',
    label: 'Profile',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  },
   {
    name: 'Settings',
    component: 'SettingsScreen', // You'll need to create this screen
    icon: 'settings',
    label: 'Settings',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  },
] as const;