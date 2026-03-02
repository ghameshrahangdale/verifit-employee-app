import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/ui/Header';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import {
  getVersion,
  getApplicationName,
  getBundleId,
} from 'react-native-device-info';
import { useNavigation } from '@react-navigation/native';

const AppInfoScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const [photoURL] = useState(user?.photoURL || '');
  const navigation = useNavigation<any>(); // type loosely for simplicity

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="App Info" avatarImageUrl={photoURL || undefined} />

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Legal Information first */}
        <View className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <Text className="text-base font-rubik-bold text-gray-900 mb-4">
            App & Legal
          </Text>

          <LegalRow
            icon="shield"
            title="Privacy Policy"
            description="Learn how we protect your data"
            color={colors.primary}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />

          <LegalRow
            icon="book"
            title="Terms & Conditions"
            description="Review our terms of service"
            color={colors.primary}
            onPress={() => navigation.navigate('Terms')}
          />

          <LegalRow
            icon="file-text"
            title="Documentation"
            description="Explore guides and setup instructions"
            color={colors.primary}
            onPress={() => navigation.navigate('Documentation')}
          />
        </View>

        {/* Application Info after legal */}
        <View className="bg-white rounded-2xl p-5 shadow-sm">
          <Text className="text-base font-rubik-bold text-gray-900 mb-4">
            Application Information
          </Text>

          <InfoRow label="App Name" value={getApplicationName()} />
          <InfoRow label="Version" value={getVersion()} />
          <InfoRow label="Package Name" value={getBundleId()} />
        </View>
      </ScrollView>
    </View>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row py-3 border-b border-gray-200 last:border-b-0">
    <Text className="text-gray-500 font-rubik flex-1">{label}</Text>
    <Text className="font-rubik-medium text-gray-800">{value}</Text>
  </View>
);

const LegalRow = ({
  icon,
  title,
  description,
  color,
  onPress,
}: {
  icon: string;
  title: string;
  description: string;
  color: string;
  onPress?: () => void;
}) => {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row py-4 border-b border-gray-200 last:border-b-0"
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: color + '15' }}
      >
        <Feather name={icon as any} size={20} color={color} />
      </View>

      <View className="flex-1">
        <Text className="font-rubik-medium text-gray-900">{title}</Text>
        <Text className="text-sm font-rubik text-gray-500 mt-0.5">
          {description}
        </Text>
      </View>
    </Wrapper>
  );
};

export default AppInfoScreen;
