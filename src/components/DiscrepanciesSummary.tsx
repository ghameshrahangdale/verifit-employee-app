// components/DiscrepanciesSummary.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Discrepancy } from '../types';

interface DiscrepanciesSummaryProps {
  discrepancies: Discrepancy[];
}

export const DiscrepanciesSummary: React.FC<DiscrepanciesSummaryProps> = ({
  discrepancies,
}) => {
  if (discrepancies.length === 0) return null;

  return (
    <View className="bg-white rounded-2xl mx-4 mt-4 p-5 shadow-sm border border-gray-100">
      <Text className="font-rubik-bold text-base text-gray-800 mb-3">
        Discrepancies Found ({discrepancies.length})
      </Text>
      {discrepancies.map((disc, index) => (
        <View key={index} className="bg-red-50 rounded-xl p-3 mb-2 last:mb-0 border border-red-200">
          <Text className="font-rubik-bold text-xs text-red-700 mb-1">
            {disc.fieldName}
          </Text>
          <View className="flex-row">
            <View className="flex-1">
              <Text className="font-rubik text-xs text-red-500">Claimed:</Text>
              <Text className="font-rubik-medium text-xs text-red-700">{disc.employeeClaimedValue}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-rubik text-xs text-red-500">Actual:</Text>
              <Text className="font-rubik-medium text-xs text-red-700">{disc.actualValue}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};