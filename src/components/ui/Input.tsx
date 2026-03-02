import React, { useState } from 'react';
import { TextInput, View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  className?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  keyboardType = 'default',
  autoCapitalize = 'none',
  className = '',
}) => {
  const { colors } = useTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const showPassword = secureTextEntry && !isPasswordVisible;

  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="mb-2 font-rubik-medium text-gray-700">{label}</Text>
      )}

      <View className="relative">
        <TextInput
          className={`border rounded-lg px-4 pr-12 text-base font-rubik ${
            error ? 'border-red-500' : 'border-gray-300'
          } focus:border-blue-500`}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={{ color: colors.text }}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(prev => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2"
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text className="mt-1 text-red-500 text-sm font-rubik">
          {error}
        </Text>
      )}
    </View>
  );
};

export default Input;
