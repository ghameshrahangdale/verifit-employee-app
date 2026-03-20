// components/EmploymentSection.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { ReviewField } from './ReviewField';
import { EmploymentRecord, FieldStatus } from '../types';
import { formatDate, getEmploymentTypeLabel } from '../utils/verificationHelpers';

interface EmploymentSectionProps {
  employmentRecord: EmploymentRecord;
  isExpanded: boolean;
  onToggle: () => void;
  fieldStatus: FieldStatus;
  activeField: string | null;
  onConfirm: (fieldKey: string) => void;
  onReject: (fieldKey: string) => void;
  onSubmitActualValue: (fieldKey: string) => void;
  onCancelInput: (fieldKey: string) => void;
  onActualValueChange: (fieldKey: string, value: string) => void;
}

export const EmploymentSection: React.FC<EmploymentSectionProps> = ({
  employmentRecord,
  isExpanded,
  onToggle,
  fieldStatus,
  activeField,
  onConfirm,
  onReject,
  onSubmitActualValue,
  onCancelInput,
  onActualValueChange,
}) => {
  return (
    <View className="bg-white rounded-2xl mx-4 mt-4 p-5 shadow-sm border border-gray-100">
      <TouchableOpacity
        onPress={onToggle}
        className="flex-row items-center justify-between"
      >
        <Text className="font-rubik-bold text-base text-gray-800">
          Employment Details
        </Text>
        <Feather
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#64748B"
        />
      </TouchableOpacity>

      {isExpanded && (
        <View className="mt-2">
          <ReviewField
            label="Company"
            value={employmentRecord.companyName}
            fieldKey="company_name"
            fieldStatus={fieldStatus}
            activeField={activeField}
            onConfirm={onConfirm}
            onReject={onReject}
            onSubmitActualValue={onSubmitActualValue}
            onCancelInput={onCancelInput}
            onActualValueChange={onActualValueChange}
          />
          <ReviewField
            label="Designation"
            value={employmentRecord.designation}
            fieldKey="designation"
            fieldStatus={fieldStatus}
            activeField={activeField}
            onConfirm={onConfirm}
            onReject={onReject}
            onSubmitActualValue={onSubmitActualValue}
            onCancelInput={onCancelInput}
            onActualValueChange={onActualValueChange}
          />
          <ReviewField
            label="Department"
            value={employmentRecord.department}
            fieldKey="department"
            fieldStatus={fieldStatus}
            activeField={activeField}
            onConfirm={onConfirm}
            onReject={onReject}
            onSubmitActualValue={onSubmitActualValue}
            onCancelInput={onCancelInput}
            onActualValueChange={onActualValueChange}
          />
          <ReviewField
            label="Employment Type"
            value={getEmploymentTypeLabel(employmentRecord.employmentType)}
            fieldKey="employment_type"
            fieldStatus={fieldStatus}
            activeField={activeField}
            onConfirm={onConfirm}
            onReject={onReject}
            onSubmitActualValue={onSubmitActualValue}
            onCancelInput={onCancelInput}
            onActualValueChange={onActualValueChange}
          />
          <ReviewField
            label="Start Date"
            value={formatDate(employmentRecord.startDate)}
            fieldKey="start_date"
            fieldStatus={fieldStatus}
            activeField={activeField}
            onConfirm={onConfirm}
            onReject={onReject}
            onSubmitActualValue={onSubmitActualValue}
            onCancelInput={onCancelInput}
            onActualValueChange={onActualValueChange}
          />
          <ReviewField
            label="End Date"
            value={formatDate(employmentRecord.endDate)}
            fieldKey="end_date"
            fieldStatus={fieldStatus}
            activeField={activeField}
            onConfirm={onConfirm}
            onReject={onReject}
            onSubmitActualValue={onSubmitActualValue}
            onCancelInput={onCancelInput}
            onActualValueChange={onActualValueChange}
          />
          <ReviewField
            label="Location"
            value={employmentRecord.location}
            fieldKey="location"
            fieldStatus={fieldStatus}
            activeField={activeField}
            onConfirm={onConfirm}
            onReject={onReject}
            onSubmitActualValue={onSubmitActualValue}
            onCancelInput={onCancelInput}
            onActualValueChange={onActualValueChange}
          />
          {employmentRecord.reasonForLeaving && (
            <ReviewField
              label="Reason for Leaving"
              value={employmentRecord.reasonForLeaving}
              fieldKey="reason_for_leaving"
              fieldStatus={fieldStatus}
              activeField={activeField}
              onConfirm={onConfirm}
              onReject={onReject}
              onSubmitActualValue={onSubmitActualValue}
              onCancelInput={onCancelInput}
              onActualValueChange={onActualValueChange}
            />
          )}
        </View>
      )}
    </View>
  );
};