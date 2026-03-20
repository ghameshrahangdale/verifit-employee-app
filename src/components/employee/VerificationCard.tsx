// VerificationCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { isEmployee, ROLES } from '../../constants/roles';
import { formatDate, getEmploymentTypeLabel, getStatusConfig } from '../../utils/verificationHelpers';

interface VerificationRequest {
  candidate: any;
  verificationRequestId: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'DISCREPANCIES';
  requestedAt: string;
  employmentRecordId: string;
  companyName: string;
  designation: string;
  employmentType: string;
  startDate: string;
  endDate?: string;
  hrEmail: string;
  comments?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  documentName?: string;
  documentNumber?: string;
  fileSize?: string;
}

interface VerificationCardProps {
  item: VerificationRequest;
  userRole?: string;
  onPreview: (item: VerificationRequest) => void;
  onReview?: (item: VerificationRequest) => void;
  onEdit?: (item: VerificationRequest) => void;
  onDelete?: (id: string) => void;
  onResubmit?: (item: VerificationRequest) => void;
}

const VerificationCard: React.FC<VerificationCardProps> = ({
  item,
  userRole,
  onPreview,
  onReview,
  onEdit,
  onDelete,
  onResubmit,
}) => {
  const { colors } = useTheme();
  const statusConfig = getStatusConfig(item.status);
  const canEdit = item.status === 'PENDING' || item.status === 'DISCREPANCIES';
  const canDelete = item.status !== 'VERIFIED' && item.status !== 'DISCREPANCIES' && isEmployee(userRole);

  return (
    <View className="bg-white rounded-2xl mx-4 mb-3 p-4 shadow-sm border border-gray-100">
      {/* Header: Company + Status */}
      <View className="flex-row items-start">
        <View
          className="w-12 h-12 rounded-xl items-center justify-center"
          style={{ backgroundColor: colors.primary + '15' }}
        >
          <Feather name="briefcase" size={22} color={colors.primary} />
        </View>

        <View className="flex-1 ml-3">
          <Text className="font-rubik-bold text-base text-gray-900">
            {item.companyName}
          </Text>
        </View>

        {/* Status Badge */}
        <View className={`px-2.5 py-1.5 rounded-full flex-row items-center ${statusConfig.bg} border ${statusConfig.border}`}>
          <Feather name={statusConfig.icon} size={10} color={statusConfig.text.replace('text-', '#')} />
          <Text className={`font-rubik-medium text-xs ml-1 ${statusConfig.text}`}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Candidate Info Section - Only show for non-employees */}
      {userRole && !isEmployee(userRole) && (
        <View className="bg-blue-50/30 px-3 py-2 rounded-xl border border-blue-100/50 mt-3">
          <Text className="font-rubik-medium text-xs text-gray-500 mb-1.5">Candidate Details</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="flex-1">
                <Text className="font-rubik-medium text-xs text-gray-900">
                  {item.candidate?.name || 'N/A'}
                </Text>
                <Text className="font-rubik text-[10px] text-gray-500">
                  {item.candidate?.email || 'N/A'}
                </Text>
                <Text className="font-rubik text-[10px] text-gray-500">
                  {item.designation}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Employment Details */}
      <View className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
        {/* Employment Type */}
        <View className="flex-row justify-between mb-2">
          <View className="flex-row items-center">
            <Feather name="users" size={12} color="#64748B" />
            <Text className="font-rubik-medium text-xs text-gray-600 ml-1.5">
              {getEmploymentTypeLabel(item.employmentType)}
            </Text>
          </View>
        </View>

        {/* Dates */}
        <View className="flex-row justify-between">
          <View className="flex-row items-center">
            <Feather name="calendar" size={12} color="#64748B" />
            <Text className="font-rubik text-xs text-gray-500 ml-1.5">
              Start: {formatDate(item.startDate)}
            </Text>
          </View>
          {item.endDate && (
            <View className="flex-row items-center">
              <Feather name="calendar" size={12} color="#64748B" />
              <Text className="font-rubik text-xs text-gray-500 ml-1.5">
                End: {formatDate(item.endDate)}
              </Text>
            </View>
          )}
        </View>

        {/* HR Email */}
        {item.hrEmail && (
          <View className="mt-2 pt-2 border-t border-gray-200">
            <Text className="font-rubik text-xs text-gray-400">HR Contact</Text>
            <Text className="font-rubik-medium text-xs text-gray-700 mt-0.5">
              {item.hrEmail}
            </Text>
          </View>
        )}
      </View>

      {/* Request Info */}
      <View className="flex-row items-center mt-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
        <Feather name="clock" size={14} color="#94A3B8" />
        <Text className="font-rubik text-xs text-gray-600 ml-2 flex-1">
          Requested on: {formatDate(item.requestedAt)}
        </Text>
      </View>

      {/* Comments/Feedback - if available */}
      {item.comments && (
        <View className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
          <Text className="font-rubik-medium text-xs text-red-700">
            Feedback: {item.comments}
          </Text>
          {item.status === 'REJECTED' && onResubmit && (
            <TouchableOpacity onPress={() => onResubmit(item)} className="mt-2">
              <Text className="font-rubik-medium text-xs text-red-600">
                Tap to resubmit →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View className="flex-row justify-end items-center mt-4 gap-2">
        {/* Preview/View Button */}
        <TouchableOpacity
          className="flex-row items-center bg-gray-100 px-3.5 py-2 rounded-xl border border-gray-200"
          onPress={() => onPreview(item)}
        >
          <Feather name="eye" size={14} color="#64748B" />
          <Text className="font-rubik-medium text-xs text-gray-600 ml-1.5">
            View
          </Text>
        </TouchableOpacity>

        {/* Review Button - Only for non-employees with PENDING status */}
        {item.status === 'PENDING' && !isEmployee(userRole) && onReview && (
          <TouchableOpacity
            className="flex-row items-center bg-gray-100 px-3.5 py-2 rounded-xl border border-gray-200"
            onPress={() => onReview(item)}
          >
            <Feather name="check-circle" size={14} color="#64748B" />
            <Text className="font-rubik-medium text-xs text-gray-600 ml-1.5">
              Verify
            </Text>
          </TouchableOpacity>
        )}

        {/* Edit Button - Only for employees with editable status */}
        {isEmployee(userRole) && canEdit && onEdit && (
          <TouchableOpacity
            className="flex-row items-center px-3.5 py-2 rounded-xl border"
            style={{
              backgroundColor: colors.primary + '12',
              borderColor: colors.primary + '40'
            }}
            onPress={() => onEdit(item)}
          >
            <Feather name="edit-2" size={14} color={colors.primary} />
            <Text className="font-rubik-medium text-xs ml-1.5" style={{ color: colors.primary }}>
              Edit
            </Text>
          </TouchableOpacity>
        )}

        {/* Delete Button */}
        {canDelete && onDelete && (
          <TouchableOpacity
            className="flex-row items-center bg-red-50 px-3.5 py-2 rounded-xl border border-red-200"
            onPress={() => onDelete(item.verificationRequestId)}
          >
            <Feather name="trash-2" size={14} color="#DC2626" />
            <Text className="font-rubik-medium text-xs text-red-600 ml-1.5">
              Delete
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default VerificationCard;