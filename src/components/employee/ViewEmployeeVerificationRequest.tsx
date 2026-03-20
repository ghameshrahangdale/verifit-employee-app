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
import { formatDate, formatDateTime, getCurrencySymbol, getDocumentTypeLabel, getEmploymentTypeLabel, getSalaryTypeLabel, getStatusConfig } from '../../utils/verificationHelpers';
import { VerificationResponse, EmploymentRecord, SalaryRecord, Discrepancy, Document, Candidate, BehaviorReport } from '../../types';

type ViewEmployeeVerificationRouteProp = RouteProp<AppStackParamList, 'ViewVerification'>;

interface VerificationRequestDetails {
  verificationRequest: {
    id: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'IN_REVIEW' | 'DISCREPANCIES';
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
  verificationResponse?: VerificationResponse;
  behaviorReport?: BehaviorReport | null;
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
    behavior: true,
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
    handleOpenDocument(document);
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

  const renderStatusBadge = (isConfirmed: boolean | undefined) => {
    if (isConfirmed === undefined) return null;

    if (!isConfirmed) {
      return (
        <View className="bg-red-100 px-2 py-1 rounded-full border border-red-300">
          <View className="flex-row items-center">
            <Feather name="alert-triangle" size={12} color="#DC2626" />
            <Text className="font-rubik-medium text-xs text-red-700 ml-1">
              Incorrect
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View className="bg-green-100 px-2 py-1 rounded-full border border-green-300">
        <View className="flex-row items-center">
          <Feather name="check-circle" size={12} color="#059669" />
          <Text className="font-rubik-medium text-xs text-green-700 ml-1">
            Correct
          </Text>
        </View>
      </View>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <View className="flex-row items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Feather
            key={star}
            name="star"
            size={16}
            color={star <= rating ? "#FBBF24" : "#D1D5DB"}
            style={{ marginRight: 2 }}
          />
        ))}
        <Text className="font-rubik-medium text-sm text-gray-600 ml-2">
          {rating}/5
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header title="Verification Details" />
        <Loader fullScreen />
      </View>
    );
  }

  if (!details) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header title="Verification Details" />
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
      <Header title="Verification Details" />

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
            {/* Company Name */}
            <View>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide">
                  Company
                </Text>
                {details.verificationResponse && renderStatusBadge(details.verificationResponse.companyNameConfirmed)}
              </View>
              <Text className="font-rubik-medium text-base text-gray-900">
                {details.employmentRecord.companyName}
              </Text>
            </View>

            {/* Designation */}
            <View>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide">
                  Designation
                </Text>
                {details.verificationResponse && renderStatusBadge(details.verificationResponse.designationConfirmed)}
              </View>
              <Text className="font-rubik-medium text-base text-gray-900">
                {details.employmentRecord.designation}
              </Text>
            </View>

            {/* Department */}
            <View>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide">
                  Department
                </Text>
                {details.verificationResponse && renderStatusBadge(details.verificationResponse.departmentConfirmed)}
              </View>
              <Text className="font-rubik-medium text-base text-gray-900">
                {details.employmentRecord.department}
              </Text>
            </View>

            {/* Employment Type */}
            <View>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide">
                  Employment Type
                </Text>
                {details.verificationResponse && renderStatusBadge(details.verificationResponse.employmentTypeConfirmed)}
              </View>
              <View className="flex-row items-center">
                <Feather name="users" size={14} color="#64748B" />
                <Text className="font-rubik-medium text-sm text-gray-800 ml-2">
                  {getEmploymentTypeLabel(details.employmentRecord.employmentType)}
                </Text>
              </View>
            </View>

            {/* Location */}
            <View>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide">
                  Location
                </Text>
                {details.verificationResponse && renderStatusBadge(details.verificationResponse.locationConfirmed)}
              </View>
              <View className="flex-row items-center">
                <Feather name="map-pin" size={14} color="#64748B" />
                <Text className="font-rubik-medium text-sm text-gray-800 ml-2">
                  {details.employmentRecord.location}
                </Text>
              </View>
            </View>

            {/* Start Date */}
            <View>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide">
                  Start Date
                </Text>
                {details.verificationResponse && renderStatusBadge(details.verificationResponse.startDateConfirmed)}
              </View>
              <View className="flex-row items-center">
                <Feather name="calendar" size={14} color="#64748B" />
                <Text className="font-rubik-medium text-sm text-gray-800 ml-2">
                  {formatDate(details.employmentRecord.startDate)}
                </Text>
              </View>
            </View>

            {/* End Date */}
            <View>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide">
                  End Date
                </Text>
                {details.verificationResponse && renderStatusBadge(details.verificationResponse.endDateConfirmed)}
              </View>
              <View className="flex-row items-center">
                <Feather name="calendar" size={14} color="#64748B" />
                <Text className="font-rubik-medium text-sm text-gray-800 ml-2">
                  {formatDate(details.employmentRecord.endDate)}
                </Text>
              </View>
            </View>



            {/* HR Contact */}
            {details.employmentRecord.hrEmail &&
              <View>
                <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-1">
                  HR Contact
                </Text>
                <Text className="font-rubik-medium text-sm text-gray-800">
                  {details.employmentRecord.hrEmail}
                </Text>
              </View>
            }

            {/* Reason for Leaving */}
            {details.employmentRecord.reasonForLeaving && (
              <View>
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide">
                    Reason for Leaving
                  </Text>
                  {details.verificationResponse && renderStatusBadge(details.verificationResponse.reasonForLeavingConfirmed)}
                </View>
                <Text className="font-rubik text-sm text-gray-600">
                  {details.employmentRecord.reasonForLeaving}
                </Text>
              </View>
            )}


            {/* Verification Comments */}
            {details.verificationResponse?.comments && (
              <View className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <Text className="font-rubik-bold text-xs text-gray-500 mb-1">Verifier Comments</Text>
                <Text className="font-rubik text-sm text-gray-700">{details.verificationResponse.comments}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Salary Records Section */}
        {details.salaryRecords.length > 0 && (
          <View className="bg-white rounded-2xl mx-4 mt-4 p-5 shadow-sm border border-gray-100">
            <TouchableOpacity
              onPress={() => toggleSection('salary')}
              className="flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <Text className="font-rubik-bold text-base text-gray-800">
                  Salary Records ({details.salaryRecords.length})
                </Text>
              </View>
              <View className="flex-row items-center">
                {details.verificationResponse && renderStatusBadge(details.verificationResponse.salaryConfirmed)}
                <Feather
                  name={expandedSections.salary ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#64748B"
                  style={{ marginLeft: 8 }}
                />
              </View>
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
              <View className="flex-row items-center">
                <Text className="font-rubik-bold text-base text-gray-800">
                  Documents ({details.documents.length})
                </Text>
              </View>
           
            </TouchableOpacity>

            {expandedSections.documents && (
              <View className="mt-4 gap-3">
                {details.documents.map((doc) => {
                  // Find confirmation status for this document
                  const documentConfirmation = details.verificationResponse?.documentConfirmations?.find(
                    (conf: { id: string; }) => conf.id === doc.id
                  );
                  const isConfirmed = documentConfirmation?.confirmed;

                  return (
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
                            <View className="flex-row items-center gap-2">
                              {/* Individual document confirmation badge */}
                              {details.verificationResponse && renderStatusBadge(isConfirmed)}
                              {doc.verified && (
                                <View className="bg-green-50 px-2 py-1 rounded-full border border-green-200 ml-2">
                                  <Text className="font-rubik-medium text-xs text-green-700">Verified</Text>
                                </View>
                              )}
                            </View>
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
                  );
                })}
              </View>
            )}
          </View>
        )}
        {/* Behavior Report Section */}
        {details.behaviorReport && (
          <View className="bg-white rounded-2xl mx-4 mt-4 p-5 shadow-sm border border-gray-100">
            <TouchableOpacity
              onPress={() => toggleSection('behavior')}
              className="flex-row items-center justify-between"
            >
              <Text className="font-rubik-bold text-base text-gray-800">
                Behavior Report
              </Text>
              <View className="flex-row items-center">
                {details.verificationResponse && renderStatusBadge(details.verificationResponse.behaviorConfirmed)}
                <Feather
                  name={expandedSections.behavior ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#64748B"
                  style={{ marginLeft: 8 }}
                />
              </View>
            </TouchableOpacity>

            {expandedSections.behavior && (
              <View className="mt-4 space-y-4">
                {/* Ratings */}
                <View className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <Text className="font-rubik-bold text-sm text-gray-700 mb-3">Ratings</Text>

                  <View className="space-y-3">
                    <View className="flex-row justify-between items-center">
                      <Text className="font-rubik text-sm text-gray-600">Teamwork</Text>
                      {renderStars(details.behaviorReport.teamworkRating)}
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="font-rubik text-sm text-gray-600">Leadership</Text>
                      {renderStars(details.behaviorReport.leadershipRating)}
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="font-rubik text-sm text-gray-600">Communication</Text>
                      {renderStars(details.behaviorReport.communicationRating)}
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="font-rubik text-sm text-gray-600">Integrity</Text>
                      {renderStars(details.behaviorReport.integrityRating)}
                    </View>

                    <View className="flex-row justify-between items-center">
                      <Text className="font-rubik text-sm text-gray-600">Performance</Text>
                      {renderStars(details.behaviorReport.performanceRating)}
                    </View>
                  </View>
                </View>

                {/* Flags */}
                <View className="gap-2 my-3">
                  <View className="flex-row items-center">
                    <Feather
                      name={details.behaviorReport.policyViolation ? "alert-circle" : "check-circle"}
                      size={16}
                      color={details.behaviorReport.policyViolation ? "#EF4444" : "#10B981"}
                    />
                    <Text className={`font-rubik-medium text-sm ml-2 ${details.behaviorReport.policyViolation ? 'text-red-600' : 'text-green-600'}`}>
                      {details.behaviorReport.policyViolation ? 'Policy Violation Reported' : 'No Policy Violation'}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Feather
                      name={details.behaviorReport.disciplinaryAction ? "alert-circle" : "check-circle"}
                      size={16}
                      color={details.behaviorReport.disciplinaryAction ? "#EF4444" : "#10B981"}
                    />
                    <Text className={`font-rubik-medium text-sm ml-2 ${details.behaviorReport.disciplinaryAction ? 'text-red-600' : 'text-green-600'}`}>
                      {details.behaviorReport.disciplinaryAction ? 'Disciplinary Action Taken' : 'No Disciplinary Action'}
                    </Text>
                  </View>

                  <View className="flex-row items-center">
                    <Feather
                      name={details.behaviorReport.rehireRecommendation ? "thumbs-up" : "thumbs-down"}
                      size={16}
                      color={details.behaviorReport.rehireRecommendation ? "#10B981" : "#EF4444"}
                    />
                    <Text className={`font-rubik-medium text-sm ml-2 ${details.behaviorReport.rehireRecommendation ? 'text-green-600' : 'text-red-600'}`}>
                      {details.behaviorReport.rehireRecommendation ? 'Recommended for Rehire' : 'Not Recommended for Rehire'}
                    </Text>
                  </View>
                </View>

                {details.behaviorReport.remarks ? (
                  <View className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <Text className="font-rubik-bold text-xs text-gray-500 mb-1">Remarks</Text>
                    <Text className="font-rubik text-sm text-gray-700">{details.behaviorReport.remarks}</Text>
                  </View>
                ) : null}

                <Text className="font-rubik text-xs text-gray-400 mt-3">
                  Reported on {formatDateTime(details.behaviorReport.createdAt)}
                </Text>
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
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default ViewEmployeeVerificationRequest;