// IncomingVerificationRequests.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
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

const IncomingVerificationRequests: React.FC = () => {
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
    fetchIncomingVerifications(1, true);
  }, [debouncedSearchQuery, selectedStatus]);

  const fetchIncomingVerifications = async (page: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      // Build query params with view=incoming
      const params: any = {
        view: 'incoming',
        page,
        limit: 10,
      };

      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery;
      }

      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      // Make API call with incoming view
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
        text2: error.response?.data?.message || 'Unable to fetch incoming verification requests',
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
    fetchIncomingVerifications(1, true);
  }, [debouncedSearchQuery, selectedStatus]);

  const handleLoadMore = () => {
    if (hasNextPage && !isLoadingMore && !isLoading) {
      fetchIncomingVerifications(currentPage + 1, false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
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

      {/* Header with count only - No create button */}
      {totalItems > 0 && (
        <View className="flex-row justify-between items-center mt-4 mb-1">
          <Text className="font-rubik text-xs text-gray-400">
            {totalItems} incoming verification{totalItems !== 1 ? 's' : ''}
          </Text>
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
          <Feather name="inbox" size={36} color="#CBD5E1" />
        </View>
        <Text className="font-rubik-bold text-lg text-gray-900 text-center">
          {searchQuery ? 'No incoming verifications found' : 'No incoming verification requests'}
        </Text>
        <Text className="font-rubik text-sm text-gray-400 text-center mt-2 leading-5">
          {searchQuery
            ? `No requests matching "${searchQuery}"`
            : 'There are no verification requests pending for your review'}
        </Text>
      </View>
    );
  };

  if (isLoading && verifications.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header title="Incoming Verifications" />
        <Loader fullScreen />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Incoming Verifications" />

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

export default IncomingVerificationRequests;