import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/ui/Header';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Toast from 'react-native-toast-message';
import http from '../services/http.api';
import Loader from '../components/ui/Loader';
import SearchInput from '../components/ui/SearchInput';
import AddEmployeeForm from '../components/AddEmployeeForm';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AppStackParamList } from '../navigation/AppStackNavigator';




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

interface AddEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  role: 'employee';
}

const EmployeeListScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>()

  const canAddEmployee = user?.role === 'hr' || user?.role === 'admin';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    fetchEmployees(1, true);
  }, [debouncedSearchQuery]);

  const fetchEmployees = async (page: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await http.get('/api/employees', {
        params: {
          page,
          limit: 20,
          ...(debouncedSearchQuery ? { search: debouncedSearchQuery } : {}),
        },
      });

      const fetchedEmployees = response?.data?.employees || [];
      const pagination = response?.data?.pagination || {};

      const employeeMembers = fetchedEmployees.filter((member: Employee) =>
        member.role.toLowerCase() === 'employee'
      );

      setEmployees(prev =>
        reset ? employeeMembers : [...prev, ...employeeMembers]
      );

      setCurrentPage(pagination?.page || 1);
      setTotalPages(pagination?.totalPages || 1);
      setTotalItems(pagination?.total || employeeMembers.length);
      setHasNextPage((pagination?.page || 1) < (pagination?.totalPages || 1));

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Employees',
        text2: error.response?.data?.message || 'Unable to fetch employees',
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchEmployees(1, true);
  }, [debouncedSearchQuery]);

  const handleLoadMore = () => {
    if (hasNextPage && !isLoadingMore && !isLoading) {
      fetchEmployees(currentPage + 1, false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleAddEmployee = async (formData: AddEmployeeData) => {
    try {
      setIsAddingEmployee(true);
      await http.post('/api/organization/team', formData);
      Toast.show({
        type: 'success',
        text1: 'Employee Added',
        text2: `${formData.firstName} ${formData.lastName} has been added`,
      });
      setIsModalVisible(false);
      handleRefresh();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Add Employee',
        text2: error.response?.data?.message || 'Unable to add employee',
      });
      throw error;
    } finally {
      setIsAddingEmployee(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewEmployee = (id: string) => {
  navigation.navigate('EmployeeDetails' , { employeeId: id });
};

  // ─── REDESIGNED EMPLOYEE CARD ─────────────────────────────────────────────
  const renderEmployeeCard = ({ item }: { item: Employee }) => {
    const fullName = `${item.firstName} ${item.lastName}`.trim();
    const imageUrl = item.profileImage;
    const isCurrentUser = item.email === user?.email;

    return (
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          marginHorizontal: 16,
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
        {/* Top Row: Avatar + Info + Status Badge */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          {/* Avatar with active ring */}
          <View style={{ position: 'relative' }}>
            <View
              style={{
               
                borderRadius: 50,
                overflow: 'hidden',
                backgroundColor: colors.primary + '15',
                borderWidth: item.isActive ? 2 : 0,
                borderColor: item.isActive ? '#22C55E' : 'transparent',
              }}
            >
              <Avatar name={fullName} imageUrl={imageUrl} size="lg" />
            </View>
            {/* Tiny online dot */}
            {item.isActive && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#22C55E',
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                }}
              />
            )}
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

          {/* Status Badge (top-right) */}
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 20,
              backgroundColor: item.isEmailVerified ? '#DCFCE7' : '#FEF3C7',
              borderWidth: 1,
              borderColor: item.isEmailVerified ? '#86EFAC' : '#FCD34D',
              alignSelf: 'flex-start',
            }}
          >
            <Text
              style={{
                fontFamily: 'Rubik-Medium',
                fontSize: 10,
                color: item.isEmailVerified ? '#15803D' : '#92400E',
                letterSpacing: 0.4,
              }}
            >
              {item.isEmailVerified ? '✓ VERIFIED' : '⏳ PENDING'}
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

        {/* Bottom Row: Meta info + View button (verified only) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left meta: Active status + Joined date */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {/* Active pill */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: item.isActive ? '#F0FDF4' : '#F8FAFC',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: item.isActive ? '#BBF7D0' : '#E2E8F0',
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: item.isActive ? '#22C55E' : '#CBD5E1',
                  marginRight: 5,
                }}
              />
              <Text
                style={{
                  fontFamily: 'Rubik-Medium',
                  fontSize: 11,
                  color: item.isActive ? '#15803D' : '#94A3B8',
                }}
              >
                {item.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>

            {/* Joined date */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="calendar" size={11} color="#94A3B8" />
              <Text
                style={{
                  fontFamily: 'Rubik-Regular',
                  fontSize: 11,
                  color: '#94A3B8',
                  marginLeft: 4,
                }}
              >
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>

          {/* View button — only for verified employees */}
          {item.isEmailVerified && (
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
  // ─────────────────────────────────────────────────────────────────────────

  const renderHeader = () => (
    <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
      <SearchInput
        value={searchQuery}
        placeholder="Search employees..."
        onChangeText={handleSearchChange}
        onSearch={() => setDebouncedSearchQuery(searchQuery)}
        onClear={clearSearch}
      />
      {totalItems > 0 && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 16,
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              fontFamily: 'Rubik-Regular',
              fontSize: 13,
              color: '#94A3B8',
              letterSpacing: 0.2,
            }}
          >
            {totalItems} employee{totalItems !== 1 ? 's' : ''}
          </Text>
          {canAddEmployee && (
            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.primary + '12',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.primary + '40',
              }}
            >
              <Feather name="user-plus" size={14} color={colors.primary} />
              <Text
                style={{
                  fontFamily: 'Rubik-Medium',
                  fontSize: 13,
                  color: colors.primary,
                  marginLeft: 6,
                }}
              >
                Add Employee
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 64,
          paddingHorizontal: 32,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            backgroundColor: '#F1F5F9',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Feather name="users" size={36} color="#CBD5E1" />
        </View>
        <Text
          style={{
            fontFamily: 'Rubik-Bold',
            fontSize: 18,
            color: '#0F172A',
            textAlign: 'center',
          }}
        >
          {searchQuery ? 'No employees found' : 'No employees yet'}
        </Text>
        <Text
          style={{
            fontFamily: 'Rubik-Regular',
            fontSize: 14,
            color: '#94A3B8',
            textAlign: 'center',
            marginTop: 8,
            lineHeight: 20,
          }}
        >
          {searchQuery
            ? `No employees matching "${searchQuery}"`
            : 'Add your first employee to get started'}
        </Text>
        {!searchQuery && canAddEmployee && (
          <Button
            title="Add Employee"
            
            onPress={() => setIsModalVisible(true)}
          />
        )}
      </View>
    );
  };

  if (isLoading && employees.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <Header title="Employees" />
        <Loader fullScreen />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <Header title="Employees" />

      <FlatList
        data={employees}
        renderItem={renderEmployeeCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 100, // extra space so FAB doesn't overlap last card
        }}
      />

      {/* ── Floating Action Button (static, bottom-right) ───────────────────── */}
      {canAddEmployee && (
        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          style={{
            position: 'absolute',
            bottom: 28,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 18,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.primary,
            shadowOpacity: 0.45,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }}
        >
          <Feather name="user-plus" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      {/* ────────────────────────────────────────────────────────────────────── */}

      {canAddEmployee && (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
              activeOpacity={1}
              onPress={() => setIsModalVisible(false)}
            >
              <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    shadowColor: '#000',
                    shadowOpacity: 0.12,
                    shadowRadius: 24,
                    shadowOffset: { width: 0, height: -6 },
                    elevation: 12,
                  }}
                >
                  {/* Modal handle bar */}
                  <View style={{ alignItems: 'center', paddingTop: 12 }}>
                    <View
                      style={{
                        width: 36,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: '#E2E8F0',
                      }}
                    />
                  </View>

                  {/* Modal header */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingHorizontal: 24,
                      paddingTop: 16,
                      paddingBottom: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F1F5F9',
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontFamily: 'Rubik-Bold',
                          fontSize: 20,
                          color: '#0F172A',
                          letterSpacing: -0.3,
                        }}
                      >
                        Add Employee
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'Rubik-Regular',
                          fontSize: 12,
                          color: '#94A3B8',
                          marginTop: 2,
                        }}
                      >
                        Invite a new team member
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setIsModalVisible(false)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        backgroundColor: '#F1F5F9',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Feather name="x" size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <AddEmployeeForm
                    onSubmit={handleAddEmployee}
                    onCancel={() => setIsModalVisible(false)}
                    isLoading={isAddingEmployee}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  );
};

export default EmployeeListScreen;