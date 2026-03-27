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
import Toast from 'react-native-toast-message';
import http from '../services/http.api';
import Loader from '../components/ui/Loader';
import SearchInput from '../components/ui/SearchInput';
import ConfirmationPopup from '../components/ui/ConfirmationPopup';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';

interface SubOrganization {
  adminFirstName: string;
  adminLastName: string;
  adminMobile: React.JSX.Element;
  id: string;
  name: string;
  businessEmail: string;
  city: string;
  state: string;
  country: string;
  mobileNumber: string | null;
  companyWebsite: string | null;
  address: string | null;
  companyType: string | null;
  companySize: string | null;
  logoUrl: string | null;
  logoStoragePath: string | null;
  isOnboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
  parentOrganizationId: string;
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

const SubOrganizationsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();

  // Check if user can add sub-organizations (only admin)
  const canAddSubOrg = user?.role === 'admin';

  const [subOrganizations, setSubOrganizations] = useState<SubOrganization[]>([]);
  const [filteredSubOrganizations, setFilteredSubOrganizations] = useState<SubOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedSubOrg, setSelectedSubOrg] = useState<SubOrganization | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupConfig, setPopupConfig] = useState<{
    type: 'delete';
    subOrgId: string;
    name: string;
  } | null>(null);

  // State for Add Sub-Organization Modal
  const [isAddSubOrgModalVisible, setIsAddSubOrgModalVisible] = useState(false);
  const [isAddingSubOrg, setIsAddingSubOrg] = useState(false);

  // Fetch sub-organizations
  const fetchSubOrganizations = async () => {
    try {
      setIsLoading(true);
      const response = await http.get('/api/organization/sub-organizations');
      
      // The response structure: { success: true, message: string, data: SubOrganization[] }
      const fetchedSubOrgs = response.data || [];
      setSubOrganizations(fetchedSubOrgs);
      setFilteredSubOrganizations(fetchedSubOrgs);
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

  // Filter sub-organizations based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSubOrganizations(subOrganizations);
    } else {
      const filtered = subOrganizations.filter(org => 
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.businessEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.country?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSubOrganizations(filtered);
    }
  }, [searchQuery, subOrganizations]);

  useEffect(() => {
    fetchSubOrganizations();
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchSubOrganizations();
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
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
      fetchSubOrganizations(); // Refresh the list
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

  const showConfirmationPopup = (type: 'delete', subOrgId: string, name: string) => {
    setPopupConfig({ type, subOrgId, name });
    setPopupVisible(true);
  };

  const handleDeleteSubOrganization = async () => {
    if (!popupConfig) return;

    try {
      setProcessingId(popupConfig.subOrgId);
      setPopupVisible(false);

      await http.delete(`/api/organization/sub-organizations/${popupConfig.subOrgId}`);

      Toast.show({
        type: 'success',
        text1: 'Sub-Organization Deleted',
        text2: `${popupConfig.name} has been deleted successfully`,
      });

      fetchSubOrganizations();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Delete Sub-Organization',
        text2: error.response?.data?.message || 'Unable to delete sub-organization',
      });
    } finally {
      setProcessingId(null);
      setPopupConfig(null);
    }
  };

  const handleConfirmAction = () => {
    if (popupConfig?.type === 'delete') {
      handleDeleteSubOrganization();
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

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderSubOrganizationCard = ({ item }: { item: SubOrganization }) => {
  const isProcessing = processingId === item.id;
  
  // Get admin full name
  const adminFullName = `${item.adminFirstName || ''} ${item.adminLastName || ''}`.trim();

  return (
    <TouchableOpacity
      className="bg-white rounded-xl mx-4 mb-3 p-4 shadow-sm border border-slate-100"
      onPress={() => {
        setSelectedSubOrg(item);
        setDetailsModalVisible(true);
      }}
      activeOpacity={0.7}
    >
      {/* Top Row: Avatar + Info */}
      <View className="flex-row items-start">
        {/* Avatar Component */}
        <Avatar
          imageUrl={item.logoUrl}
          size="lg"
          rounded="corners"
        />

        {/* Organization Details */}
        <View className="flex-1 ml-3">
          <Text className="font-rubik-bold text-[15px] text-slate-900 tracking-tight">
            {item.name}
          </Text>
          <Text className="font-rubik text-xs text-slate-500 mt-0.5">
            {item.businessEmail}
          </Text>
        </View>

        {/* Status Badge - Based on onboarding completion */}
        <View className={`px-2 py-1 rounded-full ${item.isOnboardingComplete ? 'bg-green-50' : 'bg-amber-50'}`}>
          <Text className={`font-rubik-medium text-xs ${item.isOnboardingComplete ? 'text-green-700' : 'text-amber-700'}`}>
            {item.isOnboardingComplete ? 'COMPLETED' : 'PENDING'}
          </Text>
        </View>
      </View>

      {/* Admin Contact Information */}
      {adminFullName && (
        <View className="mt-3 pt-1">
          <View className="flex-row items-center mb-1.5">
            <Feather name="user" size={12} color="#94A3B8" />
            <Text className="font-rubik text-xs text-slate-700 ml-1.5">
              {adminFullName}
            </Text>
          </View>
          {item.adminMobile && (
            <View className="flex-row items-center mb-1.5">
              <Feather name="phone" size={12} color="#94A3B8" />
              <Text className="font-rubik text-xs text-slate-600 ml-1.5">
                {item.adminMobile}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Location Information */}
      {(item.city || item.state || item.country) && (
        <View className="mt-2 pt-1">
          <View className="flex-row items-center">
            <Feather name="map-pin" size={12} color="#94A3B8" />
            <Text className="font-rubik text-xs text-slate-600 ml-1.5">
              {[item.city, item.state, item.country].filter(Boolean).join(', ')}
            </Text>
          </View>
        </View>
      )}

      {/* Website Information */}
      {item.companyWebsite && (
        <View className="mt-2">
          <View className="flex-row items-center">
            <Feather name="globe" size={12} color="#94A3B8" />
            <Text className="font-rubik text-xs text-slate-600 ml-1.5">
              {item.companyWebsite}
            </Text>
          </View>
        </View>
      )}

      {/* Divider */}
      <View className="h-px bg-slate-100 my-3" />

      {/* Additional Info */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Feather name="calendar" size={12} color="#94A3B8" />
          <Text className="font-rubik text-xs text-slate-600 ml-1.5">
            Created: {formatShortDate(item.createdAt)}
          </Text>
        </View>
        
        {/* Delete Button */}
        {/* {canAddSubOrg && (
          <TouchableOpacity
            className="flex-row items-center px-3 py-1.5 rounded-lg bg-red-50"
            onPress={() => showConfirmationPopup('delete', item.id, item.name)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <Feather name="trash-2" size={14} color="#DC2626" />
                <Text className="font-rubik-medium text-xs text-red-700 ml-1.5">
                  Delete
                </Text>
              </>
            )}
          </TouchableOpacity>
        )} */}
      </View>
    </TouchableOpacity>
  );
};

  const renderHeader = () => (
    <View className="pt-4 px-4 pb-2">
      <SearchInput
        value={searchQuery}
        placeholder="Search by name, email, or location..."
        onChangeText={handleSearchChange}
        onSearch={() => {}}
        onClear={clearSearch}
      />

      {/* Add Sub-Organization Button */}
      {subOrganizations.length > 0 && (
        <View className="flex-row justify-between items-center mt-3 mb-1">
          <Text className="font-rubik text-xs text-slate-400 tracking-wide">
            {filteredSubOrganizations.length} sub-organization{filteredSubOrganizations.length !== 1 ? 's' : ''}
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
          <Feather name="briefcase" size={36} color="#CBD5E1" />
        </View>
        <Text className="font-rubik-bold text-lg text-slate-900 text-center">
          {searchQuery ? 'No sub-organizations found' : 'No sub-organizations created'}
        </Text>
        <Text className="font-rubik text-sm text-slate-400 text-center mt-2 leading-5">
          {searchQuery
            ? `No sub-organizations matching "${searchQuery}"`
            : 'Sub-organizations you create will appear here'}
        </Text>
        {!searchQuery && canAddSubOrg && (
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
                <View className={`mt-2 px-3 py-1 rounded-full ${selectedSubOrg.isOnboardingComplete ? 'bg-green-50' : 'bg-amber-50'}`}>
                  <Text className={`font-rubik-medium text-xs ${selectedSubOrg.isOnboardingComplete ? 'text-green-700' : 'text-amber-700'}`}>
                    {selectedSubOrg.isOnboardingComplete ? 'ONBOARDING COMPLETED' : 'ONBOARDING PENDING'}
                  </Text>
                </View>
              </View>

              {/* Organization Details */}
              <View className="space-y-4">
                <View className="bg-slate-50 rounded-xl p-4">
                  <Text className="font-rubik-semibold text-sm text-slate-700 mb-3">
                    Organization Information
                  </Text>

                  {(selectedSubOrg.city || selectedSubOrg.state || selectedSubOrg.country) && (
                    <View className="flex-row mb-3">
                      <View className="w-32">
                        <Text className="font-rubik text-xs text-slate-500">Location</Text>
                      </View>
                      <Text className="font-rubik text-xs text-slate-900 flex-1">
                        {[selectedSubOrg.city, selectedSubOrg.state, selectedSubOrg.country].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                  )}

                  {selectedSubOrg.address && (
                    <View className="flex-row mb-3">
                      <View className="w-32">
                        <Text className="font-rubik text-xs text-slate-500">Address</Text>
                      </View>
                      <Text className="font-rubik text-xs text-slate-900 flex-1">
                        {selectedSubOrg.address}
                      </Text>
                    </View>
                  )}

                  {selectedSubOrg.mobileNumber && (
                    <View className="flex-row mb-3">
                      <View className="w-32">
                        <Text className="font-rubik text-xs text-slate-500">Mobile Number</Text>
                      </View>
                      <Text className="font-rubik text-xs text-slate-900 flex-1">
                        {selectedSubOrg.mobileNumber}
                      </Text>
                    </View>
                  )}

                  {selectedSubOrg.companyWebsite && (
                    <View className="flex-row mb-3">
                      <View className="w-32">
                        <Text className="font-rubik text-xs text-slate-500">Website</Text>
                      </View>
                      <Text className="font-rubik text-xs text-slate-900 flex-1">
                        {selectedSubOrg.companyWebsite}
                      </Text>
                    </View>
                  )}

                  {selectedSubOrg.companyType && (
                    <View className="flex-row mb-3">
                      <View className="w-32">
                        <Text className="font-rubik text-xs text-slate-500">Company Type</Text>
                      </View>
                      <Text className="font-rubik text-xs text-slate-900 flex-1">
                        {selectedSubOrg.companyType}
                      </Text>
                    </View>
                  )}

                  {selectedSubOrg.companySize && (
                    <View className="flex-row mb-3">
                      <View className="w-32">
                        <Text className="font-rubik text-xs text-slate-500">Company Size</Text>
                      </View>
                      <Text className="font-rubik text-xs text-slate-900 flex-1">
                        {selectedSubOrg.companySize}
                      </Text>
                    </View>
                  )}

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

                {/* Parent Organization Info */}
                <View className="bg-slate-50 rounded-xl p-4">
                  <Text className="font-rubik-semibold text-sm text-slate-700 mb-3">
                    Organization Hierarchy
                  </Text>

                  <View className="flex-row">
                    <View className="w-32">
                      <Text className="font-rubik text-xs text-slate-500">Parent Org ID</Text>
                    </View>
                    <Text className="font-rubik text-xs text-slate-900 flex-1 font-mono">
                      {selectedSubOrg.parentOrganizationId}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Delete Button in Modal */}
            {canAddSubOrg && (
              <View className="flex-row gap-3 p-5 border-t border-slate-100">
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center bg-red-50 py-3 rounded-xl"
                  onPress={() => {
                    setDetailsModalVisible(false);
                    showConfirmationPopup('delete', selectedSubOrg.id, selectedSubOrg.name);
                  }}
                >
                  <Feather name="trash-2" size={18} color="#DC2626" />
                  <Text className="font-rubik-medium text-base text-red-700 ml-2">
                    Delete Organization
                  </Text>
                </TouchableOpacity>
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
          data={filteredSubOrganizations}
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
        title="Delete Sub-Organization"
        message={`Are you sure you want to delete ${popupConfig?.name}? This action cannot be undone.`}
        confirmText="Delete"
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-6">
          {/* Info Banner */}
          <View className="bg-purple-50 p-4 rounded-xl mb-6 flex-row items-center">

            <View className="flex-1">
              <Text className="font-rubik-medium text-purple-800 text-sm">
                Create New Sub-Organization
              </Text>
              <Text className="font-rubik text-purple-600 text-xs mt-1">
                Fill in the details to create a new sub-organization under your management
              </Text>
            </View>
          </View>

        

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
              title="Create"
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