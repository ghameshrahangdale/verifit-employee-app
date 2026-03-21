import React from 'react';
import { View, Text, Image, StyleProp, ViewStyle } from 'react-native';
import { useAuth } from '../../context/AuthContext';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
type RoundedType = 'full' | 'corners';

interface AvatarProps {
  name?: string;
  email?: string;
  imageUrl?: string;
  size?: AvatarSize;
  customSize?: number;
  rounded?: RoundedType;
  style?: StyleProp<ViewStyle>;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
  '2xl': 96,
  '3xl': 120,
};

const ROUNDED_MAP: Record<RoundedType, number> = {
  full: 9999,
  corners: 12,
};

const Avatar: React.FC<AvatarProps> = ({
  name,
  email,
  imageUrl,
  size = 'md',
  customSize,
  rounded = 'full',
  style,
}) => {
  const { user } = useAuth();

  const avatarSize = customSize || SIZE_MAP[size];
  const borderRadius = ROUNDED_MAP[rounded];

  // Determine if avatar is used for logged-in user
  const isUsingAuthUser = !name && !email && !imageUrl;

  const finalName = isUsingAuthUser
    ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
    : name || '';

  const finalEmail = isUsingAuthUser ? user?.email || '' : email || '';

  const finalImage = isUsingAuthUser
    ? user?.profileImage
    : imageUrl;

  const firstName = finalName.split(' ')[0] || '';
  const lastName = finalName.split(' ')[1] || '';

  let initials = 'U';

  if (firstName || lastName) {
    initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  } else if (finalEmail) {
    initials = finalEmail.charAt(0).toUpperCase();
  }

  return (
    <View
      style={[
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: borderRadius,
        },
        style,
      ]}
      className="items-center justify-center overflow-hidden bg-gray-200"
    >
      {finalImage ? (
        <Image
          source={{ uri: finalImage }}
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: borderRadius,
          }}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={{ fontSize: avatarSize / 2.5 }}
          className="font-rubik-medium text-gray-600"
        >
          {initials}
        </Text>
      )}
    </View>
  );
};

export default Avatar;