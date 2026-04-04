// components/employee/EmployeeWorkHistory.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Input from '../ui/Input';
import Toast from 'react-native-toast-message';
import http from '../../services/http.api';
import Icon from 'react-native-vector-icons/Feather';
import { formatDate } from '../../utils/verificationHelpers';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/AppStackNavigator';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkHistory {
  id?: string;
  employeeId?: string;
  verificationRequestId?: string | null;
  companyName: string;
  designation: string;
  fromDate: string;
  toDate: string | null;
  isCurrent: boolean;
  responsibilities: string;
  verificationStatus?: string | null;
  createdAt?: string;
  updatedAt?: string;
  verificationRequest?: {
    id: string;
    status: string;
    requestedAt: string;
    completedAt: string;
  } | null;
}

export interface VerificationRequest {
  verificationRequestId: string;
  status: string;
  requestedAt: string;
  completedAt: string | null;
  employmentRecordId: string;
  companyName: string;
  designation: string;
  employmentType: string;
  startDate: string;
  endDate: string;
  hrEmail: string | null;
  candidate: {
    employeeId: string;
    name: string;
    email: string;
  };
  organizationId: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Icon button with primary color */
const IconButton = ({
  icon,
  onPress,
  size = 18,
  disabled = false,
  color,
}: {
  icon: string;
  onPress: () => void;
  size?: number;
  disabled?: boolean;
  color?: string;
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className="p-2 rounded-full"
      style={{ backgroundColor: disabled ? '#F3F4F6' : `${colors.primary}0D` }}
      activeOpacity={0.7}
    >
      <Icon name={icon} size={size} color={color || (disabled ? '#9CA3AF' : colors.primary)} />
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
      style={{ backgroundColor: disabled ? '#9CA3AF' : colors.primary }}
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
        backgroundColor: disabled ? '#F3F4F6' : `${colors.primary}0D`,
      }}
      activeOpacity={0.7}
    >
      {icon && <Icon name={icon} size={16} color={disabled ? '#9CA3AF' : colors.primary} />}
      <Text className="font-rubik-medium text-sm" style={{ color: disabled ? '#9CA3AF' : colors.primary }}>
        {title}
      </Text>
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
  return (
    <View className="bg-white mx-4 rounded-2xl p-8 items-center justify-center shadow-sm">
      <Icon name="briefcase" size={48} color="#9CA3AF" />
      <Text className="font-rubik-medium text-base text-gray-700 mt-4 text-center">
        No Work History Added
      </Text>
      <Text className="font-rubik text-sm text-gray-400 mt-1 text-center mb-6">
        Add your work experience to showcase your career journey
      </Text>
      <PrimaryButton title="Add Work Experience" onPress={onAddPress} />
    </View>
  );
};

/** Verified badge — green with checkmark */
const VerifiedBadge = () => (
  <View
    className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
    style={{ backgroundColor: '#DCFCE7' }}
  >
    <Icon name="check" size={10} color="#16A34A" />
    <Text className="font-rubik-medium text-xs" style={{ color: '#16A34A' }}>
      Verified
    </Text>
  </View>
);

/** Current badge — blue/purple pill */
const CurrentBadge = () => (
  <View
    className="flex-row items-center px-2 py-0.5 rounded-full"
    style={{ backgroundColor: '#EDE9FE' }}
  >
    <Text className="font-rubik-medium text-xs" style={{ color: '#7C3AED' }}>
      Current
    </Text>
  </View>
);

/** Generic status badge (Pending / Rejected / etc.) */
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = () => {
    switch (status?.toUpperCase()) {
      case 'VERIFIED':
        return { bg: '#10B981', label: 'Verified', icon: 'check-circle' };
      case 'PENDING':
        return { bg: '#F59E0B', label: 'Pending', icon: 'clock' };
      case 'REJECTED':
        return { bg: '#EF4444', label: 'Rejected', icon: 'x-circle' };
      default:
        return { bg: '#6B7280', label: status || 'Unknown', icon: 'help-circle' };
    }
  };

  const config = getStatusConfig();

  return (
    <View
      className="flex-row items-center gap-1 px-2 py-1 rounded-full"
      style={{ backgroundColor: `${config.bg}15` }}
    >
      <Icon name={config.icon} size={10} color={config.bg} />
      <Text className="font-rubik-medium text-xs" style={{ color: config.bg }}>
        {config.label}
      </Text>
    </View>
  );
};

/** Work History Card — matches the design in the screenshot */
const WorkHistoryCard = ({
  work,
  onEdit,
  onDelete,
  onLinkVerification,
  onViewDetails,
  readOnly = false,
}: {
  work: WorkHistory;
  onEdit: () => void;
  onDelete: () => void;
  onLinkVerification: () => void;
  onViewDetails: () => void;
  readOnly?: boolean;
}) => {
  const { colors } = useTheme();
  const isVerified = work.verificationRequest?.status === 'VERIFIED';
  const showActionButtons = !readOnly && !isVerified;

  return (
    <View className="mb-3 p-4 bg-gray-50 rounded-xl">
      {/* Row 1: Company name + badges + action icons */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1 flex-wrap">
          <Text className="font-rubik-medium text-sm text-gray-800">
            {work.companyName || 'Company not provided'}
          </Text>
          {isVerified && <VerifiedBadge />}
          {work.isCurrent && <CurrentBadge />}
        </View>

        {/* Action icons — only when not verified and not readOnly */}
        {showActionButtons && (
          <View className="flex-row gap-1 ml-2">
            <IconButton icon="edit-2" onPress={onEdit} size={15} />
            <IconButton icon="trash-2" onPress={onDelete} size={15} />
            {/* Link icon only if no verification request linked yet */}
            {!work.verificationRequest && (
              <IconButton icon="link" onPress={onLinkVerification} size={15} />
            )}
          </View>
        )}
      </View>

      {/* Designation */}
      <Text className="font-rubik text-sm text-gray-500 mt-0.5">
        {work.designation || 'Designation not provided'}
      </Text>

      {/* Date range */}
      <Text className="font-rubik text-xs text-gray-400 mt-1">
        {formatDate(work.fromDate)}
        {work.isCurrent ? ' – Present' : work.toDate ? ` – ${formatDate(work.toDate)}` : ''}
      </Text>

      {/* Responsibilities */}
      {!!work.responsibilities && (
        <Text className="font-rubik text-xs text-gray-500 mt-2" numberOfLines={3}>
          {work.responsibilities}
        </Text>
      )}

      {/* Footer: verification linked info + View Details */}
      {work.verificationRequest && (
        <View className="flex-row items-center justify-between mt-3 pt-2 border-t border-gray-200">
          <View className="flex-row items-center gap-1.5">
            <Icon name="shield" size={13} color="#6B7280" />
            <Text className="font-rubik text-xs text-gray-400">
              Verification request linked
              {work.verificationRequest.requestedAt
                ? ` · ${formatDate(work.verificationRequest.requestedAt)}`
                : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onViewDetails}
            className="flex-row items-center gap-1"
            activeOpacity={0.7}
          >
            <Icon name="eye" size={13} color={colors.primary} />
            <Text className="font-rubik-medium text-xs" style={{ color: colors.primary }}>
              View Details
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

/** Work History Form for edit/create mode */
const WorkHistoryForm = ({
  work,
  index,
  onSave,
  onCancel,
  onDelete,
  isLoading,
  isDeleting,
}: {
  work: WorkHistory;
  index: number;
  onSave: (updatedWork: WorkHistory) => void;
  onCancel: () => void;
  onDelete?: () => void;
  isLoading: boolean;
  isDeleting?: boolean;
}) => {
  const { colors } = useTheme();
  const [formData, setFormData] = useState<WorkHistory>({ ...work });

  const handleChange = (field: keyof WorkHistory, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.companyName.trim()) {
      Toast.show({ type: 'error', text1: 'Company Name is required' });
      return;
    }
    if (!formData.designation.trim()) {
      Toast.show({ type: 'error', text1: 'Designation is required' });
      return;
    }
    if (!formData.fromDate) {
      Toast.show({ type: 'error', text1: 'From Date is required' });
      return;
    }
    onSave(formData);
  };

  return (
    <View className="mb-4 p-4 border border-gray-200 rounded-xl bg-gray-50">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-rubik-medium text-sm text-gray-700">
          Work Experience {index + 1}
        </Text>
        {onDelete && (
          <IconButton
            icon="trash-2"
            onPress={onDelete}
            size={16}
            disabled={isDeleting}
          />
        )}
      </View>

      <Input
        label="Company Name *"
        value={formData.companyName}
        onChangeText={(text) => handleChange('companyName', text)}
        placeholder="e.g., Infosys"
      />

      <Input
        label="Designation *"
        value={formData.designation}
        onChangeText={(text) => handleChange('designation', text)}
        placeholder="e.g., Software Engineer"
      />

      <Input
        label="From Date *"
        value={formData.fromDate}
        onChangeText={(text) => handleChange('fromDate', text)}
        placeholder="YYYY-MM-DD"
        type="date"
      />

      {/* Current Job toggle */}
      <TouchableOpacity
        onPress={() => handleChange('isCurrent', !formData.isCurrent)}
        className="flex-row items-center gap-2 mb-3"
      >
        <View
          className="w-5 h-5 rounded border items-center justify-center"
          style={{
            backgroundColor: formData.isCurrent ? colors.primary : '#FFFFFF',
            borderColor: formData.isCurrent ? colors.primary : '#D1D5DB',
          }}
        >
          {formData.isCurrent && <Icon name="check" size={12} color="white" />}
        </View>
        <Text className="font-rubik text-sm text-gray-600">Currently working here</Text>
      </TouchableOpacity>

      {!formData.isCurrent && (
        <Input
          label="To Date"
          value={formData.toDate || ''}
          onChangeText={(text) => handleChange('toDate', text)}
          placeholder="YYYY-MM-DD"
          type="date"
        />
      )}

      <Input
        label="Responsibilities"
        value={formData.responsibilities}
        onChangeText={(text) => handleChange('responsibilities', text)}
        placeholder="Briefly describe your role..."
        multiline
        numberOfLines={3}
      />

      <View className="flex-row gap-2 mt-2">
        <SecondaryButton title="Cancel" onPress={onCancel} disabled={isLoading} />
        <PrimaryButton title="Save" onPress={handleSave} loading={isLoading} />
      </View>
    </View>
  );
};

/** Link Verification Modal */
const LinkVerificationModal = ({
  visible,
  onClose,
  onConfirm,
  workHistory,
  isLoading,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (verificationRequestId: string) => void;
  workHistory: WorkHistory | null;
  isLoading: boolean;
}) => {
  const { colors } = useTheme();
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedRequestId(null);
      fetchVerificationRequests();
    }
  }, [visible]);

  const fetchVerificationRequests = async () => {
    try {
      setIsFetching(true);
      const response = await http.get<{ data: { data: VerificationRequest[] } }>(
        'api/verification/employee/create-request?view=my&page=1&limit=50'
      );
      if (response.data?.data) {
        setVerificationRequests(response.data.data);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Verification Requests',
        text2: error?.response?.data?.message || 'Unable to fetch verification requests',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedRequestId) {
      Toast.show({ type: 'error', text1: 'Please select a verification request' });
      return;
    }
    onConfirm(selectedRequestId);
  };

  const renderVerificationRequest = ({ item }: { item: VerificationRequest }) => {
    const isSelected = selectedRequestId === item.verificationRequestId;

    return (
      <TouchableOpacity
        onPress={() => setSelectedRequestId(item.verificationRequestId)}
        className="p-4 mb-3 rounded-xl border"
        style={{
          borderColor: isSelected ? colors.primary : '#E5E7EB',
          backgroundColor: isSelected ? `${colors.primary}0D` : '#FFFFFF',
        }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="font-rubik-medium text-sm text-gray-800">
              {item.companyName}
            </Text>
            <Text className="font-rubik text-xs text-gray-500 mt-0.5">
              {item.designation}
            </Text>
            <View className="flex-row items-center gap-2 mt-2">
              <Text className="font-rubik text-xs text-gray-400">
                {formatDate(item.startDate)} - {formatDate(item.endDate)}
              </Text>
              <StatusBadge status={item.status} />
            </View>
          </View>
          <View
            className="w-5 h-5 rounded-full border-2 items-center justify-center"
            style={{ borderColor: isSelected ? colors.primary : '#D1D5DB' }}
          >
            {isSelected && (
              <View
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: colors.primary }}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl h-5/6">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
            <Text className="font-rubik-medium text-base text-gray-800">
              Link Verification Request
            </Text>
            <IconButton icon="x" onPress={onClose} size={20} />
          </View>

          <ScrollView className="flex-1 p-5">
            {/* Warning Message */}
            <View className="bg-amber-50 p-4 rounded-xl mb-5 border border-amber-200">
              <View className="flex-row items-center gap-2 mb-2">
                <Icon name="alert-triangle" size={18} color="#D97706" />
                <Text className="font-rubik-medium text-sm text-amber-700">
                  Linking verification to:
                </Text>
              </View>
              <Text className="font-rubik-medium text-base text-gray-800">
                {workHistory?.companyName}
              </Text>
              <Text className="font-rubik text-sm text-gray-600">
                {workHistory?.designation}
              </Text>
              <Text className="font-rubik text-xs text-amber-600 mt-3">
                ⚠️ Once you link a verification request, this cannot be changed.
                Make sure you select the correct request.
              </Text>
            </View>

            <Text className="font-rubik-medium text-sm text-gray-700 mb-3">
              Select Verification Request *
            </Text>

            {isFetching ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="font-rubik text-sm text-gray-400 mt-2">
                  Loading verification requests...
                </Text>
              </View>
            ) : verificationRequests.length === 0 ? (
              <View className="py-8 items-center">
                <Icon name="inbox" size={48} color="#9CA3AF" />
                <Text className="font-rubik text-sm text-gray-400 mt-2 text-center">
                  No verification requests available
                </Text>
                <Text className="font-rubik text-xs text-gray-400 mt-1 text-center">
                  Create a verification request first from the verification section
                </Text>
              </View>
            ) : (
              <FlatList
                data={verificationRequests}
                keyExtractor={(item) => item.verificationRequestId}
                renderItem={renderVerificationRequest}
                scrollEnabled={false}
                className="mb-4"
              />
            )}
          </ScrollView>

          <View className="flex-row gap-3 p-5 border-t border-gray-100">
            <SecondaryButton title="Cancel" onPress={onClose} disabled={isLoading} />
            <PrimaryButton
              title="Link & Confirm"
              onPress={handleConfirm}
              loading={isLoading}
              disabled={!selectedRequestId || isFetching}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface EmployeeWorkHistoryProps {
  onWorkHistoryChange?: (workHistories: WorkHistory[]) => void;
  workHistories?: WorkHistory[];
  autoFetch?: boolean;
  readOnly?: boolean;
}

const emptyWorkHistory = (): WorkHistory => ({
  companyName: '',
  designation: '',
  fromDate: '',
  toDate: null,
  isCurrent: false,
  responsibilities: '',
  verificationStatus: null,
  verificationRequest: null,
});

const EmployeeWorkHistory: React.FC<EmployeeWorkHistoryProps> = ({
  onWorkHistoryChange,
  workHistories: externalWorkHistories,
  autoFetch = true,
  readOnly = false,
}) => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();

  const [workHistories, setWorkHistories] = useState<WorkHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Link verification modal state
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [selectedWorkForLinking, setSelectedWorkForLinking] = useState<WorkHistory | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchWorkHistory = async () => {
    if (!autoFetch) return;

    try {
      setIsFetching(true);
      const response = await http.get<{
        workHistories(workHistories: any): unknown;
        data: { workHistories: WorkHistory[] };
      }>('api/employees/profile');

      const data =
        response.data?.data?.workHistories ??
        (response.data as any)?.workHistories ??
        [];

      setWorkHistories(data);
      onWorkHistoryChange?.(data);
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        Toast.show({
          type: 'error',
          text1: 'Failed to Load Work History',
          text2: error?.response?.data?.message || 'Unable to fetch work history',
        });
      }
    } finally {
      setIsFetching(false);
    }
  };

  // Sync with external work histories
  useEffect(() => {
    if (externalWorkHistories) {
      setWorkHistories(externalWorkHistories);
      setIsFetching(false);
    }
  }, [externalWorkHistories]);

  useEffect(() => {
    if (autoFetch && !externalWorkHistories) {
      fetchWorkHistory();
    }
  }, [autoFetch, externalWorkHistories]);

  // ── Save (create / update) ─────────────────────────────────────────────────

  const saveWorkHistory = async (workHistory: WorkHistory, isNew: boolean) => {
    try {
      setIsLoading(true);

      const payload = {
        companyName: workHistory.companyName,
        designation: workHistory.designation,
        fromDate: workHistory.fromDate,
        toDate: workHistory.isCurrent ? null : (workHistory.toDate || null),
        isCurrent: workHistory.isCurrent,
        responsibilities: workHistory.responsibilities,
      };

      let response;
      if (isNew) {
        response = await http.post('api/employees/work-history', payload);
      } else if (workHistory.id) {
        response = await http.put(`api/employees/work-history/${workHistory.id}`, payload);
      } else {
        response = await http.post('api/employees/work-history', payload);
      }


        Toast.show({
          type: 'success',
          text1: isNew ? 'Work Experience Added' : 'Work Experience Updated',
          text2: 'Your work history has been saved successfully.',
        });

        // FIX: reset editing state BEFORE fetching so UI refreshes cleanly
        setEditingIndex(null);
        setIsAddingNew(false);
        await fetchWorkHistory(); // refresh list
      
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: isNew ? 'Failed to Add' : 'Failed to Update',
        text2: error?.response?.data?.message || 'Unable to save work history',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const deleteWorkHistory = async (workHistory: WorkHistory, index: number) => {
    // No id → local-only entry, just remove from state
    if (!workHistory.id) {
      const updated = workHistories.filter((_, i) => i !== index);
      setWorkHistories(updated);
      onWorkHistoryChange?.(updated);
      if (editingIndex === index) setEditingIndex(null);
      if (isAddingNew && index === workHistories.length - 1) setIsAddingNew(false);
      return;
    }

    try {
      setDeletingId(workHistory.id);
      const response = await http.delete(`api/employees/work-history/${workHistory.id}`);

     
        Toast.show({
          type: 'success',
          text1: 'Work Experience Deleted',
          text2: 'The entry has been removed successfully.',
        });
        await fetchWorkHistory(); // FIX: refresh after delete
      
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Delete',
        text2: error?.response?.data?.message || 'Unable to delete work history',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // FIX: use Alert.alert instead of Toast for confirmation
  const handleDelete = (work: WorkHistory, index: number) => {
    Alert.alert(
      'Delete Work Experience',
      'Are you sure you want to delete this work experience? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWorkHistory(work, index),
        },
      ]
    );
  };

  // ── Link Verification ──────────────────────────────────────────────────────

  const linkVerificationRequest = async (verificationRequestId: string) => {
    if (!selectedWorkForLinking?.id) return;

    try {
      setIsLinking(true);
      const response = await http.post('api/employees/work-history/link-experience', {
        verificationRequestId,
        workHistoryId: selectedWorkForLinking.id,
      });

    
        Toast.show({
          type: 'success',
          text1: 'Verification Linked',
          text2: 'The verification request has been linked successfully.',
        });

        setLinkModalVisible(false);
        setSelectedWorkForLinking(null);
        await fetchWorkHistory(); 
      
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Link',
        text2: error?.response?.data?.message || 'Unable to link verification request',
      });
    } finally {
      setIsLinking(false);
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingIndex(null);
  };

  const handleCancelAdd = () => setIsAddingNew(false);

  const handleSaveNew = async (workHistory: WorkHistory) => {
    await saveWorkHistory(workHistory, true);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setIsAddingNew(false);
  };

  const handleCancelEdit = () => setEditingIndex(null);

  const handleSaveEdit = async (workHistory: WorkHistory) => {
    if (editingIndex !== null) {
      const originalWork = workHistories[editingIndex];
      await saveWorkHistory({ ...workHistory, id: originalWork.id }, false);
    }
  };

  const handleLinkVerification = (work: WorkHistory) => {
    if (work.verificationRequest?.status === 'VERIFIED') {
      Toast.show({
        type: 'info',
        text1: 'Already Verified',
        text2: 'This work experience is already verified.',
      });
      return;
    }
    setSelectedWorkForLinking(work);
    setLinkModalVisible(true);
  };

  const handleViewDetails = (work: WorkHistory) => {
    
    navigation.navigate('ViewVerification', {  verificationId: work.verificationRequest?.id || '' });
    Toast.show({
      type: 'info',
      text1: 'Verification Details',
      text2: `Status: ${work.verificationRequest?.status ?? 'N/A'}`,
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isFetching) {
    return (
      <View className="mt-4">
        <View className="bg-white mx-4 rounded-2xl p-8 items-center justify-center shadow-sm">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text className="font-rubik text-sm text-gray-400 mt-3">
            Loading work history...
          </Text>
        </View>
      </View>
    );
  }

  if (workHistories.length === 0 && !isAddingNew && !readOnly) {
    return (
      <View className="mt-4">
        <EmptyState onAddPress={handleAddNew} />
      </View>
    );
  }

  if (workHistories.length === 0 && readOnly) {
    return (
      <View className="mt-4">
        <View className="bg-white mx-4 rounded-2xl p-8 items-center justify-center shadow-sm">
          <Icon name="briefcase" size={48} color="#9CA3AF" />
          <Text className="font-rubik-medium text-base text-gray-700 mt-4 text-center">
            No Work History
          </Text>
          <Text className="font-rubik text-sm text-gray-400 mt-1 text-center">
            No work experience has been added yet.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View className="mt-4">
        <View className="bg-white mx-4 rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
            <Text className="font-rubik-medium text-base text-gray-800">Work History</Text>
            {!readOnly && !isAddingNew && editingIndex === null && (
              <IconButton icon="plus" onPress={handleAddNew} />
            )}
          </View>

          <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
            {workHistories.map((work, index) => {
              if (editingIndex === index) {
                return (
                  <WorkHistoryForm
                    key={work.id || `edit-${index}`}
                    work={work}
                    index={index}
                    onSave={handleSaveEdit}
                    onCancel={handleCancelEdit}
                    onDelete={() => handleDelete(work, index)}
                    isLoading={isLoading}
                    isDeleting={deletingId === work.id}
                  />
                );
              }

              return (
                <WorkHistoryCard
                  key={work.id || `view-${index}`}
                  work={work}
                  onEdit={() => handleEdit(index)}
                  onDelete={() => handleDelete(work, index)}
                  onLinkVerification={() => handleLinkVerification(work)}
                  onViewDetails={() => handleViewDetails(work)}
                  readOnly={readOnly}
                />
              );
            })}

            {isAddingNew && (
              <WorkHistoryForm
                key="new-form"
                work={emptyWorkHistory()}
                index={workHistories.length}
                onSave={handleSaveNew}
                onCancel={handleCancelAdd}
                isLoading={isLoading}
              />
            )}

            {!readOnly && !isAddingNew && editingIndex === null && workHistories.length > 0 && (
              <AddButton title="Add Work Experience" onPress={handleAddNew} />
            )}
          </ScrollView>
        </View>
      </View>

      <LinkVerificationModal
        visible={linkModalVisible}
        onClose={() => {
          setLinkModalVisible(false);
          setSelectedWorkForLinking(null);
        }}
        onConfirm={linkVerificationRequest}
        workHistory={selectedWorkForLinking}
        isLoading={isLinking}
      />
    </>
  );
};

export default EmployeeWorkHistory;