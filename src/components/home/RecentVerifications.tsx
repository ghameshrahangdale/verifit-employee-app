import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, FlatList } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Feather from 'react-native-vector-icons/Feather';
import Avatar from '../ui/Avatar';
import http from '../../services/http.api';
import Loader from '../ui/Loader';

interface Employee {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  profileImage?: string;
}

const RecentVerifications: React.FC = () => {
  const { colors } = useTheme();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await http.get('/api/employees', {
        params: {
          page: 1,
          limit: 5, // Get only recent 5 employees
        },
      });
      const fetchedEmployees = response?.data?.employees || [];
      setEmployees(fetchedEmployees);
    } catch (error: any) {
      console.error('Failed to load employees:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchEmployees();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusConfig = (isEmailVerified: boolean) => {
    return isEmailVerified
      ? {
          bg: '#22C55E15',
          text: '#16A34A',
          dot: '#22C55E',
          icon: 'check-circle',
          status: 'Verified',
        }
      : {
          bg: '#F9731615',
          text: '#EA6D10',
          dot: '#F97316',
          icon: 'clock',
          status: 'Pending',
        };
  };

  const renderEmployeeCard = ({ item }: { item: Employee }) => {
    const fullName = `${item.firstName} ${item.lastName}`.trim();
    const imageUrl = item.profileImage;
    const statusConfig = getStatusConfig(item.isEmailVerified);
    const department = item.role === 'hr' ? 'HR' : item.role === 'admin' ? 'Admin' : 'Employee';

    return (
      <View
        className="bg-white rounded-2xl mb-3 overflow-hidden"
        style={{
          
          borderColor: '#F1F5F9',
          borderWidth: 1,
        }}
      >
        <View className="px-4 py-4">
          {/* Main row */}
          <View className="flex-row items-center">
            <Avatar imageUrl={imageUrl} size="lg" name={fullName} />

            <View className="ml-3 flex-1">
              <Text
                className="text-base font-rubik-bold text-gray-900"
                numberOfLines={1}
              >
                {fullName}
              </Text>
              <Text className="text-xs text-gray-400 mt-0.5 font-rubik" numberOfLines={1}>
                {item.email}
              </Text>
            </View>

            {/* Status badge */}
            <View
              className="flex-row items-center px-2.5 py-1 rounded-full"
              style={{ backgroundColor: statusConfig.bg }}
            >
              <View
                className="w-1.5 h-1.5 rounded-full mr-1.5"
                style={{ backgroundColor: statusConfig.dot }}
              />
              <Text
                className="text-xs font-rubik-medium"
                style={{ color: statusConfig.text }}
              >
                {statusConfig.status}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View className="h-px bg-gray-100 mt-3 mb-3" />

          {/* Meta row */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className="px-2 py-0.5 rounded-md mr-2"
                style={{ backgroundColor: colors.primary + '10' }}
              >
                <Text
                  className="text-xs font-rubik-medium"
                  style={{ color: colors.primary }}
                >
                  {department}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <Feather name="calendar" size={11} color="#9CA3AF" />
              <Text className="text-xs text-gray-400 font-rubik ml-1">
                Joined {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading && employees.length === 0) {
    return (
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-rubik-bold" style={{ color: colors.text }}>
            Employees List
          </Text>
        </View>
        <View style={{ paddingVertical: 40 }}>
          <Loader />
        </View>
      </View>
    );
  }

  return (
    <View className="mb-6">
      {/* Section header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-rubik-bold" style={{ color: colors.text }}>
          Employees List
        </Text>
        <TouchableOpacity className="flex-row items-center" activeOpacity={0.7}>
          <Text className="text-xs font-rubik" style={{ color: colors.primary }}>
            View All
          </Text>
          <Feather name="chevron-right" size={14} color={colors.primary} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={employees}
        renderItem={renderEmployeeCard}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        ListEmptyComponent={
          <View className="bg-white rounded-2xl p-8 items-center justify-center">
            <Feather name="users" size={40} color="#CBD5E1" />
            <Text className="text-gray-400 font-rubik mt-2 text-center">
              No employees found
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default RecentVerifications;