import React from 'react';
import { View, Text, Image, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

interface AvatarProps {
  name?: string;
  email?: string;
  imageUrl?: string;
  size?: AvatarSize;
  customSize?: number;
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

const Avatar: React.FC<AvatarProps> = ({
  name,
  email,
  imageUrl,
  size = 'md',
  customSize,
  style,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const avatarSize = customSize || SIZE_MAP[size];

  // Priority: props > auth user
  const firstName = name
    ? name.split(' ')[0]
    : user?.firstName || '';

  const lastName = name
    ? name.split(' ')[1] || ''
    : user?.lastName || '';

  const userEmail = email || user?.email || '';
  const profileImage = imageUrl || user?.profileImage;

  console.log(user);

  // Generate initials
  let initials = 'U';

  if (firstName || lastName) {
    initials =
      (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  } else if (userEmail) {
    initials = userEmail.charAt(0).toUpperCase();
  }

  return (
    <View
      style={[
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          
        },
        style,
      ]}
      className="items-center justify-center overflow-hidden bg-gray-200"
    >
      {profileImage ? (
        <Image
          source={{ uri: profileImage }}
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
            fontSize: avatarSize / 2.5,
          }}
          className="font-rubik-medium text-gray-600"
        >
          {initials}
        </Text>
      )}
    </View>
  );
};

export default Avatar;