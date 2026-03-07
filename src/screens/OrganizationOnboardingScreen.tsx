// screens/OrganizationOnboardingScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { AuthService } from '../services/auth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { useNavigation,} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import Logo from '../components/common/Logo';
import { AppStackParamList } from '../navigation/AppStackNavigator';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; 

type OrganizationOnboardingScreenNavigationProp = StackNavigationProp<
  AppStackParamList,
  'Onboarding'
>;

const OrganizationOnboardingScreen: React.FC = () => {
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
    businessEmail: '',
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

  const navigation = useNavigation<OrganizationOnboardingScreenNavigationProp>();
    const { refreshUser } = useAuth();

  // Company type options
  const companyTypes = [
    { label: 'Private Limited', value: 'private_limited' },
    { label: 'Public Limited', value: 'public_limited' },
    { label: 'Partnership', value: 'partnership' },
    { label: 'Sole Proprietorship', value: 'sole_proprietorship' },
    { label: 'LLP', value: 'llp' },
    { label: 'Other', value: 'other' },
  ];

  // Company size options
  const companySizes = [
    { label: '1-10 employees', value: '1-10' },
    { label: '11-50 employees', value: '11-50' },
    { label: '51-200 employees', value: '51-200' },
    { label: '201-500 employees', value: '201-500' },
    { label: '501-1000 employees', value: '501-1000' },
    { label: '1000+ employees', value: '1000+' },
  ];

  // Handle input changes
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear general error when user makes changes
    if (error) setError(null);
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    setError(null);

    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          setError("Organization name is required");
          return false;
        }
        if (!formData.mobileNumber.trim()) {
          setError("Mobile number is required");
          return false;
        }
        if (!formData.panNumber.trim()) {
          setError("PAN number is required");
          return false;
        }
        // PAN number validation (basic)
        if (formData.panNumber.length < 10) {
          setError("Please enter a valid PAN number");
          return false;
        }
        // Mobile number validation (basic)
        if (formData.mobileNumber.length < 10) {
          setError("Please enter a valid mobile number");
          return false;
        }
        break;

      case 2:
        if (!formData.address.trim()) {
          setError("Address is required");
          return false;
        }
        if (!formData.country.trim()) {
          setError("Country is required");
          return false;
        }
        if (!formData.state.trim()) {
          setError("State is required");
          return false;
        }
        if (!formData.city.trim()) {
          setError("City is required");
          return false;
        }
        break;

      case 3:
        if (!formData.businessEmail.trim()) {
          setError("Business email is required");
          return false;
        }
        // Email validation
        if (!formData.businessEmail.includes('@') || !/\S+@\S+\.\S+/.test(formData.businessEmail)) {
          setError("Please enter a valid business email address");
          return false;
        }
        break;
    }

    return true;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError(null);
    }
  };

  // Handle previous step
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
      // Prepare payload matching the API exactly
      const payload = {
        name: formData.name.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        panNumber: formData.panNumber.trim().toUpperCase(),
        companyType: formData.companyType,
        address: formData.address.trim(),
        country: formData.country.trim(),
        state: formData.state.trim(),
        city: formData.city.trim(),
        businessEmail: formData.businessEmail.toLowerCase().trim(),
        companyWebsite: formData.companyWebsite.trim() || undefined,
        logoUrl: formData.logoUrl.trim() || undefined,
        udyamNumber: formData.udyamNumber.trim() || undefined,
        cinNumber: formData.cinNumber.trim().toUpperCase() || undefined,
        companySize: formData.companySize,
      };

      const response = await AuthService.organizationOnboard(payload);
      
      // Show success message
      setSuccessMessage(response.message || "Organization onboarding successful!");
      
      Toast.show({
        type: 'success',
        text1: 'Onboarding Successful',
        text2: response.message || 'Organization details saved successfully',
        visibilityTime: 5000,
      });

      await refreshUser();

      // Clear form
      setFormData({
        name: '',
        mobileNumber: '',
        panNumber: '',
        companyType: 'other',
        address: '',
        country: '',
        state: '',
        city: '',
        businessEmail: '',
        companyWebsite: '',
        logoUrl: '',
        udyamNumber: '',
        cinNumber: '',
        companySize: '1-10',
      });

      navigation.navigate("Tabs")

      

    } catch (err: any) {
      // Handle error
      const errorMessage = err.message || "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      
      Toast.show({
        type: 'error',
        text1: 'Onboarding Failed',
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
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <View className="items-center">
            
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{
                backgroundColor:
                  currentStep >= step ? colors.primary : '#E5E7EB',
              }}
            >
              <Text
                className="font-rubik-bold"
                style={{
                  color: currentStep >= step ? '#fff' : '#6B7280',
                }}
              >
                {step}
              </Text>
            </View>

            <Text
              className="text-xs mt-1 font-rubik"
              style={{
                color: currentStep >= step ? colors.primary : '#9CA3AF',
              }}
            >
              {step === 1 ? 'Company' : step === 2 ? 'Address' : 'Contact'}
            </Text>

          </View>

          {step < 3 && (
            <View
              className="w-12 h-[2px] self-center mx-2"
              style={{
                backgroundColor:
                  currentStep > step ? colors.primary : '#E5E7EB',
              }}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

  // Render step 1: Company Information
  const renderStep1 = () => (
    <View className="space-y-4">
      <Text className="text-xl font-rubik-bold text-gray-800 mb-4">
        Company Information
      </Text>
      <Input
        label="Organization Name"
        value={formData.name}
        onChangeText={(value) => handleChange('name', value)}
        placeholder="Enter organization name"
        required
      />
      <Input
        label="Mobile Number"
        value={formData.mobileNumber}
        onChangeText={(value) => handleChange('mobileNumber', value)}
        placeholder="Enter mobile number"
        keyboardType="phone-pad"
        required
      />
      <Input
        label="PAN Number"
        value={formData.panNumber}
        onChangeText={(value) => handleChange('panNumber', value)}
        placeholder="Enter PAN number"
        autoCapitalize="characters"
        required
      />
      <Select
        label="Company Type"
        value={formData.companyType}
        onValueChange={(value) => handleChange('companyType', value)}
        options={companyTypes}
        placeholder="Select company type"
        required
      />
    </View>
  );

  // Render step 2: Organization Address
  const renderStep2 = () => (
    <View className="space-y-4">
      <Text className="text-xl font-rubik-bold text-gray-800 mb-4">
        Organization Address
      </Text>
      <Input
        label="Address"
        value={formData.address}
        onChangeText={(value) => handleChange('address', value)}
        placeholder="Enter business address"
        required
      />
      <Input
        label="Country"
        value={formData.country}
        onChangeText={(value) => handleChange('country', value)}
        placeholder="Enter country"
        required
      />
      <Input
        label="State"
        value={formData.state}
        onChangeText={(value) => handleChange('state', value)}
        placeholder="Enter state"
        required
      />
      <Input
        label="City"
        value={formData.city}
        onChangeText={(value) => handleChange('city', value)}
        placeholder="Enter city"
        required
      />
    </View>
  );

  // Render step 3: Additional Details
  const renderStep3 = () => (
    <View className="space-y-4">
      <Text className="text-xl font-rubik-bold text-gray-800 mb-4">
        Contact & Additional Details
      </Text>
      <Input
        label="Business Email"
        value={formData.businessEmail}
        onChangeText={(value) => handleChange('businessEmail', value)}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Enter business email"
        required
      />
      <Input
        label="Company Website"
        value={formData.companyWebsite}
        onChangeText={(value) => handleChange('companyWebsite', value)}
        placeholder="Enter company website"
        autoCapitalize="none"
      />
      <Input
        label="Logo URL"
        value={formData.logoUrl}
        onChangeText={(value) => handleChange('logoUrl', value)}
        placeholder="Enter logo URL"
        autoCapitalize="none"
      />
      <Input
        label="Udyam Number"
        value={formData.udyamNumber}
        onChangeText={(value) => handleChange('udyamNumber', value)}
        placeholder="Enter Udyam number"
      />
      <Input
        label="CIN Number"
        value={formData.cinNumber}
        onChangeText={(value) => handleChange('cinNumber', value)}
        placeholder="Enter CIN number"
        autoCapitalize="characters"
      />
      <Select
        label="Company Size"
        value={formData.companySize}
        onValueChange={(value) => handleChange('companySize', value)}
        options={companySizes}
        placeholder="Select company size"
        required
      />
    </View>
  );

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
            <View className="bg-white px-6 py-8">
              
              <View className="mb-6 items-center">
                <Logo size="lg" />
              </View>

              <Text className="text-2xl font-rubik-bold text-center text-gray-900">
                Organization Onboarding
              </Text>
              <Text className="text-gray-500 text-center font-rubik mt-1 mb-6">
                Step {currentStep} of 3
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

              {/* Navigation Buttons */}
              <View className="flex-row justify-between mt-8 space-x-4">
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

                {currentStep < 3 ? (
                  <TouchableOpacity
                    onPress={handleNext}
                    className={`flex-1 flex-row items-center justify-center py-3 rounded-lg ${
                      currentStep > 1 ? 'ml-4' : ''
                    }`}
                    style={{backgroundColor: colors.primary}}
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
    </View>
  );
};

export default OrganizationOnboardingScreen;