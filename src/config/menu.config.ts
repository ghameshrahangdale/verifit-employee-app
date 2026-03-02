export interface MenuItemConfig {
  icon: string;
  label: string;
  subtitle?: string;
  route?: string;
  action?: 'share';
}

export const MENU_ITEMS: MenuItemConfig[] = [
  {
    icon: 'user',
    label: 'My Profile',
    subtitle: 'View and edit your personal details',
    route: 'MyProfile',
  },
  {
    icon: 'info',
    label: 'Legal & App Info',
    subtitle: 'Privacy Policy, Terms & Conditions, Version details',
    route: 'AppInfo',
  },
  {
    icon: 'info', // or 'book-open'
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
