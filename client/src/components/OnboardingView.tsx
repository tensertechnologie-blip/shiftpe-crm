import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShiftPeLogo } from './ShiftPeLogo';
import {
  UserCheck,
  Briefcase,
  Phone,
  Layers,
  Lock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  X,
  Clock
} from 'lucide-react';

const SUGGESTED_DOMAINS = [
  'Engineering',
  'Design',
  'Marketing',
  'Operations',
  'Sales',
  'Executive'
];

const POPULAR_SKILLS = [
  'React',
  'TypeScript',
  'Node.js',
  'MongoDB',
  'UI/UX Design',
  'Figma',
  'Product Strategy',
  'Customer Operations',
  'Growth Marketing',
  'Data Analytics'
];

interface OnboardingViewProps {
  isModal?: boolean;
  onClose?: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ isModal = false, onClose }) => {
  const { user, token, updateUserState } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [domain, setDomain] = useState(user?.domain && user.domain !== 'General' ? user.domain : 'Engineering');
  const [designation, setDesignation] = useState(user?.designation && user.designation !== 'Team Member' ? user.designation : '');
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const addSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (!skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    setErrorMessage('');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/onboarding/skip', {
        method: 'POST',
        headers,
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to postpone onboarding');
      }
      if (data.user) {
        updateUserState(data.user);
      }
      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error postponing onboarding');
    } finally {
      setIsSkipping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Phone number is required for official contact.');
      return;
    }

    if (!designation.trim()) {
      setErrorMessage('Designation / Job Title is required.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        setErrorMessage('New password must be at least 8 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          domain,
          designation: designation.trim(),
          skills,
          newPassword: newPassword ? newPassword : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete teammate onboarding');
      }

      if (data.user) {
        updateUserState(data.user);
      }
      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error during onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const content = (
    <div style={{
      width: '100%',
      maxWidth: '620px',
      backgroundColor: 'var(--panel)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg)',
      padding: '36px 40px',
      boxShadow: 'var(--card-shadow)',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Close button if modal */}
      {isModal && onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--muted)',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <ShiftPeLogo size="md" showSubtitle subtitleText="Teammate Onboarding & Profile Setup" />
        
        <h2 style={{ fontSize: '20px', fontWeight: 800, marginTop: '16px', color: 'var(--text)' }}>
          Welcome to ShiftPe, {name || 'Teammate'}!
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
          Complete your teammate profile and set your permanent password to unlock the workspace.
        </p>
      </div>

      {errorMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 14px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-sm)',
          color: '#ef4444',
          fontSize: '13px',
          marginBottom: '20px'
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Identity Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ajay Kumar"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 34px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  color: 'var(--text)',
                  fontSize: '13px'
                }}
              />
              <UserCheck size={14} color="var(--subtle)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
              Official Phone Number
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 34px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  color: 'var(--text)',
                  fontSize: '13px'
                }}
              />
              <Phone size={14} color="var(--subtle)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>
        </div>

        {/* Department & Designation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
              Department / Domain
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 34px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  color: 'var(--text)',
                  fontSize: '13px'
                }}
              >
                {SUGGESTED_DOMAINS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <Layers size={14} color="var(--subtle)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
              Job Title / Designation
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 34px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  color: 'var(--text)',
                  fontSize: '13px'
                }}
              />
              <Briefcase size={14} color="var(--subtle)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>
        </div>

        {/* Skills & Tech Stack */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
            Skills & Expertise (Press Enter or click suggestions)
          </label>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--line)',
            minHeight: '44px',
            alignItems: 'center'
          }}>
            {skills.map(skill => (
              <span
                key={skill}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--shiftpe-coral-light)',
                  color: 'var(--shiftpe-coral)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  border: '1px solid var(--shiftpe-coral-border)'
                }}
              >
                <span>{skill}</span>
                <X
                  size={11}
                  style={{ cursor: 'pointer' }}
                  onClick={() => removeSkill(skill)}
                />
              </span>
            ))}

            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill(skillInput);
                }
              }}
              placeholder={skills.length === 0 ? "e.g. React, TypeScript, Figma..." : "Add another..."}
              style={{
                flex: 1,
                minWidth: '120px',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text)',
                fontSize: '12.5px',
                outline: 'none'
              }}
            />
          </div>

          {/* Popular skill suggestion chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--subtle)', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Sparkles size={11} />
              <span>Suggestions:</span>
            </span>
            {POPULAR_SKILLS.filter(s => !skills.includes(s)).slice(0, 6).map(s => (
              <button
                type="button"
                key={s}
                onClick={() => addSkill(s)}
                style={{
                  fontSize: '11px',
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface-subtle)',
                  border: '1px solid var(--line)',
                  color: 'var(--muted)',
                  cursor: 'pointer'
                }}
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {/* Set Permanent Password */}
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--surface-subtle)',
          border: '1px solid var(--line)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--shiftpe-coral)' }}>
            <Lock size={15} />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>Set Permanent Security Password</span>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '12px' }}>
            Replace the temporary password received in your business email with your own permanent password.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password (min 8 chars)"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  color: 'var(--text)',
                  fontSize: '12.5px'
                }}
              />
            </div>

            <div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--line)',
                  color: 'var(--text)',
                  fontSize: '12.5px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons: Skip for now + Submit */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSkipping || isSubmitting}
            style={{
              padding: '12px 18px',
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--line)',
              color: 'var(--muted)',
              fontWeight: 600,
              fontSize: '13px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'var(--transition)'
            }}
          >
            <Clock size={14} />
            <span>{isSkipping ? 'Postponing...' : 'Skip for now'}</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isSkipping}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: 'var(--shiftpe-coral)',
              color: 'var(--button-text-on-coral)',
              fontWeight: 700,
              fontSize: '14px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px var(--shiftpe-coral-glow)',
              transition: 'var(--transition)',
              cursor: 'pointer'
            }}
          >
            {isSubmitting ? (
              <span>Saving Teammate Profile...</span>
            ) : (
              <>
                <span>Complete Onboarding & Enter ShiftPe</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        <p style={{ fontSize: '11px', color: 'var(--subtle)', textAlign: 'center', marginTop: '12px' }}>
          💡 If skipped, a task will be added to your Assigned Tasks checklist and Notification Panel to complete later.
        </p>
      </form>
    </div>
  );

  if (isModal) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        overflowY: 'auto'
      }}>
        {content}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative'
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '25%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--shiftpe-coral-glow) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {content}
    </div>
  );
};
