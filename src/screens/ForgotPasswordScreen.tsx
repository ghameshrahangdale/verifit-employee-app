import React, { useState } from 'react';
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

type ForgotPasswordNavProp = StackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { colors } = useTheme();
  const navigation = useNavigation<ForgotPasswordNavProp>();

  const validateForm = () => {
    let valid = true;

    if (!email) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Invalid email');
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

    //   await AuthService.resetPassword(email);

      Toast.show({
        type: 'success',
        text1: 'Email Sent',
        text2: 'Password reset link sent to your email 📧',
      });

      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: error.message || 'Something went wrong',
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
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        >
          <View className="px-6">
            {/* Card */}
            <View className="bg-white rounded-3xl px-6 py-8 shadow-xl border border-gray-100">
              
              {/* Logo */}
              <View className="items-center mb-6">
                <Logo size="xl" />
              </View>

              {/* Title */}
              <Text className="text-2xl font-rubik-bold text-gray-900 text-center">
                Forgot Password?
              </Text>
              <Text className="text-gray-500 text-center font-rubik mt-1 mb-8">
                Enter your email to reset your password
              </Text>

              {/* Email Input */}
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={emailError}
              />

              {/* Reset Button */}
              <Button
                title="Send Reset Link"
                onPress={handleResetPassword}
                loading={isLoading}
                fullWidth
              />

              {/* Back to Login */}
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="mt-6 self-center"
              >
                <Text className="text-blue-600 font-rubik-medium">
                  Back to Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ForgotPasswordScreen;
