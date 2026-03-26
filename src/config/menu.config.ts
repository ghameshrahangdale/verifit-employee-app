import { isAdminOrHR, isEmployee, ROLES, UserRole } from "../constants/roles";
import { useAuth } from "../context/AuthContext";

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
  const emp = !isAdminOrHR(userRole);
 

  return [
    {
      icon: 'user',
      label: 'My Profile',
      subtitle: 'View and edit your personal details',
      route: 'MyProfile',
    },
        {
      icon: 'briefcase', // or 'layers', 'home', 'building'
      label: 'Sub Organizations',
      subtitle: 'Manage your organizations and branches',
      route: 'subOrganizations',
      roles: [ROLES.ADMIN],
    }, 

    {
      icon: 'user',
      label: 'HR Management',
      subtitle: 'Invite and Manage your HR (Hiring Managers)',
      route: 'teams',
      roles: [ROLES.ADMIN],
    },
       {
      icon: 'mail',
      label: 'Sent Invitations',
      subtitle: 'Track invitations sent to team members',
      route: 'sentInvitations',
      roles: [ROLES.ADMIN, ROLES.HR],
    },
    
    {
      icon: 'file-text',
      label: 'Verification Requests',
      subtitle: 'Create and monitor your verification requests',
      route: 'myVerificationRequests',
      roles: [ ROLES.EMPLOYEE ],
    },
    {
      icon: 'file-text',
      label:'My Verification Requests',
      subtitle: 'Create and monitor your verification requests',
      route: 'employeeVerificationRequests',
      roles: [ ROLES.HR, ROLES.ADMIN],
    },
    {
      icon: 'inbox', 
      label: 'Incoming Verification Requests',
      subtitle: 'View and manage verification requests received',
      route: 'incomingRequests',
      roles: [ROLES.ADMIN, ROLES.HR],
    },
    {
      icon: 'send', 
      label: 'Outgoing Verification Requests',
      subtitle: 'View and track verification requests sent',
      route: 'outgoingRequests',
      roles: [ROLES.ADMIN, ROLES.HR],
    },
    {
      icon: 'alert-circle', 
      label: 'Invitations',
      subtitle: 'View and manage your pending approvals',
      route: 'pendingInvitations',
      roles: [ROLES.EMPLOYEE],
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