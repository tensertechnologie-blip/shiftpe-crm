import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShiftPeLogo } from './ShiftPeLogo';
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
  Megaphone,
  BookOpen,
  KeyRound,
  ShieldAlert,
  Building2,
  ShieldCheck,
  X,
  Sun,
  Moon,
  LogOut,
  UserPlus,
  AlertCircle,
  LucideIcon
} from 'lucide-react';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenInvite?: () => void;
  onOpenOnboarding?: () => void;
}

interface AppItem {
  id: NavTab;
  name: string;
  desc: string;
  icon: LucideIcon;
  badge?: string;
}

interface CategoryGroup {
  id: 'work' | 'people' | 'company' | 'admin';
  name: string;
  icon: LucideIcon;
  tagline: string;
  ceoOnly?: boolean;
  items: AppItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onOpenInvite,
  onOpenOnboarding
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Active hover/clicked popover category
  const [activeCategory, setActiveCategory] = useState<CategoryGroup['id'] | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const isCeo = user?.role === 'ceo';

  const categories: CategoryGroup[] = [
    {
      id: 'work',
      name: 'Work',
      icon: Briefcase,
      tagline: 'Productivity & compensation',
      items: [
        { id: 'Home', name: 'Home Hub', desc: 'Overview, quick access & metrics', icon: LayoutDashboard },
        { id: 'Attendance', name: 'Daily Attendance', desc: 'Check-in, remote mode & work hours', icon: Clock },
        { id: 'Work', name: 'Work Deliverables', desc: 'Submit deliverables & review links', icon: Briefcase },
        { id: 'Contributions', name: 'Contributions', desc: '20-week verified activity heatmap', icon: GitCommit },
        { id: 'Salary', name: 'Salary Ledger', desc: 'Confidential payslips & payment status', icon: CreditCard }
      ]
    },
    {
      id: 'people',
      name: 'People',
      icon: Users,
      tagline: 'Team directory & reporting structure',
      items: [
        { id: 'People', name: 'People Directory', desc: 'Teammates, technical skills & contacts', icon: Users },
        { id: 'Organisation', name: 'Organisation Tree', desc: 'Visual reporting chain to CEO', icon: Network }
      ]
    },
    {
      id: 'company',
      name: 'Company',
      icon: Building2,
      tagline: 'Bulletins & knowledge base',
      items: [
        { id: 'Bulletin', name: 'Company Bulletin', desc: 'Broadcasts, all-hands & official notices', icon: Megaphone },
        { id: 'Wiki', name: 'Wiki Documents', desc: 'Customer documentation & manuals', icon: BookOpen }
      ]
    },
    {
      id: 'admin',
      name: 'Admin',
      icon: ShieldCheck,
      tagline: 'CEO executive administration',
      ceoOnly: true,
      items: [
        { id: 'Approvals', name: 'Work Approvals', desc: 'Evaluate submissions & assign credits', icon: CheckCircle2, badge: 'CEO' },
        { id: 'CRM Access', name: 'CRM Access Roster', desc: 'Whitelist official corporate emails', icon: KeyRound, badge: 'CEO' },
        { id: 'Audit Log', name: 'Security Audit Log', desc: 'Immutable authentication & event trail', icon: ShieldAlert, badge: 'CEO' }
      ]
    }
  ];

  // Helper to determine which category holds the current active tab
  const getParentCategoryId = (tab: NavTab): CategoryGroup['id'] => {
    for (const cat of categories) {
      if (cat.items.some((item) => item.id === tab)) {
        return cat.id;
      }
    }
    return 'work';
  };

  const currentActiveCategory = getParentCategoryId(activeTab);

  const handleMouseEnterCategory = (catId: CategoryGroup['id']) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setActiveCategory(catId);
  };

  const handleMouseLeaveRailOrPopup = () => {
    if (isPinned) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 250);
  };

  const handleSelectApp = (tab: NavTab) => {
    onSelectTab(tab);
    setActiveCategory(null);
    setIsPinned(false);
    if (isOpenMobile) {
      onCloseMobile();
    }
  };

  // Close menus on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (railRef.current && !railRef.current.contains(e.target as Node)) {
        setActiveCategory(null);
        setIsPinned(false);
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveCategory(null);
        setIsPinned(false);
        setIsUserMenuOpen(false);
        if (isOpenMobile) onCloseMobile();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpenMobile, onCloseMobile]);

  const activeCategoryData = categories.find((c) => c.id === activeCategory);

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 48, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 998
          }}
        />
      )}

      {/* Main Container Wrapper */}
      <div
        ref={railRef}
        className={`sidebar-nav ${isOpenMobile ? 'mobile-open' : ''}`}
        style={{
          display: 'flex',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 999,
          flexShrink: 0
        }}
      >
        {/* 1. The Vertical Category Dot Rail (~72px width) */}
        <aside
          role="navigation"
          aria-label="Application categories"
          style={{
            width: '74px',
            height: '100vh',
            backgroundColor: 'var(--panel)',
            borderRight: '1px solid var(--line)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 0',
            boxShadow: 'var(--card-shadow)',
            position: 'relative',
            zIndex: 1002
          }}
          onMouseLeave={handleMouseLeaveRailOrPopup}
        >
          {/* Top: ShiftPe Dot Brand Icon */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => handleSelectApp('Home')}
              aria-label="ShiftPe Home Dashboard"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'var(--shiftpe-coral-light)',
                border: '1px solid var(--shiftpe-coral-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--card-glow)',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.06)';
                e.currentTarget.style.boxShadow = '0 0 16px var(--shiftpe-coral-glow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'var(--card-glow)';
              }}
            >
              <ShiftPeLogo size="sm" variant="icon-only" />
            </button>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.4px' }}>
              ShiftPe
            </span>
          </div>

          {/* Middle: Category Navigation Icons */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', alignItems: 'center' }}>
            {categories.map((cat) => {
              if (cat.ceoOnly && !isCeo) return null;

              const Icon = cat.icon;
              const isSelectedCategory = currentActiveCategory === cat.id;
              const isPopoverOpen = activeCategory === cat.id;

              return (
                <div key={cat.id} style={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' }}>
                  {/* Left Active Indicator Bar */}
                  {isSelectedCategory && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '4px',
                      height: '24px',
                      borderRadius: '0 4px 4px 0',
                      backgroundColor: 'var(--shiftpe-coral)',
                      boxShadow: '0 0 8px var(--shiftpe-coral)'
                    }} />
                  )}

                  <button
                    onClick={() => {
                      if (activeCategory === cat.id && isPinned) {
                        setActiveCategory(null);
                        setIsPinned(false);
                      } else {
                        setActiveCategory(cat.id);
                        setIsPinned(true);
                      }
                    }}
                    onMouseEnter={() => {
                      if (!isPinned) {
                        handleMouseEnterCategory(cat.id);
                      }
                    }}
                    aria-label={`${cat.name} category`}
                    aria-expanded={isPopoverOpen}
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      backgroundColor: isPopoverOpen || isSelectedCategory ? 'var(--shiftpe-coral-light)' : 'transparent',
                      border: isPopoverOpen || isSelectedCategory ? '1px solid var(--shiftpe-coral-border)' : '1px solid transparent',
                      color: isPopoverOpen || isSelectedCategory ? 'var(--shiftpe-coral)' : 'var(--muted)',
                      transition: 'var(--transition)',
                      position: 'relative'
                    }}
                    onMouseLeave={(e) => {
                      if (!isPopoverOpen && !isSelectedCategory) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--muted)';
                      }
                    }}
                  >
                    <Icon size={20} color={isPopoverOpen || isSelectedCategory ? 'var(--shiftpe-coral)' : 'currentColor'} />
                    <span style={{ fontSize: '10px', fontWeight: isSelectedCategory ? 700 : 600 }}>
                      {cat.name}
                    </span>
                  </button>
                </div>
              );
            })}
          </nav>

          {/* Bottom Controls: Invite Teammate (CEO), Theme Switcher, User Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
            {/* Invite Teammate Shortcut */}
            {isCeo && onOpenInvite && (
              <button
                onClick={onOpenInvite}
                title="Invite Teammate"
                aria-label="Invite Teammate"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--shiftpe-coral)',
                  color: 'var(--button-text-on-coral)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 10px var(--shiftpe-coral-glow)',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
              >
                <UserPlus size={16} />
              </button>
            )}

            {/* Profile Setup Warning Dot */}
            {user && !user.onboardingCompleted && onOpenOnboarding && (
              <button
                onClick={onOpenOnboarding}
                title="Profile Setup Pending"
                aria-label="Profile Setup Pending"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 95, 85, 0.12)',
                  border: '1px solid var(--shiftpe-coral-border)',
                  color: 'var(--shiftpe-coral)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AlertCircle size={16} />
              </button>
            )}

            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--line)',
                color: theme === 'dark' ? 'var(--shiftpe-coral)' : 'var(--accent-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* User Profile Avatar with dropdown trigger */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-label="Open User Profile Menu"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: isCeo ? 'var(--shiftpe-coral)' : 'var(--accent-blue)',
                  color: 'var(--button-text-on-coral)',
                  fontWeight: 800,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--card-shadow)',
                  border: '2px solid var(--line)'
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </button>

              {/* User Dropdown Popover */}
              {isUserMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '52px',
                    width: '240px',
                    backgroundColor: 'var(--panel)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                    zIndex: 1005,
                    animation: 'fadeIn 0.15s ease'
                  }}
                >
                  <div style={{ marginBottom: '12px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>
                      {user?.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                      {user?.email}
                    </div>
                    <div style={{
                      marginTop: '6px',
                      display: 'inline-block',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: isCeo ? 'var(--shiftpe-coral-light)' : 'rgba(59, 130, 246, 0.15)',
                      color: isCeo ? 'var(--shiftpe-coral)' : 'var(--accent-blue)'
                    }}>
                      {user?.role} &bull; {user?.designation}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(255, 95, 85, 0.1)',
                      color: 'var(--shiftpe-coral)',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out of ShiftPe</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* 2. Floating Flyout "The Dot" Category Pop-Up Menu */}
        {activeCategoryData && (
          <div
            role="dialog"
            aria-label={`${activeCategoryData.name} Apps`}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            }}
            onMouseLeave={handleMouseLeaveRailOrPopup}
            style={{
              position: 'absolute',
              left: '74px',
              top: '12px',
              width: '320px',
              maxWidth: 'calc(100vw - 86px)',
              maxHeight: 'calc(100vh - 24px)',
              overflowY: 'auto',
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55), var(--card-glow)',
              zIndex: 1001,
              animation: 'flyoutIn 0.16s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <style>{`
              @keyframes flyoutIn {
                from { opacity: 0; transform: translateX(-10px) scale(0.98); }
                to { opacity: 1; transform: translateX(0) scale(1); }
              }
            `}</style>

            {/* Pop-up Category Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              borderBottom: '1px solid var(--line)',
              paddingBottom: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>
                    {activeCategoryData.name}
                  </span>
                  {activeCategoryData.ceoOnly && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--shiftpe-coral)',
                      color: '#ffffff'
                    }}>
                      CEO
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                  {activeCategoryData.tagline}
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveCategory(null);
                  setIsPinned(false);
                }}
                aria-label="Close category flyout"
                style={{
                  padding: '4px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* List of Sub-Apps in this Category ("The Dot" App Launcher Grid) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activeCategoryData.items.map((app) => {
                const AppIcon = app.icon;
                const isCurrentApp = activeTab === app.id;

                return (
                  <button
                    key={app.id}
                    onClick={() => handleSelectApp(app.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isCurrentApp ? 'var(--shiftpe-coral-light)' : 'transparent',
                      border: isCurrentApp ? '1px solid var(--shiftpe-coral-border)' : '1px solid transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrentApp) {
                        e.currentTarget.style.backgroundColor = 'var(--panel-hover)';
                        e.currentTarget.style.borderColor = 'var(--line)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentApp) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isCurrentApp ? 'var(--shiftpe-coral)' : 'var(--surface-subtle)',
                      border: '1px solid var(--line)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isCurrentApp ? 'var(--button-text-on-coral)' : 'var(--text)',
                      flexShrink: 0
                    }}>
                      <AppIcon size={16} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: isCurrentApp ? 'var(--shiftpe-coral)' : 'var(--text)'
                        }}>
                          {app.name}
                        </span>
                        {app.badge && (
                          <span style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'rgba(255, 95, 85, 0.15)',
                            color: 'var(--shiftpe-coral)'
                          }}>
                            {app.badge}
                          </span>
                        )}
                      </div>
                      <p style={{
                        fontSize: '11px',
                        color: 'var(--muted)',
                        marginTop: '2px',
                        lineHeight: 1.3,
                        whiteSpace: 'normal'
                      }}>
                        {app.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
