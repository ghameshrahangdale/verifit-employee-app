export interface QuickActionConfig {
  icon: string;
  title: string;
  subtitle: string;
  route?: string;
}

export const QUICK_ACTIONS: QuickActionConfig[] = [
  {
    icon: 'edit',
    title: 'Complete Profile',
    subtitle: 'Finish setting up your account',
    route: 'MyProfile',
  },
  {
    icon: 'settings',
    title: 'Settings',
    subtitle: 'Manage app preferences',
    route: 'Settings',
  },
  {
    icon: 'lock',
    title: 'Privacy Policy',
    subtitle: 'Learn how we protect your data',
    route: 'PrivacyPolicy',
  },
  {
    icon: 'file-text',
    title: 'Terms & Conditions',
    subtitle: 'Read our terms of service',
    route: 'Terms',
  },
  {
    icon: 'help-circle',
    title: 'Help & Support',
    subtitle: 'Get help or contact support',
    route: 'HelpSupport',
  },
];
