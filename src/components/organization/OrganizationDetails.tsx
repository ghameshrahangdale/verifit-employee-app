// components/organization/OrganizationDetails.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Input from '../ui/Input';
import Toast from 'react-native-toast-message';
import http from '../../services/http.api';
import Icon from 'react-native-vector-icons/Feather';
import { pick } from '@react-native-documents/picker';
import { PrimaryButton, SecondaryButton } from '../employee/EmployeeProfessionalDetails';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrganizationData {
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

// Company type options
const companyTypes = [
  { label: 'Private Limited', value: 'private_limited' },
  { label: 'Public Limited', value: 'public_limited' },
  { label: 'LLP', value: 'llp' },
  { label: 'Partnership', value: 'partnership' },
  { label: 'Sole Proprietorship', value: 'sole_proprietorship' },
  { label: 'OPC (One Person Company)', value: 'opc' },
  { label: 'Non-Government Organization', value: 'ngo' },
  { label: 'Other', value: 'other' },
];

// Company size options
const companySizes = [
  { label: '1-10 employees', value: '1-10' },
  { label: '11-50 employees', value: '11-50' },
  { label: '51-200 employees', value: '51-200' },
  { label: '201-500 employees', value: '201-500' },
  { label: '500+ employees', value: '500+' },
];

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
  <View className={`py-3 ${!isLast ? 'border-b border-gray-100' : ''}`}>
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

/** Thin horizontal divider inside a card */
const CardDivider = () => <View className="h-px bg-gray-100 my-1" />;

// ─── Main Component ───────────────────────────────────────────────────────────

interface OrganizationDetailsProps {
  organization: OrganizationData;
  onUpdate?: (updatedOrg: OrganizationData) => void;
}

const OrganizationDetails: React.FC<OrganizationDetailsProps> = ({
  organization,
  onUpdate,
}) => {
  const { colors } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    businessEmail: '',
    companyWebsite: '',
    companyType: '',
    companySize: '',
    panNumber: '',
    cinNumber: '',
    udyamNumber: '',
    address: '',
    city: '',
    state: '',
    country: '',
  });

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        mobileNumber: organization.mobileNumber || '',
        businessEmail: organization.businessEmail || '',
        companyWebsite: organization.companyWebsite || '',
        companyType: organization.companyType || '',
        companySize: organization.companySize || '',
        panNumber: organization.panNumber || '',
        cinNumber: organization.cinNumber || '',
        udyamNumber: organization.udyamNumber || '',
        address: organization.address || '',
        city: organization.city || '',
        state: organization.state || '',
        country: organization.country || '',
      });
    }
  }, [organization]);

  const handleSave = async () => {
    try {
      setIsLoading(true);

      // Prepare payload
      const payload: any = {
        name: formData.name,
        mobileNumber: formData.mobileNumber,
        businessEmail: formData.businessEmail,
        companyWebsite: formData.companyWebsite || null,
        companyType: formData.companyType,
        companySize: formData.companySize,
        panNumber: formData.panNumber,
        cinNumber: formData.cinNumber || null,
        udyamNumber: formData.udyamNumber || null,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
      };

      // Handle logo upload if present
      if (logoFile) {
        const formDataObj = new FormData();
        Object.keys(payload).forEach(key => {
          if (payload[key] !== null && payload[key] !== undefined) {
            formDataObj.append(key, payload[key]);
          }
        });
        formDataObj.append('logo', {
          uri: logoFile.uri,
          name: logoFile.name,
          type: logoFile.type,
        } as any);

        const response = await http.patch('api/organization/onboard', formDataObj, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        if (response.data && onUpdate) {
          onUpdate(response.data);
        }
      } else {
        const response = await http.patch('api/organization/onboard', payload);
        if (response.data && onUpdate) {
          onUpdate(response.data);
        }
      }

      Toast.show({
        type: 'success',
        text1: 'Organization Updated',
        text2: 'Your organization details were saved successfully.',
      });

      setIsEditing(false);
      setLogoFile(null);

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error?.response?.data?.message || 'Failed to save organization details',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        mobileNumber: organization.mobileNumber || '',
        businessEmail: organization.businessEmail || '',
        companyWebsite: organization.companyWebsite || '',
        companyType: organization.companyType || '',
        companySize: organization.companySize || '',
        panNumber: organization.panNumber || '',
        cinNumber: organization.cinNumber || '',
        udyamNumber: organization.udyamNumber || '',
        address: organization.address || '',
        city: organization.city || '',
        state: organization.state || '',
        country: organization.country || '',
      });
    }
    setLogoFile(null);
    setIsEditing(false);
  };

  const handlePickLogo = async () => {
    try {
      const res = await pick({
        type: ['image/*'],
        allowMultiSelection: false,
      });

      const file = res[0];

      setLogoFile({
        uri: file.uri,
        name: file.name || 'logo.jpg',
        type: file.type || 'image/jpeg',
      });

    } catch (err: any) {
      if (err?.code === 'DOCUMENT_PICKER_CANCELED') return;

      Toast.show({
        type: 'error',
        text1: 'Logo Selection Failed',
        text2: 'Unable to select organization logo',
      });
    }
  };

  const formatCompanyType = (type: string) => {
    const found = companyTypes.find(t => t.value === type);
    return found?.label || type;
  };

  const formatCompanySize = (size: string) => {
    const found = companySizes.find(s => s.value === size);
    return found?.label || size;
  };

  return (
    <View className="mt-2">
      <View className="bg-white mx-4 rounded-2xl shadow-sm overflow-hidden">
        {/* Header with Edit/Save buttons */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
          <Text className="font-rubik-medium text-base text-gray-800">
            Organization Details
          </Text>
          {!isEditing ? (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              className="p-2 rounded-full"
              style={{ backgroundColor: `${colors.primary}0D` }}
              activeOpacity={0.7}
            >
              <Icon name="edit-2" size={18} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <View className="flex-row gap-2">
              <SecondaryButton
                title="Cancel"
                onPress={handleCancelEdit}
                disabled={isLoading}
              />
              <PrimaryButton
                title="Save"
                onPress={handleSave}
                loading={isLoading}
              />
            </View>
          )}
        </View>

        {isEditing ? (
          // ── Edit Form View ────────────────────────────────────────────────────
          <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
            
            {/* Logo Upload */}
            <View className="items-center mb-6">
              <TouchableOpacity
                onPress={handlePickLogo}
                className="mb-2"
                activeOpacity={0.7}
              >
                <View
                  className="w-24 h-24 rounded-full border-2 items-center justify-center overflow-hidden"
                  style={{
                    borderColor: colors.primary,
                    backgroundColor: `${colors.primary}0D`,
                  }}
                >
                  {logoFile?.uri ? (
                    <Image
                      source={{ uri: logoFile.uri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : organization?.logoUrl ? (
                    <Image
                      source={{ uri: organization.logoUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Icon name="camera" size={32} color={colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
              <Text className="font-rubik text-xs text-gray-500">
                Tap to change logo
              </Text>
            </View>

            {/* Basic Information */}
            <Text className="font-rubik-medium text-sm text-gray-700 mb-3">
              Basic Information
            </Text>

            <Input
              label="Organization Name"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter organization name"
              required
            />

            <Input
              label="Mobile Number"
              value={formData.mobileNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, mobileNumber: text }))}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              required
            />

            <Input
              label="Business Email"
              value={formData.businessEmail}
              onChangeText={(text) => setFormData(prev => ({ ...prev, businessEmail: text }))}
              placeholder="contact@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              required
            />

            <Input
              label="Company Website"
              value={formData.companyWebsite}
              onChangeText={(text) => setFormData(prev => ({ ...prev, companyWebsite: text }))}
              placeholder="https://www.company.com"
              autoCapitalize="none"
            />

            {/* Company Type & Size */}
            <Input
              label="Company Type"
              value={formData.companyType}
              onChangeText={(text) => setFormData(prev => ({ ...prev, companyType: text }))}
              placeholder="Select company type"
              type="select"
              options={companyTypes}
              required
            />

            <Input
              label="Company Size"
              value={formData.companySize}
              onChangeText={(text) => setFormData(prev => ({ ...prev, companySize: text }))}
              placeholder="Select company size"
              type="select"
              options={companySizes}
              required
            />

            {/* Legal Information */}
            <Text className="font-rubik-medium text-sm text-gray-700 mb-3 mt-4">
              Legal Information
            </Text>

            <Input
              label="PAN Number"
              value={formData.panNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, panNumber: text.toUpperCase() }))}
              placeholder="ABCDE1234F"
              autoCapitalize="characters"
              maxLength={10}
              required
            />

            <Input
              label="CIN Number"
              value={formData.cinNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, cinNumber: text.toUpperCase() }))}
              placeholder="U51909DL2021PTC456787"
              autoCapitalize="characters"
            />

            <Input
              label="Udyam Number"
              value={formData.udyamNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, udyamNumber: text }))}
              placeholder="DYAM-DL-07-0098768"
            />

            {/* Address Information */}
            <Text className="font-rubik-medium text-sm text-gray-700 mb-3 mt-4">
              Address Information
            </Text>

            <Input
              label="Address"
              value={formData.address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
              placeholder="Enter street address"
              multiline
              numberOfLines={2}
              required
            />

            <Input
              label="City"
              value={formData.city}
              onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
              placeholder="Enter city"
              required
            />

            <Input
              label="State"
              value={formData.state}
              onChangeText={(text) => setFormData(prev => ({ ...prev, state: text }))}
              placeholder="Enter state"
              required
            />

            <Input
              label="Country"
              value={formData.country}
              onChangeText={(text) => setFormData(prev => ({ ...prev, country: text }))}
              placeholder="Enter country"
              required
            />

          </ScrollView>
        ) : (
          // ── Display View (same as original ProfileScreen) ────────────────────
          <View>
            {/* Org header row */}
            <View className="px-5 pt-4 pb-2">
              <View className="flex-row items-center gap-3.5">
                {organization.logoUrl ? (
                  <View className="w-14 h-14 rounded-md border border-gray-200 bg-white overflow-hidden">
                    <Image
                      source={{ uri: organization.logoUrl }}
                      className="w-full h-full"
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 items-center justify-center">
                    <Text className="font-rubik-bold text-2xl text-indigo-500">
                      {organization.name?.[0]?.toUpperCase() || 'O'}
                    </Text>
                  </View>
                )}

                <View className="flex-1">
                  <Text className="font-rubik-bold text-base text-gray-900 mb-0.5">
                    {organization.name}
                  </Text>
                  <Text className="font-rubik text-xs text-gray-500 capitalize">
                    {formatCompanyType(organization.companyType)} · {formatCompanySize(organization.companySize)}
                  </Text>
                </View>
              </View>
            </View>

            <CardDivider />

            <View className="px-5">
              <InfoRow label="Business Email" value={organization.businessEmail} />
              <InfoRow label="Mobile Number" value={organization.mobileNumber} />
              {organization.companyWebsite && (
                <InfoRow label="Website" value={organization.companyWebsite} />
              )}
              <InfoRow label="Address" value={organization.address} isLast />
            </View>

            {/* Location & Registration */}
            <View className="px-5 pb-4">
              <Text className="font-rubik-medium text-sm text-gray-700 mb-2 mt-2">
                Location & Registration
              </Text>
              <InfoRow
                label="City & State"
                value={[organization.city, organization.state].filter(Boolean).join(', ')}
              />
              <InfoRow label="Country" value={organization.country} />
              <InfoRow label="PAN Number" value={organization.panNumber} />
              {organization.cinNumber && <InfoRow label="CIN Number" value={organization.cinNumber} />}
              {organization.udyamNumber ? (
                <InfoRow label="Udyam Number" value={organization.udyamNumber} isLast />
              ) : null}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default OrganizationDetails;