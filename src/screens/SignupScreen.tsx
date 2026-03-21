// screens/SignupScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { AuthService } from '../services/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import Toast from 'react-native-toast-message';
import Logo from '../components/common/Logo';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Feather';
import http from '../services/http.api';

type SignupScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Signup'
>;

interface Company {
  id: string;
  name: string;
}

type UserRole = 'organization' | 'employee';

const SignupScreen: React.FC = () => {
  const { colors } = useTheme();
  
  // Role selection state
  const [selectedRole, setSelectedRole] = useState<UserRole>('organization');
  
  // Companies state for employee registration
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companyPage, setCompanyPage] = useState(1);
  const [hasMoreCompanies, setHasMoreCompanies] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '', // Added for employee
  });

  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const navigation = useNavigation<SignupScreenNavigationProp>();

  // Fetch companies when employee role is selected
  useEffect(() => {
    if (selectedRole === 'employee') {
      fetchCompanies();
    }
  }, [selectedRole]);

  const fetchCompanies = async (page: number = 1) => {
    if (loadingCompanies) return;

    setLoadingCompanies(true);
    try {
      const response = await http.get(`api/organization?page=${page}&limit=20`);

      const newCompanies = response.data.data;

      if (page === 1) {
        setCompanies(newCompanies);
      } else {
        setCompanies(prev => [...prev, ...newCompanies]);
      }

      setHasMoreCompanies(response.data.pagination?.hasNextPage || false);
      setCompanyPage(page);

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Companies',
        text2: 'Unable to fetch company list',
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadMoreCompanies = () => {
    if (hasMoreCompanies && !loadingCompanies) {
      fetchCompanies(companyPage + 1);
    }
  };

  // Handle input changes
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear specific field error
    setFieldErrors(prev => ({
      ...prev,
      [field]: '',
    }));

    if (error) setError(null);
  };

  // Validate form based on role
  const validateForm = (): boolean => {
    let valid = true;

    const errors = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
    };

    if (!formData.firstName.trim()) {
      errors.firstName = 'Please enter first name';
      valid = false;
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Please enter last name';
      valid = false;
    }

    if (!formData.email.trim()) {
      errors.email = 'Please enter email';
      valid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please enter valid email address';
      valid = false;
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;

    if (!formData.password) {
      errors.password = 'Please enter password';
      valid = false;
    } else if (!passwordRegex.test(formData.password)) {
      errors.password =
        'Password must be at least 6 characters, including one capital letter, one number and one special character';
      valid = false;
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm password';
      valid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    // Employee-specific validations
    if (selectedRole === 'employee') {
      if (!formData.phone.trim()) {
        errors.phone = 'Please enter phone number';
        valid = false;
      } else if (!/^\d{10}$/.test(formData.phone.trim())) {
        errors.phone = 'Please enter a valid 10-digit phone number';
        valid = false;
      }

      
    }

    if (!isChecked) {
      setError('Please accept the Terms and Conditions and Privacy Policy');
      valid = false;
    }

    setFieldErrors(errors);

    return valid;
  };

  // Handle form submission
  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Prepare payload based on role
      let payload: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      };

      if (selectedRole === 'employee') {
        payload = {
          ...payload,
          role: 'employee',
          phone: formData.phone.trim(),
        };
      } else {
        // Organization registration
        payload = {
          ...payload,
          // organizationName and organizationAddress will be added in the next step
        };
      }

      const response = await AuthService.register(payload);

      // Show success message
      setSuccessMessage(response.message || "Registration successful! Please check your email to verify your account.");

      Toast.show({
        type: 'success',
        text1: 'Registration Successful',
        text2: response.message || 'Please check your email to verify your account',
        visibilityTime: 5000,
      });

      // Clear form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
      });
      setIsChecked(false);

    } catch (err: any) {
      // Handle error
      const errorMessage = err.message || "An unexpected error occurred. Please try again.";
      setError(errorMessage);

      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderRoleSelector = () => (
    <View className="mb-6">
      <Text className="font-rubik-medium text-lg text-gray-700 mb-3">
        Register as <Text className="text-red-500">*</Text>
      </Text>
      <View className="flex-row gap-4">
        {/* Organization */}
        <TouchableOpacity
          onPress={() => {
            setSelectedRole('organization');
            // Reset employee-specific fields
            setFormData(prev => ({
              ...prev,
              phone: '',
            }));
            setFieldErrors(prev => ({
              ...prev,
              phone: '',
            }));
          }}
          className="flex-1 p-4 rounded-xl border"
          style={{
            borderColor: selectedRole === 'organization'
              ? colors.primary
              : '#E5E7EB',
            backgroundColor: selectedRole === 'organization'
              ? `${colors.primary}10`
              : 'transparent',
          }}
          activeOpacity={0.8}
        >
          <Text
            className="font-rubik-medium text-base"
            style={{
              color: selectedRole === 'organization'
                ? colors.primary
                : '#1F2937',
            }}
          >
            Organization
          </Text>

          <Text className="font-rubik text-xs mt-1 text-gray-500">
            Create a new organization account
          </Text>
        </TouchableOpacity>

        {/* Employee */}
        <TouchableOpacity
          onPress={() => setSelectedRole('employee')}
          className="flex-1 p-4 rounded-xl border"
          style={{
            borderColor: selectedRole === 'employee'
              ? colors.primary
              : '#E5E7EB',
            backgroundColor: selectedRole === 'employee'
              ? `${colors.primary}10`
              : 'transparent',
          }}
          activeOpacity={0.8}
        >
          <Text
            className="font-rubik-medium text-base"
            style={{
              color: selectedRole === 'employee'
                ? colors.primary
                : '#1F2937',
            }}
          >
            Employee
          </Text>

          <Text className="font-rubik text-xs mt-1 text-gray-500">
            Join an existing organization
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          <View className="px-6 py-8">
            {successMessage ? (
              // Success UI - shown after successful registration
              <View className="items-center px-6 py-10">

                {/* Icon Badge */}
                <View className="w-24 h-24 rounded-full bg-purple-100 items-center justify-center mb-6">
                  <Icon name="check-circle" size={52} color="#9333ea" />
                </View>

                {/* Heading */}
                <Text className="text-2xl font-rubik-bold text-center text-gray-900 mb-2">
                  Check your inbox
                </Text>
                <Text className="text-gray-500 text-center font-rubik text-sm leading-5 mb-6 px-4">
                  Your account has been created. We've sent a verification link to:
                </Text>

                {/* Email Display */}
                <TouchableOpacity
                  onPress={() => {
                    // Handle email click - open mail client
                  }}
                  className="bg-purple-50 border border-purple-200 rounded-xl px-5 py-3 mb-6 w-full items-center"
                >
                  <Text className="text-purple-700 font-rubik-medium text-base">
                    {formData.email}
                  </Text>
                </TouchableOpacity>

                {/* Expiry Warning */}
                <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 w-full flex-row items-start gap-2">
                  <Text className="text-amber-500 text-base mt-0.5">⚠️</Text>
                  <Text className="text-amber-700 font-rubik text-sm leading-5 flex-1">
                    Verification link expires in <Text className="font-rubik-medium">24 hours</Text>. Please verify your email as soon as possible.
                  </Text>
                </View>

                {/* Primary CTA */}
                <TouchableOpacity
                  onPress={() => {
                    setSuccessMessage(null);
                  }}
                  className="bg-purple-600 rounded-2xl w-full py-4 items-center mb-3 shadow-sm"
                  activeOpacity={0.85}
                >
                  <Text className="text-white font-rubik-bold text-base tracking-wide">
                    Resend Email
                  </Text>
                </TouchableOpacity>

                {/* Secondary CTA */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  className="border border-gray-200 rounded-2xl w-full py-4 items-center mb-8 bg-white"
                  activeOpacity={0.75}
                >
                  <Text className="text-gray-700 font-rubik-medium text-base">
                    Go to Sign In
                  </Text>
                </TouchableOpacity>

                {/* Spam hint */}
                <Text className="text-gray-400 text-center font-rubik text-xs leading-4 mb-6 px-2">
                  Can't find the email? Check your spam folder and mark it as "Not Spam".
                </Text>

                {/* Wrong email */}
                <View className="flex-row justify-center items-center">
                  <Text className="text-gray-500 font-rubik text-sm">
                    Wrong email?{' '}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      // Clear success message to show form again
                      setSuccessMessage(null);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <Text className="text-purple-600 font-rubik-medium text-sm underline">
                      Register again
                    </Text>
                  </TouchableOpacity>
                </View>

              </View>
            ) : (
              <View className="">

                <View className="mb-6 items-start">
                  <Logo size="md" />
                </View>

                <Text className="text-2xl font-rubik-bold text-left text-gray-900">
                  Registration
                </Text>
                <Text className="text-gray-500 text-left font-rubik mt-1 mb-6">
                  Enter your details to create an account!
                </Text>

                {/* Error Message Display */}
                {error && (
                  <View className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <Text className="text-red-600 text-center font-rubik">
                      {error}
                    </Text>
                  </View>
                )}

                {/* Success Message Display */}
                {successMessage && (
                  <View className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                    <Text className="text-green-600 text-center font-rubik">
                      {successMessage}
                    </Text>
                  </View>
                )}

                {/* Password Error Display */}
                {passwordError && (
                  <View className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <Text className="text-red-600 text-center font-rubik">
                      {passwordError}
                    </Text>
                  </View>
                )}

                {/* Form Fields */}
                <View className="space-y-4">
                  {/* Role Selector */}
                  {renderRoleSelector()}

                  {/* First Name & Last Name Row */}
                  <View className="flex-col gap-3">
                    <View className="flex-1">
                      <Input
                        label="First Name"
                        value={formData.firstName}
                        onChangeText={(value) => handleChange('firstName', value)}
                        placeholder="Enter first name"
                        required
                        error={fieldErrors.firstName}
                      />
                    </View>
                    <View className="flex-1">
                      <Input
                        label="Last Name"
                        value={formData.lastName}
                        onChangeText={(value) => handleChange('lastName', value)}
                        placeholder="Enter last name"
                        required
                        error={fieldErrors.lastName}
                      />
                    </View>
                  </View>

                  {/* Email */}
                  <Input
                    label="Email"
                    value={formData.email}
                    onChangeText={(value) => handleChange('email', value)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="Enter your email"
                    required
                    error={fieldErrors.email}
                  />

                  {/* Password */}
                  <Input
                    label="Password"
                    value={formData.password}
                    onChangeText={(value) => handleChange('password', value)}
                    secureTextEntry={!showPassword}
                    placeholder="Enter your password"
                    required
                    error={fieldErrors.password}
                  />

                  {/* Confirm Password */}
                  <Input
                    label="Confirm Password"
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleChange('confirmPassword', value)}
                    secureTextEntry={!showConfirmPassword}
                    placeholder="Confirm your password"
                    required
                    error={fieldErrors.confirmPassword}
                  />

                  {/* Employee-specific fields */}
                  {selectedRole === 'employee' && (
                    <>
                      {/* Phone */}
                      <Input
                        label="Phone Number"
                        value={formData.phone}
                        onChangeText={(value) => handleChange('phone', value)}
                        placeholder="Enter 10-digit phone number"
                        keyboardType="phone-pad"
                        required
                        error={fieldErrors.phone}
                      />

                      
                    </>
                  )}

                  {/* Terms Checkbox */}
                  <TouchableOpacity
                    onPress={() => setIsChecked(!isChecked)}
                    className="flex-row items-start space-x-3 mt-2"
                  >
                    <View className={`w-5 h-5 border-2 rounded mt-1 ${isChecked
                      ? 'bg-purple-600 border-purple-600'
                      : 'border-gray-300 bg-white'
                      }`}>
                      {isChecked && (
                        <Text className="text-white text-xs text-center">✓</Text>
                      )}
                    </View>
                    <Text className="flex-1 text-gray-600 font-rubik ml-2 text-sm">
                      By creating an account means you agree to the{' '}
                      <Text className="text-gray-900 font-rubik-medium">
                        Terms and Conditions,
                      </Text>{' '}
                      and our{' '}
                      <Text className="text-gray-900 font-rubik-medium">
                        Privacy Policy
                      </Text>
                    </Text>
                  </TouchableOpacity>

                  {/* Submit Button */}
                  <Button
                    title={isLoading ? "Creating account..." : selectedRole === 'organization' ? "Register Organization" : "Register as Employee"}
                    onPress={handleSignup}
                    loading={isLoading}
                    fullWidth
                    className="mt-4"
                    disabled={isLoading}
                  />

                  {/* Login Link */}
                  <View className="flex-row justify-center mt-4">
                    <Text className="text-gray-600 font-rubik">
                      Already have an account?
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Login')}
                    >
                      <Text className=" font-rubik ml-1"
                        style={{ color: colors.primary }}
                      >
                        Sign In
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>)}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignupScreen;