import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Feather from 'react-native-vector-icons/Feather';
import Avatar from '../ui/Avatar';

type VerificationItem = {
  id: number;
  name: string;
  joiningDate: string;
  designation: string;
  department: string;
  status: 'Verified' | 'Pending';
  profile: string;
};

const DATA: VerificationItem[] = [
  {
    id: 1,
    name: 'Amit Sharma',
    joiningDate: '12 Feb 2024',
    designation: 'Software Engineer',
    department: 'IT',
    status: 'Verified',
    profile: 'https://i.pravatar.cc/150?img=1',
  },
  {
    id: 2,
    name: 'Priya Verma',
    joiningDate: '08 Jan 2024',
    designation: 'HR Manager',
    department: 'HR',
    status: 'Pending',
    profile: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: 3,
    name: 'Rahul Deshmukh',
    joiningDate: '18 Mar 2024',
    designation: 'Product Manager',
    department: 'Product',
    status: 'Verified',
    profile: 'https://i.pravatar.cc/150?img=3',
  },
];

type StatusConfig = {
  bg: string;
  text: string;
  dot: string;
  icon: string;
};

const STATUS_CONFIG: Record<'Verified' | 'Pending', StatusConfig> = {
  Verified: {
    bg: '#22C55E15',
    text: '#16A34A',
    dot: '#22C55E',
    icon: 'check-circle',
  },
  Pending: {
    bg: '#F9731615',
    text: '#EA6D10',
    dot: '#F97316',
    icon: 'clock',
  },
};

const VerificationCard: React.FC<{ item: VerificationItem; colors: any }> = ({
  item,
  colors,
}) => {
  const cfg = STATUS_CONFIG[item.status];

  return (
    <View
      className="bg-white rounded-2xl mb-3 overflow-hidden"
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
        borderColor: '#F1F5F9',
        borderWidth: 1,
      }}
    >
      {/* Colored top accent stripe */}
      <View
        style={{
          height: 3,
          backgroundColor: cfg.dot,
          opacity: 0.5,
        }}
      />

      <View className="px-4 py-4">
        {/* Main row */}
        <View className="flex-row items-center">
          <Avatar imageUrl={item.profile} size="lg" />

          <View className="ml-3 flex-1">
            <Text
              className="text-base font-rubik-bold text-gray-900"
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text className="text-xs text-gray-400 mt-0.5 font-rubik" numberOfLines={1}>
              {item.designation}
            </Text>
          </View>

          {/* Status badge */}
          <View
            className="flex-row items-center px-2.5 py-1 rounded-full"
            style={{ backgroundColor: cfg.bg }}
          >
            <View
              className="w-1.5 h-1.5 rounded-full mr-1.5"
              style={{ backgroundColor: cfg.dot }}
            />
            <Text
              className="text-xs font-rubik-medium"
              style={{ color: cfg.text }}
            >
              {item.status}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-100 mt-3 mb-3" />

        {/* Meta row */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              className="px-2 py-0.5 rounded-md mr-2"
              style={{ backgroundColor: colors.primary + '10' }}
            >
              <Text
                className="text-xs font-rubik-medium"
                style={{ color: colors.primary }}
              >
                {item.department}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <Feather name="calendar" size={11} color="#9CA3AF" />
            <Text className="text-xs text-gray-400 font-rubik ml-1">
              Joined {item.joiningDate}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const RecentVerifications: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View className="mb-6">
      {/* Section header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-rubik-bold" style={{ color: colors.text }}>
          Recent Verifications
        </Text>
        <TouchableOpacity className="flex-row items-center" activeOpacity={0.7}>
          <Text className="text-xs font-rubik" style={{ color: colors.primary }}>
            View All
          </Text>
          <Feather name="chevron-right" size={14} color={colors.primary} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>

      {DATA.map(item => (
        <VerificationCard key={item.id} item={item} colors={colors} />
      ))}
    </View>
  );
};

export default RecentVerifications;