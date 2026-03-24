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
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Input from '../components/ui/Input';

interface SubOrganization {
  id: string;
  name: string;
  businessEmail: string;
  city: string;
  state: string;
  country: string;
  status: 'active' | 'inactive' | 'pending';
  adminFirstName: string;
  adminLastName: string;
  createdAt: string;
  updatedAt: string;
  employeeCount?: number;
  totalEmployees?: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Summary {
  total: number;
  active: number;
  inactive: number;
  pending: number;
}

interface AddSubOrgData {
  name: string;
  businessEmail: string;
  city: string;
  state: string;
  country: string;
  adminFirstName: string;
  adminLastName: string;
}

type FilterStatus = 'all' | 'active' | 'inactive' | 'pending';

interface StatusConfig {
  text: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: string;
}

const SubOrganizationsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();

  // Check if user can add sub-organizations (only admin or super admin)
  const canAddSubOrg = user?.role === 'admin' || user?.role === 'super_admin';

  const [subOrganizations, setSubOrganizations] = useState<SubOrganization[]>([]);
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
  const [selectedSubOrg, setSelectedSubOrg] = useState<SubOrganization | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupConfig, setPopupConfig] = useState<{
    type: 'activate' | 'deactivate';
    subOrgId: string;
    name: string;
  } | null>(null);

  // State for Add Sub-Organization Modal
  const [isAddSubOrgModalVisible, setIsAddSubOrgModalVisible] = useState(false);
  const [isAddingSubOrg, setIsAddingSubOrg] = useState(false);

  // Status configuration
  const getStatusConfig = (status: string): StatusConfig => {
    const statusMap: Record<string, StatusConfig> = {
      active: {
        text: 'ACTIVE',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        icon: 'check-circle',
      },
      inactive: {
        text: 'INACTIVE',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        icon: 'x-circle',
      },
      pending: {
        text: 'PENDING',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
        icon: 'clock',
      },
    };

    return statusMap[status.toLowerCase()] || statusMap.pending;
  };

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Fetch sub-organizations when filters change
  useEffect(() => {
    fetchSubOrganizations();
  }, [debouncedSearchQuery, selectedStatus, pagination.page]);

  const fetchSubOrganizations = async () => {
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

      const response = await http.get('/api/organization/sub-organizations', { params });

      const { subOrganizations: fetchedSubOrgs, pagination: paginationData, summary: summaryData } = response.data;

      if (pagination.page === 1) {
        setSubOrganizations(fetchedSubOrgs);
      } else {
        setSubOrganizations(prev => [...prev, ...fetchedSubOrgs]);
      }

      setPagination(paginationData);
      setSummary(summaryData);

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Sub-Organizations',
        text2: error.response?.data?.message || 'Unable to fetch sub-organizations',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchSubOrganizations();
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

  // Add Sub-Organization Handler
  const handleAddSubOrganization = async (formData: AddSubOrgData) => {
    try {
      setIsAddingSubOrg(true);
      await http.post('/api/organization/sub-organizations', formData);
      Toast.show({
        type: 'success',
        text1: 'Sub-Organization Added',
        text2: `${formData.name} has been created successfully`,
      });
      setIsAddSubOrgModalVisible(false);
      handleRefresh(); // Refresh the list
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Add Sub-Organization',
        text2: error.response?.data?.message || 'Unable to add sub-organization',
      });
      throw error;
    } finally {
      setIsAddingSubOrg(false);
    }
  };

  const showConfirmationPopup = (type: 'activate' | 'deactivate', subOrgId: string, name: string) => {
    setPopupConfig({ type, subOrgId, name });
    setPopupVisible(true);
  };

  const handleActivateSubOrganization = async () => {
    if (!popupConfig) return;

    try {
      setProcessingId(popupConfig.subOrgId);
      setPopupVisible(false);

      await http.patch(`/api/organization/sub-organizations/${popupConfig.subOrgId}/activate`);

      Toast.show({
        type: 'success',
        text1: 'Sub-Organization Activated',
        text2: `${popupConfig.name} has been activated successfully`,
      });

      handleRefresh();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Activate Sub-Organization',
        text2: error.response?.data?.message || 'Unable to activate sub-organization',
      });
    } finally {
      setProcessingId(null);
      setPopupConfig(null);
    }
  };

  const handleDeactivateSubOrganization = async () => {
    if (!popupConfig) return;

    try {
      setProcessingId(popupConfig.subOrgId);
      setPopupVisible(false);

      await http.patch(`/api/organization/sub-organizations/${popupConfig.subOrgId}/deactivate`);

      Toast.show({
        type: 'success',
        text1: 'Sub-Organization Deactivated',
        text2: `${popupConfig.name} has been deactivated successfully`,
      });

      handleRefresh();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Deactivate Sub-Organization',
        text2: error.response?.data?.message || 'Unable to deactivate sub-organization',
      });
    } finally {
      setProcessingId(null);
      setPopupConfig(null);
    }
  };

  const handleConfirmAction = () => {
    if (popupConfig?.type === 'activate') {
      handleActivateSubOrganization();
    } else if (popupConfig?.type === 'deactivate') {
      handleDeactivateSubOrganization();
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

  const getAdminFullName = (adminFirstName: string, adminLastName: string) => {
    return `${adminFirstName} ${adminLastName}`.trim();
  };

  const renderFilterTabs = () => {
    const filters: { label: string; value: FilterStatus }[] = [
      { label: 'All', value: 'all' },
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Pending', value: 'pending' },
    ];

    return (
      <View className="mt-3 mb-3">
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
                    ({filter.value === 'active' ? summary.active :
                      filter.value === 'inactive' ? summary.inactive :
                        summary.pending})
                  </Text>
                )}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderSubOrganizationCard = ({ item }: { item: SubOrganization }) => {
    const isProcessing = processingId === item.id;
    const statusConfig = getStatusConfig(item.status);
    const adminFullName = getAdminFullName(item.adminFirstName, item.adminLastName);
    const isActive = item.status === 'active';
    const isPending = item.status === 'pending';

    return (
      <TouchableOpacity
        className="bg-white rounded-xl mx-4 mb-3 p-4 shadow-sm border border-slate-100"
        onPress={() => {
          setSelectedSubOrg(item);
          setDetailsModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        {/* Top Row: Icon + Info */}
        <View className="flex-row items-start">
          {/* Organization Icon */}
          <View className="w-12 h-12 rounded-xl bg-purple-100 items-center justify-center">
            <Feather name="building" size={24} color="#8B5CF6" />
          </View>

          {/* Organization Details */}
          <View className="flex-1 ml-3">
            <View className="flex-row items-center flex-wrap justify-between">
              <Text className="font-rubik-bold text-[15px] text-slate-900 tracking-tight flex-1 mr-2">
                {item.name}
              </Text>
              <StatusBadge status={item.status} size="small" showIcon={true} />
            </View>
            <Text className="font-rubik text-xs text-slate-500 mt-0.5">
              {item.businessEmail}
            </Text>
          </View>
        </View>

        {/* Location Information */}
        <View className="mt-3 pt-1">
          <View className="flex-row items-center mb-1.5">
            <Feather name="map-pin" size={12} color="#94A3B8" />
            <Text className="font-rubik text-xs text-slate-600 ml-1.5">
              {[item.city, item.state, item.country].filter(Boolean).join(', ')}
            </Text>
          </View>

          {item.employeeCount !== undefined && (
            <View className="flex-row items-center">
              <Feather name="users" size={12} color="#94A3B8" />
              <Text className="font-rubik text-xs text-slate-600 ml-1.5">
                {item.employeeCount} employee{item.employeeCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View className="h-px bg-slate-100 my-3" />

        {/* Admin Information */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Feather name="user" size={12} color="#94A3B8" />
            <Text className="font-rubik text-xs text-slate-600 ml-1.5">
              Admin: {adminFullName}
            </Text>
          </View>
          <Text className="font-rubik text-xs text-slate-400">
            Created: {formatDate(item.createdAt).split(',')[0]}
          </Text>
        </View>

        {/* Action Buttons - Only for non-pending statuses */}
        {!isPending && (
          <View className="flex-row gap-3 mt-4">
            {!isActive ? (
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center bg-green-50 py-2.5 rounded-lg border border-green-200"
                onPress={() => showConfirmationPopup('activate', item.id, item.name)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#22C55E" />
                ) : (
                  <>
                    <Feather name="check-circle" size={14} color="#22C55E" />
                    <Text className="font-rubik-medium text-sm text-green-700 ml-2">
                      Activate
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center bg-red-50 py-2.5 rounded-lg border border-red-200"
                onPress={() => showConfirmationPopup('deactivate', item.id, item.name)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <>
                    <Feather name="x-circle" size={14} color="#DC2626" />
                    <Text className="font-rubik-medium text-sm text-red-700 ml-2">
                      Deactivate
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
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
          fetchSubOrganizations();
        }}
        onClear={clearSearch}
      />
      {renderFilterTabs()}

      {/* Add Sub-Organization Button */}
      {subOrganizations.length > 0 && (
        <View className="flex-row justify-between items-center mt-2 mb-1">
          <Text className="font-rubik text-xs text-slate-400 tracking-wide">
            {pagination.total} sub-organization{pagination.total !== 1 ? 's' : ''}
          </Text>
          {canAddSubOrg && (
            <TouchableOpacity
              onPress={() => setIsAddSubOrgModalVisible(true)}
              style={{
                backgroundColor: colors.primary + '12',
                borderWidth: 1,
                borderColor: colors.primary + '40',
              }}
              className="flex-row items-center px-3 py-1.5 rounded-lg"
            >
              <Feather name="plus-circle" size={14} color={colors.primary || '#8B5CF6'} />
              <Text
                style={{
                  color: colors.primary,
                }}
                className="font-rubik-medium text-xs text-purple-600 ml-1.5">
                Add Sub-Organization
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (isLoading && subOrganizations.length === 0) return null;
    return (
      <View className="flex-1 items-center justify-center py-16 px-8">
        <View className="w-20 h-20 rounded-2xl bg-slate-100 items-center justify-center mb-4">
          <Feather name="building" size={36} color="#CBD5E1" />
        </View>
        <Text className="font-rubik-bold text-lg text-slate-900 text-center">
          {searchQuery || selectedStatus !== 'all' ? 'No sub-organizations found' : 'No sub-organizations created'}
        </Text>
        <Text className="font-rubik text-sm text-slate-400 text-center mt-2 leading-5">
          {searchQuery || selectedStatus !== 'all'
            ? `No sub-organizations matching your filters`
            : 'Sub-organizations you create will appear here'}
        </Text>
        {!searchQuery && selectedStatus === 'all' && canAddSubOrg && (
          <Button
            title="Add Sub-Organization"
            className="mt-4"
            onPress={() => setIsAddSubOrgModalVisible(true)}
          />
        )}
      </View>
    );
  };

  const renderDetailsModal = () => {
    if (!selectedSubOrg) return null;

    const statusConfig = getStatusConfig(selectedSubOrg.status);
    const adminFullName = getAdminFullName(selectedSubOrg.adminFirstName, selectedSubOrg.adminLastName);

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
                Sub-Organization Details
              </Text>
              <TouchableOpacity
                onPress={() => setDetailsModalVisible(false)}
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
              >
                <Feather name="x" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-5">
              {/* Organization Info */}
              <View className="items-center mb-6">
                <View className="w-20 h-20 rounded-2xl bg-purple-100 items-center justify-center mb-3">
                  <Feather name="building" size={36} color="#8B5CF6" />
                </View>
                <Text className="font-rubik-bold text-lg text-slate-900 mt-2">
                  {selectedSubOrg.name}
                </Text>
                <Text className="font-rubik text-sm text-slate-500">
                  {selectedSubOrg.businessEmail}
                </Text>
                <View className={`mt-2 px-3 py-1 rounded-full ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
                  <Text className={`font-rubik-medium text-xs ${statusConfig.textColor}`}>
                    {statusConfig.text}
                  </Text>
                </View>
              </View>

              {/* Organization Details */}
              <View className="space-y-4">
                <View className="bg-slate-50 rounded-xl p-4">
                  <Text className="font-rubik-semibold text-sm text-slate-700 mb-3">
                    Organization Information
                  </Text>

                  <View className="flex-row mb-3">
                    <View className="w-32">
                      <Text className="font-rubik text-xs text-slate-500">Location</Text>
                    </View>
                    <Text className="font-rubik text-xs text-slate-900 flex-1">
                      {[selectedSubOrg.city, selectedSubOrg.state, selectedSubOrg.country].filter(Boolean).join(', ')}
                    </Text>
                  </View>

                  <View className="flex-row mb-3">
                    <View className="w-32">
                      <Text className="font-rubik text-xs text-slate-500">Created Date</Text>
                    </View>
                    <Text className="font-rubik text-xs text-slate-900 flex-1">
                      {formatDate(selectedSubOrg.createdAt)}
                    </Text>
                  </View>

                  <View className="flex-row">
                    <View className="w-32">
                      <Text className="font-rubik text-xs text-slate-500">Last Updated</Text>
                    </View>
                    <Text className="font-rubik text-xs text-slate-900 flex-1">
                      {formatDate(selectedSubOrg.updatedAt)}
                    </Text>
                  </View>
                </View>

                {/* Admin Information */}
                <View className="bg-slate-50 rounded-xl p-4">
                  <Text className="font-rubik-semibold text-sm text-slate-700 mb-3">
                    Admin Information
                  </Text>

                  <View className="flex-row mb-3">
                    <View className="w-32">
                      <Text className="font-rubik text-xs text-slate-500">Full Name</Text>
                    </View>
                    <Text className="font-rubik text-xs text-slate-900 flex-1">
                      {adminFullName}
                    </Text>
                  </View>

                  <View className="flex-row">
                    <View className="w-32">
                      <Text className="font-rubik text-xs text-slate-500">Email</Text>
                    </View>
                    <Text className="font-rubik text-xs text-slate-900 flex-1">
                      {selectedSubOrg.businessEmail}
                    </Text>
                  </View>
                </View>

                {/* Statistics */}
                {selectedSubOrg.totalEmployees !== undefined && (
                  <View className="bg-slate-50 rounded-xl p-4">
                    <Text className="font-rubik-semibold text-sm text-slate-700 mb-3">
                      Statistics
                    </Text>

                    <View className="flex-row">
                      <View className="w-32">
                        <Text className="font-rubik text-xs text-slate-500">Total Employees</Text>
                      </View>
                      <Text className="font-rubik text-xs text-slate-900 flex-1">
                        {selectedSubOrg.totalEmployees}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Action Buttons for Modal */}
            {selectedSubOrg.status !== 'pending' && (
              <View className="flex-row gap-3 p-5 border-t border-slate-100">
                {selectedSubOrg.status === 'inactive' ? (
                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center bg-green-50 py-3 rounded-xl"
                    onPress={() => {
                      setDetailsModalVisible(false);
                      showConfirmationPopup('activate', selectedSubOrg.id, selectedSubOrg.name);
                    }}
                  >
                    <Feather name="check-circle" size={18} color="#22C55E" />
                    <Text className="font-rubik-medium text-base text-green-700 ml-2">
                      Activate
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center bg-red-50 py-3 rounded-xl"
                    onPress={() => {
                      setDetailsModalVisible(false);
                      showConfirmationPopup('deactivate', selectedSubOrg.id, selectedSubOrg.name);
                    }}
                  >
                    <Feather name="x-circle" size={18} color="#DC2626" />
                    <Text className="font-rubik-medium text-base text-red-700 ml-2">
                      Deactivate
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  if (isLoading && subOrganizations.length === 0) {
    return (
      <View className="flex-1 bg-slate-50">
        <Header title="Sub-Organizations" />
        <Loader fullScreen />
      </View>
    );
  }

  return (
    <>
      <View className="flex-1 bg-slate-50">
        <Header title="Sub-Organizations" />

        <FlatList
          data={subOrganizations}
          renderItem={renderSubOrganizationCard}
          keyExtractor={(item) => item.id}
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

      {/* Add Sub-Organization Modal */}
      {canAddSubOrg && (
        <Modal
          visible={isAddSubOrgModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsAddSubOrgModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <TouchableOpacity
              className="flex-1 bg-black/45"
              activeOpacity={1}
              onPress={() => setIsAddSubOrgModalVisible(false)}
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
                        Add Sub-Organization
                      </Text>
                      <Text className="font-rubik text-xs text-slate-400 mt-0.5">
                        Create a new sub-organization under your management
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setIsAddSubOrgModalVisible(false)}
                      className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center"
                    >
                      <Feather name="x" size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  {/* Scrollable content area */}
                  <View className="" style={{ maxHeight: '85%' }}>
                    <AddSubOrganizationForm
                      onSubmit={handleAddSubOrganization}
                      onCancel={() => setIsAddSubOrgModalVisible(false)}
                      isLoading={isAddingSubOrg}
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
        title={popupConfig?.type === 'activate' ? 'Activate Sub-Organization' : 'Deactivate Sub-Organization'}
        message={popupConfig?.type === 'activate'
          ? `Are you sure you want to activate ${popupConfig?.name}? This will allow the organization to access all features.`
          : `Are you sure you want to deactivate ${popupConfig?.name}? This will restrict access to the organization.`}
        confirmText={popupConfig?.type === 'activate' ? 'Activate' : 'Deactivate'}
        cancelText="Cancel"
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </>
  );
};

// Add Sub-Organization Form Component
interface AddSubOrgFormProps {
  onSubmit: (data: AddSubOrgData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const AddSubOrganizationForm: React.FC<AddSubOrgFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<AddSubOrgData>({
    name: '',
    businessEmail: '',
    city: '',
    state: '',
    country: '',
    adminFirstName: '',
    adminLastName: '',
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AddSubOrgData, string>>>({});

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof AddSubOrgData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = 'Organization name is required';
    }

    if (!formData.businessEmail.trim()) {
      errors.businessEmail = 'Business email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.businessEmail)) {
      errors.businessEmail = 'Email is invalid';
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      errors.state = 'State is required';
    }

    if (!formData.country.trim()) {
      errors.country = 'Country is required';
    }

    if (!formData.adminFirstName.trim()) {
      errors.adminFirstName = 'Admin first name is required';
    }

    if (!formData.adminLastName.trim()) {
      errors.adminLastName = 'Admin last name is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  const handleFieldChange = (field: keyof AddSubOrgData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: undefined });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className=""
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        className=""
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-6">
          {/* Info Banner */}
          <View className="bg-purple-50 p-4 rounded-xl mb-6 flex-row items-center">
            <View className="bg-purple-100 rounded-full p-2 mr-3">
              <Feather name="building" size={18} color="#8B5CF6" />
            </View>
            <View className="flex-1">
              <Text className="font-rubik-medium text-purple-800 text-sm">
                Create New Sub-Organization
              </Text>
              <Text className="font-rubik text-purple-600 text-xs mt-1">
                Fill in the details to create a new sub-organization under your management
              </Text>
            </View>
          </View>

          {/* Organization Information */}
          <Text className="font-rubik-semibold text-sm text-slate-700 mb-3">
            Organization Information
          </Text>

          <Input
            label="Organization Name"
            value={formData.name}
            onChangeText={(text) => handleFieldChange('name', text)}
            placeholder="Enter organization name"
            error={formErrors.name}
            className="mb-4"
          />

          <Input
            label="Business Email"
            value={formData.businessEmail}
            onChangeText={(text) => handleFieldChange('businessEmail', text)}
            placeholder="Enter business email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={formErrors.businessEmail}
            className="mb-4"
          />

          {/* Location Information */}
          <Text className="font-rubik-semibold text-sm text-slate-700 mb-3 mt-2">
            Location Information
          </Text>

          <Input
            label="City"
            value={formData.city}
            onChangeText={(text) => handleFieldChange('city', text)}
            placeholder="Enter city"
            error={formErrors.city}
            className="mb-4"
          />

          <Input
            label="State"
            value={formData.state}
            onChangeText={(text) => handleFieldChange('state', text)}
            placeholder="Enter state"
            error={formErrors.state}
            className="mb-4"
          />

          <Input
            label="Country"
            value={formData.country}
            onChangeText={(text) => handleFieldChange('country', text)}
            placeholder="Enter country"
            error={formErrors.country}
            className="mb-6"
          />

          {/* Admin Information */}
          <Text className="font-rubik-semibold text-sm text-slate-700 mb-3">
            Admin Information
          </Text>

          <Input
            label="Admin First Name"
            value={formData.adminFirstName}
            onChangeText={(text) => handleFieldChange('adminFirstName', text)}
            placeholder="Enter admin first name"
            error={formErrors.adminFirstName}
            className="mb-4"
          />

          <Input
            label="Admin Last Name"
            value={formData.adminLastName}
            onChangeText={(text) => handleFieldChange('adminLastName', text)}
            placeholder="Enter admin last name"
            error={formErrors.adminLastName}
            className="mb-6"
          />

          {/* Action Buttons */}
          <View className="flex-row gap-4 mt-2">
            <Button
              title="Cancel"
              variant="outline"
              className="flex-1"
              onPress={onCancel}
              disabled={isLoading}
            />
            <Button
              title="Create Sub-Organization"
              className="flex-1"
              loading={isLoading}
              onPress={handleSubmit}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SubOrganizationsScreen;