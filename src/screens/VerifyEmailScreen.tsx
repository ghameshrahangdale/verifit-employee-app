// screens/VerifyEmailScreen.tsx
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
import Button from '../components/ui/Button';
import Logo from '../components/common/Logo';
import Toast from 'react-native-toast-message';
import { AuthService } from '../services/auth';
import Feather from 'react-native-vector-icons/Feather';

type VerifyEmailNavProp = StackNavigationProp<
  AuthStackParamList,
  'VerifyEmail'
>;

type VerifyEmailRouteProp = RouteProp<
  AuthStackParamList,
  'VerifyEmail'
>;

const VerifyEmailScreen: React.FC = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { colors } = useTheme();
  const navigation = useNavigation<VerifyEmailNavProp>();
  const route = useRoute<VerifyEmailRouteProp>();
  
  // Get token from route params (if coming from email link)
  const { token } = route.params || {};

  // Handle token verification if present
  useEffect(() => {
    if (token) {
      verifyEmailWithToken();
    }
  }, [token]);

  // Verify email with token
  const verifyEmailWithToken = async () => {
    try {
      setIsVerifying(true);
      setError(null);

      if (!token) {
        throw new Error('Verification token is missing');
      }

      const response = await AuthService.verifyEmail(token);
      
      setIsVerified(true);
      
      Toast.show({
        type: 'success',
        text1: 'Email Verified',
        text2: response.message || 'Your email has been successfully verified!',
        visibilityTime: 5000,
      });
      
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to verify email';
      setError(errorMessage);
      
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: errorMessage,
        visibilityTime: 4000,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGoToLogin = () => {
    navigation.navigate('Login');
  };

  const handleGoBack = () => {
    if (isVerified) {
      navigation.navigate('Login');
    } else {
      navigation.goBack();
    }
  };

  // Loading state while verifying token
  if (isVerifying) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <View className="bg-white rounded-3xl px-8 py-10 shadow-xl border border-gray-100 w-11/12 max-w-md">
          <View className="items-center">
            <Logo size="xl" />
            <View className="mt-8">
              <Feather name="loader" size={48} color="#3B82F6" />
            </View>
            <Text className="text-lg font-rubik-medium text-gray-900 mt-4">
              Verifying your email...
            </Text>
            <Text className="text-gray-500 text-center font-rubik mt-2">
              Please wait while we verify your email address
            </Text>
          </View>
        </View>
      </View>
    );
  }

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
              
              {/* Back Button - Only show if not verified */}
              {!isVerified && (
                <TouchableOpacity 
                  onPress={handleGoBack}
                  className="mb-4"
                >
                  <Feather name="arrow-left" size={24} color="#4B5563" />
                </TouchableOpacity>
              )}
              
              {/* Logo */}
              <View className="items-center mb-6">
                <Logo size="xl" />
              </View>

              {/* Title */}
              <Text className="text-2xl font-rubik-bold text-gray-900 text-center">
                {isVerified 
                  ? 'Email Verified!' 
                  : error 
                  ? 'Verification Failed'
                  : token 
                  ? 'Verifying Email'
                  : 'Verify Your Email'
                }
              </Text>
              <Text className="text-gray-500 text-center font-rubik mt-1 mb-8">
                {isVerified 
                  ? 'Your email has been successfully verified'
                  : error 
                  ? 'We could not verify your email'
                  : token 
                  ? 'Processing your verification'
                  : 'Please check your email for verification link'
                }
              </Text>

              {/* Error Display */}
              {error && !isVerified && (
                <View className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
                  <Text className="text-red-600 text-center font-rubik text-sm">
                    {error}
                  </Text>
                </View>
              )}

              {/* Success State */}
              {isVerified && (
                <View className="mt-2">
                  {/* Success Icon */}
                  <View className="items-center mb-6">
                    <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center">
                      <Feather name="check-circle" size={40} color="#10B981" />
                    </View>
                  </View>

                  <Text className="text-gray-600 text-center font-rubik mb-6">
                    Your email has been successfully verified. You can now sign in to your account.
                  </Text>

                  {/* Go to Login Button */}
                  <Button
                    title="Go to Sign In"
                    onPress={handleGoToLogin}
                    fullWidth
                  />
                </View>
              )}

              {/* Verification Pending State - When no token and not verified */}
              {!isVerified && !error && !token && (
                <View className="mt-2">
                  {/* Mail Icon */}
                  <View className="items-center mb-6">
                    <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center">
                      <Feather name="mail" size={40} color="#3B82F6" />
                    </View>
                  </View>

                  <Text className="text-gray-600 text-center font-rubik mb-4">
                    We've sent a verification email to your registered email address.
                  </Text>

                  <Text className="text-gray-500 text-center font-rubik mb-6">
                    Please click the verification link in the email to activate your account.
                  </Text>

                  {/* Note about spam */}
                  <Text className="text-xs text-gray-400 text-center font-rubik">
                    Don't forget to check your spam folder
                  </Text>
                </View>
              )}

              {/* Verification Failed State */}
              {!isVerified && error && (
                <View className="mt-2">
                  {/* Error Icon */}
                  <View className="items-center mb-6">
                    <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center">
                      <Feather name="alert-circle" size={40} color="#EF4444" />
                    </View>
                  </View>

                  <Text className="text-gray-600 text-center font-rubik mb-6">
                    The verification link may have expired or is invalid. Please try signing up again.
                  </Text>

                  {/* Back to Signup */}
                  <Button
                    title="Back to Sign Up"
                    onPress={() => navigation.navigate('Signup')}
                    fullWidth
                  />
                </View>
              )}

              {/* Additional Links */}
              {!isVerified && !error && (
                <View className="flex-row justify-center mt-6">
                  <Text className="text-gray-600 font-rubik">
                    Already verified?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text className="text-blue-600 font-rubik-medium">
                      Sign in
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {error && (
                <View className="flex-row justify-center mt-6">
                  <Text className="text-gray-600 font-rubik">
                    Return to{' '}
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text className="text-blue-600 font-rubik-medium">
                      Sign In
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default VerifyEmailScreen;