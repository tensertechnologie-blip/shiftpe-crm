import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { NavTab } from './types';
import { AuthView } from './components/AuthView';
import { TopBar } from './components/TopBar';
import { HeroGreeting } from './components/HeroGreeting';
import { QuickTiles } from './components/QuickTiles';
import { ChecklistPanel } from './components/ChecklistPanel';
import { CeoInviteModal } from './components/CeoInviteModal';
import { PeopleView } from './components/PeopleView';
import { OrgTreeView } from './components/OrgTreeView';
import { AttendanceView } from './components/AttendanceView';
import { WorkView } from './components/WorkView';
import { ApprovalsView } from './components/ApprovalsView';
import { ContributionGraphView } from './components/ContributionGraphView';
import { SalaryView } from './components/SalaryView';
import { BulletinView } from './components/BulletinView';
import { OnboardingView } from './components/OnboardingView';
import { WikiView } from './components/WikiView';
import { CrmAccessView } from './components/CrmAccessView';
import { Shield, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('Home');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid var(--line)',
          borderTopColor: 'var(--accent-green)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '13px', color: 'var(--muted)', letterSpacing: '0.5px' }}>
          Initializing ShiftPe Workspace...
        </span>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  // Initial Onboarding Screen with Skip Option
  if (!user.onboardingCompleted && !user.onboardingSkipped) {
    return <OnboardingView />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenInvite={() => setIsInviteOpen(true)}
        onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Main Workspace Canvas */}
        <main style={{ flex: 1, padding: '32px 36px', maxWidth: '1200px' }}>
          {activeTab === 'Home' && (
            <>
              {/* Notification Banner: Profile Setup Pending */}
              {user && !user.onboardingCompleted && (
                <div style={{
                  marginBottom: '20px',
                  padding: '14px 20px',
                  backgroundColor: 'var(--shiftpe-coral-light)',
                  border: '1px solid var(--shiftpe-coral-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  boxShadow: 'var(--card-glow)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      padding: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--shiftpe-coral)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <AlertCircle size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>
                        Teammate Onboarding & Profile Setup Pending
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                        You skipped initial onboarding. Set your department, designation, phone, and permanent password.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsOnboardingModalOpen(true)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--shiftpe-coral)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px var(--shiftpe-coral-glow)'
                    }}
                  >
                    Complete Profile &rarr;
                  </button>
                </div>
              )}

              <HeroGreeting />
              <QuickTiles onSelectTab={setActiveTab} />

              {/* Status Summary Cards */}
              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{
                  backgroundColor: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  boxShadow: 'var(--card-shadow)'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px', fontWeight: 600 }}>
                    ShiftPe Account Identity
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--shiftpe-teal)' }}>
                    <Shield size={15} />
                    <span>{user.email}</span>
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  boxShadow: 'var(--card-shadow)'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px', fontWeight: 600 }}>
                    Privilege & Domain
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', textTransform: 'capitalize' }}>
                    {user.role} &bull; {user.designation}
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  boxShadow: 'var(--card-shadow)'
                }}>
                  <div style={{ fontSize: '11px', color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px', fontWeight: 600 }}>
                    Portal Architecture
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-green)' }}>
                    ShiftPe CRM v1.0 Production
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'People' && <PeopleView />}
          {activeTab === 'Organisation' && <OrgTreeView />}
          {activeTab === 'Attendance' && <AttendanceView />}
          {activeTab === 'Work' && <WorkView />}
          {activeTab === 'Approvals' && <ApprovalsView />}
          {activeTab === 'Contributions' && <ContributionGraphView />}
          {activeTab === 'Salary' && <SalaryView />}
          {activeTab === 'Bulletin' && <BulletinView />}
          {activeTab === 'Wiki' && <WikiView />}
          {activeTab === 'CRM Access' && <CrmAccessView />}
        </main>

        {/* Right-hand Checklist Panel */}
        <ChecklistPanel onOpenOnboarding={() => setIsOnboardingModalOpen(true)} />
      </div>

      {/* CEO Invite Modal */}
      <CeoInviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />

      {/* Onboarding Modal (When reopened from reminder or task) */}
      {isOnboardingModalOpen && (
        <OnboardingView
          isModal
          onClose={() => setIsOnboardingModalOpen(false)}
        />
      )}
    </div>
  );
};
