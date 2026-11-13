import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
  Clock
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: 'urgent' | 'task' | 'security' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionText?: string;
  onAction?: () => void;
}

interface NotificationPanelProps {
  onOpenOnboarding?: () => void;
  onSelectTab?: (tab: any) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  onOpenOnboarding,
  onSelectTab
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('shiftpe_dismissed_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const panelRef = useRef<HTMLDivElement>(null);

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

  const dismissNotification = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDismissedIds(prev => {
      const next = [...prev, id];
      try {
        localStorage.setItem('shiftpe_dismissed_notifications', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id);
    setDismissedIds(allIds);
    try {
      localStorage.setItem('shiftpe_dismissed_notifications', JSON.stringify(allIds));
    } catch {}
  };

  // Build notifications list dynamically based on state
  const notifications: NotificationItem[] = [];

  // 1. Mandatory Pending Onboarding Notification
  if (user && !user.onboardingCompleted) {
    notifications.push({
      id: 'onboarding-pending',
      type: 'urgent',
      title: 'Action Required: Complete Teammate Onboarding',
      message: 'You skipped initial onboarding. Please provide your department, designation, phone number, and permanent password.',
      timestamp: 'Action Pending',
      read: dismissedIds.includes('onboarding-pending'),
      actionText: 'Complete Profile Now',
      onAction: () => {
        setIsOpen(false);
        if (onOpenOnboarding) onOpenOnboarding();
      }
    });

    notifications.push({
      id: 'task-onboarding-assigned',
      type: 'task',
      title: 'New High-Priority Task Assigned',
      message: 'Task "Complete Teammate Onboarding & Profile" was automatically added to your Daily Checklist.',
      timestamp: 'Due in 7 days',
      read: dismissedIds.includes('task-onboarding-assigned'),
      actionText: 'View in Daily Checklist',
      onAction: () => {
        setIsOpen(false);
        if (onSelectTab) onSelectTab('Home');
      }
    });
  }

  // 2. Corporate Security Whitelist Confirmation
  notifications.push({
    id: 'security-whitelist-active',
    type: 'security',
    title: 'Corporate Whitelist Access Verified',
    message: `Signed in via authorized ShiftPe directory account (${user?.email}). Full internal CRM permissions active.`,
    timestamp: 'Active Session',
    read: dismissedIds.includes('security-whitelist-active')
  });

  // 3. Attendance Daily Prompt
  notifications.push({
    id: 'attendance-reminder',
    type: 'info',
    title: 'Daily Attendance Reminder',
    message: 'Make sure to clock in your daily shift and log your work contributions.',
    timestamp: 'Today',
    read: dismissedIds.includes('attendance-reminder'),
    actionText: 'Go to Attendance',
    onAction: () => {
      setIsOpen(false);
      if (onSelectTab) onSelectTab('Attendance');
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const hasUrgent = notifications.some(n => n.type === 'urgent' && !n.read);

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '34px',
          height: '34px',
          borderRadius: 'var(--radius-sm)',
          border: isOpen ? '1px solid var(--shiftpe-coral)' : '1px solid var(--line)',
          backgroundColor: isOpen ? 'var(--shiftpe-coral-light)' : 'var(--surface-subtle)',
          color: hasUrgent ? 'var(--shiftpe-coral)' : 'var(--muted)',
          position: 'relative',
          transition: 'var(--transition)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--shiftpe-coral)';
          e.currentTarget.style.color = 'var(--shiftpe-coral)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'var(--line)';
            e.currentTarget.style.color = hasUrgent ? 'var(--shiftpe-coral)' : 'var(--muted)';
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
            width: '380px',
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4), var(--card-glow)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'slideDown 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <style>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-6px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Panel Header */}
          <div
            style={{
              padding: '14px 18px',
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
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--shiftpe-coral-light)',
                    color: 'var(--shiftpe-coral)'
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: '11.5px',
                  color: 'var(--muted)',
                  fontWeight: 600,
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--shiftpe-coral)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
              >
                Mark all read
              </button>
            )}
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
                const isUrgent = item.type === 'urgent';
                return (
                  <div
                    key={item.id}
                    onClick={item.onAction}
                    style={{
                      padding: '14px 18px',
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
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor:
                          item.type === 'urgent'
                            ? 'var(--shiftpe-coral)'
                            : item.type === 'task'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : item.type === 'security'
                            ? 'rgba(59, 130, 246, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color:
                          item.type === 'urgent'
                            ? '#ffffff'
                            : item.type === 'task'
                            ? 'var(--accent-green)'
                            : item.type === 'security'
                            ? 'var(--accent-blue)'
                            : 'var(--accent-amber)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                        boxShadow: item.type === 'urgent' ? '0 2px 8px var(--shiftpe-coral-glow)' : 'none'
                      }}
                    >
                      {item.type === 'urgent' && <AlertCircle size={16} />}
                      {item.type === 'task' && <CheckSquare size={16} />}
                      {item.type === 'security' && <ShieldCheck size={16} />}
                      {item.type === 'info' && <Clock size={16} />}
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
                          marginBottom: item.actionText ? '8px' : 0
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
                            fontSize: '11.5px',
                            fontWeight: 700,
                            color: isUrgent ? 'var(--shiftpe-coral)' : 'var(--accent-green)',
                            marginTop: '2px'
                          }}
                        >
                          <span>{item.actionText}</span>
                          <ExternalLink size={11} />
                        </div>
                      )}
                    </div>

                    {/* Dismiss Button */}
                    {!item.read && (
                      <button
                        onClick={(e) => dismissNotification(item.id, e)}
                        title="Dismiss notification"
                        style={{
                          color: 'var(--subtle)',
                          padding: '2px',
                          alignSelf: 'flex-start',
                          borderRadius: '4px',
                          transition: 'color 0.15s ease'
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
              padding: '10px 18px',
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
            <span>Real-time notifications</span>
          </div>
        </div>
      )}
    </div>
  );
};
