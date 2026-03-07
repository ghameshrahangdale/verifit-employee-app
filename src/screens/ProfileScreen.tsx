import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import Header from '../components/ui/Header';
import Toast from 'react-native-toast-message';
import http from '../services/http.api';

interface OrganizationData {
  id: string;
  name: string;
  mobileNumber: string;
  businessEmail: string;
  companyWebsite: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  panNumber: string;
  companyType: string;
  cinNumber: string | null;
  udyamNumber: string | null;
  companySize: string;
  logoUrl: string | null;
  isOnboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserData {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  organization: OrganizationData;
}

interface ProfileResponse {
  user: UserData;
}

const ProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user: authUser, refreshUser } = useAuth();
  
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  // Form states for editable fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  console.log(profile);

  // Fetch profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Update form when profile data is loaded
  useEffect(() => {
    if (profile?.user) {
      setFirstName(profile.user.firstName || '');
      setLastName(profile.user.lastName || '');
    }
  }, [profile]);

  const fetchUserProfile = async () => {
    try {
      setIsFetching(true);
      const response = await http.get('/api/user/profile');
      
      if (response.data) {
        setProfile(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Profile',
        text2: error.response?.data?.message || 'Unable to fetch profile data',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);

      // Only send fields that can be updated
      const profileData = {
        firstName,
        lastName,
      };

      const response = await http.put('/api/user/profile', profileData);
      
      if (response.data) {
        setProfile(response.data);
        
        // Refresh auth context user data
        await refreshUser();
      }

      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your profile has been updated successfully',
      });

      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.response?.data?.message || 'Failed to update profile',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original profile data
    if (profile?.user) {
      setFirstName(profile.user.firstName || '');
      setLastName(profile.user.lastName || '');
    }
  };

  const getFullName = () => {
    if (profile?.user?.firstName || profile?.user?.lastName) {
      return `${profile.user.firstName || ''} ${profile.user.lastName || ''}`.trim();
    }
    return authUser?.email || 'User';
  };




  if (isFetching) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header title="Profile" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header
        title="Profile"
        // showBackButton={false}
      />

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Avatar Section */}
        <View className="items-center mb-8">
          <Avatar
            // title={getFullName()}
            // imageUrl={getOrganizationLogo()}
            size="3xl"
            // initials={getInitials()}
          />

          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text
                className="font-rubik-medium mt-3"
                style={{ color: colors.primary }}
              >
                Edit Profile
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* User Information Card */}
        <View
          className="bg-white rounded-2xl p-6 mb-6"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Text className="text-base font-rubik-bold text-gray-900 mb-4">
            Personal Information
          </Text>

          {isEditing ? (
            <>
              <Input 
                label="First Name" 
                value={firstName} 
                onChangeText={setFirstName} 
                placeholder="Enter your first name"
                className="mb-4" 
              />
              <Input 
                label="Last Name" 
                value={lastName} 
                onChangeText={setLastName} 
                placeholder="Enter your last name"
                className="mb-4" 
              />
            </>
          ) : (
            <>
              <InfoRow label="Full Name" value={getFullName()} />
              <InfoRow label="Email" value={profile?.user?.email || ''} />
              <InfoRow label="Role" value={profile?.user?.role || ''} capitalize />
              <InfoRow 
                label="Email Verified" 
                value={profile?.user?.isEmailVerified ? 'Yes' : 'No'} 
                valueColor={profile?.user?.isEmailVerified ? '#10B981' : '#F59E0B'}
              />
             
            </>
          )}
        </View>

        {/* Organization Information Card */}
        {profile?.user?.organization && (
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <Text className="text-base font-rubik-bold text-gray-900 mb-4">
              Organization Details
            </Text>

            <InfoRow label="Organization Name" value={profile.user.organization.name} />
            <InfoRow label="Business Email" value={profile.user.organization.businessEmail} />
            <InfoRow label="Mobile Number" value={profile.user.organization.mobileNumber} />
            {profile.user.organization.companyWebsite && (
              <InfoRow label="Website" value={profile.user.organization.companyWebsite} />
            )}
            <InfoRow label="Address" value={profile.user.organization.address} />
            <InfoRow 
              label="City" 
              value={[profile.user.organization.city, profile.user.organization.state]
                .filter(Boolean)
                .join(', ')} 
            />
            <InfoRow label="Country" value={profile.user.organization.country} />
            <InfoRow label="PAN Number" value={profile.user.organization.panNumber} />
            <InfoRow label="Company Type" value={profile.user.organization.companyType} capitalize />
            <InfoRow label="Company Size" value={profile.user.organization.companySize} />
            {profile.user.organization.cinNumber && (
              <InfoRow label="CIN Number" value={profile.user.organization.cinNumber} />
            )}
            {profile.user.organization.udyamNumber && (
              <InfoRow label="Udyam Number" value={profile.user.organization.udyamNumber} />
            )}
            <InfoRow 
              label="Onboarding Status" 
              value={profile.user.organization.isOnboardingComplete ? 'Completed' : 'Pending'} 
              valueColor={profile.user.organization.isOnboardingComplete ? '#10B981' : '#F59E0B'}
            />
          </View>
        )}

        {/* Actions */}
        {isEditing ? (
          <View className="flex-row gap-4">
            <Button
              title="Cancel"
              variant="outline"
              className="flex-1"
              onPress={handleCancelEdit}
              disabled={isLoading}
            />
            <Button
              title="Save Changes"
              className="flex-1"
              loading={isLoading}
              onPress={handleSaveProfile}
            />
          </View>
        ) : (
          <Button
            title="Edit Profile"
            variant="outline"
            onPress={() => setIsEditing(true)}
          />
        )}
      </ScrollView>
    </View>
  );
};

const InfoRow = ({
  label,
  value,
  valueColor,
  capitalize = false,
}: {
  label: string;
  value: string;
  valueColor?: string;
  capitalize?: boolean;
}) => (
  <View className="py-3 border-b border-gray-100 last:border-b-0">
    <Text className="text-gray-500 font-rubik text-sm">
      {label}
    </Text>

    <Text
      className={`font-rubik-medium mt-1 ${
        capitalize ? 'capitalize' : ''
      }`}
      style={{ color: valueColor || '#374151' }}
      numberOfLines={2}
    >
      {value || 'Not provided'}
    </Text>
  </View>
);

export default ProfileScreen;