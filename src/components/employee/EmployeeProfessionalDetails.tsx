// components/employee/EmployeeProfessionalDetails.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
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

/** Reusable badge component with theme colors */
const Badge = ({ label, onRemove }: { label: string; onRemove?: () => void }) => {
  const { colors } = useTheme();
  
  return (
    <View
      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border"
      style={{
        backgroundColor: `${colors.primary}0D`,
        borderColor: `${colors.primary}25`,
      }}
    >
      <Text
        className="font-rubik-medium text-sm"
        style={{ color: colors.primary }}
      >
        {label}
      </Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove}>
          <Icon name="x" size={12} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

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
  const { colors } = useTheme();
  
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
      className={`px-4 py-2 rounded-full border`}
      style={{
        borderColor: selected ? colors.primary : '#E5E7EB',
        backgroundColor: selected ? `${colors.primary}0D` : '#FFFFFF',
      }}
    >
      <Text
        className="font-rubik-medium text-sm"
        style={{ color: selected ? colors.primary : '#4B5563' }}
      >
        {getLabel(type)}
      </Text>
    </TouchableOpacity>
  );
};

/** Primary action button */
const PrimaryButton = ({
  title,
  onPress,
  icon,
  loading = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
}) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className="flex-row items-center justify-center gap-2 px-4 py-2 rounded-xl"
      style={{ backgroundColor: colors.primary }}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          {icon && <Icon name={icon} size={16} color="#FFFFFF" />}
          <Text className="font-rubik-medium text-sm text-white">{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

/** Secondary action button */
const SecondaryButton = ({
  title,
  onPress,
  icon,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  icon?: string;
  disabled?: boolean;
}) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center justify-center gap-2 px-4 py-2 rounded-xl border"
      style={{
        borderColor: colors.primary,
        backgroundColor: `${colors.primary}0D`,
      }}
      activeOpacity={0.7}
    >
      {icon && <Icon name={icon} size={16} color={colors.primary} />}
      <Text className="font-rubik-medium text-sm" style={{ color: colors.primary }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

/** Icon button with primary color */
const IconButton = ({
  icon,
  onPress,
  size = 18,
  disabled = false,
}: {
  icon: string;
  onPress: () => void;
  size?: number;
  disabled?: boolean;
}) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className="p-2 rounded-full"
      style={{ backgroundColor: `${colors.primary}0D` }}
      activeOpacity={0.7}
    >
      <Icon name={icon} size={size} color={colors.primary} />
    </TouchableOpacity>
  );
};

/** Add button for sections */
const AddButton = ({ onPress, title }: { onPress: () => void; title: string }) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-center gap-2 py-3 border border-dashed rounded-xl mb-4"
      style={{
        borderColor: `${colors.primary}25`,
        backgroundColor: `${colors.primary}0D`,
      }}
      activeOpacity={0.7}
    >
      <Icon name="plus" size={16} color={colors.primary} />
      <Text className="font-rubik-medium text-sm" style={{ color: colors.primary }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

/** Empty state component */
const EmptyState = ({ onAddPress }: { onAddPress: () => void }) => {
  const { colors } = useTheme();
  
  return (
    <View className="bg-white mx-4 rounded-2xl p-8 items-center justify-center shadow-sm">
      <Icon name="user" size={48} color="#9CA3AF" />
      <Text className="font-rubik-medium text-base text-gray-700 mt-4 text-center">
        No Professional Details Added
      </Text>
      <Text className="font-rubik text-sm text-gray-400 mt-1 text-center mb-6">
        Add your professional information to complete your profile
      </Text>
      <PrimaryButton title="Add Professional Details" onPress={onAddPress} />
    </View>
  );
};

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
            <IconButton icon="edit-2" onPress={() => setIsEditing(true)} />
          ) : (
            <View className="flex-row gap-2">
              <SecondaryButton
                title="Cancel"
                onPress={handleCancelEdit}
                disabled={isLoading}
              />
              <PrimaryButton
                title="Save"
                onPress={handleSave}
                loading={isLoading}
              />
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
              <View className="flex-row items-end gap-2">
  <View className="flex-1">
    <Input
      label=""
      value={skillInput}
      onChangeText={setSkillInput}
      placeholder="e.g., React Native"
      rightButtonIcon="plus"
      onRightButtonPress={handleAddSkill}
    />
  </View>
</View>
              {formData.skills.length > 0 && (
                <View className="flex-row flex-wrap gap-2 mt-1">
                  {formData.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      label={skill}
                      onRemove={() => handleRemoveSkill(index)}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* ── Qualifications ───────────────────────────────────────────── */}

            <SectionSeparator title="Qualifications" />

            <View className='mb-4' />

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
                    <IconButton
                      icon="trash-2"
                      onPress={() => handleRemoveQualification(index)}
                      size={16}
                    />
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

            <AddButton
              title="Add Qualification"
              onPress={handleAddQualification}
            />

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
                    <IconButton
                      icon="trash-2"
                      onPress={() => handleRemoveWorkHistory(index)}
                      size={16}
                    />
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
                    className={`w-5 h-5 rounded border items-center justify-center`}
                    style={{
                      backgroundColor: work.isCurrent ? colors.primary : '#FFFFFF',
                      borderColor: work.isCurrent ? colors.primary : '#D1D5DB',
                    }}
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

            <AddButton
              title="Add Work Experience"
              onPress={handleAddWorkHistory}
            />

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
                    <IconButton
                      icon="trash-2"
                      onPress={() => handleRemoveSocialProfile(index)}
                      size={16}
                    />
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
                        className="px-3 py-1.5 rounded-full border"
                        style={{
                          borderColor: social.platform === platform ? colors.primary : '#E5E7EB',
                          backgroundColor: social.platform === platform ? `${colors.primary}0D` : '#FFFFFF',
                        }}
                      >
                        <Text
                          className="font-rubik-medium text-sm"
                          style={{
                            color: social.platform === platform ? colors.primary : '#4B5563',
                          }}
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
                  autoCapitalize="none"
                />
              </View>
            ))}

            <AddButton
              title="Add Social Profile"
              onPress={handleAddSocialProfile}
            />

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
                <View className='mt-3 mb-2'>
                  <SectionSeparator title="Skills" />
                </View>
                <View className="flex-row flex-wrap gap-2 py-2 mb-2 mt-2">
                  {profile.skills.map((skill, index) => (
                    <Badge key={index} label={skill} />
                  ))}
                </View>
              </>
            )}

            {/* Qualifications */}
            {profile?.qualifications && profile.qualifications.length > 0 && (
              <>
                <View className='mt-3 mb-2'>
                  <SectionSeparator title="Qualifications" />
                </View>
                {profile.qualifications.map((qual, index) => (
                  <View key={index} className="mb-3 p-3 bg-gray-50 rounded-xl mt-2">
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
                <View className='mt-3 mb-2'>
                  <SectionSeparator title="Work History" />
                </View>
                {profile.workHistory.map((work, index) => (
                  <View key={index} className="mb-3 p-3 bg-gray-50 rounded-xl">
                    <View className="flex-row items-center justify-between mb-0.5">
                      <Text className="font-rubik-medium text-sm text-gray-800">
                        {work.designation || 'Designation not provided'}
                      </Text>
                      {work.isCurrent && (
                        <Badge label="Current" />
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
                <View className="mt-3 mb-2">
                  <SectionSeparator title="Social Profiles" />
                </View>

                {profile.socialProfiles.map((social, index) => (
                  <View
                    key={index}
                    className="py-2 flex-row justify-between items-center gap-3"
                  >
                    <Badge label={social.platform} />

                    {social.url && (
                      <IconButton
                        icon="link"
                        onPress={() => Linking.openURL(social.url)}
                        size={16}
                      />
                    )}
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