import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, RefreshCw, Search, AlertCircle } from 'lucide-react';

interface AuditLogEntry {
  _id: string;
  action: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export const AuditLogView: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/audit?limit=200', {
        headers,
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
      } else {
        setErrorMessage(data.error || 'Failed to fetch audit records.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error connecting to audit service.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const uniqueActions = ['ALL', ...Array.from(new Set(logs.map((l) => l.action)))];

  const filteredLogs = logs.filter((l) => {
    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter;
    const term = searchTerm.toLowerCase().trim();
    if (!term) return matchesAction;

    const matchesSearch =
      (l.action && l.action.toLowerCase().includes(term)) ||
      (l.actorEmail && l.actorEmail.toLowerCase().includes(term)) ||
      (l.targetType && l.targetType.toLowerCase().includes(term)) ||
      (l.ipAddress && l.ipAddress.toLowerCase().includes(term)) ||
      (l.details && JSON.stringify(l.details).toLowerCase().includes(term));

    return matchesAction && matchesSearch;
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes('LOCKED') || action.includes('FAILED') || action.includes('REVOKED')) {
      return { bg: 'rgba(255, 95, 85, 0.15)', text: 'var(--shiftpe-coral)', border: 'rgba(255, 95, 85, 0.3)' };
    }
    if (action.includes('UNLOCKED') || action.includes('COMPLETED') || action.includes('SUCCESS') || action.includes('REGISTERED')) {
      return { bg: 'rgba(16, 185, 129, 0.15)', text: 'var(--accent-green)', border: 'rgba(16, 185, 129, 0.3)' };
    }
    if (action.includes('INVITE') || action.includes('LOGIN')) {
      return { bg: 'rgba(59, 130, 246, 0.15)', text: 'var(--accent-blue)', border: 'rgba(59, 130, 246, 0.3)' };
    }
    return { bg: 'var(--surface-pill)', text: 'var(--muted)', border: 'var(--line)' };
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldAlert size={22} color="var(--shiftpe-coral)" />
            <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>Security Audit Log</h2>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '13.5px' }}>
            Immutable administrative event stream, authentication attempts, lockouts, and privilege grants.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          aria-label="Refresh audit logs"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text)',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'spin-icon' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {errorMessage && (
        <div style={{
          marginBottom: '20px',
          padding: '12px 16px',
          backgroundColor: 'rgba(255, 95, 85, 0.1)',
          border: '1px solid var(--shiftpe-coral-border)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--shiftpe-coral)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 14px',
          minWidth: '280px'
        }}>
          <Search size={15} color="var(--muted)" />
          <label htmlFor="audit-search" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
            Search audit events
          </label>
          <input
            id="audit-search"
            type="text"
            placeholder="Search action, actor, IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

        {/* Action Type Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="audit-action-filter" style={{ fontSize: '12.5px', color: 'var(--muted)', fontWeight: 600 }}>
            Action:
          </label>
          <select
            id="audit-action-filter"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              fontSize: '12.5px',
              color: 'var(--text)',
              cursor: 'pointer'
            }}
          >
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="table-container" style={{
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--surface-subtle)', borderBottom: '1px solid var(--line)' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--subtle)', fontWeight: 700 }}>Timestamp</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--subtle)', fontWeight: 700 }}>Action</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--subtle)', fontWeight: 700 }}>Actor</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--subtle)', fontWeight: 700 }}>Target</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--subtle)', fontWeight: 700 }}>IP Address</th>
                <th style={{ padding: '12px 16px', fontSize: '11px', textTransform: 'uppercase', color: 'var(--subtle)', fontWeight: 700 }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                    Loading audit trail records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getActionBadgeColor(log.action);
                  return (
                    <tr key={log._id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          backgroundColor: badge.bg,
                          color: badge.text,
                          border: `1px solid ${badge.border}`
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12.5px', color: 'var(--text)' }}>
                        <div style={{ fontWeight: 600 }}>{log.actorEmail || 'System'}</div>
                        {log.actorRole && (
                          <div style={{ fontSize: '11px', color: 'var(--subtle)', textTransform: 'capitalize' }}>
                            {log.actorRole}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--muted)' }}>
                        {log.targetType || '—'} {log.targetId ? `(${log.targetId.slice(-6)})` : ''}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--subtle)', fontFamily: 'var(--font-mono)' }}>
                        {log.ipAddress || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '11.5px', color: 'var(--muted)', maxWidth: '280px' }}>
                        {log.details ? (
                          <span title={JSON.stringify(log.details, null, 2)} style={{ fontFamily: 'var(--font-mono)' }}>
                            {JSON.stringify(log.details).slice(0, 60)}
                            {JSON.stringify(log.details).length > 60 ? '...' : ''}
                          </span>
                        ) : '—'}
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
