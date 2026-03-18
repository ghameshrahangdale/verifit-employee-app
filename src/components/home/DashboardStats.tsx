import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Feather from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2; // 20 side padding + 12 gap

type StatItem = {
  label: string;
  value: number;
  icon: string;
  color: string;
  trend?: { direction: 'up' | 'down'; label: string };
};

const STATS: StatItem[] = [
  {
    label: 'Total Employees',
    value: 1500,
    icon: 'users',
    color: '#3B82F6',
  },
  {
    label: 'Verified',
    value: 1185,
    icon: 'check-circle',
    color: '#22C55E',
    trend: { direction: 'up', label: '79% verified' },
  },
  {
    label: 'Pending',
    value: 315,
    icon: 'clock',
    color: '#F97316',
    trend: { direction: 'down', label: '21% pending' },
  },
  {
    label: 'Total Verifications',
    value: 1500,
    icon: 'shield',
    color: '#8B5CF6',
  },
];

const StatCard: React.FC<{ item: StatItem; colors: any }> = ({ item, colors }) => {
  const hasTrend = !!item.trend;

  return (
    <View
      style={{
        width: CARD_WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        shadowColor: item.color,
        shadowOpacity: 0.10,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
        borderColor: item.color + '18',
        borderWidth: 1,
      }}
    >
      {/* Icon badge */}
      <View
        className="w-11 h-11 rounded-2xl items-center justify-center mb-3"
        style={{ backgroundColor: item.color + '18' }}
      >
        <Feather name={item.icon} size={20} color={item.color} />
      </View>

      {/* Value */}
      <Text
        className="text-2xl font-rubik-bold tracking-tight"
        style={{ color: colors.text }}
      >
        {item.value.toLocaleString()}
      </Text>

      {/* Label */}
      <Text className="text-xs text-gray-400 mt-0.5 font-rubik leading-tight" numberOfLines={1}>
        {item.label}
      </Text>

      {/* Trend pill */}
      {hasTrend && (
        <View
          className="flex-row items-center mt-2.5 self-start px-2 py-0.5 rounded-full"
          style={{ backgroundColor: item.color + '15' }}
        >
          <Feather
            name={item.trend!.direction === 'up' ? 'trending-up' : 'trending-down'}
            size={11}
            color={item.color}
          />
          <Text
            className="text-xs ml-1 font-rubik-medium"
            style={{ color: item.color }}
          >
            {item.trend!.label}
          </Text>
        </View>
      )}
    </View>
  );
};

const DashboardStats: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View className="mb-6">
      {/* Section header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-rubik-bold" style={{ color: colors.text }}>
          Overview
        </Text>
        <Text className="text-xs font-rubik" style={{ color: colors.primary }}>
          This Month
        </Text>
      </View>

      {/* 2-column grid */}
      <View className="flex-row flex-wrap justify-between">
        {STATS.map((item, index) => (
          <StatCard key={index} item={item} colors={colors} />
        ))}
      </View>
    </View>
  );
};

export default DashboardStats;