import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';
import Toast from 'react-native-toast-message';
import Input from '../ui/Input';
import http from '../../services/http.api';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/AppStackNavigator';
import Header from '../../components/ui/Header';
import { VerificationFormData, DocumentFile, DocumentUpdate } from './VerificationRequestForm';
import EditVerificationRequestForm from './EditVerificationRequestForm';

// API Response Interfaces
interface SalaryRecord {
  salaryType: 'basic' | 'hra' | 'special_allowance' | 'bonus' | 'other' | 'gross';
  amount: number;
  currency: string;
  frequency: 'monthly' | 'annually' | 'quarterly';
  effectiveDate: string | null;
  verified: boolean;
  id?: string;
  bonusAmount?: number;
  stockOptions?: number;
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
  confirmed?: boolean;
}

interface Discrepancy {
  id: string;
  fieldName: string;
  employeeClaimedValue: string;
  actualValue: string;
  remarks: string;
  createdAt: string;
}

interface EmploymentRecord {
  id: string;
  companyName: string;
  designation: string;
  department: string;
  employmentType: string;
  startDate: string;
  endDate: string | null;
  location: string;
  hrEmail: string | null;
  reasonForLeaving: string | null;
  rehireEligible: boolean;
  verificationStatus: any;
  verifiedAt: string | null;
}

interface Candidate {
  employeeId: string;
  name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  department: string | null;
  linkedinUrl: string | null;
}

interface VerificationResponse {
  id: string;
  employmentConfirmed: boolean;
  designationConfirmed: boolean;
  salaryConfirmed: boolean;
  tenureConfirmed: boolean;
  behaviorConfirmed: boolean;
  companyNameConfirmed: boolean;
  departmentConfirmed: boolean;
  employmentTypeConfirmed: boolean;
  locationConfirmed: boolean;
  startDateConfirmed: boolean;
  endDateConfirmed: boolean;
  documentConfirmations: Array<{ id: string; confirmed: boolean }>;
  reasonForLeavingConfirmed: boolean;
  comments: string;
  status: string;
  verifiedAt: string;
  verifiedByUserId: string;
}

interface VerificationRequestDetails {
  verificationRequest: {
    id: string;
    status: string;
    requestedAt: string;
    completedAt: string | null;
    verificationMethod: string | null;
    isPending: boolean;
    isCompleted: boolean;
    timeToComplete: number | null;
  };
  verificationStatus:string;
  employmentRecord: EmploymentRecord;
  candidate: Candidate;
  salaryRecords: SalaryRecord[];
  discrepancies: Discrepancy[];
  documents: Document[];
  verificationResponse: VerificationResponse | null;
  behaviorReport: any | null;
}

interface EditVerificationRequestProps {
  onSubmit?: (data: VerificationFormData, documents: DocumentFile[]) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const EditVerificationRequest: React.FC<EditVerificationRequestProps> = ({
  onSubmit: externalOnSubmit,
  onCancel,
  isLoading: externalLoading = false,
}) => {
  const { colors } = useTheme();
  const route = useRoute<RouteProp<AppStackParamList, 'EditVerification'>>();
  const navigation = useNavigation();
  const { verificationId } = route.params;

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState<VerificationRequestDetails | null>(null);
  const [formInitialData, setFormInitialData] = useState<VerificationFormData | undefined>(undefined);
  const [initialDocuments, setInitialDocuments] = useState<DocumentFile[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [expandedDiscrepancies, setExpandedDiscrepancies] = useState(true);
  const [confirmedFields, setConfirmedFields] = useState<Set<string>>(new Set());

  // Fetch verification details on mount
  useEffect(() => {
    fetchVerificationDetails();
  }, [verificationId]);

  const fetchVerificationDetails = async () => {
    try {
      setLoading(true);
      const response = await http.get(`/api/verification/employee/create-request/${verificationId}`);
      
      if (response.data) {
        const data = response.data;
        setVerificationDetails(data);
        
        // Set discrepancies
        if (data.discrepancies && data.discrepancies.length > 0) {
          setDiscrepancies(data.discrepancies);
        }
        
        // Set confirmed fields from verification response
        if (data.verificationResponse) {
          const confirmed = new Set<string>();
          const vr = data.verificationResponse;
          
          if (vr.designationConfirmed) confirmed.add('designation');
          if (vr.departmentConfirmed) confirmed.add('department');
          if (vr.employmentTypeConfirmed) confirmed.add('employmentType');
          if (vr.locationConfirmed) confirmed.add('location');
          if (vr.startDateConfirmed) confirmed.add('startDate');
          if (vr.endDateConfirmed) confirmed.add('endDate');
          if (vr.companyNameConfirmed) confirmed.add('companyName');
          if (vr.reasonForLeavingConfirmed) confirmed.add('reasonForLeaving');
          if (vr.salaryConfirmed && data.salaryRecords[0]) confirmed.add('salary');
          
          setConfirmedFields(confirmed);
        }
        
        // Map API response to form data structure
        const mappedFormData = mapApiResponseToFormData(data);
        setFormInitialData(mappedFormData);
        
        // Map documents
        const mappedDocuments = mapDocumentsToDocumentFiles(data.documents || []);
        setInitialDocuments(mappedDocuments);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Verification',
        text2: error.response?.data?.message || 'Unable to fetch verification details',
      });
      navigation.goBack();
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchVerificationDetails();
  };

  const mapApiResponseToFormData = (data: VerificationRequestDetails): VerificationFormData => {
    const { employmentRecord, salaryRecords, verificationResponse } = data;
    
    // Determine verification type based on available data
    const verificationType = employmentRecord.hrEmail && !employmentRecord.companyName 
      ? 'hr' 
      : 'organization';

    // Get the first salary record if exists
    const salaryRecord = salaryRecords && salaryRecords.length > 0 ? salaryRecords[0] : undefined;

    return {
      organizationId: verificationType === 'organization' ? employmentRecord.companyName : undefined,
      companyName: employmentRecord.companyName || '',
      designation: employmentRecord.designation || '',
      department: employmentRecord.department || '',
      employmentType: (employmentRecord.employmentType as any) || 'full_time',
      startDate: employmentRecord.startDate || '',
      endDate: employmentRecord.endDate || undefined,
      hrEmail: employmentRecord.hrEmail || undefined,
      location: employmentRecord.location || '',
      reasonForLeaving: employmentRecord.reasonForLeaving || '',
      salary: salaryRecord ? {
        id: salaryRecord.id,
        salaryType: salaryRecord.salaryType as any,
        amount: salaryRecord.amount,
        currency: salaryRecord.currency,
        frequency: salaryRecord.frequency,
        effectiveDate: salaryRecord.effectiveDate || '',
        verified: salaryRecord.verified,
        bonusAmount: salaryRecord.bonusAmount,
        stockOptions: salaryRecord.stockOptions,
      } : undefined,
      verificationType: verificationType,
      verificationStatus: data.verificationRequest.status,
      confirmedFields: verificationResponse ? {
        designationConfirmed: verificationResponse.designationConfirmed,
        departmentConfirmed: verificationResponse.departmentConfirmed,
        employmentTypeConfirmed: verificationResponse.employmentTypeConfirmed,
        locationConfirmed: verificationResponse.locationConfirmed,
        startDateConfirmed: verificationResponse.startDateConfirmed,
        endDateConfirmed: verificationResponse.endDateConfirmed,
        companyNameConfirmed: verificationResponse.companyNameConfirmed,
        reasonForLeavingConfirmed: verificationResponse.reasonForLeavingConfirmed,
        salaryConfirmed: verificationResponse.salaryConfirmed,
      } : undefined,
    };
  };

  const mapDocumentsToDocumentFiles = (documents: Document[]): DocumentFile[] => {
    return documents.map(doc => ({
      id: doc.id,
      uri: doc.fileUrl,
      name: doc.title || `document-${doc.id}`,
      type: doc.contentType,
      documentType: doc.documentType,
      title: doc.title,
      fileSize: doc.fileSize,
      verified: doc.verified,
      confirmed: doc.confirmed,
    }));
  };

  const shouldDisableField = (fieldName: string): boolean => {
    const status = verificationDetails?.verificationRequest.status;
    
    // If status is DISCREPANCIES and field is confirmed, disable it
    if (status === 'DISCREPANCIES' && confirmedFields.has(fieldName)) {
      return true;
    }
    
    // If status is COMPLETED, disable everything
    if (status === 'COMPLETED') {
      return true;
    }
    
    return false;
  };

  const handleSubmit = async (data: VerificationFormData, documents: DocumentFile[]) => {
    setSubmitting(true);
    try {
      // Prepare form data for multipart/form-data
      const formDataObj = new FormData();
      
      // Add text fields
      const payload: any = {
        designation: data.designation,
        department: data.department,
        employmentType: data.employmentType,
        startDate: data.startDate,
        endDate: data.endDate || null,
        location: data.location,
        reasonForLeaving: data.reasonForLeaving || '',
        companyName: data.companyName,
      };

      // Add HR email if verification type is HR
      if (data.verificationType === 'hr' && data.hrEmail) {
        payload.hrEmail = data.hrEmail;
      }

      // Add salary if exists
      if (data.salary) {
        const originalSalary = verificationDetails?.salaryRecords?.[0];
        
        payload.salary = {
          ...(originalSalary?.id && { id: originalSalary.id }),
          salaryType: data.salary.salaryType,
          amount: data.salary.amount,
          currency: data.salary.currency,
          frequency: data.salary.frequency,
          effectiveDate: data.salary.effectiveDate || null,
        };
        
        // Add bonus and stock options if they exist
        if (data.salary.bonusAmount) {
          payload.salary.bonusAmount = data.salary.bonusAmount;
        }
        if (data.salary.stockOptions) {
          payload.salary.stockOptions = data.salary.stockOptions;
        }
      }

      // Prepare documents update
      const documentsToUpdate: DocumentUpdate[] = [];
      const newDocuments: DocumentFile[] = [];
      
      // Separate existing documents (with IDs) from new documents
      documents.forEach(doc => {
        if (doc.id) {
          // Existing document - check if it needs update (has new file)
          const originalDoc = verificationDetails?.documents.find(d => d.id === doc.id);
          if (originalDoc && doc.uri !== originalDoc.fileUrl) {
            // Document has been updated with new file
            documentsToUpdate.push({
              id: doc.id,
              title: doc.title,
              documentType: doc.documentType,
              file: doc, // Will be added as file
            });
          } else {
            // Document unchanged, just update metadata if needed
            if (doc.title !== originalDoc?.title || doc.documentType !== originalDoc?.documentType) {
              documentsToUpdate.push({
                id: doc.id,
                title: doc.title,
                documentType: doc.documentType,
              });
            }
          }
        } else {
          // New document
          newDocuments.push(doc);
        }
      });

      // Add documents to payload
      if (documentsToUpdate.length > 0 || newDocuments.length > 0) {
        payload.documents = [
          ...documentsToUpdate.map(doc => ({
            id: doc.id,
            title: doc.title,
            documentType: doc.documentType,
          })),
          ...newDocuments.map(doc => ({
            title: doc.title,
            documentType: doc.documentType,
          })),
        ];
      }

      // Add data as JSON string
      formDataObj.append('data', JSON.stringify(payload));

      // Add files for updated documents
      documentsToUpdate.forEach((doc, index) => {
        if (doc.file) {
          const fileObj = {
            uri: doc.file.uri,
            type: doc.file.type,
            name: doc.file.name,
          };
          formDataObj.append(`documents[${doc.id}][file]`, fileObj as any);
        }
      });

      // Add files for new documents
      newDocuments.forEach((doc, index) => {
        const fileObj = {
          uri: doc.uri,
          type: doc.type,
          name: doc.name,
        };
        formDataObj.append(`documents[new_${index}][file]`, fileObj as any);
      });

      // Make the PUT request with multipart/form-data
      await http.put(
        `/api/verification/employee/create-request/${verificationId}`,
        formDataObj,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Verification request updated successfully',
      });

      // Call external onSubmit if provided
      if (externalOnSubmit) {
        await externalOnSubmit(data, documents);
      }

      // Navigate back after successful update
      navigation.goBack();

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: error.response?.data?.message || 'Failed to update verification request',
      });
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigation.goBack();
    }
  };

  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const toggleDiscrepancies = () => {
    setExpandedDiscrepancies(!expandedDiscrepancies);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return '#F59E0B';
      case 'DISCREPANCIES':
        return '#EF4444';
      case 'COMPLETED':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header title="Edit Verification" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="font-rubik text-sm text-gray-400 mt-3">
            Loading verification details...
          </Text>
        </View>
      </View>
    );
  }

  if (!formInitialData || !verificationDetails) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header title="Edit Verification" />
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-2xl bg-red-50 items-center justify-center mb-4">
            <Feather name="alert-circle" size={36} color="#EF4444" />
          </View>
          <Text className="font-rubik-bold text-lg text-gray-900 text-center">
            Failed to Load
          </Text>
          <Text className="font-rubik text-sm text-gray-400 text-center mt-2">
            Unable to load verification details. Please try again.
          </Text>
          <Button
            title="Go Back"
            onPress={handleCancel}
            className="mt-6"
            variant="outline"
          />
        </View>
      </View>
    );
  }

  const { candidate, verificationRequest } = verificationDetails;
  const status = verificationRequest.status;
  const canEdit = status === 'PENDING' || (status === 'DISCREPANCIES' && !verificationRequest.isCompleted);

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Edit Verification" />
      
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="bg-white"
        >
          {/* Candidate Information Card */}
          <View className="bg-white rounded-2xl mx-4 mt-4 mb-4 p-5 shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 rounded-full bg-primary-50 items-center justify-center">
                <Feather name="user" size={24} color={colors.primary} />
              </View>
              <View className="ml-3">
                <Text className="font-rubik-bold text-lg text-gray-800">
                  {candidate.name}
                </Text>
              
              </View>
              <View className="ml-auto">
                <View 
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: getStatusColor(status) + '20' }}
                >
                  <Text 
                    className="font-rubik-medium text-xs"
                    style={{ color: getStatusColor(status) }}
                  >
                    {status}
                  </Text>
                </View>
              </View>
            </View>

            <View className="border-t border-gray-100 pt-4">
              <View className="flex-row mb-3">
                <View className="flex-1">
                  <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-1">
                    Email
                  </Text>
                  <Text className="font-rubik-medium text-sm text-gray-700">
                    {candidate.email}
                  </Text>
                </View>
                {candidate.phone && (
                  <View className="flex-1">
                    <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-1">
                      Phone
                    </Text>
                    <Text className="font-rubik-medium text-sm text-gray-700">
                      {candidate.phone}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row">
                {candidate.designation && (
                  <View className="flex-1">
                    <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-1">
                      Current Designation
                    </Text>
                    <Text className="font-rubik-medium text-sm text-gray-700">
                      {candidate.designation}
                    </Text>
                  </View>
                )}
                {candidate.department && (
                  <View className="flex-1">
                    <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-1">
                      Current Department
                    </Text>
                    <Text className="font-rubik-medium text-sm text-gray-700">
                      {candidate.department}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {!canEdit && (
              <View className="mt-4 bg-amber-50 rounded-xl p-3 border border-amber-200">
                <View className="flex-row items-center">
                  <Feather name="info" size={16} color="#F59E0B" />
                  <Text className="font-rubik text-sm text-amber-700 ml-2">
                    {status === 'COMPLETED' 
                      ? 'This verification is completed and cannot be edited.'
                      : 'This verification has discrepancies. Only fields with discrepancies can be edited.'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Form */}
          <EditVerificationRequestForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={submitting || externalLoading}
            initialData={formInitialData}
            initialDocuments={initialDocuments}
            isEdit={true}
            shouldDisableField={shouldDisableField}
            verificationStatus={status}
          />

          {/* Discrepancies Section - Display after form if available */}
          {discrepancies.length > 0 && (
            <View className="bg-white rounded-2xl mx-4 mb-4 p-5 shadow-sm border border-gray-100">
              <TouchableOpacity
                onPress={toggleDiscrepancies}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <Feather name="alert-triangle" size={20} color="#EF4444" />
                  <Text className="font-rubik-bold text-base text-gray-800 ml-2">
                    Discrepancies Found ({discrepancies.length})
                  </Text>
                </View>
                <Feather
                  name={expandedDiscrepancies ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>

              {expandedDiscrepancies && (
                <View className="mt-4 gap-3">
                  {discrepancies.map((discrepancy) => (
                    <View
                      key={discrepancy.id}
                      className="bg-red-50 rounded-xl p-4 border border-red-200"
                    >
                      <View className="flex-row items-start mb-3">
                        <Feather name="alert-triangle" size={16} color="#EF4444" />
                        <Text className="font-rubik-bold text-sm text-red-700 ml-2">
                          {formatFieldName(discrepancy.fieldName)}
                        </Text>
                      </View>

                      <View className="space-y-2">
                        <View>
                          <Text className="font-rubik text-xs text-red-500 uppercase tracking-wide mb-1">
                            Employee Claimed
                          </Text>
                          <Text className="font-rubik-medium text-sm text-red-700 bg-white/50 p-2 rounded-lg">
                            {discrepancy.employeeClaimedValue}
                          </Text>
                        </View>

                        <View>
                          <Text className="font-rubik text-xs text-red-500 uppercase tracking-wide mb-1">
                            Actual Value
                          </Text>
                          <Text className="font-rubik-medium text-sm text-red-700 bg-white/50 p-2 rounded-lg">
                            {discrepancy.actualValue}
                          </Text>
                        </View>

                        {discrepancy.remarks && (
                          <View className="mt-2">
                            <Text className="font-rubik text-xs text-red-500 uppercase tracking-wide mb-1">
                              Remarks
                            </Text>
                            <Text className="font-rubik text-sm text-red-600">
                              {discrepancy.remarks}
                            </Text>
                          </View>
                        )}

                        <Text className="font-rubik text-xs text-red-400 mt-2">
                          Reported on {new Date(discrepancy.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
};

export default EditVerificationRequest;