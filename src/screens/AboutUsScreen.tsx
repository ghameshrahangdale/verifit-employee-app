import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/ui/Header';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import aboutConfig from '../config/about.config';

const AboutUsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const [photoURL] = useState(user?.photoURL || '');

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header with avatar (same logic everywhere) */}
      <Header
        title="About Us"
        avatarImageUrl={photoURL || undefined}
      />

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* About Card */}
        <View className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <Text className="text-lg font-rubik-bold text-gray-900 mb-3">
            About {aboutConfig.brandName}
          </Text>

          <Text className="text-sm font-rubik text-gray-600 leading-6">
            {aboutConfig.description}
          </Text>
        </View>

        {/* Features Card */}
        <View className="bg-white rounded-2xl p-5 shadow-sm">
          <Text className="text-base font-rubik-bold text-gray-900 mb-4">
            Features Overview
          </Text>

          {aboutConfig.features.map((feature, index) => (
            <FeatureRow
              key={index}
              title={feature}
              color={colors.primary}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

interface FeatureRowProps {
  title: string;
  color: string;
}

const FeatureRow: React.FC<FeatureRowProps> = ({ title, color }) => (
  <View className="flex-row items-start py-3 border-b border-gray-200 last:border-b-0">
    <View
      className="w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5"
      style={{ backgroundColor: color + '15' }}
    >
      <Feather name="check" size={14} color={color} />
    </View>

    <Text className="flex-1 text-sm font-rubik text-gray-700">
      {title}
    </Text>
  </View>
);

export default AboutUsScreen;
