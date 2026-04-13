// VerificationList.tsx
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
import Button from '../components/ui/Button';
import Toast from 'react-native-toast-message';
import http from '../services/http.api';
import Loader from '../components/ui/Loader';
import SearchInput from '../components/ui/SearchInput';
import VerificationRequestForm, { VerificationFormData, DocumentFile } from '../components/employee/VerificationRequestForm';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { AppStackParamList } from '../navigation/AppStackNavigator';
import { isEmployee } from '../constants/roles';
import ConfirmationPopup from '../components/ui/ConfirmationPopup';
import VerificationCard from '../components/employee/VerificationCard';

// Types
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

type ViewType = 'my' | 'incoming' | 'outgoing' | 'all';

interface VerificationListProps {
  viewType: ViewType;
  title: string;
  showCreateButton?: boolean;
  showRejectAction?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyMessage?: string;
}

const statusFilters = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Discrepancies', value: 'DISCREPANCIES' },
  { label: 'Verified', value: 'VERIFIED' },
  { label: 'Rejected', value: 'REJECTED' },
];

// Helper to get view-specific config
const getViewConfig = (viewType: ViewType) => {
  const configs = {
    my: {
      emptyIcon: 'file-text',
      emptyTitle: 'No verification requests',
      emptyMessage: 'Submit your first employment verification request to get started',
      showCreateButton: true,
      showRejectAction: false,
      searchPlaceholder: 'Search by company, designation, or HR...',
    },
    incoming: {
      emptyIcon: 'inbox',
      emptyTitle: 'No incoming verification requests',
      emptyMessage: 'There are no verification requests pending for your review',
      showCreateButton: false,
      showRejectAction: true,
      searchPlaceholder: 'Search by company, designation, or HR email...',
    },
    outgoing: {
      emptyIcon: 'send',
      emptyTitle: 'No outgoing verification requests',
      emptyMessage: 'Submit your first employment verification request to get started',
      showCreateButton: true,
      showRejectAction: false,
      searchPlaceholder: 'Search by company, designation, or HR email...',
    },
    all: {
      emptyIcon: 'file-text',
      emptyTitle: 'No verification requests',
      emptyMessage: 'No verification requests found',
      showCreateButton: true,
      showRejectAction: false,
      searchPlaceholder: 'Search by company, designation, or HR...',
    },
  };
  return configs[viewType];
};

const VerificationList: React.FC<VerificationListProps> = ({
  viewType,
  title,
  showCreateButton: propShowCreateButton,
  showRejectAction: propShowRejectAction,
  emptyIcon: propEmptyIcon,
  emptyTitle: propEmptyTitle,
  emptyMessage: propEmptyMessage,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const viewConfig = getViewConfig(viewType);

  const showCreateButton = propShowCreateButton ?? viewConfig.showCreateButton;
  const showRejectAction = propShowRejectAction ?? viewConfig.showRejectAction;

  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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
  }>({ visible: false, id: null });
  const [rejectConfirmation, setRejectConfirmation] = useState<{
    visible: boolean;
    item: VerificationRequest | null;
  }>({ visible: false, item: null });

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    fetchVerifications(1, true);
  }, [debouncedSearchQuery, selectedStatus]);

  const fetchVerifications = async (page: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const params: any = {
        view: viewType === 'all' ? 'all' : viewType,
        page,
        limit: 10,
      };

      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery;
      }

      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      const response = await http.get('/api/verification/employee/create-request', { params });

      if (response.data.data) {
        const fetchedData = response?.data?.data;
        setVerifications(prev => reset ? fetchedData : [...prev, ...fetchedData]);

        const total = response.headers?.['x-total-count'] || fetchedData.length;
        const limit = 10;

        setTotalItems(total);
        setHasNextPage(fetchedData.length === limit);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Verifications',
        text2: error.response?.data?.message || `Unable to fetch ${viewType} verification requests`,
      });

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
    fetchVerifications(1, true);
  }, [debouncedSearchQuery, selectedStatus]);

  const handleLoadMore = () => {
    if (hasNextPage && !isLoadingMore && !isLoading) {
      fetchVerifications(currentPage + 1, false);
    }
  };

  const handleSubmitVerificationRequest = async (data: VerificationFormData, documents: DocumentFile[]) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));

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
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Toast.show({ type: 'success', text1: 'Success', text2: 'Verification request submitted successfully' });
      setIsModalVisible(false);
      handleRefresh();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error.response?.data?.message || 'Failed to submit verification request',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateVerificationRequest = async (data: VerificationFormData) => {
    if (!selectedVerification) return;
    setIsSubmitting(true);
    try {
      await http.put(`/api/verification/employee/${selectedVerification.verificationRequestId}`, data);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Verification request updated successfully' });
      setIsEditModalVisible(false);
      setSelectedVerification(null);
      handleRefresh();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.response?.data?.message || 'Failed to update verification request',
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.id) return;
    try {
      await http.delete(`/api/verification/employee/create-request/${deleteConfirmation.id}`);
      setVerifications(prev => prev.filter(v => v.verificationRequestId !== deleteConfirmation.id));
      Toast.show({ type: 'success', text1: 'Verification Deleted', text2: 'Your verification request has been removed' });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Delete Failed', text2: error.response?.data?.message || 'Failed to delete verification request' });
    } finally {
      setDeleteConfirmation({ visible: false, id: null });
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectConfirmation.item) return;
    setIsSubmitting(true);
    try {
      const payload = {
        employmentConfirmed: false,
        designationConfirmed: false,
        salaryConfirmed: false,
        tenureConfirmed: false,
        behaviorConfirmed: false,
        companyNameConfirmed: false,
        departmentConfirmed: false,
        employmentTypeConfirmed: false,
        locationConfirmed: false,
        startDateConfirmed: false,
        endDateConfirmed: false,
        documentsConfirmed: [],
        reasonForLeavingConfirmed: false,
        comments: "reject",
        discrepancies: []
      };

      await http.patch(`/api/verification/employee/create-request/${rejectConfirmation.item.verificationRequestId}`, payload);
      
      setVerifications(prev =>
        prev.map(v =>
          v.verificationRequestId === rejectConfirmation.item?.verificationRequestId
            ? { ...v, status: 'REJECTED', comments: 'reject' }
            : v
        )
      );

      Toast.show({ type: 'success', text1: 'Verification Rejected', text2: 'The verification request has been rejected successfully' });
      handleRefresh();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Rejection Failed', text2: error.response?.data?.message || 'Failed to reject verification request' });
    } finally {
      setIsSubmitting(false);
      setRejectConfirmation({ visible: false, item: null });
    }
  };

  const handlePreview = (verification: VerificationRequest) => {
    navigation.navigate('ViewVerification', { verificationId: verification.verificationRequestId });
  };

  const handleReview = (verification: VerificationRequest) => {
    navigation.navigate('VerifyRequestScreen', { verificationId: verification.verificationRequestId });
  };

  const handleDelete = (id: string) => {
    const verification = verifications.find(v => v.verificationRequestId === id);
    if (verification?.status === 'VERIFIED') {
      Toast.show({ type: 'error', text1: 'Cannot Delete', text2: 'Approved verifications cannot be deleted' });
      return;
    }
    setDeleteConfirmation({ visible: true, id });
  };

  const handleResubmit = (verification: VerificationRequest) => {
    setSelectedVerification(verification);
    setIsEditModalVisible(true);
  };

  const handleEdit = (verification: VerificationRequest) => {
    navigation.navigate('EditVerification', { verificationId: verification.verificationRequestId });
  };

  const handleReject = (verification: VerificationRequest) => {
    setRejectConfirmation({ visible: true, item: verification });
  };

  const renderVerificationCard = ({ item }: { item: VerificationRequest }) => (
    <VerificationCard
      item={item}
      userRole={user?.role}
      onPreview={handlePreview}
      onReview={handleReview}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onResubmit={handleResubmit}
      onReject={showRejectAction ? handleReject : undefined}
    />
  );

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
        placeholder={viewConfig.searchPlaceholder}
        onChangeText={setSearchQuery}
        onSearch={() => setDebouncedSearchQuery(searchQuery)}
        onClear={() => setSearchQuery('')}
      />
      {renderStatusFilter()}
      {totalItems > 0 && (
        <View className="flex-row justify-between items-center mt-4 mb-1">
          <Text className="font-rubik text-xs text-gray-400">
            {totalItems} {viewType} verification{totalItems !== 1 ? 's' : ''}
          </Text>
          {showCreateButton && isEmployee(user?.role) && (
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
          <Feather name={propEmptyIcon || viewConfig.emptyIcon} size={36} color="#CBD5E1" />
        </View>
        <Text className="font-rubik-bold text-lg text-gray-900 text-center">
          {searchQuery ? 'No verifications found' : (propEmptyTitle || viewConfig.emptyTitle)}
        </Text>
        <Text className="font-rubik text-sm text-gray-400 text-center mt-2 leading-5">
          {searchQuery
            ? `No requests matching "${searchQuery}"`
            : (propEmptyMessage || viewConfig.emptyMessage)}
        </Text>
        {!searchQuery && showCreateButton && (
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
        <Header title={title} />
        <Loader fullScreen />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header title={title} />

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
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      />

      {/* Create Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={() => setIsModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <TouchableOpacity className="flex-1 bg-black/45" activeOpacity={1} onPress={() => setIsModalVisible(false)}>
            <View className="flex-1 justify-end">
              <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} className="bg-white rounded-t-3xl shadow-lg max-h-[90%]">
                <View className="items-center pt-3">
                  <View className="w-9 h-1 rounded-full bg-gray-200" />
                </View>
                <View className="flex-row justify-between items-center px-6 pt-4 pb-4 border-b border-gray-100">
                  <View>
                    <Text className="font-rubik-bold text-xl text-gray-900">New Verification Request</Text>
                    <Text className="font-rubik text-xs text-gray-400 mt-0.5">Submit employment details for verification</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsModalVisible(false)} className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center">
                    <Feather name="x" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <VerificationRequestForm onSubmit={handleSubmitVerificationRequest} onCancel={() => setIsModalVisible(false)} isLoading={isSubmitting} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent onRequestClose={() => setIsEditModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <TouchableOpacity className="flex-1 bg-black/45" activeOpacity={1} onPress={() => { setIsEditModalVisible(false); setSelectedVerification(null); }}>
            <View className="flex-1 justify-end">
              <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} className="bg-white rounded-t-3xl shadow-lg max-h-[90%]">
                <View className="items-center pt-3">
                  <View className="w-9 h-1 rounded-full bg-gray-200" />
                </View>
                <View className="flex-row justify-between items-center px-6 pt-4 pb-4 border-b border-gray-100">
                  <View>
                    <Text className="font-rubik-bold text-xl text-gray-900">Edit Verification Request</Text>
                    <Text className="font-rubik text-xs text-gray-400 mt-0.5">Update your employment details</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setIsEditModalVisible(false); setSelectedVerification(null); }} className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center">
                    <Feather name="x" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
                {selectedVerification && (
                  <VerificationRequestForm
                    onSubmit={handleUpdateVerificationRequest}
                    onCancel={() => { setIsEditModalVisible(false); setSelectedVerification(null); }}
                    isLoading={isSubmitting}
                    isEdit={true}
                  />
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationPopup
        visible={deleteConfirmation.visible}
        title="Delete Verification Request"
        message="Are you sure you want to delete this verification request? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmation({ visible: false, id: null })}
      />

      {/* Reject Confirmation */}
      {showRejectAction && (
        <ConfirmationPopup
          visible={rejectConfirmation.visible}
          title="Reject Verification Request"
          message="Are you sure you want to reject this verification request? This action cannot be undone."
          confirmText="Reject"
          cancelText="Cancel"
          onConfirm={handleConfirmReject}
          onCancel={() => setRejectConfirmation({ visible: false, item: null })}
        />
      )}
    </View>
  );
};

export default VerificationList;