// components/employee/EmployeeList.tsx
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
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Header from '../ui/Header';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import Toast from 'react-native-toast-message';
import http from '../../services/http.api';
import Loader from '../ui/Loader';
import SearchInput from '../ui/SearchInput';
import VerificationRequestForm, { DocumentFile, VerificationFormData } from './VerificationRequestForm';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/AppStackNavigator';

// Types
interface Employee {
  department: string;
  employmentType: string;
  employmentStatus: string;
  designation: string;
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

export type EmployeeListViewType = 'full' | 'recent';

interface EmployeeListProps {
  viewType?: EmployeeListViewType;
  title?: string;
  showHeader?: boolean;
  showSearch?: boolean;
  limit?: number;
  enablePullToRefresh?: boolean;
  onEmployeePress?: (employee: Employee) => void;
  customEmptyComponent?: React.ReactNode;
  customHeaderComponent?: React.ReactNode;
}

const EmployeeList: React.FC<EmployeeListProps> = ({
  viewType = 'full',
  title = 'Employees',
  showHeader = true,
  showSearch = true,
  limit = viewType === 'recent' ? 5 : 20,
  enablePullToRefresh = true,
  onEmployeePress,
  customEmptyComponent,
  customHeaderComponent,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

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
  
  // State for verification modal
  const [isVerificationModalVisible, setIsVerificationModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Fetch employees when search or page changes
  useEffect(() => {
    if (viewType === 'full') {
      fetchEmployees(1, true);
    } else {
      fetchRecentEmployees();
    }
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
          limit,
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

  const fetchRecentEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await http.get('/api/employees', {
        params: {
          page: 1,
          limit,
        },
      });
      const fetchedEmployees = response?.data?.employees || [];
      setEmployees(fetchedEmployees);
      setTotalItems(fetchedEmployees.length);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Employees',
        text2: error.response?.data?.message || 'Unable to fetch employees',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    if (viewType === 'full') {
      setIsRefreshing(true);
      fetchEmployees(1, true);
    } else {
      setIsRefreshing(true);
      fetchRecentEmployees();
    }
  }, [debouncedSearchQuery]);

  const handleLoadMore = () => {
    if (viewType === 'full' && hasNextPage && !isLoadingMore && !isLoading) {
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

  const handleViewEmployee = (employee: Employee) => {
    if (onEmployeePress) {
      onEmployeePress(employee);
    } else {
      navigation.navigate('EmployeeDetails', { employeeId: employee.id });
    }
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
        hrEmail: data.hrEmail,
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

      console.log('Submitting Verification Request with data:', formData);

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
      
      // Refresh the employee list to update verification status
      handleRefresh();
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

// Employee Card Component
const renderEmployeeCard = ({ item }: { item: Employee }) => {
  const fullName = `${item.firstName} ${item.lastName}`.trim();
  const imageUrl = item.profileImage;
  const isCurrentUser = item.email === user?.email;

  // Helper function to format employment type
  const formatEmploymentType = (type: string) => {
    switch(type) {
      case 'full_time': return 'Full Time';
      case 'part_time': return 'Part Time';
      case 'contract': return 'Contract';
      case 'intern': return 'Intern';
      default: return type;
    }
  };

  // Helper function to format employment status
  const formatEmploymentStatus = (status: string) => {
    switch(status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'terminated': return 'Terminated';
      case 'on_leave': return 'On Leave';
      default: return status;
    }
  };

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginHorizontal: viewType === 'full' ? 16 : 0,
        marginBottom: 12,
        padding: 16,
        
        borderWidth: 1,
        borderColor: '#F1F5F9',
      }}
    >
      {/* Top Row: Avatar + Info + Verification Status Badge */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
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
          
          {/* Designation */}
          {item.designation && (
            <Text
              style={{
                fontFamily: 'Rubik-Medium',
                fontSize: 13,
                color: '#334155',
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {item.designation}
            </Text>
          )}
          
          <Text
            style={{
              fontFamily: 'Rubik-Regular',
              fontSize: 12.5,
              color: '#64748B',
              marginTop: item.designation ? 2 : 0,
            }}
            numberOfLines={1}
          >
            {item.email}
          </Text>
          
          {/* Employment Details Row */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 8 }}>
            {/* Department */}
            {item.department && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="briefcase" size={11} color="#94A3B8" />
                <Text
                  style={{
                    fontFamily: 'Rubik-Regular',
                    fontSize: 10,
                    color: '#64748B',
                    marginLeft: 3,
                  }}
                >
                  {item.department}
                </Text>
              </View>
            )}
            
            {/* Employment Type */}
            {item.employmentType && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="clock" size={11} color="#94A3B8" />
                <Text
                  style={{
                    fontFamily: 'Rubik-Regular',
                    fontSize: 10,
                    color: '#64748B',
                    marginLeft: 3,
                  }}
                >
                  {formatEmploymentType(item.employmentType)}
                </Text>
              </View>
            )}
          </View>
          
          {/* Joined Date */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
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

          {/* Status Badges Row - Below Joined Date */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {/* Email Verification Status */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 20,
                backgroundColor: item.isEmailVerified ? '#DCFCE7' : '#FEF3C7',
              }}
            >
              {item.isEmailVerified ? (
                <Feather name="check" size={10} color="#22C55E" />
              ) : (
                <Feather name="x" size={10} color="#F59E0B" />
              )}
              <Text
                style={{
                  fontFamily: 'Rubik-Medium',
                  fontSize: 9,
                  marginLeft: 4,
                  color: item.isEmailVerified ? '#166534' : '#92400E',
                }}
              >
                {item.isEmailVerified ? 'EMAIL VERIFIED' : 'EMAIL NOT VERIFIED'}
              </Text>
            </View>

            {/* Employment Status Badge */}
            {item.employmentStatus && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 20,
                  backgroundColor: 
                    item.employmentStatus === 'active' ? '#DCFCE7' :
                    item.employmentStatus === 'inactive' ? '#FEE2E2' :
                    item.employmentStatus === 'on_leave' ? '#FEF3C7' :
                    '#F1F5F9',
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 
                      item.employmentStatus === 'active' ? '#22C55E' :
                      item.employmentStatus === 'inactive' ? '#EF4444' :
                      item.employmentStatus === 'on_leave' ? '#F59E0B' :
                      '#94A3B8',
                    marginRight: 6,
                  }}
                />
                <Text
                  style={{
                    fontFamily: 'Rubik-Medium',
                    fontSize: 9,
                    color: 
                      item.employmentStatus === 'active' ? '#166534' :
                      item.employmentStatus === 'inactive' ? '#991B1B' :
                      item.employmentStatus === 'on_leave' ? '#92400E' :
                      '#475569',
                  }}
                >
                  {formatEmploymentStatus(item.employmentStatus).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Document Verification Status Badge - Top Right */}
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

      <View
        style={{
          height: 1,
          backgroundColor: '#F1F5F9',
          marginVertical: 12,
        }}
      />

      {/* Bottom Section: Action Buttons on Right */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
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
            onPress={() => handleViewEmployee(item)}
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

  // Header Component
  const renderHeader = () => {
    if (viewType === 'recent' && customHeaderComponent) {
      return customHeaderComponent;
    }

    return (
      <>
        {showSearch && viewType === 'full' && (
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
            <SearchInput
              value={searchQuery}
              placeholder="Search employees..."
              onChangeText={handleSearchChange}
              onSearch={() => setDebouncedSearchQuery(searchQuery)}
              onClear={clearSearch}
            />
          </View>
        )}
        
        {totalItems > 0 && viewType === 'full' && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              marginTop: 8,
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
      </>
    );
  };

  const renderFooter = () => {
    if (viewType === 'recent') return null;
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    
    if (customEmptyComponent) {
      return customEmptyComponent;
    }

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
            : 'No employees found'}
        </Text>
      </View>
    );
  };

  if (isLoading && employees.length === 0 && viewType === 'full') {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {showHeader && <Header title={title} />}
        <Loader fullScreen />
      </View>
    );
  }

  // For recent view, just render the FlatList without container
  if (viewType === 'recent') {
    return (
      <>
        <FlatList
          data={employees}
          renderItem={renderEmployeeCard}
          keyExtractor={(item) => item.id}
          refreshControl={
            enablePullToRefresh ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          ListEmptyComponent={renderEmpty}
        />

        {/* Verification Modal */}
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
            style={{ flex: 1 }}
          >
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
              activeOpacity={1}
              onPress={() => {
                setIsVerificationModalVisible(false);
                setSelectedEmployee(null);
              }}
            >
              <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                  style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 24, maxHeight: '90%' }}
                >
                  <View style={{ alignItems: 'center', paddingTop: 12 }}>
                    <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' }} />
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                    <View>
                      <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 20, color: '#0F172A' }}>
                        Verify Employee
                      </Text>
                      <Text style={{ fontFamily: 'Rubik-Regular', fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                        Submit verification request for {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setIsVerificationModalVisible(false);
                        setSelectedEmployee(null);
                      }}
                      style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}
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
      </>
    );
  }

  // Full view with container
  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {showHeader && <Header title={title} />}

      <FlatList
        data={employees}
        renderItem={renderEmployeeCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          enablePullToRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          ) : undefined
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 100,
        }}
      />

      {/* Verification Modal */}
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
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
            activeOpacity={1}
            onPress={() => {
              setIsVerificationModalVisible(false);
              setSelectedEmployee(null);
            }}
          >
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
                style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' }}
              >
                <View style={{ alignItems: 'center', paddingTop: 12 }}>
                  <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' }} />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                  <View>
                    <Text style={{ fontFamily: 'Rubik-Bold', fontSize: 20, color: '#0F172A' }}>
                      Verify Employee
                    </Text>
                    <Text style={{ fontFamily: 'Rubik-Regular', fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                      Submit verification request for {selectedEmployee?.firstName} {selectedEmployee?.lastName}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setIsVerificationModalVisible(false);
                      setSelectedEmployee(null);
                    }}
                    style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}
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

export default EmployeeList;