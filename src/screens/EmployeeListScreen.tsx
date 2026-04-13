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
import VerificationRequestForm, { DocumentFile, VerificationFormData } from '../components/employee/VerificationRequestForm';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AppStackParamList } from '../navigation/AppStackNavigator';

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
  
  // State for verification modal
  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

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

      setEmployees(prev =>
        reset ? fetchedEmployees : [...prev, ...fetchedEmployees]
      );

      setCurrentPage(pagination?.page || 1);
      setTotalPages(pagination?.totalPages || 1);
      setTotalItems(pagination?.total || fetchedEmployees.length);
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewEmployee = (id: string) => {
    navigation.navigate('EmployeeDetails', { employeeId: id });
  };

  const handleVerifyEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsVerificationModalVisible(true);
  };

  const handleSubmitVerificationRequest = async (data: VerificationFormData, documents: DocumentFile[]) => {
    if (!selectedEmployee) return;
    
    setIsSubmittingVerification(true);
    try {
      const formData = new FormData();

      const requestData = {
        employeeId: selectedEmployee.id,
        organizationId: data.organizationId,
        designation: data.designation,
        department: data.department,
        employmentType: data.employmentType,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        location: data.location,
        reasonForLeaving: data.reasonForLeaving || undefined,
        templateId: data.templateId || undefined,
        salary: data.salary ? {
          salaryType: data.salary.salaryType,
          amount: data.salary.amount,
          currency: data.salary.currency,
          frequency: data.salary.frequency,
        } : undefined,
      };

      formData.append('data', JSON.stringify(requestData));

      documents.forEach((doc, index) => {
        formData.append(`documents[${index}][file]`, {
          uri: doc.uri,
          name: doc.name,
          type: doc.type,
        } as any);

        formData.append(`documents[${index}][type]`, doc.documentType);
        formData.append(`documents[${index}][title]`, doc.title);
      });

      await http.post('/api/verification/employee/create-request', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Verification request submitted for ${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
      });

      setIsVerificationModalVisible(false);
      setSelectedEmployee(null);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error.response?.data?.message || 'Failed to submit verification request',
      });
      throw error;
    } finally {
      setIsSubmittingVerification(false);
    }
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

        {/* Bottom Row: Meta info + Action Buttons */}
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

          {/* Action Buttons Container */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* View Button */}
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

            {/* Verify Button - Only show if not already verified */}
            {!item.verificationStatus && (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#10B981',
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 12,
                  shadowColor: '#10B981',
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 3,
                }}
                onPress={() => handleVerifyEmployee(item)}
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
                  Verify
                </Text>
                <Feather name="shield" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
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
          paddingBottom: 100,
        }}
      />

      

      {/* Verification Request Modal */}
      <Modal
        visible={isVerificationModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsVerificationModalVisible(false);
          setSelectedEmployee(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <TouchableOpacity
            className="flex-1 bg-black/45"
            activeOpacity={1}
            onPress={() => {
              setIsVerificationModalVisible(false);
              setSelectedEmployee(null);
            }}
          >
            <View className="flex-1 justify-end">
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
                className="bg-white rounded-t-3xl shadow-lg max-h-[90%]"
              >
                <View className="items-center pt-3">
                  <View className="w-9 h-1 rounded-full bg-gray-200" />
                </View>

                <View className="flex-row justify-between items-center px-6 pt-4 pb-4 border-b border-gray-100">
                  <View>
                    <Text className="font-rubik-bold text-xl text-gray-900">
                      Verify Employee
                    </Text>
                    <Text className="font-rubik text-xs text-gray-400 mt-0.5">
                      Submit verification request for {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setIsVerificationModalVisible(false);
                      setSelectedEmployee(null);
                    }}
                    className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center"
                  >
                    <Feather name="x" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <VerificationRequestForm
                  onSubmit={handleSubmitVerificationRequest}
                  onCancel={() => {
                    setIsVerificationModalVisible(false);
                    setSelectedEmployee(null);
                  }}
                  isLoading={isSubmittingVerification}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default EmployeeListScreen;