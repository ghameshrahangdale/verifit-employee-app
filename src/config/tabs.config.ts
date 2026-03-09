export const TAB_CONFIG = [
  {
    name: 'Home',
    component: 'HomeScreen',
    icon: 'home',
    label: 'Home',
  },
  {
    name: 'Employees',
    component: 'EmployeeListScreen',
    icon: 'users',
    label: 'Employees',
  },
  // {
  //   name: 'Verified',
  //   component: 'VerifiedEmployeeListScreen',
  //   icon: 'check-circle',
  //   label: 'Verified',
  // },
  {
    name: 'Profile',
    component: 'MenuScreen',
    icon: 'user', // Rounded minimal user icon in Feather
    label: 'Profile',
  },
] as const;