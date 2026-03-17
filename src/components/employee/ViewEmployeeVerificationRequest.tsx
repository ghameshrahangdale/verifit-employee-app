import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
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

type ViewEmployeeVerificationRouteProp = RouteProp<AppStackParamList, 'ViewVerification'>;

interface Discrepancy {
  id: string;
  fieldName: string;
  employeeClaimedValue: string;
  actualValue: string;
  remarks?: string;
  createdAt: string;
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
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_REVIEW';
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
  discrepancies: Discrepancy[];
  documents: Document[];
}

const ViewEmployeeVerificationRequest: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute<ViewEmployeeVerificationRouteProp>();
  const navigation = useNavigation();
  const { verificationId } = route.params;

  const [details, setDetails] = useState<VerificationRequestDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    salary: true,
    documents: true,
    discrepancies: true,
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

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchVerificationDetails();
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
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

  const handleDownloadDocument = (document: Document) => {
    // Implement download logic if needed
    handleOpenDocument(document);
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      PENDING: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        label: 'PENDING',
        icon: 'clock',
      },
      IN_REVIEW: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        label: 'IN REVIEW',
        icon: 'eye',
      },
      APPROVED: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        label: 'APPROVED',
        icon: 'check-circle',
      },
      REJECTED: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        label: 'REJECTED',
        icon: 'x-circle',
      },
    };
    return configs[status as keyof typeof configs] || configs.PENDING;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header title="Verification Details"  />
        <Loader fullScreen />
      </View>
    );
  }

  if (!details) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header title="Verification Details"  />
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

  const statusConfig = getStatusConfig(details.verificationRequest.status);

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Verification Details"  />

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
        {/* Status Banner */}
        <View className={`mx-4 mt-4 p-4 rounded-2xl ${statusConfig.bg} border ${statusConfig.border}`}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Feather name={statusConfig.icon} size={20} color={statusConfig.text.replace('text-', '#')} />
              <Text className={`font-rubik-bold text-base ml-2 ${statusConfig.text}`}>
                {statusConfig.label}
              </Text>
            </View>
            <Text className="font-rubik text-xs text-gray-500">
              Requested {formatDate(details.verificationRequest.requestedAt)}
            </Text>
          </View>
          {details.verificationRequest.completedAt && (
            <Text className="font-rubik text-xs text-gray-500 mt-2">
              Completed on {formatDateTime(details.verificationRequest.completedAt)}
            </Text>
          )}
        </View>

        {/* Candidate Info Card */}
        <View className="bg-white rounded-2xl mx-4 mt-4 p-5 shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-4">
            <View 
              className="w-12 h-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: colors.primary + '15' }}
            >
              <Feather name="user" size={22} color={colors.primary} />
            </View>
            <View className="flex-1 ml-3">
              <Text className="font-rubik-bold text-lg text-gray-900">
                {details.candidate.name}
              </Text>
              <Text className="font-rubik text-xs text-gray-500">
                Employee ID: {details.candidate.employeeId.substring(0, 8)}...
              </Text>
            </View>
          </View>

          <View className="space-y-2">
            <View className="flex-row items-center">
              <Feather name="mail" size={14} color="#94A3B8" />
              <Text className="font-rubik text-sm text-gray-600 ml-3">
                {details.candidate.email}
              </Text>
            </View>
            {details.candidate.phone && (
              <View className="flex-row items-center">
                <Feather name="phone" size={14} color="#94A3B8" />
                <Text className="font-rubik text-sm text-gray-600 ml-3">
                  {details.candidate.phone}
                </Text>
              </View>
            )}
            {details.candidate.linkedinUrl && (
              <TouchableOpacity 
                className="flex-row items-center"
                onPress={() => Linking.openURL(details.candidate.linkedinUrl!)}
              >
                <Feather name="linkedin" size={14} color="#0A66C2" />
                <Text className="font-rubik text-sm text-blue-600 ml-3 underline">
                  LinkedIn Profile
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Employment Details Card */}
        <View className="bg-white rounded-2xl mx-4 mt-4 p-5 shadow-sm border border-gray-100">
          <Text className="font-rubik-bold text-base text-gray-800 mb-4">
            Employment Details
          </Text>

          <View className="space-y-4">
            <View>
              <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-1">
                Company
              </Text>
              <Text className="font-rubik-medium text-base text-gray-900">
                {details.employmentRecord.companyName}
              </Text>
            </View>

            <View className="flex-row">
              <View className="flex-1">
                <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-1">
                  Designation
                </Text>
                <Text className="font-rubik-medium text-sm text-gray-800">
                  {details.employmentRecord.designation}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-1">
                  Department
                </Text>
                <Text className="font-rubik-medium text-sm text-gray-800">
                  {details.employmentRecord.department}
                </Text>
              </View>
            </View>

            <View className="flex-row">
              <View className="flex-1">
                <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-1">
                  Employment Type
                </Text>
                <View className="flex-row items-center">
                  <Feather name="users" size={12} color="#64748B" />
                  <Text className="font-rubik-medium text-sm text-gray-800 ml-1.5">
                    {getEmploymentTypeLabel(details.employmentRecord.employmentType)}
                  </Text>
                </View>
              </View>
              <View className="flex-1">
                <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-1">
                  Location
                </Text>
                <View className="flex-row items-center">
                  <Feather name="map-pin" size={12} color="#64748B" />
                  <Text className="font-rubik-medium text-sm text-gray-800 ml-1.5">
                    {details.employmentRecord.location}
                  </Text>
                </View>
              </View>
            </View>

            <View className="flex-row">
              <View className="flex-1">
                <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-1">
                  Start Date
                </Text>
                <View className="flex-row items-center">
                  <Feather name="calendar" size={12} color="#64748B" />
                  <Text className="font-rubik-medium text-sm text-gray-800 ml-1.5">
                    {formatDate(details.employmentRecord.startDate)}
                  </Text>
                </View>
              </View>
              <View className="flex-1">
                <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-1">
                  End Date
                </Text>
                <View className="flex-row items-center">
                  <Feather name="calendar" size={12} color="#64748B" />
                  <Text className="font-rubik-medium text-sm text-gray-800 ml-1.5">
                    {formatDate(details.employmentRecord.endDate)}
                  </Text>
                </View>
              </View>
            </View>

            <View>
              <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-1">
                Manager
              </Text>
              <Text className="font-rubik-medium text-sm text-gray-800">
                {details.employmentRecord.managerName}
              </Text>
              <Text className="font-rubik text-xs text-gray-500">
                {details.employmentRecord.managerEmail}
              </Text>
            </View>

            <View>
              <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-1">
                HR Contact
              </Text>
              <Text className="font-rubik-medium text-sm text-gray-800">
                {details.employmentRecord.hrEmail}
              </Text>
            </View>

            {details.employmentRecord.reasonForLeaving && (
              <View>
                <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-1">
                  Reason for Leaving
                </Text>
                <Text className="font-rubik text-sm text-gray-600">
                  {details.employmentRecord.reasonForLeaving}
                </Text>
              </View>
            )}

            <View className="flex-row items-center">
              <Feather 
                name={details.employmentRecord.rehireEligible ? "check-circle" : "x-circle"} 
                size={14} 
                color={details.employmentRecord.rehireEligible ? "#10B981" : "#EF4444"} 
              />
              <Text className={`font-rubik-medium text-sm ml-1.5 ${details.employmentRecord.rehireEligible ? 'text-green-600' : 'text-red-600'}`}>
                {details.employmentRecord.rehireEligible ? 'Eligible for Rehire' : 'Not Eligible for Rehire'}
              </Text>
            </View>
          </View>
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
              <View className="mt-4 space-y-3">
                {details.salaryRecords.map((salary, index) => (
                  <View 
                    key={salary.id} 
                    className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="font-rubik-medium text-sm text-gray-800">
                        {getSalaryTypeLabel(salary.salaryType)}
                      </Text>
                      {salary.verified && (
                        <View className="bg-green-50 px-2 py-1 rounded-full border border-green-200">
                          <Text className="font-rubik-medium text-xs text-green-700">Verified</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text className="font-rubik-bold text-lg text-gray-900 mb-2">
                      {getCurrencySymbol(salary.currency)}{parseFloat(salary.amount).toLocaleString()} / {salary.frequency}
                    </Text>
                    
                    <View className="flex-row justify-between">
                      <Text className="font-rubik text-xs text-gray-400">
                        Effective: {formatDate(salary.effectiveDate)}
                      </Text>
                      {salary.bonusAmount && (
                        <Text className="font-rubik text-xs text-gray-400">
                          Bonus: {getCurrencySymbol(salary.currency)}{salary.bonusAmount}
                        </Text>
                      )}
                    </View>

                    {salary.stockOptions && (
                      <Text className="font-rubik text-xs text-gray-400 mt-1">
                        Stock Options: {salary.stockOptions}
                      </Text>
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
              <View className="mt-4 space-y-3">
                {details.documents.map((doc) => (
                  <View 
                    key={doc.id} 
                    className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                  >
                    <View className="flex-row items-start">
                      <View className="mr-3">
                        <View className="w-10 h-10 bg-indigo-100 rounded-lg items-center justify-center">
                          <Feather 
                            name={doc.contentType.includes('pdf') ? 'file' : 'image'} 
                            size={20} 
                            color="#6366F1" 
                          />
                        </View>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="font-rubik-medium text-base text-gray-800 flex-1">
                            {doc.title}
                          </Text>
                          {doc.verified && (
                            <View className="bg-green-50 px-2 py-1 rounded-full border border-green-200 ml-2">
                              <Text className="font-rubik-medium text-xs text-green-700">Verified</Text>
                            </View>
                          )}
                        </View>
                        
                        <Text className="font-rubik text-xs text-gray-500 mt-1">
                          {getDocumentTypeLabel(doc.documentType)} • {formatFileSize(doc.fileSize)}
                        </Text>
                        
                        <Text className="font-rubik text-xs text-gray-400 mt-1">
                          Uploaded {formatDate(doc.uploadedAt)}
                        </Text>

                        <View className="flex-row mt-3 gap-2">
                          <TouchableOpacity
                            onPress={() => handleOpenDocument(doc)}
                            className="flex-row items-center bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-200"
                          >
                            <Feather name="eye" size={14} color="#6366F1" />
                            <Text className="font-rubik-medium text-xs text-indigo-600 ml-1.5">
                              View
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            onPress={() => handleDownloadDocument(doc)}
                            className="flex-row items-center bg-gray-100 px-3 py-2 rounded-lg border border-gray-200"
                          >
                            <Feather name="download" size={14} color="#64748B" />
                            <Text className="font-rubik-medium text-xs text-gray-600 ml-1.5">
                              Download
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Discrepancies Section */}
        {details.discrepancies && details.discrepancies.length > 0 && (
          <View className="bg-white rounded-2xl mx-4 mt-4 p-5 shadow-sm border border-gray-100">
            <TouchableOpacity
              onPress={() => toggleSection('discrepancies')}
              className="flex-row items-center justify-between"
            >
              <Text className="font-rubik-bold text-base text-gray-800">
                Discrepancies ({details.discrepancies.length})
              </Text>
              <Feather 
                name={expandedSections.discrepancies ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#64748B" 
              />
            </TouchableOpacity>

            {expandedSections.discrepancies && (
              <View className="mt-4 gap-3">
                {details.discrepancies.map((discrepancy) => (
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
                        Reported on {formatDate(discrepancy.createdAt)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-3 mx-4 my-6">
          {details.verificationRequest.status === 'PENDING' && (
            <>
              <Button
                title="Edit Request"
                onPress={() => {
                  // Navigate to edit screen
                //   navigation.navigate('EditVerification' as any, { verificationId });
                }}
                variant="outline"
                className="flex-1"
              />
              <Button
                title="Cancel Request"
                onPress={() => {
                  Alert.alert(
                    'Cancel Request',
                    'Are you sure you want to cancel this verification request?',
                    [
                      { text: 'No', style: 'cancel' },
                      { 
                        text: 'Yes, Cancel', 
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await http.delete(`/api/verification/employee/${verificationId}`);
                            Toast.show({
                              type: 'success',
                              text1: 'Request Cancelled',
                              text2: 'Your verification request has been cancelled',
                            });
                            navigation.goBack();
                          } catch (error: any) {
                            Toast.show({
                              type: 'error',
                              text1: 'Failed to Cancel',
                              text2: error.response?.data?.message || 'Unable to cancel request',
                            });
                          }
                        }
                      },
                    ]
                  );
                }}
                className="flex-1"
                // style={{ backgroundColor: '#FEE2E2' }}
                // textStyle={{ color: '#DC2626' }}
              />
            </>
          )}
          
          {details.verificationRequest.status === 'REJECTED' && (
            <Button
              title="Resubmit Request"
              onPress={() => {
                // navigation.navigate('EditVerification' as any, { verificationId });
              }}
              className="flex-1"
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ViewEmployeeVerificationRequest;