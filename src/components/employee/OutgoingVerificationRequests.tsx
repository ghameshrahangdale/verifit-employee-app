// OutgoingVerificationRequests.tsx
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
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Toast from 'react-native-toast-message';
import http from '../../services/http.api';
import Loader from '../../components/ui/Loader';
import SearchInput from '../../components/ui/SearchInput';
import VerificationRequestForm, { VerificationFormData, DocumentFile } from './VerificationRequestForm';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/AppStackNavigator';
import { isEmployee, ROLES } from '../../constants/roles';
import { formatDate, getEmploymentTypeLabel, getStatusConfig } from '../../utils/verificationHelpers';
import ConfirmationPopup from '../ui/ConfirmationPopup';
import VerificationCard from './VerificationCard';

// Update the VerificationRequest interface based on API response
interface VerificationRequest {
  candidate: any;
  verificationRequestId: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'DISCREPANCIES';
  requestedAt: string;
  employmentRecordId: string;
  companyName: string;
  designation: string;
  employmentType: string;
  startDate: string;
  endDate?: string;
  hrEmail: string;
  comments?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  documentName?: string;
  documentNumber?: string;
  fileSize?: string;
}

const OutgoingVerificationRequests: React.FC = () => {
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
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    visible: boolean;
    id: string | null;
  }>({
    visible: false,
    id: null,
  });

  // Status filter options - matching API status values
  const statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Discrepancies', value: 'DISCREPANCIES' },
    { label: 'Verified', value: 'VERIFIED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    fetchOutgoingVerifications(1, true);
  }, [debouncedSearchQuery, selectedStatus]);

  const fetchOutgoingVerifications = async (page: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      // Build query params with view=outgoing
      const params: any = {
        view: 'outgoing',
        page,
        limit: 10,
      };

      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery;
      }

      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      // Make API call with outgoing view
      const response = await http.get('/api/verification/employee/create-request', { params });

      console.log(response);
      if (response.data.data) {
        const fetchedData = response?.data?.data;
        console.log(fetchedData)

        setVerifications(prev =>
          reset ? fetchedData : [...prev, ...fetchedData]
        );

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
        text2: error.response?.data?.message || 'Unable to fetch outgoing verification requests',
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
    fetchOutgoingVerifications(1, true);
  }, [debouncedSearchQuery, selectedStatus]);

  const handleLoadMore = () => {
    if (hasNextPage && !isLoadingMore && !isLoading) {
      fetchOutgoingVerifications(currentPage + 1, false);
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
    navigation.navigate('ViewVerification', { verificationId: verification.verificationRequestId });
  };
  
  const handleReview = (verification: VerificationRequest) => {
    navigation.navigate('HrReviewVerification', { verificationId: verification.verificationRequestId });
  };

  const handleDelete = (id: string) => {
    // Find the verification to check its status
    const verification = verifications.find(v => v.verificationRequestId === id);
    if (verification?.status === 'VERIFIED') {
      Toast.show({
        type: 'error',
        text1: 'Cannot Delete',
        text2: 'Approved verifications cannot be deleted',
      });
      return;
    }

    // Show confirmation popup
    setDeleteConfirmation({
      visible: true,
      id: id,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.id) return;

    try {
      // Make API call to delete using the correct endpoint
      await http.delete(`/api/verification/employee/create-request/${deleteConfirmation.id}`);

      setVerifications(prev => prev.filter(v => v.verificationRequestId !== deleteConfirmation.id));
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
    } finally {
      setDeleteConfirmation({ visible: false, id: null });
    }
  };

  const handleResubmit = (verification: VerificationRequest) => {
    setSelectedVerification(verification);
    setIsEditModalVisible(true);
  };

  const handleEdit = (verification: VerificationRequest) => {
    navigation.navigate('EditVerification', {
      verificationId: verification.verificationRequestId
    });
  };

  // Verification Card Component
  const renderVerificationCard = ({ item }: { item: VerificationRequest }) => (
    <VerificationCard
      item={item}
      userRole={user?.role}
      onPreview={handlePreview}
      onReview={handleReview}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onResubmit={handleResubmit}
    />
  );

  // Status Filter Component
  const renderStatusFilter = () => (
    <View className="mt-3 mb-4">
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
            {totalItems} outgoing verification{totalItems !== 1 ? 's' : ''}
          </Text>
          {isEmployee(user?.role) && (
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
          )}
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
          <Feather name="send" size={36} color="#CBD5E1" />
        </View>
        <Text className="font-rubik-bold text-lg text-gray-900 text-center">
          {searchQuery ? 'No outgoing verifications found' : 'No outgoing verification requests'}
        </Text>
        <Text className="font-rubik text-sm text-gray-400 text-center mt-2 leading-5">
          {searchQuery
            ? `No requests matching "${searchQuery}"`
            : 'Submit your first employment verification request to get started'}
        </Text>
        {!searchQuery && isEmployee(user?.role) && (
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
        <Header title="Outgoing Verifications" />
        <Loader fullScreen />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Outgoing Verifications" />

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

      {/* Delete Confirmation Popup */}
      <ConfirmationPopup
        visible={deleteConfirmation.visible}
        title="Delete Verification Request"
        message="Are you sure you want to delete this verification request? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmation({ visible: false, id: null })}
      />

    </View>
  );
};

export default OutgoingVerificationRequests;