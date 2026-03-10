import { ROLES, UserRole } from "../constants/roles";

export interface MenuItemConfig {
  icon: string;
  label: string;
  subtitle?: string;
  route?: string;
  action?: 'share';
  roles?: UserRole[];
}

export const MENU_ITEMS: MenuItemConfig[] = [
  {
    icon: 'user',
    label: 'My Profile',
    subtitle: 'View and edit your personal details',
    route: 'MyProfile',
  },
  {
    icon: 'user',
    label: 'HR Management',
    subtitle: 'Invite and Manage your HR (Hiring Managers)',
    route: 'teams',
    roles: [ROLES.ADMIN],
  },
  // {
  //   icon: 'user-plus',
  //   label: 'Invite Ex-Employee',
  //   subtitle: 'Send invitation to former employees',
  //   route: 'InviteExEmployee',
  // },
  // {
  //   icon: 'settings',
  //   label: 'Account Settings',
  //   subtitle: 'Manage account preferences and security',
  //   route: 'AccountSettings',
  // },
  {
    icon: 'bell',
    label: 'Notifications',
    subtitle: 'Manage notification preferences',
    route: 'Notifications',
  },
  {
    icon: 'settings',
    label: 'Settings',
    subtitle: 'Manage Setting preferences',
    route: 'Settings',
  },
  {
    icon: 'info',
    label: 'Legal & App Info',
    subtitle: 'Privacy Policy, Terms & Conditions, Version details',
    route: 'AppInfo',
  },
  {
    icon: 'book-open',
    label: 'About Us',
    subtitle: 'Learn more about RNIgnite',
    route: 'AboutUs',
  },
  {
    icon: 'share-2',
    label: 'Share App',
    subtitle: 'Invite friends to try this app',
    action: 'share',
  },
  {
    icon: 'help-circle',
    label: 'Help & Support',
    subtitle: 'Get help or contact support',
    route: 'Support',
  },
];