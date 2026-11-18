import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShiftPeLogo } from './ShiftPeLogo';
import { NavTab } from '../types';
import { NotificationPanel } from './NotificationPanel';
import { EditProfileModal } from './EditProfileModal';
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
  ChevronDown,
  Search,
  Sun,
  Moon,
  LogOut,
  UserPlus,
  AlertCircle,
  Menu,
  X,
  Edit3,
  LucideIcon
} from 'lucide-react';

interface TopNavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenInvite?: () => void;
  onOpenOnboarding?: () => void;
  onUrgentAlertChange?: (alert: any) => void;
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

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenInvite,
  onOpenOnboarding,
  onUrgentAlertChange
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeCategory, setActiveCategory] = useState<CategoryGroup['id'] | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isExecutive = user?.role === 'ceo' || user?.role === 'founder';
  const isCeo = isExecutive;

  // Live real-time clock ticker like "The Dot"
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(now);
      setCurrentTimeStr(formatted.replace(',', ' |'));
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const categories: CategoryGroup[] = [
    {
      id: 'work',
      name: 'Work',
      icon: Briefcase,
      tagline: 'Daily execution & compensation ledger',
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

  // Helper to determine parent category of active tab
  const getParentCategory = (tab: NavTab): CategoryGroup['id'] | null => {
    if (tab === 'Home') return null;
    for (const cat of categories) {
      if (cat.items.some((i) => i.id === tab)) return cat.id;
    }
    return null;
  };

  const currentCategory = getParentCategory(activeTab);

  const handleMouseEnterCategory = (catId: CategoryGroup['id']) => {
    if (isPinned) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setActiveCategory(catId);
  };

  const handleMouseLeaveNav = () => {
    if (isPinned) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 200);
  };

  const handleSelectApp = (tab: NavTab) => {
    onSelectTab(tab);
    setActiveCategory(null);
    setIsPinned(false);
    setIsMobileMenuOpen(false);
  };

  // Close menus on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
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
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const activeCategoryData = categories.find((c) => c.id === activeCategory);

  // Quick search handler for apps
  const allApps = categories.flatMap((c) => (c.ceoOnly && !isCeo ? [] : c.items));
  const filteredApps = searchQuery.trim()
    ? allApps.filter((a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header
      ref={navRef}
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'var(--panel)',
        borderBottom: '1px solid var(--line)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.25)',
        transition: 'var(--transition)'
      }}
      onMouseLeave={handleMouseLeaveNav}
    >
      {/* Main Top Bar */}
      <div
        style={{
          height: '66px',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          maxWidth: '1600px',
          margin: '0 auto'
        }}
      >
        {/* Left: Brand Dot & Categories */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="mobile-hamburger-btn"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--line)',
              backgroundColor: 'var(--surface-subtle)',
              color: 'var(--text)'
            }}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* ShiftPe Dot Brand Lockup */}
          <div
            onClick={() => handleSelectApp('Home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <ShiftPeLogo size="sm" variant="icon-only" />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              <span
                style={{
                  fontSize: '19px',
                  fontWeight: 900,
                  letterSpacing: '-0.5px',
                  color: 'var(--text)'
                }}
              >
                ShiftPe
              </span>
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: 'var(--shiftpe-coral)',
                  lineHeight: 1
                }}
              >
                .
              </span>
            </div>
          </div>

          {/* Category Navigation Links (Desktop) */}
          <nav
            role="navigation"
            aria-label="Top navigation"
            className="desktop-category-nav"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {/* Direct Home Tab */}
            <button
              onClick={() => handleSelectApp('Home')}
              aria-label="Home Dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: activeTab === 'Home' ? 700 : 600,
                color: activeTab === 'Home' ? 'var(--shiftpe-coral)' : 'var(--muted)',
                backgroundColor: activeTab === 'Home' ? 'var(--shiftpe-coral-light)' : 'transparent',
                border: activeTab === 'Home' ? '1px solid var(--shiftpe-coral-border)' : '1px solid transparent',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'Home') {
                  e.currentTarget.style.color = 'var(--text)';
                  e.currentTarget.style.backgroundColor = 'var(--panel-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'Home') {
                  e.currentTarget.style.color = 'var(--muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <LayoutDashboard size={15} />
              <span>Home</span>
            </button>

            {/* Category Dropdowns */}
            {categories.map((cat) => {
              if (cat.ceoOnly && !isCeo) return null;
              const isCatActive = currentCategory === cat.id;
              const isFlyoutOpen = activeCategory === cat.id;

              return (
                <div key={cat.id} style={{ position: 'relative' }}>
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
                    onMouseEnter={() => handleMouseEnterCategory(cat.id)}
                    aria-label={`${cat.name} menu`}
                    aria-expanded={isFlyoutOpen}
                    aria-haspopup="true"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      fontWeight: isCatActive || isFlyoutOpen ? 700 : 600,
                      color: isCatActive || isFlyoutOpen ? 'var(--shiftpe-coral)' : 'var(--muted)',
                      backgroundColor: isCatActive || isFlyoutOpen ? 'var(--shiftpe-coral-light)' : 'transparent',
                      border: isCatActive || isFlyoutOpen ? '1px solid var(--shiftpe-coral-border)' : '1px solid transparent',
                      transition: 'var(--transition)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isCatActive && !isFlyoutOpen) {
                        e.currentTarget.style.color = 'var(--muted)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span>{cat.name}</span>
                    <ChevronDown
                      size={13}
                      style={{
                        transform: isFlyoutOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Right: Search, Time, Controls, Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Quick Search Bar (The Dot style) */}
          <div
            className="dot-search-container"
            style={{
              position: 'relative',
              width: isSearchFocused ? '240px' : '180px',
              transition: 'width 0.25s ease'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: 'var(--surface-subtle)',
                border: isSearchFocused ? '1px solid var(--shiftpe-coral)' : '1px solid var(--line)',
                borderRadius: 'var(--radius-full)',
                boxShadow: isSearchFocused ? '0 0 0 2px var(--shiftpe-coral-glow)' : 'none',
                transition: 'var(--transition)'
              }}
            >
              <Search size={14} color="var(--muted)" />
              <input
                type="text"
                placeholder="Start Searching..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                aria-label="Start Searching ShiftPe apps and features"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '12px',
                  color: 'var(--text)'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  style={{ color: 'var(--muted)', padding: '2px' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Search Autocomplete Dropdown */}
            {isSearchFocused && searchQuery.trim() && (
              <div
                style={{
                  position: 'absolute',
                  top: '42px',
                  right: 0,
                  width: '280px',
                  backgroundColor: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
                  padding: '8px',
                  zIndex: 1010
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', padding: '6px 8px' }}>
                  MATCHING APPS & FEATURES
                </div>
                {filteredApps.length > 0 ? (
                  filteredApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => {
                        handleSelectApp(app.id);
                        setSearchQuery('');
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <app.icon size={15} color="var(--shiftpe-coral)" />
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)' }}>
                          {app.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          {app.desc}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div style={{ padding: '10px', fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>
                    No matching apps found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live Date/Time Ticker */}
          {currentTimeStr && (
            <div
              className="dot-datetime"
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--muted)',
                whiteSpace: 'nowrap',
                padding: '0 4px'
              }}
            >
              {currentTimeStr}
            </div>
          )}

          {/* CEO Invite Teammate Button */}
          {isCeo && onOpenInvite && (
            <button
              onClick={onOpenInvite}
              aria-label="Invite Teammate"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--shiftpe-coral)',
                color: 'var(--button-text-on-coral)',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: '0 2px 10px var(--shiftpe-coral-glow)',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
            >
              <UserPlus size={14} />
              <span className="dot-btn-label">Invite</span>
            </button>
          )}

          {/* Notification Bell */}
          <NotificationPanel
            onOpenOnboarding={onOpenOnboarding || (() => {})}
            onSelectTab={handleSelectApp}
            onUrgentAlertChange={onUrgentAlertChange}
          />

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--line)',
              backgroundColor: 'var(--surface-subtle)',
              color: theme === 'dark' ? 'var(--shiftpe-coral)' : 'var(--accent-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User Profile Avatar & Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              aria-label="Open User Profile Menu"
              aria-expanded={isUserMenuOpen}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '3px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--line)',
                backgroundColor: 'var(--surface-subtle)'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isCeo ? 'var(--shiftpe-coral)' : 'var(--accent-blue)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <ChevronDown size={13} color="var(--muted)" style={{ marginRight: '4px' }} />
            </button>

            {/* Rich User Dropdown Menu */}
            {isUserMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '46px',
                  right: 0,
                  width: '280px',
                  backgroundColor: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.55), var(--card-glow)',
                  zIndex: 1020,
                  animation: 'fadeIn 0.15s ease'
                }}
              >
                {/* User Info Header */}
                <div style={{ marginBottom: '14px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: isCeo ? 'var(--shiftpe-coral)' : 'var(--accent-blue)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor:
                          user?.role === 'founder'
                            ? 'rgba(255, 95, 85, 0.15)'
                            : user?.role === 'ceo'
                            ? 'rgba(180, 0, 255, 0.15)'
                            : user?.role === 'manager'
                            ? 'var(--shiftpe-coral-light)'
                            : 'rgba(59, 130, 246, 0.15)',
                        color:
                          user?.role === 'founder'
                            ? 'var(--shiftpe-coral)'
                            : user?.role === 'ceo'
                            ? '#d47aff'
                            : user?.role === 'manager'
                            ? 'var(--shiftpe-coral)'
                            : 'var(--accent-blue)',
                        border:
                          user?.role === 'founder'
                            ? '1px solid var(--shiftpe-coral-border)'
                            : user?.role === 'ceo'
                            ? '1px solid rgba(180, 0, 255, 0.3)'
                            : '1px solid var(--line)'
                      }}
                    >
                      {user?.role}
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--surface-subtle)',
                        color: 'var(--text)'
                      }}
                    >
                      {user?.designation || 'Teammate'}
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        color: 'var(--accent-green)'
                      }}
                    >
                      &bull; {user?.domain}
                    </span>
                  </div>
                </div>

                {/* Profile Navigation & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                  {/* Edit Profile Button */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsEditProfileOpen(true);
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--shiftpe-coral-light)',
                      border: '1px solid var(--shiftpe-coral-border)',
                      color: 'var(--shiftpe-coral)',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Edit My Profile</span>
                  </button>

                  {/* View In Directory */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleSelectApp('People');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text)',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Users size={14} color="var(--muted)" />
                    <span>View in Directory</span>
                  </button>

                  {/* Daily Attendance */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleSelectApp('Attendance');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text)',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Clock size={14} color="var(--muted)" />
                    <span>My Attendance Log</span>
                  </button>

                  {/* Salary Ledger */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleSelectApp('Salary');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text)',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <CreditCard size={14} color="var(--muted)" />
                    <span>My Salary & Ledger</span>
                  </button>

                  {/* Contributions Heatmap */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleSelectApp('Contributions');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text)',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--panel-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <GitCommit size={14} color="var(--muted)" />
                    <span>Contribution Heatmap</span>
                  </button>
                </div>

                {/* 2FA Status Banner */}
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '10px'
                  }}
                >
                  <ShieldCheck size={14} color="var(--accent-green)" />
                  <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 600 }}>
                    2FA Security &bull; Protected
                  </span>
                </div>

                {/* Theme Mode Option */}
                <button
                  onClick={() => {
                    toggleTheme();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    fontSize: '12px',
                    fontWeight: 500,
                    marginBottom: '10px',
                    backgroundColor: 'var(--surface-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {theme === 'dark' ? <Sun size={14} color="var(--shiftpe-coral)" /> : <Moon size={14} color="var(--accent-amber)" />}
                    <span>Theme: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                  <span style={{ fontSize: '10.5px', color: 'var(--muted)' }}>Toggle</span>
                </button>

                {/* Incomplete Onboarding Reminder */}
                {user && !user.onboardingCompleted && onOpenOnboarding && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenOnboarding();
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
                      fontSize: '12px',
                      fontWeight: 600,
                      marginBottom: '8px'
                    }}
                  >
                    <AlertCircle size={14} />
                    <span>Complete Profile Setup</span>
                  </button>
                )}

                {/* Sign Out */}
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
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
                      fontWeight: 600
                    }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out of ShiftPe</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Vertical Flyout Sub-Apps Menu ("The Dot" Category Popover) */}
      {activeCategoryData && (
        <div
          role="dialog"
          aria-label={`${activeCategoryData.name} Apps`}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onMouseLeave={handleMouseLeaveNav}
          style={{
            position: 'absolute',
            top: '66px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '92%',
            maxWidth: '920px',
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65), var(--card-glow)',
            zIndex: 1015,
            animation: 'flyoutDown 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <style>{`
            @keyframes flyoutDown {
              from { opacity: 0; transform: translate(-50%, -8px) scale(0.99); }
              to { opacity: 1; transform: translate(-50%, 0) scale(1); }
            }
          `}</style>

          {/* Category Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              borderBottom: '1px solid var(--line)',
              paddingBottom: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>
                {activeCategoryData.name} Apps
              </span>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                &bull; {activeCategoryData.tagline}
              </span>
              {activeCategoryData.ceoOnly && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--shiftpe-coral)',
                    color: '#ffffff'
                  }}
                >
                  CEO Restricted
                </span>
              )}
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
                color: 'var(--muted)'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Sub-Apps Grid (Categorized Launchers) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '10px'
            }}
          >
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
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isCurrentApp ? 'var(--shiftpe-coral-light)' : 'transparent',
                    border: isCurrentApp ? '1px solid var(--shiftpe-coral-border)' : '1px solid transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
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
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isCurrentApp ? 'var(--shiftpe-coral)' : 'var(--surface-subtle)',
                      border: '1px solid var(--line)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isCurrentApp ? '#ffffff' : 'var(--text)',
                      flexShrink: 0
                    }}
                  >
                    <AppIcon size={18} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: isCurrentApp ? 'var(--shiftpe-coral)' : 'var(--text)'
                        }}
                      >
                        {app.name}
                      </span>
                      {app.badge && (
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'rgba(255, 95, 85, 0.15)',
                            color: 'var(--shiftpe-coral)'
                          }}
                        >
                          {app.badge}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: '11px',
                        color: 'var(--muted)',
                        marginTop: '3px',
                        lineHeight: 1.35
                      }}
                    >
                      {app.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Drawer Navigation (When Screen < 768px) */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-label="Mobile Navigation"
          style={{
            position: 'fixed',
            inset: '66px 0 0 0',
            backgroundColor: 'var(--panel)',
            borderTop: '1px solid var(--line)',
            padding: '20px',
            overflowY: 'auto',
            zIndex: 1005,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          {/* Home Link */}
          <button
            onClick={() => handleSelectApp('Home')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: activeTab === 'Home' ? 'var(--shiftpe-coral-light)' : 'transparent',
              color: activeTab === 'Home' ? 'var(--shiftpe-coral)' : 'var(--text)',
              fontWeight: 700,
              fontSize: '14px',
              marginBottom: '12px'
            }}
          >
            <LayoutDashboard size={18} />
            <span>Home Hub</span>
          </button>

          {/* Grouped Categories */}
          {categories.map((cat) => {
            if (cat.ceoOnly && !isCeo) return null;

            return (
              <div key={cat.id} style={{ marginBottom: '18px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    color: 'var(--shiftpe-coral)',
                    marginBottom: '8px',
                    paddingLeft: '4px'
                  }}
                >
                  {cat.name}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {cat.items.map((app) => {
                    const AppIcon = app.icon;
                    const isCurrent = activeTab === app.id;

                    return (
                      <button
                        key={app.id}
                        onClick={() => handleSelectApp(app.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isCurrent ? 'var(--shiftpe-coral-light)' : 'transparent',
                          color: isCurrent ? 'var(--shiftpe-coral)' : 'var(--text)',
                          fontWeight: isCurrent ? 700 : 500,
                          fontSize: '13px',
                          textAlign: 'left'
                        }}
                      >
                        <AppIcon size={16} />
                        <span>{app.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onSuccess={() => {
          setIsEditProfileOpen(false);
        }}
      />
    </header>
  );
};
