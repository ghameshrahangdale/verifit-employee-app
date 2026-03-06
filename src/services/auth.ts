// services/auth.ts
import http from './http.api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  // organizationName: string;
  // organizationAddress?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  message: string;
  user?: any;
  token?: string;
}

export interface VerifyEmailResponse {
  message: string;
  verified?: boolean;
}

export const AuthService = {
  /**
   * Register a new organization admin
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
      const response = await http.post('api/auth/register', payload);
      return response as unknown as AuthResponse;
    } catch (error: any) {
      // Handle validation errors from backend
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        // Format validation errors
        const validationErrors = error.response.data.errors;
        const errorMessages = Object.entries(validationErrors)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
          .join('; ');
        throw new Error(errorMessages);
      }
      throw error;
    }
  },

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const payload: LoginPayload = { email, password };
      const response = await http.post('api/auth/login', payload);
      console.log(response, "from login");
      
      // Store token if returned
      if (response.data?.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        
        // Store user data if needed
        if (response.data?.user) {
          await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        }
      }
      
      return response.data as unknown as AuthResponse;
    } catch (error: any) {
      // Handle error responses
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },

  /**
   * Verify email with token
   * @param token - Email verification token from URL
   */
  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    try {
      const response = await http.get(`api/auth/verify-email?token=${token}`);
      return response as unknown as VerifyEmailResponse;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },

  /**
   * Request password reset email
   * @param email - User's email address
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const payload: ForgotPasswordPayload = { email };
      const response = await http.post('api/auth/forgot-password', payload);
      return response as unknown as { message: string };
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },

  /**
   * Reset password with token
   * @param token - Password reset token
   * @param password - New password
   * @param confirmPassword - Confirm new password
   */
  async resetPassword(token: string, password: string, confirmPassword: string): Promise<{ message: string }> {
    try {
      const payload: ResetPasswordPayload = { token, password, confirmPassword };
      const response = await http.post('api/auth/reset-password', payload);
      return response as unknown as { message: string };
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        const errorMessages = Object.entries(validationErrors)
          .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
          .join('; ');
        throw new Error(errorMessages);
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },

  /**
   * Resend verification email
   * @param email - User's email address
   */
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    try {
      const response = await http.post('api/auth/resend-verification', { email });
      return response as unknown as { message: string };
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },

  /**
   * Logout user
   */
  async logout() {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  },

  /**
   * Get current auth token
   */
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
  },

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<any | null> {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },
};