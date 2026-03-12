// components/employee/EmployeeProfessionalDetails.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Toast from 'react-native-toast-message';
import http from '../../services/http.api';
import Icon from 'react-native-vector-icons/Feather';

// ─── Types ────────────────────────────────────────────────────────────────────

export enum EmploymentType {
  FULL_TIME = "full_time",
  PART_TIME = "part_time",
  CONTRACT = "contract",
  INTERN = "intern",
}

export enum SocialPlatform {
  LINKEDIN = "LinkedIn",
  GITHUB = "GitHub",
  TWITTER = "Twitter",
  FACEBOOK = "Facebook",
  INSTAGRAM = "Instagram",
  OTHER = "Other",
}

interface Qualification {
  degree: string;
  percentage: number | string;
  institution: string;
  yearOfPassing: number | string;
}

interface WorkHistory {
  companyName: string;
  designation: string;
  fromDate: string;
  toDate: string | null;
  isCurrent: boolean;
  responsibilities: string;
}

interface SocialProfile {
  platform: string;
  url: string;
}

interface EmployeeProfileData {
  designation: string;
  department: string;
  employmentType: EmploymentType;
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
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** A single labeled row inside an info card */
const InfoRow = ({
  label,
  value,
  valueColor,
  capitalize = false,
}: {
  label: string;
  value: string;
  valueColor?: string;
  capitalize?: boolean;
}) => (
  <View className="py-3">
    <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-0.5">
      {label}
    </Text>
    <Text
      className={`font-rubik-medium text-sm text-gray-800 leading-5 ${capitalize ? 'capitalize' : ''}`}
      style={valueColor ? { color: valueColor } : undefined}
      numberOfLines={2}
    >
      {value || 'Not provided'}
    </Text>
  </View>
);

/** Section separator with title */
const SectionSeparator = ({ title }: { title: string }) => (
  <View className="flex-row items-center gap-2.5 my-2">
    <View className="flex-1 h-px bg-gray-200" />
    <Text className="font-rubik-medium text-xs text-gray-400 uppercase tracking-widest">
      {title}
    </Text>
    <View className="flex-1 h-px bg-gray-200" />
  </View>
);

/** Employment type selector pill */
const EmploymentTypePill = ({
  type,
  selected,
  onSelect,
}: {
  type: EmploymentType;
  selected: boolean;
  onSelect: () => void;
}) => {
  const getLabel = (type: EmploymentType) => {
    switch (type) {
      case EmploymentType.FULL_TIME:
        return 'Full Time';
      case EmploymentType.PART_TIME:
        return 'Part Time';
      case EmploymentType.CONTRACT:
        return 'Contract';
      case EmploymentType.INTERN:
        return 'Intern';
      default:
        return type;
    }
  };

  return (
    <TouchableOpacity
      onPress={onSelect}
      className={`px-4 py-2 rounded-full border ${selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'
        }`}
    >
      <Text
        className={`font-rubik-medium text-sm ${selected ? 'text-indigo-600' : 'text-gray-600'
          }`}
      >
        {getLabel(type)}
      </Text>
    </TouchableOpacity>
  );
};

/** Empty state component */
const EmptyState = ({ onAddPress }: { onAddPress: () => void }) => (
  <View className="bg-white mx-4 rounded-2xl p-8 items-center justify-center shadow-sm">
    <Icon name="user" size={48} color="#9CA3AF" />
    <Text className="font-rubik-medium text-base text-gray-700 mt-4 text-center">
      No Professional Details Added
    </Text>
    <Text className="font-rubik text-sm text-gray-400 mt-1 text-center mb-6">
      Add your professional information to complete your profile
    </Text>
    <Button
      title="Add Professional Details"
      onPress={onAddPress}
    />
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface EmployeeProfessionalDetailsProps {
  onSaveComplete?: () => void;
}

const emptyQualification = (): Qualification => ({
  degree: '',
  percentage: '',
  institution: '',
  yearOfPassing: '',
});

const emptyWorkHistory = (): WorkHistory => ({
  companyName: '',
  designation: '',
  fromDate: '',
  toDate: '',
  isCurrent: false,
  responsibilities: '',
});

const emptySkillInput = '';

const emptySocialProfile = (): SocialProfile => ({
  platform: SocialPlatform.LINKEDIN,
  url: '',
});

const EmployeeProfessionalDetails: React.FC<EmployeeProfessionalDetailsProps> = ({
  onSaveComplete,
}) => {
  const { colors } = useTheme();

  const [profile, setProfile] = useState<EmployeeProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    designation: '',
    department: '',
    employmentType: EmploymentType.FULL_TIME,
    joiningDate: '',
    relievingDate: '',
    panNumber: '',
    aadharNumber: '',
    passportNumber: '',
    uanNumber: '',
    skills: [] as string[],
    qualifications: [emptyQualification()] as Qualification[],
    workHistory: [emptyWorkHistory()] as WorkHistory[],
    socialProfiles: [emptySocialProfile()] as SocialProfile[],
  });

  // Skill input buffer
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    fetchEmployeeProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        designation: profile.designation || '',
        department: profile.department || '',
        employmentType: profile.employmentType || EmploymentType.FULL_TIME,
        joiningDate: profile.joiningDate || '',
        relievingDate: profile.relievingDate || '',
        panNumber: profile.panNumber || '',
        aadharNumber: profile.aadharNumber || '',
        passportNumber: profile.passportNumber || '',
        uanNumber: profile.uanNumber || '',
        skills: profile.skills?.length ? [...profile.skills] : [],
        qualifications: profile.qualifications?.length
          ? profile.qualifications.map(q => ({ ...q }))
          : [emptyQualification()],
        workHistory: profile.workHistory?.length
          ? profile.workHistory.map(w => ({ ...w }))
          : [emptyWorkHistory()],
        socialProfiles: profile.socialProfiles?.length
          ? profile.socialProfiles.map(s => ({ ...s }))
          : [emptySocialProfile()],
      });
    }
  }, [profile]);

  const fetchEmployeeProfile = async () => {
    try {
      setIsFetching(true);
      const response = await http.get<EmployeeProfileData>('api/employees/profile');

      if (response.data) {
        setProfile(response.data);
      }
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        Toast.show({
          type: 'error',
          text1: 'Failed to Load Employee Profile',
          text2: error?.response?.data?.message || 'Unable to fetch employee details',
        });
      }
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      const payload: Partial<EmployeeProfileData> = {
        ...formData,
        qualifications: formData.qualifications.map(q => ({
          ...q,
          percentage: parseFloat(String(q.percentage)) || 0,
          yearOfPassing: parseInt(String(q.yearOfPassing)) || 0,
        })),
        workHistory: formData.workHistory.map(w => ({
          ...w,
          toDate: w.isCurrent ? null : (w.toDate || null),
        })),
        socialProfiles: formData.socialProfiles.filter(s => s.url.trim() !== ''),
      };

      // Remove relievingDate if not applicable
      if (formData.employmentType === EmploymentType.FULL_TIME || !formData.relievingDate) {
        delete payload.relievingDate;
      }

      await http.post('api/employees/profile', payload);

      Toast.show({
        type: 'success',
        text1: profile ? 'Profile Updated' : 'Profile Created',
        text2: 'Your professional details were saved successfully.',
      });

      await fetchEmployeeProfile();
      setIsEditing(false);
      onSaveComplete?.();

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: profile ? 'Update Failed' : 'Creation Failed',
        text2: error?.response?.data?.message || 'Failed to save profile',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        designation: profile.designation || '',
        department: profile.department || '',
        employmentType: profile.employmentType || EmploymentType.FULL_TIME,
        joiningDate: profile.joiningDate || '',
        relievingDate: profile.relievingDate || '',
        panNumber: profile.panNumber || '',
        aadharNumber: profile.aadharNumber || '',
        passportNumber: profile.passportNumber || '',
        uanNumber: profile.uanNumber || '',
        skills: profile.skills?.length ? [...profile.skills] : [],
        qualifications: profile.qualifications?.length
          ? profile.qualifications.map(q => ({ ...q }))
          : [emptyQualification()],
        workHistory: profile.workHistory?.length
          ? profile.workHistory.map(w => ({ ...w }))
          : [emptyWorkHistory()],
        socialProfiles: profile.socialProfiles?.length
          ? profile.socialProfiles.map(s => ({ ...s }))
          : [emptySocialProfile()],
      });
    } else {
      setFormData({
        designation: '',
        department: '',
        employmentType: EmploymentType.FULL_TIME,
        joiningDate: '',
        relievingDate: '',
        panNumber: '',
        aadharNumber: '',
        passportNumber: '',
        uanNumber: '',
        skills: [],
        qualifications: [emptyQualification()],
        workHistory: [emptyWorkHistory()],
        socialProfiles: [emptySocialProfile()],
      });
    }
    setSkillInput('');
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatEmploymentType = (type: EmploymentType) => {
    switch (type) {
      case EmploymentType.FULL_TIME:
        return 'Full Time';
      case EmploymentType.PART_TIME:
        return 'Part Time';
      case EmploymentType.CONTRACT:
        return 'Contract';
      case EmploymentType.INTERN:
        return 'Intern';
      default:
        return type;
    }
  };

  // ─── Skills helpers ──────────────────────────────────────────────────────────

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (formData.skills.includes(trimmed)) return;
    setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }));
    setSkillInput('');
  };

  const handleRemoveSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  // ─── Qualifications helpers ──────────────────────────────────────────────────

  const handleQualificationChange = (index: number, field: keyof Qualification, value: string) => {
    setFormData(prev => {
      const updated = [...prev.qualifications];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, qualifications: updated };
    });
  };

  const handleAddQualification = () => {
    setFormData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, emptyQualification()],
    }));
  };

  const handleRemoveQualification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index),
    }));
  };

  // ─── WorkHistory helpers ─────────────────────────────────────────────────────

  const handleWorkHistoryChange = (index: number, field: keyof WorkHistory, value: string | boolean) => {
    setFormData(prev => {
      const updated = [...prev.workHistory];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, workHistory: updated };
    });
  };

  const handleAddWorkHistory = () => {
    setFormData(prev => ({
      ...prev,
      workHistory: [...prev.workHistory, emptyWorkHistory()],
    }));
  };

  const handleRemoveWorkHistory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      workHistory: prev.workHistory.filter((_, i) => i !== index),
    }));
  };

  // ─── SocialProfiles helpers ──────────────────────────────────────────────────

  const handleSocialProfileChange = (index: number, field: keyof SocialProfile, value: string) => {
    setFormData(prev => {
      const updated = [...prev.socialProfiles];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, socialProfiles: updated };
    });
  };

  const handleAddSocialProfile = () => {
    setFormData(prev => ({
      ...prev,
      socialProfiles: [...prev.socialProfiles, emptySocialProfile()],
    }));
  };

  const handleRemoveSocialProfile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      socialProfiles: prev.socialProfiles.filter((_, i) => i !== index),
    }));
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  // Loading state
  if (isFetching) {
    return (
      <View className="mt-4">
        <View className="bg-white mx-4 rounded-2xl p-8 items-center justify-center shadow-sm">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text className="font-rubik text-sm text-gray-400 mt-3">
            Loading professional details...
          </Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (!profile && !isEditing) {
    return (
      <View className="mt-4">
        <EmptyState onAddPress={() => setIsEditing(true)} />
      </View>
    );
  }

  return (
    <View className="mt-4">
      <View className="bg-white mx-4 rounded-2xl shadow-sm overflow-hidden">
        {/* Header with Edit/Save buttons */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
          <Text className="font-rubik-medium text-base text-gray-800">
            Professional Details
          </Text>
          {!isEditing ? (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              className="p-2 bg-gray-100 rounded-full"
              activeOpacity={0.7}
            >
              <Icon name="edit-2" size={18} color="#6B7280" />
            </TouchableOpacity>
          ) : (
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleCancelEdit}
                className="px-3 py-1.5 rounded-full border border-gray-200"
                disabled={isLoading}
              >
                <Text className="font-rubik-medium text-sm text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                className="px-3 py-1.5 rounded-full bg-indigo-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="font-rubik-medium text-sm text-white">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isEditing ? (
          // ── Edit Form View ────────────────────────────────────────────────────
          <ScrollView className="p-5" showsVerticalScrollIndicator={false}>

            {/* Employment Section */}
            <Text className="font-rubik-medium text-sm text-gray-700 mb-3">
              Employment Details
            </Text>

            <Input
              label="Designation"
              value={formData.designation}
              onChangeText={(text) => setFormData(prev => ({ ...prev, designation: text }))}
              placeholder="e.g., Software Engineer"
            />

            <Input
              label="Department"
              value={formData.department}
              onChangeText={(text) => setFormData(prev => ({ ...prev, department: text }))}
              placeholder="e.g., Engineering"
            />

            <View className="mb-4">
              <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-2">
                Employment Type
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {Object.values(EmploymentType).map((type) => (
                  <EmploymentTypePill
                    key={type}
                    type={type}
                    selected={formData.employmentType === type}
                    onSelect={() => setFormData(prev => ({ ...prev, employmentType: type }))}
                  />
                ))}
              </View>
            </View>

            <Input
              label="Joining Date"
              value={formData.joiningDate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, joiningDate: text }))}
              placeholder="YYYY-MM-DD"
            />

            {formData.employmentType !== EmploymentType.FULL_TIME && (
              <Input
                label="Relieving Date (if applicable)"
                value={formData.relievingDate}
                onChangeText={(text) => setFormData(prev => ({ ...prev, relievingDate: text }))}
                placeholder="YYYY-MM-DD"
              />
            )}

            <SectionSeparator title="Legal & Identity" />

            <Input
              label="PAN Number"
              value={formData.panNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, panNumber: text }))}
              placeholder="ABCDE1234F"
            />

            <Input
              label="Aadhar Number"
              value={formData.aadharNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, aadharNumber: text }))}
              placeholder="XXXX XXXX XXXX"
              keyboardType="numeric"
            />

            <Input
              label="UAN Number"
              value={formData.uanNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, uanNumber: text }))}
              placeholder="Universal Account Number"
              keyboardType="numeric"
            />

            <Input
              label="Passport Number"
              value={formData.passportNumber}
              onChangeText={(text) => setFormData(prev => ({ ...prev, passportNumber: text }))}
              placeholder="Enter passport number"
            />

            {/* ── Skills ──────────────────────────────────────────────────── */}
            <SectionSeparator title="Skills" />

            <View className="mb-4">
              <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-2">
                Skills
              </Text>
              <View className="flex-row gap-2 mb-2">
                <View className="flex-1">
                  <Input
                    label=""
                    value={skillInput}
                    onChangeText={setSkillInput}
                    placeholder="e.g., React Native"
                    // onSubmitEditing={handleAddSkill}
                    // returnKeyType="done"
                  />
                </View>
                <TouchableOpacity
                  onPress={handleAddSkill}
                  className="px-4 py-2 bg-indigo-500 rounded-xl self-center"
                >
                  <Text className="font-rubik-medium text-sm text-white">Add</Text>
                </TouchableOpacity>
              </View>
              {formData.skills.length > 0 && (
                <View className="flex-row flex-wrap gap-2 mt-1">
                  {formData.skills.map((skill, index) => (
                    <View
                      key={index}
                      className="flex-row items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full"
                    >
                      <Text className="font-rubik-medium text-sm text-indigo-600">{skill}</Text>
                      <TouchableOpacity onPress={() => handleRemoveSkill(index)}>
                        <Icon name="x" size={12} color="#6366F1" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ── Qualifications ───────────────────────────────────────────── */}
            <SectionSeparator title="Qualifications" />

            {formData.qualifications.map((qual, index) => (
              <View
                key={index}
                className="mb-4 p-4 border border-gray-200 rounded-xl bg-gray-50"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="font-rubik-medium text-sm text-gray-700">
                    Qualification {index + 1}
                  </Text>
                  {formData.qualifications.length > 1 && (
                    <TouchableOpacity onPress={() => handleRemoveQualification(index)}>
                      <Icon name="trash-2" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
                <Input
                  label="Degree"
                  value={qual.degree}
                  onChangeText={(text) => handleQualificationChange(index, 'degree', text)}
                  placeholder="e.g., B.Tech"
                />
                <Input
                  label="Institution"
                  value={qual.institution}
                  onChangeText={(text) => handleQualificationChange(index, 'institution', text)}
                  placeholder="e.g., MIT"
                />
                <Input
                  label="Percentage / CGPA"
                  value={String(qual.percentage)}
                  onChangeText={(text) => handleQualificationChange(index, 'percentage', text)}
                  placeholder="e.g., 74.5"
                  // keyboardType="decimal-pad"
                />
                <Input
                  label="Year of Passing"
                  value={String(qual.yearOfPassing)}
                  onChangeText={(text) => handleQualificationChange(index, 'yearOfPassing', text)}
                  placeholder="e.g., 2024"
                  keyboardType="numeric"
                />
              </View>
            ))}

            <TouchableOpacity
              onPress={handleAddQualification}
              className="flex-row items-center justify-center gap-2 py-3 border border-dashed border-indigo-300 rounded-xl mb-4"
            >
              <Icon name="plus" size={16} color="#6366F1" />
              <Text className="font-rubik-medium text-sm text-indigo-600">Add Qualification</Text>
            </TouchableOpacity>

            {/* ── Work History ─────────────────────────────────────────────── */}
            <SectionSeparator title="Work History" />

            {formData.workHistory.map((work, index) => (
              <View
                key={index}
                className="mb-4 p-4 border border-gray-200 rounded-xl bg-gray-50"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="font-rubik-medium text-sm text-gray-700">
                    Work Experience {index + 1}
                  </Text>
                  {formData.workHistory.length > 1 && (
                    <TouchableOpacity onPress={() => handleRemoveWorkHistory(index)}>
                      <Icon name="trash-2" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
                <Input
                  label="Company Name"
                  value={work.companyName}
                  onChangeText={(text) => handleWorkHistoryChange(index, 'companyName', text)}
                  placeholder="e.g., Infosys"
                />
                <Input
                  label="Designation"
                  value={work.designation}
                  onChangeText={(text) => handleWorkHistoryChange(index, 'designation', text)}
                  placeholder="e.g., Software Engineer"
                />
                <Input
                  label="From Date"
                  value={work.fromDate}
                  onChangeText={(text) => handleWorkHistoryChange(index, 'fromDate', text)}
                  placeholder="YYYY-MM-DD"
                />
                {/* Current Job toggle */}
                <TouchableOpacity
                  onPress={() => handleWorkHistoryChange(index, 'isCurrent', !work.isCurrent)}
                  className="flex-row items-center gap-2 mb-3"
                >
                  <View
                    className={`w-5 h-5 rounded border items-center justify-center ${work.isCurrent ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 bg-white'}`}
                  >
                    {work.isCurrent && <Icon name="check" size={12} color="white" />}
                  </View>
                  <Text className="font-rubik text-sm text-gray-600">Currently working here</Text>
                </TouchableOpacity>
                {!work.isCurrent && (
                  <Input
                    label="To Date"
                    value={work.toDate || ''}
                    onChangeText={(text) => handleWorkHistoryChange(index, 'toDate', text)}
                    placeholder="YYYY-MM-DD"
                  />
                )}
                <Input
                  label="Responsibilities"
                  value={work.responsibilities}
                  onChangeText={(text) => handleWorkHistoryChange(index, 'responsibilities', text)}
                  placeholder="Briefly describe your role..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            ))}

            <TouchableOpacity
              onPress={handleAddWorkHistory}
              className="flex-row items-center justify-center gap-2 py-3 border border-dashed border-indigo-300 rounded-xl mb-4"
            >
              <Icon name="plus" size={16} color="#6366F1" />
              <Text className="font-rubik-medium text-sm text-indigo-600">Add Work Experience</Text>
            </TouchableOpacity>

            {/* ── Social Profiles ──────────────────────────────────────────── */}
            <SectionSeparator title="Social Profiles" />

            {formData.socialProfiles.map((social, index) => (
              <View
                key={index}
                className="mb-4 p-4 border border-gray-200 rounded-xl bg-gray-50"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="font-rubik-medium text-sm text-gray-700">
                    Profile {index + 1}
                  </Text>
                  {formData.socialProfiles.length > 1 && (
                    <TouchableOpacity onPress={() => handleRemoveSocialProfile(index)}>
                      <Icon name="trash-2" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
                {/* Platform selector */}
                <View className="mb-3">
                  <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-2">
                    Platform
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {Object.values(SocialPlatform).map((platform) => (
                      <TouchableOpacity
                        key={platform}
                        onPress={() => handleSocialProfileChange(index, 'platform', platform)}
                        className={`px-3 py-1.5 rounded-full border ${social.platform === platform
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 bg-white'
                          }`}
                      >
                        <Text
                          className={`font-rubik-medium text-sm ${social.platform === platform
                            ? 'text-indigo-600'
                            : 'text-gray-600'
                            }`}
                        >
                          {platform}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <Input
                  label="Profile URL"
                  value={social.url}
                  onChangeText={(text) => handleSocialProfileChange(index, 'url', text)}
                  placeholder="https://"
                  // keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
            ))}

            <TouchableOpacity
              onPress={handleAddSocialProfile}
              className="flex-row items-center justify-center gap-2 py-3 border border-dashed border-indigo-300 rounded-xl mb-4"
            >
              <Icon name="plus" size={16} color="#6366F1" />
              <Text className="font-rubik-medium text-sm text-indigo-600">Add Social Profile</Text>
            </TouchableOpacity>

          </ScrollView>
        ) : (
          // ── Display View ──────────────────────────────────────────────────────
          <View className="p-5">
            {/* Employment Section */}
            <Text className="font-rubik-medium text-sm text-gray-700 mb-2">
              Employment Details
            </Text>
            <View className="mb-4">
              <InfoRow label="Designation" value={profile?.designation || ''} />
              <InfoRow label="Department" value={profile?.department || ''} />
              <InfoRow
                label="Employment Type"
                value={formatEmploymentType(profile?.employmentType || EmploymentType.FULL_TIME)}
              />
              <InfoRow label="Joining Date" value={formatDate(profile?.joiningDate || '')} />
              {profile?.relievingDate && (
                <InfoRow label="Relieving Date" value={formatDate(profile.relievingDate)} />
              )}
            </View>

            <SectionSeparator title="Legal & Identity" />

            <View className="mb-4">
              <InfoRow label="PAN Number" value={profile?.panNumber || ''} />
              <InfoRow label="Aadhar Number" value={profile?.aadharNumber || ''} />
              <InfoRow label="UAN Number" value={profile?.uanNumber || ''} />
              <InfoRow label="Passport Number" value={profile?.passportNumber || ''} />
            </View>

            {/* Skills */}
            {profile?.skills && profile.skills.length > 0 && (
              <>
                <SectionSeparator title="Skills" />
                <View className="flex-row flex-wrap gap-2 py-2 mb-2">
                  {profile.skills.map((skill, index) => (
                    <View
                      key={index}
                      className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full"
                    >
                      <Text className="font-rubik-medium text-sm text-indigo-600">{skill}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Qualifications */}
            {profile?.qualifications && profile.qualifications.length > 0 && (
              <>
                <SectionSeparator title="Qualifications" />
                {profile.qualifications.map((qual, index) => (
                  <View key={index} className="mb-3 p-3 bg-gray-50 rounded-xl">
                    <Text className="font-rubik-medium text-sm text-gray-800 mb-1">
                      {qual.degree || 'Degree not provided'}
                    </Text>
                    <Text className="font-rubik text-sm text-gray-500">{qual.institution}</Text>
                    <View className="flex-row gap-4 mt-1">
                      <Text className="font-rubik text-xs text-gray-400">
                        {qual.percentage ? `${qual.percentage}%` : ''}
                      </Text>
                      <Text className="font-rubik text-xs text-gray-400">
                        {qual.yearOfPassing ? `Batch of ${qual.yearOfPassing}` : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Work History */}
            {profile?.workHistory && profile.workHistory.length > 0 && (
              <>
                <SectionSeparator title="Work History" />
                {profile.workHistory.map((work, index) => (
                  <View key={index} className="mb-3 p-3 bg-gray-50 rounded-xl">
                    <View className="flex-row items-center justify-between mb-0.5">
                      <Text className="font-rubik-medium text-sm text-gray-800">
                        {work.designation || 'Designation not provided'}
                      </Text>
                      {work.isCurrent && (
                        <View className="px-2 py-0.5 bg-green-50 border border-green-200 rounded-full">
                          <Text className="font-rubik text-xs text-green-600">Current</Text>
                        </View>
                      )}
                    </View>
                    <Text className="font-rubik text-sm text-gray-500">{work.companyName}</Text>
                    <Text className="font-rubik text-xs text-gray-400 mt-1">
                      {formatDate(work.fromDate)}
                      {work.isCurrent ? ' – Present' : work.toDate ? ` – ${formatDate(work.toDate)}` : ''}
                    </Text>
                    {work.responsibilities ? (
                      <Text className="font-rubik text-xs text-gray-500 mt-1" numberOfLines={2}>
                        {work.responsibilities}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </>
            )}

            {/* Social Profiles */}
            {profile?.socialProfiles && profile.socialProfiles.length > 0 && (
              <>
                <SectionSeparator title="Social Profiles" />
                {profile.socialProfiles.map((social, index) => (
                  <View key={index} className="py-2 flex-row items-center gap-3">
                    <View className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                      <Text className="font-rubik-medium text-xs text-indigo-600">
                        {social.platform}
                      </Text>
                    </View>
                    <Text
                      className="font-rubik text-sm text-indigo-500 flex-1"
                      numberOfLines={1}
                    >
                      {social.url || 'URL not provided'}
                    </Text>
                  </View>
                ))}
              </>
            )}

          </View>
        )}
      </View>
    </View>
  );
};

export default EmployeeProfessionalDetails;