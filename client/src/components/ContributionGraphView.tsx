import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { GitCommit, Trophy, Star, Clock, Award, Flame } from 'lucide-react';

interface DayStat {
  date: string;
  credits: number;
  count: number;
  level: number; // 0 to 4
}

interface LeaderboardEntry {
  _id: string;
  name: string;
  email: string;
  designation: string;
  domain: string;
  role: string;
  totalCredits: number;
  totalHours: number;
  deliverablesCount: number;
}

export const ContributionGraphView: React.FC = () => {
  const { token } = useAuth();
  const [days, setDays] = useState<DayStat[]>([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [hoveredDay, setHoveredDay] = useState<DayStat | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [graphRes, lbRes] = await Promise.all([
          fetch('/api/work/contributions', {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include'
          }),
          fetch('/api/work/leaderboard', {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include'
          })
        ]);

        if (graphRes.ok) {
          const gData = await graphRes.json();
          setDays(gData.days);
          setTotalCredits(gData.totalCredits);
          setTotalHours(gData.totalHours);
          setTotalSubmissions(gData.totalSubmissions);
        }

        if (lbRes.ok) {
          const lbData = await lbRes.json();
          setLeaderboard(lbData.leaderboard);
        }
      } catch (err) {
        console.error('Failed to load contributions & leaderboard:', err);
      }
    };

    fetchData();
  }, [token]);

  const getCellColor = (level: number) => {
    switch (level) {
      case 1:
        return 'rgba(0, 255, 136, 0.25)';
      case 2:
        return 'rgba(0, 255, 136, 0.5)';
      case 3:
        return 'rgba(0, 255, 136, 0.75)';
      case 4:
        return 'var(--accent-green)';
      default:
        return 'var(--surface-subtle)';
    }
  };

  // Group 140 days into 20 columns of 7 rows (Sunday to Saturday)
  const columns: DayStat[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7));
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <GitCommit size={24} color="var(--accent-green)" />
          <span>Validated Contributions & Activity</span>
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '13.5px', marginTop: '4px' }}>
          20-week rolling activity graph computed exclusively from CEO-approved deliverables and credits.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div style={{ padding: '20px', backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--subtle)', fontWeight: 700 }}>Total Approved Credits</span>
            <Star size={18} color="var(--accent-green)" fill="var(--accent-green)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-green)' }}>
            {totalCredits} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--muted)' }}>credits</span>
          </div>
        </div>

        <div style={{ padding: '20px', backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--subtle)', fontWeight: 700 }}>Verified Hours Logged</span>
            <Clock size={18} color="var(--accent-teal)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text)' }}>
            {totalHours} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--muted)' }}>hours</span>
          </div>
        </div>

        <div style={{ padding: '20px', backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--subtle)', fontWeight: 700 }}>Approved Deliverables</span>
            <Award size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#d47aff' }}>
            {totalSubmissions} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--muted)' }}>deliverables</span>
          </div>
        </div>
      </div>

      {/* GitHub-style 20-week Heatmap */}
      <div style={{
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        marginBottom: '32px',
        overflowX: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={18} color="var(--accent-green)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Activity Heatmap (Past 20 Weeks)</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--muted)' }}>
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((lvl) => (
              <div
                key={lvl}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  backgroundColor: getCellColor(lvl),
                  border: lvl === 0 ? '1px solid var(--line)' : 'none'
                }}
              />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* The Grid */}
        <div style={{ display: 'inline-flex', gap: '4px', paddingBottom: '8px' }}>
          {columns.map((col, colIdx) => (
            <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {col.map((day) => (
                <div
                  key={day.date}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '2px',
                    backgroundColor: getCellColor(day.level),
                    border: day.level === 0 ? '1px solid var(--line)' : 'none',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Hover info tooltip */}
        <div style={{ marginTop: '12px', height: '20px', fontSize: '12.5px', color: hoveredDay ? 'var(--text)' : 'var(--subtle)' }}>
          {hoveredDay ? (
            <span>
              <strong style={{ color: 'var(--accent-green)' }}>{hoveredDay.credits} credits</strong> across {hoveredDay.count} approved work item(s) on {hoveredDay.date}
            </span>
          ) : (
            <span>Hover over any day square to inspect validated credits and date.</span>
          )}
        </div>
      </div>

      {/* Team Leaderboard */}
      <div style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Trophy size={18} color="var(--accent-green)" />
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>ShiftPe Contribution Leaderboard</h3>
        </div>

        {leaderboard.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)', fontSize: '13.5px' }}>
            No approved deliverables recorded on the leaderboard yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)', color: 'var(--subtle)', textTransform: 'uppercase', fontSize: '11px' }}>
                <th style={{ padding: '12px 20px', width: '60px' }}>Rank</th>
                <th style={{ padding: '12px 20px' }}>Teammate</th>
                <th style={{ padding: '12px 20px' }}>Domain</th>
                <th style={{ padding: '12px 20px' }}>Deliverables</th>
                <th style={{ padding: '12px 20px' }}>Hours</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>Total Credits</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => (
                <tr key={entry._id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 800, color: idx === 0 ? 'var(--accent-green)' : idx === 1 ? '#d47aff' : 'var(--muted)' }}>
                    #{idx + 1}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{entry.name}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>{entry.designation}</div>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--muted)' }}>{entry.domain}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text)' }}>{entry.deliverablesCount}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{entry.totalHours} hrs</td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(0, 255, 136, 0.12)',
                      color: 'var(--accent-green)',
                      fontWeight: 800,
                      fontSize: '13px'
                    }}>
                      <Star size={13} fill="var(--accent-green)" />
                      {entry.totalCredits}
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
