import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShiftPeLogo } from './ShiftPeLogo';
import { NotificationPanel } from './NotificationPanel';
import { NavTab } from '../types';
import {
  LayoutDashboard,
  Users,
  Network,
  Clock,
  Briefcase,
  GitCommit,
  CreditCard,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  UserPlus,
  Sun,
  Moon,
  Megaphone,
  AlertCircle,
  BookOpen,
  KeyRound,
  LucideIcon
} from 'lucide-react';

interface TopBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenInvite?: () => void;
  onOpenOnboarding?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ activeTab, onSelectTab, onOpenInvite, onOpenOnboarding }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isExecutive = user?.role === 'ceo' || (user?.email && (user.email.includes('.founder@shiftpe.in') || user.email === 'founders@shiftpe.in'));

  const navItems: { label: NavTab; icon: LucideIcon; ceoOnly?: boolean }[] = [
    { label: 'Home', icon: LayoutDashboard },
    { label: 'People', icon: Users },
    { label: 'Organisation', icon: Network },
    { label: 'Attendance', icon: Clock },
    { label: 'Work', icon: Briefcase },
    { label: 'Contributions', icon: GitCommit },
    { label: 'Salary', icon: CreditCard },
    { label: 'Bulletin', icon: Megaphone },
    { label: 'Wiki', icon: BookOpen },
    { label: 'Approvals', icon: CheckCircle2, ceoOnly: true },
    { label: 'CRM Access', icon: KeyRound, ceoOnly: true }
  ];

  return (
    <header style={{
      height: '62px',
      backgroundColor: 'var(--panel)',
      borderBottom: '1px solid var(--line)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--card-shadow)',
      transition: 'var(--transition)'
    }}>
      {/* Brand Logo & Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        {/* ShiftPe Official Lockup */}
        <ShiftPeLogo size="sm" onClick={() => onSelectTab('Home')} />

        {/* Navigation tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {navItems.map((item) => {
            if (item.ceoOnly && !isExecutive) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.label;

            return (
              <button
                key={item.label}
                onClick={() => onSelectTab(item.label)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 13px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--shiftpe-teal)' : 'var(--muted)',
                  backgroundColor: isActive ? 'var(--shiftpe-teal-light)' : 'transparent',
                  border: isActive ? '1px solid var(--shiftpe-teal-border)' : '1px solid transparent',
                  transition: 'var(--transition)',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text)';
                    e.currentTarget.style.backgroundColor = 'var(--panel-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--muted)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon size={14} color={isActive ? 'var(--shiftpe-teal)' : 'currentColor'} />
                <span>{item.label}</span>
                {item.label === 'Approvals' && (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--shiftpe-teal)',
                    boxShadow: '0 0 6px var(--shiftpe-teal)'
                  }} />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right controls: Invite button (CEO), Theme Toggle, User Badge, Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {user?.role === 'ceo' && onOpenInvite && (
          <button
            onClick={onOpenInvite}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--shiftpe-teal)',
              color: 'var(--button-text-on-teal)',
              fontWeight: 700,
              fontSize: '12px',
              padding: '7px 14px',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 2px 10px var(--shiftpe-teal-glow)',
              transition: 'var(--transition)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--shiftpe-teal-hover)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--shiftpe-teal)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <UserPlus size={14} />
            <span>Invite</span>
          </button>
        )}

        {/* Pending Onboarding Reminder Pill */}
        {user && !user.onboardingCompleted && onOpenOnboarding && (
          <button
            onClick={onOpenOnboarding}
            title="Complete your teammate onboarding & profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--shiftpe-coral-light)',
              border: '1px solid var(--shiftpe-coral-border)',
              color: 'var(--shiftpe-coral)',
              fontWeight: 700,
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              boxShadow: 'var(--card-glow)',
              transition: 'var(--transition)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--shiftpe-coral)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--shiftpe-coral-light)';
              e.currentTarget.style.color = 'var(--shiftpe-coral)';
            }}
          >
            <AlertCircle size={14} />
            <span>Complete Profile</span>
          </button>
        )}

        {/* Notifications Flyout Panel */}
        <NotificationPanel
          onOpenOnboarding={onOpenOnboarding}
          onSelectTab={onSelectTab}
        />

        {/* Theme Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--line)',
            backgroundColor: 'var(--surface-subtle)',
            color: theme === 'dark' ? 'var(--shiftpe-teal)' : 'var(--accent-amber)',
            transition: 'var(--transition)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--shiftpe-teal-border)';
            e.currentTarget.style.backgroundColor = 'var(--panel-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--line)';
            e.currentTarget.style.backgroundColor = 'var(--surface-subtle)';
          }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* User Card */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '5px 12px',
          backgroundColor: 'var(--surface-subtle)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--line)'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: user?.role === 'ceo' ? 'var(--shiftpe-teal)' : 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '11.5px',
            color: 'var(--button-text-on-teal)'
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
            <div style={{ fontSize: '12.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>{user?.name}</span>
              {user?.role === 'ceo' && <ShieldCheck size={13} color="var(--shiftpe-teal)" />}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--subtle)' }}>
              <span style={{ textTransform: 'capitalize', color: 'var(--muted)' }}>{user?.role}</span> &bull; {user?.designation}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--subtle)',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--line)',
            transition: 'var(--transition)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--status-rejected)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--subtle)';
            e.currentTarget.style.borderColor = 'var(--line)';
          }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
};
