import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import Header from '../components/ui/Header';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import http from '../services/http.api';
import Loader from '../components/ui/Loader';
import { Switch } from 'react-native';
import InviteTeamMemberForm from '../components/InviteTeamMemberForm';
import SearchInput from '../components/ui/SearchInput';

interface TeamMember {
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
}

interface AddMemberData {
  firstName: string;
  lastName: string;
  email: string;
  role: 'hr';
}

const TeamManagementScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const canAddMember = user?.role === 'hr' || user?.role === 'admin';
  const isHR = user?.role === 'hr';

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
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
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    fetchTeamMembers(1, true);
  }, [debouncedSearchQuery]);

  const fetchTeamMembers = async (page: number = 1, reset: boolean = false) => {
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
          ...(debouncedSearchQuery ? { search: debouncedSearchQuery } : {}),
        },
      });

      const members = response?.data?.members || [];
      const pagination = response?.data?.pagination || {};

      setTeamMembers(prev =>
        reset ? members : [...prev, ...members]
      );

      setCurrentPage(pagination?.page || 1);
      setTotalPages(pagination?.totalPages || 1);
      setTotalItems(pagination?.total || members.length);
      setHasNextPage((pagination?.page || 1) < (pagination?.totalPages || 1));

    } catch (error: any) {
      console.error('Error fetching team members:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Team',
        text2: error.response?.data?.message || 'Unable to fetch team members',
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchTeamMembers(1, true);
  }, [debouncedSearchQuery]);

  const handleLoadMore = () => {
    if (hasNextPage && !isLoadingMore && !isLoading) {
      fetchTeamMembers(currentPage + 1, false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleAddMember = async (formData: AddMemberData) => {
    try {
      setIsAddingMember(true);
      const response = await http.post('/api/organization/team', formData);

      Toast.show({
        type: 'success',
        text1: 'Invitation Sent',
        text2: `An invitation has been sent to ${formData.firstName} ${formData.lastName}`,
      });

      setIsModalVisible(false);
      handleRefresh();

    } catch (error: any) {
      console.error('Error adding team member:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Send Invitation',
        text2: error.response?.data?.message || 'Unable to send invitation',
      });
      throw error;
    } finally {
      setIsAddingMember(false);
    }
  };

  const toggleMemberStatus = async (member: TeamMember) => {
    try {
      const newStatus = !member.isActive;

      setTeamMembers(prev =>
        prev.map(m =>
          m.id === member.id ? { ...m, isActive: newStatus } : m
        )
      );

      const response = await http.patch(`/api/organization/team`, {
        isActive: newStatus,
        userId: member.id
      });

      Toast.show({
        type: 'success',
        text1: response?.message || "Team member status updated",
        text2: `${member.firstName} ${member.lastName}`,
      });

    } catch (error: any) {
      setTeamMembers(prev =>
        prev.map(m =>
          m.id === member.id ? { ...m, isActive: !member.isActive } : m
        )
      );

      Toast.show({
        type: 'error',
        text1: 'Status Update Failed',
        text2: error.response?.data?.message || 'Unable to update status',
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'hr':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'accounts':
        return { bg: '#D1FAE5', text: '#065F46' };
      default:
        return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const renderTeamMember = ({ item }: { item: TeamMember }) => {
    const roleBadge = getRoleBadgeColor(item.role);
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
          borderColor: colors.primary + 30,
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
              <View
                className="px-3 py-1 rounded-full ml-2"
                style={{ backgroundColor: roleBadge.bg }}
              >
                <Text
                  className="font-rubik-medium text-xs"
                  style={{ color: roleBadge.text }}
                >
                  {item.role.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text className="font-rubik text-gray-500 text-sm mt-1">
              {item.email}
            </Text>

            <View className="flex-row items-center mt-2 justify-between">
              <View className="flex-row items-center">
                <View
                  className={`w-2 h-2 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                />
                <Text className="font-rubik text-gray-400 text-xs ml-1">
                  {item.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>

              {/* {(user?.role === 'admin' || user?.role === 'hr') && (
                <View className="flex-row items-center">
                  <Text className="font-rubik text-xs text-gray-500 mr-2">
                    {item.isActive ? 'Deactivate' : 'Activate'}
                  </Text>
                  <Switch
                    value={item.isActive}
                    onValueChange={() => toggleMemberStatus(item)}
                    trackColor={{ false: '#D1D5DB', true: colors.primary }}
                    thumbColor={'#ffffff'}
                  />
                </View>
              )} */}
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
        placeholder="Search team members..."
        onChangeText={handleSearchChange}
        onSearch={() => setDebouncedSearchQuery(searchQuery)}
        onClear={clearSearch}
      />

      {totalItems > 0 && (
        <View className="flex-row justify-between items-center mb-2 mt-2">
          <Text className="font-rubik text-gray-500 text-sm">
            {totalItems} team member{totalItems !== 1 ? 's' : ''}
          </Text>
          {canAddMember && !isHR && (
            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
              className="flex-row items-center bg-primary-50 px-4 py-2 rounded-full"
            >
              <Icon name="email-send-outline" size={20} color={colors.primary} />
              <Text className="font-rubik-medium text-primary-500 ml-1">
                Invite Member
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
        <Icon name="account-group-outline" size={64} color="#D1D5DB" />
        <Text className="font-rubik-bold text-gray-900 text-lg mt-4">
          {searchQuery ? 'No members found' : 'No team members yet'}
        </Text>
        <Text className="font-rubik text-gray-500 text-center mt-2">
          {searchQuery
            ? `No members matching "${searchQuery}"`
            : 'Invite your first team member to get started'}
        </Text>
        {!searchQuery && canAddMember && !isHR && (
          <Button
            title="Invite Member"
            className="mt-4"
            onPress={() => setIsModalVisible(true)}
          />
        )}
      </View>
    );
  };

  if (isLoading && teamMembers.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header title="HR Management" />
        <Loader fullScreen />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="HR Management" />

      <FlatList
        data={teamMembers}
        renderItem={renderTeamMember}
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

      {canAddMember && !isHR && (
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
                      Invite Team Member
                    </Text>
                    <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                      <Icon name="close" size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  <InviteTeamMemberForm
                    onSubmit={handleAddMember}
                    onCancel={() => setIsModalVisible(false)}
                    isLoading={isAddingMember}
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

export default TeamManagementScreen;