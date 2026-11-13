import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2,
  Clock,
  Briefcase,
  Star,
  ExternalLink,
  AlertCircle,
  CheckCheck,
  ShieldCheck
} from 'lucide-react';

export const ApprovalsView: React.FC = () => {
  const { token, user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'work'>('attendance');

  // Attendance states
  const [pendingAttendance, setPendingAttendance] = useState<any[]>([]);

  // Work states
  const [pendingWork, setPendingWork] = useState<any[]>([]);
  const [selectedCredits, setSelectedCredits] = useState<Record<string, number>>({});
  const [rejectModalWorkId, setRejectModalWorkId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAttendance = async () => {
    try {
      const res = await fetch('/api/attendance/pending', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setPendingAttendance(data.records);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWork = async () => {
    try {
      const res = await fetch('/api/work/pending', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setPendingWork(data.workLogs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchWork();
  }, [token]);

  // Attendance Actions
  const handleReviewAttendance = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/attendance/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setNotification({ type: 'success', text: `Attendance record ${status} successfully` });
        fetchAttendance();
      }
    } catch (e: any) {
      setNotification({ type: 'error', text: e.message });
    }
  };

  const handleBulkApproveAttendance = async () => {
    try {
      const res = await fetch('/api/attendance/bulk-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ ids: pendingAttendance.map((a) => a._id) })
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({ type: 'success', text: data.message });
        fetchAttendance();
      }
    } catch (e: any) {
      setNotification({ type: 'error', text: e.message });
    }
  };

  // Work Actions
  const handleApproveWork = async (id: string) => {
    const credits = selectedCredits[id] || 3; // default 3 credits
    try {
      const res = await fetch(`/api/work/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'approve', credits })
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({ type: 'success', text: `Approved deliverable with ${credits} credit(s)` });
        fetchWork();
      } else {
        setNotification({ type: 'error', text: data.error });
      }
    } catch (e: any) {
      setNotification({ type: 'error', text: e.message });
    }
  };

  const handleRejectWork = async () => {
    if (!rejectModalWorkId || !rejectReason.trim()) {
      setNotification({ type: 'error', text: 'A written rejection reason is mandatory.' });
      return;
    }

    try {
      const res = await fetch(`/api/work/${rejectModalWorkId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'reject', reviewNote: rejectReason.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({ type: 'success', text: 'Work deliverable rejected with feedback provided.' });
        setRejectModalWorkId(null);
        setRejectReason('');
        fetchWork();
      } else {
        setNotification({ type: 'error', text: data.error });
      }
    } catch (e: any) {
      setNotification({ type: 'error', text: e.message });
    }
  };

  if (user?.role !== 'ceo') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--panel)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)' }}>
        <AlertCircle size={40} color="var(--status-rejected)" style={{ margin: '0 auto 16px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Access Denied</h3>
        <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '6px' }}>
          Approvals and credit assignments are restricted exclusively to the ShiftPe CEO and authorized executive approvers.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={24} color="var(--accent-purple)" />
            <span>CEO Approval Queues</span>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '4px' }}>
            Review pending attendance records and assign validated credits (1–5) to team deliverables.
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', backgroundColor: 'var(--panel)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--line)' }}>
          <button
            onClick={() => setActiveSubTab('attendance')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: activeSubTab === 'attendance' ? 'var(--line)' : 'transparent',
              color: activeSubTab === 'attendance' ? 'var(--text)' : 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={14} />
            <span>Attendance ({pendingAttendance.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('work')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: activeSubTab === 'work' ? 'var(--line)' : 'transparent',
              color: activeSubTab === 'work' ? 'var(--text)' : 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Briefcase size={14} />
            <span>Work Deliverables ({pendingWork.length})</span>
          </button>
        </div>
      </div>

      {notification && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px',
          marginBottom: '20px',
          backgroundColor: notification.type === 'success' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 82, 82, 0.1)',
          border: `1px solid ${notification.type === 'success' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 82, 82, 0.3)'}`,
          color: notification.type === 'success' ? 'var(--accent-green)' : '#ff8a8a'
        }}>
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Subtab 1: Attendance Queue */}
      {activeSubTab === 'attendance' && (
        <div style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Pending Attendance Verifications</h3>
            {pendingAttendance.length > 0 && (
              <button
                onClick={handleBulkApproveAttendance}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  backgroundColor: 'var(--accent-green)',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <CheckCheck size={15} />
                <span>Bulk Approve All ({pendingAttendance.length})</span>
              </button>
            )}
          </div>

          {pendingAttendance.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)', fontSize: '13.5px' }}>
              All attendance logs are current. No pending verification items.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--subtle)', textTransform: 'uppercase', fontSize: '11px' }}>
                  <th style={{ padding: '12px 20px' }}>Teammate</th>
                  <th style={{ padding: '12px 20px' }}>Domain</th>
                  <th style={{ padding: '12px 20px' }}>Date</th>
                  <th style={{ padding: '12px 20px' }}>Check In</th>
                  <th style={{ padding: '12px 20px' }}>Check Out</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingAttendance.map((rec) => (
                  <tr key={rec._id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{rec.userId?.name || 'Teammate'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{rec.userId?.email}</div>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--muted)' }}>{rec.userId?.domain || 'General'}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text)', fontWeight: 600 }}>{rec.date}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                      {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Still checked in'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleReviewAttendance(rec._id, 'approved')}
                          style={{ padding: '6px 12px', backgroundColor: 'rgba(0, 255, 136, 0.12)', border: '1px solid rgba(0, 255, 136, 0.3)', color: 'var(--accent-green)', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '12px' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReviewAttendance(rec._id, 'rejected')}
                          style={{ padding: '6px 12px', backgroundColor: 'rgba(255, 82, 82, 0.1)', border: '1px solid rgba(255, 82, 82, 0.3)', color: '#ff8a8a', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '12px' }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Subtab 2: Work Deliverables Queue */}
      {activeSubTab === 'work' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pendingWork.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', color: 'var(--muted)', fontSize: '13.5px' }}>
              No work deliverables waiting for review. All contributions evaluated!
            </div>
          ) : (
            pendingWork.map((work) => (
              <div
                key={work._id}
                style={{
                  backgroundColor: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <h4 style={{ fontSize: '16.5px', fontWeight: 700, color: 'var(--text)' }}>
                        {work.title}
                      </h4>
                      <span style={{ fontSize: '12px', color: 'var(--accent-teal)' }}>
                        &bull; {work.userId?.name} ({work.userId?.designation})
                      </span>
                    </div>

                    <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '10px' }}>
                      {work.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--subtle)' }}>
                      <span>{work.hours} hours logged</span>
                      <span>Date: {work.date}</span>
                      {work.link && (
                        <a href={work.link} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-teal)' }}>
                          <ExternalLink size={12} />
                          Inspect Deliverable Link
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Review Action Toolbar */}
                <div style={{
                  paddingTop: '16px',
                  borderTop: '1px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  {/* Credits 1-5 selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--muted)' }}>
                      Assign Credits:
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map((creditNum) => {
                        const currentSelected = selectedCredits[work._id] || 3;
                        const isSelected = currentSelected === creditNum;
                        return (
                          <button
                            key={creditNum}
                            type="button"
                            onClick={() => setSelectedCredits({ ...selectedCredits, [work._id]: creditNum })}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid',
                              borderColor: isSelected ? 'var(--accent-green)' : 'var(--line)',
                              backgroundColor: isSelected ? 'rgba(0, 255, 136, 0.15)' : 'var(--bg)',
                              color: isSelected ? 'var(--accent-green)' : 'var(--text)',
                              fontWeight: 700,
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '2px'
                            }}
                          >
                            <span>{creditNum}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Approve / Reject buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => setRejectModalWorkId(work._id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255, 82, 82, 0.1)',
                        border: '1px solid rgba(255, 82, 82, 0.3)',
                        color: '#ff8a8a',
                        fontWeight: 600,
                        fontSize: '13px'
                      }}
                    >
                      Reject with Reason
                    </button>

                    <button
                      onClick={() => handleApproveWork(work._id)}
                      style={{
                        padding: '8px 20px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--accent-green)',
                        color: '#000000',
                        fontWeight: 700,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Star size={14} fill="#000" />
                      <span>Approve ({selectedCredits[work._id] || 3} Credits)</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reject with Reason Modal */}
      {rejectModalWorkId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
              Reject Work Deliverable
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
              A written reason is required so the teammate understands what improvements or corrections are required before resubmitting.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Please update tests to cover edge cases and attach the deployed preview link."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13.5px',
                color: 'var(--text)',
                marginBottom: '20px',
                resize: 'vertical'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setRejectModalWorkId(null);
                  setRejectReason('');
                }}
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', color: 'var(--muted)', fontSize: '13px' }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleRejectWork}
                style={{ padding: '8px 18px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-rejected)', color: '#fff', fontWeight: 700, fontSize: '13px' }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
