// components/common/NotificationModal.tsx
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  onViewAllPress?: () => void;
  onNotificationPress?: (notification: Notification) => void;
}

const { height } = Dimensions.get('window');

const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  onViewAllPress,
  onNotificationPress,
}) => {
  const { colors, isDarkMode } = useTheme();

  // Dummy notifications data
  const notifications: Notification[] = [
    {
      id: '1',
      title: 'Welcome to the app!',
      message: 'Thank you for joining us. We hope you enjoy your experience.',
      time: '2 min ago',
      read: false,
      type: 'info',
    },
    {
      id: '2',
      title: 'Profile Update',
      message: 'Your profile has been successfully updated.',
      time: '1 hour ago',
      read: false,
      type: 'success',
    },
    {
      id: '3',
      title: 'New Feature Available',
      message: 'Check out our new dark mode feature!',
      time: '3 hours ago',
      read: true,
      type: 'info',
    },
    {
      id: '4',
      title: 'Maintenance Alert',
      message: 'Scheduled maintenance tomorrow at 2 AM.',
      time: '1 day ago',
      read: true,
      type: 'warning',
    },
    {
      id: '5',
      title: 'Security Alert',
      message: 'New login detected from unknown device.',
      time: '2 days ago',
      read: true,
      type: 'error',
    },
  ];

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      default:
        return colors.primary;
    }
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'warning':
        return 'alert-triangle';
      case 'error':
        return 'alert-circle';
      default:
        return 'info';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const typeColor = getTypeColor(item.type);
    const isRead = item.read;

    return (
      <TouchableOpacity
        className={`mx-4 my-1.5 p-4 rounded-xl border-l-4 flex-row relative`}
        style={{
          backgroundColor: isRead 
            ? isDarkMode ? '#1E1E1E' : '#F9FAFB'
            : isDarkMode ? '#2A2A2A' : '#F3F4F6',
          borderLeftColor: typeColor,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
        onPress={() => onNotificationPress?.(item)}
        activeOpacity={0.7}
      >
        <View 
          className="w-10 h-10 rounded-full justify-center items-center mr-3"
          style={{ backgroundColor: typeColor + '20' }}
        >
          <Feather
            name={getTypeIcon(item.type)}
            size={20}
            color={typeColor}
          />
        </View>
        
        <View className="flex-1">
          <View className="flex-row justify-between items-center mb-1">
            <Text
              className={`flex-1 mr-2 text-base font-rubik ${
                isRead ? 'font-rubik' : 'font-rubik-bold'
              }`}
              style={{ color: colors.text }}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text 
              className="text-xs font-rubik"
              style={{ color: isDarkMode ? '#9CA3AF' : '#6B7280' }}
            >
              {item.time}
            </Text>
          </View>
          
          <Text
            className="text-sm font-rubik leading-5"
            style={{ color: isDarkMode ? '#D1D5DB' : '#4B5563' }}
            numberOfLines={2}
          >
            {item.message}
          </Text>
        </View>

        {!item.read && (
          <View 
            className="w-2 h-2 rounded-full absolute top-2 right-4"
            style={{ backgroundColor: colors.primary }}
          />
        )}
      </TouchableOpacity>
    );
  };

  const handleViewAllPress = () => {
    if (onViewAllPress) {
      onViewAllPress();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-end"
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          className="rounded-t-3xl border max-h-[70%]"
          style={{
            backgroundColor: colors.background,
            borderColor: isDarkMode ? '#374151' : '#E5E7EB',
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <View className="flex-row items-center gap-3">
              <Feather name="bell" size={24} color={colors.text} />
              <Text className="text-lg font-rubik-bold" style={{ color: colors.text }}>
                Notifications
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Notification List */}
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 8 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-12 gap-4">
                <Feather name="bell-off" size={48} color={colors.text} />
                <Text className="text-base font-rubik" style={{ color: colors.text }}>
                  No notifications yet
                </Text>
              </View>
            }
          />

          {/* Footer */}
          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 py-4 border-t border-gray-200 dark:border-gray-700"
            onPress={handleViewAllPress}
          >
            <Text 
              className="text-base font-rubik-bold" 
              style={{ color: colors.primary }}
            >
              See All Notifications
            </Text>
            <Feather name="arrow-right" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default NotificationModal;