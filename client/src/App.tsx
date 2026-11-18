import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { NavTab } from './types';
import { AuthView } from './components/AuthView';
import { TopNavbar } from './components/TopNavbar';
import { DotDashboardView } from './components/DotDashboardView';
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
import { AuditLogView } from './components/AuditLogView';
import { UrgentAlertBanner } from './components/UrgentAlertBanner';

const tabToHash = (tab: NavTab): string => {
  switch (tab) {
    case 'Home': return '#/home';
    case 'Attendance': return '#/attendance';
    case 'Work': return '#/work';
    case 'Contributions': return '#/contributions';
    case 'Salary': return '#/salary';
    case 'People': return '#/people';
    case 'Organisation': return '#/organisation';
    case 'Bulletin': return '#/bulletin';
    case 'Wiki': return '#/wiki';
    case 'Approvals': return '#/approvals';
    case 'CRM Access': return '#/crm-access';
    case 'Audit Log': return '#/audit-log';
    default: return '#/home';
  }
};

const hashToTab = (hash: string): NavTab => {
  const clean = hash.replace(/^#\/?/, '').toLowerCase().trim();
  switch (clean) {
    case 'attendance': return 'Attendance';
    case 'work': return 'Work';
    case 'contributions': return 'Contributions';
    case 'salary': return 'Salary';
    case 'people': return 'People';
    case 'organisation':
    case 'organization': return 'Organisation';
    case 'bulletin': return 'Bulletin';
    case 'wiki': return 'Wiki';
    case 'approvals': return 'Approvals';
    case 'crm-access':
    case 'crmaccess': return 'CRM Access';
    case 'audit-log':
    case 'audit': return 'Audit Log';
    case 'home':
    case '':
    default:
      return 'Home';
  }
};

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('Home');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [urgentAlert, setUrgentAlert] = useState<{
    title: string;
    message: string;
    actionText?: string;
    onAction?: () => void;
  } | null>(null);

  // Hash routing synchronization
  useEffect(() => {
    const syncTabFromHash = () => {
      const tab = hashToTab(window.location.hash);
      // Admin tabs are visible only to the CEO
      if ((tab === 'Approvals' || tab === 'CRM Access' || tab === 'Audit Log') && user?.role !== 'ceo') {
        window.location.hash = '#/home';
        setActiveTab('Home');
      } else {
        setActiveTab(tab);
      }
    };

    syncTabFromHash();
    window.addEventListener('hashchange', syncTabFromHash);
    return () => window.removeEventListener('hashchange', syncTabFromHash);
  }, [user?.role]);

  const handleSelectTab = (tab: NavTab) => {
    window.location.hash = tabToHash(tab);
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg)',
        color: 'var(--text)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--line)',
            borderTopColor: 'var(--shiftpe-coral)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 600 }}>
            Loading ShiftPe Workspace...
          </div>
        </div>
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
      {/* 1. Top Navbar ("The Dot" Category Navigation) */}
      <TopNavbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenInvite={() => setIsInviteOpen(true)}
        onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
        onUrgentAlertChange={setUrgentAlert}
      />

      {/* Urgent Organization Alert Banner (Pop-up) */}
      {urgentAlert && (
        <UrgentAlertBanner
          title={urgentAlert.title}
          message={urgentAlert.message}
          actionText={urgentAlert.actionText}
          onAction={urgentAlert.onAction}
          onDismiss={() => setUrgentAlert(null)}
        />
      )}

      {/* 2. Main Workspace Canvas */}
      <main style={{ flex: 1, padding: '28px 32px', minWidth: 0, maxWidth: '1480px', width: '100%', margin: '0 auto' }}>
        {activeTab === 'Home' && (
          <DotDashboardView
            onSelectTab={handleSelectTab}
            onOpenInvite={() => setIsInviteOpen(true)}
            onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
          />
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
        {activeTab === 'Audit Log' && <AuditLogView />}
      </main>

      {/* CEO Invite Teammate Modal */}
      <CeoInviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />

      {/* Onboarding Profile Modal */}
      {isOnboardingModalOpen && (
        <OnboardingView
          isModal
          onClose={() => setIsOnboardingModalOpen(false)}
        />
      )}
    </div>
  );
};
