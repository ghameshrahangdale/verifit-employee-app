import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { AuthService } from '../services/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import Toast from 'react-native-toast-message';
import Logo from '../components/common/Logo';

type SignupScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Signup'
>;

const SignupScreen: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const navigation = useNavigation<SignupScreenNavigationProp>();

  // Immediate email validation
  useEffect(() => {
    if (email.length === 0) {
      setErrors(prev => ({ ...prev, email: '' }));
      return;
    }

    if (!email.includes('@')) {
      setErrors(prev => ({ 
        ...prev, 
        email: 'Please include "@" in your email address' 
      }));
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors(prev => ({ 
        ...prev, 
        email: 'Please enter a valid email address (e.g., name@example.com)' 
      }));
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  }, [email]);

  // Immediate password validation
  useEffect(() => {
    if (password.length === 0) {
      setErrors(prev => ({ ...prev, password: '' }));
      return;
    }

    const missingRequirements: string[] = [];

    if (password.length < 6) {
      missingRequirements.push('6 characters');
    }

    if (!/[A-Z]/.test(password)) {
      missingRequirements.push('one uppercase letter');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      missingRequirements.push('one special character (!@#$% etc.)');
    }

    if (missingRequirements.length > 0) {
      setErrors(prev => ({ 
        ...prev, 
        password: `Must include: ${missingRequirements.join(', ')}` 
      }));
    } else {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  }, [password]);

  // Immediate confirm password validation
  useEffect(() => {
    if (confirmPassword.length === 0) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
      return;
    }

    if (password !== confirmPassword) {
      setErrors(prev => ({ 
        ...prev, 
        confirmPassword: 'Passwords do not match. Please try again.' 
      }));
    } else {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  }, [password, confirmPassword]);

  const validateForm = () => {
    const e: any = {};
    
    if (!displayName.trim()) {
      e.displayName = 'Please enter your name';
    }
    
    if (!email) {
      e.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      e.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      e.password = 'Password is required';
    } else if (password.length < 6 || !/[A-Z]/.test(password) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      // Use the same validation logic but with a cleaner message for final validation
      const missing = [];
      if (password.length < 6) missing.push('6 characters');
      if (!/[A-Z]/.test(password)) missing.push('one uppercase letter');
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) missing.push('one special character');
      e.password = `Password must include: ${missing.join(', ')}`;
    }
    
    if (password !== confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    // Clear previous errors
    setSignupError(null);
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const res = await AuthService.signupWithEmail(email, password, displayName);
      Toast.show({
        type: 'success',
        text1: 'Account created',
        text2: 'Please login to continue',
      });

      navigation.navigate('Login');
    
    } catch (err: any) {
      const message = err?.message || 'Signup failed';
      setSignupError(message);

      Toast.show({
        type: 'error',
        text1: 'Signup Failed',
        text2: message,
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
        >
          <View className="px-6">
            <View className="bg-white rounded-3xl px-6 py-8 shadow-xl border border-gray-100">

              <View className="items-center mb-6">
                <Logo size="xl" />
              </View>

              <Text className="text-2xl font-rubik-bold text-center text-gray-900">
                Create your account
              </Text>
              <Text className="text-gray-500 text-center font-rubik mt-1 mb-8">
                It takes less than a minute
              </Text>

              <Input
                label="Full Name"
                value={displayName}
                onChangeText={setDisplayName}
                error={errors.displayName}
                placeholder="John Doe"
              />

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                error={errors.email}
                placeholder="eg. example@gmail.com"
              />

              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                error={errors.password}
                placeholder="••••••••"
              />

              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                error={errors.confirmPassword}
                placeholder="••••••••"
              />

              <Button
                title="Create Account"
                onPress={handleSignup}
                loading={isLoading}
                fullWidth
                className="mt-4"
              />

              <View className="flex-row justify-center mt-6">
                <Text className="text-gray-600 font-rubik">
                  Already have an account?
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text className="text-blue-600 font-rubik-medium ml-1">
                    Sign in
                  </Text>
                </TouchableOpacity>
              </View>

              {signupError && (
                <View className="mt-4 bg-red-50 p-3 rounded-xl">
                  <Text className="text-red-600 text-center font-rubik">
                    {signupError}
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

export default SignupScreen;