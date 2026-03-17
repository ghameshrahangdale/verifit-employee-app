import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Toast from 'react-native-toast-message';
import http from '../../services/http.api';
import Loader from '../../components/ui/Loader';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/AppStackNavigator';
import { RefreshControl } from 'react-native-gesture-handler';
import Slider from '@react-native-community/slider';
import Input from '../ui/Input';

type HrReviewVerificationRouteProp = RouteProp<AppStackParamList, 'HrReviewVerification'>;

interface Discrepancy {
  fieldName: string;
  employeeClaimedValue: string;
  actualValue: string;
  remarks?: string;
}

interface BehaviorReport {
  teamworkRating: number;
  leadershipRating: number;
  communicationRating: number;
  integrityRating: number;
  performanceRating: number;
  policyViolation: boolean;
  disciplinaryAction: boolean;
  rehireRecommendation: boolean;
  remarks: string;
}

interface ReviewData {
  status: 'APPROVED' | 'REJECTED' | 'DISCREPANCIES';
  verificationMethod: 'MANUAL' | 'AUTO' | 'PARTIAL';
  comments: string;
  discrepancies: Discrepancy[];
  behaviorReport: BehaviorReport;
}

interface FieldStatus {
  [key: string]: {
    confirmed: boolean | null;
    actualValue: string;
    showInput: boolean;
  };
}

interface SalaryRecord {
  id: string;
  salaryType: string;
  amount: string;
  currency: string;
  frequency: string;
  bonusAmount: string | null;
  stockOptions: string | null;
  effectiveDate: string;
  verified: boolean;
}

interface Document {
  id: string;
  title: string;
  documentType: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  verified: boolean;
  uploadedAt: string;
}

interface Candidate {
  employeeId: string;
  name: string;
  email: string;
  phone: string | null;
  designation: string;
  department: string;
  linkedinUrl: string | null;
}

interface EmploymentRecord {
  id: string;
  companyName: string;
  designation: string;
  department: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  location: string;
  managerName: string;
  managerEmail: string;
  hrEmail: string;
  reasonForLeaving: string;
  rehireEligible: boolean;
  verificationStatus: string;
  verifiedAt: string | null;
}

interface VerificationRequestDetails {
  verificationRequest: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_REVIEW' | 'DISCREPANCIES';
    requestedAt: string;
    completedAt: string | null;
    verificationMethod: string | null;
    isPending: boolean;
    isCompleted: boolean;
    timeToComplete: string | null;
  };
  employmentRecord: EmploymentRecord;
  candidate: Candidate;
  salaryRecords: SalaryRecord[];
  discrepancies: any[];
  documents: Document[];
}

const HrReviewVerification: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute<HrReviewVerificationRouteProp>();
  const navigation = useNavigation();
  const { verificationId } = route.params;

  const [details, setDetails] = useState<VerificationRequestDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    employment: true,
    salary: true,
    documents: true,
    behavior: true,
    review: true,
  });

  // Track confirmation status for each field
  const [fieldStatus, setFieldStatus] = useState<FieldStatus>({});
  
  // Track which fields are being edited for actual value
  const [activeField, setActiveField] = useState<string | null>(null);

  const [reviewData, setReviewData] = useState<ReviewData>({
    status: 'DISCREPANCIES',
    verificationMethod: 'MANUAL',
    comments: '',
    discrepancies: [],
    behaviorReport: {
      teamworkRating: 5,
      leadershipRating: 5,
      communicationRating: 5,
      integrityRating: 5,
      performanceRating: 5,
      policyViolation: false,
      disciplinaryAction: false,
      rehireRecommendation: true,
      remarks: '',
    },
  });

  useEffect(() => {
    fetchVerificationDetails();
  }, [verificationId]);

  const fetchVerificationDetails = async () => {
    try {
      setIsLoading(true);
      const response = await http.get(`/api/verification/employee/create-request/${verificationId}`);
      
      if (response.data) {
        setDetails(response.data);
        // Initialize field status for all fields
        initializeFieldStatus(response.data);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Details',
        text2: error.response?.data?.message || 'Unable to fetch verification details',
      });
      navigation.goBack();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const initializeFieldStatus = (data: VerificationRequestDetails) => {
    const initialStatus: FieldStatus = {
      // Personal fields
      'candidate_name': { confirmed: null, actualValue: '', showInput: false },
      'candidate_email': { confirmed: null, actualValue: '', showInput: false },
      'candidate_phone': { confirmed: null, actualValue: '', showInput: false },
      
      // Employment fields
      'company_name': { confirmed: null, actualValue: '', showInput: false },
      'designation': { confirmed: null, actualValue: '', showInput: false },
      'department': { confirmed: null, actualValue: '', showInput: false },
      'employment_type': { confirmed: null, actualValue: '', showInput: false },
      'start_date': { confirmed: null, actualValue: '', showInput: false },
      'end_date': { confirmed: null, actualValue: '', showInput: false },
      'location': { confirmed: null, actualValue: '', showInput: false },
      'manager_name': { confirmed: null, actualValue: '', showInput: false },
      'manager_email': { confirmed: null, actualValue: '', showInput: false },
      'hr_email': { confirmed: null, actualValue: '', showInput: false },
      'reason_for_leaving': { confirmed: null, actualValue: '', showInput: false },
      'rehire_eligible': { confirmed: null, actualValue: '', showInput: false },
    };

    // Initialize salary fields
    data.salaryRecords.forEach((salary, index) => {
      initialStatus[`salary_${index}_type`] = { confirmed: null, actualValue: '', showInput: false };
      initialStatus[`salary_${index}_amount`] = { confirmed: null, actualValue: '', showInput: false };
      initialStatus[`salary_${index}_frequency`] = { confirmed: null, actualValue: '', showInput: false };
      if (salary.bonusAmount) {
        initialStatus[`salary_${index}_bonus`] = { confirmed: null, actualValue: '', showInput: false };
      }
    });

    setFieldStatus(initialStatus);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchVerificationDetails();
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleConfirm = (fieldKey: string) => {
    setFieldStatus(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        confirmed: true,
        showInput: false,
        actualValue: '',
      },
    }));

    // Remove from discrepancies if it was previously added
    const fieldName = formatFieldName(fieldKey);
    setReviewData(prev => ({
      ...prev,
      discrepancies: prev.discrepancies.filter(d => d.fieldName !== fieldName),
    }));
  };

  const handleReject = (fieldKey: string) => {
    setFieldStatus(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        confirmed: false,
        showInput: true,
      },
    }));
    setActiveField(fieldKey);
  };

  const handleSubmitActualValue = (fieldKey: string) => {
    const field = fieldStatus[fieldKey];
    if (!field.actualValue.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Actual Value Required',
        text2: 'Please enter the actual value',
      });
      return;
    }

    // Get the original claimed value based on field type
    let claimedValue = '';
    const fieldName = formatFieldName(fieldKey);
    
    if (fieldKey.startsWith('candidate_')) {
      if (fieldKey === 'candidate_name') claimedValue = details?.candidate.name || '';
      if (fieldKey === 'candidate_email') claimedValue = details?.candidate.email || '';
      if (fieldKey === 'candidate_phone') claimedValue = details?.candidate.phone || '';
    } else if (fieldKey.startsWith('salary_')) {
      // Parse salary field
      const parts = fieldKey.split('_');
      const index = parseInt(parts[1]);
      const salaryField = parts[2];
      const salary = details?.salaryRecords[index];
      if (salary) {
        if (salaryField === 'amount') claimedValue = `${getCurrencySymbol(salary.currency)}${salary.amount}`;
        else if (salaryField === 'type') claimedValue = getSalaryTypeLabel(salary.salaryType);
        else if (salaryField === 'frequency') claimedValue = salary.frequency;
        else if (salaryField === 'bonus') claimedValue = salary.bonusAmount || '';
      }
    } else {
      // Employment fields
      const employmentMap: { [key: string]: string } = {
        'company_name': details?.employmentRecord.companyName || '',
        'designation': details?.employmentRecord.designation || '',
        'department': details?.employmentRecord.department || '',
        'employment_type': getEmploymentTypeLabel(details?.employmentRecord.employmentType || ''),
        'start_date': formatDate(details?.employmentRecord.startDate || ''),
        'end_date': formatDate(details?.employmentRecord.endDate || ''),
        'location': details?.employmentRecord.location || '',
        'manager_name': details?.employmentRecord.managerName || '',
        'manager_email': details?.employmentRecord.managerEmail || '',
        'hr_email': details?.employmentRecord.hrEmail || '',
        'reason_for_leaving': details?.employmentRecord.reasonForLeaving || '',
        'rehire_eligible': details?.employmentRecord.rehireEligible ? 'Yes' : 'No',
      };
      claimedValue = employmentMap[fieldKey] || '';
    }

    // Add to discrepancies
    const discrepancy: Discrepancy = {
      fieldName: fieldName,
      employeeClaimedValue: claimedValue,
      actualValue: field.actualValue,
      remarks: `Updated by HR during verification`,
    };

    setReviewData(prev => ({
      ...prev,
      discrepancies: [...prev.discrepancies, discrepancy],
    }));

    // Update field status
    setFieldStatus(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        showInput: false,
      },
    }));
    setActiveField(null);

    Toast.show({
      type: 'success',
      text1: 'Discrepancy Added',
      text2: 'The actual value has been recorded',
    });
  };

  const handleCancelInput = (fieldKey: string) => {
    setFieldStatus(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        confirmed: null,
        showInput: false,
        actualValue: '',
      },
    }));
    setActiveField(null);
  };

  const handleSubmitReview = async () => {
    try {
      setIsSubmitting(true);

      // Check if all fields are reviewed
      const allFieldsReviewed = Object.values(fieldStatus).every(
        field => field.confirmed !== null || field.showInput === false
      );

      if (!allFieldsReviewed) {
        Toast.show({
          type: 'error',
          text1: 'Incomplete Review',
          text2: 'Please review all fields before submitting',
        });
        setIsSubmitting(false);
        return;
      }

      if (!reviewData.comments) {
        Toast.show({
          type: 'error',
          text1: 'Comments Required',
          text2: 'Please add your review comments',
        });
        setIsSubmitting(false);
        return;
      }

      // Determine status based on discrepancies
      const hasDiscrepancies = reviewData.discrepancies.length > 0;
      const allConfirmed = Object.values(fieldStatus).every(field => field.confirmed === true);

      const payload = {
        status: hasDiscrepancies ? 'DISCREPANCIES' : (allConfirmed ? 'APPROVED' : 'REJECTED'),
        verificationMethod: reviewData.verificationMethod,
        employmentConfirmed: fieldStatus['company_name']?.confirmed && fieldStatus['start_date']?.confirmed,
        designationConfirmed: fieldStatus['designation']?.confirmed || false,
        salaryConfirmed: Object.keys(fieldStatus).some(key => key.includes('salary_amount') && fieldStatus[key]?.confirmed),
        tenureConfirmed: fieldStatus['start_date']?.confirmed && fieldStatus['end_date']?.confirmed,
        behaviorConfirmed: true,
        comments: reviewData.comments,
        discrepancies: reviewData.discrepancies,
        behaviorReport: reviewData.behaviorReport,
      };

      const response = await http.patch(
        `/api/verification/employee/create-request/${verificationId}`,
        payload
      );

      if (response.data) {
        Toast.show({
          type: 'success',
          text1: 'Review Submitted',
          text2: 'The verification request has been reviewed successfully',
        });
        navigation.goBack();
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error.response?.data?.message || 'Unable to submit review',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDocument = async (document: Document) => {
    try {
      const supported = await Linking.canOpenURL(document.fileUrl);
      if (supported) {
        await Linking.openURL(document.fileUrl);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Cannot Open Document',
          text2: 'Unable to open this document URL',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to open document',
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFieldName = (fieldKey: string): string => {
    return fieldKey
      .replace('candidate_', '')
      .replace('salary_', '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getEmploymentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      full_time: 'Full Time',
      part_time: 'Part Time',
      contract: 'Contract',
      internship: 'Internship',
      temporary: 'Temporary',
    };
    return types[type] || type.replace('_', ' ');
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      resume: 'Resume',
      experience_letter: 'Experience Letter',
      offer_letter: 'Offer Letter',
      relieving_letter: 'Relieving Letter',
      payslip: 'Payslip',
      id_proof: 'ID Proof',
      address_proof: 'Address Proof',
      education_certificate: 'Education Certificate',
      other: 'Other',
    };
    return types[type] || type.replace('_', ' ');
  };

  const getSalaryTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      basic: 'Basic Salary',
      hra: 'HRA',
      special_allowance: 'Special Allowance',
      bonus: 'Bonus',
      other: 'Other',
    };
    return types[type] || type.replace('_', ' ');
  };

  const getCurrencySymbol = (currency: string): string => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      AED: 'د.إ',
      SGD: 'S$',
    };
    return symbols[currency] || currency;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const ReviewField = ({ 
    label, 
    value, 
    fieldKey,
    isLast = false 
  }: { 
    label: string; 
    value: string; 
    fieldKey: string;
    isLast?: boolean;
  }) => {
    const status = fieldStatus[fieldKey];
    const isActive = activeField === fieldKey;

    return (
      <View className={`py-3 ${!isLast ? 'border-b border-gray-100' : ''}`}>
        <View className="flex-row items-start">
          {/* Label and Value */}
          <View className="flex-1">
            <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-1">
              {label}
            </Text>
            <Text className="font-rubik-medium text-sm text-gray-800">
              {value}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row items-center ml-3">
            {status?.confirmed === true ? (
              <View className="bg-green-50 px-3 py-1.5 rounded-full border border-green-200 flex-row items-center">
                <Feather name="check" size={14} color="#10B981" />
                <Text className="font-rubik-medium text-xs text-green-700 ml-1">
                  Confirmed
                </Text>
              </View>
            ) : status?.confirmed === false ? (
              <View className="bg-red-50 px-3 py-1.5 rounded-full border border-red-200 flex-row items-center">
                <Feather name="x" size={14} color="#EF4444" />
                <Text className="font-rubik-medium text-xs text-red-700 ml-1">
                  Rejected
                </Text>
              </View>
            ) : (
              !status?.showInput && (
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleConfirm(fieldKey)}
                    className="w-8 h-8 rounded-full bg-green-50 border border-green-200 items-center justify-center"
                  >
                    <Feather name="check" size={16} color="#10B981" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleReject(fieldKey)}
                    className="w-8 h-8 rounded-full bg-red-50 border border-red-200 items-center justify-center"
                  >
                    <Feather name="x" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )
            )}
          </View>
        </View>

        {/* Actual Value Input */}
        {status?.showInput && (
          <View className="mt-3 bg-gray-50 rounded-xl p-3">
           
            
            <Input
            label='Enter Actual Value'
              value={status.actualValue || ''}
              onChangeText={(text) => 
                setFieldStatus(prev => ({
                  ...prev,
                  [fieldKey]: { ...prev[fieldKey], actualValue: text }
                }))
              }
              placeholder="Enter actual value"
              type="text"
            />

            <View className="flex-row gap-2 mt-2">
              <TouchableOpacity
                onPress={() => handleSubmitActualValue(fieldKey)}
                className="flex-1 bg-purple-500 py-2 rounded-lg items-center"
              >
                <Text className="font-rubik-medium text-sm text-white">Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleCancelInput(fieldKey)}
                className="flex-1 bg-gray-200 py-2 rounded-lg items-center"
              >
                <Text className="font-rubik-medium text-sm text-gray-700">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const RatingSlider = ({ 
    label, 
    value, 
    onChange,
    icon 
  }: { 
    label: string; 
    value: number; 
    onChange: (val: number) => void;
    icon: string;
  }) => (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Feather name={icon} size={16} color={colors.primary} />
          <Text className="font-rubik-medium text-sm text-gray-700 ml-2">
            {label}
          </Text>
        </View>
        <View className="bg-primary-50 px-3 py-1 rounded-full">
          <Text className="font-rubik-bold text-sm text-primary-600">
            {value}/10
          </Text>
        </View>
      </View>
      <Slider
        minimumValue={0}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor="#E2E8F0"
        thumbTintColor={colors.primary}
      />
      <View className="flex-row justify-between mt-1">
        <Text className="font-rubik text-xs text-gray-400">Poor</Text>
        <Text className="font-rubik text-xs text-gray-400">Excellent</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header title="Review Verification"/>
        <Loader fullScreen />
      </View>
    );
  }

  if (!details) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header title="Review Verification" />
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-2xl bg-red-100 items-center justify-center mb-4">
            <Feather name="alert-circle" size={36} color="#EF4444" />
          </View>
          <Text className="font-rubik-bold text-lg text-gray-900 text-center">
            Details Not Found
          </Text>
          <Text className="font-rubik text-sm text-gray-400 text-center mt-2">
            The verification request you're looking for doesn't exist or has been removed.
          </Text>
          <Button
            title="Go Back"
            className="mt-6"
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Review Verification" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Request Info Banner */}
        <View className="bg-primary-50 mx-4 mt-4 p-4 rounded-2xl border border-primary-200">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Feather name="clipboard" size={20} color={colors.primary} />
              <Text className="font-rubik-bold text-base text-primary-700 ml-2">
                Review Request
              </Text>
            </View>
            <Text className="font-rubik text-xs text-gray-500">
              ID: {details.verificationRequest.id.substring(0, 8)}...
            </Text>
          </View>
          <Text className="font-rubik text-sm text-gray-600 mt-2">
            Requested on {formatDate(details.verificationRequest.requestedAt)}
          </Text>
        </View>

     

        {/* Employment Details Section */}
        <View className="bg-white rounded-2xl mx-4 mt-4 p-5 shadow-sm border border-gray-100">
          <TouchableOpacity
            onPress={() => toggleSection('employment')}
            className="flex-row items-center justify-between"
          >
            <Text className="font-rubik-bold text-base text-gray-800">
              Employment Details
            </Text>
            <Feather 
              name={expandedSections.employment ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#64748B" 
            />
          </TouchableOpacity>

          {expandedSections.employment && (
            <View className="mt-2">
              <ReviewField
                label="Company"
                value={details.employmentRecord.companyName}
                fieldKey="company_name"
              />
              <ReviewField
                label="Designation"
                value={details.employmentRecord.designation}
                fieldKey="designation"
              />
              <ReviewField
                label="Department"
                value={details.employmentRecord.department}
                fieldKey="department"
              />
              <ReviewField
                label="Employment Type"
                value={getEmploymentTypeLabel(details.employmentRecord.employmentType)}
                fieldKey="employment_type"
              />
              <ReviewField
                label="Start Date"
                value={formatDate(details.employmentRecord.startDate)}
                fieldKey="start_date"
              />
              <ReviewField
                label="End Date"
                value={formatDate(details.employmentRecord.endDate)}
                fieldKey="end_date"
              />
              <ReviewField
                label="Location"
                value={details.employmentRecord.location}
                fieldKey="location"
              />            
             
              
              {details.employmentRecord.reasonForLeaving && (
                <ReviewField
                  label="Reason for Leaving"
                  value={details.employmentRecord.reasonForLeaving}
                  fieldKey="reason_for_leaving"
                />
              )}
              
            </View>
          )}
        </View>

        {/* Salary Records Section */}
        {details.salaryRecords.length > 0 && (
          <View className="bg-white rounded-2xl mx-4 mt-4 p-5 shadow-sm border border-gray-100">
            <TouchableOpacity
              onPress={() => toggleSection('salary')}
              className="flex-row items-center justify-between"
            >
              <Text className="font-rubik-bold text-base text-gray-800">
                Salary Records ({details.salaryRecords.length})
              </Text>
              <Feather 
                name={expandedSections.salary ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#64748B" 
              />
            </TouchableOpacity>

            {expandedSections.salary && (
              <View className="mt-2">
                {details.salaryRecords.map((salary, index) => (
                  <View key={salary.id} className="mb-4 last:mb-0">
                    <Text className="font-rubik-medium text-sm text-gray-600 mb-2">
                      Salary {index + 1}
                    </Text>
                    <ReviewField
                      label="Salary Type"
                      value={getSalaryTypeLabel(salary.salaryType)}
                      fieldKey={`salary_${index}_type`}
                    />
                    <ReviewField
                      label="Amount"
                      value={`${getCurrencySymbol(salary.currency)}${parseFloat(salary.amount).toLocaleString()}`}
                      fieldKey={`salary_${index}_amount`}
                    />
                    <ReviewField
                      label="Frequency"
                      value={salary.frequency}
                      fieldKey={`salary_${index}_frequency`}
                    />
                    {salary.bonusAmount && (
                      <ReviewField
                        label="Bonus"
                        value={`${getCurrencySymbol(salary.currency)}${salary.bonusAmount}`}
                        fieldKey={`salary_${index}_bonus`}
                      />
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Documents Section */}
        {details.documents.length > 0 && (
          <View className="bg-white rounded-2xl mx-4 mt-4 p-5 shadow-sm border border-gray-100">
            <TouchableOpacity
              onPress={() => toggleSection('documents')}
              className="flex-row items-center justify-between"
            >
              <Text className="font-rubik-bold text-base text-gray-800">
                Documents ({details.documents.length})
              </Text>
              <Feather 
                name={expandedSections.documents ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#64748B" 
              />
            </TouchableOpacity>

            {expandedSections.documents && (
              <View className="mt-4 gap-3">
                {details.documents.map((doc) => (
                  <TouchableOpacity
                    key={doc.id}
                    onPress={() => handleOpenDocument(doc)}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex-row items-center"
                  >
                    <View className="w-10 h-10 bg-indigo-100 rounded-lg items-center justify-center mr-3">
                      <Feather 
                        name={doc.contentType.includes('pdf') ? 'file-text' : 'image'} 
                        size={20} 
                        color="#6366F1" 
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-rubik-medium text-sm text-gray-800">
                        {doc.title}
                      </Text>
                      <Text className="font-rubik text-xs text-gray-500 mt-1">
                        {getDocumentTypeLabel(doc.documentType)} • {formatFileSize(doc.fileSize)}
                      </Text>
                    </View>
                    <Feather name="eye" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Behavior Report Section */}
        <View className="bg-white rounded-2xl mx-4 mt-4 p-5 shadow-sm border border-gray-100">
          <TouchableOpacity
            onPress={() => toggleSection('behavior')}
            className="flex-row items-center justify-between"
          >
            <Text className="font-rubik-bold text-base text-gray-800">
              Behavior & Performance Review
            </Text>
            <Feather 
              name={expandedSections.behavior ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#64748B" 
            />
          </TouchableOpacity>

          {expandedSections.behavior && (
            <View className="mt-4">
              {/* Ratings */}
              <View className="space-y-2">
                <RatingSlider
                  label="Teamwork"
                  value={reviewData.behaviorReport.teamworkRating}
                  onChange={(val) => setReviewData(prev => ({
                    ...prev,
                    behaviorReport: { ...prev.behaviorReport, teamworkRating: val }
                  }))}
                  icon="users"
                />

                <RatingSlider
                  label="Leadership"
                  value={reviewData.behaviorReport.leadershipRating}
                  onChange={(val) => setReviewData(prev => ({
                    ...prev,
                    behaviorReport: { ...prev.behaviorReport, leadershipRating: val }
                  }))}
                  icon="star"
                />

                <RatingSlider
                  label="Communication"
                  value={reviewData.behaviorReport.communicationRating}
                  onChange={(val) => setReviewData(prev => ({
                    ...prev,
                    behaviorReport: { ...prev.behaviorReport, communicationRating: val }
                  }))}
                  icon="message-square"
                />

                <RatingSlider
                  label="Integrity"
                  value={reviewData.behaviorReport.integrityRating}
                  onChange={(val) => setReviewData(prev => ({
                    ...prev,
                    behaviorReport: { ...prev.behaviorReport, integrityRating: val }
                  }))}
                  icon="shield"
                />

                <RatingSlider
                  label="Performance"
                  value={reviewData.behaviorReport.performanceRating}
                  onChange={(val) => setReviewData(prev => ({
                    ...prev,
                    behaviorReport: { ...prev.behaviorReport, performanceRating: val }
                  }))}
                  icon="trending-up"
                />
              </View>

              {/* Toggle Options */}
              <View className="mt-4 space-y-3">

                <TouchableOpacity
                  onPress={() => setReviewData(prev => ({
                    ...prev,
                    behaviorReport: { ...prev.behaviorReport, rehireRecommendation: !prev.behaviorReport.rehireRecommendation }
                  }))}
                  className="flex-row items-center justify-between"
                >
                  <Text className="font-rubik text-sm text-gray-600">Rehire Recommendation</Text>
                  <View className={`w-6 h-6 rounded-full border-2 ${
                    reviewData.behaviorReport.rehireRecommendation 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-gray-300'
                  } items-center justify-center`}>
                    {reviewData.behaviorReport.rehireRecommendation && (
                      <Feather name="check" size={16} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Remarks */}
              <View className="mt-4">
                <Text className="font-rubik-medium text-sm text-gray-700 mb-2">
                  Additional Remarks
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 text-gray-800 font-rubik text-sm border border-gray-200"
                  placeholder="Add any additional comments about the employee's behavior..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={reviewData.behaviorReport.remarks}
                  onChangeText={(text) => setReviewData(prev => ({
                    ...prev,
                    behaviorReport: { ...prev.behaviorReport, remarks: text }
                  }))}
                />
              </View>
            </View>
          )}
        </View>

        {/* Review Comments */}
        <View className="bg-white rounded-2xl mx-4 mt-4 p-5 shadow-sm border border-gray-100">
          <TouchableOpacity
            onPress={() => toggleSection('review')}
            className="flex-row items-center justify-between"
          >
            <Text className="font-rubik-bold text-base text-gray-800">
              Review Comments
            </Text>
            <Feather 
              name={expandedSections.review ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#64748B" 
            />
          </TouchableOpacity>

          {expandedSections.review && (
            <View className="mt-4">
              <TextInput
                className="bg-gray-50 rounded-xl p-4 text-gray-800 font-rubik text-sm border border-gray-200"
                placeholder="Add your review comments here..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={reviewData.comments}
                onChangeText={(text) => setReviewData(prev => ({ ...prev, comments: text }))}
              />
              
              <View className="mt-4">
                <Text className="font-rubik-medium text-sm text-gray-700 mb-2">
                  Verification Method
                </Text>
                <View className="flex-row gap-2">
                  {['MANUAL', 'AUTO', 'PARTIAL'].map((method) => (
                    <TouchableOpacity
                      key={method}
                      onPress={() => setReviewData(prev => ({ ...prev, verificationMethod: method as any }))}
                      className={`flex-1 py-3 rounded-xl border ${
                        reviewData.verificationMethod === method
                          ? 'bg-primary-50 border-primary-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <Text className={`font-rubik-medium text-xs text-center ${
                        reviewData.verificationMethod === method
                          ? 'text-primary-700'
                          : 'text-gray-600'
                      }`}>
                        {method}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Discrepancies Summary */}
        {reviewData.discrepancies.length > 0 && (
          <View className="bg-white rounded-2xl mx-4 mt-4 p-5 shadow-sm border border-gray-100">
            <Text className="font-rubik-bold text-base text-gray-800 mb-3">
              Discrepancies Found ({reviewData.discrepancies.length})
            </Text>
            {reviewData.discrepancies.map((disc, index) => (
              <View key={index} className="bg-red-50 rounded-xl p-3 mb-2 last:mb-0 border border-red-200">
                <Text className="font-rubik-bold text-xs text-red-700 mb-1">
                  {disc.fieldName}
                </Text>
                <View className="flex-row">
                  <View className="flex-1">
                    <Text className="font-rubik text-xs text-red-500">Claimed:</Text>
                    <Text className="font-rubik-medium text-xs text-red-700">{disc.employeeClaimedValue}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-rubik text-xs text-red-500">Actual:</Text>
                    <Text className="font-rubik-medium text-xs text-red-700">{disc.actualValue}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Submit Button */}
        <View className="mx-4 my-6">
          <Button
            title="Submit Review"
            onPress={handleSubmitReview}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default HrReviewVerification;