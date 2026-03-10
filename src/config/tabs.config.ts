import { ROLES } from "../constants/roles";

export const TAB_CONFIG = [
  {
    name: 'Home',
    component: 'HomeScreen',
    icon: 'home',
    label: 'Home',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
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
    name: 'Profile',
    component: 'MenuScreen',
    icon: 'user',
    label: 'Profile',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
  },
] as const;