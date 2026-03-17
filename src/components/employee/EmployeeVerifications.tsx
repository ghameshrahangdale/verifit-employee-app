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
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Toast from 'react-native-toast-message';
import http from '../../services/http.api';
import Loader from '../../components/ui/Loader';
import SearchInput from '../../components/ui/SearchInput';
import VerificationRequestForm, {VerificationFormData, DocumentFile } from './VerificationRequestForm'; 
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/AppStackNavigator';

// Update the VerificationRequest interface based on API response
interface VerificationRequest {
  verificationRequestId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_REVIEW';
  requestedAt: string;
  employmentRecordId: string;
  companyName: string;
  designation: string;
  employmentType: string;
  startDate: string;
  endDate?: string;
  hrEmail: string;
  // Optional fields that might come from other endpoints or details view
  department?: string;
  managerName?: string;
  managerEmail?: string;
  location?: string;
  comments?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  documentName?: string;
  documentNumber?: string;
  fileSize?: string;
}

const EmployeeVerification: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
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
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status filter options - matching API status values
  const statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'In Review', value: 'IN_REVIEW' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    fetchMyVerifications(1, true);
  }, [debouncedSearchQuery, selectedStatus]);

  const fetchMyVerifications = async (page: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      // Build query params
      const params: any = {
        page,
        limit: 10,
      };
      
      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery;
      }
      
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      // Make API call
      const response = await http.get('/api/verification/employee/create-request', { params });
      
      console.log(response);
      if (response.data) {
        const fetchedData = response.data;
        console.log(fetchedData)
        
        // Sort by date (most recent first) - client-side sorting
        // const sortedData = [...fetchedData].sort((a, b) => 
        //   new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
        // );

        setVerifications(prev => 
          reset ? fetchedData : [...prev, ...fetchedData]
        );

        // Handle pagination metadata from response headers or response data
        // Assuming the API returns pagination info in headers or response
        const total = response.headers?.['x-total-count'] || fetchedData.length;
        const limit = 10;
        
        setCurrentPage(page);
        setTotalPages(Math.ceil(total / limit));
        setTotalItems(total);
        setHasNextPage(fetchedData.length === limit); // If we got full page, assume there's more
      }

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Verifications',
        text2: error.response?.data?.message || 'Unable to fetch your verification requests',
      });
      
      // Set empty data on error
      if (reset) {
        setVerifications([]);
        setTotalItems(0);
        setHasNextPage(false);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchMyVerifications(1, true);
  }, [debouncedSearchQuery, selectedStatus]);

  const handleLoadMore = () => {
    if (hasNextPage && !isLoadingMore && !isLoading) {
      fetchMyVerifications(currentPage + 1, false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleSubmitVerificationRequest = async (data: VerificationFormData, documents: DocumentFile[]) => {
    setIsSubmitting(true);
    try {
      // Create FormData object
      const formData = new FormData();
      
      // Append the main data as JSON string
      formData.append('data', JSON.stringify(data));
      
      // Append each document with the required structure
      documents.forEach((doc, index) => {
        formData.append(`documents[${index}][file]`, {
          uri: doc.uri,
          name: doc.name,
          type: doc.type,
        } as any);
        
        formData.append(`documents[${index}][type]`, doc.documentType);
        formData.append(`documents[${index}][title]`, doc.title);
      });

      console.log(formData);
      
      const response = await http.post('/api/verification/employee/create-request', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Verification request submitted successfully',
      });
      
      setIsModalVisible(false);
      handleRefresh(); // Refresh the list
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error.response?.data?.message || 'Failed to submit verification request',
      });
      throw error; // Re-throw to let the form handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateVerificationRequest = async (data: VerificationFormData) => {
    if (!selectedVerification) return;
    
    setIsSubmitting(true);
    try {
      // Make API call for update - adjust endpoint as per your API
      const response = await http.put(`/api/verification/employee/${selectedVerification.verificationRequestId}`, data);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Verification request updated successfully',
      });
      
      setIsEditModalVisible(false);
      setSelectedVerification(null);
      handleRefresh(); // Refresh the list
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.response?.data?.message || 'Failed to update verification request',
      });
      throw error; // Re-throw to let the form handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = (verification: VerificationRequest) => {
    // Navigate to verification details
    navigation.navigate('ViewVerification', { verificationId: verification.verificationRequestId });
  };

  const handleEdit = (verification: VerificationRequest) => {
    setSelectedVerification(verification);
    setIsEditModalVisible(true);
  };

  const handleDelete = (id: string) => {
    // Find the verification to check its status
    const verification = verifications.find(v => v.verificationRequestId === id);
    if (verification?.status === 'APPROVED') {
      Toast.show({
        type: 'error',
        text1: 'Cannot Delete',
        text2: 'Approved verifications cannot be deleted',
      });
      return;
    }

    Alert.alert(
      'Delete Verification Request',
      'Are you sure you want to delete this verification request? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Make API call to delete
              await http.delete(`/api/verification/employee/${id}`);
              
              setVerifications(prev => prev.filter(v => v.verificationRequestId !== id));
              Toast.show({
                type: 'success',
                text1: 'Verification Deleted',
                text2: 'Your verification request has been removed',
              });
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Delete Failed',
                text2: error.response?.data?.message || 'Failed to delete verification request',
              });
            }
          },
        },
      ]
    );
  };

  const handleResubmit = (verification: VerificationRequest) => {
    setSelectedVerification(verification);
    setIsEditModalVisible(true);
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      PENDING: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        label: 'PENDING',
        icon: 'clock',
      },
      IN_REVIEW: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        label: 'IN REVIEW',
        icon: 'eye',
      },
      APPROVED: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        label: 'APPROVED',
        icon: 'check-circle',
      },
      REJECTED: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        label: 'REJECTED',
        icon: 'x-circle',
      },
    };
    return configs[status as keyof typeof configs] || configs.PENDING;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  const getEmploymentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      full_time: 'Full Time',
      part_time: 'Part Time',
      contract: 'Contract',
      internship: 'Internship',
      temporary: 'Temporary',
    };
    return types[type] || type.replace('_', ' ');
  };

  // Verification Card Component - Updated to use API response fields
  const 
  renderVerificationCard = ({ item }: { item: VerificationRequest }) => {
    const statusConfig = getStatusConfig(item.status);
    const canEdit = item.status === 'PENDING' || item.status === 'REJECTED';
    const canDelete = item.status !== 'APPROVED';

    return (
      <View className="bg-white rounded-2xl mx-4 mb-3 p-4 shadow-sm border border-gray-100">
        {/* Header: Company + Status */}
        <View className="flex-row items-start">
          <View 
            className="w-12 h-12 rounded-xl items-center justify-center"
            style={{ backgroundColor: colors.primary + '15' }}
          >
            <Feather name="briefcase" size={22} color={colors.primary} />
          </View>

          <View className="flex-1 ml-3">
            <Text className="font-rubik-bold text-base text-gray-900">
              {item.companyName}
            </Text>
            <Text className="font-rubik text-xs text-gray-500 mt-0.5">
              {item.designation}
            </Text>
          </View>

          {/* Status Badge */}
          <View className={`px-2.5 py-1.5 rounded-full flex-row items-center ${statusConfig.bg} border ${statusConfig.border}`}>
            <Feather name={statusConfig.icon} size={10} color={statusConfig.text.replace('text-', '#')} />
            <Text className={`font-rubik-medium text-xs ml-1 ${statusConfig.text}`}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Employment Details */}
        <View className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
          {/* Employment Type */}
          <View className="flex-row justify-between mb-2">
            <View className="flex-row items-center">
              <Feather name="users" size={12} color="#64748B" />
              <Text className="font-rubik-medium text-xs text-gray-600 ml-1.5">
                {getEmploymentTypeLabel(item.employmentType)}
              </Text>
            </View>
          </View>

          {/* Dates */}
          <View className="flex-row justify-between">
            <View className="flex-row items-center">
              <Feather name="calendar" size={12} color="#64748B" />
              <Text className="font-rubik text-xs text-gray-500 ml-1.5">
                Start: {formatDate(item.startDate)}
              </Text>
            </View>
            {item.endDate && (
              <View className="flex-row items-center">
                <Feather name="calendar" size={12} color="#64748B" />
                <Text className="font-rubik text-xs text-gray-500 ml-1.5">
                  End: {formatDate(item.endDate)}
                </Text>
              </View>
            )}
          </View>

          {/* HR Email */}
          <View className="mt-2 pt-2 border-t border-gray-200">
            <Text className="font-rubik text-xs text-gray-400">HR Contact</Text>
            <Text className="font-rubik-medium text-xs text-gray-700 mt-0.5">
              {item.hrEmail}
            </Text>
          </View>
        </View>

        {/* Request Info */}
        <View className="flex-row items-center mt-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
          <Feather name="clock" size={14} color="#94A3B8" />
          <Text className="font-rubik text-xs text-gray-600 ml-2 flex-1">
            Requested {getTimeAgo(item.requestedAt)}
          </Text>
        </View>

        {/* Comments/Feedback - if available */}
        {item.comments && (
          <View className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
            <Text className="font-rubik-medium text-xs text-red-700">
              Feedback: {item.comments}
            </Text>
            {item.status === 'REJECTED' && (
              <TouchableOpacity 
                onPress={() => handleResubmit(item)}
                className="mt-2"
              >
                <Text className="font-rubik-medium text-xs text-red-600">
                  Tap to resubmit →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row justify-end items-center mt-4 gap-2">
          <TouchableOpacity
            className="flex-row items-center bg-gray-100 px-3.5 py-2 rounded-xl border border-gray-200"
            onPress={() => handlePreview(item)}
          >
            <Feather name="eye" size={14} color="#64748B" />
            <Text className="font-rubik-medium text-xs text-gray-600 ml-1.5">
              View
            </Text>
          </TouchableOpacity>

          {canEdit && (
            <TouchableOpacity
              className="flex-row items-center px-3.5 py-2 rounded-xl border"
              style={{ 
                backgroundColor: colors.primary + '12',
                borderColor: colors.primary + '40'
              }}
              onPress={() => handleEdit(item)}
            >
              <Feather name="edit-2" size={14} color={colors.primary} />
              <Text className="font-rubik-medium text-xs ml-1.5" style={{ color: colors.primary }}>
                Edit
              </Text>
            </TouchableOpacity>
          )}

          {canDelete && (
            <TouchableOpacity
              className="flex-row items-center bg-red-50 px-3.5 py-2 rounded-xl border border-red-200"
              onPress={() => handleDelete(item.verificationRequestId)}
            >
              <Feather name="trash-2" size={14} color="#DC2626" />
              <Text className="font-rubik-medium text-xs text-red-600 ml-1.5">
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Status Filter Component
  const renderStatusFilter = () => (
    <View className="px-4 mt-3 mb-4">
      <FlatList
        horizontal
        data={statusFilters}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.value}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedStatus(item.value)}
            className={`px-4 py-2 rounded-full mr-2 border`}
            style={{
              backgroundColor: selectedStatus === item.value ? colors.primary : '#F1F5F9',
              borderColor: selectedStatus === item.value ? colors.primary : '#E2E8F0',
            }}
          >
            <Text
              className="font-rubik-medium text-sm"
              style={{ color: selectedStatus === item.value ? '#FFFFFF' : '#64748B' }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderHeader = () => (
    <View className="px-4 pt-4 pb-2">
      <SearchInput
        value={searchQuery}
        placeholder="Search by company, designation, or HR email..."
        onChangeText={handleSearchChange}
        onSearch={() => setDebouncedSearchQuery(searchQuery)}
        onClear={clearSearch}
      />

      {/* Status Filter */}
      {renderStatusFilter()}

      {/* Header with count and create button */}
      {totalItems > 0 && (
        <View className="flex-row justify-between items-center mt-4 mb-1">
          <Text className="font-rubik text-xs text-gray-400">
            {totalItems} verification{totalItems !== 1 ? 's' : ''}
          </Text>

          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            className="flex-row items-center px-3 py-1.5 rounded-xl border"
            style={{
              backgroundColor: colors.primary + '12',
              borderColor: colors.primary + '40',
            }}
          >
            <Feather name="plus" size={14} color={colors.primary} />
            <Text className="font-rubik-medium text-sm ml-1.5" style={{ color: colors.primary }}>
              New Request
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View className="flex-1 items-center justify-center px-8 py-16">
        <View className="w-20 h-20 rounded-2xl bg-gray-100 items-center justify-center mb-4">
          <Feather name="file-text" size={36} color="#CBD5E1" />
        </View>
        <Text className="font-rubik-bold text-lg text-gray-900 text-center">
          {searchQuery ? 'No verifications found' : 'No verification requests'}
        </Text>
        <Text className="font-rubik text-sm text-gray-400 text-center mt-2 leading-5">
          {searchQuery
            ? `No requests matching "${searchQuery}"`
            : 'Submit your first employment verification request to get started'}
        </Text>
        {!searchQuery && (
          <Button
            title="Create Verification Request"
            className="mt-4"
            onPress={() => setIsModalVisible(true)}
          />
        )}
      </View>
    );
  };

  if (isLoading && verifications.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header title="My Verifications" />
        <Loader fullScreen />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="My Verifications" />

      <FlatList
        data={verifications}
        renderItem={renderVerificationCard}
        keyExtractor={(item) => item.verificationRequestId}
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

      {/* Create New Verification Modal */}
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
            className="flex-1 bg-black/45"
            activeOpacity={1}
            onPress={() => setIsModalVisible(false)}
          >
            <View className="flex-1 justify-end">
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
                className="bg-white rounded-t-3xl shadow-lg max-h-[90%]"
              >
                {/* Modal handle bar */}
                <View className="items-center pt-3">
                  <View className="w-9 h-1 rounded-full bg-gray-200" />
                </View>

                {/* Modal header */}
                <View className="flex-row justify-between items-center px-6 pt-4 pb-4 border-b border-gray-100">
                  <View>
                    <Text className="font-rubik-bold text-xl text-gray-900">
                      New Verification Request
                    </Text>
                    <Text className="font-rubik text-xs text-gray-400 mt-0.5">
                      Submit employment details for verification
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsModalVisible(false)}
                    className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center"
                  >
                    <Feather name="x" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Form */}
                <VerificationRequestForm
                  onSubmit={handleSubmitVerificationRequest}
                  onCancel={() => setIsModalVisible(false)}
                  isLoading={isSubmitting}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Verification Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <TouchableOpacity
            className="flex-1 bg-black/45"
            activeOpacity={1}
            onPress={() => {
              setIsEditModalVisible(false);
              setSelectedVerification(null);
            }}
          >
            <View className="flex-1 justify-end">
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
                className="bg-white rounded-t-3xl shadow-lg max-h-[90%]"
              >
                {/* Modal handle bar */}
                <View className="items-center pt-3">
                  <View className="w-9 h-1 rounded-full bg-gray-200" />
                </View>

                {/* Modal header */}
                <View className="flex-row justify-between items-center px-6 pt-4 pb-4 border-b border-gray-100">
                  <View>
                    <Text className="font-rubik-bold text-xl text-gray-900">
                      Edit Verification Request
                    </Text>
                    <Text className="font-rubik text-xs text-gray-400 mt-0.5">
                      Update your employment details
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setIsEditModalVisible(false);
                      setSelectedVerification(null);
                    }}
                    className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center"
                  >
                    <Feather name="x" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Edit Form */}
                {selectedVerification && (
                  <VerificationRequestForm
                    onSubmit={handleUpdateVerificationRequest}
                    onCancel={() => {
                      setIsEditModalVisible(false);
                      setSelectedVerification(null);
                    }}
                    isLoading={isSubmitting}
                    // You'll need to map your verification data to the form's expected format
                    // initialData={mapVerificationToFormData(selectedVerification)}
                    isEdit={true}
                  />
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default EmployeeVerification;