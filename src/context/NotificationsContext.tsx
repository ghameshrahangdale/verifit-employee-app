// context/NotificationsContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import http from '../services/http.api';
import Toast from 'react-native-toast-message';

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

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  pagination: PaginationInfo;
  fetchNotifications: (page?: number, refresh?: boolean) => Promise<void>;
  markAsRead: (notificationId: string, isAlreadyRead?: boolean) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

interface NotificationsProviderProps {
  children: React.ReactNode;
  pollInterval?: number; // Polling interval in milliseconds (default: 30000)
  enablePolling?: boolean; // Enable/disable background polling (default: true)
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({
  children,
  pollInterval = 30000, // 30 seconds
  enablePolling = true,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (page = 1, refresh = false) => {
    if (!isMountedRef.current) return;

    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true);

      const response = await http.get('/api/notifications', {
        params: { page, limit: pagination.limit },
      });

      const {
        notifications: newNotifications,
        unreadCount: newUnreadCount,
        pagination: paginationData,
      } = response.data;

      if (isMountedRef.current) {
        setNotifications(prev =>
          refresh || page === 1 ? newNotifications : [...prev, ...newNotifications]
        );
        setUnreadCount(newUnreadCount);
        setPagination(paginationData);
      }
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      // Don't show toast for background polling to avoid spamming
      if (!refresh && page === 1) {
        Toast.show({
          type: 'error',
          text1: 'Failed to Load Notifications',
          text2: error.response?.data?.message || 'Unable to fetch notifications',
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [pagination.limit]);

  // Refresh notifications (pull to refresh)
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications(1, true);
  }, [fetchNotifications]);

  // Load more notifications (pagination)
  const loadMoreNotifications = useCallback(async () => {
    if (pagination.hasNext && !isLoading && !isRefreshing) {
      await fetchNotifications(pagination.page + 1);
    }
  }, [pagination.hasNext, pagination.page, isLoading, isRefreshing, fetchNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string, isAlreadyRead: boolean = false) => {
    if (isAlreadyRead) return;

    try {
      await http.patch(`/api/notifications/${notificationId}/read`);
      
      if (isMountedRef.current) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to mark notification as read',
      });
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await http.patch('/api/notifications/mark-all-read');
      
      if (isMountedRef.current) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
        Toast.show({
          type: 'success',
          text1: 'All caught up!',
          text2: 'All notifications marked as read',
        });
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: 'Unable to mark all as read',
      });
    }
  }, []);

  // Background polling setup
  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch
    fetchNotifications(1, true);

    // Set up polling if enabled
    if (enablePolling && pollInterval > 0) {
      pollTimerRef.current = setInterval(() => {
        // Only poll if the app is in foreground (you can add app state detection)
        fetchNotifications(1, true);
      }, pollInterval);
    }

    // Cleanup
    return () => {
      isMountedRef.current = false;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [fetchNotifications, enablePolling, pollInterval]);

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    isLoading,
    isRefreshing,
    pagination,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    loadMoreNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};