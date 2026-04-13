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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from '../components/layout/Screen';
import Icon from 'react-native-vector-icons/Feather'; // Import Icon

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Add success state

  const { colors } = useTheme();
  const { login, error, clearError, getProfile } = useAuth();
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
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage(null); // Clear any previous success message
      
      const response = await login(email, password);
      console.log('Login response:', response); // Debug log

      await getProfile();

      // Show success message
      setSuccessMessage('Login successful! Welcome back! 👋');
      
      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: 'Welcome back! 👋',
        visibilityTime: 3000,
      });

      // Optional: Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to login');
      console.log(error);
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.message || 'Failed to login',
        visibilityTime: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen>
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
              <View className="">
                
                {/* Logo */}
                <View className="mb-6 items-center">
                  <Logo size="lg" />
                </View>

                {/* Title */}
                <Text className="text-2xl font-rubik-bold text-gray-900 text-center">
                  Sign in to your account
                </Text>
                <Text className="text-gray-500 text-center font-rubik mt-1 mb-8">
                  Enter your email and password to sign in!
                </Text>

                {/* Success Message Display - Enhanced Badge */}
                {successMessage && (
                  <View className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4 flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center">
                      <Icon name="check-circle" size={20} color="#10b981" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-green-800 font-rubik-medium text-sm">
                        Success!
                      </Text>
                      <Text className="text-green-700 font-rubik text-sm">
                        {successMessage}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setSuccessMessage(null)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon name="x" size={18} color="#10b981" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Error Message Display - Enhanced Badge */}
                {errorMessage && (
                  <View className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex-row items-center gap-3">
                  
                    <View className="flex-1">
                      
                      <Text className="text-red-700 font-rubik text-sm">
                        {errorMessage}
                      </Text>
                    </View>
                    
                  </View>
                )}

                {/* Legacy error display - keep for backward compatibility if needed */}
                {error && !errorMessage && (
                  <View className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3">
                    <Text className="text-red-600 text-center font-rubik text-sm">
                      {error}
                    </Text>
                  </View>
                )}

                {/* Inputs */}
                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                  <Text className="text-sm font-rubik"
                    style={{ color: colors.primary }}
                  >
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
                    <Text className=" font-rubik ml-1"
                      style={{ color: colors.primary }}
                    >
                      Sign up
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Screen>
  );
};

export default LoginScreen;