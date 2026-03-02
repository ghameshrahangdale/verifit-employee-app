import React from 'react';
import { View, Text, Image, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

interface AvatarProps {
  name?: string;         // User display name
  email?: string;        // User email (fallback initial)
  imageUrl?: string;     // Profile image url
  size?: AvatarSize;     // Predefined sizes
  customSize?: number;   // Custom width/height in px
  style?: StyleProp<ViewStyle>; // Additional style
}

const SIZE_MAP: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
  '2xl': 96,
  '3xl': 120,
};

const Avatar: React.FC<AvatarProps> = ({
  name,
  email,
  imageUrl,
  size = 'md',
  customSize,
  style,
}) => {
  const { colors } = useTheme();

  const avatarSize = customSize || SIZE_MAP[size];

  const initial =
    name?.charAt(0)?.toUpperCase() ||
    email?.charAt(0)?.toUpperCase() ||
    'U';

  return (
    <View
      style={[
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          }}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={{
            color: '#fff',
            fontSize: avatarSize / 2.5,
            fontWeight: '700',
          }}
        >
          {initial}
        </Text>
      )}
    </View>
  );
};

export default Avatar;
