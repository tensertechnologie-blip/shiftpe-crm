import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Megaphone,
  Pin,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Rocket,
  Shield,
  Award,
  BookOpen,
  Users,
  Compass,
  FileText,
  Clock,
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: 'milestone' | 'policy' | 'townhall' | 'celebration' | 'urgent';
  authorName: string;
  authorRole: string;
  pinned: boolean;
  createdAt: string;
}

export const BulletinView: React.FC = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'bulletins' | 'legacy' | 'policies'>('bulletins');

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'milestone' | 'policy' | 'townhall' | 'celebration' | 'urgent'>('milestone');
  const [pinned, setPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/announcements', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Title and content are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, content, category, pinned })
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setTitle('');
        setContent('');
        setCategory('milestone');
        setPinned(false);
        fetchAnnouncements();
      } else {
        setErrorMsg(data.message || 'Failed to create announcement');
      }
    } catch (err) {
      setErrorMsg('Network error while broadcasting announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this announcement?')) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(prev => prev.filter(a => a._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete announcement:', err);
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      const res = await fetch(`/api/announcements/${id}/pin`, {
        method: 'PATCH',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        fetchAnnouncements();
      }
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const getCategoryBadge = (cat: string) => {
    const config = {
      milestone: { label: 'Milestone', color: 'var(--shiftpe-coral)', bg: 'var(--shiftpe-coral-light)', icon: Rocket },
      policy: { label: 'Policy Update', color: 'var(--accent-blue)', bg: 'rgba(59, 130, 246, 0.1)', icon: Shield },
      townhall: { label: 'All-Hands', color: 'var(--accent-purple)', bg: 'rgba(139, 92, 246, 0.1)', icon: Users },
      celebration: { label: 'Celebration', color: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.1)', icon: Sparkles },
      urgent: { label: 'Urgent Notice', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: AlertCircle }
    }[cat] || { label: cat, color: 'var(--muted)', bg: 'var(--surface-subtle)', icon: Megaphone };

    const Icon = config.icon;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: '11px',
        fontWeight: 700,
        color: config.color,
        backgroundColor: config.bg
      }}>
        <Icon size={11} />
        <span>{config.label}</span>
      </span>
    );
  };

  return (
    <div>
      {/* Header Banner */}
      <div style={{
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: 'var(--shiftpe-coral)',
              fontWeight: 700
            }}>
              ShiftPe Corporate Heritage & Intranet
            </span>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Company Bulletin & Legacy Hub</span>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '4px' }}>
            Official executive announcements, founding milestones, legacy values, and 2026 team policies.
          </p>
        </div>

        {user?.role === 'ceo' && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--shiftpe-coral)',
              color: 'var(--button-text-on-coral)',
              fontWeight: 700,
              fontSize: '13px',
              padding: '9px 16px',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 2px 10px var(--shiftpe-coral-glow)',
              transition: 'var(--transition)'
            }}
          >
            <Plus size={15} />
            <span>Broadcast Notice</span>
          </button>
        )}
      </div>

      {/* Sub-tab Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '20px',
        borderBottom: '1px solid var(--line)',
        paddingBottom: '8px'
      }}>
        <button
          onClick={() => setActiveSubTab('bulletins')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: activeSubTab === 'bulletins' ? 700 : 500,
            color: activeSubTab === 'bulletins' ? 'var(--shiftpe-coral)' : 'var(--muted)',
            backgroundColor: activeSubTab === 'bulletins' ? 'var(--shiftpe-coral-light)' : 'transparent',
            border: activeSubTab === 'bulletins' ? '1px solid var(--shiftpe-coral-border)' : '1px solid transparent',
            transition: 'var(--transition)'
          }}
        >
          <Megaphone size={14} />
          <span>Executive Bulletins ({announcements.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('legacy')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: activeSubTab === 'legacy' ? 700 : 500,
            color: activeSubTab === 'legacy' ? 'var(--shiftpe-coral)' : 'var(--muted)',
            backgroundColor: activeSubTab === 'legacy' ? 'var(--shiftpe-coral-light)' : 'transparent',
            border: activeSubTab === 'legacy' ? '1px solid var(--shiftpe-coral-border)' : '1px solid transparent',
            transition: 'var(--transition)'
          }}
        >
          <Compass size={14} />
          <span>Legacy & Founders Wall</span>
        </button>

        <button
          onClick={() => setActiveSubTab('policies')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: activeSubTab === 'policies' ? 700 : 500,
            color: activeSubTab === 'policies' ? 'var(--shiftpe-coral)' : 'var(--muted)',
            backgroundColor: activeSubTab === 'policies' ? 'var(--shiftpe-coral-light)' : 'transparent',
            border: activeSubTab === 'policies' ? '1px solid var(--shiftpe-coral-border)' : '1px solid transparent',
            transition: 'var(--transition)'
          }}
        >
          <BookOpen size={14} />
          <span>Policies & Handbook</span>
        </button>
      </div>

      {/* Sub-tab 1: Bulletins */}
      {activeSubTab === 'bulletins' && (
        <div>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
              Loading company bulletins...
            </div>
          ) : announcements.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: 'var(--panel)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line)',
              color: 'var(--muted)'
            }}>
              No announcements posted yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {announcements.map((item) => (
                <div
                  key={item._id}
                  style={{
                    backgroundColor: 'var(--panel)',
                    border: '1px solid',
                    borderColor: item.pinned ? 'var(--shiftpe-coral-border)' : 'var(--line)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px 24px',
                    boxShadow: item.pinned ? 'var(--card-glow)' : 'var(--card-shadow)',
                    transition: 'var(--transition)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {getCategoryBadge(item.category)}
                      {item.pinned && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '11px',
                          color: 'var(--shiftpe-coral)',
                          fontWeight: 700
                        }}>
                          <Pin size={11} />
                          <span>Pinned</span>
                        </span>
                      )}
                      <span style={{ fontSize: '11.5px', color: 'var(--subtle)' }}>&bull;</span>
                      <span style={{ fontSize: '12px', color: 'var(--subtle)' }}>
                        By <strong style={{ color: 'var(--text)' }}>{item.authorName}</strong> ({item.authorRole})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--subtle)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={11} />
                        {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>

                      {user?.role === 'ceo' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleTogglePin(item._id)}
                            title={item.pinned ? 'Unpin from top' : 'Pin to top'}
                            style={{
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--surface-subtle)',
                              color: item.pinned ? 'var(--shiftpe-coral)' : 'var(--muted)',
                              border: '1px solid var(--line)',
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Pin size={11} />
                            <span>{item.pinned ? 'Pinned' : 'Pin'}</span>
                          </button>

                          <button
                            onClick={() => handleDelete(item._id)}
                            title="Delete announcement"
                            style={{
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--surface-subtle)',
                              color: '#ef4444',
                              border: '1px solid var(--line)',
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 style={{ fontSize: '16.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
                    {item.title}
                  </h3>

                  <p style={{
                    fontSize: '13.5px',
                    color: 'var(--muted)',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line'
                  }}>
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 2: Legacy & Founding Wall */}
      {activeSubTab === 'legacy' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* ShiftPe Charter Card */}
          <div style={{
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-md)',
            padding: '24px 28px',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--shiftpe-coral)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '16px'
              }}>
                S
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>The ShiftPe Founding Charter</h3>
                <span style={{ fontSize: '12px', color: 'var(--shiftpe-coral)', fontWeight: 600 }}>Established 2026 &bull; "Find work. Near you."</span>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.65, marginBottom: '16px' }}>
              ShiftPe was conceived with a clear, uncompromising thesis: millions of gig workers, shift operators, and local professionals in India lack a transparent, real-time platform to discover dignified and immediate work nearby. We are building the operating system for localized labor discovery and automated compensation.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid var(--line)'
            }}>
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Founder</span>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>Ajay Kumar</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Inception</span>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>January 2026</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Headquarters</span>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>Bengaluru, India</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--subtle)', textTransform: 'uppercase', fontWeight: 700 }}>Core Mission</span>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--shiftpe-coral)' }}>Hyperlocal Workforce Tech</span>
              </div>
            </div>
          </div>

          {/* Founding Principles Grid */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
              ShiftPe Core Cultural Pillars
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              <div style={{
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                boxShadow: 'var(--card-shadow)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--shiftpe-coral)' }}>
                  <Rocket size={18} />
                  <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Speed & Velocity</h4>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  We prioritize quick iteration over prolonged debate. Ship cleanly, measure impact, and iterate relentlessly.
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                boxShadow: 'var(--card-shadow)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-green)' }}>
                  <Shield size={18} />
                  <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Radical Integrity</h4>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  Server-enforced timestamps, transparent contribution heatmaps, and locked evaluations ensure zero bias.
                </p>
              </div>

              <div style={{
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                boxShadow: 'var(--card-shadow)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-purple)' }}>
                  <Award size={18} />
                  <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Extreme Ownership</h4>
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  Every teammate treats ShiftPe as their own. We honor commitments, review peer deliverables, and celebrate merit.
                </p>
              </div>
            </div>
          </div>

          {/* Milestone Timeline */}
          <div style={{
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-md)',
            padding: '24px 28px',
            boxShadow: 'var(--card-shadow)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
              ShiftPe Corporate Milestones (2026)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--shiftpe-coral-light)',
                  border: '1px solid var(--shiftpe-coral)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--shiftpe-coral)',
                  fontWeight: 700,
                  fontSize: '11px',
                  flexShrink: 0
                }}>
                  01
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>
                    Q1 2026: Genesis & Architecture
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>
                    Incorporation of ShiftPe Technologies. Conceptualization of localized shift marketplace engine.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--shiftpe-coral-light)',
                  border: '1px solid var(--shiftpe-coral)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--shiftpe-coral)',
                  fontWeight: 700,
                  fontSize: '11px',
                  flexShrink: 0
                }}>
                  02
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>
                    Q2 2026: Pilot Beta Release
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>
                    Live testing in select pilot zones with over 100 verified shift seekers and local venue partners.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--shiftpe-coral)',
                  border: '1px solid var(--shiftpe-coral)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '11px',
                  flexShrink: 0
                }}>
                  03
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>
                    Q3 2026: ShiftPe CRM & Intranet Team Portal
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '2px' }}>
                    Launch of internal company workspace with 2FA TOTP authentication, verified attendance, and salary ledgers.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Policies & Handbook */}
      {activeSubTab === 'policies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-md)',
            padding: '24px 28px',
            boxShadow: 'var(--card-shadow)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--shiftpe-coral)" />
              <span>ShiftPe Employee Intranet Handbook (2026 Edition)</span>
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
              Binding operational guidelines for all team members at ShiftPe.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '14px 18px', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="var(--shiftpe-coral)" />
                  <span>1. Attendance & Verification Standards</span>
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  Morning sign-ins are verified exclusively by server clock. The daily punctuality threshold is set at <strong>10:15 AM</strong>. Sign-ins after 10:15 AM are automatically flagged as late. Daily work hours are calculated between check-in and check-out.
                </p>
              </div>

              <div style={{ padding: '14px 18px', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Briefcase size={14} color="var(--accent-blue)" />
                  <span>2. Deliverables & Merit Credit Scale</span>
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  All code commits, PRs, designs, and sales logs must be submitted via the Work tab. The CEO evaluates weekly work on a scale of <strong>1 to 5 credits</strong>. Any rejected work item must carry a constructive feedback note. Approved records are locked permanently.
                </p>
              </div>

              <div style={{ padding: '14px 18px', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} color="var(--accent-green)" />
                  <span>3. Confidential Compensation & Zero IDOR</span>
                </h4>
                <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  Salary ledgers and payslips are strictly confidential. Team members can only query their own ledger records. IDOR attempts are automatically intercepted and recorded in the immutable audit trail.
                </p>
              </div>

              <div style={{ padding: '14px 18px', backgroundColor: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}>
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} color="var(--accent-purple)" />
                  <span>4. 2026 Official Holiday Schedule</span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text)' }}>&bull; Republic Day (Jan 26)</div>
                  <div style={{ fontSize: '12px', color: 'var(--text)' }}>&bull; Holi (Mar 4)</div>
                  <div style={{ fontSize: '12px', color: 'var(--text)' }}>&bull; Independence Day (Aug 15)</div>
                  <div style={{ fontSize: '12px', color: 'var(--text)' }}>&bull; Gandhi Jayanti (Oct 2)</div>
                  <div style={{ fontSize: '12px', color: 'var(--text)' }}>&bull; Diwali Festival (Nov 8)</div>
                  <div style={{ fontSize: '12px', color: 'var(--text)' }}>&bull; Christmas (Dec 25)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CEO Broadcast Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            boxShadow: 'var(--card-shadow)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '4px', color: 'var(--text)' }}>
              Broadcast Executive Announcement
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '18px' }}>
              Publish an official notice to the company bulletin visible to all ShiftPe teammates.
            </p>

            {errorMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '12.5px',
                marginBottom: '14px'
              }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateAnnouncement}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  Announcement Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 Townhall & Product Roadmap"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--line)',
                    color: 'var(--text)',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--line)',
                      color: 'var(--text)',
                      fontSize: '13px'
                    }}
                  >
                    <option value="milestone">Milestone</option>
                    <option value="policy">Policy Update</option>
                    <option value="townhall">All-Hands / Townhall</option>
                    <option value="celebration">Celebration</option>
                    <option value="urgent">Urgent Notice</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: 'var(--text)', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={pinned}
                      onChange={(e) => setPinned(e.target.checked)}
                      style={{ accentColor: 'var(--shiftpe-coral)' }}
                    />
                    <span>Pin to top</span>
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  Notice Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  placeholder="Details of the announcement, links, or expectations..."
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--line)',
                    color: 'var(--text)',
                    fontSize: '13px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--surface-subtle)',
                    border: '1px solid var(--line)',
                    color: 'var(--muted)',
                    fontSize: '12.5px'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--shiftpe-coral)',
                    color: 'var(--button-text-on-coral)',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px var(--shiftpe-coral-glow)'
                  }}
                >
                  <Megaphone size={14} />
                  <span>{isSubmitting ? 'Broadcasting...' : 'Broadcast'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
