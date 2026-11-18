import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration ?? 4500;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="var(--accent-green)" />;
      case 'error':
        return <AlertCircle size={18} color="#ff5252" />;
      case 'warning':
        return <AlertTriangle size={18} color="#f59e0b" />;
      case 'info':
      default:
        return <Info size={18} color="var(--shiftpe-coral)" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'rgba(16, 185, 129, 0.4)';
      case 'error':
        return 'rgba(255, 82, 82, 0.4)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.4)';
      case 'info':
      default:
        return 'var(--shiftpe-coral-border)';
    }
  };

  const getGlowColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '0 8px 24px rgba(16, 185, 129, 0.15)';
      case 'error':
        return '0 8px 24px rgba(255, 82, 82, 0.15)';
      case 'warning':
        return '0 8px 24px rgba(245, 158, 11, 0.15)';
      case 'info':
      default:
        return '0 8px 24px var(--shiftpe-coral-glow)';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {/* Floating Pop-up Toast Container */}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
          width: 'calc(100vw - 40px)',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            style={{
              pointerEvents: 'auto',
              backgroundColor: 'var(--panel)',
              border: `1px solid ${getBorderColor(t.type)}`,
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              boxShadow: `${getGlowColor(t.type)}, 0 10px 30px rgba(0, 0, 0, 0.5)`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div style={{ marginTop: '2px', flexShrink: 0 }}>
              {getToastIcon(t.type)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
                {t.title}
              </div>
              {t.message && (
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', lineHeight: 1.4 }}>
                  {t.message}
                </div>
              )}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss alert"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                padding: '2px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
