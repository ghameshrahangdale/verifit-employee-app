import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, FlatList } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Feather from 'react-native-vector-icons/Feather';
import Avatar from '../ui/Avatar';
import http from '../../services/http.api';
import Loader from '../ui/Loader';
import { useAuth } from '../../context/AuthContext';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/AppStackNavigator';

interface Employee {
  verificationStatus: any;
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
  const {user} = useAuth();
  const { colors } = useTheme();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp<AppStackParamList>>()

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

   const handleViewEmployee = (id: string) => {
    navigation.navigate('EmployeeDetails', { employeeId: id });
  };


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
      const isCurrentUser = item.email === user?.email;
  
      return (
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            marginBottom: 12,
            padding: 16,
            shadowColor: '#64748B',
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
            borderWidth: 1,
            borderColor: '#F1F5F9',
          }}
        >
          {/* Top Row: Avatar + Info + Verification Status Badge */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {/* Avatar */}
            <View style={{ position: 'relative' }}>
              <View
                style={{
                  borderRadius: 50,
                  overflow: 'hidden',
                  backgroundColor: colors.primary + '15',
                }}
              >
                <Avatar name={fullName} imageUrl={imageUrl} size="lg" />
              </View>
            </View>
  
            {/* Name, Email */}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                <Text
                  style={{
                    fontFamily: 'Rubik-Bold',
                    fontSize: 15,
                    color: '#0F172A',
                    letterSpacing: -0.2,
                  }}
                >
                  {fullName}
                </Text>
                {isCurrentUser && (
                  <View
                    style={{
                      marginLeft: 6,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      backgroundColor: colors.primary + '18',
                      borderRadius: 20,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Rubik-Medium',
                        fontSize: 10,
                        color: colors.primary,
                        letterSpacing: 0.3,
                      }}
                    >
                      YOU
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={{
                  fontFamily: 'Rubik-Regular',
                  fontSize: 12.5,
                  color: '#64748B',
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {item.email}
              </Text>
            </View>
  
            {/* Verification Status Badge (top-right) - Made smaller */}
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 12,
                backgroundColor: item.verificationStatus ? '#DCFCE7' : '#FEF3C7',
                borderWidth: 1,
                borderColor: item.verificationStatus ? '#86EFAC' : '#FCD34D',
                alignSelf: 'flex-start',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Rubik-Medium',
                  fontSize: 9,
                  color: item.verificationStatus ? '#15803D' : '#92400E',
                  letterSpacing: 0.3,
                }}
              >
                {item.verificationStatus ? 'VERIFIED' : 'NOT VERIFIED'}
              </Text>
            </View>
          </View>
  
          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: '#F1F5F9',
              marginVertical: 12,
            }}
          />
  
          {/* Bottom Row: Meta info + View button */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Left meta: Joined date with label */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="calendar" size={11} color="#94A3B8" />
              <Text
                style={{
                  fontFamily: 'Rubik-Regular',
                  fontSize: 11,
                  color: '#64748B',
                  marginLeft: 4,
                }}
              >
                Joined: {formatDate(item.createdAt)}
              </Text>
            </View>
  
            {/* View button — only for verified employees */}
            {item.verificationStatus && (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.primary,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 12,
                  shadowColor: colors.primary,
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 3,
                }}
                onPress={() => handleViewEmployee(item.id)}
              >
                <Text
                  style={{
                    fontFamily: 'Rubik-Medium',
                    fontSize: 12,
                    color: '#FFFFFF',
                    marginRight: 4,
                    letterSpacing: 0.2,
                  }}
                >
                  View
                </Text>
                <Feather name="arrow-right" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            )}
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