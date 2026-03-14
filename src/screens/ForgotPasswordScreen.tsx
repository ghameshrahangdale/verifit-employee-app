// screens/ForgotPasswordScreen.tsx
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Logo from '../components/common/Logo';
import Toast from 'react-native-toast-message';
import { AuthService } from '../services/auth';
import Feather from 'react-native-vector-icons/Feather';

type ForgotPasswordNavProp = StackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { colors } = useTheme();
  const navigation = useNavigation<ForgotPasswordNavProp>();

  // Clear errors when user starts typing
  useEffect(() => {
    if (email) {
      setEmailError('');
      setError(null);
    }
  }, [email]);

  const validateForm = () => {
    let valid = true;

    if (!email) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      valid = false;
    } else {
      setEmailError('');
    }

    return valid;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      setError(null);

      // Call the forgot password API
      await AuthService.forgotPassword(email);

      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Email Sent',
        text2: 'Password reset link sent to your email 📧',
        visibilityTime: 5000,
      });

      // Set success state
      setIsSubmitted(true);
      
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send reset email';
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

  const handleResendEmail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await AuthService.forgotPassword(email);

      Toast.show({
        type: 'success',
        text1: 'Email Resent',
        text2: 'Password reset link sent again to your email 📧',
        visibilityTime: 5000,
      });
      
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to resend email';
      setError(errorMessage);
      
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: errorMessage,
        visibilityTime: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    if (isSubmitted) {
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
                {!isSubmitted ? 'Forgot Password?' : 'Check Your Email'}
              </Text>
              <Text className="text-gray-500 text-center font-rubik mt-1 mb-8">
                {!isSubmitted 
                  ? 'Enter your email to reset your password'
                  : `We've sent a password reset link to`
                }
              </Text>

              {/* Error Display */}
              {error && !isSubmitted && (
                <View className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
                  <Text className="text-red-600 text-center font-rubik text-sm">
                    {error}
                  </Text>
                </View>
              )}

              {!isSubmitted ? (
                <>
                  {/* Email Input */}
                  <Input
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    // autoComplete="email"
                    error={emailError}
                    required
                  />

                  {/* Reset Button */}
                  <Button
                    title={isLoading ? "Sending..." : "Send Reset Link"}
                    onPress={handleResetPassword}
                    loading={isLoading}
                    disabled={isLoading}
                    fullWidth
                    className="mt-4"
                  />
                </>
              ) : (
                /* Success State */
                <View className="mt-2">
                  {/* Success Icon */}
                  <View className="items-center mb-6">
                    <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center">
                      <Feather name="mail" size={40} color="#10B981" />
                    </View>
                  </View>

                  {/* Email Display */}
                  <View className="bg-gray-50 p-4 rounded-xl mb-6">
                    <Text className="text-gray-600 text-center font-rubik">
                      We sent instructions to:
                    </Text>
                    <Text className="text-gray-900 font-rubik-medium text-center mt-1">
                      {email}
                    </Text>
                  </View>

                  <Text className="text-gray-500 text-center font-rubik mb-6">
                    Please check your inbox and follow the link to reset your password.
                  </Text>

                  {/* Resend Button */}
                  <Button
                    title={isLoading ? "Resending..." : "Resend Email"}
                    onPress={handleResendEmail}
                    loading={isLoading}
                    disabled={isLoading}
                    variant="outline"
                    fullWidth
                  />

                  {/* Note about spam */}
                  <Text className="text-xs text-gray-400 text-center font-rubik mt-4">
                    Didn't receive the email? Check your spam folder or try resending.
                  </Text>
                </View>
              )}

              {/* Back to Login Link */}
              {!isSubmitted && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  className="mt-6 self-center"
                >
                  <Text className="font-rubik-medium"
                  style={{color: colors.primary}}
                  >
                    Back to Sign In
                  </Text>
                </TouchableOpacity>
              )}

              {/* Success State - Alternative login link */}
              {isSubmitted && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  className="mt-6 self-center"
                >
                  <Text className="text-blue-600 font-rubik-medium">
                    Return to Sign In
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

export default ForgotPasswordScreen;