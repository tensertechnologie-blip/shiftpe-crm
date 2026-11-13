import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  LogIn,
  Building,
  Laptop
} from 'lucide-react';

interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'pending' | 'approved' | 'rejected';
  workMode: 'office' | 'remote';
}

export const AttendanceView: React.FC = () => {
  const { token } = useAuth();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [workMode, setWorkMode] = useState<'office' | 'remote'>('office');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTodayStatus = async () => {
    try {
      const res = await fetch('/api/attendance/today', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setTodayRecord(data.attendance);
      }
    } catch (err) {
      console.error('Failed to fetch today attendance:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/attendance/my', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.records);
      }
    } catch (err) {
      console.error('Failed to fetch attendance history:', err);
    }
  };

  useEffect(() => {
    fetchTodayStatus();
    fetchHistory();
  }, [token]);

  const handleCheckIn = async () => {
    setStatusMessage(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ workMode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatusMessage({ type: 'success', text: 'Checked in successfully using server timestamp!' });
      fetchTodayStatus();
      fetchHistory();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setStatusMessage(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatusMessage({ type: 'success', text: 'Checked out successfully using server timestamp!' });
      fetchTodayStatus();
      fetchHistory();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={24} color="var(--accent-green)" />
          <span>Attendance & Time Tracking</span>
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '4px' }}>
          Strict server-clock timestamp verification. Records start as Pending until verified by the CEO.
        </p>
      </div>

      {statusMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px',
          marginBottom: '20px',
          backgroundColor: statusMessage.type === 'success' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 82, 82, 0.1)',
          border: `1px solid ${statusMessage.type === 'success' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 82, 82, 0.3)'}`,
          color: statusMessage.type === 'success' ? 'var(--accent-green)' : '#ff8a8a'
        }}>
          {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Daily Action Banner */}
      <div style={{
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--subtle)', letterSpacing: '0.8px', marginBottom: '6px', fontWeight: 700 }}>
            Today's Attendance Status ({new Date().toISOString().split('T')[0]})
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Check-in:</span>
              <strong style={{ fontSize: '16px', color: todayRecord?.checkIn ? 'var(--accent-green)' : 'var(--text)' }}>
                {formatTime(todayRecord?.checkIn)}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Check-out:</span>
              <strong style={{ fontSize: '16px', color: todayRecord?.checkOut ? 'var(--accent-blue)' : 'var(--text)' }}>
                {formatTime(todayRecord?.checkOut)}
              </strong>
            </div>

            {todayRecord && (
              <span style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                backgroundColor: todayRecord.status === 'approved' ? 'rgba(0, 255, 136, 0.15)' : todayRecord.status === 'rejected' ? 'rgba(255, 82, 82, 0.15)' : 'rgba(255, 183, 77, 0.15)',
                color: todayRecord.status === 'approved' ? 'var(--accent-green)' : todayRecord.status === 'rejected' ? 'var(--status-rejected)' : 'var(--status-pending)'
              }}>
                {todayRecord.status}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!todayRecord ? (
            <>
              <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
                <button
                  type="button"
                  onClick={() => setWorkMode('office')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: workMode === 'office' ? 'var(--line)' : 'transparent',
                    color: workMode === 'office' ? 'var(--text)' : 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Building size={13} />
                  Office
                </button>
                <button
                  type="button"
                  onClick={() => setWorkMode('remote')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: workMode === 'remote' ? 'var(--line)' : 'transparent',
                    color: workMode === 'remote' ? 'var(--text)' : 'var(--muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Laptop size={13} />
                  Remote
                </button>
              </div>

              <button
                onClick={handleCheckIn}
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 22px',
                  backgroundColor: 'var(--accent-green)',
                  color: '#000000',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 4px 16px var(--accent-green-glow)',
                  transition: 'var(--transition)'
                }}
              >
                <LogIn size={16} />
                <span>Check In Now</span>
              </button>
            </>
          ) : !todayRecord.checkOut ? (
            <button
              onClick={handleCheckOut}
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                backgroundColor: 'var(--accent-blue)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '13.5px',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 16px rgba(59, 123, 245, 0.3)',
                transition: 'var(--transition)'
              }}
            >
              <LogOut size={16} />
              <span>Check Out Now</span>
            </button>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              backgroundColor: 'rgba(0, 255, 136, 0.1)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-green)',
              fontSize: '13px',
              fontWeight: 600
            }}>
              <CheckCircle2 size={16} />
              <span>Full Day Recorded</span>
            </div>
          )}
        </div>
      </div>

      {/* Attendance History Table */}
      <div style={{
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Attendance Records Log</h3>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{history.length} logged sessions</span>
        </div>

        {history.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
            No attendance entries recorded yet. Check in above to start your log.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--subtle)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 20px' }}>Date</th>
                <th style={{ padding: '12px 20px' }}>Mode</th>
                <th style={{ padding: '12px 20px' }}>Check In</th>
                <th style={{ padding: '12px 20px' }}>Check Out</th>
                <th style={{ padding: '12px 20px' }}>Approval Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((rec) => (
                <tr key={rec._id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text)' }}>
                    {rec.date}
                  </td>
                  <td style={{ padding: '14px 20px', textTransform: 'capitalize', color: 'var(--muted)' }}>
                    {rec.workMode}
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                    {formatTime(rec.checkIn)}
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                    {formatTime(rec.checkOut)}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      backgroundColor: rec.status === 'approved' ? 'rgba(0, 255, 136, 0.15)' : rec.status === 'rejected' ? 'rgba(255, 82, 82, 0.15)' : 'rgba(255, 183, 77, 0.15)',
                      color: rec.status === 'approved' ? 'var(--accent-green)' : rec.status === 'rejected' ? 'var(--status-rejected)' : 'var(--status-pending)'
                    }}>
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
