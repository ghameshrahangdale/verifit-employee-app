import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import Avatar from './Avatar';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  avatarName?: string;
  avatarEmail?: string;
  avatarImageUrl?: string;
  avatarSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | number;
  style?: StyleProp<ViewStyle>;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBack = true,
  avatarName,
  avatarEmail,
  avatarImageUrl,
  avatarSize = 'md',
  style,
}) => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  /**
   * ⚠️ TODO:
   * Currently using static USER config.
   * Replace this with Redux auth user once auth flow is fully integrated.
   */

  const USER = {
    displayName: 'Ghamesh Rahangdale',
    email: 'ghamesh@example.com',
    photoURL: 'https://i.pravatar.cc/150?img=12',
  };

  const handleAvatarPress = () => {
    navigation.navigate('Tabs', {
      screen: 'Account',
    });
  };

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: '#fff',
          justifyContent: 'space-between',
          elevation: 2,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        },
        style,
      ]}
    >
      {/* Left Section */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {showBack && (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
        )}

        <Text
          style={{
            marginLeft: showBack ? 12 : 0,
            fontSize: 18,
            fontFamily: 'Rubik-Medium',
            color: colors.text,
          }}
        >
          {title}
        </Text>
      </View>

      {/* Right Avatar Section */}
      <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7}>
        <Avatar
          
          size={avatarSize as any}
        />
      </TouchableOpacity>
    </View>
  );
};

export default Header;