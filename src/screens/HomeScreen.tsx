import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';

import { RootState } from '../store/store';
import { useTheme } from '../context/ThemeContext';
import HomeHeader from '../components/ui/HomeHeader';

import { QUICK_ACTIONS } from '../config/home.quickActions';
import { FEATURES } from '../config/home.features';

const HomeScreen: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  const firstName = useMemo(
    () => user?.displayName?.split(' ')[0],
    [user?.displayName]
  );

  const surface = '#FFFFFF';
  const textSecondary = '#6B7280';

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Header */}
      <HomeHeader
        avatarImageUrl={user?.photoURL || undefined}
        avatarName={user?.displayName || undefined}
        avatarEmail={user?.email || undefined}
      />

      <View className="px-6 mt-6">
        {/* Greeting */}
        <View className="mb-6">
          <Text
            className="text-2xl font-rubik-bold"
            style={{ color: colors.text }}
          >
            Hello{firstName ? `, ${firstName}` : ''} 👋
          </Text>
          <Text
            className="mt-1 font-rubik"
            style={{ color: textSecondary }}
          >
            Manage your account and explore features
          </Text>
        </View>

        {/* Primary Card */}
        <View
          className="rounded-3xl p-6 mb-8"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white text-lg font-rubik-bold mb-2">
            Your account is active
          </Text>
          <Text className="text-white/90 font-rubik leading-relaxed mb-5">
            Access all features, manage your profile, and customize your
            experience from one place.
          </Text>

          <TouchableOpacity
            className="self-start px-5 py-2.5 rounded-full"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <Text
              className="font-rubik-bold"
              style={{ color: colors.primary }}
            >
              Get Started →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View className="mb-8">
          <Text
            className="text-lg font-rubik-bold mb-4"
            style={{ color: colors.text }}
          >
            Quick Actions
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 4,
              paddingBottom: 12,
            }}
            style={{ overflow: 'visible' }}
          >
            {QUICK_ACTIONS.map((item, index) => {
              const Card = item.route ? TouchableOpacity : View;

              return (
                <Card
                  key={index}
                  onPress={() =>
                    item.route && navigation.navigate(item.route)
                  }
                  activeOpacity={0.85}
                  className="mr-4 rounded-2xl p-5 w-64"
                  style={{
                    backgroundColor: surface,
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: colors.primary + '15' }}
                  >
                    <Feather
                      name={item.icon as any}
                      size={20}
                      color={colors.primary}
                    />
                  </View>

                  <Text
                    className="font-rubik-bold mb-1"
                    style={{ color: colors.text }}
                  >
                    {item.title}
                  </Text>

                  <Text
                    className="text-sm font-rubik"
                    style={{ color: textSecondary }}
                  >
                    {item.subtitle}
                  </Text>
                </Card>
              );
            })}
          </ScrollView>
        </View>

        {/* Features */}
        <View className="mb-8">
          <Text
            className="text-lg font-rubik-bold mb-4"
            style={{ color: colors.text }}
          >
            Features
          </Text>

          <View className="flex-row flex-wrap justify-between">
            {FEATURES.map((item, index) => {
              const Card = item.route ? TouchableOpacity : View;

              return (
                <Card
                  key={index}
                  onPress={() =>
                    item.route && navigation.navigate(item.route)
                  }
                  activeOpacity={0.85}
                  className="w-[48%] rounded-2xl p-5 mb-4"
                  style={{
                    backgroundColor: surface,
                    elevation: 2,
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: colors.primary + '15' }}
                  >
                    <Feather
                      name={item.icon as any}
                      size={20}
                      color={colors.primary}
                    />
                  </View>

                  <Text
                    className="font-rubik-bold"
                    style={{ color: colors.text }}
                  >
                    {item.title}
                  </Text>

                  <Text
                    className="text-sm mt-1 font-rubik leading-relaxed"
                    style={{ color: textSecondary }}
                  >
                    {item.description}
                  </Text>
                </Card>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
