import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/ui/Header';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import legalConfig from '../config/legal.config';
import Feather from 'react-native-vector-icons/Feather';

const PrivacyPolicyScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const [photoURL] = useState(user?.photoURL || '');

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Privacy Policy" avatarImageUrl={photoURL || undefined} />

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="bg-white rounded-2xl p-5 shadow-sm">
          <Text className="text-base font-rubik-bold text-gray-900 mb-4">
            {legalConfig.privacyPolicy.title}
          </Text>
          <Text className="text-sm font-rubik text-gray-500">
            {legalConfig.privacyPolicy.description}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default PrivacyPolicyScreen;
