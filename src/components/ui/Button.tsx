import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
}) => {
  const { colors } = useTheme();

  const getButtonStyle = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-green-500';
      case 'outline':
        return 'border border-blue-500 bg-transparent';
      case 'danger':
        return 'bg-red-500';
      case 'primary':
      default:
        return 'bg-blue-500';
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return 'text-blue-500';
      default:
        return 'text-white';
    }
  };

  return (
    <TouchableOpacity
      className={`py-4 px-6 rounded-lg font-rubik ${
        fullWidth ? 'w-full' : ''
      } ${getButtonStyle()} ${
        disabled || loading ? 'opacity-50' : ''
      } ${className}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={{
        ...(variant === 'secondary' && { backgroundColor: colors.secondary }),
        ...(variant === 'primary' && { backgroundColor: colors.primary }),
        ...(variant === 'danger' && { backgroundColor: colors.error }),
        ...(variant === 'outline' && { 
          borderColor: colors.primary,
          backgroundColor: 'transparent'
        }),
      }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : 'white'} />
      ) : (
        <Text 
          className={`text-center font-rubik-medium text-md ${getTextStyle()}`}
          style={{
            ...(variant === 'outline' && { color: colors.primary })
          }}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;