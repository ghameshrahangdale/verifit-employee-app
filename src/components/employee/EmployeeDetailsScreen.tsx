import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import Header from '../ui/Header';
import Avatar from '../ui/Avatar';
import Toast from 'react-native-toast-message';
import http from '../../services/http.api';
import { AppStackParamList } from '../../navigation/AppStackNavigator';
import VerificationRequestForm, { VerificationFormData, DocumentFile } from './VerificationRequestForm';

interface EmployeeProfile {
  id: string;
  userId: string;
  designation: string;
  department: string;
  employmentType: string;
  joiningDate: string;
  relievingDate: string | null;
  panNumber: string;
  aadharNumber: string;
  passportNumber: string;
  uanNumber: string;
  skills: string[];
  qualifications: Qualification[];
  workHistory: WorkHistory[];
  socialProfiles: SocialProfile[];
  createdAt: string;
  updatedAt: string;
}

interface Qualification {
  degree: string;
  percentage: number;
  institution: string;
  yearOfPassing: number;
}

interface WorkHistory {
  toDate: string | null;
  fromDate: string;
  isCurrent: boolean;
  companyName: string;
  designation: string;
  responsibilities: string;
}

interface SocialProfile {
  url: string;
  platform: string;
}

const EmployeeDetailsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppStackParamList, 'EmployeeDetails'>>();
  const { employeeId } = route.params;

  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployeeProfile();
  }, [employeeId]);

  const fetchEmployeeProfile = async () => {
    try {
      setIsLoading(true);
      const response = await http.get(`/api/employees/profile?employeeId=${employeeId}`);
      if (response.data) {
        setProfile(response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Profile',
        text2: error.response?.data?.message || 'Unable to fetch employee details',
      });
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Present';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getEmploymentTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string; bgColor: string }> = {
      full_time: { label: 'Full Time', color: '#15803D', bgColor: '#DCFCE7' },
      part_time: { label: 'Part Time', color: '#92400E', bgColor: '#FEF3C7' },
      contract: { label: 'Contract', color: '#1E40AF', bgColor: '#DBEAFE' },
      intern: { label: 'Intern', color: '#6B21A8', bgColor: '#F3E8FF' },
    };
    return types[type] || { label: type, color: '#64748B', bgColor: '#F1F5F9' };
  };

  const getSocialIcon = (platform: string): string => {
    const map: Record<string, string> = {
      linkedin: 'linkedin',
      github: 'github',
      twitter: 'twitter',
      instagram: 'instagram',
    };
    return map[platform?.toLowerCase()] || 'globe';
  };

  const handleSubmitVerificationRequest = async (data: VerificationFormData, documents: DocumentFile[]) => {
    setIsSubmitting(true);
    try {
      // Create FormData object
      const formData = new FormData();

      const requestData = {
        employeeId: employeeId, // Using employeeId
        organizationId: data.organizationId, 
        designation: data.designation,
        department: data.department,
        employmentType: data.employmentType,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        location: data.location,
        reasonForLeaving: data.reasonForLeaving || undefined,
        salary: data.salary ? {
          salaryType: data.salary.salaryType,
          amount: data.salary.amount,
          currency: data.salary.currency,
          frequency: data.salary.frequency,
        } : undefined,
      };

      // Append the main data as JSON string
      formData.append('data', JSON.stringify(requestData));

      // Append each document with the required structure
      documents.forEach((doc, index) => {
        formData.append(`documents[${index}][file]`, {
          uri: doc.uri,
          name: doc.name,
          type: doc.type,
        } as any);

        formData.append(`documents[${index}][type]`, doc.documentType);
        formData.append(`documents[${index}][title]`, doc.title);
      });

      console.log(formData);

      const response = await http.post('/api/verification/employee/create-request', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Verification request submitted successfully',
      });

      setIsModalVisible(false);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error.response?.data?.message || 'Failed to submit verification request',
      });
      throw error; // Re-throw to let the form handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Sub-components ───────────────────────────────────────────────

  /** Section wrapper with label */
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
      {/* Section label row */}
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

  /** Card container */
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

  /** Single info row inside a card */
  const InfoRow = ({
    label,
    value,
    isLast,
  }: {
    label: string;
    value: string | number | null;
    isLast?: boolean;
  }) => (
    <View className={`flex-row justify-between items-center py-3 ${!isLast ? 'border-b border-gray-50' : ''}`}>
      <Text className="text-sm font-rubik text-gray-400 flex-1">{label}</Text>
      <Text className="text-sm font-rubik-medium text-gray-800 flex-1 text-right" numberOfLines={1}>
        {value ?? 'N/A'}
      </Text>
    </View>
  );

  // ─── Loading ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header title="Employee Details" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  // ─── Not found ────────────────────────────────────────────────────

  if (!profile) {
    return (
      <View className="flex-1 bg-gray-50">
        <Header title="Employee Details" />
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-2xl bg-red-100 items-center justify-center mb-4">
            <Feather name="alert-circle" size={32} color="#EF4444" />
          </View>
          <Text className="text-lg font-rubik-bold text-gray-900 text-center">Profile Not Found</Text>
          <Text className="text-sm font-rubik text-gray-500 text-center mt-2">
            The employee profile you're looking for doesn't exist or has been removed
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="mt-6 px-6 py-3 bg-primary rounded-xl"
          >
            <Text className="text-white font-rubik-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const employmentType = getEmploymentTypeBadge(profile.employmentType);

  // ─── Main render ──────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-gray-50">
      <Header title="Employee Details" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        {/* ── Hero Card ─────────────────────────────────────────── */}
        <View
          className="bg-white px-5 pt-6 pb-5 border-b border-gray-100"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 3 },
            elevation: 3,
          }}
        >
          <View className="flex-row items-center">
            {/* Avatar */}
            <View className="rounded-full overflow-hidden ">
              <Avatar name="Employee" size="xl" />
            </View>

            {/* Name & meta */}
            <View className="flex-1 ml-4">
              <Text className="text-lg font-rubik-bold text-gray-900" numberOfLines={1}>
                {profile.designation}
              </Text>
              <Text className="text-sm font-rubik text-gray-400 mt-0.5">{profile.department}</Text>

              {/* Badges */}
              <View className="flex-row flex-wrap mt-2 gap-2">
                <View
                  className="px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: employmentType.bgColor }}
                >
                  <Text
                    className="text-xs font-rubik-medium"
                    style={{ color: employmentType.color }}
                  >
                    {employmentType.label}
                  </Text>
                </View>
                <View className="px-2.5 py-1 rounded-full bg-gray-100">
                  <Text className="text-xs font-rubik-medium text-gray-500">
                    #{profile.userId.slice(0, 8).toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Joining info strip */}
          <View className="mt-4 flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
            <Feather name="calendar" size={14} color="#94A3B8" />
            <Text className="text-xs font-rubik text-gray-500 ml-2">
              Joined{' '}
              <Text className="font-rubik-medium text-gray-700">{formatDate(profile.joiningDate)}</Text>
            </Text>
            {profile.relievingDate && (
              <>
                <Text className="text-gray-300 mx-2">•</Text>
                <Feather name="log-out" size={14} color="#94A3B8" />
                <Text className="text-xs font-rubik text-gray-500 ml-2">
                  Relieved{' '}
                  <Text className="font-rubik-medium text-gray-700">
                    {formatDate(profile.relievingDate)}
                  </Text>
                </Text>
              </>
            )}
          </View>
        </View>

        <View className="px-4 pt-6">
          {/* ── Personal IDs ──────────────────────────────────────── */}
          <Section label="Identity & Compliance" icon="shield">
            <Card>
              <InfoRow label="PAN Number" value={profile.panNumber} />
              <InfoRow label="Aadhar Number" value={profile.aadharNumber} />
              <InfoRow label="Passport Number" value={profile.passportNumber} />
              <InfoRow label="UAN Number" value={profile.uanNumber} isLast />
            </Card>
          </Section>

          {/* ── Skills ────────────────────────────────────────────── */}
          {profile.skills && profile.skills.length > 0 && (
            <Section label="Skills" icon="zap">
              <View className="flex-row flex-wrap gap-2">
                {profile.skills.map((skill, i) => (
                  <View
                    key={i}
                    className="px-3 py-2 rounded-xl border"
                    style={{
                      backgroundColor: `${colors.primary}0D`,
                      borderColor: `${colors.primary}25`,
                    }}
                  >
                    <Text
                      className="text-xs font-rubik-medium"
                      style={{ color: colors.primary }}
                    >
                      {skill}
                    </Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {/* ── Qualifications ────────────────────────────────────── */}
          {profile.qualifications && profile.qualifications.length > 0 && (
            <Section label="Education" icon="book-open">
              <Card noPad>
                {profile.qualifications.map((qual, i) => (
                  <View
                    key={i}
                    className={`px-4 py-4 ${i < profile.qualifications.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-3">
                        <Text className="text-sm font-rubik-bold text-gray-900">{qual.degree}</Text>
                        <Text className="text-xs font-rubik text-gray-400 mt-1">
                          {qual.institution}
                        </Text>
                        <Text className="text-xs font-rubik text-gray-400 mt-0.5">
                          Class of {qual.yearOfPassing}
                        </Text>
                      </View>
                      {/* Score pill */}
                      <View
                        className="px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: `${colors.primary}15` }}
                      >
                        <Text
                          className="text-xs font-rubik-bold"
                          style={{ color: colors.primary }}
                        >
                          {qual.percentage}%
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </Card>
            </Section>
          )}

          {/* ── Work History ──────────────────────────────────────── */}
          {profile.workHistory && profile.workHistory.length > 0 && (
            <Section label="Work History" icon="briefcase">
              {profile.workHistory.map((work, i) => (
                <View key={i} className="flex-row mb-4">
                  {/* Timeline line */}
                  <View className="items-center mr-4" style={{ width: 32 }}>
                    <View
                      className="w-8 h-8 rounded-xl items-center justify-center"
                      style={{ backgroundColor: work.isCurrent ? `${colors.primary}18` : '#F1F5F9' }}
                    >
                      <Feather
                        name="briefcase"
                        size={14}
                        color={work.isCurrent ? colors.primary : '#94A3B8'}
                      />
                    </View>
                    {i < profile.workHistory.length - 1 && (
                      <View className="flex-1 w-px bg-gray-100 mt-1" />
                    )}
                  </View>

                  {/* Content card */}
                  <View className="flex-1 bg-white rounded-2xl border border-gray-100 px-4 py-3 mb-1"
                    style={{
                      shadowColor: '#000',
                      shadowOpacity: 0.03,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 1,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-0.5">
                      <Text className="text-sm font-rubik-bold text-gray-900 flex-1 mr-2" numberOfLines={1}>
                        {work.companyName}
                      </Text>
                      {work.isCurrent && (
                        <View className="px-2 py-0.5 rounded-full bg-green-100">
                          <Text className="text-xs font-rubik-bold text-green-700">Current</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-xs font-rubik-medium" style={{ color: colors.primary }}>
                      {work.designation}
                    </Text>
                    <Text className="text-xs font-rubik text-gray-400 mt-1.5">
                      {formatDate(work.fromDate)} — {formatDate(work.toDate)}
                    </Text>
                    {work.responsibilities ? (
                      <Text className="text-xs font-rubik text-gray-500 mt-2 leading-4">
                        {work.responsibilities}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </Section>
          )}

          {/* ── Social Profiles ───────────────────────────────────── */}
          {profile.socialProfiles && profile.socialProfiles.length > 0 && (
            <Section label="Social Profiles" icon="share-2">
              <Card noPad>
                {profile.socialProfiles.map((social, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => Linking.openURL(social.url)}
                    activeOpacity={0.7}
                    className={`flex-row items-center px-4 py-3.5 ${
                      i < profile.socialProfiles.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
                      <Feather name={getSocialIcon(social.platform)} size={16} color="#0A66C2" />
                    </View>
                    <Text className="flex-1 text-sm font-rubik-medium text-gray-700 ml-3 capitalize">
                      {social.platform}
                    </Text>
                    <Feather name="external-link" size={15} color="#94A3B8" />
                  </TouchableOpacity>
                ))}
              </Card>
            </Section>
          )}
        </View>
      </ScrollView>

      {/* ── Verify Employee Button ──────────────────────────────── */}
      <View className="px-4 py-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          className="py-4 rounded-xl items-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="font-rubik-medium text-white text-base">Verify Employee</Text>
        </TouchableOpacity>
      </View>

      {/* ── Verification Request Modal ──────────────────────────── */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <TouchableOpacity
            className="flex-1 bg-black/45"
            activeOpacity={1}
            onPress={() => setIsModalVisible(false)}
          >
            <View className="flex-1 justify-end">
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
                className="bg-white rounded-t-3xl shadow-lg max-h-[90%]"
              >
                {/* Modal handle bar */}
                <View className="items-center pt-3">
                  <View className="w-9 h-1 rounded-full bg-gray-200" />
                </View>

                {/* Modal header */}
                <View className="flex-row justify-between items-center px-6 pt-4 pb-4 border-b border-gray-100">
                  <View>
                    <Text className="font-rubik-bold text-xl text-gray-900">
                      Verify Employee
                    </Text>
                    <Text className="font-rubik text-xs text-gray-400 mt-0.5">
                      Submit employment verification request for {profile.designation}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsModalVisible(false)}
                    className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center"
                  >
                    <Feather name="x" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Form */}
                <VerificationRequestForm
                  onSubmit={handleSubmitVerificationRequest}
                  onCancel={() => setIsModalVisible(false)}
                  isLoading={isSubmitting}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default EmployeeDetailsScreen;