import React from 'react';
import { Image, Text, View, ImageSourcePropType } from 'react-native';
import { Images } from '../../config/logo.config';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

interface LogoProps {
  size?: LogoSize;
  source?: ImageSourcePropType;
  text?: string;
  color?: string;
  width?: number; // Optional custom width
  height?: number; // Optional custom height
}

// For horizontal/wide logo, we maintain aspect ratio
const sizeMap = {
  sm: { width: 60, height: 24 },   // 2.5:1 aspect ratio
  md: { width: 80, height: 32 },   // 2.5:1 aspect ratio
  lg: { width: 120, height: 48 },  // 2.5:1 aspect ratio
  xl: { width: 160, height: 64 },  // 2.5:1 aspect ratio
  '2xl': { width: 200, height: 80 }, // 2.5:1 aspect ratio
  '3xl': { width: 250, height: 100 }, // 2.5:1 aspect ratio
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
  source = Images.logo,
  text = 'LOGO',
  color = '#111827',
  width,
  height,
}) => {
  // Use custom dimensions if provided, otherwise use sizeMap
  const dimensions = sizeMap[size];
  const imageWidth = width || dimensions.width;
  const imageHeight = height || dimensions.height;
  const fontSize = fontSizeMap[size];

  return (
    <View className="items-center justify-center">
      {source ? (
        <Image
          source={source}
          style={{ 
            width: imageWidth, 
            height: imageHeight,
          }}
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