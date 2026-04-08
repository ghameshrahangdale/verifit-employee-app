// EmploymentRecord.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import Toast from 'react-native-toast-message';
import http from '../../services/http.api';

interface EmploymentRecordData {
  id: string;
  employeeId: string;
  organizationId: string;
  companyName: string;
  designation: string;
  department: string;
  employmentType: string;
  startDate: string;
  endDate: string | null;
  hrEmail: string;
  location: string;
  reasonForLeaving: string | null;
  rehireEligible: boolean;
  verificationStatus: string;
  verifiedAt: string | null;
  verifiedById: string | null;
  documentIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface Document {
  id: string;
  documentType: string;
  title: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  verified: boolean;
  uploadedAt: string;
}

interface EmploymentRecordResponse {
  employmentRecord: EmploymentRecordData;
  documents: Document[];
}

interface EmploymentRecordProps {
  employeeId: string;
}

const EmploymentRecord: React.FC<EmploymentRecordProps> = ({ employeeId }) => {
  const { colors } = useTheme();
  const [data, setData] = useState<EmploymentRecordResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEmploymentRecords();
  }, [employeeId]);

  const fetchEmploymentRecords = async () => {
    try {
      setIsLoading(true);
      const response = await http.get(`/api/employees/employment-records?employeeId=${employeeId}`);
        

      
    setData(response.data);
      
    } catch (error: any) {
      
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Present';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getVerificationStatusBadge = (status: string) => {
    const statuses: Record<string, { label: string; color: string; bgColor: string }> = {
      pending: { label: 'Pending', color: '#92400E', bgColor: '#FEF3C7' },
      verified: { label: 'Verified', color: '#15803D', bgColor: '#DCFCE7' },
      rejected: { label: 'Rejected', color: '#991B1B', bgColor: '#FEE2E2' },
    };
    return statuses[status] || { label: status, color: '#64748B', bgColor: '#F1F5F9' };
  };

  const getDocumentIcon = (documentType: string) => {
    const icons: Record<string, string> = {
      offer_letter: 'file-text',
      resume: 'file',
      contract: 'file',
      id_proof: 'user-check',
      experience_letter: 'award',
    };
    return icons[documentType] || 'file';
  };

  const handleOpenDocument = async (fileUrl: string, title: string) => {
    try {
      const supported = await Linking.canOpenURL(fileUrl);
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Cannot Open File',
          text2: 'Unable to open this document',
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

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const Section = ({
    label,
    icon,
    children,
  }: {
    label: string;
    icon: string;
    children: React.ReactNode;
  }) => (
    <View className="mb-6">
      <View className="flex-row items-center mb-3 px-1">
        <View
          className="w-7 h-7 rounded-lg items-center justify-center mr-2"
          style={{ backgroundColor: `${colors.primary}18` }}
        >
          <Feather name={icon} size={14} color={colors.primary} />
        </View>
        <Text className="text-xs font-rubik-bold tracking-widest uppercase text-gray-400">
          {label}
        </Text>
      </View>
      {children}
    </View>
  );

  const Card = ({ children, noPad }: { children: React.ReactNode; noPad?: boolean }) => (
    <View
      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden ${noPad ? '' : 'px-4 py-1'}`}
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      {children}
    </View>
  );

  const InfoRow = ({
    label,
    value,
    isLast,
    isLink = false,
    onPress,
  }: {
    label: string;
    value: string | number | null;
    isLast?: boolean;
    isLink?: boolean;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={isLink ? 0.7 : 1}
      disabled={!isLink}
      className={`flex-row justify-between items-center py-3 ${!isLast ? 'border-b border-gray-50' : ''}`}
    >
      <Text className="text-sm font-rubik text-gray-400 flex-1">{label}</Text>
      <View className="flex-row items-center flex-1 justify-end">
        <Text
          className={`text-sm font-rubik-medium flex-1 text-right ${
            isLink ? 'text-primary underline' : 'text-gray-800'
          }`}
          numberOfLines={2}
        >
          {value ?? 'N/A'}
        </Text>
        {isLink && (
          <Feather name="external-link" size={14} color={colors.primary} style={{ marginLeft: 6 }} />
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="mb-6">
        <Section label="Employment Record" icon="briefcase">
          <Card noPad>
            <View className="py-8 items-center justify-center">
              <ActivityIndicator size="small" color={colors.primary} />
              <Text className="text-xs font-rubik text-gray-400 mt-2">Loading employment record...</Text>
            </View>
          </Card>
        </Section>
      </View>
    );
  }

  if (!data?.employmentRecord) {
    return null;
  }

  const { employmentRecord, documents } = data;
  const statusBadge = getVerificationStatusBadge(employmentRecord.verificationStatus);
  const startDate = formatDate(employmentRecord.startDate);
  const endDate = formatDate(employmentRecord.endDate);
  const dateRange = `${startDate} – ${endDate}`;

  return (
    <Section label="Employment Record" icon="briefcase">
      <Card noPad>
        {/* Company Header */}
        <View className="px-4 pt-4 pb-3 border-b border-gray-50">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-lg font-rubik-bold text-gray-900">
                {employmentRecord.companyName}
              </Text>
              <Text className="text-sm font-rubik-medium text-gray-500 mt-0.5">
                {employmentRecord.designation} · {employmentRecord.department}
              </Text>
              <View className="flex-row items-center mt-1">
                <Feather name="calendar" size={12} color="#9CA3AF" />
                <Text className="text-xs font-rubik text-gray-400 ml-1">{dateRange}</Text>
              </View>
            </View>
            <View
              className="px-3 py-1.5 rounded-full"
              style={{ backgroundColor: statusBadge.bgColor }}
            >
              <Text
                className="text-xs font-rubik-bold"
                style={{ color: statusBadge.color }}
              >
                {statusBadge.label}
              </Text>
            </View>
          </View>
        </View>

        {/* HR Contact */}
        <View className="px-4 py-3 border-b border-gray-50">
          <TouchableOpacity
            onPress={() => handleEmailPress(employmentRecord.hrEmail)}
            className="flex-row items-center"
          >
            <View
              className="w-8 h-8 rounded-lg items-center justify-center mr-3"
              style={{ backgroundColor: `${colors.primary}10` }}
            >
              <Feather name="mail" size={14} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-rubik text-gray-400">HR Contact</Text>
              <Text className="text-sm font-rubik-medium text-primary mt-0.5">
                {employmentRecord.hrEmail}
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Location */}
        {employmentRecord.location && (
          <View className="px-4 py-3 border-b border-gray-50">
            <View className="flex-row items-start">
              <View
                className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.primary}10` }}
              >
                <Feather name="map-pin" size={14} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-rubik text-gray-400">Location</Text>
                <Text className="text-sm font-rubik-medium text-gray-700 mt-0.5 leading-5">
                  {employmentRecord.location}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Reason for Leaving */}
        {employmentRecord.reasonForLeaving && (
          <View className="px-4 py-3 border-b border-gray-50">
            <View className="flex-row items-start">
              <View
                className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.primary}10` }}
              >
                <Feather name="log-out" size={14} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-rubik text-gray-400">Reason for Leaving</Text>
                <Text className="text-sm font-rubik-medium text-gray-700 mt-0.5 leading-5">
                  {employmentRecord.reasonForLeaving}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Rehire Eligibility */}
        <View className="px-4 py-3 border-b border-gray-50">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.primary}10` }}
              >
                <Feather name="user-check" size={14} color={colors.primary} />
              </View>
              <View>
                <Text className="text-xs font-rubik text-gray-400">Rehire Eligibility</Text>
                <Text className="text-sm font-rubik-medium text-gray-700 mt-0.5">
                  {employmentRecord.rehireEligible ? 'Eligible for Rehire' : 'Not Rehire Eligible'}
                </Text>
              </View>
            </View>
            <View
              className={`px-2.5 py-1 rounded-full ${
                employmentRecord.rehireEligible ? 'bg-green-100' : 'bg-red-100'
              }`}
            >
              <Text
                className={`text-xs font-rubik-bold ${
                  employmentRecord.rehireEligible ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {employmentRecord.rehireEligible ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
        </View>

        {/* Documents Section */}
        {documents && documents.length > 0 && (
          <View className="px-4 py-3">
            <View className="flex-row items-center mb-3">
              <View
                className="w-6 h-6 rounded-lg items-center justify-center mr-2"
                style={{ backgroundColor: `${colors.primary}10` }}
              >
                <Feather name="file-text" size={12} color={colors.primary} />
              </View>
              <Text className="text-xs font-rubik-bold text-gray-500 uppercase tracking-wider">
                Documents
              </Text>
            </View>

            {documents.map((doc, index) => (
              <TouchableOpacity
                key={doc.id}
                onPress={() => handleOpenDocument(doc.fileUrl, doc.title)}
                className={`flex-row items-center py-3 ${
                  index < documents.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: `${colors.primary}10` }}
                >
                  <Feather name={getDocumentIcon(doc.documentType)} size={18} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-rubik-medium text-gray-800">{doc.title}</Text>
                  <View className="flex-row items-center mt-0.5">
                    <Text className="text-xs font-rubik text-gray-400">
                      {doc.documentType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Text>
                    <Text className="text-xs font-rubik text-gray-400 mx-1">·</Text>
                    <Text className="text-xs font-rubik text-gray-400">
                      {formatFileSize(doc.fileSize)}
                    </Text>
                    <Text className="text-xs font-rubik text-gray-400 mx-1">·</Text>
                    <Text className="text-xs font-rubik text-gray-400">
                      {formatDateShort(doc.uploadedAt)}
                    </Text>
                  </View>
                </View>
                <Feather name="download" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>
    </Section>
  );
};

export default EmploymentRecord;