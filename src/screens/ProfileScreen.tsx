import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import Header from '../components/ui/Header';
import Toast from 'react-native-toast-message';
import http from '../services/http.api';
import { pick } from '@react-native-documents/picker';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  profileImage?: string;
  organization?: OrganizationData;
}

interface ProfileResponse {
  user: UserData;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** A single labeled row inside an info card */
const InfoRow = ({
  label,
  value,
  valueColor,
  capitalize = false,
  isLast = false,
}: {
  label: string;
  value: string;
  valueColor?: string;
  capitalize?: boolean;
  isLast?: boolean;
}) => (
  <View className={`py-3`}>
    <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-0.5">
      {label}
    </Text>
    <Text
      className={`font-rubik-medium text-sm text-gray-800 leading-5 ${capitalize ? 'capitalize' : ''}`}
      style={valueColor ? { color: valueColor } : undefined}
      numberOfLines={2}
    >
      {value || 'Not provided'}
    </Text>
  </View>
);

/** Pill badge for role / verification status */
const Badge = ({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) => (
  <View className="px-3 py-1 rounded-full" style={{ backgroundColor: bg }}>
    <Text className="font-rubik-medium text-xs" style={{ color }}>
      {label}
    </Text>
  </View>
);

/** Labelled section divider */
const SectionDivider = ({ label }: { label: string }) => (
  <View className="flex-row items-center px-5 mt-6 mb-3 gap-2.5">
    <View className="flex-1 h-px bg-gray-200" />
    <Text className="font-rubik-medium text-xs text-gray-400 uppercase tracking-widest">
      {label}
    </Text>
    <View className="flex-1 h-px bg-gray-200" />
  </View>
);

/** Thin horizontal divider inside a card */
const CardDivider = () => <View className="h-px bg-gray-100 my-1" />;

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ProfileScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user: authUser, getProfile, updateProfile } = useAuth();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarFile, setAvatarFile] = useState<any>(null);

  useEffect(() => { fetchUserProfile(); }, []);

  useEffect(() => {
    if (profile?.user) {
      setFirstName(profile.user.firstName || '');
      setLastName(profile.user.lastName || '');
    }
  }, [profile]);

  const fetchUserProfile = async () => {
  try {
    setIsFetching(true);

    const data = await getProfile();

    if (data) {
      setProfile({ user: data });
    }

  } catch (error: any) {
    Toast.show({
      type: 'error',
      text1: 'Failed to Load Profile',
      text2: 'Unable to fetch profile',
    });
  } finally {
    setIsFetching(false);
  }
};

  const handleSaveProfile = async () => {
  try {
    setIsLoading(true);

    const updatedUser = await updateProfile({
      firstName,
      lastName,
      avatarFile,
    });

    if (updatedUser) {
      setProfile({ user: updatedUser });
    }

    Toast.show({
      type: 'success',
      text1: 'Profile Updated',
      text2: 'Your changes were saved.',
    });

    setIsEditing(false);

  } catch (error: any) {
    Toast.show({
      type: 'error',
      text1: 'Update Failed',
      text2: 'Failed to update profile',
    });
  } finally {
    setIsLoading(false);
  }
};

  const handlePickAvatar = async () => {
    try {
      const res = await pick({
        type: ['image/*'],
        allowMultiSelection: false,
      });

      const file = res[0];

      setAvatarFile({
        uri: file.uri,
        name: file.name || 'avatar.jpg',
        type: file.type || 'image/jpeg',
      });

    } catch (err: any) {
      if (err?.code === 'DOCUMENT_PICKER_CANCELED') return;

      Toast.show({
        type: 'error',
        text1: 'Avatar Selection Failed',
        text2: 'Unable to select profile image',
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (profile?.user) {
      setFirstName(profile.user.firstName || '');
      setLastName(profile.user.lastName || '');
    }
  };

  const getFullName = () => {
    const name = `${profile?.user?.firstName || ''} ${profile?.user?.lastName || ''}`.trim();
    return name || authUser?.email || 'User';
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isFetching) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header title="Profile" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="font-rubik text-sm text-gray-400 mt-3">
            Loading your profile…
          </Text>
        </View>
      </View>
    );
  }

  const org = profile?.user?.organization;
  

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Profile" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
      >

        {/* ── Hero Banner ──────────────────────────────────────────────────── */}
        <View className="bg-purple-100 items-center pt-9 pb-7 px-6 mb-2 shadow-sm rounded-b-3xl">
          {/* Soft tinted strip sitting behind the avatar */}
          {/* <View className="absolute top-0 left-0 right-0 h-24  rounded-b-3xl" /> */}

          {/* Avatar enclosed in a colored ring with glow */}
          <TouchableOpacity
            disabled={!isEditing}
            onPress={handlePickAvatar}
            className="mb-4"
          >

            <View
              className="p-0.5 rounded-full bg-white border-2 border-indigo-500"
              style={{
                shadowColor: colors.primary,
                shadowOpacity: 0.28,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
              }}
            >
              {avatarFile?.uri ? (
                <Image
                  source={{ uri: avatarFile.uri }}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 48,
                  }}
                />
              ) : (
                <Avatar
                  size="3xl"
                  name={getFullName()}
                  imageUrl={profile?.user.profileImage}
                />
              )}
            </View>

            {isEditing && (
              <Text className="text-xs text-indigo-500 mt-2 text-center font-rubik">
                Tap to change photo
              </Text>
            )}

          </TouchableOpacity>
          {/* Full name */}
          <Text className="font-rubik-bold text-xl text-gray-900 tracking-tight mb-2.5">
            {getFullName()}
          </Text>

          {/* Role + verified badges */}
          <View className="flex-row gap-2 mb-4">
            {profile?.user?.role && (
              <Badge
                label={profile.user.role.charAt(0).toUpperCase() + profile.user.role.slice(1)}
                color="#6366F1"
                bg="#EEF2FF"
              />
            )}
            {profile?.user?.isEmailVerified && (
              <Badge label="✓ Verified" color="#059669" bg="#ECFDF5" />
            )}
          </View>

          {/* Edit profile pill button */}
          {!isEditing && (
            <TouchableOpacity
              className="px-5 py-2 rounded-full border"
              style={{ borderColor: colors.primary }}
              activeOpacity={0.7}
              onPress={() => setIsEditing(true)}
            >
              <Text className="font-rubik-medium text-sm" style={{ color: colors.primary }}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Personal Information ─────────────────────────────────────────── */}
        <SectionDivider label="Personal Information" />

        <View className="bg-white mx-4 rounded-2xl px-5 py-1 shadow-sm">
          {isEditing ? (
            <View className="py-4 gap-4">
              <Input
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
              />
              <Input
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
              />
            </View>
          ) : (
            <>
              <InfoRow label="Full Name" value={getFullName()} />
              <InfoRow label="Email Address" value={profile?.user?.email || ''} />
              <InfoRow
                label="Account Role"
                value={profile?.user?.role || ''}
                capitalize
                isLast
              />
            </>
          )}
        </View>

        {/* ── Account Status Cards ─────────────────────────────────────────── */}
        {!isEditing && (
          <>
            <SectionDivider label="Account Status" />

            <View className="flex-row px-4 gap-3">
              {/* Email verification */}
              <View className="flex-1 bg-white rounded-2xl p-3.5 items-center shadow-sm">
                <View
                  className="w-2 h-2 rounded-full mb-1.5"
                  style={{ backgroundColor: profile?.user?.isEmailVerified ? '#10B981' : '#F59E0B' }}
                />
                <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                  Email
                </Text>
                <Text
                  className="font-rubik-medium text-xs"
                  style={{ color: profile?.user?.isEmailVerified ? '#10B981' : '#F59E0B' }}
                >
                  {profile?.user?.isEmailVerified ? 'Verified' : 'Unverified'}
                </Text>
              </View>

              {/* Account active/inactive */}
              <View className="flex-1 bg-white rounded-2xl p-3.5 items-center shadow-sm">
                <View
                  className="w-2 h-2 rounded-full mb-1.5"
                  style={{ backgroundColor: profile?.user?.isActive ? '#10B981' : '#EF4444' }}
                />
                <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                  Account
                </Text>
                <Text
                  className="font-rubik-medium text-xs"
                  style={{ color: profile?.user?.isActive ? '#10B981' : '#EF4444' }}
                >
                  {profile?.user?.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>

              {/* Onboarding */}
              <View className="flex-1 bg-white rounded-2xl p-3.5 items-center shadow-sm">
                <View
                  className="w-2 h-2 rounded-full mb-1.5"
                  style={{ backgroundColor: org?.isOnboardingComplete ? '#10B981' : '#F59E0B' }}
                />
                <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                  Onboarding
                </Text>
                <Text
                  className="font-rubik-medium text-xs"
                  style={{ color: org?.isOnboardingComplete ? '#10B981' : '#F59E0B' }}
                >
                  {org?.isOnboardingComplete ? 'Complete' : 'Pending'}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ── Organization Details ─────────────────────────────────────────── */}
        {org && !isEditing && (
          <>
            <SectionDivider label="Organization Details" />

            <View className="bg-white mx-4 rounded-2xl px-5 py-1 shadow-sm">
              {/* Org header row */}
              <View className="flex-row items-center py-4 gap-3.5">
                {org.logoUrl ? (
                  <View
                    className="w-14 h-14 rounded-md border border-gray-200 bg-white overflow-hidden"

                  >
                    <Image
                      source={{ uri: org.logoUrl }}
                      className="w-full h-full"
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 items-center justify-center">
                    <Text className="font-rubik-bold text-2xl text-indigo-500">
                      {org.name?.[0]?.toUpperCase() || 'O'}
                    </Text>
                  </View>
                )}

                <View className="flex-1">
                  <Text className="font-rubik-bold text-base text-gray-900 mb-0.5">
                    {org.name}
                  </Text>
                  <Text className="font-rubik text-xs text-gray-500 capitalize">
                    {org.companyType} · {org.companySize}
                  </Text>
                </View>
              </View>

              <CardDivider />

              <InfoRow label="Business Email" value={org.businessEmail} />
              <InfoRow label="Mobile Number" value={org.mobileNumber} />
              {org.companyWebsite && (
                <InfoRow label="Website" value={org.companyWebsite} />
              )}
              <InfoRow label="Address" value={org.address} isLast />
            </View>

            {/* ── Location & Registration ──────────────────────────────────── */}
            <SectionDivider label="Location & Registration" />

            <View className="bg-white mx-4 rounded-2xl px-5 py-1 shadow-sm">
              <InfoRow
                label="City & State"
                value={[org.city, org.state].filter(Boolean).join(', ')}
              />
              <InfoRow label="Country" value={org.country} />
              <InfoRow label="PAN Number" value={org.panNumber} />
              {org.cinNumber && <InfoRow label="CIN Number" value={org.cinNumber} />}
              {org.udyamNumber ? (
                <InfoRow label="Udyam Number" value={org.udyamNumber} isLast />
              ) : null}
            </View>
          </>
        )}

        {/* ── Action Buttons ───────────────────────────────────────────────── */}
        <View className="px-4 mt-7">
          {isEditing ? (
            <View className="flex-row gap-3">
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
        </View>

      </ScrollView>
    </View>
  );
};

export default ProfileScreen;