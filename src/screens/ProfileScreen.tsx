import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState, store } from '../store/store';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Loader from '../components/ui/Loader';
import Avatar from '../components/ui/Avatar';
import Header from '../components/ui/Header';
import auth from '@react-native-firebase/auth'; // <-- Import from react-native-firebase
import { setUser } from '../store/slices/authSlice';
import Toast from 'react-native-toast-message';

const ProfileScreen: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { colors } = useTheme();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
  const currentUser = auth().currentUser;
  if (!currentUser) return;

  try {
    setIsLoading(true);

    await currentUser.updateProfile({
      displayName,
      photoURL: photoURL || null,
    });

    await currentUser.reload();

    const refreshedUser = auth().currentUser;

    if (refreshedUser) {
      store.dispatch(
        setUser({
          uid: refreshedUser.uid,
          email: refreshedUser.email,
          displayName: refreshedUser.displayName,
          photoURL: refreshedUser.photoURL,
          phoneNumber: refreshedUser.phoneNumber,
          emailVerified: refreshedUser.emailVerified,
        })
      );
    }

    Toast.show({
      type: 'success',
      text1: 'Profile Updated',
      text2: 'Your profile was updated successfully',
    });

    setIsEditing(false);
  } catch (error: any) {
    console.error('Update profile error:', error);

    Toast.show({
      type: 'error',
      text1: 'Update Failed',
      text2: error.message || 'Failed to update profile',
    });
  } finally {
    setIsLoading(false);
  }
};
  const handleCancelEdit = () => {
    setIsEditing(false);
    setDisplayName(user?.displayName || '');
    setPhotoURL(user?.photoURL || '');
  };

  if (!user) return <Loader fullScreen />;

  return (
    <View className="flex-1 bg-gray-50">
      <Header
        title="Profile"
        avatarImageUrl={photoURL || user.photoURL || undefined}
      />

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Avatar */}
        <View className="items-center mb-8">
          <Avatar
            imageUrl={photoURL || user?.photoURL || undefined}
            size="3xl"
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

        {/* Profile Details */}
        <View className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <Text className="text-base font-rubik-bold text-gray-900 mb-4">
            Personal Information
          </Text>

          {isEditing ? (
            <>
              <Input
                label="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                className="mb-4"
              />
              <Input
                label="Profile Photo URL"
                value={photoURL}
                onChangeText={setPhotoURL}
                placeholder="Enter photo URL"
                className="mb-2"
              />
              <Text className="text-xs text-gray-500 mt-2">
                Note: Phone numbers cannot be updated here. Use the phone authentication flow to change your phone number.
              </Text>
            </>
          ) : (
            <>
              <InfoRow label="Name" value={user.displayName || 'Not set'} />
              <InfoRow label="Email" value={user.email || 'Not set'} />
              {user.phoneNumber && (
                <InfoRow label="Phone" value={user.phoneNumber} />
              )}
              <InfoRow
                label="Email Verified"
                value={user.emailVerified ? 'Verified' : 'Not Verified'}
                valueColor={user.emailVerified ? colors.success : colors.error}
              />
            </>
          )}
        </View>

        {/* Actions */}
        {isEditing ? (
          <View className="flex-row gap-4">
            <Button
              title="Cancel"
              variant="outline"
              className="flex-1"
              onPress={handleCancelEdit}
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
}: {
  label: string;
  value: string;
  valueColor?: string;
}) => (
  <View className="flex-row py-3 border-b border-gray-200 last:border-b-0">
    <Text className="text-gray-500 font-rubik mr-2">
      {label}
    </Text>
    <Text
      className="font-rubik-medium"
      style={{ color: valueColor || '#374151' }}
    >
      {value}
    </Text>
  </View>
);

export default ProfileScreen;