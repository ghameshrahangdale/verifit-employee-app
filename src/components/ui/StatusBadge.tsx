import React from 'react';
import { View, Text } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

// Define the StatusConfig interface
interface StatusConfig {
  text: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  icon: string;
}

// Define the possible status types
type StatusType = 'pending' | 'approved' | 'rejected' | 'declined' | string;

// Define the props interface
interface StatusBadgeProps {
  status: StatusType;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  customConfig?: Partial<StatusConfig>;
}

// Size configuration interface
interface SizeConfig {
  padding: string;
  iconSize: number;
  textSize: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'small',
  showIcon = true,
  customConfig
}) => {
  const getStatusConfig = (status: StatusType): StatusConfig => {
    const statusMap: Record<string, StatusConfig> = {
      pending: {
        text: 'Pending',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
        icon: 'clock',
      },
      approved: {
        text: 'Approved',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        icon: 'check-circle',
      },
      rejected: {
        text: 'Declined',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        icon: 'x-circle',
      },
      declined: {
        text: 'Declined',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        icon: 'x-circle',
      },
    };

    const defaultConfig = statusMap[status.toLowerCase()] || statusMap.pending;
    
    // Merge with custom config if provided
    return {
      ...defaultConfig,
      ...customConfig,
    };
  };

  const config = getStatusConfig(status);
  
  // Size configurations with proper typing
  const sizeStyles: Record<'small' | 'medium' | 'large', SizeConfig> = {
    small: {
      padding: 'px-2 py-1',
      iconSize: 10,
      textSize: 'text-[10px]',
    },
    medium: {
      padding: 'px-4 py-2',
      iconSize: 12,
      textSize: 'text-xs',
    },
    large: {
      padding: 'px-5 py-2.5',
      iconSize: 14,
      textSize: 'text-sm',
    },
  };

  const currentSize = sizeStyles[size];
  
  // Helper function to get color from tailwind class
  const getIconColor = (textColorClass: string): string => {
    const colorMap: Record<string, string> = {
      'text-amber-700': '#B45309',
      'text-green-700': '#15803D',
      'text-red-700': '#B91C1C',
    };
    return colorMap[textColorClass] || '#6B7280';
  };

  const iconColor = getIconColor(config.textColor);

  return (
    <View className={`${currentSize.padding} rounded-full ${config.bgColor} border ${config.borderColor}`}>
      <View className="flex-row items-center">
        {showIcon && (
          <Feather 
            name={config.icon} 
            size={currentSize.iconSize} 
            color={iconColor}
          />
        )}
        <Text className={`font-rubik-medium ${currentSize.textSize} tracking-wide ${showIcon ? 'ml-1' : ''} ${config.textColor}`}>
          {config.text}
        </Text>
      </View>
    </View>
  );
};

export default StatusBadge;