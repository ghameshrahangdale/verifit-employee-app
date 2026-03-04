import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
// import { useSelector } from 'react-redux';
// import { RootState, store } from '../store/store';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import Header from '../components/ui/Header';
// import auth from '@react-native-firebase/auth';
// import { setUser } from '../store/slices/authSlice';
import Toast from 'react-native-toast-message';

const USER = {
  uid: '1',
  displayName: 'Ghamesh Rahangdale',
  email: 'ghamesh@example.com',
  photoURL: 'https://i.pravatar.cc/150?img=12',
  phoneNumber: '+91 9876543210',
  emailVerified: true,

  bio: 'Passionate Software Developer building scalable mobile applications.',
  designation: 'Senior React Native Developer',

  address: '221B Tech Park',
  city: 'Mumbai',
  state: 'Maharashtra',
  country: 'India',

  location: 'Mumbai, Maharashtra, India',

  linkedin: 'https://linkedin.com/in/ghamesh',
  github: 'https://github.com/ghamesh',
  twitter: 'https://twitter.com/ghamesh',
};

const ProfileScreen: React.FC = () => {
  // const { user } = useSelector((state: RootState) => state.auth);
  const { colors } = useTheme();

  const [user, setUser] = useState(USER);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [photoURL, setPhotoURL] = useState(user.photoURL);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bio, setBio] = useState(user.bio);
  const [designation, setDesignation] = useState(user.designation);
  const [address, setAddress] = useState(user.address);
  const [city, setCity] = useState(user.city);
  const [stateName, setStateName] = useState(user.state);
  const [country, setCountry] = useState(user.country);
  const [linkedin, setLinkedin] = useState(user.linkedin);
  const [github, setGithub] = useState(user.github);
  const [twitter, setTwitter] = useState(user.twitter);

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);

      // 🔥 Static update only (UI Demo Mode)
      setUser(prev => ({
        ...prev,
        displayName,
        photoURL,
        bio,
        designation,
        address,
        city,
        state: stateName,
        country,
        location: `${city}, ${stateName}, ${country}`,
        linkedin,
        github,
        twitter,
      }));

      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Static profile updated successfully',
      });

      setIsEditing(false);
    } catch (error: any) {
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
    setDisplayName(user.displayName);
    setPhotoURL(user.photoURL);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Header
        title="Profile"
        avatarImageUrl={photoURL || undefined}
      />

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Avatar Section */}
        <View className="items-center mb-8">
          <Avatar
            imageUrl={photoURL}
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

        {/* Profile Card */}
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
              <Input label="Display Name" value={displayName} onChangeText={setDisplayName} className="mb-4" />
              <Input label="Designation" value={designation} onChangeText={setDesignation} className="mb-4" />
              <Input label="Bio" value={bio} onChangeText={setBio} className="mb-4" />
            </>
          ) : (
            <>
              <InfoRow label="Name" value={user.displayName} />
              <InfoRow label="Designation" value={user.designation} />
              {/* <InfoRow label="Bio" value={user.bio} /> */}
            </>
          )}
        </View>

        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-base font-rubik-bold text-gray-900 mb-4">
            Address Details
          </Text>

          {isEditing ? (
            <>
              <Input label="Address" value={address} onChangeText={setAddress} className="mb-4" />
              <Input label="City" value={city} onChangeText={setCity} className="mb-4" />
              <Input label="State" value={stateName} onChangeText={setStateName} className="mb-4" />
              <Input label="Country" value={country} onChangeText={setCountry} />
            </>
          ) : (
            <>
              <InfoRow label="Address" value={user.address} />
              <InfoRow label="Location" value={user.location} />
            </>
          )}
        </View>

        <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <Text className="text-base font-rubik-bold text-gray-900 mb-4">
            Social Profiles
          </Text>

          {isEditing ? (
            <>
              <Input label="LinkedIn" value={linkedin} onChangeText={setLinkedin} className="mb-4" />
              <Input label="GitHub" value={github} onChangeText={setGithub} className="mb-4" />
              <Input label="Twitter" value={twitter} onChangeText={setTwitter} />
            </>
          ) : (
            <>
              <InfoRow label="LinkedIn" value={user.linkedin} />
              <InfoRow label="GitHub" value={user.github} />
              <InfoRow label="Twitter" value={user.twitter} />
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
  <View className="flex-row justify-between py-3 border-b border-gray-100 last:border-b-0">
    <Text className="text-gray-500 font-rubik">
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