import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types';
import {
  X,
  Check,
  AlertCircle,
  User as UserIcon,
  Briefcase,
  Globe,
  Sparkles,
  Shield,
  Plus
} from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type TabKey = 'identity' | 'workplace' | 'social' | 'skills' | 'access';

const AVATAR_COLOR_PALETTES = [
  { name: 'ShiftPe Coral', hex: '#ff5f55' },
  { name: 'Royal Purple', hex: '#9333ea' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Ocean Blue', hex: '#3b82f6' },
  { name: 'Warm Amber', hex: '#f59e0b' },
  { name: 'Rose Pink', hex: '#ec4899' },
  { name: 'Cyan Slate', hex: '#06b6d4' }
];

const SUGGESTED_SKILLS = [
  'Product Strategy',
  'Leadership',
  'FinTech',
  'Operations',
  'React',
  'TypeScript',
  'Node.js',
  'MongoDB',
  'System Architecture',
  'UI/UX Design',
  'Growth Marketing',
  'Vendor Relations',
  'SLA Management',
  'Logistics',
  'Security'
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user, token, updateUserState, refreshUser } = useAuth();
  const { showToast } = useToast();

  const isExecutiveAdmin = user?.role === 'ceo' || user?.role === 'founder';

  const [activeTab, setActiveTab] = useState<TabKey>('identity');

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [domain, setDomain] = useState('Executive');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('Bengaluru HQ');
  const [workMode, setWorkMode] = useState<'office' | 'hybrid' | 'remote'>('office');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [workingHours, setWorkingHours] = useState('09:30 AM - 06:30 PM IST');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [avatarColor, setAvatarColor] = useState('#ff5f55');
  const [role, setRole] = useState<UserRole>('member');
  const [reportsTo, setReportsTo] = useState<string>('');

  // Skills Tag State
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const [teammates, setTeammates] = useState<Array<{ _id: string; name: string; designation: string; domain: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

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
    if (user && isOpen) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setDesignation(user.designation || '');
      setDomain(user.domain || 'Engineering');
      setBio((user as any).bio || '');
      setLocation((user as any).location || 'Bengaluru HQ');
      setWorkMode((user as any).workMode || 'office');
      setLinkedin((user as any).linkedin || '');
      setGithub((user as any).github || '');
      setWorkingHours((user as any).workingHours || '09:30 AM - 06:30 PM IST');
      setEmergencyContact((user as any).emergencyContact || '');
      setAvatarColor((user as any).avatarColor || '#ff5f55');
      setRole(user.role || 'member');
      const rId = typeof user.reportsTo === 'object' && user.reportsTo ? (user.reportsTo as any)._id : (user.reportsTo || '');
      setReportsTo(rId);
      setSkillsList(user.skills || []);
      setSkillInput('');
      setErrorMessage('');
      setSuccessMessage('');
      setActiveTab('identity');
    }
  }, [user, isOpen]);

  // Focus trapping and Esc key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleAddSkill = (skillToAdd?: string) => {
    const val = (skillToAdd || skillInput).trim();
    if (!val) return;
    if (!skillsList.some((s) => s.toLowerCase() === val.toLowerCase())) {
      setSkillsList([...skillsList, val]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkillsList(skillsList.filter((s) => s !== skillToRemove));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Full name is required');
      setActiveTab('identity');
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
      skills: skillsList,
      bio: bio.trim(),
      location: location.trim(),
      workMode,
      linkedin: linkedin.trim(),
      github: github.trim(),
      workingHours: workingHours.trim(),
      emergencyContact: emergencyContact.trim(),
      avatarColor
    };

    if (isExecutiveAdmin) {
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
        message: 'Your profile changes have been saved across the organization.'
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
      }, 650);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeLabel = (r: string) => {
    switch (r) {
      case 'founder':
        return designation.toLowerCase().includes('co-founder') ? 'CO-FOUNDER' : 'FOUNDER';
      case 'ceo':
        return 'CEO';
      case 'manager':
        return 'MANAGER';
      case 'member':
      default:
        return 'MEMBER';
    }
  };

  const getRoleBadgeStyle = (r: string) => {
    switch (r) {
      case 'founder':
        return {
          bg: 'rgba(255, 95, 85, 0.15)',
          color: 'var(--shiftpe-coral)',
          border: '1px solid var(--shiftpe-coral-border)'
        };
      case 'ceo':
        return {
          bg: 'rgba(180, 0, 255, 0.15)',
          color: '#d47aff',
          border: '1px solid rgba(180, 0, 255, 0.3)'
        };
      case 'manager':
        return {
          bg: 'rgba(56, 189, 248, 0.15)',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.3)'
        };
      case 'member':
      default:
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          color: '#72a4ff',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        };
    }
  };

  const currentRoleStyle = getRoleBadgeStyle(role);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '840px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65), var(--card-glow)',
          animation: 'fadeIn 0.2s ease',
          overflow: 'hidden'
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--surface-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: avatarColor,
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)'
              }}
            >
              {name.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 id="edit-profile-title" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                  Edit Profile & Workspace Identity
                </h2>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: currentRoleStyle.bg,
                    color: currentRoleStyle.color,
                    border: currentRoleStyle.border
                  }}
                >
                  {getRoleBadgeLabel(role)}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                Update your professional profile, workplace details, and specialties within ShiftPe.
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
              backgroundColor: 'transparent',
              color: 'var(--muted)',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body: Tabs and Content */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left Navigation Sidebar */}
          <div
            style={{
              width: '210px',
              borderRight: '1px solid var(--line)',
              backgroundColor: 'var(--surface-subtle)',
              padding: '16px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              flexShrink: 0
            }}
          >
            {[
              { id: 'identity', label: 'Identity & Bio', icon: UserIcon },
              { id: 'workplace', label: 'Workplace', icon: Briefcase },
              { id: 'social', label: 'Contact & Social', icon: Globe },
              { id: 'skills', label: 'Skills & Tags', icon: Sparkles, count: skillsList.length },
              ...(isExecutiveAdmin ? [{ id: 'access', label: 'Account Access', icon: Shield }] : [])
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabKey)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: isActive ? 'var(--panel)' : 'transparent',
                    color: isActive ? 'var(--shiftpe-coral)' : 'var(--muted)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== undefined && (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '99px',
                        backgroundColor: isActive ? 'var(--shiftpe-coral-light)' : 'rgba(255, 255, 255, 0.05)',
                        color: isActive ? 'var(--shiftpe-coral)' : 'var(--muted)'
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Quick Live Preview Box */}
            <div
              style={{
                marginTop: 'auto',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
                fontSize: '11px'
              }}
            >
              <div style={{ color: 'var(--subtle)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', fontSize: '10px' }}>
                Directory Preview
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: avatarColor,
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {name.charAt(0).toUpperCase() || 'U'}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {name || 'Your Name'}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {designation || 'Teammate'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Form Area */}
          <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* Feedback Notifications */}
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

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
              <div>
                {/* TAB 1: Identity & Bio */}
                {activeTab === 'identity' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                        placeholder="e.g. Ajay"
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
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label
                          htmlFor="profile-designation"
                          style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
                        >
                          Designation / Job Title
                        </label>
                        <input
                          id="profile-designation"
                          type="text"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          placeholder="e.g. Founder, Lead Architect, Growth Lead"
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
                          Department / Domain
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
                          <option value="Executive">Executive</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Design">Design</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Operations">Operations</option>
                          <option value="Sales">Sales</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="profile-bio"
                        style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
                      >
                        Bio & Mission Statement
                      </label>
                      <textarea
                        id="profile-bio"
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Brief summary of your background, responsibilities, and goals at ShiftPe..."
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--line)',
                          backgroundColor: 'var(--surface-subtle)',
                          color: 'var(--text)',
                          fontSize: '13px',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                        Avatar Accent Theme
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {AVATAR_COLOR_PALETTES.map((palette) => (
                          <button
                            key={palette.hex}
                            type="button"
                            onClick={() => setAvatarColor(palette.hex)}
                            title={palette.name}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: palette.hex,
                              border: avatarColor === palette.hex ? '3px solid #ffffff' : '2px solid transparent',
                              boxShadow: avatarColor === palette.hex ? '0 0 0 2px var(--shiftpe-coral)' : 'none',
                              cursor: 'pointer',
                              transition: 'transform 0.15s ease'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Workplace & Reporting */}
                {activeTab === 'workplace' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label
                          htmlFor="profile-location"
                          style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
                        >
                          Office Location / Base
                        </label>
                        <input
                          id="profile-location"
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Bengaluru HQ, India"
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
                          htmlFor="profile-workmode"
                          style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
                        >
                          Work Mode
                        </label>
                        <select
                          id="profile-workmode"
                          value={workMode}
                          onChange={(e) => setWorkMode(e.target.value as any)}
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
                          <option value="office">🏢 On-Site (Office)</option>
                          <option value="hybrid">🔄 Hybrid (Office & Remote)</option>
                          <option value="remote">🌐 Remote First</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="profile-reports-to"
                        style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
                      >
                        Reports To (Manager / Reporting Line)
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
                      <span style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                        Defines your position in the company organization tree.
                      </span>
                    </div>

                    <div>
                      <label
                        htmlFor="profile-hours"
                        style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
                      >
                        Working Hours / Core Availability
                      </label>
                      <input
                        id="profile-hours"
                        type="text"
                        value={workingHours}
                        onChange={(e) => setWorkingHours(e.target.value)}
                        placeholder="e.g. 09:30 AM - 06:30 PM IST"
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
                  </div>
                )}

                {/* TAB 3: Contact & Social */}
                {activeTab === 'social' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label
                          htmlFor="profile-phone"
                          style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
                        >
                          Direct Phone Number
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
                          htmlFor="profile-emergency"
                          style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
                        >
                          Emergency / Secondary Contact
                        </label>
                        <input
                          id="profile-emergency"
                          type="text"
                          value={emergencyContact}
                          onChange={(e) => setEmergencyContact(e.target.value)}
                          placeholder="+91 9876543219 (Relation)"
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
                    </div>

                    <div>
                      <label
                        htmlFor="profile-linkedin"
                        style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
                      >
                        LinkedIn Profile URL
                      </label>
                      <input
                        id="profile-linkedin"
                        type="url"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/username"
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
                        htmlFor="profile-github"
                        style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
                      >
                        GitHub / Portfolio URL
                      </label>
                      <input
                        id="profile-github"
                        type="url"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        placeholder="https://github.com/username or portfolio link"
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
                  </div>
                )}

                {/* TAB 4: Skills & Tags */}
                {activeTab === 'skills' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label
                        htmlFor="profile-skill-input"
                        style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
                      >
                        Add Specialties & Technical Skills
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          id="profile-skill-input"
                          type="text"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={handleSkillKeyDown}
                          placeholder="Type a skill and press Enter or click Add..."
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--line)',
                            backgroundColor: 'var(--surface-subtle)',
                            color: 'var(--text)',
                            fontSize: '13px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddSkill()}
                          style={{
                            padding: '10px 16px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--shiftpe-coral-light)',
                            border: '1px solid var(--shiftpe-coral-border)',
                            color: 'var(--shiftpe-coral)',
                            fontWeight: 700,
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <Plus size={14} />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>

                    {/* Active Skill Chips */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                        Current Specialties ({skillsList.length})
                      </div>
                      {skillsList.length === 0 ? (
                        <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--line)', color: 'var(--muted)', fontSize: '12.5px', textAlign: 'center' }}>
                          No skills added yet. Type above or click from suggestions below.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {skillsList.map((skill) => (
                            <span
                              key={skill}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 10px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--panel)',
                                border: '1px solid var(--line)',
                                fontSize: '12px',
                                color: 'var(--text)'
                              }}
                            >
                              <span>{skill}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(skill)}
                                aria-label={`Remove ${skill}`}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--muted)',
                                  cursor: 'pointer',
                                  padding: 0,
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Suggested Skills */}
                    <div>
                      <div style={{ fontSize: '11.5px', color: 'var(--subtle)', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>
                        Popular Suggestions
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {SUGGESTED_SKILLS.filter((s) => !skillsList.includes(s)).slice(0, 10).map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleAddSkill(suggestion)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--surface-subtle)',
                              border: '1px solid var(--line)',
                              color: 'var(--muted)',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Plus size={10} />
                            <span>{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: Account Access (Executive Admins only) */}
                {activeTab === 'access' && isExecutiveAdmin && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--surface-subtle)',
                        border: '1px solid var(--shiftpe-coral-border)',
                        fontSize: '12.5px',
                        color: 'var(--text)'
                      }}
                    >
                      <strong style={{ color: 'var(--shiftpe-coral)' }}>Executive Privilege Notice:</strong> As a Founder / Executive Administrator, you can configure system security roles. There is at most one CEO position permitted in the organization.
                    </div>

                    <div>
                      <label
                        htmlFor="profile-role"
                        style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}
                      >
                        Account Role
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
                        <option value="founder">Founder (Founding Executive)</option>
                        <option value="ceo">CEO (Chief Executive Officer — Single Seat)</option>
                        <option value="manager">Manager (Department Lead)</option>
                        <option value="member">Member (Standard Teammate)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--line)',
                  marginTop: '20px'
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  All updates reflect immediately in the Team Directory & Org Tree.
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
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
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      padding: '9px 24px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      backgroundColor: 'var(--shiftpe-coral)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 10px var(--shiftpe-coral-glow)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Check size={14} />
                    <span>{isLoading ? 'Saving...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
