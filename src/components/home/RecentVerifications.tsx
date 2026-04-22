import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Feather from 'react-native-vector-icons/Feather';
import EmployeeList from '../employee/EmployeeList';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/AppStackNavigator';

const RecentVerifications: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  const customHeader = (
    <View className="flex-row items-center justify-between mb-4">
      <Text className="text-lg font-rubik-bold" style={{ color: colors.text }}>
        Employees List
      </Text>
      <TouchableOpacity 
        className="flex-row items-center" 
        activeOpacity={0.7}
        // onPress={() => navigation.navigate('EmployeeList')}
      >
        <Text className="text-xs font-rubik" style={{ color: colors.primary }}>
          View All
        </Text>
        <Feather name="chevron-right" size={14} color={colors.primary} style={{ marginLeft: 2 }} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="mb-6">
      <EmployeeList 
        viewType="recent"
        limit={5}
        showHeader={false}
        showSearch={false}
        enablePullToRefresh={true}
        customHeaderComponent={customHeader}
      />
    </View>
  );
};

export default RecentVerifications;