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

interface TeamResponse {
  success: boolean;
  message: string;
  data: {
    members: TeamMember[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

interface AddMemberData {
  firstName: string;
  lastName: string;
  email: string;
  role: 'hr'; // Fixed to only allow hr role
}

const TeamManagementScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  // Check if current user is HR or Admin (only they can add members)
  const canAddMember = user?.role === 'hr' || user?.role === 'admin';
  
  // State for team members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  
  // Form state for add member - default role is hr
  const [formData, setFormData] = useState<AddMemberData>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'hr', // Always hr
  });
  
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AddMemberData, string>>>({});

  // Debounce search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Fetch team members when search or pagination changes
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

      console.log('API Response:', response.data);

      const members = response?.data?.members || [];
const pagination = response?.data?.pagination || {};

console.log("Extracted Members:", members);

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

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof AddMemberData, string>> = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddMember = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsAddingMember(true);
      
      // Role is always 'hr' so no need to include it in the request if not required
      // But if API requires role, it's already set in formData
      const response = await http.post('/api/organization/team', formData);
      

        Toast.show({
          type: 'success',
          text1: 'Member Added',
          text2: `${formData.firstName} ${formData.lastName} has been added to the team`,
        });
        
        // Reset form and close modal
        resetForm();
        setIsModalVisible(false);
        
        handleRefresh();
        
    } catch (error: any) {
      console.error('Error adding team member:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Add Member',
        text2: error.response?.data?.message || 'Unable to add team member',
      });
    } finally {
      setIsAddingMember(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'hr', // Always hr
    });
    setFormErrors({});
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    resetForm();
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  console.log('Team Members state:', teamMembers); // Add this to debug

  const renderTeamMember = ({ item }: { item: TeamMember }) => {
    const roleBadge = getRoleBadgeColor(item.role);
    const fullName = `${item.firstName} ${item.lastName}`.trim();
    const isCurrentUser = item.email === user?.email;
    
    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 mb-3 mx-4"
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
        }}
        onPress={() => {
          // Handle member press (view details, edit, etc.)
          Toast.show({
            type: 'info',
            text1: fullName,
            text2: `Role: ${item.role}${isCurrentUser ? ' (You)' : ''}`,
          });
        }}
      >
        <View className="flex-row items-center">
          <Avatar
            size="lg"
            // initials={getInitials(item.firstName, item.lastName)}
          />
          
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
            
            <View className="flex-row items-center mt-2">
              
              
              <View className="flex-row items-center">
                <View
                  className={`w-2 h-2 rounded-full ${
                    item.isActive ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <Text className="font-rubik text-gray-400 text-xs ml-1">
                  {item.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            {/* {item.isEmailVerified && (
              <View className="">
                <Icon name="check-decagram" size={16} color="#3B82F6" />
              </View>
            )} */}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View className="px-4 pt-4 pb-2">
      {/* Search Bar */}
      <View className="flex-row items-center bg-white rounded-xl px-4 py-2 mb-4">
        <Icon name="magnify" size={20} color="#9CA3AF" />
        <TextInput
          className="flex-1 ml-2 font-rubik text-gray-900"
          placeholder="Search team members..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <Icon name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      {totalItems > 0 && (
        <View className="flex-row justify-between items-center mb-2">
          <Text className="font-rubik text-gray-500 text-sm">
            {totalItems} team member{totalItems !== 1 ? 's' : ''}
          </Text>
          {canAddMember && (
            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
              className="flex-row items-center"
            >
              <Icon name="account-plus" size={20} color={colors.primary} />
              <Text className="font-rubik-medium text-primary-500 ml-1">
                Add
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
            : 'Add your first team member to get started'}
        </Text>
        {!searchQuery && canAddMember && (
          <Button
            title="Add Member"
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
      <Header
        title="HR Management"
        // rightComponent={
        //   canAddMember ? (
        //     <TouchableOpacity
        //       onPress={() => setIsModalVisible(true)}
        //       className="mr-4"
        //     >
        //       <Icon name="account-plus" size={24} color={colors.primary} />
        //     </TouchableOpacity>
        //   ) : undefined
        // }
      />

      

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

      {/* Add Member Modal - Only shown if user can add members */}
      {canAddMember && (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <TouchableOpacity
              className="flex-1 bg-black/50"
              activeOpacity={1}
              onPress={handleCloseModal}
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
                  {/* Modal Header */}
                  <View className="flex-row justify-between items-center p-6 border-b border-gray-100">
                    <Text className="font-rubik-bold text-gray-900 text-xl">
                      Add Team Member
                    </Text>
                    <TouchableOpacity onPress={handleCloseModal}>
                      <Icon name="close" size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView className="max-h-[70%] p-6">
                    {/* Form Fields */}
                    <Input
                      label="First Name"
                      value={formData.firstName}
                      onChangeText={(text) => {
                        setFormData({ ...formData, firstName: text });
                        if (formErrors.firstName) {
                          setFormErrors({ ...formErrors, firstName: undefined });
                        }
                      }}
                      placeholder="Enter first name"
                      error={formErrors.firstName}
                      className="mb-4"
                    />

                    <Input
                      label="Last Name"
                      value={formData.lastName}
                      onChangeText={(text) => {
                        setFormData({ ...formData, lastName: text });
                        if (formErrors.lastName) {
                          setFormErrors({ ...formErrors, lastName: undefined });
                        }
                      }}
                      placeholder="Enter last name"
                      error={formErrors.lastName}
                      className="mb-4"
                    />

                    <Input
                      label="Email"
                      value={formData.email}
                      onChangeText={(text) => {
                        setFormData({ ...formData, email: text });
                        if (formErrors.email) {
                          setFormErrors({ ...formErrors, email: undefined });
                        }
                      }}
                      placeholder="Enter email address"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      error={formErrors.email}
                      className="mb-4"
                    />

                    {/* Hidden role field - always hr */}
                    {/* Removed role selection UI as per requirement */}

                    {/* Action Buttons */}
                    <View className="flex-row gap-4 mb-6">
                      <Button
                        title="Cancel"
                        variant="outline"
                        className="flex-1"
                        onPress={handleCloseModal}
                        disabled={isAddingMember}
                      />
                      <Button
                        title="Add Member"
                        className="flex-1"
                        loading={isAddingMember}
                        onPress={handleAddMember}
                      />
                    </View>
                  </ScrollView>
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