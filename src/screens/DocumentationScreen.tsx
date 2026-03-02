import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Linking } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/ui/Header';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import legalConfig from '../config/legal.config';
import Button from '../components/ui/Button';

const DocumentationScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useSelector((state: RootState) => state.auth);
  const [photoURL] = useState(user?.photoURL || '');

  const handleOpenDocs = async () => {
    if (!legalConfig.documentation.link) return;
    try {
      await Linking.openURL(legalConfig.documentation.link);
    } catch {
      Alert.alert('Error', 'Unable to open documentation link');
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Documentation" avatarImageUrl={photoURL || undefined} />

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="bg-white rounded-2xl p-5 shadow-sm">
          <Text className="text-base font-rubik-bold text-gray-900 mb-4">
            {legalConfig.documentation.title}
          </Text>
          <Text className="text-sm font-rubik text-gray-500 mb-6">
            {legalConfig.documentation.description}
          </Text>

          {legalConfig.documentation.link && (
            <Button
              title={legalConfig.documentation.buttonText || 'Open Docs'}
              onPress={handleOpenDocs}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default DocumentationScreen;
