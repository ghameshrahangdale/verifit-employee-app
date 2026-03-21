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
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/ui/Header';
import Avatar from '../components/ui/Avatar';
import Toast from 'react-native-toast-message';
import http from '../services/http.api';
import Loader from '../components/ui/Loader';
import SearchInput from '../components/ui/SearchInput';
import ConfirmationPopup from '../components/ui/ConfirmationPopup';

interface Invitation {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'declined';
  inviteData: {
    department: string | null;
    designation: string | null;
    joiningDate: string | null;
  };
  respondedAt: string | null;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    logoUrl: string;
    city: string;
    state: string;
  };
}

interface StatusConfig {
  text: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

const PendingInvitationsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupConfig, setPopupConfig] = useState<{
    type: 'approve' | 'decline';
    invitationId: string;
  } | null>(null);

  // Status configuration function
  const getStatusConfig = (status: string): StatusConfig => {
    const statusMap: Record<string, StatusConfig> = {
      pending: {
        text: 'PENDING',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
      },
      approved: {
        text: 'APPROVED',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
      },
      rejected: {
        text: 'DECLINED',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
      },
      declined: {
        text: 'DECLINED',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
      },
    };

    return statusMap[status.toLowerCase()] || statusMap.pending;
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    fetchInvitations();
  }, [debouncedSearchQuery]);

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);

      const response = await http.get('/api/employees/approvals');

      const fetchedInvitations = response?.data || [];
      setInvitations(fetchedInvitations);

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
    fetchInvitations();
  }, [debouncedSearchQuery]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const showConfirmationPopup = (type: 'approve' | 'decline', invitationId: string) => {
    setPopupConfig({ type, invitationId });
    setPopupVisible(true);
  };

  const handleConfirmAction = async () => {
    if (!popupConfig) return;

    const { type, invitationId } = popupConfig;
    
    try {
      setProcessingId(invitationId);
      setPopupVisible(false);
      
      await http.patch('/api/employees/approvals', {
        approvalId: invitationId,
        action: type === 'approve' ? 'approve' : 'reject',
      });
      
      Toast.show({
        type: 'success',
        text1: type === 'approve' ? 'Invitation Approved' : 'Invitation Declined',
        text2: type === 'approve' 
          ? 'The employee can now join the organization' 
          : 'The invitation has been declined',
      });
      
      // Remove from list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: type === 'approve' ? 'Failed to Approve' : 'Failed to Decline',
        text2: error.response?.data?.message || `Unable to ${type} invitation`,
      });
    } finally {
      setProcessingId(null);
      setPopupConfig(null);
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
    });
  };

  const renderInvitationCard = ({ item }: { item: Invitation }) => {
    const isProcessing = processingId === item.id;
    const statusConfig = getStatusConfig(item.status);
    
    return (
      <View className="bg-white rounded-xl mx-4 mb-3 p-4 shadow-sm border border-slate-100">
        {/* Top Row: Avatar + Info */}
        <View className="flex-row items-start">
          {/* Organization Logo */}
          <View className="relative">
            <View className="overflow-hidden bg-primary/5">
              <Avatar 
                name={item.organization.name} 
                imageUrl={item.organization.logoUrl} 
                size="lg" 
                rounded='corners'
              />
            </View>
          </View>

          {/* Organization Details */}
          <View className="flex-1 ml-3">
            <Text className="font-rubik-bold text-[15px] text-slate-900 tracking-tight">
              {item.organization.name}
            </Text>
            <Text className="font-rubik text-xs text-slate-500 mt-1">
              {item.organization.city}, {item.organization.state}
            </Text>
          </View>

          {/* Status Badge */}
          <View className={`px-3 py-1.5 rounded-full ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
            <Text className={`font-rubik-medium text-[10px] tracking-wide ${statusConfig.textColor}`}>
              {statusConfig.text}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View className="h-px bg-slate-100 my-3" />

        {/* Invitation Details */}
        <View className="flex-row flex-wrap gap-y-2 mb-3">
          {item.inviteData.designation && (
            <View className="flex-row items-center w-1/2">
              <Feather name="briefcase" size={12} color="#94A3B8" />
              <Text className="font-rubik text-xs text-slate-600 ml-1.5">
                {item.inviteData.designation}
              </Text>
            </View>
          )}
          {item.inviteData.department && (
            <View className="flex-row items-center w-1/2">
              <Feather name="users" size={12} color="#94A3B8" />
              <Text className="font-rubik text-xs text-slate-600 ml-1.5">
                {item.inviteData.department}
              </Text>
            </View>
          )}
          <View className="flex-row items-center w-1/2">
            <Feather name="calendar" size={12} color="#94A3B8" />
            <Text className="font-rubik text-xs text-slate-600 ml-1.5">
              Invited: {formatDate(item.createdAt)}
            </Text>
          </View>
          {item.inviteData.joiningDate && (
            <View className="flex-row items-center w-1/2">
              <Feather name="clock" size={12} color="#94A3B8" />
              <Text className="font-rubik text-xs text-slate-600 ml-1.5">
                Joins: {formatDate(item.inviteData.joiningDate)}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons - Only show for pending status */}
        {item.status === 'pending' && (
          <View className="flex-row gap-3 mt-1">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-green-50 py-3 rounded-xl border border-green-200"
              onPress={() => showConfirmationPopup('approve', item.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#16A34A" />
              ) : (
                <>
                  <Feather name="check-circle" size={16} color="#16A34A" />
                  <Text className="font-rubik-medium text-sm text-green-700 ml-2">
                    Accept
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center bg-red-50 py-3 rounded-xl border border-red-200"
              onPress={() => showConfirmationPopup('decline', item.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#DC2626" />
              ) : (
                <>
                  <Feather name="x-circle" size={16} color="#DC2626" />
                  <Text className="font-rubik-medium text-sm text-red-700 ml-2">
                    Decline
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View className="px-4 pt-4 pb-2">
      <SearchInput
        value={searchQuery}
        placeholder="Search by organization name..."
        onChangeText={handleSearchChange}
        onSearch={() => setDebouncedSearchQuery(searchQuery)}
        onClear={clearSearch}
      />
      {invitations.length > 0 && (
        <View className="flex-row justify-between items-center mt-4 mb-1">
          <Text className="font-rubik text-xs text-slate-400 tracking-wide">
            {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View className="flex-1 items-center justify-center py-16 px-8">
        <View className="w-20 h-20 rounded-2xl bg-slate-100 items-center justify-center mb-4">
          <Feather name="inbox" size={36} color="#CBD5E1" />
        </View>
        <Text className="font-rubik-bold text-lg text-slate-900 text-center">
          {searchQuery ? 'No invitations found' : 'No pending invitations'}
        </Text>
        <Text className="font-rubik text-sm text-slate-400 text-center mt-2 leading-5">
          {searchQuery
            ? `No invitations matching "${searchQuery}"`
            : 'All invitations have been processed'}
        </Text>
      </View>
    );
  };

  if (isLoading && invitations.length === 0) {
    return (
      <View className="flex-1 bg-slate-50">
        <Header title="Pending Invitations" />
        <Loader fullScreen />
      </View>
    );
  }

  return (
    <>
      <View className="flex-1 bg-slate-50">
        <Header title="Pending Invitations" />

        <FlatList
          data={invitations}
          renderItem={renderInvitationCard}
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 100,
          }}
        />
      </View>

      <ConfirmationPopup
        visible={popupVisible}
        title={popupConfig?.type === 'approve' ? 'Approve Invitation' : 'Decline Invitation'}
        message={popupConfig?.type === 'approve' 
          ? 'Are you sure you want to approve this invitation?' 
          : 'Are you sure you want to decline this invitation?'}
        confirmText={popupConfig?.type === 'approve' ? 'Approve' : 'Decline'}
        cancelText="Cancel"
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </>
  );
};

export default PendingInvitationsScreen;