// components/ReviewField.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Input from './ui/Input';
import { FieldStatus } from '../types';

interface ReviewFieldProps {
  label: string;
  value: string;
  fieldKey: string;
  isLast?: boolean;
  fieldStatus: FieldStatus;
  activeField: string | null;
  onConfirm: (fieldKey: string) => void;
  onReject: (fieldKey: string) => void;
  onSubmitActualValue: (fieldKey: string) => void;
  onCancelInput: (fieldKey: string) => void;
  onActualValueChange: (fieldKey: string, value: string) => void;
}

export const ReviewField: React.FC<ReviewFieldProps> = ({
  label,
  value,
  fieldKey,
  isLast = false,
  fieldStatus,
  activeField,
  onConfirm,
  onReject,
  onSubmitActualValue,
  onCancelInput,
  onActualValueChange,
}) => {
  const status = fieldStatus[fieldKey];
  const isActive = activeField === fieldKey;

  return (
    <View className={`py-3 ${!isLast ? 'border-b border-gray-100' : ''}`}>
      <View className="flex-row items-start">
        <View className="flex-1">
          <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide mb-1">
            {label}
          </Text>
          <Text className="font-rubik-medium text-sm text-gray-800">
            {value}
          </Text>
        </View>

        <View className="flex-row items-center ml-3">
          {status?.confirmed === true ? (
            <View className="bg-green-50 px-3 py-1.5 rounded-full border border-green-200 flex-row items-center">
              <Feather name="check" size={14} color="#040807" />
              <Text className="font-rubik-medium text-xs text-green-700 ml-1">
                Correct
              </Text>
            </View>
          ) : status?.confirmed === false ? (
            <View className="bg-red-50 px-3 py-1.5 rounded-full border border-red-200 flex-row items-center">
              <Feather name="x" size={14} color="#EF4444" />
              <Text className="font-rubik-medium text-xs text-red-700 ml-1">
                Incorrect
              </Text>
            </View>
          ) : (
            !status?.showInput && (
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => onConfirm(fieldKey)}
                  className="w-8 h-8 rounded-lg bg-green-50 border border-green-200 items-center justify-center"
                >
                  <Feather name="check" size={16} color="#10B981" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onReject(fieldKey)}
                  className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 items-center justify-center"
                >
                  <Feather name="x" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )
          )}
        </View>
      </View>

      {status?.showInput && (
        <View className="mt-3 bg-gray-50 rounded-xl p-3">
          <Input
            label='Enter Actual Value'
            value={status.actualValue || ''}
            onChangeText={(text:any) => onActualValueChange(fieldKey, text)}
            placeholder="Enter actual value"
            type="text"
          />

          <View className="flex-row gap-2 mt-2">
            <TouchableOpacity
              onPress={() => onSubmitActualValue(fieldKey)}
              className="flex-1 bg-purple-500 py-2 rounded-lg items-center"
            >
              <Text className="font-rubik-medium text-sm text-white">Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onCancelInput(fieldKey)}
              className="flex-1 bg-gray-200 py-2 rounded-lg items-center"
            >
              <Text className="font-rubik-medium text-sm text-gray-700">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};