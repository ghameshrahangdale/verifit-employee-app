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
import { Discrepancy, Document, FieldStatus, ReviewData, VerificationRequestDetails } from '../../types';
import { formatDate, getCurrencySymbol, getDocumentTypeLabel, getEmploymentTypeLabel, getSalaryTypeLabel } from '../../utils/verificationHelpers';

type HrReviewVerificationRouteProp = RouteProp<AppStackParamList, 'HrReviewVerification'>;


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
      id: '',
      employmentRecordId: '',
      createdBy: '',
      createdAt: ''
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
    const verificationResponse = data.verificationResponse;

    const initialStatus: FieldStatus = {
      // Employment fields
      'company_name': {
        confirmed: verificationResponse?.companyNameConfirmed ?? null,
        actualValue: '',
        showInput: false
      },
      'designation': {
        confirmed: verificationResponse?.designationConfirmed ?? null,
        actualValue: '',
        showInput: false
      },
      'department': {
        confirmed: verificationResponse?.departmentConfirmed ?? null,
        actualValue: '',
        showInput: false
      },
      'employment_type': {
        confirmed: verificationResponse?.employmentTypeConfirmed ?? null,
        actualValue: '',
        showInput: false
      },
      'start_date': {
        confirmed: verificationResponse?.startDateConfirmed ?? null,
        actualValue: '',
        showInput: false
      },
      'end_date': {
        confirmed: verificationResponse?.endDateConfirmed ?? null,
        actualValue: '',
        showInput: false
      },
      'location': {
        confirmed: verificationResponse?.locationConfirmed ?? null,
        actualValue: '',
        showInput: false
      },
      'reason_for_leaving': {
        confirmed: verificationResponse?.reasonForLeavingConfirmed ?? null,
        actualValue: '',
        showInput: false
      },
    };

    // Initialize salary fields
    data.salaryRecords.forEach((salary, index) => {
      initialStatus[`salary_${index}_type`] = {
        confirmed: verificationResponse?.salaryConfirmed ?? null,
        actualValue: '',
        showInput: false
      };
      initialStatus[`salary_${index}_amount`] = {
        confirmed: verificationResponse?.salaryConfirmed ?? null,
        actualValue: '',
        showInput: false
      };
      initialStatus[`salary_${index}_frequency`] = {
        confirmed: verificationResponse?.salaryConfirmed ?? null,
        actualValue: '',
        showInput: false
      };
      if (salary.bonusAmount) {
        initialStatus[`salary_${index}_bonus`] = {
          confirmed: verificationResponse?.salaryConfirmed ?? null,
          actualValue: '',
          showInput: false
        };
      }
    });

    // Initialize document fields
    data.documents.forEach((doc) => {
      initialStatus[`document_${doc.id}`] = {
        confirmed: verificationResponse?.documentsConfirmed ?? null,
        actualValue: '',
        showInput: false
      };
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
      id: '',
      teamworkRaring: 0,
      createdAt: ''
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

      // Build payload based on the working curl example
      const payload = {
        verificationMethod: reviewData.verificationMethod,

        // Individual field confirmations
        companyNameConfirmed: fieldStatus['company_name']?.confirmed || false,
        designationConfirmed: fieldStatus['designation']?.confirmed || false,
        departmentConfirmed: fieldStatus['department']?.confirmed || false,
        employmentTypeConfirmed: fieldStatus['employment_type']?.confirmed || false,
        locationConfirmed: fieldStatus['location']?.confirmed || false,
        startDateConfirmed: fieldStatus['start_date']?.confirmed || false,
        endDateConfirmed: fieldStatus['end_date']?.confirmed || false,
        reasonForLeavingConfirmed: fieldStatus['reason_for_leaving']?.confirmed || false,

        // Summary confirmations (mapping from individual fields)
        employmentConfirmed: fieldStatus['company_name']?.confirmed &&
          fieldStatus['start_date']?.confirmed &&
          fieldStatus['end_date']?.confirmed || false,
        tenureConfirmed: fieldStatus['start_date']?.confirmed &&
          fieldStatus['end_date']?.confirmed || false,

        // Check if any salary field is confirmed
        salaryConfirmed: Object.keys(fieldStatus).some(key =>
          key.includes('salary_') && fieldStatus[key]?.confirmed === true
        ) || false,

        // In the payload section, update documentsConfirmed
        documentsConfirmed: Object.keys(fieldStatus).some(key =>
          key.startsWith('document_') && fieldStatus[key]?.confirmed === true
        ) || false,

        behaviorConfirmed: true, // Always true as we're collecting behavior data

        // Comments and discrepancies
        comments: reviewData.comments,
        discrepancies: reviewData.discrepancies,

        // Behavior report
        behaviorReport: {
          teamworkRating: reviewData.behaviorReport.teamworkRating,
          leadershipRating: reviewData.behaviorReport.leadershipRating,
          communicationRating: reviewData.behaviorReport.communicationRating,
          integrityRating: reviewData.behaviorReport.integrityRating,
          performanceRating: reviewData.behaviorReport.performanceRating,
          policyViolation: reviewData.behaviorReport.policyViolation || false,
          disciplinaryAction: reviewData.behaviorReport.disciplinaryAction || false,
          rehireRecommendation: reviewData.behaviorReport.rehireRecommendation,
          remarks: reviewData.behaviorReport.remarks,
        },
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

  const handleRejectRequest = async () => {
  Alert.alert(
    'Reject Verification Request',
    'Are you sure you want to reject this verification request? This action cannot be undone.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsSubmitting(true);

            const payload = {
              verificationMethod: reviewData.verificationMethod,
              
              // Set all confirmations to false
              companyNameConfirmed: false,
              designationConfirmed: false,
              departmentConfirmed: false,
              employmentTypeConfirmed: false,
              locationConfirmed: false,
              startDateConfirmed: false,
              endDateConfirmed: false,
              reasonForLeavingConfirmed: false,
              
              // Summary confirmations all false
              employmentConfirmed: false,
              tenureConfirmed: false,
              salaryConfirmed: false,
              documentsConfirmed: false,
              behaviorConfirmed: false,
              
              // Set status to REJECTED
              status: 'REJECTED',
              
              // Include comments if any
              comments: reviewData.comments || 'Request rejected by HR',
              
              // Include any discrepancies found
              discrepancies: reviewData.discrepancies,
              
              // Behavior report data
              behaviorReport: {
                teamworkRating: reviewData.behaviorReport.teamworkRating,
                leadershipRating: reviewData.behaviorReport.leadershipRating,
                communicationRating: reviewData.behaviorReport.communicationRating,
                integrityRating: reviewData.behaviorReport.integrityRating,
                performanceRating: reviewData.behaviorReport.performanceRating,
                policyViolation: reviewData.behaviorReport.policyViolation || false,
                disciplinaryAction: reviewData.behaviorReport.disciplinaryAction || false,
                rehireRecommendation: reviewData.behaviorReport.rehireRecommendation,
                remarks: reviewData.behaviorReport.remarks,
              },
            };

            const response = await http.patch(
              `/api/verification/employee/create-request/${verificationId}`,
              payload
            );

            if (response.data) {
              Toast.show({
                type: 'success',
                text1: 'Request Rejected',
                text2: 'The verification request has been rejected successfully',
              });
              navigation.goBack();
            }
          } catch (error: any) {
            Toast.show({
              type: 'error',
              text1: 'Rejection Failed',
              text2: error.response?.data?.message || 'Unable to reject request',
            });
          } finally {
            setIsSubmitting(false);
          }
        },
      },
    ]
  );
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

  

  const formatFieldName = (fieldKey: string): string => {
    return fieldKey
      .replace('candidate_', '')
      .replace('salary_', '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
                <Feather name="check" size={14} color="#040807" />
                <Text className="font-rubik-medium text-xs text-green-700 ml-1">
                  Correct
                </Text>
              </View>
            ) : status?.confirmed === false ? (
              <View className="bg-red-50 px-3 py-1.5 rounded-full border border-red-200 flex-row items-center">
                <Feather name="x" size={14} color="#EF4444" />
                <Text className="font-rubik-medium text-xs text-red-700 ml-1">
                  Incorrect
                </Text>
              </View>
            ) : (
              !status?.showInput && (
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleConfirm(fieldKey)}
                    className="w-8 h-8 rounded-lg bg-green-50 border border-green-200 items-center justify-center"
                  >
                    <Feather name="check" size={16} color="#10B981" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleReject(fieldKey)}
                    className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 items-center justify-center"
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


  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header title="Review Verification" />
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
        <View className="bg-purple-50 mx-4 mt-4 p-4 rounded-2xl border border-purple-200">
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
                {details.documents.map((doc, index) => {
                  const documentKey = `document_${doc.id}`;
                  const status = fieldStatus[documentKey];
                  const isActive = activeField === documentKey;

                  return (
                    <View key={doc.id} className="border border-gray-100 rounded-xl">
                      {/* Document Preview/View Button */}
                      <TouchableOpacity
                        onPress={() => handleOpenDocument(doc)}
                        className="bg-gray-50 rounded-t-xl p-4 flex-row items-center"
                        style={status?.confirmed !== null ? { borderBottomWidth: 1, borderBottomColor: '#E5E7EB' } : {}}
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

                      {/* Document Verification Status */}
                      {status?.confirmed === true ? (
                        <View className="bg-green-50 px-4 py-3 rounded-b-xl border-t border-green-200 flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <Feather name="check-circle" size={16} color="#10B981" />
                            <Text className="font-rubik-medium text-xs text-green-700 ml-2">
                              Document Verified - Correct
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              setFieldStatus(prev => ({
                                ...prev,
                                [documentKey]: { ...prev[documentKey], confirmed: null, showInput: false }
                              }));
                              // Remove from discrepancies if it was added
                              setReviewData(prev => ({
                                ...prev,
                                discrepancies: prev.discrepancies.filter(d => d.fieldName !== `Document: ${doc.title}`)
                              }));
                            }}
                          >
                            <Feather name="x" size={16} color="#10B981" />
                          </TouchableOpacity>
                        </View>
                      ) : status?.confirmed === false ? (
                        <View className="bg-red-50 px-4 py-3 rounded-b-xl border-t border-red-200">
                          <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center">
                              <Feather name="alert-circle" size={16} color="#EF4444" />
                              <Text className="font-rubik-medium text-xs text-red-700 ml-2">
                                Document Issue Reported
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => {
                                setFieldStatus(prev => ({
                                  ...prev,
                                  [documentKey]: { ...prev[documentKey], confirmed: null, showInput: false }
                                }));
                                // Remove from discrepancies if it was added
                                setReviewData(prev => ({
                                  ...prev,
                                  discrepancies: prev.discrepancies.filter(d => d.fieldName !== `Document: ${doc.title}`)
                                }));
                              }}
                            >
                              <Feather name="x" size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                          {status.actualValue && (
                            <Text className="font-rubik text-xs text-red-600">
                              Issue: {status.actualValue}
                            </Text>
                          )}
                        </View>
                      ) : (
                        /* Action Buttons - Only show if not confirmed/rejected */
                        !status?.showInput && (
                          <View className="flex-row gap-2 p-3 bg-gray-50/50 rounded-b-xl border-t border-gray-100">
                            <TouchableOpacity
                              onPress={() => {
                                setFieldStatus(prev => ({
                                  ...prev,
                                  [documentKey]: {
                                    ...prev[documentKey],
                                    confirmed: true,
                                    showInput: false,
                                  }
                                }));

                                // Add to review data if needed
                                Toast.show({
                                  type: 'success',
                                  text1: 'Document Verified',
                                  text2: 'Document marked as correct',
                                });
                              }}
                              className="flex-1 flex-row items-center justify-center bg-green-50 py-2.5 rounded-lg border border-green-200"
                            >
                              <Feather name="check" size={16} color="#10B981" />
                              <Text className="font-rubik-medium text-xs text-green-700 ml-1.5">
                                Correct
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => {
                                setFieldStatus(prev => ({
                                  ...prev,
                                  [documentKey]: {
                                    ...prev[documentKey],
                                    confirmed: false,
                                    showInput: true,
                                  }
                                }));
                                setActiveField(documentKey);
                              }}
                              className="flex-1 flex-row items-center justify-center bg-red-50 py-2.5 rounded-lg border border-red-200"
                            >
                              <Feather name="x" size={16} color="#EF4444" />
                              <Text className="font-rubik-medium text-xs text-red-700 ml-1.5">
                                Issue
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )
                      )}

                      {/* Issue Description Input */}
                      {status?.showInput && (
                        <View className="bg-gray-50 p-4 rounded-b-xl border-t border-gray-200">
                          <Text className="font-rubik-medium text-sm text-gray-700 mb-2">
                            Describe the issue with this document
                          </Text>
                          <Input
                            label="Issue Description"
                            value={status.actualValue || ''}
                            onChangeText={(text) =>
                              setFieldStatus(prev => ({
                                ...prev,
                                [documentKey]: { ...prev[documentKey], actualValue: text }
                              }))
                            }
                            placeholder="e.g., Document is illegible, wrong document uploaded, expired, etc."
                            type="text"
                            multiline
                            numberOfLines={3}
                          />

                          <View className="flex-row gap-2 mt-3">
                            <TouchableOpacity
                              onPress={() => {
                                if (!status.actualValue.trim()) {
                                  Toast.show({
                                    type: 'error',
                                    text1: 'Description Required',
                                    text2: 'Please describe the issue with this document',
                                  });
                                  return;
                                }

                                // Add to discrepancies
                                const discrepancy: Discrepancy = {
                                  fieldName: `Document: ${doc.title}`,
                                  employeeClaimedValue: doc.title,
                                  actualValue: status.actualValue,
                                  remarks: `Document issue: ${status.actualValue}`,
                                  id: '',
                                  teamworkRaring: 0,
                                  createdAt: ''
                                };

                                setReviewData(prev => ({
                                  ...prev,
                                  discrepancies: [...prev.discrepancies, discrepancy],
                                }));

                                setFieldStatus(prev => ({
                                  ...prev,
                                  [documentKey]: {
                                    ...prev[documentKey],
                                    showInput: false,
                                  }
                                }));
                                setActiveField(null);

                                Toast.show({
                                  type: 'success',
                                  text1: 'Issue Reported',
                                  text2: 'Document issue has been recorded',
                                });
                              }}
                              className="flex-1 bg-purple-500 py-3 rounded-lg items-center"
                            >
                              <Text className="font-rubik-medium text-sm text-white">Submit Issue</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleCancelInput(documentKey)}
                              className="flex-1 bg-gray-200 py-3 rounded-lg items-center"
                            >
                              <Text className="font-rubik-medium text-sm text-gray-700">Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Behavior Report Section */}
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
              {/* Star Ratings */}
              <View className="gap-4">
                {/* Teamwork Rating */}
                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <Feather name="users" size={16} color={colors.primary} />
                      <Text className="font-rubik-medium text-sm text-gray-700 ml-2">
                        Teamwork
                      </Text>
                    </View>
                    <Text className="font-rubik-bold text-sm text-primary-600">
                      {reviewData.behaviorReport.teamworkRating}/5
                    </Text>
                  </View>
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setReviewData(prev => ({
                          ...prev,
                          behaviorReport: { ...prev.behaviorReport, teamworkRating: star }
                        }))}
                        className="mr-2"
                      >
                        <Feather
                          name={star <= reviewData.behaviorReport.teamworkRating ? "star" : "star"}
                          size={24}
                          color={star <= reviewData.behaviorReport.teamworkRating ? "#FBBF24" : "#D1D5DB"}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Leadership Rating */}
                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <Feather name="star" size={16} color={colors.primary} />
                      <Text className="font-rubik-medium text-sm text-gray-700 ml-2">
                        Leadership
                      </Text>
                    </View>
                    <Text className="font-rubik-bold text-sm text-primary-600">
                      {reviewData.behaviorReport.leadershipRating}/5
                    </Text>
                  </View>
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setReviewData(prev => ({
                          ...prev,
                          behaviorReport: { ...prev.behaviorReport, leadershipRating: star }
                        }))}
                        className="mr-2"
                      >
                        <Feather
                          name={star <= reviewData.behaviorReport.leadershipRating ? "star" : "star"}
                          size={24}
                          color={star <= reviewData.behaviorReport.leadershipRating ? "#FBBF24" : "#D1D5DB"}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Communication Rating */}
                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <Feather name="message-square" size={16} color={colors.primary} />
                      <Text className="font-rubik-medium text-sm text-gray-700 ml-2">
                        Communication
                      </Text>
                    </View>
                    <Text className="font-rubik-bold text-sm text-primary-600">
                      {reviewData.behaviorReport.communicationRating}/5
                    </Text>
                  </View>
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setReviewData(prev => ({
                          ...prev,
                          behaviorReport: { ...prev.behaviorReport, communicationRating: star }
                        }))}
                        className="mr-2"
                      >
                        <Feather
                          name={star <= reviewData.behaviorReport.communicationRating ? "star" : "star"}
                          size={24}
                          color={star <= reviewData.behaviorReport.communicationRating ? "#FBBF24" : "#D1D5DB"}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Integrity Rating */}
                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <Feather name="shield" size={16} color={colors.primary} />
                      <Text className="font-rubik-medium text-sm text-gray-700 ml-2">
                        Integrity
                      </Text>
                    </View>
                    <Text className="font-rubik-bold text-sm text-primary-600">
                      {reviewData.behaviorReport.integrityRating}/5
                    </Text>
                  </View>
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setReviewData(prev => ({
                          ...prev,
                          behaviorReport: { ...prev.behaviorReport, integrityRating: star }
                        }))}
                        className="mr-2"
                      >
                        <Feather
                          name={star <= reviewData.behaviorReport.integrityRating ? "star" : "star"}
                          size={24}
                          color={star <= reviewData.behaviorReport.integrityRating ? "#FBBF24" : "#D1D5DB"}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Performance Rating */}
                <View>
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <Feather name="trending-up" size={16} color={colors.primary} />
                      <Text className="font-rubik-medium text-sm text-gray-700 ml-2">
                        Performance
                      </Text>
                    </View>
                    <Text className="font-rubik-bold text-sm text-primary-600">
                      {reviewData.behaviorReport.performanceRating}/5
                    </Text>
                  </View>
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setReviewData(prev => ({
                          ...prev,
                          behaviorReport: { ...prev.behaviorReport, performanceRating: star }
                        }))}
                        className="mr-2"
                      >
                        <Feather
                          name={star <= reviewData.behaviorReport.performanceRating ? "star" : "star"}
                          size={24}
                          color={star <= reviewData.behaviorReport.performanceRating ? "#FBBF24" : "#D1D5DB"}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Toggle Options */}
              <View className="mt-4 space-y-3">
                {/* Policy Violation Toggle */}
                <TouchableOpacity
                  onPress={() => setReviewData(prev => ({
                    ...prev,
                    behaviorReport: {
                      ...prev.behaviorReport,
                      policyViolation: !prev.behaviorReport.policyViolation
                    }
                  }))}
                  className="flex-row items-center justify-between py-2"
                >
                  <View className="flex-row items-center flex-1">
                    <Feather
                      name="alert-triangle"
                      size={16}
                      color={reviewData.behaviorReport.policyViolation ? "#EF4444" : "#94A3B8"}
                    />
                    <Text className="font-rubik text-sm text-gray-600 ml-2">
                      Policy Violation
                    </Text>
                  </View>
                  <View className={`w-6 h-6 rounded-full border-2 ${reviewData.behaviorReport.policyViolation
                      ? 'bg-red-500 border-red-500'
                      : 'border-gray-300'
                    } items-center justify-center`}>
                    {reviewData.behaviorReport.policyViolation && (
                      <Feather name="check" size={16} color="white" />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Disciplinary Action Toggle */}
                <TouchableOpacity
                  onPress={() => setReviewData(prev => ({
                    ...prev,
                    behaviorReport: {
                      ...prev.behaviorReport,
                      disciplinaryAction: !prev.behaviorReport.disciplinaryAction
                    }
                  }))}
                  className="flex-row items-center justify-between py-2"
                >
                  <View className="flex-row items-center flex-1">
                    <Feather
                      name="clock"
                      size={16}
                      color={reviewData.behaviorReport.disciplinaryAction ? "#EF4444" : "#94A3B8"}
                    />
                    <Text className="font-rubik text-sm text-gray-600 ml-2">
                      Disciplinary Action Taken
                    </Text>
                  </View>
                  <View className={`w-6 h-6 rounded-full border-2 ${reviewData.behaviorReport.disciplinaryAction
                      ? 'bg-red-500 border-red-500'
                      : 'border-gray-300'
                    } items-center justify-center`}>
                    {reviewData.behaviorReport.disciplinaryAction && (
                      <Feather name="check" size={16} color="white" />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Rehire Recommendation Toggle */}
                <TouchableOpacity
                  onPress={() => setReviewData(prev => ({
                    ...prev,
                    behaviorReport: {
                      ...prev.behaviorReport,
                      rehireRecommendation: !prev.behaviorReport.rehireRecommendation
                    }
                  }))}
                  className="flex-row items-center justify-between py-2"
                >
                  <View className="flex-row items-center flex-1">
                    <Feather
                      name="user-check"
                      size={16}
                      color={reviewData.behaviorReport.rehireRecommendation ? "#10B981" : "#94A3B8"}
                    />
                    <Text className="font-rubik text-sm text-gray-600 ml-2">
                      Rehire Recommendation
                    </Text>
                  </View>
                  <View className={`w-6 h-6 rounded-full border-2 ${reviewData.behaviorReport.rehireRecommendation
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

              {/* <View className="mt-4">
                <Text className="font-rubik-medium text-sm text-gray-700 mb-2">
                  Verification Method
                </Text>
                <View className="flex-row gap-2">
                  {['MANUAL', 'AUTO', 'PARTIAL'].map((method) => (
                    <TouchableOpacity
                      key={method}
                      onPress={() => setReviewData(prev => ({ ...prev, verificationMethod: method as any }))}
                      className={`flex-1 py-3 rounded-xl border ${reviewData.verificationMethod === method
                        ? 'bg-primary-50 border-primary-300'
                        : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                      <Text className={`font-rubik-medium text-xs text-center ${reviewData.verificationMethod === method
                        ? 'text-primary-700'
                        : 'text-gray-600'
                        }`}>
                        {method}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View> */}
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
        <View className="mx-4 my-6 gap-3">
          <Button
            title="Submit Review"
            onPress={handleSubmitReview}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
          <Button
            title="Reject Request"
            onPress={handleRejectRequest}
            loading={isSubmitting}
            disabled={isSubmitting}
            variant="outline"
            
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default HrReviewVerification;