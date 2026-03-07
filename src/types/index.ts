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