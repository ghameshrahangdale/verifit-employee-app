// screens/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import Logo from '../components/common/Logo';
import Toast from 'react-native-toast-message';
import { AuthService } from '../services/auth';
import { useAuth } from '../context/AuthContext';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { colors } = useTheme();
  const { login, isLoading, error, clearError } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();

   useEffect(() => {
    if (email) setEmailError('');
    if (password) setPasswordError('');
    if (error) clearError();
  }, [email, password]);

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

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    } else {
      setPasswordError('');
    }

    return valid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    try {
      await login(email, password);
      
      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: 'Welcome back! 👋',
        visibilityTime: 3000,
      });
      
      
    } catch (error: any) {
      
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.message || 'Failed to login',
        visibilityTime: 4000,
      });
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
              
              {/* Logo */}
              <View className="mb-6 items-center">
                <Logo size="lg" />
              </View>

              {/* Title */}
              <Text className="text-2xl font-rubik-bold text-gray-900 text-center">
                Sign in to your account
              </Text>
              <Text className="text-gray-500 text-center font-rubik mt-1 mb-8">
                Welcome back! Please enter your details
              </Text>

              {/* Error Display */}
              {error ? (
                <View className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
                  <Text className="text-red-600 text-center font-rubik text-sm">
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* Inputs */}
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                // autoComplete="email"
                error={emailError}
                required
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                error={passwordError}
                required
              />

              {/* Forgot Password */}
              <TouchableOpacity 
                className="self-end mb-6"
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text className="text-sm text-blue-600 font-rubik">
                  Forgot password?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <Button
                title={isLoading ? "Signing in..." : "Sign In"}
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                fullWidth
              />

              {/* Signup Link */}
              <View className="flex-row justify-center mt-6">
                <Text className="text-gray-600 font-rubik">
                  Don't have an account?
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                  <Text className="text-blue-600 font-rubik-medium ml-1">
                    Sign up
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;