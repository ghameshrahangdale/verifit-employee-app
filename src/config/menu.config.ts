import { isEmployee, ROLES, UserRole } from "../constants/roles";

export interface MenuItemConfig {
  icon: string;
  label: string;
  subtitle?: string;
  route?: string;
  action?: 'share';
  roles?: UserRole[];
}

// Function to get menu items based on user role
export const getMenuItems = (userRole?: UserRole): MenuItemConfig[] => {
  const emp = isEmployee(userRole);
  
  return [
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
    //   icon: 'check-square',
    //   label: 'Verification Requests',
    //   subtitle: 'Manage employee verification requests and review status',
    //   route: 'verificationRequests',
    //   roles: [ROLES.ADMIN, ROLES.HR,],
    // },
    {
      icon: 'file-text',
      label: emp ? 'My Verification Requests' : 'All Verification Requests',
      subtitle: 'Create and monitor your verification requests',
      route: 'employeeVerificationRequests',
      roles: [ROLES.EMPLOYEE, ROLES.HR, ROLES.ADMIN],
    },
    {
      icon: 'inbox', // Updated icon for incoming
      label: 'Incoming Verification Requests',
      subtitle: 'View and manage verification requests received',
      route: 'incomingRequests',
      roles: [ROLES.ADMIN, ROLES.HR],
    },
    {
      icon: 'send', // Updated icon for outgoing
      label: 'Outgoing Verification Requests',
      subtitle: 'View and track verification requests sent',
      route: 'outgoingRequests',
      roles: [ROLES.ADMIN, ROLES.HR],
    },
    
    // {
    //   icon: 'bell',
    //   label: 'Notifications',
    //   subtitle: 'Manage notification preferences',
    //   route: 'Notifications',
    // },
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
      subtitle: 'Learn more about Verifiit',
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
};

// Keep original export for backward compatibility if needed
export const MENU_ITEMS: MenuItemConfig[] = getMenuItems();