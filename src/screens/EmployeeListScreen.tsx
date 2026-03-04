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
  profileImage: string;
}

const EmployeeListScreen: React.FC = () => {
  const { colors } = useTheme();

  // ✅ Realistic Employee Data
  const EMPLOYEE_DATA: Employee[] = [
    {
      id: 1,
      name: 'Amit Sharma',
      joiningDate: '12 Feb 2022',
      designation: 'Senior Software Engineer',
      profileImage: 'https://i.pravatar.cc/150?img=12',
    },
    {
      id: 2,
      name: 'Priya Verma',
      joiningDate: '05 Jan 2023',
      designation: 'HR Manager',
      profileImage: 'https://i.pravatar.cc/150?img=5',
    },
    {
      id: 3,
      name: 'Rahul Deshmukh',
      joiningDate: '18 Mar 2021',
      designation: 'Product Manager',
      profileImage: 'https://i.pravatar.cc/150?img=12',
    },
    {
      id: 4,
      name: 'Sneha Kulkarni',
      joiningDate: '27 Jul 2020',
      designation: 'UI/UX Designer',
      profileImage: 'https://i.pravatar.cc/150?img=32',
    },
    {
      id: 5,
      name: 'Rohan Mehta',
      joiningDate: '09 Nov 2019',
      designation: 'Backend Developer',
      profileImage: 'https://i.pravatar.cc/150?img=15',
    },
    {
      id: 6,
      name: 'Neha Patil',
      joiningDate: '14 Aug 2023',
      designation: 'QA Engineer',
      profileImage: 'https://i.pravatar.cc/150?img=20',
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
      className="bg-white rounded-2xl p-5"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        borderColor: colors.primary + '30',
        borderWidth: 1,
      }}
    >
      {/* Top Row */}
      <View className="flex-row items-center">
        <Avatar imageUrl={item.profileImage} size="lg" />

        <View className="ml-4 flex-1">
          <Text className="text-base font-rubik-bold text-gray-900">
            {item.name}
          </Text>

          <Text className="text-sm text-gray-500 mt-1 font-rubik">
            {item.designation}
          </Text>
        </View>

       
      </View>

      {/* Details */}
      <View className="mt-4">
        <Text className="text-xs text-gray-400 font-rubik">
          Joined: {item.joiningDate}
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
          
        </TouchableOpacity>
        
        <TouchableOpacity
          className="px-4 py-2 rounded-lg flex-row items-center"
          style={{ backgroundColor: '#D9770620' }}
          activeOpacity={0.7}
        >
          <Feather name="edit-2" size={16} color="#D97706" />
          
        </TouchableOpacity>

        <TouchableOpacity
          className="px-4 py-2 rounded-lg flex-row items-center"
          style={{ backgroundColor: '#DC262620' }}
          activeOpacity={0.7}
        >
          <Feather name="trash-2" size={16} color="#DC2626" />
          
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Employees" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Section with Action Buttons */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center space-x-3">
            <View className="flex-1 relative">
              <Input
                placeholder="Search employee..."
                value={search}
                onChangeText={setSearch}
                className="pr-12"
              />
              <View className="absolute right-4 top-4">
                <Feather name="search" size={18} color={colors.primary} />
              </View>
            </View>
          </View>
          
          {/* Filter, Export & Import Buttons */}
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

export default EmployeeListScreen;