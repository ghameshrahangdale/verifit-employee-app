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
  organizationId?: string; // Add organizationId to the interface
}

interface VerificationCardProps {
  item: VerificationRequest;
  userRole?: string;
  onPreview: (item: VerificationRequest) => void;
  onReview?: (item: VerificationRequest) => void;
  onReject?: (item: VerificationRequest) => void;
  onEdit?: (item: VerificationRequest) => void;
  onDelete?: (id: string) => void;
  onResubmit?: (item: VerificationRequest) => void;
}

const VerificationCard: React.FC<VerificationCardProps> = ({
  item,
  userRole,
  onPreview,
  onReview,
  onReject,
  onEdit,
  onDelete,
  onResubmit,
}) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const statusConfig = getStatusConfig(item.status);
  const canEdit = item.status === 'PENDING' || item.status === 'DISCREPANCIES';
  const canDelete = item.status !== 'VERIFIED' && item.status !== 'DISCREPANCIES' && item.status !== 'REJECTED' && isEmployee(userRole);

  // Check if this verification request belongs to the user's organization
  const isSameOrganization = item.organizationId && user?.organizationId === item.organizationId && user?.role === ROLES.ADMIN; 
  

  // Only show reject button for non-employees with PENDING status AND different organization
  const canReject = item.status === 'PENDING' && !isEmployee(userRole) && onReject && !isSameOrganization;

  return (
    <View className="bg-white rounded-2xl mx-4 mb-3 p-4 shadow-sm border border-gray-100">
      {/* Header: HR Email + Company Name */}
      <View className="flex-row items-center">
        <View
          className="w-10 h-10 rounded-lg items-center justify-center"
          style={{ backgroundColor: colors.primary + '15' }}
        >
          <Feather name="briefcase" size={18} color={colors.primary} />
        </View>

        <View className="flex-1 ml-3">
          {/* Show HR Email if available, otherwise show Company Name */}
          {item.hrEmail ? (
            <>
              <Text className="font-rubik-semibold text-sm text-gray-900">
                {item.hrEmail}
              </Text>
              <Text className="font-rubik text-xs text-gray-500 mt-0.5">
                {item.companyName}
              </Text>
            </>
          ) : (
            <Text className="font-rubik-semibold text-sm text-gray-900">
              {item.companyName}
            </Text>
          )}
        </View>

        {/* Status Badge */}
        <View className={`px-2.5 py-1.5 rounded-full flex-row items-center ${statusConfig.bg} border ${statusConfig.border}`}>
          <Feather name={statusConfig.icon} size={10} color={statusConfig.text.replace('text-', '#')} />
          <Text className={`font-rubik-medium text-xs ml-1 ${statusConfig.text}`}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Employee Details Section - Combined for all users */}
      <View className="bg-blue-50/30 px-3 py-2.5 rounded-xl border border-blue-100/50 mt-3">
        <Text className="font-rubik-medium text-xs text-gray-500 mb-2">Employee Details</Text>

        {/* Name */}
        <View className="flex-row items-center mb-1.5">
          <Feather name="user" size={12} color="#64748B" />
          <Text className="font-rubik-medium text-xs text-gray-900 ml-2 flex-1">
            {item.candidate?.name || 'N/A'}
          </Text>
        </View>

        {/* Email */}
        <View className="flex-row items-center mb-1.5">
          <Feather name="mail" size={12} color="#64748B" />
          <Text className="font-rubik text-xs text-gray-500 ml-2 flex-1">
            {item.candidate?.email || 'N/A'}
          </Text>
        </View>

        {/* Designation */}
        <View className="flex-row items-center mb-1.5">
          <Feather name="briefcase" size={12} color="#64748B" />
          <Text className="font-rubik text-xs text-gray-500 ml-2 flex-1">
            {item.designation}
          </Text>
        </View>

        {/* Employment Type */}
        <View className="flex-row items-center mb-1.5">
          <Feather name="users" size={12} color="#64748B" />
          <Text className="font-rubik-medium text-xs text-gray-600 ml-2">
            {getEmploymentTypeLabel(item.employmentType)}
          </Text>
        </View>

        {/* Duration */}
        <View className="flex-row items-center mt-1.5">
          <Feather name="clock" size={12} color="#64748B" />
          <Text className="font-rubik text-xs text-gray-500 ml-2">
            Period: {formatDate(item.startDate)} - {item.endDate ? formatDate(item.endDate) : 'Present'}
          </Text>
        </View>
      </View>

      {/* Request Info */}
      <View className="flex-row items-center mt-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
        <Feather name="clock" size={14} color="#94A3B8" />
        <Text className="font-rubik text-xs text-gray-600 ml-2 flex-1">
          Requested on: {formatDate(item.requestedAt)}
        </Text>
      </View>

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

        {/* Review Button - Only for non-employees with PENDING status AND different organization */}
        {item.status === 'PENDING' && !isEmployee(userRole) && onReview && !isSameOrganization && (
          <TouchableOpacity
            className="flex-row items-center bg-green-50 px-3.5 py-2 rounded-xl border border-green-200"
            onPress={() => onReview(item)}
          >
            <Feather name="check-circle" size={14} color="#059669" />
            <Text className="font-rubik-medium text-xs text-green-600 ml-1.5">
              Verify
            </Text>
          </TouchableOpacity>
        )}

        {/* Reject Button - Only for non-employees with PENDING status AND different organization */}
        {item.status === 'PENDING' && !isEmployee(userRole) && onReject && !isSameOrganization && (
          <TouchableOpacity
            className="flex-row items-center bg-red-50 px-3.5 py-2 rounded-xl border border-red-200"
            onPress={() => onReject(item)}
          >
            <Feather name="x-circle" size={14} color="rgb(220, 38, 38)" />
            <Text className="font-rubik-medium text-xs text-red-600 ml-1.5">
              Reject
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