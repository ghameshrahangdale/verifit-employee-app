// context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AuthService } from '../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import http from '../services/http.api';
import { UserData } from '../types';

// Define types
interface User {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  organizationId?: string;
  organizationName?: string;
  [key: string]: any;
}

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  isOnboarding: boolean;

  login: (email: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;

  updateUser: (userData: Partial<User>) => void;

  refreshUser: () => Promise<void>;

  getProfile: () => Promise<UserData | null>;       // ✅ add
  updateProfile: (data: {
    firstName: string;
    lastName: string;
    phone?: string;
    dob?: string;
    gender?: any;
    address?: any;
    avatarFile?: any;

  }) => Promise<UserData | null>;                   // ✅ add

  clearError: () => void;
  error: string | null;
}
// Create context
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);

  // Check for stored auth data on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Load stored authentication data
  // In AuthContext.tsx - update the loadStoredAuth function
const loadStoredAuth = async () => {
  try {
    setIsLoading(true);
    setError(null);

    const storedToken = await AsyncStorage.getItem('authToken');

    if (storedToken) {
      setToken(storedToken);

      // fetch latest profile from API
      const profile = await getProfile();

      if (!profile) {
        await logout();
      }
    }

  } catch (error) {
    console.error('Error loading stored auth:', error);
    setError('Failed to load authentication data');
  } finally {
    setIsLoading(false);
  }
};

const getProfile = async () => {
  try {

    const response = await http.get('/api/user/profile');

    if (response.data?.user) {
      const userData = response.data.user;

      setUser(userData);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      return userData;
    }

    return null;

  } catch (error: any) {
    console.error('Profile fetch error:', error);
    setError(error.message || 'Failed to fetch profile');
    return null;

  } finally {
    setIsLoading(false);
  }
};

const updateProfile = async ({
  firstName,
  lastName,
  dob,
  phone,
  gender,
  address,
  avatarFile,
}: {
  firstName: string;
  lastName: string;
  dob?: string;
  phone?: string;
  gender?: any;
  address?: any;
  avatarFile?: any;
}) => {
  try {

    const formData = new FormData();

    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('dob', dob || '');
    formData.append('phone', phone || '');
    formData.append('gender', gender || '');
    formData.append('address', address || '');

    if (avatarFile) {
      formData.append('profileImage', {
        uri: avatarFile.uri,
        name: avatarFile.name,
        type: avatarFile.type,
      } as any);
    }

    const response = await http.put(
      '/api/user/profile',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.data?.user) {
      const updatedUser = response.data.user;

      setUser(updatedUser);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));

      return updatedUser;
    }

    return null;

  } catch (error: any) {
    console.error('Profile update error:', error);
    setError(error.message || 'Failed to update profile');
    throw error;

  } finally {
    setIsLoading(false);
  }
};

const refreshUser = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user data from API
      const userData = await AuthService.getCurrentUser();
      
      if (userData) {
        // Update user state
        setUser(userData);
        
        // Update stored user data
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        console.log('User refreshed:', userData);
        console.log('Organization ID after refresh:', userData.organizationId);
      }
    } catch (error: any) {
      console.error('Error refreshing user:', error);
      setError(error.message || 'Failed to refresh user data');
      
      // If token is invalid, logout
      if (error.message?.includes('token') || error.status === 401) {
        await logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
  try {
    setIsLoading(true);
    setError(null);

    const response = await AuthService.login(email, password);
    console.log(response);

    if (response.token) {
      setToken(response.token);

      if (response.user) {
        setUser(response.user);

        // ✅ check organizationId
        if (!response.user.organizationId) {
          setIsOnboarding(true);
        } else {
          setIsOnboarding(false);
        }

        await AsyncStorage.setItem('userData', JSON.stringify(response.user));
      }

      await AsyncStorage.setItem('authToken', response.token);
    }

    return response;

  } catch (error: any) {
    const errorMessage = error.message || 'Login failed. Please try again.';
    setError(errorMessage);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

  // Register function
  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      setError(null);

      await AuthService.register(userData);
      
      // Don't set user/token here as email verification might be required
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await AuthService.logout();
      
      // Clear state
      setUser(null);
      setToken(null);
      
      // Clear storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(error.message || 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!token,
        token,
        isOnboarding,
        login,
        register,
        logout,
        updateUser,
        getProfile,        // ✅
    updateProfile,  
        clearError,
        error,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;