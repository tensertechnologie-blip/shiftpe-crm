import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import {
  Users,
  Search,
  Phone,
  Mail,
  Briefcase,
  ChevronRight,
  Edit2,
  Check,
  X,
  AlertCircle,
  Network
} from 'lucide-react';

interface ProfileData {
  user: User;
  chainToCeo: Array<{ _id: string; name: string; designation: string; domain: string; role: string }>;
  directReports: Array<{ _id: string; name: string; designation: string; domain: string; role: string }>;
}

export const PeopleView: React.FC = () => {
  const { user: currentUser, token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const domains = ['All', 'Engineering', 'Design', 'Marketing', 'Operations', 'Sales', 'Executive'];
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editDomain, setEditDomain] = useState('');
  const [editReportsTo, setEditReportsTo] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchUsers = async () => {
    try {
      const url = new URL('/api/users', window.location.origin);
      if (selectedDomain !== 'All') url.searchParams.set('domain', selectedDomain);
      if (searchQuery.trim()) url.searchParams.set('search', searchQuery.trim());

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedDomain, searchQuery]);

  const loadProfile = async (id: string) => {
    setSelectedProfileId(id);
    setIsEditing(false);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/users/${id}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        setEditPhone(data.user.phone || '');
        setEditSkills((data.user.skills || []).join(', '));
        setEditDesignation(data.user.designation || '');
        setEditDomain(data.user.domain || '');
        setEditReportsTo(typeof data.user.reportsTo === 'object' && data.user.reportsTo ? data.user.reportsTo._id : (data.user.reportsTo || ''));
        setEditStatus(data.user.status || 'active');
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedProfileId) return;
    setErrorMessage('');
    setSuccessMessage('');

    const payload: any = {
      phone: editPhone.trim(),
      skills: editSkills.split(',').map((s) => s.trim()).filter(Boolean)
    };

    if (currentUser?.role === 'ceo') {
      payload.designation = editDesignation.trim();
      payload.domain = editDomain;
      payload.status = editStatus;
      payload.reportsTo = editReportsTo ? editReportsTo : null;
    }

    try {
      const res = await fetch(`/api/users/${selectedProfileId}`, {
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
        throw new Error(data.error || 'Failed to update user profile');
      }

      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      loadProfile(selectedProfileId);
      fetchUsers();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div>
      {/* Header & Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={24} color="var(--accent-green)" />
            <span>People Directory</span>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '4px' }}>
            Explore teammates across domains, reporting chains to CEO, and technical specialties.
          </p>
        </div>

        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 14px',
          width: '280px'
        }}>
          <Search size={16} color="var(--muted)" />
          <input
            type="text"
            placeholder="Search by name, skill, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: '13px',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* Domain Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {domains.map((dom) => {
          const isActive = selectedDomain === dom;
          return (
            <button
              key={dom}
              onClick={() => setSelectedDomain(dom)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12.5px',
                fontWeight: isActive ? 700 : 500,
                backgroundColor: isActive ? 'var(--accent-green)' : 'var(--panel)',
                color: isActive ? '#000000' : 'var(--muted)',
                border: isActive ? '1px solid var(--accent-green)' : '1px solid var(--line)',
                transition: 'var(--transition)'
              }}
            >
              {dom}
            </button>
          );
        })}
      </div>

      {/* Members Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
        {users.map((u) => (
          <div
            key={u._id}
            onClick={() => loadProfile(u._id)}
            style={{
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              cursor: 'pointer',
              transition: 'var(--transition)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--line-strong)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--line)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: u.role === 'ceo' ? 'var(--accent-purple)' : 'var(--accent-blue)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--text)' }}>
                      {u.name}
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                      {u.designation}
                    </div>
                  </div>
                </div>

                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: u.role === 'ceo' ? 'rgba(180, 0, 255, 0.15)' : 'rgba(59, 123, 245, 0.15)',
                  color: u.role === 'ceo' ? '#d47aff' : '#72a4ff'
                }}>
                  {u.role}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--muted)', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={13} color="var(--subtle)" />
                  <span>{u.email}</span>
                </div>
                {u.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={13} color="var(--subtle)" />
                    <span>{u.phone}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Briefcase size={13} color="var(--subtle)" />
                  <span>Domain: <strong style={{ color: 'var(--text)' }}>{u.domain}</strong></span>
                </div>
              </div>

              {/* Skills Tags */}
              {u.skills && u.skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {u.skills.slice(0, 4).map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '2px 8px',
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--line)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        color: 'var(--muted)'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                  {u.skills.length > 4 && (
                    <span style={{ fontSize: '11px', color: 'var(--subtle)', alignSelf: 'center' }}>
                      +{u.skills.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: 'var(--accent-teal)',
              fontWeight: 600
            }}>
              <span>View Org Profile & Chain</span>
              <ChevronRight size={14} />
            </div>
          </div>
        ))}
      </div>

      {/* Profile Detail Modal */}
      {selectedProfileId && profileData && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '640px',
            maxHeight: '90vh',
            overflowY: 'auto',
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  backgroundColor: profileData.user.role === 'ceo' ? 'var(--accent-purple)' : 'var(--accent-blue)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {profileData.user.name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
                    {profileData.user.name}
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    {profileData.user.designation} &bull; <strong style={{ color: 'var(--accent-green)' }}>{profileData.user.domain}</strong>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {(currentUser?.role === 'ceo' || currentUser?._id === profileData.user._id) && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--line)',
                      color: 'var(--text)',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Edit2 size={13} />
                    <span>Edit Profile</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedProfileId(null)}
                  style={{
                    padding: '7px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--line)',
                    color: 'var(--muted)'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Notifications */}
            {errorMessage && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(255, 82, 82, 0.1)', border: '1px solid rgba(255, 82, 82, 0.3)', borderRadius: 'var(--radius-sm)', color: '#ff8a8a', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={15} />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-green)', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={15} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Profile Content / Editing Form */}
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Phone Number</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Skills (comma separated)</label>
                    <input
                      type="text"
                      value={editSkills}
                      onChange={(e) => setEditSkills(e.target.value)}
                      placeholder="React, Node.js, Design"
                      style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                    />
                  </div>
                </div>

                {currentUser?.role === 'ceo' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Designation (CEO Only)</label>
                        <input
                          type="text"
                          value={editDesignation}
                          onChange={(e) => setEditDesignation(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Domain (CEO Only)</label>
                        <select
                          value={editDomain}
                          onChange={(e) => setEditDomain(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Reports To (CEO Only)</label>
                        <select
                          value={editReportsTo}
                          onChange={(e) => setEditReportsTo(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                        >
                          <option value="">None (Top Level / Self)</option>
                          {users
                            .filter((u) => u._id !== selectedProfileId)
                            .map((u) => (
                              <option key={u._id} value={u._id}>
                                {u.name} ({u.designation})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Account Status (CEO Only)</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as any)}
                          style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', fontSize: '13px', color: 'var(--muted)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-green)', color: '#000', fontWeight: 700, fontSize: '13px' }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Contact & Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                  <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--subtle)', textTransform: 'uppercase', marginBottom: '4px' }}>Company Mailbox</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{profileData.user.email}</div>
                  </div>

                  <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--subtle)', textTransform: 'uppercase', marginBottom: '4px' }}>Direct Phone</div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)' }}>{profileData.user.phone || 'Not configured'}</div>
                  </div>
                </div>

                {/* Skills */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '12.5px', textTransform: 'uppercase', color: 'var(--subtle)', letterSpacing: '0.8px', marginBottom: '10px', fontWeight: 700 }}>
                    Technical Core Skills
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {profileData.user.skills?.map((sk, idx) => (
                      <span key={idx} style={{ padding: '4px 10px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text)' }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Chain to CEO Hierarchy */}
                <div style={{ marginBottom: '24px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--line)' }}>
                  <h4 style={{ fontSize: '12.5px', textTransform: 'uppercase', color: 'var(--subtle)', letterSpacing: '0.8px', marginBottom: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Network size={14} color="var(--accent-teal)" />
                    <span>Chain to CEO</span>
                  </h4>

                  {profileData.chainToCeo.length === 0 ? (
                    <div style={{ fontSize: '13px', color: 'var(--accent-green)', fontWeight: 600 }}>
                      This profile is the top-level Founder / CEO of ShiftPe.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                        {profileData.user.name} ({profileData.user.designation})
                      </div>
                      {profileData.chainToCeo.map((node, i) => (
                        <div key={node._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: `${(i + 1) * 16}px` }}>
                          <span style={{ color: 'var(--accent-teal)' }}>&uarr; reports to</span>
                          <span style={{ fontSize: '13px', color: node.role === 'ceo' ? 'var(--accent-green)' : 'var(--text)', fontWeight: 600 }}>
                            {node.name} &bull; <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{node.designation}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Direct Reports */}
                {profileData.directReports.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '12.5px', textTransform: 'uppercase', color: 'var(--subtle)', letterSpacing: '0.8px', marginBottom: '10px', fontWeight: 700 }}>
                      Direct Reports ({profileData.directReports.length})
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {profileData.directReports.map((dr) => (
                        <div key={dr._id} style={{ padding: '10px 14px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700 }}>{dr.name}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{dr.designation} &bull; {dr.domain}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
