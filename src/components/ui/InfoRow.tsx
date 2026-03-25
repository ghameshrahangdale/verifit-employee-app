// components/ui/InfoRow.tsx
import React from 'react';
import { View, Text } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

interface InfoRowProps {
  label: string;
  value: string | React.ReactNode;
  icon?: string;
  confirmed?: boolean;
  isConfirmed?: boolean;
  renderValue?: () => React.ReactNode;
}

export const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
  icon,
  confirmed,
  isConfirmed,
  renderValue,
}) => {
  const isConfirmedStatus = confirmed ?? isConfirmed;
  
  const renderStatusBadge = () => {
    if (isConfirmedStatus === undefined) return null;
    
    if (!isConfirmedStatus) {
      return (
        <View className="bg-red-100 px-2 py-1 rounded-full border border-red-300">
          <View className="flex-row items-center">
            <Feather name="alert-triangle" size={12} color="#DC2626" />
            <Text className="font-rubik-medium text-xs text-red-700 ml-1">
              Incorrect
            </Text>
          </View>
        </View>
      );
    }
    
    return (
      <View className="bg-green-100 px-2 py-1 rounded-full border border-green-300">
        <View className="flex-row items-center">
          <Feather name="check-circle" size={12} color="#059669" />
          <Text className="font-rubik-medium text-xs text-green-700 ml-1">
            Correct
          </Text>
        </View>
      </View>
    );
  };
  
  return (
    <View>
      <View className="flex-row items-center justify-between mb-1">
        <Text className="font-rubik text-xs text-gray-400 uppercase tracking-wide">
          {label}
        </Text>
        {renderStatusBadge()}
      </View>
      <View className="flex-row items-center">
        {icon && (
          <Feather name={icon} size={14} color="#64748B" />
        )}
        <View className={icon ? "ml-2 flex-1" : "flex-1"}>
          {renderValue ? renderValue() : (
            <Text className="font-rubik-medium text-base text-gray-900">
              {value}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};