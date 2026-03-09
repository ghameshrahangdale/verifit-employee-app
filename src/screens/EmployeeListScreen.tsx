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

interface Employee {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  emailVerifyTokenExpiry: string | null;
  passwordResetTokenExpiry: string | null;
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

  // Check if current user can add employees (HR or Admin)
  const canAddEmployee = user?.role === 'hr' || user?.role === 'admin';

  // State for employees
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Fetch employees when search or pagination changes
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

      const response = await http.get('/api/organization/team', {
        params: {
          page,
          limit: 10,
          role: 'employee',
          ...(debouncedSearchQuery ? { search: debouncedSearchQuery } : {}),
        },
      });

      const members = response?.data?.members || [];
      const pagination = response?.data?.pagination || {};

      // Filter only employees (though API should already filter)
      const employeeMembers = members.filter((member: Employee) => 
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
      console.error('Error fetching employees:', error);
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

      const response = await http.post('/api/organization/team', formData);

      Toast.show({
        type: 'success',
        text1: 'Employee Added',
        text2: `${formData.firstName} ${formData.lastName} has been added`,
      });

      setIsModalVisible(false);
      handleRefresh();

    } catch (error: any) {
      console.error('Error adding employee:', error);
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

  const renderEmployeeCard = ({ item }: { item: Employee }) => {
    const fullName = `${item.firstName} ${item.lastName}`.trim();
    const isCurrentUser = item.email === user?.email;

    return (
      <View
        className="bg-white rounded-2xl p-5 mx-4 mb-3"
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          borderColor: colors.primary + '30',
          borderWidth: 1,
        }}
      >
        <View className="flex-row items-center">
          <Avatar name={fullName} size="lg" />

          <View className="flex-1 ml-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Text className="font-rubik-bold text-gray-900 text-base">
                  {fullName}
                </Text>
                {isCurrentUser && (
                  <View className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full">
                    <Text className="font-rubik text-xs text-gray-600">You</Text>
                  </View>
                )}
              </View>
              <View className="px-3 py-1 rounded-full ml-2 bg-green-100">
                <Text className="font-rubik-medium text-xs text-green-600">
                  EMPLOYEE
                </Text>
              </View>
            </View>

            <Text className="font-rubik text-gray-500 text-sm mt-1">
              {item.email}
            </Text>

            <View className="flex-row items-center mt-2 justify-between">
              <View className="flex-row items-center">
                <View
                  className={`w-2 h-2 rounded-full ${
                    item.isActive ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <Text className="font-rubik text-gray-400 text-xs ml-1">
                  {item.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>

              <View className="flex-row items-center">
                <Text className="font-rubik text-gray-400 text-xs">
                  Joined {formatDate(item.createdAt)}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row justify-end mt-3 gap-2">
              <TouchableOpacity
                className="px-3 py-2 rounded-lg flex-row items-center"
                style={{ backgroundColor: colors.primary + '15' }}
                activeOpacity={0.7}
              >
                <Feather name="eye" size={14} color={colors.primary} />
                <Text className="ml-1 text-xs font-rubik" style={{ color: colors.primary }}>
                  View
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="px-3 py-2 rounded-lg flex-row items-center"
                style={{ backgroundColor: '#D9770620' }}
                activeOpacity={0.7}
              >
                <Feather name="edit-2" size={14} color="#D97706" />
                <Text className="ml-1 text-xs font-rubik text-amber-600">
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View className="px-4 pt-4 pb-2">
      <SearchInput
        value={searchQuery}
        placeholder="Search employees..."
        onChangeText={handleSearchChange}
        onSearch={() => setDebouncedSearchQuery(searchQuery)}
        onClear={clearSearch}
      />

      {/* Filter, Export & Import Buttons */}
      {/* <View className="flex-row justify-end mt-3 gap-2">
        <TouchableOpacity
          className="px-4 py-2 rounded-lg flex-row items-center"
          style={{ backgroundColor: colors.primary + '15' }}
          activeOpacity={0.7}
        >
          <Feather name="filter" size={16} color={colors.primary} />
          <Text className="ml-2 text-sm font-rubik" style={{ color: colors.primary }}>
            Filter
          </Text>
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
      </View> */}

      {/* Stats and Add Button */}
      {totalItems > 0 && (
        <View className="flex-row justify-end items-center mt-4">
          {/* <Text className="font-rubik text-gray-500 text-sm">
            {totalItems} employee{totalItems !== 1 ? 's' : ''}
          </Text> */}
          {canAddEmployee && (
            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
              className="flex-row items-center bg-primary-50 px-4 py-2 rounded-full"
            >
              <Feather name="user-plus" size={20} color={colors.primary} />
              <Text className="font-rubik-medium text-primary-500 ml-1">
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
      <View className="py-4">
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View className="flex-1 items-center justify-center py-12 px-4">
        <Feather name="users" size={64} color="#D1D5DB" />
        <Text className="font-rubik-bold text-gray-900 text-lg mt-4">
          {searchQuery ? 'No employees found' : 'No employees yet'}
        </Text>
        <Text className="font-rubik text-gray-500 text-center mt-2">
          {searchQuery
            ? `No employees matching "${searchQuery}"`
            : 'Add your first employee to get started'}
        </Text>
        {!searchQuery && canAddEmployee && (
          <Button
            title="Add Employee"
            className="mt-4"
            onPress={() => setIsModalVisible(true)}
          />
        )}
      </View>
    );
  };

  if (isLoading && employees.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header title="Employees" />
        <Loader fullScreen />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
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
          paddingBottom: 20,
        }}
      />

      {/* Add Employee Modal */}
      {canAddEmployee && (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <TouchableOpacity
              className="flex-1 bg-black/50"
              activeOpacity={1}
              onPress={() => setIsModalVisible(false)}
            >
              <View className="flex-1 justify-end">
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                  className="bg-white rounded-t-3xl"
                  style={{
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: -4 },
                  }}
                >
                  <View className="flex-row justify-between items-center p-6 border-b border-gray-100">
                    <Text className="font-rubik-bold text-gray-900 text-xl">
                      Add Employee
                    </Text>
                    <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                      <Feather name="x" size={24} color="#9CA3AF" />
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