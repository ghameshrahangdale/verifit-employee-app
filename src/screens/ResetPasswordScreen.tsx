// screens/ResetPasswordScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Logo from '../components/common/Logo';
import Toast from 'react-native-toast-message';
import { AuthService } from '../services/auth';
import Feather from 'react-native-vector-icons/Feather';

type ResetPasswordNavProp = StackNavigationProp<
  AuthStackParamList,
  'ResetPassword'
>;

type ResetPasswordRouteProp = RouteProp<
  AuthStackParamList,
  'ResetPassword'
>;

const ResetPasswordScreen: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { colors } = useTheme();
  const navigation = useNavigation<ResetPasswordNavProp>();
  const route = useRoute<ResetPasswordRouteProp>();
  
  // Get token from route params
  const { token } = route.params || {};

  // Clear errors when user starts typing
  useEffect(() => {
    if (password) {
      setPasswordError('');
      validatePassword(password);
    }
    if (confirmPassword) setConfirmPasswordError('');
    if (error) setError(null);
  }, [password, confirmPassword]);

  // Validate password strength
  const validatePassword = (value: string) => {
    if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateForm = () => {
    let valid = true;

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      valid = false;
    }

    return valid;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setError(null);

      // Call the reset password API with token
      await AuthService.resetPassword(token, password, confirmPassword);

      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Password Reset Successful',
        text2: 'Your password has been updated. Please sign in with your new password.',
        visibilityTime: 5000,
      });

      // Set success state
      setIsSuccess(true);
      
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to reset password';
      setError(errorMessage);
      
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: errorMessage,
        visibilityTime: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigation.navigate('Login');
  };

  const handleGoBack = () => {
    if (isSuccess) {
      navigation.navigate('Login');
    } else {
      navigation.goBack();
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 py-8">
            {/* Card */}
            <View className="bg-white rounded-3xl px-6 py-8 shadow-xl border border-gray-100">
              
              {/* Back Button */}
              <TouchableOpacity 
                onPress={handleGoBack}
                className="mb-4"
              >
                <Feather name="arrow-left" size={24} color="#4B5563" />
              </TouchableOpacity>
              
              {/* Logo */}
              <View className="items-center mb-6">
                <Logo size="xl" />
              </View>

              {/* Title */}
              <Text className="text-2xl font-rubik-bold text-gray-900 text-center">
                {!isSuccess ? 'Reset Password' : 'Password Reset!'}
              </Text>
              <Text className="text-gray-500 text-center font-rubik mt-1 mb-8">
                {!isSuccess 
                  ? 'Enter your new password below'
                  : 'Your password has been successfully reset'
                }
              </Text>

              {/* Error Display */}
              {error && !isSuccess && (
                <View className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
                  <Text className="text-red-600 text-center font-rubik text-sm">
                    {error}
                  </Text>
                </View>
              )}

              {!isSuccess ? (
                <>
                  {/* Password Input */}
                  <Input
                    label="New Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter new password"
                    secureTextEntry={!showPassword}
                    error={passwordError}
                    required
                    hint='Password must be at least 6 characters long'
                    
                  />

                  {/* Confirm Password Input */}
                  <Input
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    secureTextEntry={!showConfirmPassword}
                    error={confirmPasswordError}
                    required
                    
                  />

               
                  {/* Reset Button */}
                  <Button
                    title={isLoading ? "Resetting..." : "Reset Password"}
                    onPress={handleResetPassword}
                    loading={isLoading}
                    disabled={isLoading}
                    fullWidth
                    className="mt-2"
                  />
                </>
              ) : (
                /* Success State */
                <View className="mt-2">
                  {/* Success Icon */}
                  <View className="items-center mb-6">
                    <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center">
                      <Feather name="check-circle" size={40} color="#10B981" />
                    </View>
                  </View>

                  <Text className="text-gray-600 text-center font-rubik mb-6">
                    Your password has been successfully reset. You can now sign in with your new password.
                  </Text>

                  {/* Go to Login Button */}
                  <Button
                    title="Go to Sign In"
                    onPress={handleGoToLogin}
                    fullWidth
                  />

                  {/* Security Note */}
                  <Text className="text-xs text-gray-400 text-center font-rubik mt-4">
                    For security reasons, please use your new password the next time you sign in.
                  </Text>
                </View>
              )}

              {/* Back to Login Link - Only show in non-success state */}
              {!isSuccess && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  className="mt-6 self-center"
                >
                  <Text className="text-blue-600 font-rubik-medium">
                    Back to Sign In
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ResetPasswordScreen;