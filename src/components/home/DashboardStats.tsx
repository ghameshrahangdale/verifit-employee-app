import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Feather from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // responsive 2 column

const DashboardStats: React.FC = () => {
  const { colors } = useTheme();

  const STATS = [
    { 
      label: 'Total Employees', 
      value: 1500,
      icon: 'users',
      color: '#3B82F6' // Blue
    },
    { 
      label: 'Verified', 
      value: 1185,
      icon: 'check-circle',
      color: '#22C55E' // Green
    },
    { 
      label: 'Pending', 
      value: 315,
      icon: 'clock',
      color: '#F97316' // Orange
    },
    { 
      label: 'Total Verifications', 
      value: 1500,
      icon: 'shield',
      color: '#8B5CF6' // Purple
    },
  ];

  return (
    <View className="mb-10">
      <Text
        className="text-xl font-rubik-bold mb-5"
        style={{ color: colors.text }}
      >
        Dashboard Overview
      </Text>

      <View className="flex-row flex-wrap justify-between">
        {STATS.map((item, index) => (
          <View
            key={index}
            style={{
              width: CARD_WIDTH,
              backgroundColor: '#FFF',
              borderRadius: 16,
              padding: 16,
              marginBottom: 8,
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              borderColor: colors.primary + '20',
              borderWidth: 1,
            }}
          >
            {/* Icon and Value Row */}
            <View className="flex-row items-center justify-between">
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: item.color + '15' }}
              >
                <Feather name={item.icon} size={20} color={item.color} />
              </View>
              
              <Text
                className="text-2xl font-rubik-bold"
                style={{ color: colors.primary }}
              >
                {item.value.toLocaleString()}
              </Text>
            </View>

            {/* Label */}
            <Text className="text-sm text-gray-500 mt-3 font-rubik">
              {item.label}
            </Text>

            {/* Optional: Mini trend indicator */}
            {item.label === 'Verified' && (
              <View className="flex-row items-center mt-2">
                <Feather name="trending-up" size={14} color="#22C55E" />
                <Text className="text-xs text-green-600 ml-1 font-rubik">
                  79% verified
                </Text>
              </View>
            )}
            
            {item.label === 'Pending' && (
              <View className="flex-row items-center mt-2">
                <Feather name="trending-down" size={14} color="#F97316" />
                <Text className="text-xs text-orange-600 ml-1 font-rubik">
                  21% pending
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

export default DashboardStats;