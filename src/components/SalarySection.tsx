// components/SalarySection.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { ReviewField } from './ReviewField';
import { FieldStatus, SalaryRecord } from '../types';
import { getCurrencySymbol, getSalaryTypeLabel } from '../utils/verificationHelpers';


interface SalarySectionProps {
  salaryRecords: SalaryRecord[];
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

export const SalarySection: React.FC<SalarySectionProps> = ({
  salaryRecords,
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
  if (salaryRecords.length === 0) return null;

  return (
    <View className="bg-white rounded-2xl mx-4 mt-4 p-5 shadow-sm border border-gray-100">
      <TouchableOpacity
        onPress={onToggle}
        className="flex-row items-center justify-between"
      >
        <Text className="font-rubik-bold text-base text-gray-800">
          Salary Records ({salaryRecords.length})
        </Text>
        <Feather
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#64748B"
        />
      </TouchableOpacity>

      {isExpanded && (
        <View className="mt-2">
          {salaryRecords.map((salary, index) => (
            <View key={salary.id} className="mb-4 last:mb-0">
              <Text className="font-rubik-medium text-sm text-gray-600 mb-2">
                Salary {index + 1}
              </Text>
              <ReviewField
                label="Salary Type"
                value={getSalaryTypeLabel(salary.salaryType)}
                fieldKey={`salary_${index}_type`}
                fieldStatus={fieldStatus}
                activeField={activeField}
                onConfirm={onConfirm}
                onReject={onReject}
                onSubmitActualValue={onSubmitActualValue}
                onCancelInput={onCancelInput}
                onActualValueChange={onActualValueChange}
              />
              <ReviewField
                label="Amount"
                value={`${getCurrencySymbol(salary.currency)}${parseFloat(salary.amount).toLocaleString()}`}
                fieldKey={`salary_${index}_amount`}
                fieldStatus={fieldStatus}
                activeField={activeField}
                onConfirm={onConfirm}
                onReject={onReject}
                onSubmitActualValue={onSubmitActualValue}
                onCancelInput={onCancelInput}
                onActualValueChange={onActualValueChange}
              />
              <ReviewField
                label="Frequency"
                value={salary.frequency}
                fieldKey={`salary_${index}_frequency`}
                fieldStatus={fieldStatus}
                activeField={activeField}
                onConfirm={onConfirm}
                onReject={onReject}
                onSubmitActualValue={onSubmitActualValue}
                onCancelInput={onCancelInput}
                onActualValueChange={onActualValueChange}
              />
              {salary.bonusAmount && (
                <ReviewField
                  label="Bonus"
                  value={`${getCurrencySymbol(salary.currency)}${salary.bonusAmount}`}
                  fieldKey={`salary_${index}_bonus`}
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
          ))}
        </View>
      )}
    </View>
  );
};