// VerifyRequestScreen.tsx (Refactored)
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Linking, Text } from 'react-native';
import { RefreshControl } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../context/ThemeContext';
import Header from '../ui/Header';
import Button from '../ui/Button';
import Loader from '../ui/Loader';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/AppStackNavigator';
import http from '../../services/http.api';
import { formatDate, getCurrencySymbol, getEmploymentTypeLabel, getSalaryTypeLabel } from '../../utils/verificationHelpers';

// Import components
import { EmploymentSection } from '../EmploymentSection';
import { SalarySection } from '../SalarySection';
import Feather from 'react-native-vector-icons/Feather';

// Import types
import { Discrepancy, Document, FieldStatus, ReviewData, VerificationRequestDetails } from '../../types';
import { DocumentsSection } from '../DocumentsSection';
import { BehaviorSection } from '../BehaviorSection';
import { ReviewCommentsSection } from '../ReviewCommentsSection';
import { DiscrepanciesSummary } from '../DiscrepanciesSummary';

type HrReviewVerificationRouteProp = RouteProp<AppStackParamList, 'VerifyRequestScreen'>;

const VerifyRequestScreen: React.FC = () => {
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
  const [fieldStatus, setFieldStatus] = useState<FieldStatus>({});
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
      'company_name': { confirmed: verificationResponse?.companyNameConfirmed ?? null, actualValue: '', showInput: false },
      'designation': { confirmed: verificationResponse?.designationConfirmed ?? null, actualValue: '', showInput: false },
      'department': { confirmed: verificationResponse?.departmentConfirmed ?? null, actualValue: '', showInput: false },
      'employment_type': { confirmed: verificationResponse?.employmentTypeConfirmed ?? null, actualValue: '', showInput: false },
      'start_date': { confirmed: verificationResponse?.startDateConfirmed ?? null, actualValue: '', showInput: false },
      'end_date': { confirmed: verificationResponse?.endDateConfirmed ?? null, actualValue: '', showInput: false },
      'location': { confirmed: verificationResponse?.locationConfirmed ?? null, actualValue: '', showInput: false },
      'reason_for_leaving': { confirmed: verificationResponse?.reasonForLeavingConfirmed ?? null, actualValue: '', showInput: false },
    };

    data.salaryRecords.forEach((salary, index) => {
      initialStatus[`salary_${index}_type`] = { confirmed: verificationResponse?.salaryConfirmed ?? null, actualValue: '', showInput: false };
      initialStatus[`salary_${index}_amount`] = { confirmed: verificationResponse?.salaryConfirmed ?? null, actualValue: '', showInput: false };
      initialStatus[`salary_${index}_frequency`] = { confirmed: verificationResponse?.salaryConfirmed ?? null, actualValue: '', showInput: false };
      if (salary.bonusAmount) {
        initialStatus[`salary_${index}_bonus`] = { confirmed: verificationResponse?.salaryConfirmed ?? null, actualValue: '', showInput: false };
      }
    });

    data.documents.forEach((doc) => {
      initialStatus[`document_${doc.id}`] = { confirmed: verificationResponse?.documentsConfirmed ?? null, actualValue: '', showInput: false };
    });

    setFieldStatus(initialStatus);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleConfirm = (fieldKey: string) => {
    setFieldStatus(prev => ({
      ...prev,
      [fieldKey]: { ...prev[fieldKey], confirmed: true, showInput: false, actualValue: '' },
    }));
    const fieldName = formatFieldName(fieldKey);
    setReviewData(prev => ({
      ...prev,
      discrepancies: prev.discrepancies.filter(d => d.fieldName !== fieldName),
    }));
  };

  const handleReject = (fieldKey: string) => {
    setFieldStatus(prev => ({
      ...prev,
      [fieldKey]: { ...prev[fieldKey], confirmed: false, showInput: true },
    }));
    setActiveField(fieldKey);
  };

  const handleActualValueChange = (fieldKey: string, value: string) => {
    setFieldStatus(prev => ({
      ...prev,
      [fieldKey]: { ...prev[fieldKey], actualValue: value }
    }));
  };

  const handleSubmitActualValue = (fieldKey: string) => {
    const field = fieldStatus[fieldKey];
    if (!field.actualValue.trim()) {
      Toast.show({ type: 'error', text1: 'Actual Value Required', text2: 'Please enter the actual value' });
      return;
    }

    let claimedValue = '';
    const fieldName = formatFieldName(fieldKey);

    if (fieldKey.startsWith('candidate_')) {
      if (fieldKey === 'candidate_name') claimedValue = details?.candidate.name || '';
      if (fieldKey === 'candidate_email') claimedValue = details?.candidate.email || '';
      if (fieldKey === 'candidate_phone') claimedValue = details?.candidate.phone || '';
    } else if (fieldKey.startsWith('salary_')) {
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

    const discrepancy: Discrepancy = {
      fieldName: fieldName,
      employeeClaimedValue: claimedValue,
      actualValue: field.actualValue,
      remarks: `Updated by HR during verification`,
      id: '',
      teamworkRaring: 0,
      createdAt: ''
    };

    setReviewData(prev => ({ ...prev, discrepancies: [...prev.discrepancies, discrepancy] }));
    setFieldStatus(prev => ({ ...prev, [fieldKey]: { ...prev[fieldKey], showInput: false } }));
    setActiveField(null);
    Toast.show({ type: 'success', text1: 'Discrepancy Added', text2: 'The actual value has been recorded' });
  };

  const handleCancelInput = (fieldKey: string) => {
    setFieldStatus(prev => ({
      ...prev,
      [fieldKey]: { ...prev[fieldKey], confirmed: null, showInput: false, actualValue: '' },
    }));
    setActiveField(null);
  };

  const handleConfirmDocument = (documentId: string) => {
    const documentKey = `document_${documentId}`;
    setFieldStatus(prev => ({
      ...prev,
      [documentKey]: { ...prev[documentKey], confirmed: true, showInput: false, actualValue: '' }
    }));
    const document = details?.documents.find(d => d.id === documentId);
    if (document) {
      setReviewData(prev => ({
        ...prev,
        discrepancies: prev.discrepancies.filter(d => d.fieldName !== `Document: ${document.title}`)
      }));
    }
    Toast.show({ type: 'success', text1: 'Document Verified', text2: 'Document marked as correct' });
  };

  const handleRejectDocument = (documentId: string) => {
    const documentKey = `document_${documentId}`;
    setFieldStatus(prev => ({
      ...prev,
      [documentKey]: { ...prev[documentKey], confirmed: false, showInput: true }
    }));
    setActiveField(documentKey);
  };

  const handleSubmitDocumentIssue = (document: Document, issueDescription: string) => {
    const discrepancy: Discrepancy = {
      fieldName: `Document: ${document.title}`,
      employeeClaimedValue: document.title,
      actualValue: issueDescription,
      remarks: `Document issue: ${issueDescription}`,
      id: '',
      teamworkRaring: 0,
      createdAt: ''
    };

    setReviewData(prev => ({ ...prev, discrepancies: [...prev.discrepancies, discrepancy] }));
    setFieldStatus(prev => ({
      ...prev,
      [`document_${document.id}`]: { ...prev[`document_${document.id}`], showInput: false }
    }));
    setActiveField(null);
    Toast.show({ type: 'success', text1: 'Issue Reported', text2: 'Document issue has been recorded' });
  };

  const handleCancelDocumentInput = (documentId: string) => {
    const documentKey = `document_${documentId}`;
    setFieldStatus(prev => ({
      ...prev,
      [documentKey]: { ...prev[documentKey], confirmed: null, showInput: false, actualValue: '' }
    }));
    setActiveField(null);
  };

  const handleDocumentValueChange = (documentId: string, value: string) => {
    const documentKey = `document_${documentId}`;
    setFieldStatus(prev => ({
      ...prev,
      [documentKey]: { ...prev[documentKey], actualValue: value }
    }));
  };

  const handleRemoveDiscrepancy = (fieldName: string) => {
    setReviewData(prev => ({
      ...prev,
      discrepancies: prev.discrepancies.filter(d => d.fieldName !== fieldName)
    }));
  };

  const handleUpdateBehavior = (updates: Partial<ReviewData['behaviorReport']>) => {
    setReviewData(prev => ({
      ...prev,
      behaviorReport: { ...prev.behaviorReport, ...updates }
    }));
  };

  const handleOpenDocument = async (document: Document) => {
    try {
      const supported = await Linking.canOpenURL(document.fileUrl);
      if (supported) {
        await Linking.openURL(document.fileUrl);
      } else {
        Toast.show({ type: 'error', text1: 'Cannot Open Document', text2: 'Unable to open this document URL' });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to open document' });
    }
  };

  const handleSubmitReview = async () => {
  try {
    setIsSubmitting(true);
    
    // Check if all fields are reviewed
    const allFieldsReviewed = Object.values(fieldStatus).every(field => field.confirmed !== null || field.showInput === false);
    if (!allFieldsReviewed) {
      Toast.show({ type: 'error', text1: 'Incomplete Review', text2: 'Please review all fields before submitting' });
      setIsSubmitting(false);
      return;
    }
    
    if (!reviewData.comments) {
      Toast.show({ type: 'error', text1: 'Comments Required', text2: 'Please add your review comments' });
      setIsSubmitting(false);
      return;
    }

    // Prepare documents confirmed array
    const documentsConfirmed = details?.documents.map(doc => ({
      id: doc.id,
      confirmed: fieldStatus[`document_${doc.id}`]?.confirmed || false
    })) || [];

    // Prepare salary confirmation status (overall salary confirmed if any salary field is confirmed)
    const salaryConfirmed = Object.keys(fieldStatus).some(key => 
      key.includes('salary_') && fieldStatus[key]?.confirmed === true
    );

    const payload = {
      verificationMethod: reviewData.verificationMethod,
      comments: reviewData.comments,
      
      // Individual field confirmations
      companyNameConfirmed: fieldStatus['company_name']?.confirmed || false,
      designationConfirmed: fieldStatus['designation']?.confirmed || false,
      departmentConfirmed: fieldStatus['department']?.confirmed || false,
      employmentTypeConfirmed: fieldStatus['employment_type']?.confirmed || false,
      locationConfirmed: fieldStatus['location']?.confirmed || false,
      startDateConfirmed: fieldStatus['start_date']?.confirmed || false,
      endDateConfirmed: fieldStatus['end_date']?.confirmed || false,
      reasonForLeavingConfirmed: fieldStatus['reason_for_leaving']?.confirmed || false,
      
      // Combined confirmations
      employmentConfirmed: fieldStatus['company_name']?.confirmed && 
                          fieldStatus['start_date']?.confirmed && 
                          fieldStatus['end_date']?.confirmed || false,
      tenureConfirmed: fieldStatus['start_date']?.confirmed && 
                      fieldStatus['end_date']?.confirmed || false,
      salaryConfirmed: salaryConfirmed,
      behaviorConfirmed: true, // Always true as we're not implementing behavior confirmation yet
      
      // Documents as array of objects
      documentsConfirmed: documentsConfirmed,
      
      // Additional data
      discrepancies: reviewData.discrepancies,
      behaviorReport: reviewData.behaviorReport,
    };

    await http.patch(`/api/verification/employee/create-request/${verificationId}`, payload);
    Toast.show({ type: 'success', text1: 'Review Submitted', text2: 'The verification request has been reviewed successfully' });
    navigation.goBack();
  } catch (error: any) {
    Toast.show({ type: 'error', text1: 'Submission Failed', text2: error.response?.data?.message || 'Unable to submit review' });
  } finally {
    setIsSubmitting(false);
  }
};

  const handleRejectRequest = async () => {
  Alert.alert(
    'Reject Verification Request',
    'Are you sure you want to reject this verification request? This action cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsSubmitting(true);
            
            // Prepare documents confirmed array (all false for rejection)
            const documentsConfirmed = details?.documents.map(doc => ({
              id: doc.id,
              confirmed: false
            })) || [];
            
            const payload = {
              verificationMethod: reviewData.verificationMethod,
              status: 'REJECTED',
              comments: reviewData.comments || 'Request rejected by HR',
              
              // All confirmations set to false for rejection
              companyNameConfirmed: false,
              designationConfirmed: false,
              departmentConfirmed: false,
              employmentTypeConfirmed: false,
              locationConfirmed: false,
              startDateConfirmed: false,
              endDateConfirmed: false,
              reasonForLeavingConfirmed: false,
              employmentConfirmed: false,
              tenureConfirmed: false,
              salaryConfirmed: false,
              behaviorConfirmed: false,
              
              // Documents as array of objects with all false
              documentsConfirmed: documentsConfirmed,
              
              // Additional data
              discrepancies: reviewData.discrepancies,
              behaviorReport: reviewData.behaviorReport,
            };
            
            await http.patch(`/api/verification/employee/create-request/${verificationId}`, payload);
            Toast.show({ type: 'success', text1: 'Request Rejected', text2: 'The verification request has been rejected successfully' });
            navigation.goBack();
          } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Rejection Failed', text2: error.response?.data?.message || 'Unable to reject request' });
          } finally {
            setIsSubmitting(false);
          }
        },
      },
    ]
  );
};

  const formatFieldName = (fieldKey: string): string => {
    return fieldKey
      .replace('candidate_', '')
      .replace('salary_', '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchVerificationDetails();
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
          <Button title="Go Back" className="mt-6" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Review Verification" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        <View className="bg-purple-50 mx-4 mt-4 p-4 rounded-2xl border border-purple-200">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Feather name="clipboard" size={20} color={colors.primary} />
              <Text className="font-rubik-bold text-base text-primary-700 ml-2">Review Request</Text>
            </View>
            <Text className="font-rubik text-xs text-gray-500">ID: {details.verificationRequest.id.substring(0, 8)}...</Text>
          </View>
          <Text className="font-rubik text-sm text-gray-600 mt-2">Requested on {formatDate(details.verificationRequest.requestedAt)}</Text>
        </View>

        <EmploymentSection
          employmentRecord={details.employmentRecord}
          isExpanded={expandedSections.employment}
          onToggle={() => toggleSection('employment')}
          fieldStatus={fieldStatus}
          activeField={activeField}
          onConfirm={handleConfirm}
          onReject={handleReject}
          onSubmitActualValue={handleSubmitActualValue}
          onCancelInput={handleCancelInput}
          onActualValueChange={handleActualValueChange}
        />

        <SalarySection
          salaryRecords={details.salaryRecords}
          isExpanded={expandedSections.salary}
          onToggle={() => toggleSection('salary')}
          fieldStatus={fieldStatus}
          activeField={activeField}
          onConfirm={handleConfirm}
          onReject={handleReject}
          onSubmitActualValue={handleSubmitActualValue}
          onCancelInput={handleCancelInput}
          onActualValueChange={handleActualValueChange}
        />

        <DocumentsSection
          documents={details.documents}
          isExpanded={expandedSections.documents}
          onToggle={() => toggleSection('documents')}
          fieldStatus={fieldStatus}
          activeField={activeField}
          onConfirmDocument={handleConfirmDocument}
          onRejectDocument={handleRejectDocument}
          onSubmitDocumentIssue={handleSubmitDocumentIssue}
          onCancelDocumentInput={handleCancelDocumentInput}
          onDocumentValueChange={handleDocumentValueChange}
          onOpenDocument={handleOpenDocument}
          onRemoveDiscrepancy={handleRemoveDiscrepancy}
        />

        <BehaviorSection
          reviewData={reviewData}
          isExpanded={expandedSections.behavior}
          onToggle={() => toggleSection('behavior')}
          onUpdateBehavior={handleUpdateBehavior}
          colors={colors}
        />

        <ReviewCommentsSection
          comments={reviewData.comments}
          isExpanded={expandedSections.review}
          onToggle={() => toggleSection('review')}
          onCommentsChange={(text) => setReviewData(prev => ({ ...prev, comments: text }))}
        />

        <DiscrepanciesSummary discrepancies={reviewData.discrepancies} />

        <View className="mx-4 my-6 gap-3">
          <Button title="Submit Review" onPress={handleSubmitReview} loading={isSubmitting} disabled={isSubmitting} />
          <Button title="Reject Request" onPress={handleRejectRequest} loading={isSubmitting} disabled={isSubmitting} variant="outline" />
        </View>
      </ScrollView>
    </View>
  );
};

export default VerifyRequestScreen;