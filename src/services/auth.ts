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

export interface OrganizationOnboardPayload {
  name: string;
  mobileNumber: string;
  panNumber: string;
  companyType: string;
  address: string;
  country: string;
  state: string;
  city: string;
  businessEmail: string;
  companyWebsite?: string;
  udyamNumber?: string;
  cinNumber?: string;
  companySize: string;
}

export type OrganizationOnboardRequest = FormData;

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
  data?:any;
}

export interface VerifyEmailResponse {
  data: any;
  message: string;
  verified?: boolean;
}

export interface OrganizationOnboardResponse {
  message: string;
  organization?: any;
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
   * Complete organization onboarding
   * @param payload - Organization details for onboarding
   */
 async organizationOnboard(payload: any): Promise<OrganizationOnboardResponse> {
  try {
    const token = await AsyncStorage.getItem("authToken");

    if (!token) {
      throw new Error("Authentication token not found. Please login again.");
    }

    const formData = new FormData();

     Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (key === "logo" && typeof value === "object" && "uri" in value) {
        formData.append("logo", {
          uri: (value as any).uri,
          name: (value as any).name || "logo.jpg",
          type: (value as any).type || "image/jpeg",
        } as any);
      } else {
        formData.append(key, String(value));
      }
    });


    console.log("payload", formData);

    const response = await http.post(
      "api/organization/onboard",
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log(response);

    if (response.data?.organization) {
      const userData = await AsyncStorage.getItem("userData");

      if (userData) {
        const parsedUserData = JSON.parse(userData);

        const updatedUserData = {
          ...parsedUserData,
          organization: response.data.organization,
        };

        await AsyncStorage.setItem(
          "userData",
          JSON.stringify(updatedUserData)
        );
      }
    }

    return response.data as OrganizationOnboardResponse;

  } catch (error: any) {

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }

    if (error.response?.data?.errors) {
      const validationErrors = error.response.data.errors;

      const errorMessages = Object.entries(validationErrors)
        .map(([field, messages]) =>
          `${field}: ${(messages as string[]).join(", ")}`
        )
        .join("; ");

      throw new Error(errorMessages);
    }

    if (error.message) {
      throw error;
    }

    throw new Error("Organization onboarding failed. Please try again.");
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