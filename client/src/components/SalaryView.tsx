import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard,
  PlusCircle,
  CheckCircle2,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';

interface SalaryRecord {
  _id: string;
  userId: any;
  month: string;
  amount: number;
  paid: boolean;
  paidOn?: string;
  notes?: string;
}

export const SalaryView: React.FC = () => {
  const { user, token } = useAuth();
  const [mySalaries, setMySalaries] = useState<SalaryRecord[]>([]);
  const [allSalaries, setAllSalaries] = useState<SalaryRecord[]>([]);
  const [isCeoModalOpen, setIsCeoModalOpen] = useState(false);

  // Form states for CEO
  const [selectedUserId, setSelectedUserId] = useState('');
  const [month, setMonth] = useState('2026-11');
  const [amount, setAmount] = useState('');
  const [paid, setPaid] = useState(false);
  const [notes, setNotes] = useState('');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMySalaries = async () => {
    try {
      const res = await fetch('/api/salary/my', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setMySalaries(data.salaries);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAllSalaries = async () => {
    if (user?.role !== 'ceo') return;
    try {
      const [salRes, usersRes] = await Promise.all([
        fetch('/api/salary/all', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        }),
        fetch('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        })
      ]);

      if (salRes.ok) {
        const data = await salRes.json();
        setAllSalaries(data.salaries);
      }
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsersList(uData.users);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMySalaries();
    fetchAllSalaries();
  }, [token, user]);

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    try {
      const res = await fetch('/api/salary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: selectedUserId,
          month,
          amount: Number(amount),
          paid,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotification({ type: 'success', text: 'Salary record saved successfully' });
      setIsCeoModalOpen(false);
      setAmount('');
      setNotes('');
      fetchAllSalaries();
      fetchMySalaries();
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message });
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const res = await fetch(`/api/salary/${id}/pay`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        setNotification({ type: 'success', text: 'Salary marked as paid' });
        fetchAllSalaries();
        fetchMySalaries();
      }
    } catch (e: any) {
      setNotification({ type: 'error', text: e.message });
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CreditCard size={24} color="var(--accent-green)" />
            <span>Salary & Compensation Records</span>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '4px' }}>
            Strict confidential payslips. Teammates can view only their own records; CEO oversees company payroll.
          </p>
        </div>

        {user?.role === 'ceo' && (
          <button
            onClick={() => setIsCeoModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: 'var(--accent-green)',
              color: '#000',
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <PlusCircle size={15} />
            <span>Manage Monthly Record</span>
          </button>
        )}
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

      {/* Member's Personal Payslips */}
      <div style={{
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '32px',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '15.5px', fontWeight: 700 }}>Your Personal Payslips</h3>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Protected by RBAC</span>
        </div>

        {mySalaries.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)', fontSize: '13.5px' }}>
            No personal salary records recorded for this account yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--subtle)', textTransform: 'uppercase', fontSize: '11px' }}>
                <th style={{ padding: '12px 20px' }}>Month</th>
                <th style={{ padding: '12px 20px' }}>Compensation</th>
                <th style={{ padding: '12px 20px' }}>Status</th>
                <th style={{ padding: '12px 20px' }}>Payment Date</th>
                <th style={{ padding: '12px 20px' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {mySalaries.map((s) => (
                <tr key={s._id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--text)' }}>{s.month}</td>
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(s.amount)}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      backgroundColor: s.paid ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 183, 77, 0.15)',
                      color: s.paid ? 'var(--accent-green)' : 'var(--status-pending)'
                    }}>
                      {s.paid ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--muted)' }}>
                    {s.paidOn ? new Date(s.paidOn).toLocaleDateString() : 'Awaiting processing'}
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--subtle)' }}>{s.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CEO Company-wide Payroll Ledger */}
      {user?.role === 'ceo' && (
        <div style={{
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="var(--accent-purple)" />
              <h3 style={{ fontSize: '15.5px', fontWeight: 700 }}>Company Payroll Ledger (CEO Only)</h3>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Total Records: {allSalaries.length}</span>
          </div>

          {allSalaries.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)', fontSize: '13.5px' }}>
              No payroll records exist. Use 'Manage Monthly Record' above to add monthly compensation.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--subtle)', textTransform: 'uppercase', fontSize: '11px' }}>
                  <th style={{ padding: '12px 20px' }}>Teammate</th>
                  <th style={{ padding: '12px 20px' }}>Month</th>
                  <th style={{ padding: '12px 20px' }}>Amount</th>
                  <th style={{ padding: '12px 20px' }}>Status</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allSalaries.map((s) => (
                  <tr key={s._id} style={{ borderBottom: '1px solid var(--line)' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{s.userId?.name || 'Teammate'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{s.userId?.email}</div>
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 600 }}>{s.month}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                      {formatCurrency(s.amount)}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        backgroundColor: s.paid ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255, 183, 77, 0.15)',
                        color: s.paid ? 'var(--accent-green)' : 'var(--status-pending)'
                      }}>
                        {s.paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      {!s.paid ? (
                        <button
                          onClick={() => handleMarkPaid(s._id)}
                          style={{ padding: '6px 12px', backgroundColor: 'var(--accent-green)', color: '#000', fontWeight: 700, fontSize: '12px', borderRadius: 'var(--radius-sm)' }}
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: 'var(--subtle)' }}>Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CEO Modal for Adding / Editing Salary */}
      {isCeoModalOpen && (
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
          <div style={{ width: '100%', maxWidth: '480px', backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
              Set Monthly Compensation
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '18px' }}>
              Create or update a teammate's monthly payroll record.
            </p>

            <form onSubmit={handleSaveSalary}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Select Teammate</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                >
                  <option value="">-- Choose team member --</option>
                  {usersList.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Month (YYYY-MM)</label>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Amount (INR)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 150000"
                    required
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={paid}
                    onChange={(e) => setPaid(e.target.checked)}
                    style={{ accentColor: 'var(--accent-green)' }}
                  />
                  <span>Mark as Paid Immediately</span>
                </label>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Base salary + performance bonus"
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsCeoModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)', color: 'var(--muted)', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-green)', color: '#000', fontWeight: 700, fontSize: '13px' }}
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
