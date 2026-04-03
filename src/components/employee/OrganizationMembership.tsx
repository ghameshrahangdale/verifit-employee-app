// OrganizationMembership.tsx
import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    Linking,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';

interface Organization {
    id: string;
    name: string;
    businessEmail: string;
    logoUrl: string | null;
}

interface Membership {
    id: string;
    organizationId: string;
    employeeId: string;
    designation: string;
    department: string;
    joiningDate: string;
    employmentStatus: string;
    createdAt: string;
    updatedAt: string;
    organization: Organization;
}

interface OrganizationMembershipProps {
    memberships: Membership[];
}

const OrganizationMembership: React.FC<OrganizationMembershipProps> = ({ memberships }) => {
    const { colors } = useTheme();

    if (!memberships || memberships.length === 0) {
        return null;
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const statuses: Record<string, { label: string; color: string; bgColor: string }> = {
            active: { label: 'Active', color: '#15803D', bgColor: '#DCFCE7' },
            inactive: { label: 'Inactive', color: '#92400E', bgColor: '#FEF3C7' },
            terminated: { label: 'Terminated', color: '#991B1B', bgColor: '#FEE2E2' },
            pending: { label: 'Pending', color: '#1E40AF', bgColor: '#DBEAFE' },
        };
        return statuses[status] || { label: status, color: '#64748B', bgColor: '#F1F5F9' };
    };

    const handleEmailPress = (email: string) => {
        Linking.openURL(`mailto:${email}`);
    };

    const Card = ({ children, noPad }: { children: React.ReactNode; noPad?: boolean }) => (
        <View
            className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${noPad ? '' : 'px-4 py-1'}`}
            
        >
            {children}
        </View>
    );

    return (
        <View className="px-4">
            {memberships.map((membership, index) => {
                const statusBadge = getStatusBadge(membership.employmentStatus);
                const joiningDate = formatDate(membership.joiningDate);

                return (
                    <Card key={membership.id} noPad>
                        {/* Organization Header */}
                        <View className="px-4 pt-4 pb-3 border-b border-gray-50">
                            <View className="flex-row items-center">
                                {/* Logo */}
                                {membership.organization.logoUrl ? (
                                    <View className="w-12 h-12 rounded-xl border border-gray-100 bg-white overflow-hidden mr-3">
                                        <Image
                                            source={{ uri: membership.organization.logoUrl }}
                                            className="w-full h-full"
                                            resizeMode="contain"
                                        />
                                    </View>
                                ) : (
                                    <View
                                        className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                        style={{ backgroundColor: `${colors.primary}10` }}
                                    >
                                        <Feather name="home" size={20} color={colors.primary} />
                                    </View>
                                )}

                                <View className="flex-1">
                                    <Text className="text-lg font-rubik-bold text-gray-900">
                                        {membership.organization.name}
                                    </Text>
                                    <Text className="text-xs font-rubik text-gray-400 mt-0.5">
                                        Member since {joiningDate}
                                    </Text>
                                </View>

                         
                            </View>
                        </View>

                        {/* Business Email */}
                        <TouchableOpacity
                            onPress={() => handleEmailPress(membership.organization.businessEmail)}
                            className="px-4 py-3 border-b border-gray-50"
                        >
                            <View className="flex-row items-center">
                                <View
                                    className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                                    style={{ backgroundColor: `${colors.primary}10` }}
                                >
                                    <Feather name="mail" size={14} color={colors.primary} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs font-rubik text-gray-400">Business Email</Text>
                                    <Text className="text-sm font-rubik-medium text-primary mt-0.5">
                                        {membership.organization.businessEmail}
                                    </Text>
                                </View>
                                <Feather name="chevron-right" size={16} color="#9CA3AF" />
                            </View>
                        </TouchableOpacity>

                        {/* Employment Details */}
                        <View className="px-4 py-3">
                            <View className="flex-row items-start mb-3">
                                <View
                                    className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                                    style={{ backgroundColor: `${colors.primary}10` }}
                                >
                                    <Feather name="briefcase" size={14} color={colors.primary} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs font-rubik text-gray-400">Current Role</Text>
                                    <Text className="text-sm font-rubik-medium text-gray-800 mt-0.5">
                                        {membership.designation}
                                    </Text>
                                    <Text className="text-xs font-rubik text-gray-500 mt-0.5">
                                        {membership.department} Department
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row items-start">
                                <View
                                    className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                                    style={{ backgroundColor: `${colors.primary}10` }}
                                >
                                    <Feather name="calendar" size={14} color={colors.primary} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-xs font-rubik text-gray-400">Joining Date</Text>
                                    <Text className="text-sm font-rubik-medium text-gray-800 mt-0.5">
                                        {joiningDate}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </Card>
                );
            })}
        </View>
    );
};

export default OrganizationMembership;