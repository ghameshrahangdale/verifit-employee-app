import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/ui/Header';
import Avatar from '../components/ui/Avatar';
import Toast from 'react-native-toast-message';
import http from '../services/http.api';
import Loader from '../components/ui/Loader';
import SearchInput from '../components/ui/SearchInput';
import ConfirmationPopup from '../components/ui/ConfirmationPopup';
import AddEmployeeForm from '../components/AddEmployeeForm';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';

// Updated User interface to match response
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isEmailVerified: boolean;
  isActive: boolean;
  profileImage: string | null;
}

// Updated Employee interface
interface Employee {
  id: string;
  phone: string | null;
  designation: string | null;
  department: string | null;
}

// Updated InviteData interface with user details
interface InviteData {
  email: string;
  phone: string | null;
  lastName: string;
  firstName: string;
  department: string | null;
  designation: string | null;
  joiningDate: string | null;
}

// Updated Invitation interface
interface Invitation {
  approvalId: string;
  status: 'pending' | 'approved' | 'rejected' | 'declined';
  inviteData: InviteData;
  respondedAt: string | null;
  sentAt: string;
  user: User | null;
  employee: Employee | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Summary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface AddEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  role: 'employee';
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

interface StatusConfig {
  text: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: string;
}

const SentInvitationsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();

  // Check if user can add employees
  const canAddEmployee = user?.role === 'hr' || user?.role === 'admin';

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 6,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupConfig, setPopupConfig] = useState<{
    type: 'resend' | 'cancel';
    invitationId: string;
    email: string;
  } | null>(null);

  // State for Add Employee Modal
  const [isAddEmployeeModalVisible, setIsAddEmployeeModalVisible] = useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);

  // Status configuration
  const getStatusConfig = (status: string): StatusConfig => {
    const statusMap: Record<string, StatusConfig> = {
      pending: {
        text: 'PENDING',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
        icon: 'clock',
      },
      approved: {
        text: 'APPROVED',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        icon: 'check-circle',
      },
      rejected: {
        text: 'DECLINED',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        icon: 'x-circle',
      },
      declined: {
        text: 'DECLINED',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        icon: 'x-circle',
      },
    };

    return statusMap[status.toLowerCase()] || statusMap.pending;
  };

  // Helper function to get user info from invitation
  const getUserInfo = (invitation: Invitation) => {
    if (invitation.user) {
      // For approved/responded invitations, use user data
      return {
        id: invitation.user.id,
        firstName: invitation.user.firstName,
        lastName: invitation.user.lastName,
        email: invitation.user.email,
        profileImage: invitation.user.profileImage,
        isEmailVerified: invitation.user.isEmailVerified,
      };
    } else {
      // For pending invitations, use inviteData
      return {
        id: null,
        firstName: invitation.inviteData.firstName,
        lastName: invitation.inviteData.lastName,
        email: invitation.inviteData.email,
        profileImage: null,
        isEmailVerified: false,
      };
    }
  };

  // Helper function to get employee info from invitation
  const getEmployeeInfo = (invitation: Invitation) => {
    if (invitation.employee) {
      return invitation.employee;
    } else {
      // For pending invitations, use inviteData
      return {
        id: null,
        phone: invitation.inviteData.phone,
        designation: invitation.inviteData.designation,
        department: invitation.inviteData.department,
      };
    }
  };

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Fetch invitations when filters change
  useEffect(() => {
    fetchInvitations();
  }, [debouncedSearchQuery, selectedStatus, pagination.page]);

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);

      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery;
      }

      const response = await http.get('/api/organization/team/invitations', { params });

      // Updated to match new response structure
      const { invitations: fetchedInvitations, pagination: paginationData, summary: summaryData } = response.data;

      if (pagination.page === 1) {
        setInvitations(fetchedInvitations);
      } else {
        setInvitations(prev => [...prev, ...fetchedInvitations]);
      }

      setPagination(paginationData);
      setSummary(summaryData);

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Invitations',
        text2: error.response?.data?.message || 'Unable to fetch invitations',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchInvitations();
  }, [debouncedSearchQuery, selectedStatus]);

  const loadMore = () => {
    if (!isLoading && pagination.page < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearSearch = () => {
    setSearchQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilter = (status: FilterStatus) => {
    setSelectedStatus(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Add Employee Handler
  const handleAddEmployee = async (formData: AddEmployeeData) => {
    try {
      setIsAddingEmployee(true);
      await http.post('/api/organization/team', formData);
      Toast.show({
        type: 'success',
        text1: 'Employee Added',
        text2: `${formData.firstName} ${formData.lastName} has been added`,
      });
      setIsAddEmployeeModalVisible(false);
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

  const showConfirmationPopup = (type: 'resend' | 'cancel', invitationId: string, email: string) => {
    setPopupConfig({ type, invitationId, email });
    setPopupVisible(true);
  };

  const handleCancelInvitation = async () => {
    if (!popupConfig) return;

    try {
      setProcessingId(popupConfig.invitationId);
      setPopupVisible(false);

      await http.delete(`/api/organization/team/invitations?approvalId=${popupConfig.invitationId}`);

      Toast.show({
        type: 'success',
        text1: 'Invitation Cancelled',
        text2: `Invitation to ${popupConfig.email} has been cancelled`,
      });

      handleRefresh();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Cancel Invitation',
        text2: error.response?.data?.message || 'Unable to cancel invitation',
      });
    } finally {
      setProcessingId(null);
      setPopupConfig(null);
    }
  };

  const handleConfirmAction = () => {
    if (popupConfig?.type === 'cancel') {
      handleCancelInvitation();
    }
  };

  const handleCancelAction = () => {
    setPopupVisible(false);
    setPopupConfig(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFullName = (invitation: Invitation) => {
    const userInfo = getUserInfo(invitation);
    return `${userInfo.firstName} ${userInfo.lastName}`.trim();
  };

  const renderFilterTabs = () => {
    const filters: { label: string; value: FilterStatus }[] = [
      { label: 'All', value: 'all' },
      { label: 'Pending', value: 'pending' },
      { label: 'Approved', value: 'approved' },
      { label: 'Declined', value: 'rejected' },
    ];

    return (
      <View className=" mt-3 mb-3">
        <View className="flex-row gap-2">
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              onPress={() => handleStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-full ${selectedStatus === filter.value
                ? 'bg-purple-500'
                : 'bg-slate-100'
                }`}
            >
              <Text
                className={`font-rubik-medium text-sm ${selectedStatus === filter.value
                  ? 'text-white'
                  : 'text-slate-600'
                  }`}
              >
                {filter.label}
                {filter.value !== 'all' && summary && (
                  <Text className="ml-1">
                    ({filter.value === 'pending' ? summary.pending :
                      filter.value === 'approved' ? summary.approved :
                        summary.rejected})
                  </Text>
                )}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderInvitationCard = ({ item }: { item: Invitation }) => {
    const isProcessing = processingId === item.approvalId;
    const statusConfig = getStatusConfig(item.status);
    const userInfo = getUserInfo(item);
    const employeeInfo = getEmployeeInfo(item);
    const fullName = getFullName(item);
    const isPending = item.status === 'pending';

    return (
      <TouchableOpacity
        className="bg-white rounded-xl mx-4 mb-3 p-4 shadow-sm border border-slate-100"
        onPress={() => {
          setSelectedInvitation(item);
          setDetailsModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        {/* Top Row: Avatar + Info */}
        <View className="flex-row items-start">
          {/* User Avatar */}
          <View className="relative">
            <Avatar
              name={fullName}
              imageUrl={userInfo.profileImage}
              size="lg"
              rounded="full"
            />
          </View>

          {/* User Details */}
          <View className="flex-1 ml-3">
            <View className="flex-row items-center flex-wrap">
              <Text className="font-rubik-bold text-[15px] text-slate-900 tracking-tight">
                {fullName}
              </Text>
            </View>
            <View className='flex-row items-center flex-wrap'>
              <Text className="font-rubik text-xs text-slate-500 mt-0.5">
                {userInfo.email}
              </Text>
              {userInfo.isEmailVerified && (
                <Feather name="check-circle" size={12} color="#22C55E" style={{ marginLeft: 4 }} />
              )}
            </View>
          </View>

          <StatusBadge status={item.status} size="small" showIcon={true} />
        </View>

        {/* Designation and Department with Labels */}
        {(employeeInfo.designation || employeeInfo.department) && (
          <View className="mt-3 pt-1">
            {employeeInfo.designation && (
              <View className="flex-row items-center mb-1.5">
                <Feather name="briefcase" size={12} color="#94A3B8" />
                <Text className="font-rubik-medium text-xs text-slate-600 ml-1.5 w-20">
                  Designation:
                </Text>
                <Text className="font-rubik text-xs text-slate-600 flex-1">
                  {employeeInfo.designation}
                </Text>
              </View>
            )}

            {employeeInfo.department && (
              <View className="flex-row items-center">
                <Feather name="grid" size={12} color="#94A3B8" />
                <Text className="font-rubik-medium text-xs text-slate-600 ml-1.5 w-20">
                  Department:
                </Text>
                <Text className="font-rubik text-xs text-slate-600 flex-1">
                  {employeeInfo.department}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Divider */}
        <View className="h-px bg-slate-100 my-3" />

        {/* Invitation Details */}
        <View className="flex-col gap-y-2">
          <View className="flex-row items-center">
            <Feather name="calendar" size={12} color="#94A3B8" />
            <Text className="font-rubik text-xs text-slate-600 ml-1.5">
              Sent: {formatShortDate(item.sentAt)}
            </Text>
          </View>
          {item.respondedAt && (
            <View className="flex-row items-center">
              <Feather name="clock" size={12} color="#94A3B8" />
              <Text className="font-rubik text-xs text-slate-600 ml-1.5">
                Responded: {formatShortDate(item.respondedAt)}
              </Text>
            </View>
          )}
          {item.inviteData.joiningDate && (
            <View className="flex-row items-center">
              <Feather name="briefcase" size={12} color="#94A3B8" />
              <Text className="font-rubik text-xs text-slate-600 ml-1.5">
                Joins: {formatShortDate(item.inviteData.joiningDate)}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons - Only for pending invitations */}
        {isPending && (
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-red-50 py-2.5 rounded-lg border border-red-200"
              onPress={() => showConfirmationPopup('cancel', item.approvalId, userInfo.email)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <>
                  <Feather name="x-circle" size={14} color="#DC2626" />
                  <Text className="font-rubik-medium text-sm text-red-700 ml-2">
                    Cancel
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View className="pt-4 px-4 pb-2">
      <SearchInput
        value={searchQuery}
        placeholder="Search by name or email..."
        onChangeText={handleSearchChange}
        onSearch={() => {
          setPagination(prev => ({ ...prev, page: 1 }));
          fetchInvitations();
        }}
        onClear={clearSearch}
      />
      {renderFilterTabs()}

      {/* Add Employee Button */}
      {invitations.length > 0 && (
        <View className="flex-row justify-between items-center mt-2 mb-1">
          <Text className="font-rubik text-xs text-slate-400 tracking-wide">
            {pagination.total} invitation{pagination.total !== 1 ? 's' : ''}
          </Text>
          {canAddEmployee && (
            <TouchableOpacity
              onPress={() => setIsAddEmployeeModalVisible(true)}
              style={{
                backgroundColor: colors.primary + '12',
                borderWidth: 1,
                borderColor: colors.primary + '40',
              }}
              className="flex-row items-center px-3 py-1.5 rounded-lg border border-purple-500/20"
            >
              <Feather name="user-plus" size={14} color={colors.primary || '#8B5CF6'} />
              <Text
                style={{
                  color: colors.primary,
                }}
                className="font-rubik-medium text-xs text-purple-600 ml-1.5">
                Add Employee
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (isLoading && invitations.length === 0) return null;
    return (
      <View className="flex-1 items-center justify-center py-16 px-8">
        <View className="w-20 h-20 rounded-2xl bg-slate-100 items-center justify-center mb-4">
          <Feather name="inbox" size={36} color="#CBD5E1" />
        </View>
        <Text className="font-rubik-bold text-lg text-slate-900 text-center">
          {searchQuery || selectedStatus !== 'all' ? 'No invitations found' : 'No invitations sent'}
        </Text>
        <Text className="font-rubik text-sm text-slate-400 text-center mt-2 leading-5">
          {searchQuery || selectedStatus !== 'all'
            ? `No invitations matching your filters`
            : 'Invitations you send to team members will appear here'}
        </Text>
        {!searchQuery && selectedStatus === 'all' && canAddEmployee && (
          <Button
            title="Add Employee"
            className="mt-4"
            onPress={() => setIsAddEmployeeModalVisible(true)}
          />
        )}
      </View>
    );
  };

  const renderDetailsModal = () => {
    if (!selectedInvitation) return null;

    const statusConfig = getStatusConfig(selectedInvitation.status);
    const userInfo = getUserInfo(selectedInvitation);
    const employeeInfo = getEmployeeInfo(selectedInvitation);
    const fullName = getFullName(selectedInvitation);

    return (
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl min-h-[60%]">
            {/* Header */}
            <View className="flex-row justify-between items-center p-5 border-b border-slate-100">
              <Text className="font-rubik-bold text-xl text-slate-900">
                Invitation Details
              </Text>
              <TouchableOpacity
                onPress={() => setDetailsModalVisible(false)}
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
              >
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView className="">
              {/* User Info */}
              <View className="items-center mb-6">
                <Avatar
                  name={fullName}
                  imageUrl={userInfo.profileImage}
                  size="xl"
                  rounded="full"
                />
                <Text className="font-rubik-bold text-lg text-slate-900 mt-3">
                  {fullName}
                </Text>
                <Text className="font-rubik text-sm text-slate-500">
                  {userInfo.email}
                </Text>
                <View className={`mt-2 px-3 py-1 rounded-full ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
                  <Text className={`font-rubik-medium text-xs ${statusConfig.textColor}`}>
                    {statusConfig.text}
                  </Text>
                </View>
              </View>

              {/* Invitation Details */}
              <View className="space-y-4 px-5">
                <View className="bg-slate-50 rounded-xl p-4">
                  <Text className="font-rubik-semibold text-sm text-slate-700 mb-3">
                    Invitation Information
                  </Text>

                  <View className="flex-row mb-3">
                    <View className="w-32">
                      <Text className="font-rubik text-xs text-slate-500">Sent Date</Text>
                    </View>
                    <Text className="font-rubik text-xs text-slate-900 flex-1">
                      {formatDate(selectedInvitation.sentAt)}
                    </Text>
                  </View>

                  {selectedInvitation.respondedAt && (
                    <View className="flex-row mb-3">
                      <View className="w-32">
                        <Text className="font-rubik text-xs text-slate-500">Responded Date</Text>
                      </View>
                      <Text className="font-rubik text-xs text-slate-900 flex-1">
                        {formatDate(selectedInvitation.respondedAt)}
                      </Text>
                    </View>
                  )}

                  {employeeInfo.designation && (
                    <View className="flex-row mb-3">
                      <View className="w-32">
                        <Text className="font-rubik text-xs text-slate-500">Designation</Text>
                      </View>
                      <Text className="font-rubik text-xs text-slate-900 flex-1">
                        {employeeInfo.designation}
                      </Text>
                    </View>
                  )}

                  {employeeInfo.department && (
                    <View className="flex-row mb-3">
                      <View className="w-32">
                        <Text className="font-rubik text-xs text-slate-500">Department</Text>
                      </View>
                      <Text className="font-rubik text-xs text-slate-900 flex-1">
                        {employeeInfo.department}
                      </Text>
                    </View>
                  )}

                  {selectedInvitation.inviteData.joiningDate && (
                    <View className="flex-row">
                      <View className="w-32">
                        <Text className="font-rubik text-xs text-slate-500">Joining Date</Text>
                      </View>
                      <Text className="font-rubik text-xs text-slate-900 flex-1">
                        {formatShortDate(selectedInvitation.inviteData.joiningDate)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Phone Information */}
                {employeeInfo.phone && (
                  <View className="bg-slate-50 rounded-xl p-4">
                    <Text className="font-rubik-semibold text-sm text-slate-700 mb-3">
                      Contact Information
                    </Text>

                    <View className="flex-row">
                      <View className="w-32">
                        <Text className="font-rubik text-xs text-slate-500">Phone</Text>
                      </View>
                      <Text className="font-rubik text-xs text-slate-900 flex-1">
                        {employeeInfo.phone}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Employee Details - Only show for approved invitations */}
                {selectedInvitation.employee && selectedInvitation.employee.id && (
                  <View className="bg-slate-50 rounded-xl p-4">
                    <Text className="font-rubik-semibold text-sm text-slate-700 mb-3">
                      Employee Information
                    </Text>

                    <View className="flex-row">
                      <View className="w-32">
                        <Text className="font-rubik text-xs text-slate-500">Employee ID</Text>
                      </View>
                      <Text className="font-rubik text-xs text-slate-900 flex-1">
                        {selectedInvitation.employee.id}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading && invitations.length === 0) {
    return (
      <View className="flex-1 bg-slate-50">
        <Header title="Sent Invitations" />
        <Loader fullScreen />
      </View>
    );
  }

  return (
    <>
      <View className="flex-1 bg-slate-50">
        <Header title="Sent Invitations" />

        <FlatList
          data={invitations}
          renderItem={renderInvitationCard}
          keyExtractor={(item) => item.approvalId}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 100,
          }}
        />
      </View>

      {renderDetailsModal()}

      {/* Add Employee Modal */}
      {canAddEmployee && (
        <Modal
          visible={isAddEmployeeModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsAddEmployeeModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <TouchableOpacity
              className="flex-1 bg-black/45"
              activeOpacity={1}
              onPress={() => setIsAddEmployeeModalVisible(false)}
            >
              <View className="flex-1 justify-end">
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                  className="bg-white rounded-t-3xl shadow-lg"
                  style={{ maxHeight: '90%' }}
                >
                  {/* Modal handle bar */}
                  <View className="items-center pt-3">
                    <View className="w-9 h-1 rounded-full bg-gray-200" />
                  </View>

                  {/* Modal header */}
                  <View className="flex-row justify-between items-center px-6 pt-4 pb-4 border-b border-gray-100">
                    <View>
                      <Text className="font-rubik-bold text-xl text-slate-900 tracking-tight">
                        Add Employee
                      </Text>
                      <Text className="font-rubik text-xs text-slate-400 mt-0.5">
                        Invite a new team member
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setIsAddEmployeeModalVisible(false)}
                      className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center"
                    >
                      <Feather name="x" size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  {/* Scrollable content area */}
                  <View className="" style={{ maxHeight: '85%' }}>
                    <AddEmployeeForm
                      onSubmit={handleAddEmployee}
                      onCancel={() => setIsAddEmployeeModalVisible(false)}
                      isLoading={isAddingEmployee}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>
      )}

      <ConfirmationPopup
        visible={popupVisible}
        title="Cancel Invitation"
        message={`Are you sure you want to cancel the invitation to ${popupConfig?.email}? This action cannot be undone.`}
        confirmText="Cancel"
        cancelText="No, Go Back"
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </>
  );
};

export default SentInvitationsScreen;