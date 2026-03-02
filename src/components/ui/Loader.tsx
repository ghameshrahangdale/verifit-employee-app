import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext'; 

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
}

const Loader: React.FC<LoaderProps> = ({
  size = 'large',
  color,
  fullScreen = false,
}) => {
  const { colors } = useTheme();

  const containerClass = fullScreen
    ? 'flex-1 justify-center items-center bg-white'
    : 'py-8';

  return (
    <View className={containerClass}>
      <ActivityIndicator
        size={size}
        color={color || colors.primary}
      />
    </View>
  );
};

export default Loader;