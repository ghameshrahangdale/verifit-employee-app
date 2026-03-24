// screens/OrganizationOnboardingScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { AuthService } from '../services/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useNavigation, } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import Logo from '../components/common/Logo';
import { AppStackParamList } from '../navigation/AppStackNavigator';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { pick } from '@react-native-documents/picker';
import Feather from 'react-native-vector-icons/Feather';
import ConfirmationPopup from '../components/ui/ConfirmationPopup';

type OrganizationOnboardingScreenNavigationProp = StackNavigationProp<
  AppStackParamList,
  'Onboarding'
>;

const OrganizationOnboardingScreen: React.FC = () => {
  const { refreshUser, user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Form state matching the API requirements
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    panNumber: '',
    companyType: 'other',
    address: '',
    country: '',
    state: '',
    city: '',
    businessEmail: user?.email || '',
    companyWebsite: '',
    logoUrl: '',
    udyamNumber: '',
    cinNumber: '',
    companySize: '1-10',
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { colors } = useTheme();
  const [logoFile, setLogoFile] = useState<any>(null);
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    mobileNumber: '',
    panNumber: '',
    address: '',
    country: '',
    state: '',
    city: '',
    // businessEmail: '',
    companyWebsite: '',
    logoUrl: '',
    udyamNumber: '',
    cinNumber: '',
    companyType: ''
  });

  const handlePickLogo = async () => {
    try {
      const result = await pick({
        type: ['image/jpeg', 'image/png', 'image/jpg'],
        allowMultiSelection: false,
      });

      if (result && result.length > 0) {
        setLogoFile(result[0]);

        setFormData(prev => ({
          ...prev,
          logoUrl: result[0].uri, // store uri temporarily
        }));
      }
    } catch (err: any) {
      if (err?.code !== 'DOCUMENT_PICKER_CANCELED') {
        Toast.show({
          type: 'error',
          text1: 'File Selection Failed',
          text2: 'Unable to pick file',
        });
      }
    }
  };

  const handleClearLogo = () => {
    setLogoFile(null);

    setFormData(prev => ({
      ...prev,
      logoUrl: '',
    }));
  };

  const navigation = useNavigation<OrganizationOnboardingScreenNavigationProp>();

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

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  const cinRegex =
    /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;

  const udyamRegex =
    /^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$/;

  const emailRegex = /^\S+@\S+\.\S+$/;

  const urlRegex =
    /^(https?:\/\/)?([\w\d-]+\.)+[\w-]{2,}(\/.*)?$/i;

  // Handle input changes
  // Update handleChange to set field-specific errors only
const handleChange = (field: string, value: string) => {
  setFormData(prev => ({
    ...prev,
    [field]: value,
  }));

  let fieldError = '';

  switch (field) {
    case 'name':
      if (!value.trim()) {
        fieldError = 'Company name is required';
      }
      break;

    case 'mobileNumber':
      if (!value.trim()) {
        fieldError = 'Mobile number is required';
      } else if (value.length < 10) {
        fieldError = 'Mobile number must be 10 digits';
      }
      break;

    case 'panNumber':
      if (!value.trim()) {
        fieldError = 'PAN number is required';
      } else if (!panRegex.test(value.toUpperCase())) {
        fieldError = 'Invalid PAN number format. Please enter valid PAN number ex. ABCDE1234F';
      }
      break;

    case 'address':
      if (!value.trim()) {
        fieldError = 'Address is required';
      }
      break;

    case 'country':
      if (!value.trim()) {
        fieldError = 'Country is required';
      }
      break;

    case 'state':
      if (!value.trim()) {
        fieldError = 'State is required';
      }
      break;

    case 'city':
      if (!value.trim()) {
        fieldError = 'City is required';
      }
      break;

    case 'companyWebsite':
      if (value && !urlRegex.test(value.trim())) {
        fieldError = 'Please enter a valid website URL';
      }
      break;

    case 'udyamNumber':
      if (value && !udyamRegex.test(value.toUpperCase())) {
        fieldError = 'Invalid Udyam format. Example: UDYAM-MH-12-1234567';
      }
      break;

    case 'cinNumber':
      if (value && !cinRegex.test(value.toUpperCase())) {
        fieldError = 'Invalid CIN format. Example: L12345MH2020PLC123456';
      }
      break;
  }

  setFieldErrors(prev => ({
    ...prev,
    [field]: fieldError,
  }));
  
  // Clear general error when user starts typing
  if (fieldError) setError(null);
};
  // Validate current step
  // Update validateStep to check field errors instead of setting general error
const validateStep = (step: number): boolean => {
  // Clear general error first
  setError(null);
  
  // Create a temporary errors object to validate
  const errors: any = {};

  switch (step) {
    case 1:
      if (!formData.name.trim()) {
        errors.name = 'Company name is required';
      }
      if (!formData.mobileNumber.trim()) {
        errors.mobileNumber = 'Mobile number is required';
      } else if (formData.mobileNumber.length < 10) {
        errors.mobileNumber = 'Please enter a valid 10-digit mobile number';
      }
      if (!formData.panNumber.trim()) {
        errors.panNumber = 'PAN number is required';
      } else if (formData.panNumber.length < 10) {
        errors.panNumber = 'Please enter a valid PAN number';
      } else if (!panRegex.test(formData.panNumber.toUpperCase())) {
        errors.panNumber = 'Invalid PAN number format';
      }
      
      // Set field errors if any
      if (Object.keys(errors).length > 0) {
        setFieldErrors(prev => ({ ...prev, ...errors }));
        return false;
      }
      break;

    case 2:
      if (!formData.address.trim()) {
        errors.address = 'Address is required';
      }
      if (!formData.country.trim()) {
        errors.country = 'Country is required';
      }
      if (!formData.state.trim()) {
        errors.state = 'State is required';
      }
      if (!formData.city.trim()) {
        errors.city = 'City is required';
      }
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(prev => ({ ...prev, ...errors }));
        return false;
      }
      break;

    case 3:
      if (formData.companyWebsite && !urlRegex.test(formData.companyWebsite.trim())) {
        errors.companyWebsite = 'Please enter a valid website URL';
      }
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(prev => ({ ...prev, ...errors }));
        return false;
      }
      break;
  }

  return true;
};

  // Optional: Clear field errors when moving between steps
const handleNext = () => {
  if (validateStep(currentStep)) {
    setCurrentStep(prev => prev + 1);
    setError(null);
    // Clear field errors when moving to next step (optional)
    // setFieldErrors({}); // Uncomment if you want to reset errors when changing steps
  }
};

const handlePrev = () => {
  setCurrentStep(prev => prev - 1);
  setError(null);
  
};
  // Handle form submission
  const handleOnboarding = async () => {
    if (!validateStep(3)) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = {
        name: formData.name.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        panNumber: formData.panNumber.trim().toUpperCase(),
        companyType: formData.companyType,
        address: formData.address.trim(),
        country: formData.country.trim(),
        state: formData.state.trim(),
        city: formData.city.trim(),
        // businessEmail: formData.businessEmail.trim(),
        companyWebsite: formData.companyWebsite?.trim() || undefined,
        logoUrl: formData.logoUrl || undefined,
        udyamNumber: formData.udyamNumber?.trim() || undefined,
        cinNumber: formData.cinNumber?.trim().toUpperCase() || undefined,
        companySize: formData.companySize || "",
        logo: logoFile || null,
      };

      const response = await AuthService.organizationOnboard(payload);

      Toast.show({
        type: "success",
        text1: "Onboarding Successful",
        text2: response.message || "Organization registered successfully",
      });

      await refreshUser();
      navigation.navigate("Tabs");

    } catch (err: any) {
      const errorMessage =
        err.message || "An unexpected error occurred";

      setError(errorMessage);

      Toast.show({
        type: "error",
        text1: "Onboarding Failed",
        text2: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };
  // Render step indicator
  const renderStepIndicator = () => {
    return (
      <View className="flex-row justify-center mb-6">
        {[1, 2, 3, 4].map((step) => {
          const isCompleted = currentStep > step;
          const isCurrent = currentStep === step;

          return (
            <React.Fragment key={step}>
              <View className="items-center">

                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isCompleted
                      ? '#16A34A'
                      : isCurrent
                        ? colors.primary
                        : '#E5E7EB',
                  }}
                >
                  {isCompleted ? (
                    <Icon name="check" size={20} color="white" />
                  ) : (
                    <Text
                      className="font-rubik-bold"
                      style={{
                        color: isCurrent ? '#fff' : '#6B7280',
                      }}
                    >
                      {step}
                    </Text>
                  )}
                </View>

                <Text
                  className="text-xs mt-1 font-rubik"
                  style={{
                    color: isCompleted
                      ? '#16A34A'
                      : isCurrent
                        ? colors.primary
                        : '#9CA3AF',
                  }}
                >
                  {step === 1
                    ? 'Basic'
                    : step === 2
                      ? 'Address'
                      : step === 3
                        ? 'Contact'
                        : 'Additional'}
                </Text>

              </View>

              {step < 4 && (
                <View
                  className="w-12 h-[2px] self-center mx-2"
                  style={{
                    backgroundColor:
                      currentStep > step ? '#16A34A' : '#E5E7EB',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  // Render step 1: Company Information
  const renderStep1 = () => (
    <View className="space-y-4">
      <Text className="text-xl font-rubik-bold text-gray-800 mb-4">
        Basic Information
      </Text>

      <Input
        label="Company Name"
        value={formData.name}
        onChangeText={(value) => handleChange('name', value)}
        placeholder="Enter company name"
        required
        error={fieldErrors.name}
      />

      <Input
        label="Mobile Number"
        value={formData.mobileNumber}
        onChangeText={(value) => handleChange('mobileNumber', value)}
        placeholder="Enter mobile number"
        keyboardType="phone-pad"
        required
        maxLength={10}
        error={fieldErrors.mobileNumber}

      />

      <Input
        label="PAN Number"
        value={formData.panNumber}
        onChangeText={(value) => handleChange('panNumber', value)}
        placeholder="Enter PAN number"
        autoCapitalize="characters"
        required
        maxLength={10}
        error={fieldErrors.panNumber}
      />

      <Select
        label="Company Type"
        value={formData.companyType}
        onValueChange={(value) => handleChange('companyType', value)}
        options={companyTypes}
        placeholder="Select company type"
        required
        error={fieldErrors.companyType}
      />

      <Select
        label="Company Size (Optional)"
        value={formData.companySize}
        onValueChange={(value) => handleChange('companySize', value)}
        options={companySizes}
        placeholder="Select company size"
      />
    </View>
  );

  // Render step 2: Organization Address
  const renderStep2 = () => (
    <View className="space-y-4">
      <Text className="text-xl font-rubik-bold text-gray-800 mb-4">
        Address Details
      </Text>
      <Input
        label="Address"
        value={formData.address}
        onChangeText={(value) => handleChange('address', value)}
        placeholder="Enter business address"
        required
        error={fieldErrors.address}
      />
      <Input
        label="Country"
        value={formData.country}
        onChangeText={(value) => handleChange('country', value)}
        placeholder="Enter country"
        required
        error={fieldErrors.country}

      />
      <Input
        label="State"
        value={formData.state}
        onChangeText={(value) => handleChange('state', value)}
        placeholder="Enter state"
        required
        error={fieldErrors.state}


      />
      <Input
        label="City"
        value={formData.city}
        onChangeText={(value) => handleChange('city', value)}
        placeholder="Enter city"
        required
        error={fieldErrors.city}

      />
    </View>
  );

  // Render step 3: Additional Details
  const renderStep3 = () => (
    <View className="space-y-4">
      <Text className="text-xl font-rubik-bold text-gray-800 mb-4">
        Contact Information
      </Text>

      <Input
        label="Business Email"
        value={user?.email || ''}
        disabled
        placeholder="Business email"
        onChangeText={() => ''}
      />
      <Input
        label="Company Website (Optional)"
        value={formData.companyWebsite}
        onChangeText={(value) => handleChange('companyWebsite', value)}
        placeholder="Enter company website"
        autoCapitalize="none"
        error={fieldErrors.companyWebsite}
        hint="Add URL here (e.g. https://example.com)"


      />
    </View>
  );

  const renderStep4 = () => (
    <View className="space-y-4">
      <Text className="text-xl font-rubik-bold text-gray-800 mb-4">
        Additional Information
      </Text>

      <View className="space-y-2">
        <Text className="mb-2 font-rubik-medium text-gray-700">
          Company Logo (Optional)
        </Text>

        {!logoFile ? (
          <TouchableOpacity
            onPress={handlePickLogo}
            className="mb-4 border border-gray-300 rounded-lg p-4 flex-row items-center justify-between"
          >
            <Text className="text-gray-600 font-rubik">
              Select Logo (JPG, PNG)
            </Text>

            <Icon name="upload-file" size={22} color="#6B7280" />
          </TouchableOpacity>
        ) : (
          <View className="border border-gray-300 rounded-lg p-4 mb-4">

            {/* Logo Preview */}
            <Image
              source={{ uri: logoFile.uri }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 10,
                marginBottom: 10,
              }}
            />

            {/* File Name */}
            <Text className="text-gray-700 font-rubik text-sm mb-3">
              {logoFile.name}
            </Text>

            {/* Actions */}
            <View className="flex-row gap-4">

              <TouchableOpacity
                onPress={handlePickLogo}
                className="bg-gray-100 px-4 py-2 rounded-lg"
              >
                <Text className="font-rubik text-gray-700">
                  Change
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClearLogo}
                className="bg-red-50 px-4 py-2 rounded-lg"
              >
                <Text className="font-rubik text-red-600">
                  Remove
                </Text>
              </TouchableOpacity>

            </View>

          </View>
        )}
      </View>

      <Input
        label="Udyam Number (Optional)"
        value={formData.udyamNumber}
        onChangeText={(value) => handleChange('udyamNumber', value)}
        placeholder="Enter Udyam number"
        error={fieldErrors.udyamNumber}
        autoCapitalize="characters"

      />

      <Input
        label="CIN Number (Optional)"
        value={formData.cinNumber}
        onChangeText={(value) => handleChange('cinNumber', value)}
        placeholder="Enter CIN number"
        autoCapitalize="characters"
        error={fieldErrors.cinNumber}

      />
    </View>
  );

  // 3. Add logout handler function inside the component
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      await logout();

      Toast.show({
        type: 'success',
        text1: 'Logged out',
        text2: 'You have been logged out successfully',
        position: 'bottom',
        visibilityTime: 3000,
      });



    } catch (error: any) {
      console.error('Logout error:', error);

      Toast.show({
        type: 'error',
        text1: 'Logout failed',
        text2: error.message || 'Please try again',
        position: 'bottom',
        visibilityTime: 4000,
      });
    } finally {
      setIsLoggingOut(false);
      setShowLogout(false);
    }
  };


  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 py-8">
            <View className="bg-white ">

              <View className="mb-6 flex-row items-center justify-between">
                <Logo size="md" />

                {/* Logout Button */}
                <TouchableOpacity
                  onPress={() => setShowLogout(true)}
                  disabled={isLoggingOut}
                  className="p-2"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather
                    name={isLoggingOut ? "loader" : "log-out"}
                    size={18}
                    color="#EF4444"
                  />
                </TouchableOpacity>
              </View>

              <Text className="text-2xl font-rubik-bold text-left text-gray-900">
                Organization Onboarding
              </Text>
              <Text className=" font-rubik text-left text-gray-900 mb-6">
                Please provide your company details to complete the registration process.
              </Text>


              {/* Step Indicator */}
              {renderStepIndicator()}

              {/* Error Message Display */}
              {error && (
                <View className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <Text className="text-red-600 text-center font-rubik">
                    {error}
                  </Text>
                </View>
              )}

              {/* Success Message Display */}
              {successMessage && (
                <View className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <Text className="text-green-600 text-center font-rubik">
                    {successMessage}
                  </Text>
                </View>
              )}

              {/* Step Content */}
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}

              {/* Navigation Buttons */}
              <View className="flex-row justify-between mt-8 space-x-4">
                {/* Previous Button */}
                {currentStep > 1 && (
                  <TouchableOpacity
                    onPress={handlePrev}
                    className="flex-1 flex-row items-center justify-center bg-gray-100 py-3 rounded-lg"
                    disabled={isLoading}
                  >
                    <Icon name="arrow-back" size={20} color="#4B5563" />
                    <Text className="text-gray-600 font-rubik-medium ml-2">
                      Previous
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Next / Submit Button */}
                {currentStep < 4 ? (
                  <TouchableOpacity
                    onPress={handleNext}
                    className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${currentStep > 1 ? 'ml-4' : ''
                      }`}
                    style={{ backgroundColor: colors.primary }}
                    disabled={isLoading}
                  >
                    <Text className="text-white font-rubik-medium mr-2">
                      Next
                    </Text>
                    <Icon name="arrow-forward" size={20} color="white" />
                  </TouchableOpacity>
                ) : (
                  <Button
                    title={isLoading ? "Saving..." : "Onboard"}
                    onPress={handleOnboarding}
                    loading={isLoading}
                    className={`flex-1 ${currentStep > 1 ? 'ml-4' : ''}`}
                    disabled={isLoading}
                  />
                )}
              </View>
            </View>
          </View>
        </ScrollView>

      </KeyboardAvoidingView>
      {/* Logout Confirmation Popup */}
      <ConfirmationPopup
        visible={showLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        onCancel={() => setShowLogout(false)}
        onConfirm={handleLogout}
      />
    </View>
  );
};

export default OrganizationOnboardingScreen;