import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase,
  PlusCircle,
  ExternalLink,
  Star,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare
} from 'lucide-react';

interface WorkSubmission {
  _id: string;
  title: string;
  description: string;
  hours: number;
  link?: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  credits?: number;
  reviewNote?: string;
  createdAt: string;
}

export const WorkView: React.FC = () => {
  const { token } = useAuth();
  const [workLogs, setWorkLogs] = useState<WorkSubmission[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [link, setLink] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWorkLogs = async () => {
    try {
      const res = await fetch('/api/work/my', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setWorkLogs(data.workLogs);
      }
    } catch (e) {
      console.error('Failed to load work logs:', e);
    }
  };

  useEffect(() => {
    fetchWorkLogs();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const parsedHours = parseFloat(hours);
    if (isNaN(parsedHours) || parsedHours <= 0 || parsedHours > 24) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid hours duration between 0.1 and 24.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          hours: parsedHours,
          link: link.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatusMessage({
        type: 'success',
        text: 'Work deliverable submitted successfully! Sent to CEO approval queue.'
      });
      setTitle('');
      setDescription('');
      setHours('');
      setLink('');
      fetchWorkLogs();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Briefcase size={24} color="var(--accent-green)" />
          <span>Work Deliverables & Submissions</span>
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '4px' }}>
          Submit completed deliverables and PR links. Only the CEO can validate and assign performance credits (1–5).
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

      {/* Submission Form */}
      <div style={{
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        marginBottom: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <PlusCircle size={20} color="var(--accent-green)" />
          <h3 style={{ fontSize: '17px', fontWeight: 700 }}>Submit Today's Completed Work</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Deliverable Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement TOTP QR code modal & bcrypt auth"
                required
                style={{ width: '100%', padding: '10px 14px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13.5px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Hours Spent
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g. 4.5"
                required
                style={{ width: '100%', padding: '10px 14px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13.5px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
              Detailed Description & Accomplishments
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detail what was built, challenges resolved, and architecture decisions..."
              required
              style={{ width: '100%', padding: '10px 14px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13.5px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Artifact / PR / Figma Link (Optional)
              </label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://github.com/shiftpe/... or https://figma.com/..."
                style={{ width: '100%', padding: '10px 14px', backgroundColor: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', fontSize: '13.5px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: '11px', color: 'var(--subtle)', marginBottom: '8px' }}>
                Credits (1–5) are evaluated and assigned solely by CEO review.
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '11px 20px',
                  backgroundColor: 'var(--accent-green)',
                  color: '#000000',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px var(--accent-green-glow)'
                }}
              >
                <PlusCircle size={16} />
                <span>Submit Deliverable</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Submission Log */}
      <div>
        <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>
          Your Submitted Deliverables ({workLogs.length})
        </h3>

        {workLogs.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', color: 'var(--muted)', fontSize: '13.5px' }}>
            No work logs submitted yet. Use the form above to record deliverables.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {workLogs.map((item) => (
              <div
                key={item._id}
                style={{
                  backgroundColor: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '20px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                      {item.title}
                    </h4>

                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      backgroundColor: item.status === 'approved' ? 'rgba(0, 255, 136, 0.15)' : item.status === 'rejected' ? 'rgba(255, 82, 82, 0.15)' : 'rgba(255, 183, 77, 0.15)',
                      color: item.status === 'approved' ? 'var(--accent-green)' : item.status === 'rejected' ? 'var(--status-rejected)' : 'var(--status-pending)'
                    }}>
                      {item.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '13.5px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '12px' }}>
                    {item.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--subtle)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} />
                      {item.hours} hrs logged on {item.date}
                    </span>

                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-teal)' }}
                      >
                        <ExternalLink size={12} />
                        View Deliverable
                      </a>
                    )}
                  </div>

                  {/* Rejection Note */}
                  {item.reviewNote && (
                    <div style={{
                      marginTop: '12px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: item.status === 'rejected' ? 'rgba(255, 82, 82, 0.08)' : 'var(--surface-subtle)',
                      border: '1px solid',
                      borderColor: item.status === 'rejected' ? 'rgba(255, 82, 82, 0.2)' : 'var(--line)',
                      fontSize: '12.5px',
                      color: item.status === 'rejected' ? '#ff9e9e' : 'var(--muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <MessageSquare size={14} style={{ flexShrink: 0 }} />
                      <span>Reviewer Note: {item.reviewNote}</span>
                    </div>
                  )}
                </div>

                {/* Credits Pill */}
                {item.credits && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    border: '1px solid rgba(0, 255, 136, 0.3)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-green)' }}>
                      <Star size={16} fill="var(--accent-green)" />
                      <span style={{ fontSize: '18px', fontWeight: 800 }}>+{item.credits}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Credits Awarded
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
