// screens/notifications/NotificationsScreen.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationsContext';
import Loader from '../../components/ui/Loader';
import { StatusBar } from 'react-native';
import Avatar from '../../components/ui/Avatar';
import Header from '../../components/ui/Header';

// Types
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  metadata: {
    employeeId?: string;
    employmentRecordId?: string;
    verificationRequestId?: string;
  };
  channel: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  employee: {
    id: string;
    name: string;
    designation: string | null;
    department: string | null;
    profileImage: string | null;
    email: string;
  };
  sentByUser: any;
}

// PulseDot component
const PulseDot: React.FC<{ color: string }> = ({ color }) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.8, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View className="absolute top-3 right-12 w-3 h-3 items-center justify-center">
      <Animated.View
        style={{
          position: 'absolute',
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: color,
          opacity: 0.3,
          transform: [{ scale: pulse }],
        }}
      />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
};

const NotificationsScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    pagination,
    refreshNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // State for delete confirmation
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
  
  // Animation for header
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const getNotificationTypeConfig = (type: string) => {
    const map: Record<string, { color: string; icon: string }> = {
      verification_request_received:  { color: '#3B82F6', icon: 'user-check' },
      verification_request_approved:  { color: '#10B981', icon: 'check-circle' },
      verification_request_rejected:  { color: '#EF4444', icon: 'x-circle' },
      verification_request_completed: { color: '#8B5CF6', icon: 'file-check' },
      discrepancy_reported:           { color: '#F59E0B', icon: 'alert-triangle' },
    };
    return map[type] ?? { color: colors.primary, icon: 'bell' };
  };

  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60)            return `${seconds}s ago`;
    if (seconds < 3600)          return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400)         return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800)        return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000)       return `${Math.floor(seconds / 604800)}w ago`;
    if (seconds < 31536000)      return `${Math.floor(seconds / 2592000)}mo ago`;
    return `${Math.floor(seconds / 31536000)}y ago`;
  };

  // Handle delete confirmation
  const handleDeletePress = (notification: Notification) => {
    setNotificationToDelete(notification);
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (notificationToDelete) {
      await deleteNotification(notificationToDelete.id);
      setDeleteConfirmVisible(false);
      setNotificationToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmVisible(false);
    setNotificationToDelete(null);
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id, notification.isRead);
    
    // // Handle navigation based on notification type
    // if (notification.link) {
    //   // You can parse the link and navigate accordingly
    //   console.log('Navigate to:', notification.link);
    // } else if (notification.metadata?.verificationRequestId) {
    //   navigation.navigate('ViewVerification', {
    //     verificationId: notification.metadata.verificationRequestId,
    //   });
    // }
  };

  const renderNotification = useCallback(({ item }: { item: Notification }) => {
    const { color: typeColor, icon } = getNotificationTypeConfig(item.type);
    const unreadBg  = isDarkMode ? '#1E2A3A' : `${colors.primary}0D`;
    const readBg    = isDarkMode ? '#161616' : '#F8FAFC';
    const borderCol = item.isRead ? 'transparent' : colors.primary;

    return (
      <TouchableOpacity
        activeOpacity={0.72}
        onPress={() => handleNotificationPress(item)}
        style={[
          {
            borderRadius: 18,
            backgroundColor: item.isRead ? readBg : unreadBg,
            borderWidth: 1,
            borderColor: item.isRead ? (isDarkMode ? '#2A2A2A' : '#EEF2F7') : `${colors.primary}40`,
            borderLeftWidth: 3,
            borderLeftColor: borderCol,
            marginHorizontal: 16,
            marginVertical: 6,
          },
        ]}
      >
        <View className="flex-row p-4">
          <View
            className='mr-4 mt-1'
          >
            <Avatar imageUrl={item.employee.profileImage} rounded='corners' />
          </View>

          <View style={{ flex: 1 }}>
            <View className="flex-row items-center mb-1">
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontFamily: item.isRead ? 'Rubik-Regular' : 'Rubik-SemiBold',
                  color: colors.text,
                  marginRight: 8,
                }}
              >
                {item.title}
              </Text>
              <Text style={{ fontSize: 11, color: isDarkMode ? '#6B7280' : '#9CA3AF', fontFamily:'Rubik-Regular' }}>
                {formatTimeAgo(item.createdAt)}
              </Text>
            </View>

            <Text
              numberOfLines={2}
              style={{
                fontSize: 13,
                lineHeight: 19,
                color: isDarkMode ? '#A1A1AA' : '#52525B',
                fontFamily:'Rubik-Regular'
              }}
            >
              {item.message}
            </Text>

            {item.employee && (
              <View className="flex-row items-center mt-2">
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: typeColor,
                    marginRight: 6,
                  }}
                />
                <Text style={{ fontSize: 11, color: isDarkMode ? '#71717A' : '#A1A1AA', fontFamily:'Rubik-Regular' }}>
                  {item.employee.name}
                  {item.employee.designation ? ` · ${item.employee.designation}` : ''}
                </Text>
              </View>
            )}
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            onPress={() => handleDeletePress(item)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: isDarkMode ? '#2A2A2A' : '#F1F5F9',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 8,
            }}
          >
            <Icon name="trash-2" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {!item.isRead && <PulseDot color={colors.primary} />}
      </TouchableOpacity>
    );
  }, [isDarkMode, colors, markAsRead, deleteNotification]);

  const renderHeader = () => {
    if (notifications.length === 0) return null;
    return (
      <View
        className="flex-row justify-between items-center px-5 py-4 mb-2"
        style={{ 
          borderBottomWidth: 1, 
          borderBottomColor: isDarkMode ? '#27272A' : '#F1F5F9',
          backgroundColor: isDarkMode ? '#0F0F0F' : '#FFFFFF',
        }}
      >
        <View
          className="flex-row items-center px-3 py-1.5 rounded-full"
          style={{ backgroundColor: colors.primary + '18' }}
        >
          <View
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: 6 }}
          />
          <Text style={{ fontSize: 12, color: colors.primary, fontFamily: 'Rubik-Medium' }}>
            {unreadCount} unread
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllAsRead}
            className="flex-row items-center px-3 py-1.5 rounded-full"
            style={{ backgroundColor: isDarkMode ? '#27272A' : '#F1F5F9' }}
          >
            <Icon name="check-circle" size={12} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 12, color: colors.primary, fontFamily: 'Rubik-Medium' }}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const EmptyState = () => (
    <View className="flex-1 items-center justify-center py-20 px-8">
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 30,
          backgroundColor: colors.primary + '12',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          borderWidth: 1,
          borderColor: colors.primary + '25',
        }}
      >
        <Icon name="bell-off" size={44} color={colors.primary} />
      </View>
      <Text
        style={{ fontSize: 20, fontFamily: 'Rubik-SemiBold', color: colors.text, marginBottom: 8 }}
      >
        No notifications yet
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: isDarkMode ? '#71717A' : '#9CA3AF',
          textAlign: 'center',
          lineHeight: 20,
        }}
      >
        When you receive notifications,{'\n'}they'll appear right here.
      </Text>
    </View>
  );

  // Delete confirmation modal
  const DeleteConfirmModal = () => (
    <Modal
      visible={deleteConfirmVisible}
      transparent
      animationType="fade"
      onRequestClose={cancelDelete}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            backgroundColor: isDarkMode ? '#1F1F1F' : '#FFFFFF',
            borderRadius: 24,
            padding: 24,
            width: '80%',
            maxWidth: 320,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#EF444420',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Icon name="trash-2" size={28} color="#EF4444" />
          </View>
          
          <Text
            style={{
              fontSize: 18,
              fontFamily: 'Rubik-SemiBold',
              color: colors.text,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Delete Notification?
          </Text>
          
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Rubik-Regular',
              color: isDarkMode ? '#9CA3AF' : '#6B7280',
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 20,
            }}
          >
            This action cannot be undone. The notification will be permanently removed.
          </Text>
          
          <View className="flex-row w-full space-x-3">
            <TouchableOpacity
              onPress={cancelDelete}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'Rubik-Medium',
                  color: colors.text,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={confirmDelete}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: '#EF4444',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'Rubik-SemiBold',
                  color: '#FFFFFF',
                }}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#0F0F0F' : '#FFFFFF' }}>
      <Header title='Notifications'/>
      
      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingTop: 8,
          paddingBottom: 20,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshNotifications}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onEndReached={loadMoreNotifications}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
        ListFooterComponent={
          isLoading && !isRefreshing && notifications.length > 0 ? (
            <View className="py-5 items-center">
              <Loader size="small" />
            </View>
          ) : null
        }
      />

      <DeleteConfirmModal />
    </View>
  );
};

export default NotificationsScreen;