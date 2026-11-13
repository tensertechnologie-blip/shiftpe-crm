import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, ShieldCheck } from 'lucide-react';

export const HeroGreeting: React.FC = () => {
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(' ')[0] : 'Teammate';

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  return (
    <div style={{
      backgroundColor: 'var(--panel)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--radius-lg)',
      padding: '24px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px',
      flexWrap: 'wrap',
      boxShadow: 'var(--card-shadow)',
      transition: 'var(--transition)'
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--shiftpe-teal)', fontWeight: 700 }}>
            ShiftPe Team Workspace
          </span>
          <span style={{ color: 'var(--subtle)', fontSize: '12px' }}>&bull;</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--subtle)', fontSize: '12px' }}>
            <Calendar size={12} />
            {todayStr}
          </span>
        </div>

        <h1 style={{
          fontSize: '24px',
          fontWeight: 800,
          letterSpacing: '-0.5px',
          lineHeight: 1.2
        }}>
          Hi <span style={{ color: 'var(--shiftpe-teal)' }}>{firstName}</span>! Welcome to ShiftPe.
        </h1>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: 'var(--shiftpe-teal-light)',
          border: '1px solid var(--shiftpe-teal-border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
          color: 'var(--shiftpe-teal)',
          fontWeight: 600
        }}>
          <ShieldCheck size={14} />
          <span>2FA Protected</span>
        </div>

        <div style={{
          padding: '6px 12px',
          backgroundColor: 'var(--surface-subtle)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px',
          color: 'var(--muted)'
        }}>
          Domain: <strong style={{ color: 'var(--text)' }}>{user?.domain || 'Executive'}</strong>
        </div>
      </div>
    </div>
  );
};
