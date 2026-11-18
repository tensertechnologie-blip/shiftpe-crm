import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, UserRole } from '../types';
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
  Network,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Shield,
  ChevronLeft
} from 'lucide-react';

interface ProfileData {
  user: User;
  chainToCeo: Array<{ _id: string; name: string; designation: string; domain: string; role: string }>;
  directReports: Array<{ _id: string; name: string; designation: string; domain: string; role: string }>;
}

type SortColumn = 'name' | 'designation' | 'domain' | 'status';
type SortOrder = 'asc' | 'desc';

export const PeopleView: React.FC = () => {
  const { user: currentUser, token, updateUserState, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const domains = ['All', 'Engineering', 'Design', 'Marketing', 'Operations', 'Sales', 'Executive'];
  const [selectedDomain, setSelectedDomain] = useState('All');
  
  // 300ms Debounced Search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Cards / Table Toggle
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Pagination (20 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Selected Profile
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('member');
  const [editPhone, setEditPhone] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editDomain, setEditDomain] = useState('');
  const [editReportsTo, setEditReportsTo] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  // 300ms Debounce effect on search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUsers = async () => {
    try {
      const url = new URL('/api/users', window.location.origin);
      if (selectedDomain !== 'All') url.searchParams.set('domain', selectedDomain);
      if (debouncedSearch.trim()) url.searchParams.set('search', debouncedSearch.trim());

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    setCurrentPage(1);
  }, [selectedDomain, debouncedSearch]);

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Sort users
  const sortedUsers = [...users].sort((a, b) => {
    let aVal = (a[sortColumn] || '').toString().toLowerCase();
    let bVal = (b[sortColumn] || '').toString().toLowerCase();

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
        setEditName(data.user.name || '');
        setEditRole((data.user.role as UserRole) || 'member');
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

  // Focus trap for modal
  useEffect(() => {
    if (!selectedProfileId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProfileId(null);
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
  }, [selectedProfileId]);

  const handleSaveProfile = async () => {
    if (!selectedProfileId) return;
    setErrorMessage('');
    setSuccessMessage('');

    const payload: any = {
      name: editName.trim(),
      phone: editPhone.trim(),
      skills: editSkills.split(',').map((s) => s.trim()).filter(Boolean),
      designation: editDesignation.trim(),
      domain: editDomain,
      reportsTo: editReportsTo ? editReportsTo : null
    };

    if (currentUser?.role === 'ceo') {
      payload.status = editStatus;
      payload.role = editRole;
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
      showToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Changes saved and reflected across the organization.'
      });
      setIsEditing(false);
      loadProfile(selectedProfileId);
      fetchUsers();

      if (currentUser?._id === selectedProfileId) {
        if (updateUserState && data.user) {
          updateUserState(data.user);
        }
        if (refreshUser) {
          refreshUser();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message
      });
    }
  };

  const handleQuickRoleChange = async (targetUserId: string, newRole: UserRole) => {
    try {
      const res = await fetch(`/api/users/${targetUserId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      showToast({
        type: 'success',
        title: 'Role Assigned',
        message: `Successfully changed role to ${newRole.toUpperCase()}.`
      });

      if (profileData && profileData.user._id === targetUserId) {
        setProfileData({
          ...profileData,
          user: { ...profileData.user, role: newRole }
        });
        setEditRole(newRole);
      }
      fetchUsers();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Role Update Failed',
        message: err.message || 'Error updating role'
      });
    }
  };

  const renderSortIcon = (col: SortColumn) => {
    if (sortColumn !== col) {
      return <ArrowUpDown size={12} style={{ opacity: 0.5 }} />;
    }
    return sortOrder === 'asc' ? <ArrowUp size={12} color="var(--shiftpe-coral)" /> : <ArrowDown size={12} color="var(--shiftpe-coral)" />;
  };

  return (
    <div>
      {/* Header & Controls */}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* View Mode Toggle */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px'
          }}>
            <button
              onClick={() => setViewMode('cards')}
              aria-label="Cards view"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12.5px',
                fontWeight: 600,
                backgroundColor: viewMode === 'cards' ? 'var(--shiftpe-coral-light)' : 'transparent',
                color: viewMode === 'cards' ? 'var(--shiftpe-coral)' : 'var(--muted)',
                border: viewMode === 'cards' ? '1px solid var(--shiftpe-coral-border)' : '1px solid transparent'
              }}
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12.5px',
                fontWeight: 600,
                backgroundColor: viewMode === 'table' ? 'var(--shiftpe-coral-light)' : 'transparent',
                color: viewMode === 'table' ? 'var(--shiftpe-coral)' : 'var(--muted)',
                border: viewMode === 'table' ? '1px solid var(--shiftpe-coral-border)' : '1px solid transparent'
              }}
            >
              <TableIcon size={14} />
              <span>Table</span>
            </button>
          </div>

          {/* Search Input with accessible label */}
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
            <label htmlFor="people-search-input" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
              Search people by name, skill, email
            </label>
            <input
              id="people-search-input"
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
      </div>

      {/* Domain Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {domains.map((dom) => {
          const isActive = selectedDomain === dom;
          return (
            <button
              key={dom}
              onClick={() => {
                setSelectedDomain(dom);
                setCurrentPage(1);
              }}
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

      {/* View Content: Cards or Table */}
      {viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {paginatedUsers.map((u) => (
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
                      backgroundColor: u.role === 'ceo' ? 'var(--accent-purple)' : u.role === 'manager' ? 'var(--shiftpe-coral)' : 'var(--accent-blue)',
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
                    backgroundColor: u.role === 'ceo' ? 'rgba(180, 0, 255, 0.15)' : u.role === 'manager' ? 'var(--shiftpe-coral-light)' : 'rgba(59, 123, 245, 0.15)',
                    color: u.role === 'ceo' ? '#d47aff' : u.role === 'manager' ? 'var(--shiftpe-coral)' : '#72a4ff',
                    border: u.role === 'ceo' ? '1px solid rgba(180, 0, 255, 0.3)' : u.role === 'manager' ? '1px solid var(--shiftpe-coral-border)' : '1px solid rgba(59, 123, 245, 0.3)'
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
                color: 'var(--shiftpe-coral)',
                fontWeight: 600
              }}>
                <span>View Org Profile & Chain</span>
                <ChevronRight size={14} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="table-container" style={{
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-subtle)', borderBottom: '1px solid var(--line)' }}>
                  <th style={{ padding: '14px 18px' }}>
                    <button
                      onClick={() => handleSort('name')}
                      aria-label="Sort by name"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: 'var(--subtle)',
                        fontWeight: 700
                      }}
                    >
                      <span>Name</span>
                      {renderSortIcon('name')}
                    </button>
                  </th>
                  <th style={{ padding: '14px 18px' }}>
                    <button
                      onClick={() => handleSort('designation')}
                      aria-label="Sort by designation"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: 'var(--subtle)',
                        fontWeight: 700
                      }}
                    >
                      <span>Designation</span>
                      {renderSortIcon('designation')}
                    </button>
                  </th>
                  <th style={{ padding: '14px 18px' }}>
                    <button
                      onClick={() => handleSort('domain')}
                      aria-label="Sort by domain"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: 'var(--subtle)',
                        fontWeight: 700
                      }}
                    >
                      <span>Domain</span>
                      {renderSortIcon('domain')}
                    </button>
                  </th>
                  <th style={{ padding: '14px 18px' }}>
                    <button
                      onClick={() => handleSort('status')}
                      aria-label="Sort by status"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        color: 'var(--subtle)',
                        fontWeight: 700
                      }}
                    >
                      <span>Status</span>
                      {renderSortIcon('status')}
                    </button>
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--subtle)', fontWeight: 700 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                      No teammates found matching your query.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr
                      key={u._id}
                      onClick={() => loadProfile(u._id)}
                      style={{
                        borderBottom: '1px solid var(--line)',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--panel-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: u.role === 'ceo' ? 'var(--accent-purple)' : 'var(--accent-blue)',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{u.name}</div>
                            <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--text)' }}>
                        {u.designation}
                      </td>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--muted)' }}>
                        {u.domain}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: u.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 95, 85, 0.15)',
                          color: u.status === 'active' ? 'var(--accent-green)' : 'var(--shiftpe-coral)',
                          border: u.status === 'active' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 95, 85, 0.3)',
                          textTransform: 'capitalize'
                        }}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--shiftpe-coral)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Profile &rarr;
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '24px',
          padding: '12px 18px',
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)'
        }}>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
            Showing <strong>{Math.min(sortedUsers.length, (currentPage - 1) * pageSize + 1)}</strong> to{' '}
            <strong>{Math.min(sortedUsers.length, currentPage * pageSize)}</strong> of <strong>{sortedUsers.length}</strong> teammates
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface-subtle)',
                color: currentPage === 1 ? 'var(--subtle)' : 'var(--text)',
                fontSize: '12.5px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <span style={{ fontSize: '13px', color: 'var(--muted)', padding: '0 8px' }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface-subtle)',
                color: currentPage === totalPages ? 'var(--subtle)' : 'var(--text)',
                fontSize: '12.5px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

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
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Teammate profile details"
            style={{
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
            }}
          >
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
                {(currentUser?._id === profileData.user._id || currentUser?.role === 'ceo') && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    aria-label={currentUser?._id === profileData.user._id ? 'Edit your profile' : 'Admin: Edit teammate profile as CEO'}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: currentUser?._id === profileData.user._id ? 'var(--shiftpe-coral-light)' : 'rgba(255, 255, 255, 0.05)',
                      border: currentUser?._id === profileData.user._id ? '1px solid var(--shiftpe-coral-border)' : '1px solid var(--line)',
                      color: currentUser?._id === profileData.user._id ? 'var(--shiftpe-coral)' : 'var(--text)',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {currentUser?._id === profileData.user._id ? <Edit2 size={13} /> : <Shield size={13} />}
                    <span>{currentUser?._id === profileData.user._id ? 'Edit Profile' : 'Admin: Edit Teammate (CEO)'}</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedProfileId(null)}
                  aria-label="Close profile details"
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
                {/* Editing Context Notice */}
                <div style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: currentUser?._id === profileData.user._id ? 'var(--shiftpe-coral-light)' : 'rgba(59, 130, 246, 0.1)',
                  border: currentUser?._id === profileData.user._id ? '1px solid var(--shiftpe-coral-border)' : '1px solid rgba(59, 130, 246, 0.25)',
                  fontSize: '12px',
                  color: currentUser?._id === profileData.user._id ? 'var(--shiftpe-coral)' : 'var(--accent-blue)',
                  fontWeight: 600
                }}>
                  {currentUser?._id === profileData.user._id
                    ? 'Editing Your Profile: Update your full name, designation, department domain, reporting line, and specialties within the organization.'
                    : `Administrator Override: You are editing administrative settings for ${profileData.user.name}.`}
                </div>

                <div>
                  <label htmlFor="edit-name" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Full Name</label>
                  <input
                    id="edit-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Ajay"
                    required
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }} className="modal-grid-2">
                  <div>
                    <label htmlFor="edit-phone" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Phone Number</label>
                    <input
                      id="edit-phone"
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-domain" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Domain / Department</label>
                    <select
                      id="edit-domain"
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }} className="modal-grid-2">
                  <div>
                    <label htmlFor="edit-designation" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Designation</label>
                    <input
                      id="edit-designation"
                      type="text"
                      value={editDesignation}
                      onChange={(e) => setEditDesignation(e.target.value)}
                      placeholder="e.g. Founder, Growth Lead, Senior Backend Engineer"
                      style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-reports-to" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Reports To (Within Organization)</label>
                    <select
                      id="edit-reports-to"
                      value={editReportsTo}
                      onChange={(e) => setEditReportsTo(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                    >
                      <option value="">None (Top Level / Direct Founder)</option>
                      {users
                        .filter((u) => u._id !== selectedProfileId)
                        .map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name} ({u.designation || u.domain})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-skills" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Skills (comma separated)</label>
                  <input
                    id="edit-skills"
                    type="text"
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                    placeholder="React, Node.js, Design"
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                  />
                </div>

                {currentUser?.role === 'ceo' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }} className="modal-grid-2">
                    <div>
                      <label htmlFor="edit-role" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Account Role (CEO Only)</label>
                      <select
                        id="edit-role"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                        style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                      >
                        <option value="ceo">CEO (Executive Administrator)</option>
                        <option value="manager">Manager (Department Lead)</option>
                        <option value="member">Member (Standard Teammate)</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="edit-status" style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Account Status (CEO Only)</label>
                      <select
                        id="edit-status"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
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
                {/* CEO Quick Role Assignment */}
                {currentUser?.role === 'ceo' && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface-subtle)',
                      border: '1px solid var(--shiftpe-coral-border)',
                      marginBottom: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={15} color="var(--shiftpe-coral)" />
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>
                        CEO Role Assignment:
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <select
                        aria-label="Assign Role"
                        value={profileData.user.role}
                        onChange={(e) => handleQuickRoleChange(profileData.user._id, e.target.value as UserRole)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--panel)',
                          border: '1px solid var(--shiftpe-coral-border)',
                          color: 'var(--shiftpe-coral)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <option value="ceo">CEO (Executive Administrator)</option>
                        <option value="manager">Manager (Department Lead)</option>
                        <option value="member">Member (Standard Teammate)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Contact & Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }} className="modal-grid-2">
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
                    <Network size={14} color="var(--shiftpe-coral)" />
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
                          <span style={{ color: 'var(--shiftpe-coral)' }}>&uarr; reports to</span>
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }} className="modal-grid-2">
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
