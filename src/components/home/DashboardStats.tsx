import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import Feather from 'react-native-vector-icons/Feather';
import http from '../../services/http.api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2; // 20 side padding + 12 gap

type OrganizationStats = {
  hr: {
    total: number;
    active: number;
    inactive: number;
  };
  employees: {
    total: number;
    active: number;
    inactive: number;
    pending: number;
  };
  invitations: {
    total: number;
    pending: number;
    accepted: number;
    declined: number;
  };
  verificationsSent: {
    total: number;
    pending: number;
    completed: number;
  };
  verificationsReceived: {
    total: number;
    pending: number;
    completed: number;
  };
};

type StatItem = {
  label: string;
  value: number;
  icon: string;
  color: string;
  trend?: { direction: 'up' | 'down'; label: string };
  subtitle?: string;
};

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
        style={{
          width: 44,
          height: 44,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          backgroundColor: item.color + '18'
        }}
      >
        <Feather name={item.icon} size={20} color={item.color} />
      </View>

      {/* Value */}
      <Text
        style={{
          fontSize: 24,
          fontFamily: 'Rubik-Bold',
          letterSpacing: -0.5,
          color: colors.text
        }}
      >
        {item.value.toLocaleString()}
      </Text>

      {/* Label */}
      <Text 
        style={{
          fontSize: 11,
          fontFamily: 'Rubik-Regular',
          color: '#94A3B8',
          marginTop: 2,
        }}
        numberOfLines={1}
      >
        {item.label}
      </Text>

      {/* Subtitle (optional) */}
      {item.subtitle && (
        <Text
          style={{
            fontSize: 10,
            fontFamily: 'Rubik-Regular',
            color: '#94A3B8',
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {item.subtitle}
        </Text>
      )}

      {/* Trend pill */}
      {hasTrend && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 10,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 20,
            alignSelf: 'flex-start',
            backgroundColor: item.color + '15'
          }}
        >
          <Feather
            name={item.trend!.direction === 'up' ? 'trending-up' : 'trending-down'}
            size={11}
            color={item.color}
          />
          <Text
            style={{
              fontSize: 10,
              fontFamily: 'Rubik-Medium',
              marginLeft: 4,
              color: item.color
            }}
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OrganizationStats | null>(null);

  useEffect(() => {
    fetchOrganizationStats();
  }, []);

  const fetchOrganizationStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await http.get('/api/organization/stats');
      
 
        setStats(response.data);
   
    } catch (err: any) {
      console.error('Error fetching organization stats:', err);
      setError(err.message || 'An error occurred while fetching stats');
    } finally {
      setLoading(false);
    }
  };

  // Calculate percentages for trends
  const calculateVerificationPercentage = () => {
    if (!stats) return 0;
    const { verificationsReceived } = stats;
    if (verificationsReceived.total === 0) return 0;
    return Math.round((verificationsReceived.completed / verificationsReceived.total) * 100);
  };

  const calculatePendingPercentage = () => {
    if (!stats) return 0;
    const { employees } = stats;
    if (employees.total === 0) return 0;
    return Math.round((employees.pending / employees.total) * 100);
  };

  const calculateActivePercentage = () => {
    if (!stats) return 0;
    const { employees } = stats;
    if (employees.total === 0) return 0;
    return Math.round((employees.active / employees.total) * 100);
  };

  // Prepare stats data based on API response
  const getStatsData = (): StatItem[] => {
    if (!stats) return [];

    const verificationPercentage = calculateVerificationPercentage();
    const pendingPercentage = calculatePendingPercentage();
    const activePercentage = calculateActivePercentage();

    return [
      {
        label: 'Total Employees',
        value: stats.employees.total,
        icon: 'users',
        color: '#3B82F6',
        subtitle: `${stats.employees.active} active • ${stats.employees.inactive} inactive`,
      },
      {
        label: 'Active Employees',
        value: stats.employees.active,
        icon: 'check-circle',
        color: '#22C55E',
        trend: activePercentage > 0 ? { 
          direction: 'up', 
          label: `${activePercentage}% active` 
        } : undefined,
      },
      {
        label: 'Pending Invitations',
        value: stats.employees.pending,
        icon: 'clock',
        color: '#F97316',
        trend: pendingPercentage > 0 ? { 
          direction: 'down', 
          label: `${pendingPercentage}% pending` 
        } : undefined,
        subtitle: `${stats.invitations.accepted} accepted • ${stats.invitations.declined} declined`,
      },
      {
        label: 'Verifications',
        value: stats.verificationsReceived.completed,
        icon: 'shield',
        color: '#8B5CF6',
        trend: verificationPercentage > 0 ? { 
          direction: 'up', 
          label: `${verificationPercentage}% verified` 
        } : undefined,
        subtitle: `${stats.verificationsReceived.pending} pending`,
      },
    ];
  };

  // Alternative: More detailed stats view
  const getDetailedStatsData = (): StatItem[] => {
    if (!stats) return [];

    return [
      {
        label: 'Total Employees',
        value: stats.employees.total,
        icon: 'users',
        color: '#3B82F6',
        subtitle: `👥 ${stats.employees.active} active, ${stats.employees.inactive} inactive`,
      },
      {
        label: 'HR Team',
        value: stats.hr.total,
        icon: 'user-check',
        color: '#06B6D4',
        subtitle: `${stats.hr.active} active • ${stats.hr.inactive} inactive`,
      },
      {
        label: 'Pending',
        value: stats.employees.pending,
        icon: 'clock',
        color: '#F97316',
        trend: { direction: 'down', label: `${calculatePendingPercentage()}% pending` },
        subtitle: `📧 ${stats.invitations.pending} invites pending`,
      },
      {
        label: 'Verified',
        value: stats.verificationsReceived.completed,
        icon: 'check-circle',
        color: '#22C55E',
        trend: { direction: 'up', label: `${calculateVerificationPercentage()}% verified` },
        subtitle: `📨 ${stats.verificationsSent.total} sent, ${stats.verificationsReceived.pending} pending`,
      },
    ];
  };

  if (loading) {
    return (
      <View className="mb-6">
        
        <View className="flex-row flex-wrap justify-between">
          {[1, 2, 3, 4].map((_, index) => (
            <View
              key={index}
              style={{
                width: CARD_WIDTH,
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#F1F5F9',
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: '#F1F5F9', marginBottom: 12 }} />
              <View style={{ width: 80, height: 28, backgroundColor: '#F1F5F9', borderRadius: 8, marginBottom: 8 }} />
              <View style={{ width: 100, height: 16, backgroundColor: '#F1F5F9', borderRadius: 4 }} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="mb-6">
       
        <View
          style={{
            backgroundColor: '#FEF2F2',
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
          }}
        >
          <Feather name="alert-circle" size={24} color="#EF4444" />
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Rubik-Medium',
              color: '#991B1B',
              marginTop: 8,
              textAlign: 'center',
            }}
          >
            {error}
          </Text>
          <Text
            onPress={fetchOrganizationStats}
            style={{
              fontSize: 12,
              fontFamily: 'Rubik-Medium',
              color: colors.primary,
              marginTop: 12,
            }}
          >
            Tap to retry
          </Text>
        </View>
      </View>
    );
  }

  const statsData = getDetailedStatsData(); // Use getStatsData() for simpler view or getDetailedStatsData() for more info

  return (
    <View className="mb-6">
      
      {/* 2-column grid */}
      <View className="flex-row flex-wrap justify-between">
        {statsData.map((item, index) => (
          <StatCard key={index} item={item} colors={colors} />
        ))}
      </View>
    </View>
  );
};

export default DashboardStats;