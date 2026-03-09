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
  const [fieldErrors, setFieldErrors] = useState({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
});

  const navigation = useNavigation<SignupScreenNavigationProp>();

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
  // Validate form
  const validateForm = (): boolean => {
  let valid = true;

  const errors = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
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