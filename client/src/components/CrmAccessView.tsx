import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DirectoryEntry } from '../types';
import {
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Mail,
  KeyRound
} from 'lucide-react';

export const CrmAccessView: React.FC = () => {
  const { user, token } = useAuth();
  const [directory, setDirectory] = useState<DirectoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'active' | 'revoked'>('All');

  // Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('Senior Software Engineer');
  const [department, setDepartment] = useState('Engineering');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDirectory = async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/access/directory', {
        headers,
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setDirectory(data.directory || []);
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to load directory' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error loading directory' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, [token]);

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);

    if (!email.trim()) {
      setActionMessage({ type: 'error', text: 'Business email is required.' });
      return;
    }

    if (!/@shiftpe\.(in|com)$/i.test(email.trim())) {
      setActionMessage({ type: 'error', text: 'Email must end with @shiftpe.in or @shiftpe.com.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/access/directory/grant', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          designation: designation.trim(),
          department: department.trim(),
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        setEmail('');
        setName('');
        setNotes('');
        await fetchDirectory();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to grant access.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error granting access.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (targetEmail: string) => {
    if (!window.confirm(`Are you sure you want to revoke CRM access for ${targetEmail}? They will not be able to sign in or register.`)) {
      return;
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/access/directory/revoke', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ email: targetEmail })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        await fetchDirectory();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to revoke access.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error revoking access.' });
    }
  };

  const handleRestore = async (targetEmail: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/access/directory/restore', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ email: targetEmail })
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', text: data.message });
        await fetchDirectory();
      } else {
        setActionMessage({ type: 'error', text: data.error || 'Failed to restore access.' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Error restoring access.' });
    }
  };

  const filtered = directory.filter(entry => {
    const matchesSearch =
      entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' ? true : entry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalAuthorized = directory.filter(d => d.status === 'active').length;
  const totalRegistered = directory.filter(d => d.status === 'active' && d.registered).length;
  const pendingSignup = directory.filter(d => d.status === 'active' && !d.registered).length;
  const totalRevoked = directory.filter(d => d.status === 'revoked').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{
        padding: '24px 28px',
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--card-shadow)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--shiftpe-coral-light)',
            border: '1px solid var(--shiftpe-coral-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--shiftpe-coral)'
          }}>
            <KeyRound size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text)' }}>
                CRM Access & Teammate Directory
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 95, 85, 0.12)',
                color: 'var(--shiftpe-coral)',
                border: '1px solid var(--shiftpe-coral-border)'
              }}>
                CEO & Founder Control
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
              Authorize corporate business emails to grant instant access for sign up and sign in to ShiftPe CRM.
            </p>
          </div>
        </div>

        <button
          onClick={fetchDirectory}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--line)',
            backgroundColor: 'var(--surface-subtle)',
            fontSize: '12.5px',
            fontWeight: 600,
            color: 'var(--muted)',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
        >
          <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
          <span>Refresh Roster</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div style={{
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Authorized Whitelist</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
            {totalAuthorized}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--subtle)', marginTop: '4px' }}>Active @shiftpe.in emails</div>
        </div>

        <div style={{
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Active Teammates</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-green)', marginTop: '4px' }}>
            {totalRegistered}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--subtle)', marginTop: '4px' }}>Registered & Logged in</div>
        </div>

        <div style={{
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Pending Signups</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--status-pending)', marginTop: '4px' }}>
            {pendingSignup}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--subtle)', marginTop: '4px' }}>Authorized, awaiting signup</div>
        </div>

        <div style={{
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Revoked Access</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--shiftpe-coral)', marginTop: '4px' }}>
            {totalRevoked}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--subtle)', marginTop: '4px' }}>Blocked from login</div>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 95, 85, 0.12)',
          border: `1px solid ${actionMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 95, 85, 0.3)'}`,
          color: actionMessage.type === 'success' ? 'var(--accent-green)' : 'var(--shiftpe-coral)',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Grant Access Form Card */}
      <div style={{
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <UserPlus size={18} color="var(--shiftpe-coral)" />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
            Authorize New Teammate
          </h2>
        </div>

        <form onSubmit={handleGrantAccess} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
              Business Email ID *
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--subtle)' }} />
              <input
                type="email"
                required
                placeholder="e.g. shubham.yambadwar@shiftpe.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  backgroundColor: 'var(--surface-subtle)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text)',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
              Teammate Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Shubham Yambadwar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontSize: '13px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
              Department / Domain
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontSize: '13px'
              }}
            >
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Operations">Operations</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Executive">Executive</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
              Designation / Role
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Frontend Engineer"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
              Notes / Access Scope
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="e.g. Core web platform contributor; authorized by CEO"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  backgroundColor: 'var(--surface-subtle)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text)',
                  fontSize: '13px'
                }}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '9px 20px',
                  backgroundColor: 'var(--shiftpe-coral)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 10px var(--shiftpe-coral-glow)',
                  whiteSpace: 'nowrap',
                  transition: 'var(--transition)'
                }}
              >
                {isSubmitting ? 'Granting Access...' : 'Grant Portal Access'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Directory Table Card */}
      <div style={{
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--card-shadow)',
        overflow: 'hidden'
      }}>
        {/* Table Filters Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--subtle)' }} />
              <input
                type="text"
                placeholder="Search email, name, role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  backgroundColor: 'var(--surface-subtle)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text)',
                  fontSize: '12.5px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              {(['All', 'active', 'revoked'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    backgroundColor: statusFilter === tab ? 'var(--shiftpe-coral-light)' : 'transparent',
                    color: statusFilter === tab ? 'var(--shiftpe-coral)' : 'var(--muted)',
                    border: statusFilter === tab ? '1px solid var(--shiftpe-coral-border)' : '1px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  {tab === 'All' ? 'All Records' : tab}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--subtle)' }}>
            Showing {filtered.length} of {directory.length} directory entries
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-subtle)', borderBottom: '1px solid var(--line)', color: 'var(--muted)', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 20px', fontWeight: 700 }}>Teammate Identity</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Department & Role</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Access Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Account Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Granted By</th>
                <th style={{ padding: '12px 20px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)' }}>
                    No directory records match your search filter.
                  </td>
                </tr>
              ) : (
                filtered.map(entry => {
                  const isRevoked = entry.status === 'revoked';
                  const isSelf = user?.email.toLowerCase() === entry.email.toLowerCase();

                  return (
                    <tr
                      key={entry._id}
                      style={{
                        borderBottom: '1px solid var(--line)',
                        backgroundColor: isRevoked ? 'rgba(255, 95, 85, 0.03)' : 'transparent',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isRevoked ? 'rgba(255, 95, 85, 0.06)' : 'var(--panel-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isRevoked ? 'rgba(255, 95, 85, 0.03)' : 'transparent')}
                    >
                      {/* Name & Email */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: isRevoked ? 'rgba(255, 95, 85, 0.2)' : 'var(--shiftpe-coral-light)',
                            color: isRevoked ? 'var(--shiftpe-coral)' : 'var(--shiftpe-coral)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '12px',
                            flexShrink: 0
                          }}>
                            {entry.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{entry.name}</span>
                              {isSelf && (
                                <span style={{ fontSize: '10px', backgroundColor: 'var(--surface-pill)', padding: '1px 5px', borderRadius: '4px', color: 'var(--subtle)' }}>
                                  You
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                              {entry.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department & Role */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{entry.designation}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--subtle)', marginTop: '2px' }}>
                          {entry.department}
                        </div>
                      </td>

                      {/* Access Status */}
                      <td style={{ padding: '14px 16px' }}>
                        {entry.status === 'active' ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                            color: 'var(--accent-green)',
                            border: '1px solid rgba(16, 185, 129, 0.25)'
                          }}>
                            <CheckCircle2 size={12} />
                            <span>Authorized</span>
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'rgba(255, 95, 85, 0.12)',
                            color: 'var(--shiftpe-coral)',
                            border: '1px solid rgba(255, 95, 85, 0.25)'
                          }}>
                            <XCircle size={12} />
                            <span>Revoked</span>
                          </span>
                        )}
                      </td>

                      {/* Account Registration Status */}
                      <td style={{ padding: '14px 16px' }}>
                        {entry.registered ? (
                          <span style={{
                            fontSize: '11.5px',
                            fontWeight: 600,
                            color: entry.onboardingCompleted ? 'var(--accent-green)' : 'var(--status-pending)'
                          }}>
                            {entry.onboardingCompleted ? 'Profile Complete' : 'Onboarding Pending'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: 'var(--subtle)', fontWeight: 500 }}>
                            Pending Sign Up
                          </span>
                        )}
                      </td>

                      {/* Granted By */}
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--muted)' }}>
                        {entry.addedByEmail}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        {isSelf ? (
                          <span style={{ fontSize: '11.5px', color: 'var(--subtle)' }}>Executive Account</span>
                        ) : entry.status === 'active' ? (
                          <button
                            onClick={() => handleRevoke(entry.email)}
                            title="Revoke access"
                            style={{
                              padding: '5px 10px',
                              backgroundColor: 'rgba(255, 95, 85, 0.1)',
                              border: '1px solid rgba(255, 95, 85, 0.25)',
                              color: 'var(--shiftpe-coral)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'var(--transition)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--shiftpe-coral)';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 95, 85, 0.1)';
                              e.currentTarget.style.color = 'var(--shiftpe-coral)';
                            }}
                          >
                            Revoke Access
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestore(entry.email)}
                            title="Restore access"
                            style={{
                              padding: '5px 10px',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              color: 'var(--accent-green)',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'var(--transition)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--accent-green)';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                              e.currentTarget.style.color = 'var(--accent-green)';
                            }}
                          >
                            Restore Access
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
