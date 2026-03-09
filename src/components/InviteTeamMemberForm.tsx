import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import Input from './ui/Input';
import Button from './ui/Button';

interface AddMemberData {
  firstName: string;
  lastName: string;
  email: string;
  role: 'hr';
}

interface InviteTeamMemberFormProps {
  onSubmit: (data: AddMemberData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const InviteTeamMemberForm: React.FC<InviteTeamMemberFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<AddMemberData>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'hr',
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AddMemberData, string>>>({});

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

  const handleSubmit = async () => {
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  const handleFieldChange = (field: keyof AddMemberData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: undefined });
    }
  };

  return (
    <ScrollView className="p-6">
      {/* Info Banner */}
      <View className="bg-blue-50 p-4 rounded-xl mb-6 flex-row items-center">
        <View className="bg-blue-100 rounded-full p-2 mr-3">
          <Text className="text-blue-600 text-lg">📧</Text>
        </View>
        <View className="flex-1">
          <Text className="font-rubik-medium text-blue-800 text-sm">
            An invitation email will be sent
          </Text>
          <Text className="font-rubik text-blue-600 text-xs mt-1">
            The new member will receive instructions to set up their account
          </Text>
        </View>
      </View>

      {/* Form Fields */}
      <Input
        label="First Name"
        value={formData.firstName}
        onChangeText={(text) => handleFieldChange('firstName', text)}
        placeholder="Enter first name"
        error={formErrors.firstName}
        className="mb-4"
      />

      <Input
        label="Last Name"
        value={formData.lastName}
        onChangeText={(text) => handleFieldChange('lastName', text)}
        placeholder="Enter last name"
        error={formErrors.lastName}
        className="mb-4"
      />

      <Input
        label="Email Address"
        value={formData.email}
        onChangeText={(text) => handleFieldChange('email', text)}
        placeholder="Enter email address"
        keyboardType="email-address"
        autoCapitalize="none"
        error={formErrors.email}
        className="mb-6"
      />

      {/* Role Badge - Visual indicator only */}
      <View className="bg-gray-50 p-4 rounded-xl mb-6 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="bg-primary-100 rounded-full p-2 mr-3">
            <Text className="text-primary-600">👔</Text>
          </View>
          <View>
            <Text className="font-rubik text-gray-600 text-xs">Role</Text>
            <Text className="font-rubik-medium text-gray-900">HR Manager</Text>
          </View>
        </View>
        <View className="bg-primary-100 px-3 py-1 rounded-full">
          <Text className="font-rubik-medium text-primary-600 text-xs">HR</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-4 mb-6">
        <Button
          title="Cancel"
          variant="outline"
          className="flex-1"
          onPress={onCancel}
          disabled={isLoading}
        />
        <Button
          title="Send Invitation"
          className="flex-1"
          loading={isLoading}
          onPress={handleSubmit}
        />
      </View>
    </ScrollView>
  );
};

export default InviteTeamMemberForm;