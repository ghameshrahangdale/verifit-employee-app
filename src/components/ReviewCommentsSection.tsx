// components/ReviewCommentsSection.tsx
import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

interface ReviewCommentsSectionProps {
  comments: string;
  isExpanded: boolean;
  onToggle: () => void;
  onCommentsChange: (text: string) => void;
}

export const ReviewCommentsSection: React.FC<ReviewCommentsSectionProps> = ({
  comments,
  isExpanded,
  onToggle,
  onCommentsChange,
}) => {
  return (
    <View className="bg-white rounded-2xl mx-4 mt-4 p-5 shadow-sm border border-gray-100">
      <TouchableOpacity
        onPress={onToggle}
        className="flex-row items-center justify-between"
      >
        <Text className="font-rubik-bold text-base text-gray-800">
          Review Comments
        </Text>
        <Feather
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#64748B"
        />
      </TouchableOpacity>

      {isExpanded && (
        <View className="mt-4">
          <TextInput
            className="bg-gray-50 rounded-xl p-4 text-gray-800 font-rubik text-sm border border-gray-200"
            placeholder="Add your review comments here..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={comments}
            onChangeText={onCommentsChange}
          />
        </View>
      )}
    </View>
  );
};