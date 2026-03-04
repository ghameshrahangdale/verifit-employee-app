import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/ui/Header';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';

interface Employee {
  id: number;
  name: string;
  joiningDate: string;
  designation: string;
  image: string;
  verifiedDate: string;
}

const VerifiedEmployeeListScreen: React.FC = () => {
  const { colors } = useTheme();

  // 🔥 Realistic Static Data
  const EMPLOYEE_DATA: Employee[] = [
    {
      id: 1,
      name: 'Rahul Sharma',
      designation: 'Frontend Developer',
      joiningDate: '12 Feb 2023',
      verifiedDate: '15 Jan 2024',
      image: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    {
      id: 2,
      name: 'Priya Mehta',
      designation: 'HR Manager',
      joiningDate: '20 Mar 2022',
      verifiedDate: '10 Dec 2023',
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
      id: 3,
      name: 'Amit Verma',
      designation: 'Backend Engineer',
      joiningDate: '05 Jul 2021',
      verifiedDate: '05 Feb 2024',
      image: 'https://randomuser.me/api/portraits/men/75.jpg',
    },
    {
      id: 4,
      name: 'Sneha Kulkarni',
      designation: 'UI/UX Designer',
      joiningDate: '11 Aug 2023',
      verifiedDate: '20 Feb 2024',
      image: 'https://randomuser.me/api/portraits/women/68.jpg',
    },
  ];

  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    return EMPLOYEE_DATA.filter(emp =>
      emp.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const renderEmployeeCard = ({ item }: { item: Employee }) => (
    <View
      className="bg-white rounded-2xl p-5 "
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        borderColor: colors.primary+30,
        borderWidth:1,
      }}
    >
      {/* Top Row */}
      <View className="flex-row items-center">
        <Avatar imageUrl={item.image} size="lg" />

        <View className="ml-4 flex-1">
          <Text className="text-base font-rubik-bold text-gray-900">
            {item.name}
          </Text>

          <Text className="text-sm text-gray-500 mt-1 font-rubik">
            {item.designation}
          </Text>
        </View>

        {/* ✅ Verified Badge - Green */}
        <View
          className="px-3 py-1 rounded-lg flex-row items-center"
          style={{ backgroundColor: '#22C55E20' }}
        >
          <Feather name="check-circle" size={14} color="#22C55E" />
          <Text className="text-xs ml-1 font-rubik text-green-600">
            Verified
          </Text>
        </View>
      </View>

      {/* Details */}
      <View className="mt-4">
        <Text className="text-xs text-gray-400 font-rubik">
          Joined: {item.joiningDate}
        </Text>
        <Text className="text-xs text-gray-400 font-rubik mt-1">
        Verified On: {item.verifiedDate}
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="flex-row justify-end mt-4 gap-3">
        <TouchableOpacity
          className="px-4 py-2 rounded-lg flex-row items-center"
          style={{ backgroundColor: colors.primary + '15' }}
          activeOpacity={0.7}
        >
          <Feather name="eye" size={16} color={colors.primary} />
          <Text className="ml-2 text-sm font-rubik" style={{ color: colors.primary }}>
            View
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="px-4 py-2 rounded-lg flex-row items-center"
          style={{ backgroundColor: colors.primary + '15' }}
          activeOpacity={0.7}
        >
          <Feather name="download" size={16} color={colors.primary} />
          <Text className="ml-2 text-sm font-rubik" style={{ color: colors.primary }}>
            Download
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Verified Employees" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Section with Action Buttons */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center space-x-3">
            <View className="flex-1 relative">
              <Input
                placeholder="Search verified employee..."
                value={search}
                onChangeText={setSearch}
                className="pr-12"
              />
              <View className="absolute right-4 top-4">
                <Feather name="search" size={18} color={colors.primary} />
              </View>
            </View>
            
            
          </View>
          
          {/* Import & Download Buttons */}
          <View className="flex-row justify-end mt-3 gap-3">
            <TouchableOpacity
              className="px-2 py-2 rounded-lg items-center justify-center"
              style={{ backgroundColor: colors.primary + '15' }}
              activeOpacity={0.7}
            >
              <Feather name="filter" size={16} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              className="px-4 py-2 rounded-lg flex-row items-center"
              style={{ backgroundColor: colors.primary + '15' }}
              activeOpacity={0.7}
            >
              <Feather name="download" size={16} color={colors.primary} />
              <Text className="ml-2 text-sm font-rubik" style={{ color: colors.primary }}>
                Export
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="px-4 py-2 rounded-lg flex-row items-center"
              style={{ backgroundColor: colors.primary + '15' }}
              activeOpacity={0.7}
            >
              <Feather name="upload" size={16} color={colors.primary} />
              <Text className="ml-2 text-sm font-rubik" style={{ color: colors.primary }}>
                Import
              </Text>
            </TouchableOpacity>


          </View>
        </View>

        {/* Employee Cards Container */}
        <View className="px-4 mt-6">
          {filteredData.map((item) => (
            <View key={item.id} className="mb-4">
              {renderEmployeeCard({ item })}
            </View>
          ))}
        </View>

        <View className="h-10" />
      </ScrollView>
    </View>
  );
};

export default VerifiedEmployeeListScreen;