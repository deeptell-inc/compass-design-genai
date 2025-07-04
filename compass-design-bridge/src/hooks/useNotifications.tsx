import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  version: string;
  timestamp: number;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  type: 'info' | 'warning' | 'error' | 'success';
  isSystemGenerated?: boolean;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  currentVersion: string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead' | 'isSystemGenerated'>) => void;
  setCurrentVersion: (version: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentVersion, setCurrentVersionState] = useState<string>('1.0.0');
  const [lastReadVersion, setLastReadVersion] = useState<string>('1.0.0');

  // Load saved data from localStorage
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    const savedVersion = localStorage.getItem('currentVersion');
    const savedLastReadVersion = localStorage.getItem('lastReadVersion');

    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (error) {
        console.error('Failed to parse notifications:', error);
      }
    }

    if (savedVersion) {
      setCurrentVersionState(savedVersion);
    }

    if (savedLastReadVersion) {
      setLastReadVersion(savedLastReadVersion);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Save current version to localStorage
  useEffect(() => {
    localStorage.setItem('currentVersion', currentVersion);
  }, [currentVersion]);

  // Save last read version to localStorage
  useEffect(() => {
    localStorage.setItem('lastReadVersion', lastReadVersion);
  }, [lastReadVersion]);

  const addNotification = (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead' | 'isSystemGenerated'>) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      isRead: false,
      isSystemGenerated: false,
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setLastReadVersion(currentVersion);
  };

  const setCurrentVersion = (version: string) => {
    const oldVersion = currentVersion;
    setCurrentVersionState(version);
    
    // If version has changed, add a system notification
    if (version !== oldVersion && oldVersion !== '1.0.0') {
      const systemNotification: NotificationItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: 'システム更新',
        message: `バージョン ${version} にアップデートされました。新機能をご確認ください。`,
        version: version,
        priority: 'high',
        type: 'info',
        timestamp: Date.now(),
        isRead: false,
        isSystemGenerated: true,
      };
      
      setNotifications(prev => [systemNotification, ...prev]);
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Calculate unread count - prioritize version-based notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const hasVersionUpdate = currentVersion !== lastReadVersion;

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount: hasVersionUpdate ? Math.max(1, unreadCount) : unreadCount,
    currentVersion,
    markAsRead,
    markAllAsRead,
    addNotification,
    setCurrentVersion,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}