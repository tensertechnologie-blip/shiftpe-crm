import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Calendar, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface TaskItem {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'doing' | 'done';
}

interface ChecklistPanelProps {
  onOpenOnboarding?: () => void;
}

export const ChecklistPanel: React.FC<ChecklistPanelProps> = ({ onOpenOnboarding }) => {
  const { token, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks/my', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
      }
    } catch (e) {
      console.error('Failed to load checklist tasks:', e);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [token]);

  const toggleTaskStatus = async (task: TaskItem) => {
    if (task.title.includes('Onboarding') && task.status !== 'done' && onOpenOnboarding) {
      onOpenOnboarding();
      return;
    }

    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    try {
      const res = await fetch(`/api/tasks/${task._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t._id === task._id ? { ...t, status: nextStatus } : t))
        );
      }
    } catch (e) {
      console.error('Failed to toggle task:', e);
    }
  };

  const pendingTasks = tasks.filter((t) => t.status !== 'done');

  return (
    <aside style={{
      width: '320px',
      backgroundColor: 'var(--panel)',
      borderLeft: '1px solid var(--line)',
      height: 'calc(100vh - 68px)',
      position: 'sticky',
      top: '68px',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 20px',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckSquare size={18} color="var(--accent-green)" />
          <h3 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.2px' }}>
            Daily Checklist
          </h3>
        </div>

        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: pendingTasks.length > 0 ? 'rgba(255, 183, 77, 0.15)' : 'rgba(0, 255, 136, 0.15)',
          color: pendingTasks.length > 0 ? 'var(--status-pending)' : 'var(--accent-green)'
        }}>
          {pendingTasks.length} Pending
        </span>
      </div>

      {/* Pending Onboarding Action Notification */}
      {user && !user.onboardingCompleted && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 14px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--shiftpe-coral-light)',
          border: '1px solid var(--shiftpe-coral-border)',
          boxShadow: 'var(--card-glow)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--shiftpe-coral)', marginBottom: '4px' }}>
            <AlertCircle size={14} />
            <span style={{ fontSize: '12px', fontWeight: 700 }}>Profile Onboarding Pending</span>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--muted)', lineHeight: 1.4, marginBottom: '10px' }}>
            You postponed onboarding. Set your department, designation, and permanent password.
          </p>
          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              style={{
                width: '100%',
                padding: '7px 10px',
                backgroundColor: 'var(--shiftpe-coral)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
            >
              Complete Profile Setup &rarr;
            </button>
          )}
        </div>
      )}

      {/* Collapsible Section */}
      <div style={{
        backgroundColor: 'var(--bg)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden'
      }}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            width: '100%',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--surface-subtle)',
            borderBottom: isCollapsed ? 'none' : '1px solid var(--line)',
            color: 'var(--text)',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          <span>Assigned Tasks ({tasks.length})</span>
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>

        {!isCollapsed && (
          <div style={{ padding: '12px' }}>
            {tasks.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '12px' }}>
                No tasks assigned yet. CEO can assign items from the task manager.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tasks.map((task) => {
                  const isDone = task.status === 'done';
                  return (
                    <div
                      key={task._id}
                      onClick={() => toggleTaskStatus(task)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isDone ? 'transparent' : 'var(--panel)',
                        border: '1px solid',
                        borderColor: isDone ? 'transparent' : 'var(--line)',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                        opacity: isDone ? 0.45 : 1
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => {}}
                        style={{
                          marginTop: '3px',
                          cursor: 'pointer',
                          accentColor: 'var(--accent-green)'
                        }}
                      />

                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '12.5px',
                          fontWeight: 600,
                          color: isDone ? 'var(--subtle)' : 'var(--text)',
                          textDecoration: isDone ? 'line-through' : 'none',
                          lineHeight: 1.3
                        }}>
                          {task.title}
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginTop: '6px',
                          fontSize: '11px',
                          color: 'var(--muted)'
                        }}>
                          {task.dueDate && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={11} />
                              {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          )}

                          {task.priority === 'high' && (
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              color: 'var(--status-rejected)',
                              fontWeight: 600
                            }}>
                              <AlertCircle size={10} />
                              High
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Intranet Links */}
      <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
        <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--subtle)', letterSpacing: '0.8px', marginBottom: '12px', fontWeight: 700 }}>
          Company Quicklinks
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a
            href="mailto:ajay.founder@shiftpe.in"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12.5px',
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'var(--transition)'
            }}
          >
            <span>ShiftPe Mail (@shiftpe.in)</span>
            <span style={{ color: 'var(--accent-green)', fontSize: '10px' }}>&rarr;</span>
          </a>

          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12.5px',
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'var(--transition)'
            }}
          >
            <span>Team Shared Calendar</span>
            <span style={{ color: 'var(--accent-green)', fontSize: '10px' }}>&rarr;</span>
          </a>
        </div>
      </div>
    </aside>
  );
};
