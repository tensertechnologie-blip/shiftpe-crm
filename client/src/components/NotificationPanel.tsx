import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BroadcastAlertModal } from './BroadcastAlertModal';
import {
  Bell,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
  Clock,
  Megaphone,
  UserCheck
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'urgent' | 'announcement' | 'role_change' | 'attendance' | 'task' | 'security' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority?: string;
  actionText?: string;
  onAction?: () => void;
}

interface NotificationPanelProps {
  onOpenOnboarding?: () => void;
  onSelectTab?: (tab: any) => void;
  onUrgentAlertChange?: (urgentAlert: { title: string; message: string; actionText?: string; onAction?: () => void } | null) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  onOpenOnboarding,
  onSelectTab,
  onUrgentAlertChange
}) => {
  const { user, token } = useAuth();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [serverNotifications, setServerNotifications] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('shiftpe_dismissed_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const isCeo = user?.role === 'ceo';

  // Fetch notifications from server
  const fetchServerNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setServerNotifications(data.notifications || []);
      }
    } catch (err) {
      console.warn('Failed to fetch server notifications:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchServerNotifications();
    const interval = setInterval(fetchServerNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchServerNotifications]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const dismissNotification = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDismissedIds((prev) => {
      const next = [...prev, id];
      try {
        localStorage.setItem('shiftpe_dismissed_notifications', JSON.stringify(next));
      } catch {}
      return next;
    });

    // If server notification, mark on backend
    if (!id.startsWith('local-') && token) {
      try {
        await fetch(`/api/notifications/${id}/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        });
      } catch {}
    }
  };

  const markAllRead = async () => {
    const allIds = notifications.map((n) => n.id);
    setDismissedIds(allIds);
    try {
      localStorage.setItem('shiftpe_dismissed_notifications', JSON.stringify(allIds));
    } catch {}

    if (token) {
      try {
        await fetch('/api/notifications/read-all', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        });
        fetchServerNotifications();
      } catch {}
    }

    showToast({
      type: 'info',
      title: 'All Notifications Marked Read'
    });
  };

  // Build combined notification list
  const notifications: NotificationItem[] = [];

  // 1. Mandatory Pending Onboarding Notification
  if (user && !user.onboardingCompleted) {
    notifications.push({
      id: 'local-onboarding-pending',
      type: 'urgent',
      title: 'Action Required: Complete Teammate Onboarding',
      message: 'You skipped initial onboarding. Please provide your department, designation, phone number, and permanent password.',
      timestamp: 'Action Pending',
      read: dismissedIds.includes('local-onboarding-pending'),
      actionText: 'Complete Profile Now',
      onAction: () => {
        setIsOpen(false);
        if (onOpenOnboarding) onOpenOnboarding();
      }
    });

    notifications.push({
      id: 'local-task-onboarding-assigned',
      type: 'task',
      title: 'New High-Priority Task Assigned',
      message: 'Task "Complete Teammate Onboarding & Profile" was automatically added to your Daily Checklist.',
      timestamp: 'Due in 7 days',
      read: dismissedIds.includes('local-task-onboarding-assigned'),
      actionText: 'View in Daily Checklist',
      onAction: () => {
        setIsOpen(false);
        if (onSelectTab) onSelectTab('Home');
      }
    });
  }

  // 2. Server notifications
  serverNotifications.forEach((sn) => {
    const isRead = sn.read || dismissedIds.includes(sn._id);
    notifications.push({
      id: sn._id,
      type: sn.type || 'info',
      title: sn.title,
      message: sn.message,
      timestamp: new Date(sn.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      read: isRead,
      priority: sn.priority,
      actionText: sn.actionText,
      onAction: () => {
        dismissNotification(sn._id);
        if (sn.actionLink && sn.actionLink.startsWith('#/')) {
          window.location.hash = sn.actionLink;
        }
      }
    });
  });

  // 3. Corporate Security Whitelist Confirmation
  notifications.push({
    id: 'local-security-whitelist-active',
    type: 'security',
    title: 'Corporate Whitelist Access Verified',
    message: `Signed in via authorized ShiftPe directory account (${user?.email}). Full internal CRM permissions active.`,
    timestamp: 'Active Session',
    read: dismissedIds.includes('local-security-whitelist-active')
  });

  // 4. Attendance Daily Prompt
  notifications.push({
    id: 'local-attendance-reminder',
    type: 'info',
    title: 'Daily Attendance Reminder',
    message: 'Make sure to clock in your daily shift and log your work contributions.',
    timestamp: 'Today',
    read: dismissedIds.includes('local-attendance-reminder'),
    actionText: 'Go to Attendance',
    onAction: () => {
      setIsOpen(false);
      if (onSelectTab) onSelectTab('Attendance');
    }
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const urgentNotification = notifications.find((n) => (n.type === 'urgent' || n.priority === 'high') && !n.read);

  // Sync urgent alert to parent if callback provided
  useEffect(() => {
    if (onUrgentAlertChange) {
      if (urgentNotification) {
        onUrgentAlertChange({
          title: urgentNotification.title,
          message: urgentNotification.message,
          actionText: urgentNotification.actionText,
          onAction: urgentNotification.onAction
        });
      } else {
        onUrgentAlertChange(null);
      }
    }
  }, [urgentNotification, onUrgentAlertChange]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertCircle size={15} />;
      case 'role_change':
        return <UserCheck size={15} />;
      case 'announcement':
        return <Megaphone size={15} />;
      case 'task':
        return <CheckSquare size={15} />;
      case 'security':
        return <ShieldCheck size={15} />;
      case 'attendance':
      case 'info':
      default:
        return <Clock size={15} />;
    }
  };

  const getIconBackground = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'var(--shiftpe-coral)';
      case 'role_change':
        return 'rgba(168, 85, 247, 0.15)';
      case 'announcement':
        return 'rgba(245, 158, 11, 0.15)';
      case 'task':
        return 'rgba(16, 185, 129, 0.15)';
      case 'security':
        return 'rgba(59, 130, 246, 0.15)';
      case 'attendance':
      case 'info':
      default:
        return 'rgba(100, 116, 139, 0.15)';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return '#ffffff';
      case 'role_change':
        return '#c084fc';
      case 'announcement':
        return '#f59e0b';
      case 'task':
        return 'var(--accent-green)';
      case 'security':
        return 'var(--accent-blue)';
      case 'attendance':
      case 'info':
      default:
        return 'var(--muted)';
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchServerNotifications();
        }}
        title="Notifications"
        aria-label="Notifications"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '34px',
          height: '34px',
          borderRadius: 'var(--radius-sm)',
          border: isOpen ? '1px solid var(--shiftpe-coral)' : '1px solid var(--line)',
          backgroundColor: isOpen ? 'var(--shiftpe-coral-light)' : 'var(--surface-subtle)',
          color: unreadCount > 0 ? 'var(--shiftpe-coral)' : 'var(--muted)',
          position: 'relative',
          transition: 'var(--transition)',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--shiftpe-coral)';
          e.currentTarget.style.color = 'var(--shiftpe-coral)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'var(--line)';
            e.currentTarget.style.color = unreadCount > 0 ? 'var(--shiftpe-coral)' : 'var(--muted)';
          }
        }}
      >
        <Bell size={16} />

        {/* Counter Badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: 'var(--shiftpe-coral)',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 800,
              minWidth: '17px',
              height: '17px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 2px 6px var(--shiftpe-coral-glow)',
              lineHeight: 1
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Notification Flyout */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '390px',
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4), var(--card-glow)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'slideDown 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Panel Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--surface-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={15} color="var(--shiftpe-coral)" />
              <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text)' }}>
                Notifications & Alerts
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--shiftpe-coral-light)',
                    color: 'var(--shiftpe-coral)'
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isCeo && (
                <button
                  onClick={() => setIsBroadcastOpen(true)}
                  title="Broadcast alert to all teammates"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--shiftpe-coral-light)',
                    border: '1px solid var(--shiftpe-coral-border)',
                    color: 'var(--shiftpe-coral)',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Megaphone size={12} />
                  <span>Alert</span>
                </button>
              )}

              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    fontSize: '11px',
                    color: 'var(--muted)',
                    fontWeight: 600,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--shiftpe-coral)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                <CheckCircle2 size={32} color="var(--accent-green)" style={{ margin: '0 auto 10px', opacity: 0.8 }} />
                <div style={{ fontSize: '13px', fontWeight: 600 }}>All caught up!</div>
                <div style={{ fontSize: '11.5px', color: 'var(--subtle)', marginTop: '4px' }}>
                  No pending alerts or notifications
                </div>
              </div>
            ) : (
              notifications.map((item) => {
                const isUrgent = item.type === 'urgent' || item.priority === 'high';
                return (
                  <div
                    key={item.id}
                    onClick={item.onAction}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--line)',
                      backgroundColor: item.read
                        ? 'transparent'
                        : isUrgent
                        ? 'rgba(255, 95, 85, 0.08)'
                        : 'var(--surface-subtle)',
                      display: 'flex',
                      gap: '12px',
                      cursor: item.onAction ? 'pointer' : 'default',
                      transition: 'background-color 0.15s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isUrgent
                        ? 'rgba(255, 95, 85, 0.14)'
                        : 'var(--panel-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = item.read
                        ? 'transparent'
                        : isUrgent
                        ? 'rgba(255, 95, 85, 0.08)'
                        : 'var(--surface-subtle)';
                    }}
                  >
                    {/* Status Icon */}
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: getIconBackground(item.type),
                        color: getIconColor(item.type),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                        boxShadow: isUrgent ? '0 2px 8px var(--shiftpe-coral-glow)' : 'none'
                      }}
                    >
                      {getNotificationIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          marginBottom: '3px'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '12.5px',
                            fontWeight: 700,
                            color: isUrgent ? 'var(--shiftpe-coral)' : 'var(--text)',
                            lineHeight: 1.3
                          }}
                        >
                          {item.title}
                        </span>

                        <span
                          style={{
                            fontSize: '10px',
                            color: isUrgent ? 'var(--shiftpe-coral)' : 'var(--subtle)',
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.timestamp}
                        </span>
                      </div>

                      <p
                        style={{
                          fontSize: '11.5px',
                          color: 'var(--muted)',
                          lineHeight: 1.45,
                          marginBottom: item.actionText ? '6px' : 0
                        }}
                      >
                        {item.message}
                      </p>

                      {item.actionText && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: isUrgent ? 'var(--shiftpe-coral)' : 'var(--accent-green)',
                            marginTop: '2px'
                          }}
                        >
                          <span>{item.actionText}</span>
                          <ExternalLink size={10} />
                        </div>
                      )}
                    </div>

                    {/* Dismiss Button */}
                    {!item.read && (
                      <button
                        onClick={(e) => dismissNotification(item.id, e)}
                        title="Dismiss notification"
                        aria-label="Dismiss notification"
                        style={{
                          color: 'var(--subtle)',
                          padding: '2px',
                          alignSelf: 'flex-start',
                          borderRadius: '4px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--subtle)')}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Panel Footer */}
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--surface-subtle)',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--subtle)'
            }}
          >
            <span>ShiftPe Portal v1.2</span>
            <span>Real-time notifications active</span>
          </div>
        </div>
      )}

      {/* CEO Broadcast Alert Modal */}
      {isCeo && (
        <BroadcastAlertModal
          isOpen={isBroadcastOpen}
          onClose={() => setIsBroadcastOpen(false)}
          onSuccess={() => fetchServerNotifications()}
        />
      )}
    </div>
  );
};
