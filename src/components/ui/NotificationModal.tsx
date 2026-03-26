// components/common/NotificationModal.tsx (updated)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  Animated,
  RefreshControl,
  Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationsContext';
import Toast from 'react-native-toast-message';
import Loader from '../ui/Loader';

// Types (same as before)
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

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  onViewAllPress?: () => void;
  onNotificationPress?: (notification: Notification) => void;
}

// PulseDot component (same as before)
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
    <View className="absolute top-3 right-3 w-3 h-3 items-center justify-center">
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

const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  onViewAllPress,
  onNotificationPress,
}) => {
  const { colors, isDarkMode } = useTheme();
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
  } = useNotifications();

  // Animation refs
  const slideY = useRef(new Animated.Value(600)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Refresh notifications when modal opens
      refreshNotifications();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(slideY, { toValue: 0, damping: 22, stiffness: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideY, { toValue: 600, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, refreshNotifications]);

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

  const renderNotification = useCallback(({ item }: { item: Notification }) => {
    const { color: typeColor, icon } = getNotificationTypeConfig(item.type);
    const unreadBg  = isDarkMode ? '#1E2A3A' : `${colors.primary}0D`;
    const readBg    = isDarkMode ? '#161616' : '#F8FAFC';
    const borderCol = item.isRead ? 'transparent' : colors.primary;

    const handlePress = () => {
      markAsRead(item.id, item.isRead);
      onNotificationPress?.(item);
    };

    return (
      <TouchableOpacity
        activeOpacity={0.72}
        onPress={handlePress}
        style={{
          marginHorizontal: 16,
          marginVertical: 5,
          borderRadius: 18,
          backgroundColor: item.isRead ? readBg : unreadBg,
          borderWidth: 1,
          borderColor: item.isRead ? (isDarkMode ? '#2A2A2A' : '#EEF2F7') : `${colors.primary}40`,
          borderLeftWidth: 3,
          borderLeftColor: borderCol,
        }}
      >
        <View className="flex-row p-4">
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: typeColor + '18',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              borderWidth: 1,
              borderColor: typeColor + '30',
            }}
          >
            <Feather name={icon} size={20} color={typeColor} />
          </View>

          <View style={{ flex: 1 }}>
            <View className="flex-row items-center mb-1">
              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  fontSize: 14,
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
                    marginRight: 5,
                  }}
                />
                <Text style={{ fontSize: 11, color: isDarkMode ? '#71717A' : '#A1A1AA', fontFamily:'Rubik-Regular' }}>
                  {item.employee.name}
                  {item.employee.designation ? ` · ${item.employee.designation}` : ''}
                </Text>
              </View>
            )}
          </View>
        </View>

        {!item.isRead && <PulseDot color={colors.primary} />}
      </TouchableOpacity>
    );
  }, [notifications, isDarkMode, colors, markAsRead, onNotificationPress]);

  const renderHeader = () => {
    if (notifications.length === 0) return null;
    return (
      <View
        className="flex-row justify-between items-center px-5 py-3 mb-1"
        style={{ borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#27272A' : '#F1F5F9' }}
      >
        <View
          className="flex-row items-center px-3 py-1 rounded-full"
          style={{ backgroundColor: colors.primary + '18' }}
        >
          <View
            style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary, marginRight: 6 }}
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
            <Feather name="check-circle" size={12} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 12, color: colors.primary, fontFamily: 'Rubik-Medium' }}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const EmptyState = () => (
    <View className="items-center justify-center py-16 px-8">
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 28,
          backgroundColor: colors.primary + '12',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          borderWidth: 1,
          borderColor: colors.primary + '25',
        }}
      >
        <Feather name="bell-off" size={38} color={colors.primary} />
      </View>
      <Text
        style={{ fontSize: 17, fontFamily: 'Rubik-SemiBold', color: colors.text, marginBottom: 8 }}
      >
        You're all caught up
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: isDarkMode ? '#71717A' : '#9CA3AF',
          textAlign: 'center',
          lineHeight: 20,
        }}
      >
        When you receive notifications,{'\n'}they'll appear right here.
      </Text>
    </View>
  );

  const sheetBg    = isDarkMode ? '#0F0F0F' : '#FFFFFF';
  const borderTop  = isDarkMode ? '#1F1F1F' : '#F1F5F9';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', opacity: fadeAnim }}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

        <Animated.View
          style={{
            transform: [{ translateY: slideY }],
            backgroundColor: sheetBg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: '72%',
            overflow: 'hidden',
            ...Platform.select({
              ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.12, shadowRadius: 20 },
              android: { elevation: 24 },
            }),
          }}
        >
          <View className="items-center pt-3 pb-1">
            <View
              style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: isDarkMode ? '#3F3F46' : '#D4D4D8' }}
            />
          </View>

          <View
            className="flex-row items-center justify-between px-5 py-4"
            style={{ borderBottomWidth: 1, borderBottomColor: borderTop }}
          >
            <View className="flex-row items-center">
              <View style={{ marginRight: 12 }}>
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 13,
                    backgroundColor: colors.primary + '15',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.primary + '28',
                  }}
                >
                  <Feather name="bell" size={20} color={colors.primary} />
                </View>
                {unreadCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      backgroundColor: colors.primary,
                      borderRadius: 9,
                      minWidth: 18,
                      height: 18,
                      paddingHorizontal: 4,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: sheetBg,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Rubik-Bold' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>

              <View>
                <Text style={{ fontSize: 18, fontFamily: 'Rubik-Bold', color: colors.text }}>
                  Notifications
                </Text>
                <Text style={{ fontSize: 12, color: isDarkMode ? '#71717A' : '#9CA3AF', fontFamily: 'Rubik-Regular' }}>
                  {pagination.total > 0 ? `${pagination.total} total` : 'Stay up to date'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                backgroundColor: isDarkMode ? '#27272A' : '#F4F4F5',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="x" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 10, paddingBottom: 4 }}
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

          <View style={{ borderTopWidth: 1, borderTopColor: borderTop, padding: 16 }}>
            <TouchableOpacity
              onPress={() => { onViewAllPress?.(); onClose(); }}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 16,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                ...Platform.select({
                  ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14 },
                  android: { elevation: 8 },
                }),
              }}
              activeOpacity={0.82}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Rubik-SemiBold', marginRight: 8 }}>
                See All Notifications
              </Text>
              <Feather name="arrow-right" size={17} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default NotificationModal;