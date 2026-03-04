import React from 'react';
import { ScrollView, View } from 'react-native';

import DashboardStats from '../components/home/DashboardStats';
import RecentVerifications from '../components/home/RecentVerifications';
import HomeHeader from '../components/ui/HomeHeader';

const HomeScreen: React.FC = () => {

  // 🔥 Static User Config (Replace later with Redux/API)
  const USER = {
    displayName: 'Ghamesh Rahangdale',
    email: 'ghamesh@example.com',
    photoURL: 'https://i.pravatar.cc/150?img=12',
  };

  return (
    <View>
      <HomeHeader
        avatarImageUrl={USER.photoURL}
        avatarName={USER.displayName}
        avatarEmail={USER.email}
      />
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      <DashboardStats />
      <RecentVerifications />
    </ScrollView>
    </View>
  );
};

export default HomeScreen;