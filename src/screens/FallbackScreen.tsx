// screens/FallbackScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const FallbackScreen = ({ route }: any) => {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Feather name="alert-circle" size={48} color="#EF4444" />

      <Text className="mt-4 text-lg font-rubik-medium font-semibold text-gray-900">
        Screen not found
      </Text>

      <Text className="mt-2 text-sm font-rubik text-gray-500 text-center">
        No component linked for tab:{' '}
        <Text className="font-rubik-medium font-rubik-semibold text-gray-700">
          {route?.name}
        </Text>
      </Text>
    </View>
  );
};

export default FallbackScreen;
