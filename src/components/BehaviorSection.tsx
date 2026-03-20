// components/BehaviorSection.tsx
import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { ReviewData } from '../types'; 

interface BehaviorSectionProps {
  reviewData: ReviewData;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateBehavior: (updates: Partial<ReviewData['behaviorReport']>) => void;
  colors: any;
}

export const BehaviorSection: React.FC<BehaviorSectionProps> = ({
  reviewData,
  isExpanded,
  onToggle,
  onUpdateBehavior,
  colors,
}) => {
  const behaviorReport = reviewData.behaviorReport;

  const RatingStars = ({ rating, onStarPress }: { rating: number; onStarPress: (star: number) => void }) => (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onStarPress(star)}
          className="mr-2"
        >
          <Feather
            name={star <= rating ? "star" : "star"}
            size={24}
            color={star <= rating ? "#FBBF24" : "#D1D5DB"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const ToggleOption = ({ 
    label, 
    value, 
    onToggle, 
    icon, 
    trueColor 
  }: { 
    label: string; 
    value: boolean; 
    onToggle: () => void; 
    icon: string; 
    trueColor: string;
  }) => (
    <TouchableOpacity
      onPress={onToggle}
      className="flex-row items-center justify-between py-2"
    >
      <View className="flex-row items-center flex-1">
        <Feather
          name={icon}
          size={16}
          color={value ? trueColor : "#94A3B8"}
        />
        <Text className="font-rubik text-sm text-gray-600 ml-2">
          {label}
        </Text>
      </View>
      <View className={`w-6 h-6 rounded-full border-2 ${
        value 
          ? `bg-${trueColor === "#EF4444" ? 'red' : 'green'}-500 border-${trueColor === "#EF4444" ? 'red' : 'green'}-500`
          : 'border-gray-300'
      } items-center justify-center`}>
        {value && (
          <Feather name="check" size={16} color="white" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="bg-white rounded-2xl mx-4 mt-4 p-5 shadow-sm border border-gray-100">
      <TouchableOpacity
        onPress={onToggle}
        className="flex-row items-center justify-between"
      >
        <Text className="font-rubik-bold text-base text-gray-800">
          Behavior & Performance Review
        </Text>
        <Feather
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#64748B"
        />
      </TouchableOpacity>

      {isExpanded && (
        <View className="mt-4">
          <View className="gap-4">
            {/* Teamwork Rating */}
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Feather name="users" size={16} color={colors.primary} />
                  <Text className="font-rubik-medium text-sm text-gray-700 ml-2">
                    Teamwork
                  </Text>
                </View>
                <Text className="font-rubik-bold text-sm text-primary-600">
                  {behaviorReport.teamworkRating}/5
                </Text>
              </View>
              <RatingStars 
                rating={behaviorReport.teamworkRating}
                onStarPress={(star) => onUpdateBehavior({ teamworkRating: star })}
              />
            </View>

            {/* Leadership Rating */}
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Feather name="star" size={16} color={colors.primary} />
                  <Text className="font-rubik-medium text-sm text-gray-700 ml-2">
                    Leadership
                  </Text>
                </View>
                <Text className="font-rubik-bold text-sm text-primary-600">
                  {behaviorReport.leadershipRating}/5
                </Text>
              </View>
              <RatingStars 
                rating={behaviorReport.leadershipRating}
                onStarPress={(star) => onUpdateBehavior({ leadershipRating: star })}
              />
            </View>

            {/* Communication Rating */}
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Feather name="message-square" size={16} color={colors.primary} />
                  <Text className="font-rubik-medium text-sm text-gray-700 ml-2">
                    Communication
                  </Text>
                </View>
                <Text className="font-rubik-bold text-sm text-primary-600">
                  {behaviorReport.communicationRating}/5
                </Text>
              </View>
              <RatingStars 
                rating={behaviorReport.communicationRating}
                onStarPress={(star) => onUpdateBehavior({ communicationRating: star })}
              />
            </View>

            {/* Integrity Rating */}
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Feather name="shield" size={16} color={colors.primary} />
                  <Text className="font-rubik-medium text-sm text-gray-700 ml-2">
                    Integrity
                  </Text>
                </View>
                <Text className="font-rubik-bold text-sm text-primary-600">
                  {behaviorReport.integrityRating}/5
                </Text>
              </View>
              <RatingStars 
                rating={behaviorReport.integrityRating}
                onStarPress={(star) => onUpdateBehavior({ integrityRating: star })}
              />
            </View>

            {/* Performance Rating */}
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Feather name="trending-up" size={16} color={colors.primary} />
                  <Text className="font-rubik-medium text-sm text-gray-700 ml-2">
                    Performance
                  </Text>
                </View>
                <Text className="font-rubik-bold text-sm text-primary-600">
                  {behaviorReport.performanceRating}/5
                </Text>
              </View>
              <RatingStars 
                rating={behaviorReport.performanceRating}
                onStarPress={(star) => onUpdateBehavior({ performanceRating: star })}
              />
            </View>
          </View>

          <View className="mt-4 space-y-3">
            <ToggleOption
              label="Policy Violation"
              value={behaviorReport.policyViolation}
              onToggle={() => onUpdateBehavior({ policyViolation: !behaviorReport.policyViolation })}
              icon="alert-triangle"
              trueColor="#EF4444"
            />
            <ToggleOption
              label="Disciplinary Action Taken"
              value={behaviorReport.disciplinaryAction}
              onToggle={() => onUpdateBehavior({ disciplinaryAction: !behaviorReport.disciplinaryAction })}
              icon="clock"
              trueColor="#EF4444"
            />
            <ToggleOption
              label="Rehire Recommendation"
              value={behaviorReport.rehireRecommendation}
              onToggle={() => onUpdateBehavior({ rehireRecommendation: !behaviorReport.rehireRecommendation })}
              icon="user-check"
              trueColor="#10B981"
            />
          </View>

          <View className="mt-4">
            <Text className="font-rubik-medium text-sm text-gray-700 mb-2">
              Additional Remarks
            </Text>
            <TextInput
              className="bg-gray-50 rounded-xl p-4 text-gray-800 font-rubik text-sm border border-gray-200"
              placeholder="Add any additional comments about the employee's behavior..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={behaviorReport.remarks}
              onChangeText={(text) => onUpdateBehavior({ remarks: text })}
            />
          </View>
        </View>
      )}
    </View>
  );
};