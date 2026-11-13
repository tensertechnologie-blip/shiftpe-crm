import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavTab } from '../types';
import {
  Clock,
  Briefcase,
  GitCommit,
  Users,
  CreditCard,
  ChevronRight,
  Megaphone,
  BookOpen,
  KeyRound
} from 'lucide-react';

interface QuickTilesProps {
  onSelectTab: (tab: NavTab) => void;
}

export const QuickTiles: React.FC<QuickTilesProps> = ({ onSelectTab }) => {
  const { user } = useAuth();
  const isExecutive = user?.role === 'ceo' || (user?.email && (user.email.includes('.founder@shiftpe.in') || user.email === 'founders@shiftpe.in'));
  const tiles = [
    {
      title: 'Daily Attendance',
      description: 'Log check-in / check-out with verified server time.',
      dotColor: 'var(--dot-teal)',
      tab: 'Attendance' as NavTab,
      icon: Clock
    },
    {
      title: 'Submit Work',
      description: 'Record deliverables and PR links for CEO credit review.',
      dotColor: 'var(--dot-green)',
      tab: 'Work' as NavTab,
      icon: Briefcase
    },
    {
      title: 'Contribution Graph',
      description: '20-week verified activity heatmap & leaderboard.',
      dotColor: 'var(--dot-purple)',
      tab: 'Contributions' as NavTab,
      icon: GitCommit
    },
    {
      title: 'People & Org Tree',
      description: 'Explore team directory, skills, and reporting lines.',
      dotColor: 'var(--dot-blue)',
      tab: 'People' as NavTab,
      icon: Users
    },
    {
      title: 'Bulletin & Legacy',
      description: 'Official CEO broadcasts, founding charter, and 2026 handbook.',
      dotColor: 'var(--dot-coral)',
      tab: 'Bulletin' as NavTab,
      icon: Megaphone
    },
    {
      title: 'Salary & Payslips',
      description: 'Confidential monthly compensation and payout records.',
      dotColor: 'var(--dot-amber)',
      tab: 'Salary' as NavTab,
      icon: CreditCard
    },
    {
      title: 'Enterprise Wiki',
      description: 'Customer directory at scale, SLAs, and privacy policies.',
      dotColor: 'var(--dot-green)',
      tab: 'Wiki' as NavTab,
      icon: BookOpen
    },
    ...(isExecutive ? [{
      title: 'CRM Access Control',
      description: 'Authorize or revoke teammate business emails for CRM.',
      dotColor: 'var(--dot-coral)',
      tab: 'CRM Access' as NavTab,
      icon: KeyRound
    }] : [])
  ];

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px'
      }}>
        {tiles.map((tile, idx) => {
          const Icon = tile.icon;
          return (
            <div
              key={idx}
              onClick={() => onSelectTab(tile.tab)}
              style={{
                backgroundColor: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px',
                cursor: 'pointer',
                transition: 'var(--transition)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: 'var(--card-shadow)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--shiftpe-teal-border)';
                e.currentTarget.style.backgroundColor = 'var(--panel-hover)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--line)';
                e.currentTarget.style.backgroundColor = 'var(--panel)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: tile.dotColor
                    }} />
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>
                      {tile.title}
                    </span>
                  </div>
                  <Icon size={15} color="var(--subtle)" />
                </div>

                <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4, marginBottom: '12px' }}>
                  {tile.description}
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--shiftpe-teal)'
              }}>
                <span>Open {tile.tab}</span>
                <ChevronRight size={12} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
