import React from 'react';
import { AlertCircle, X, ChevronRight } from 'lucide-react';

interface UrgentAlertBannerProps {
  title: string;
  message: string;
  onDismiss: () => void;
  onAction?: () => void;
  actionText?: string;
}

export const UrgentAlertBanner: React.FC<UrgentAlertBannerProps> = ({
  title,
  message,
  onDismiss,
  onAction,
  actionText
}) => {
  return (
    <div
      role="alert"
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        borderBottom: '1px solid rgba(239, 68, 68, 0.35)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        animation: 'slideDown 0.3s ease',
        position: 'relative',
        zIndex: 100
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        <div
          style={{
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0
          }}
        >
          <AlertCircle size={12} />
          URGENT ALERT
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <strong style={{ fontWeight: 700 }}>{title}:</strong>
          <span style={{ color: 'var(--muted)' }}>{message}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {actionText && (
          <button
            onClick={onAction}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ff8a8a',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>{actionText}</span>
            <ChevronRight size={12} />
          </button>
        )}

        <button
          onClick={onDismiss}
          aria-label="Dismiss alert banner"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
