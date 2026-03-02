export interface FeatureConfig {
  icon: string;
  title: string;
  description: string;
  route?: string;
}

export const FEATURES: FeatureConfig[] = [
  {
    icon: 'user',
    title: 'Profile',
    description: 'View and update your personal information',
    route: 'MyProfile',
  },
  {
    icon: 'lock',
    title: 'Authentication',
    description: 'Manage login methods, passwords, and security options',
  },
  {
    icon: 'settings',
    title: 'Settings',
    description: 'Customize preferences, themes, and app behavior',
  },
  {
    icon: 'help-circle',
    title: 'Support',
    description: 'Get help, contact support, or browse FAQs',
  },
];
