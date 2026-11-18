import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { NavTab } from '../types';
import {
  Users,
  Clock,
  Briefcase,
  GitCommit,
  CreditCard,
  CheckCircle2,
  Megaphone,
  BookOpen,
  KeyRound,
  ShieldAlert,
  Network,
  Video,
  Radio,
  ChevronRight,
  Plus,
  CheckSquare,
  FileText,
  Award,
  LucideIcon
} from 'lucide-react';

interface DotDashboardViewProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenInvite?: () => void;
  onOpenOnboarding?: () => void;
}

interface AppTile {
  id: NavTab;
  title: string;
  icon: LucideIcon;
  ceoOnly?: boolean;
}

export const DotDashboardView: React.FC<DotDashboardViewProps> = ({
  onSelectTab,
  onOpenInvite,
  onOpenOnboarding
}) => {
  const { user, token } = useAuth();
  const firstName = user?.name ? user.name.split(' ')[0] : 'Teammate';
  const isCeo = user?.role === 'ceo';

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Checklist items loaded from tasks or state
  const [checklistTasks, setChecklistTasks] = useState<any[]>([]);
  const [activeChecklistSection, setActiveChecklistSection] = useState<'tasks' | 'approvals' | 'requests'>('tasks');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks/my', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setChecklistTasks(data.tasks || []);
        }
      } catch {
        // Fallback or offline state
      }
    };
    if (token) fetchTasks();
  }, [token]);

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'done' ? 'todo' : 'done';
    try {
      await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus })
      });
      setChecklistTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: nextStatus } : t))
      );
    } catch (e) {
      console.error(e);
    }
  };

  // "My Apps" square tile definition inspired by The Dot
  const appTiles: AppTile[] = [
    { id: 'Attendance', title: 'Daily Attendance', icon: Clock },
    { id: 'Work', title: 'Work Deliverables', icon: Briefcase },
    { id: 'Contributions', title: 'Contributions', icon: GitCommit },
    { id: 'Salary', title: 'Salary Ledger', icon: CreditCard },
    { id: 'People', title: 'People Directory', icon: Users },
    { id: 'Organisation', title: 'Organisation', icon: Network },
    { id: 'Bulletin', title: 'Company Bulletin', icon: Megaphone },
    { id: 'Wiki', title: 'Enterprise Wiki', icon: BookOpen },
    { id: 'Approvals', title: 'Approvals', icon: CheckCircle2, ceoOnly: true },
    { id: 'CRM Access', title: 'CRM Access', icon: KeyRound, ceoOnly: true },
    { id: 'Audit Log', title: 'Security Audit', icon: ShieldAlert, ceoOnly: true }
  ];

  const visibleApps = appTiles.filter((a) => !a.ceoOnly || isCeo);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* 1. Welcome Greeting Header (The Dot Style) */}
      <div
        style={{
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 30px',
          boxShadow: 'var(--card-shadow)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: 'var(--text)',
              marginBottom: '6px'
            }}
          >
            {getGreeting()}, <span style={{ color: 'var(--shiftpe-coral)' }}>{firstName}</span>! Welcome to ShiftPe.
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '18px' }}>
            Your central workspace to communicate, collaborate and execute. Let&apos;s get started.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onSelectTab('People')}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--line)',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--text)',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--shiftpe-coral)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
            >
              Connect with People
            </button>

            <button
              onClick={() => onSelectTab('Bulletin')}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--line)',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--text)',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--shiftpe-coral)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
            >
              Check News and Bulletins
            </button>

            <button
              onClick={() => onSelectTab('Attendance')}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--shiftpe-coral-light)',
                border: '1px solid var(--shiftpe-coral-border)',
                fontSize: '12.5px',
                fontWeight: 700,
                color: 'var(--shiftpe-coral)',
                transition: 'var(--transition)'
              }}
            >
              Log Daily Attendance
            </button>

            <button
              onClick={() => onSelectTab('Work')}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--line)',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--text)',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--shiftpe-coral)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
            >
              Submit Deliverable
            </button>
          </div>
        </div>
      </div>

      {/* 2. Hero Feature: Live Broadcast / CEO AI & Strategy Panel Discussion */}
      <div
        style={{
          backgroundColor: '#0c1020',
          border: '1px solid rgba(255, 95, 85, 0.25)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45), var(--card-glow)',
          position: 'relative'
        }}
      >
        {/* Banner Top Header */}
        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#ef4444',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  letterSpacing: '0.6px'
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    animation: 'pulse 1.5s infinite'
                  }}
                />
                LIVE &bull; 478
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
                Live Broadcast | CEO AI & 2026 Product Strategy Discussion
              </h2>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
              You can also join the live interactive discussion on Google Meet / Zoom{' '}
              <a
                href="#/bulletin"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectTab('Bulletin');
                }}
                style={{ color: 'var(--shiftpe-coral)', textDecoration: 'underline', fontWeight: 600 }}
              >
                here
              </a>
              .
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}
            >
              ShiftPe Broadcast
            </span>
          </div>
        </div>

        {/* Video Grid Simulation */}
        <div
          style={{
            padding: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px',
            backgroundColor: '#070a14'
          }}
        >
          {/* Speaker 1: Ajay (CEO) */}
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              backgroundColor: '#1e293b',
              aspectRatio: '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--shiftpe-coral)'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--shiftpe-coral)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 800,
                color: '#ffffff'
              }}
            >
              A
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Radio size={12} color="var(--shiftpe-coral)" />
              {user?.name || 'Ajay'} ({user?.designation || 'Founder'})
            </div>
          </div>

          {/* Speaker 2: Ritesh (Co-Founder) */}
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              backgroundColor: '#1e293b',
              aspectRatio: '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 800,
                color: '#ffffff'
              }}
            >
              R
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#ffffff'
              }}
            >
              Ritesh (Co-Founder & Product)
            </div>
          </div>

          {/* Speaker 3: Shubham (Lead Architect) */}
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              backgroundColor: '#1e293b',
              aspectRatio: '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 800,
                color: '#ffffff'
              }}
            >
              S
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#ffffff'
              }}
            >
              Shubham (Engineering Lead)
            </div>
          </div>

          {/* Speaker 4: Prafull (Ops & Growth) */}
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              backgroundColor: '#1e293b',
              aspectRatio: '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 800,
                color: '#ffffff'
              }}
            >
              P
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '12px',
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#ffffff'
              }}
            >
              Prafull (Operations Lead)
            </div>
          </div>
        </div>

        {/* Video Bottom Action Bar */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Topic: <strong>AI-Powered Customer Workflows & ShiftPe Scale 2026</strong>
            </span>
          </div>

          <button
            onClick={() => onSelectTab('Bulletin')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--shiftpe-coral)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Video size={14} />
            <span>Join Live Discussion</span>
          </button>
        </div>
      </div>

      {/* 3. "My Apps" Square Icon Tile Grid (The Dot Signature Component) */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px'
          }}
        >
          <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)' }}>
            My Apps
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Quick launcher for core ShiftPe enterprise services
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: '14px'
          }}
        >
          {visibleApps.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                onClick={() => onSelectTab(app.id)}
                aria-label={`Open ${app.title}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '18px 10px',
                  backgroundColor: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--card-shadow)',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--shiftpe-coral)';
                  e.currentTarget.style.boxShadow = '0 6px 18px var(--shiftpe-coral-glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'var(--line)';
                  e.currentTarget.style.boxShadow = 'var(--card-shadow)';
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--surface-subtle)',
                    border: '1px solid var(--line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--shiftpe-coral)'
                  }}
                >
                  <Icon size={20} />
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    textAlign: 'center',
                    lineHeight: 1.25,
                    maxWidth: '90px'
                  }}
                >
                  {app.title}
                </span>
              </button>
            );
          })}

          {/* "+ Add Apps" tile like The Dot */}
          {isCeo && onOpenInvite && (
            <button
              onClick={onOpenInvite}
              aria-label="Add Apps or Invite Teammate"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '18px 10px',
                backgroundColor: 'rgba(255, 95, 85, 0.05)',
                border: '1px dashed var(--shiftpe-coral-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'var(--shiftpe-coral)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--shiftpe-coral-border)';
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--shiftpe-coral-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--shiftpe-coral)'
                }}
              >
                <Plus size={20} />
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--shiftpe-coral)',
                  textAlign: 'center'
                }}
              >
                Invite Teammate
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Action & Community Cards (Two Column The Dot Banner) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '18px'
        }}
      >
        {/* Left Card: ACTION FOR YOU */}
        <div
          style={{
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            padding: '22px 24px',
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                color: 'var(--shiftpe-coral)',
                marginBottom: '6px'
              }}
            >
              ACTION FOR YOU | ShiftPe Teammate Hub
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
              Complete Your Onboarding & 2FA Verification
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.45, marginBottom: '14px' }}>
              As a teammate at ShiftPe, complete your department designation, contact information, and security settings for full CRM directory and ledger access.
            </p>

            {/* Progress Bar */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--muted)' }}>Onboarding Status</span>
                <span style={{ fontWeight: 700, color: user?.onboardingCompleted ? 'var(--accent-green)' : 'var(--shiftpe-coral)' }}>
                  {user?.onboardingCompleted ? '100% Completed' : '50% Pending'}
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--surface-subtle)',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: user?.onboardingCompleted ? '100%' : '50%',
                    backgroundColor: user?.onboardingCompleted ? 'var(--accent-green)' : 'var(--shiftpe-coral)',
                    borderRadius: 'var(--radius-full)'
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text)' }}>
              <strong>Next Step:</strong> {user?.onboardingCompleted ? 'Check today’s tasks' : 'Complete profile & password'}
            </div>
            {user?.onboardingCompleted ? (
              <button
                onClick={() => onSelectTab('Attendance')}
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--shiftpe-coral)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Log Attendance &rarr;
              </button>
            ) : (
              <button
                onClick={onOpenOnboarding}
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--shiftpe-coral)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Complete Now &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Right Card: Lab45 / Lab-n-Learn Feature Card */}
        <div
          onClick={() => onSelectTab('Wiki')}
          style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(52, 211, 153, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(52, 211, 153, 0.4)'
                }}
              >
                Lab45 &bull; Engineering
              </span>
              <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Read Article &rarr;
              </span>
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: 800, lineHeight: 1.3, marginBottom: '10px' }}>
              ShiftPe Architecture & Scale Sessions are back! | Review Docs Today
            </h3>

            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.45 }}>
              Learn how we scaled real-time shift matchmaking, 20-week verifiable contribution ledgers, and zero-trust authentication.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#064e3b'
                }}
              >
                A
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>
                Ajay Founder &bull; 2 hours ago
              </span>
            </div>

            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
              1,570 views &bull; 1,570 reactions
            </span>
          </div>
        </div>
      </div>

      {/* 5. Bottom Three-Column Intelligence Grid (The Dot Signature Footer Row) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '18px'
        }}
      >
        {/* Column 1: Quick Links */}
        <div
          style={{
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', marginBottom: '14px' }}>
            Quick Links
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => onSelectTab('Wiki')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--line)',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <FileText size={16} color="var(--shiftpe-coral)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>
                  Team Resources & SLAs
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  Customer directory and privacy standards
                </div>
              </div>
              <ChevronRight size={14} color="var(--muted)" />
            </button>

            <button
              onClick={() => onSelectTab('Bulletin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--line)',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <Megaphone size={16} color="var(--accent-blue)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>
                  Community & All-Hands Events
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  CEO broadcasts and company milestones
                </div>
              </div>
              <ChevronRight size={14} color="var(--muted)" />
            </button>

            <button
              onClick={() => onSelectTab('People')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--line)',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <Users size={16} color="var(--accent-green)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>
                  Teammate Support & Directory
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  Contact domain leads and executives
                </div>
              </div>
              <ChevronRight size={14} color="var(--muted)" />
            </button>
          </div>
        </div>

        {/* Column 2: Upcoming Events List */}
        <div
          style={{
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', marginBottom: '14px' }}>
            Upcoming Events List
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Event 1 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--line)'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--shiftpe-coral-light)',
                  border: '1px solid var(--shiftpe-coral-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--shiftpe-coral)',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 900, lineHeight: 1 }}>18</span>
                <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>Nov</span>
              </div>

              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>
                  Weekly ShiftPe All-Hands & Demo
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                  Virtual &bull; 12:00 - 12:45 PM
                </div>
              </div>
            </div>

            {/* Event 2 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--line)'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-blue)',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 900, lineHeight: 1 }}>24</span>
                <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>Nov</span>
              </div>

              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>
                  Sprint Retrospective & Ledger Review
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                  Virtual &bull; 4:00 - 5:00 PM
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Checklist (The Dot Signature Interactive Widget) */}
        <div
          style={{
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>
              Checklist
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
              Click to view pending items
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Pending Tasks Toggle */}
            <div
              style={{
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden'
              }}
            >
              <button
                onClick={() =>
                  setActiveChecklistSection(activeChecklistSection === 'tasks' ? ('' as any) : 'tasks')
                }
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  backgroundColor: 'var(--surface-subtle)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckSquare size={15} color="var(--shiftpe-coral)" />
                  <span>Pending Tasks</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--shiftpe-coral)' }}>
                  {activeChecklistSection === 'tasks' ? '−' : '+'}
                </span>
              </button>

              {activeChecklistSection === 'tasks' && (
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {checklistTasks.length > 0 ? (
                    checklistTasks.slice(0, 3).map((task) => (
                      <div
                        key={task._id}
                        onClick={() => toggleTaskStatus(task._id, task.status)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          color: task.status === 'done' ? 'var(--muted)' : 'var(--text)',
                          textDecoration: task.status === 'done' ? 'line-through' : 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={task.status === 'done'}
                          onChange={() => {}}
                          aria-label={task.title}
                        />
                        <span>{task.title}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
                      All personal tasks up to date &bull; Good job!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Approvals Toggle */}
            <div
              style={{
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden'
              }}
            >
              <button
                onClick={() => {
                  if (isCeo) onSelectTab('Approvals');
                  else setActiveChecklistSection(activeChecklistSection === 'approvals' ? ('' as any) : 'approvals');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  backgroundColor: 'var(--surface-subtle)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={15} color="var(--accent-blue)" />
                  <span>Approvals</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--accent-blue)' }}>
                  {isCeo ? 'Review →' : activeChecklistSection === 'approvals' ? '−' : '+'}
                </span>
              </button>

              {activeChecklistSection === 'approvals' && !isCeo && (
                <div style={{ padding: '10px 12px', fontSize: '11.5px', color: 'var(--muted)' }}>
                  Your submitted deliverables are currently under review by executive leadership.
                </div>
              )}
            </div>

            {/* Requests Toggle */}
            <div
              style={{
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden'
              }}
            >
              <button
                onClick={() => onSelectTab('Work')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  backgroundColor: 'var(--surface-subtle)',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={15} color="var(--accent-green)" />
                  <span>Work & Requests</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--accent-green)' }}>
                  +
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
