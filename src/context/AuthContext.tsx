// context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AuthService } from '../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import http from '../services/http.api';
import { UserData } from '../types';

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
  getProfile: () => Promise<UserData | null>;
  updateProfile: (data: {
    firstName: string;
    lastName: string;
    phone?: string;
    dob?: string;
    gender?: any;
    address?: any;
    avatarFile?: any;
  }) => Promise<UserData | null>;
  clearError: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // ==================== Storage Management ====================
  const loadStoredAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const storedToken = await AsyncStorage.getItem('authToken');

      if (storedToken) {
        setToken(storedToken);
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

  // ==================== Profile Operations ====================
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

      if (dob) formData.append('dob', dob);
      if (phone) formData.append('phone', phone);
      if (gender) formData.append('gender', gender);
      if (address) formData.append('address', address);

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

      const userData = await AuthService.getCurrentUser();

      if (userData) {
        setUser(userData);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      }
    } catch (error: any) {
      console.error('Error refreshing user:', error);
      setError(error.message || 'Failed to refresh user data');

      if (error.message?.includes('token') || error.status === 401) {
        await logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== Authentication Operations ====================
  const login = async (email: string, password: string) => {
    try {
      setError(null);

      const response = await AuthService.login(email, password);

      if (response.token) {
        setToken(response.token);

        if (response.user) {
          setUser(response.user);

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

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      setError(null);

      await AuthService.register(userData);
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await AuthService.logout();

      setUser(null);
      setToken(null);

      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(error.message || 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== User Management ====================
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
    }
  };

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
        getProfile,
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