// components/employee/EmployeeProfessionalDetails.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Toast from 'react-native-toast-message';
import http from '../../services/http.api';
import Icon from 'react-native-vector-icons/Feather';

// ─── Types ────────────────────────────────────────────────────────────────────

export enum EmploymentType {
  FULL_TIME = "full_time",
  PART_TIME = "part_time",
  CONTRACT = "contract",
  INTERN = "intern",
}

interface EmployeeProfileData {
  designation: string;
  department: string;
  employmentType: EmploymentType;
  joiningDate: string;
  relievingDate: string | null;
  panNumber: string;
  aadharNumber: string;
  passportNumber: string;
  uanNumber: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** A single labeled row inside an info card */
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
  <View className="py-3">
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

/** Section separator with title */
const SectionSeparator = ({ title }: { title: string }) => (
  <View className="flex-row items-center gap-2.5 my-2">
    <View className="flex-1 h-px bg-gray-200" />
    <Text className="font-rubik-medium text-xs text-gray-400 uppercase tracking-widest">
      {title}
    </Text>
    <View className="flex-1 h-px bg-gray-200" />
  </View>
);

/** Employment type selector pill */
const EmploymentTypePill = ({
  type,
  selected,
  onSelect,
}: {
  type: EmploymentType;
  selected: boolean;
  onSelect: () => void;
}) => {
  const getLabel = (type: EmploymentType) => {
    switch (type) {
      case EmploymentType.FULL_TIME:
        return 'Full Time';
      case EmploymentType.PART_TIME:
        return 'Part Time';
      case EmploymentType.CONTRACT:
        return 'Contract';
      case EmploymentType.INTERN:
        return 'Intern';
      default:
        return type;
    }
  };

  return (
    <TouchableOpacity
      onPress={onSelect}
      className={`px-4 py-2 rounded-full border ${selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
        }`}
    >
      <Text
        className={`font-rubik-medium text-sm ${selected ? 'text-indigo-600' : 'text-gray-600'
          }`}
      >
        {getLabel(type)}
      </Text>
    </TouchableOpacity>
  );
};

/** Empty state component */
const EmptyState = ({ onAddPress }: { onAddPress: () => void }) => (
  <View className="bg-white mx-4 rounded-2xl p-8 items-center justify-center shadow-sm">
    <Icon name="user" size={48} color="#9CA3AF" />
    <Text className="font-rubik-medium text-base text-gray-700 mt-4 text-center">
      No Professional Details Added
    </Text>
    <Text className="font-rubik text-sm text-gray-400 mt-1 text-center mb-6">
      Add your professional information to complete your profile
    </Text>
    <Button
      title="Add Professional Details"
      onPress={onAddPress}
    />
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface EmployeeProfessionalDetailsProps {
  onSaveComplete?: () => void;
}

const EmployeeProfessionalDetails: React.FC<EmployeeProfessionalDetailsProps> = ({
  onSaveComplete,
}) => {
  const { colors } = useTheme();

  const [profile, setProfile] = useState<EmployeeProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    designation: '',
    department: '',
    employmentType: EmploymentType.FULL_TIME,
    joiningDate: '',
    relievingDate: '',
    panNumber: '',
    aadharNumber: '',
    passportNumber: '',
    uanNumber: '',
  });

  useEffect(() => {
    fetchEmployeeProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        designation: profile.designation || '',
        department: profile.department || '',
        employmentType: profile.employmentType || EmploymentType.FULL_TIME,
        joiningDate: profile.joiningDate || '',
        relievingDate: profile.relievingDate || '',
        panNumber: profile.panNumber || '',

        aadharNumber: profile.aadharNumber || '',
        passportNumber: profile.passportNumber || '',
        uanNumber: profile.uanNumber || '',
      });
    }
  }, [profile]);

  const fetchEmployeeProfile = async () => {
    try {
      setIsFetching(true);
      const response = await http.get<EmployeeProfileData>('api/employees/profile');

      if (response.data) {
        setProfile(response.data);
      }
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        Toast.show({
          type: 'error',
          text1: 'Failed to Load Employee Profile',
          text2: error?.response?.data?.message || 'Unable to fetch employee details',
        });
      }
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      const payload: Partial<EmployeeProfileData> = { ...formData };

      // Remove relievingDate if not applicable
      if (formData.employmentType === EmploymentType.FULL_TIME || !formData.relievingDate) {
        delete payload.relievingDate;
      }

      await http.post('api/employees/profile', payload);

      Toast.show({
        type: 'success',
        text1: profile ? 'Profile Updated' : 'Profile Created',
        text2: 'Your professional details were saved successfully.',
      });

      await fetchEmployeeProfile();
      setIsEditing(false);
      onSaveComplete?.();

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: profile ? 'Update Failed' : 'Creation Failed',
        text2: error?.response?.data?.message || 'Failed to save profile',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        designation: profile.designation || '',
        department: profile.department || '',
        employmentType: profile.employmentType || EmploymentType.FULL_TIME,
        joiningDate: profile.joiningDate || '',
        relievingDate: profile.relievingDate || '',
        panNumber: profile.panNumber || '',

        aadharNumber: profile.aadharNumber || '',
        passportNumber: profile.passportNumber || '',
        uanNumber: profile.uanNumber || '',
      });
    } else {
      // Reset form to empty
      setFormData({
        designation: '',
        department: '',
        employmentType: EmploymentType.FULL_TIME,
        joiningDate: '',
        relievingDate: '',
        panNumber: '',
        aadharNumber: '',
        passportNumber: '',
        uanNumber: '',
      });
    }
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatEmploymentType = (type: EmploymentType) => {
    switch (type) {
      case EmploymentType.FULL_TIME:
        return 'Full Time';
      case EmploymentType.PART_TIME:
        return 'Part Time';
      case EmploymentType.CONTRACT:
        return 'Contract';
      case EmploymentType.INTERN:
        return 'Intern';
      default:
        return type;
    }
  };

  // Loading state
  if (isFetching) {
    return (
      <View className="mt-4">
        <View className="bg-white mx-4 rounded-2xl p-8 items-center justify-center shadow-sm">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text className="font-rubik text-sm text-gray-400 mt-3">
            Loading professional details...
          </Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (!profile && !isEditing) {
    return (
      <View className="mt-4">
        <EmptyState onAddPress={() => setIsEditing(true)} />
      </View>
    );
  }

  return (
    <View className="mt-4">
      <View className="bg-white mx-4 rounded-2xl shadow-sm overflow-hidden">
        {/* Header with Edit/Save buttons */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
          <Text className="font-rubik-medium text-base text-gray-800">
            Professional Details
          </Text>
          {!isEditing ? (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              className="p-2 bg-gray-100 rounded-full"
              activeOpacity={0.7}
            >
              <Icon name="edit-2" size={18} color="#6B7280" />
            </TouchableOpacity>
          ) : (
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleCancelEdit}
                className="px-3 py-1.5 rounded-full border border-gray-200"
                disabled={isLoading}
              >
                <Text className="font-rubik-medium text-sm text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                className="px-3 py-1.5 rounded-full bg-indigo-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="font-rubik-medium text-sm text-white">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isEditing ? (
          // Edit Form View
          <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
            {/* Employment Section */}
            <Text className="font-rubik-medium text-sm text-gray-700 mb-3">
              Employment Details
            </Text>

            <Input
              label="Designation"
              value={formData.designation}
              onChangeText={(text) => setFormData(prev => ({ ...prev, designation: text }))}
              placeholder="e.g., Software Engineer"
            />

            <Input
              label="Department"
              value={formData.department}
              onChangeText={(text) => setFormData(prev => ({ ...prev, department: text }))}
              placeholder="e.g., Engineering"
            />

            <View className="mb-4">
              <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-2">
                Employment Type
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {Object.values(EmploymentType).map((type) => (
                  <EmploymentTypePill
                    key={type}
                    type={type}
                    selected={formData.employmentType === type}
                    onSelect={() => setFormData(prev => ({ ...prev, employmentType: type }))}
                  />
                ))}
              </View>
            </View>

            <Input
              label="Joining Date"
              value={formData.joiningDate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, joiningDate: text }))}
              placeholder="YYYY-MM-DD"
            />

            {formData.employmentType !== EmploymentType.FULL_TIME && (
              <Input
                label="Relieving Date (if applicable)"
                value={formData.relievingDate}
                onChangeText={(text) => setFormData(prev => ({ ...prev, relievingDate: text }))}
                placeholder="YYYY-MM-DD"
              />
            )}

            <SectionSeparator title="Legal & Identity" />

            <Input
              label="PAN Number"
              value={formData.panNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, panNumber: text }))}
              placeholder="ABCDE1234F"
            />

            <Input
              label="Aadhar Number"
              value={formData.aadharNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, aadharNumber: text }))}
              placeholder="XXXX XXXX XXXX"
              keyboardType="numeric"
            />

            <Input
              label="UAN Number"
              value={formData.uanNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, uanNumber: text }))}
              placeholder="Universal Account Number"
              keyboardType="numeric"
            />

            <Input
              label="Passport Number"
              value={formData.passportNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, passportNumber: text }))}
              placeholder="Enter passport number"
            />
          </ScrollView>
        ) : (
          // Display View
          <View className="p-5">
            {/* Employment Section */}
            <Text className="font-rubik-medium text-sm text-gray-700 mb-2">
              Employment Details
            </Text>
            <View className="mb-4">
              <InfoRow label="Designation" value={profile?.designation || ''} />
              <InfoRow label="Department" value={profile?.department || ''} />
              <InfoRow
                label="Employment Type"
                value={formatEmploymentType(profile?.employmentType || EmploymentType.FULL_TIME)}
              />
              <InfoRow label="Joining Date" value={formatDate(profile?.joiningDate || '')} />
              {profile?.relievingDate && (
                <InfoRow label="Relieving Date" value={formatDate(profile.relievingDate)} />
              )}
            </View>

            <SectionSeparator title="Legal & Identity" />

            <View>
              <InfoRow label="PAN Number" value={profile?.panNumber || ''} />
              <InfoRow label="Aadhar Number" value={profile?.aadharNumber || ''} />
              <InfoRow label="UAN Number" value={profile?.uanNumber || ''} />
              <InfoRow label="Passport Number" value={profile?.passportNumber || ''} />
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default EmployeeProfessionalDetails;