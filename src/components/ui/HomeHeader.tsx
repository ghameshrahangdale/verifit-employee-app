import React from 'react';
import {
  View,
  Text,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import Avatar from './Avatar';
import Logo from '../common/Logo';
import { name as clientName } from '../../../app.json';

interface HomeHeaderProps {
  avatarImageUrl?: string;
  avatarName?: string;
  avatarEmail?: string;
  avatarSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | number;
  style?: StyleProp<ViewStyle>;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  avatarImageUrl,
  avatarName,
  avatarEmail,
  avatarSize = 'md',
  style,
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

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
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#fff',
          elevation: 1,
        },
        style,
      ]}
    >
      {/* Left: Logo + App Name */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Logo size="md" />
        <Text
          style={{
            marginLeft: 8,
            fontSize: 16, // ✅ match Header title size
            fontFamily: 'Rubik-Medium',
            color: colors.text,
          }}
        >
          {clientName}
        </Text>
      </View>

      {/* Right: Avatar */}
      {(avatarName || avatarEmail || avatarImageUrl) && (
        <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7}>
          <Avatar
            name={avatarName}
            email={avatarEmail}
            imageUrl={avatarImageUrl || undefined}
            size={avatarSize as any} // md by default → same height
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default HomeHeader;
