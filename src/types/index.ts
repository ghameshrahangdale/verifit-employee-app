export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  text: string;
  error: string;
  success: string;
  warning: string;
}

export interface ProfileData {
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
}

export interface OrganizationData {
  id: string;
  name: string;
  mobileNumber: string;
  businessEmail: string;
  companyWebsite: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  panNumber: string;
  companyType: string;
  cinNumber: string | null;
  udyamNumber: string | null;
  companySize: string;
  logoUrl: string | null;
  isOnboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserData {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  profileImage?: string;
  organization?: OrganizationData;
}