import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

interface CeoInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CeoInviteModal: React.FC<CeoInviteModalProps> = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'manager'>('member');
  const [designation, setDesignation] = useState('');
  const [domain, setDomain] = useState('Engineering');
  const [initialPassword, setInitialPassword] = useState('ShiftPeNewUser2026!');
  const [phone, setPhone] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!/@shiftpe\.(com|in)$/i.test(email)) {
      setStatusMessage({ type: 'error', text: 'Email must end with @shiftpe.in or @shiftpe.com' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          name,
          email: email.trim().toLowerCase(),
          role,
          designation,
          domain,
          phone,
          initialPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setStatusMessage({
        type: 'success',
        text: `Successfully invited ${data.user.name} (${data.user.email}). User can now log in and set up TOTP!`
      });
      setName('');
      setEmail('');
      setDesignation('');
      setPhone('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(0, 255, 136, 0.1)',
              color: 'var(--accent-green)'
            }}>
              <UserPlus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Invite New Team Member</h3>
              <p style={{ fontSize: '12px', color: 'var(--muted)' }}>Register by invite &bull; CEO Privilege</p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--muted)',
              border: '1px solid var(--line)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {statusMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12.5px',
            marginBottom: '16px',
            backgroundColor: statusMessage.type === 'success' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 82, 82, 0.1)',
            border: `1px solid ${statusMessage.type === 'success' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 82, 82, 0.3)'}`,
            color: statusMessage.type === 'success' ? 'var(--accent-green)' : '#ff8a8a'
          }}>
            {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maya Sharma"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Company Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maya@shiftpe.com"
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px'
                }}
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Domain</label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px'
                }}
              >
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
                <option value="Sales">Sales</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Designation</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Product Specialist"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Initial Temporary Password</label>
              <input
                type="text"
                value={initialPassword}
                onChange={(e) => setInitialPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--line)',
                fontSize: '13px',
                color: 'var(--muted)'
              }}
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '9px 20px',
                backgroundColor: 'var(--accent-green)',
                color: '#000000',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <UserPlus size={15} />
              <span>{isSubmitting ? 'Creating...' : 'Create Teammate'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
