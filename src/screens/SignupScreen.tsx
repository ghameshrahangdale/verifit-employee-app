// screens/SignupScreen.tsx
import React, { useState } from 'react';
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
// import Checkbox from '../components/ui/Checkbox'; 

type SignupScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Signup'
>;

const SignupScreen: React.FC = () => {
  // Form state matching web version
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // organizationName: '',
    // organizationAddress: '',
  });

  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigation = useNavigation<SignupScreenNavigationProp>();

  // Handle input changes
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear password error when user types in either password field
    if (field === 'password' || field === 'confirmPassword') {
      setPasswordError(null);
    }
    
    // Clear general error when user makes changes
    if (error) setError(null);
  };

  // Validate form
  const validateForm = (): boolean => {
    // Reset messages
    setError(null);
    setPasswordError(null);

    // Check passwords match
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }

    // Check password strength
    if (formData.password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return false;
    }

    // Check terms acceptance
    if (!isChecked) {
      setError("Please accept the Terms and Conditions and Privacy Policy");
      return false;
    }

    // Check organization name
    // if (!formData.organizationName.trim()) {
    //   setError("Organization name is required");
    //   return false;
    // }

    // Basic email validation
    if (!formData.email.includes('@') || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    // Check required fields
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name and last name are required");
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Prepare payload
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        // organizationName: formData.organizationName.trim(),
        // organizationAddress: formData.organizationAddress.trim() || undefined,
      };

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
        // organizationName: '',
        // organizationAddress: '',
      });
      setIsChecked(false);

      // Navigate to verification screen after delay
      // setTimeout(() => {
      //   navigation.navigate('VerifyEmail'); 
      // }, 3000);

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
            <View className="bg-white rounded-3xl px-6 py-8 shadow-xl border border-gray-100">
              
              <View className="mb-6 items-center">
                <Logo size="lg" />
              </View>

              <Text className="text-2xl font-rubik-bold text-center text-gray-900">
                Organization Registration
              </Text>
              <Text className="text-gray-500 text-center font-rubik mt-1 mb-6">
                Enter your details to create an organization account!
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
                {/* First Name & Last Name Row */}
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Input
                      label="First Name"
                      value={formData.firstName}
                      onChangeText={(value) => handleChange('firstName', value)}
                      placeholder="Enter first name"
                      required
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      label="Last Name"
                      value={formData.lastName}
                      onChangeText={(value) => handleChange('lastName', value)}
                      placeholder="Enter last name"
                      required
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
                />

                {/* Password */}
                <Input
                  label="Password"
                  value={formData.password}
                  onChangeText={(value) => handleChange('password', value)}
                  secureTextEntry={!showPassword}
                  placeholder="Enter your password"
                  required
                  
                />

                {/* Confirm Password */}
                <Input
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleChange('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  placeholder="Confirm your password"
                  required
                  
                />

                

                {/* Terms Checkbox */}
                <TouchableOpacity
                  onPress={() => setIsChecked(!isChecked)}
                  className="flex-row items-start space-x-3 mt-2"
                >
                  <View className={`w-5 h-5 border-2 rounded mt-0.5 ${
                    isChecked 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'border-gray-300 bg-white'
                  }`}>
                    {isChecked && (
                      <Text className="text-white text-center">✓</Text>
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
                  title={isLoading ? "Creating organization..." : "Register Organization"}
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
                    <Text className="text-blue-600 font-rubik-medium ml-1">
                      Sign In
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignupScreen;