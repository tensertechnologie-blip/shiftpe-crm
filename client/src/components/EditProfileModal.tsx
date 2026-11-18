import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';
import { X, Check, AlertCircle } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user, token, updateUserState, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [designation, setDesignation] = useState('');
  const [domain, setDomain] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [reportsTo, setReportsTo] = useState<string>('');
  const [teammates, setTeammates] = useState<Array<{ _id: string; name: string; designation: string; domain: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const isCeo = user?.role === 'ceo';

  useEffect(() => {
    if (!isOpen) return;
    const fetchTeammates = async () => {
      try {
        const res = await fetch('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          const list = (data.users || []).filter((u: any) => u._id !== user?._id && u.status === 'active');
          setTeammates(list);
        }
      } catch (err) {
        console.error('Failed to load teammates:', err);
      }
    };
    fetchTeammates();
  }, [isOpen, token, user?._id]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setSkills((user.skills || []).join(', '));
      setDesignation(user.designation || '');
      setDomain(user.domain || 'Engineering');
      setRole((user.role as 'ceo' | 'member') || 'member');
      const rId = typeof user.reportsTo === 'object' && user.reportsTo ? (user.reportsTo as any)._id : (user.reportsTo || '');
      setReportsTo(rId);
    }
  }, [user, isOpen]);

  // Focus trapping and Esc key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Full name is required');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const payload: any = {
      name: name.trim(),
      phone: phone.trim(),
      designation: designation.trim(),
      domain: domain.trim(),
      reportsTo: reportsTo ? reportsTo : null,
      skills: skills.split(',').map((s) => s.trim()).filter(Boolean)
    };

    if (isCeo) {
      payload.role = role;
    }

    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccessMessage('Profile updated successfully!');
      showToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile changes have been saved.'
      });
      if (data.user) {
        updateUserState(data.user);
      }
      if (refreshUser) {
        await refreshUser();
      }

      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating profile');
    } finally {
      setIsLoading(false);
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
        zIndex: 1100,
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
        aria-labelledby="edit-profile-title"
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), var(--card-glow)',
          animation: 'fadeIn 0.2s ease'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: isCeo ? 'var(--shiftpe-coral)' : 'var(--accent-blue)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px var(--shiftpe-coral-glow)'
              }}
            >
              {name.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 id="edit-profile-title" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                Edit Your Profile
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                Update your identity, contact information, and technical specialties.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close edit profile modal"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--line)',
              color: 'var(--muted)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 82, 82, 0.1)',
              border: '1px solid rgba(255, 82, 82, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#ff8a8a',
              fontSize: '12.5px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-green)',
              fontSize: '12.5px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Check size={15} />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Full Name */}
          <div>
            <label
              htmlFor="profile-name"
              style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
            >
              Full Name <span style={{ color: 'var(--shiftpe-coral)' }}>*</span>
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ajay Founder"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface-subtle)',
                color: 'var(--text)',
                fontSize: '13px'
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
              This name appears on your identity badge, directory cards, and leaderboards.
            </span>
          </div>

          {/* Phone & Domain */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }} className="modal-grid-2">
            <div>
              <label
                htmlFor="profile-phone"
                style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
              >
                Direct Phone
              </label>
              <input
                id="profile-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--surface-subtle)',
                  color: 'var(--text)',
                  fontSize: '13px'
                }}
              />
            </div>

            <div>
              <label
                htmlFor="profile-domain"
                style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
              >
                Domain / Department
              </label>
              <select
                id="profile-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--surface-subtle)',
                  color: 'var(--text)',
                  fontSize: '13px'
                }}
              >
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
                <option value="Sales">Sales</option>
                <option value="Executive">Executive</option>
              </select>
            </div>
          </div>

          {/* Designation & Reports To */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }} className="modal-grid-2">
            <div>
              <label
                htmlFor="profile-designation"
                style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
              >
                Designation
              </label>
              <input
                id="profile-designation"
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Founder, Lead Engineer, Designer"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--surface-subtle)',
                  color: 'var(--text)',
                  fontSize: '13px'
                }}
              />
            </div>

            <div>
              <label
                htmlFor="profile-reports-to"
                style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
              >
                Reports To
              </label>
              <select
                id="profile-reports-to"
                value={reportsTo}
                onChange={(e) => setReportsTo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--surface-subtle)',
                  color: 'var(--text)',
                  fontSize: '13px'
                }}
              >
                <option value="">None (Top Level / Direct Founder)</option>
                {teammates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.designation || t.domain})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Account Role (Only shown to CEO Administrator) */}
          {isCeo && (
            <div>
              <label
                htmlFor="profile-role"
                style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
              >
                Account Role <span style={{ color: 'var(--shiftpe-coral)' }}>(CEO)</span>
              </label>
              <select
                id="profile-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line)',
                  backgroundColor: 'var(--surface-subtle)',
                  color: 'var(--text)',
                  fontSize: '13px'
                }}
              >
                <option value="ceo">CEO (Executive Administrator)</option>
                <option value="manager">Manager (Department Lead)</option>
                <option value="member">Member (Standard Teammate)</option>
              </select>
            </div>
          )}

          {/* Core Skills */}
          <div>
            <label
              htmlFor="profile-skills"
              style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
            >
              Technical Core Skills (comma-separated)
            </label>
            <input
              id="profile-skills"
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Leadership, Product Strategy, FinTech, React, Python"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface-subtle)',
                color: 'var(--text)',
                fontSize: '13px'
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '9px 18px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--line)',
                backgroundColor: 'transparent',
                color: 'var(--muted)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '9px 22px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--shiftpe-coral)',
                color: 'var(--button-text-on-coral)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 10px var(--shiftpe-coral-glow)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isLoading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check size={15} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
