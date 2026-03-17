import React from 'react';
import { View, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import Logo from '../common/Logo';
import { Images } from '../../config/logo.config';

const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 8,
};

export const toastConfig = {
  success: ({ text1, text2 }: any) => (
    <View
      style={[shadow]}
      className="w-[90%] bg-white rounded-xl px-3 py-2 flex-row items-center"
    >
      <Logo source={Images.logo_icon} size="sm" />
      <View className=" flex-1">
        <Text className="text-green-600 font-rubik-semibold text-sm">
          {text1}
        </Text>
        {text2 ? (
          <Text className="text-gray-600 font-rubik text-xs mt-0.5" numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),

  error: ({ text1, text2 }: any) => (
    <View
      style={[shadow]}
      className="w-[90%] bg-white rounded-xl px-3 py-2 flex-row items-center"
    >
      <Logo size="sm" />
      <View className="ml-2 flex-1">
        <Text className="text-red-600 font-rubik-semibold text-sm">
          {text1}
        </Text>
        {text2 ? (
          <Text className="text-gray-600 font-rubik text-xs mt-0.5" numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),

  info: ({ text1, text2 }: any) => (
    <View
      style={[shadow]}
      className="w-[90%] bg-white rounded-xl px-3 py-2 flex-row items-center"
    >
      <Logo size="sm" />
      <View className="ml-2 flex-1">
        <Text className="text-blue-600 font-rubik-semibold text-sm">
          {text1}
        </Text>
        {text2 ? (
          <Text className="text-gray-600 font-rubik text-xs mt-0.5" numberOfLines={2}>
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),
};