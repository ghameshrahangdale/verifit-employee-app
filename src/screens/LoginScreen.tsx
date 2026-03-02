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
import { configureGoogleSignIn, signInWithGoogle } from '../services/googleSignIn';
import Logo from '../components/common/Logo';
import Toast from 'react-native-toast-message';
import { AuthService } from '../services/auth';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { colors } = useTheme();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  // Clear errors when user starts typing
  useEffect(() => {
    if (email) setEmailError('');
    if (password) setPasswordError('');
    if (error) setError('');
  }, [email, password]);

  const validateForm = () => {
    let valid = true;

    if (!email) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Invalid email');
      valid = false;
    } else setEmailError('');

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Min 6 characters');
      valid = false;
    } else setPasswordError('');

    return valid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    try {
      
      setEmailLoading(true);
      setError('');

      await AuthService.loginWithEmail(email, password);
      // If login is successful, show success message
      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: 'Welcome back 👋',
        
      });
    } catch (error: any) {
      console.log(error);
      
      setError(error.message);
      
      // Show error toast
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.message,
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError('');

      const credential = await signInWithGoogle();
      if (!credential) {
        Toast.show({
          type: 'error',
          text1: 'Sign In Cancelled',
          text2: 'Google sign in was cancelled',
        });
        return;
      }
      
      await AuthService.signInWithGoogle();
      
      // If login is successful, show success message
      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: 'Welcome back 👋',
      });
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
      
      // Show error toast
      Toast.show({
        type: 'error',
        text1: 'Google Login Failed',
        text2: error.message || 'Failed to sign in with Google',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      setError('');
    };
  }, []);

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
              <View className="">
                <Logo size="3xl" />
              </View>

              {/* Title */}
              <Text className="text-2xl font-rubik-bold text-gray-900 text-center">
                Sign in to your account
              </Text>
              <Text className="text-gray-500 text-center font-rubik mt-1 mb-8">
                Welcome back, let's continue
              </Text>

              {/* Inputs */}
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={emailError}
                required
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                error={passwordError}
                required
              />

              {/* Forgot */}
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
                title="Sign In"
                onPress={handleLogin}
                loading={emailLoading}
                fullWidth
              />

              {/* Divider */}
              {/* <View className="flex-row items-center my-6">
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="mx-3 text-gray-400 font-rubik text-sm">OR</Text>
                <View className="flex-1 h-px bg-gray-200" />
              </View> */}

              {/* Google */}
              {/* <Button
                title="Continue with Google"
                onPress={handleGoogleLogin}
                loading={googleLoading}
                variant="outline"
                fullWidth
              /> */}

              {/* Signup */}
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

              {/* Error Display */}
              {error && (
                <View className="mt-4 bg-red-50 p-3 rounded-xl">
                  <Text className="text-red-600 text-center font-rubik">
                    {error}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;