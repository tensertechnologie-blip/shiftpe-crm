import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Megaphone, X, Send, AlertTriangle } from 'lucide-react';

interface BroadcastAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BroadcastAlertModal: React.FC<BroadcastAlertModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'urgent' | 'announcement' | 'info'>('urgent');
  const [priority, setPriority] = useState<'high' | 'normal'>('high');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setErrorMessage('Please provide both an alert title and message.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          type,
          priority: type === 'urgent' ? 'high' : priority
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch alert.');
      }

      showToast({
        type: 'success',
        title: 'Alert Broadcast Dispatched',
        message: 'All active teammates will receive this alert pop-up and notification.'
      });

      setTitle('');
      setMessage('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error sending alert broadcast.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="broadcast-modal-title"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--shiftpe-coral-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '26px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), var(--shiftpe-coral-glow)',
          animation: 'fadeIn 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'var(--shiftpe-coral-light)',
                border: '1px solid var(--shiftpe-coral-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--shiftpe-coral)'
              }}
            >
              <Megaphone size={18} />
            </div>
            <div>
              <h2 id="broadcast-modal-title" style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)' }}>
                Broadcast Urgent Alert
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                Executive alert broadcasted to all active ShiftPe teammates.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--line)',
              color: 'var(--muted)',
              cursor: 'pointer'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 82, 82, 0.1)',
              border: '1px solid rgba(255, 82, 82, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#ff8a8a',
              fontSize: '12.5px',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertTriangle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label
              htmlFor="alert-title"
              style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
            >
              Alert Headline / Title <span style={{ color: 'var(--shiftpe-coral)' }}>*</span>
            </label>
            <input
              id="alert-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. ⚡ Scheduled System Maintenance & Shift Ledger Audit"
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface-subtle)',
                color: 'var(--text)',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                htmlFor="alert-type"
                style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
              >
                Alert Type
              </label>
              <select
                id="alert-type"
                value={type}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setType(val);
                  if (val === 'urgent') setPriority('high');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--surface-subtle)',
                  color: 'var(--text)',
                  fontSize: '13px'
                }}
              >
                <option value="urgent">Urgent Alert (Top Banner + Pop-up)</option>
                <option value="announcement">Announcement</option>
                <option value="info">Informational Notification</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="alert-priority"
                style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
              >
                Priority Level
              </label>
              <select
                id="alert-priority"
                value={priority}
                disabled={type === 'urgent'}
                onChange={(e) => setPriority(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--surface-subtle)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  cursor: type === 'urgent' ? 'not-allowed' : 'pointer',
                  opacity: type === 'urgent' ? 0.75 : 1
                }}
              >
                <option value="high">High Priority</option>
                <option value="normal">Normal</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="alert-message"
              style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
            >
              Alert Content / Instructions <span style={{ color: 'var(--shiftpe-coral)' }}>*</span>
            </label>
            <textarea
              id="alert-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Detail the urgent notice, action items, or critical update for the team..."
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface-subtle)',
                color: 'var(--text)',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '9px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--line)',
                backgroundColor: 'transparent',
                color: 'var(--muted)',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '9px 18px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: 'var(--shiftpe-coral)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 10px var(--shiftpe-coral-glow)'
              }}
            >
              <Send size={14} />
              <span>{isSubmitting ? 'Dispatching...' : 'Broadcast to Team'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
