import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';
import Toast from 'react-native-toast-message';
import Input from '../ui/Input';
import http from '../../services/http.api';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/AppStackNavigator';
import VerificationRequestForm, { VerificationFormData, DocumentFile } from './VerificationRequestForm';
import EditVerificationRequestForm from './EditVerificationRequestForm';

interface EditVerificationRequestProps {
  onSubmit?: (data: VerificationFormData, documents: DocumentFile[]) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

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
  hrEmail: string;
  reasonForLeaving: string | null;
  rehireEligible: boolean;
  verificationStatus: string;
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
  employmentRecord: EmploymentRecord;
  candidate: Candidate;
  salaryRecords: SalaryRecord[];
  discrepancies: any[];
  documents: Document[];
  verificationResponse: any | null;
  behaviorReport: any | null;
}

const EditVerificationRequest: React.FC<EditVerificationRequestProps> = ({
  onSubmit: externalOnSubmit,
  onCancel,
  isLoading: externalLoading = false,
}) => {
  const { colors } = useTheme();
  const route = useRoute<RouteProp<AppStackParamList, 'EditVerification'>>();
  const { verificationId } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState<VerificationRequestDetails | null>(null);
  const [formInitialData, setFormInitialData] = useState<VerificationFormData | undefined>(undefined);
  const [initialDocuments, setInitialDocuments] = useState<DocumentFile[]>([]);

  // Fetch verification details on mount
  useEffect(() => {
    fetchVerificationDetails();
  }, [verificationId]);

  const fetchVerificationDetails = async () => {
    setLoading(true);
    try {
      const response = await http.get(`/api/verification/employee/create-request/${verificationId}`);
      
      if ( response.data) {
        const data = response.data;
        setVerificationDetails(data);
        
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
    } finally {
      setLoading(false);
    }
  };

  const mapApiResponseToFormData = (data: VerificationRequestDetails): VerificationFormData => {
    const { employmentRecord, salaryRecords } = data;
    
    // Determine verification type based on available data
    const verificationType = employmentRecord.hrEmail && !employmentRecord.companyName 
      ? 'hr' 
      : 'organization';

    // Get the first salary record if exists
    const salaryRecord = salaryRecords && salaryRecords.length > 0 ? salaryRecords[0] : undefined;
    console.log(salaryRecord, "salary")

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
      } : undefined,
      verificationType: verificationType,
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
    }));
  };

  const handleSubmit = async (data: VerificationFormData, documents: DocumentFile[]) => {
    setSubmitting(true);
    try {
      // Prepare the update payload
      const updatePayload: any = {
        designation: data.designation,
        department: data.department,
        employmentType: data.employmentType,
        startDate: data.startDate,
        endDate: data.endDate || null,
        location: data.location,
        reasonForLeaving: data.reasonForLeaving || '',
        rehireEligible: true, // You might want to make this configurable
        hrEmail: data.hrEmail,
        companyName: data.companyName,
      };

      // Include salary if exists
      if (data.salary) {
        // Find the original salary record to get its ID
        const originalSalary = verificationDetails?.salaryRecords?.[0];
        
        updatePayload.salary = {
          ...(originalSalary?.id && { id: originalSalary.id }),
          salaryType: data.salary.salaryType,
          amount: data.salary.amount,
          currency: data.salary.currency,
          frequency: data.salary.frequency,
          effectiveDate: data.salary.effectiveDate || null,
        };
      }

      // Make the PUT request
      const response = await http.put(
        `/api/verification/employee/create-request/${verificationId}`,
        updatePayload,
        {
          headers: {
            'Content-Type': 'application/json',
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
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="font-rubik text-sm text-gray-400 mt-3">
          Loading verification details...
        </Text>
      </View>
    );
  }

  if (!formInitialData) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
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
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      
      {/* Form */}
      <EditVerificationRequestForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={submitting || externalLoading}
        initialData={formInitialData}
        initialDocuments={initialDocuments}
        isEdit={true}
      />
    </KeyboardAvoidingView>
  );
};

export default EditVerificationRequest;