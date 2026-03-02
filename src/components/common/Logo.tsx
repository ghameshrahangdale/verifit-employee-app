import React from 'react';
import { Image, Text, View, ImageSourcePropType } from 'react-native';
import { Images } from '../../config/logo.config';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

interface LogoProps {
  size?: LogoSize;
  source?: ImageSourcePropType;
  text?: string;
  color?: string;
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
  '2xl': 80,
  '3xl': 100,
};

const fontSizeMap = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 32,
};

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  source = Images.logo, // ✅ default local asset
  text = 'LOGO',
  color = '#111827',
}) => {
  const dimension = sizeMap[size];
  const fontSize = fontSizeMap[size];

  return (
    <View className="items-center justify-center">
      {source ? (
        <Image
          source={source}
          style={{ width: dimension, height: dimension, borderRadius: dimension / 8 }}
          resizeMode="contain"
        />
      ) : (
        <Text
          style={{ fontSize, color }}
          className="font-extrabold tracking-wide"
        >
          {text}
        </Text>
      )}
    </View>
  );
};

export default Logo;
