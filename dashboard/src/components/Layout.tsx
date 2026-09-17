import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Smartphone,
  MessageSquare,
  Webhook,
  Key,
  FileText,
  ClipboardList,
  LogOut,
  Send,
  Server,
  Puzzle,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  Languages,
  Search,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  UserCircle,
  Plus,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { type UserRole } from '../hooks/useRole';
import { languageOptions, resolveSupportedLanguage, rtlLanguages, type SupportedLanguage } from '../i18n';
import { healthApi } from '../services/api';
import { useSessionsQuery } from '../hooks/queries';
import { CommandSearchModal } from './CommandSearchModal';
import './Layout.css';

interface LayoutProps {
  onLogout: () => void;
  userRole: UserRole | null;
}

interface NavGroup {
  key: string;
  labelEn: string;
  items: Array<{
    to: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    key: string;
    labelEn: string;
    adminOnly: boolean;
  }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'overview',
    labelEn: 'OVERVIEW',
    items: [
      { to: '/', icon: LayoutDashboard, key: 'dashboard', labelEn: 'Dashboard', adminOnly: false },
    ],
  },
  {
    key: 'messaging',
    labelEn: 'MESSAGING & CAMPAIGNS',
    items: [
      { to: '/message-tester', icon: Send, key: 'messageTester', labelEn: 'Broadcast & Outreach', adminOnly: false },
      { to: '/chats', icon: MessageSquare, key: 'chats', labelEn: 'Live Chats & Inbox', adminOnly: false },
      { to: '/templates', icon: ClipboardList, key: 'templates', labelEn: 'Message Templates', adminOnly: false },
    ],
  },
  {
    key: 'connectivity',
    labelEn: 'SESSIONS & CONNECTIVITY',
    items: [
      { to: '/sessions', icon: Smartphone, key: 'sessions', labelEn: 'WhatsApp Sessions', adminOnly: false },
      { to: '/webhooks', icon: Webhook, key: 'webhooks', labelEn: 'Webhooks & Events', adminOnly: false },
    ],
  },
  {
    key: 'administration',
    labelEn: 'ADMINISTRATION & GATEWAY',
    items: [
      { to: '/api-keys', icon: Key, key: 'apiKeys', labelEn: 'API Keys & Access', adminOnly: true },
      { to: '/infrastructure', icon: Server, key: 'infrastructure', labelEn: 'Infrastructure & System', adminOnly: true },
      { to: '/plugins', icon: Puzzle, key: 'plugins', labelEn: 'Plugins & Addons', adminOnly: true },
      { to: '/logs', icon: FileText, key: 'logs', labelEn: 'System Audit Logs', adminOnly: false },
    ],
  },
];

const themeIcons = { light: Sun, dark: Moon, system: Monitor };

export function Layout({ onLogout, userRole }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const ThemeIcon = themeIcons[theme];
  const themeLabel = t(`theme.${resolvedTheme === 'dark' ? 'light' : 'dark'}`);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [version, setVersion] = useState(__APP_VERSION__);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const languageMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Active Sessions for Live Status Pill in Topbar
  const { data: allSessions = [] } = useSessionsQuery();
  const readySessionsCount = allSessions.filter((s) => s.status === 'ready').length;

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setIsMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let active = true;
    healthApi
      .check()
      .then((info) => {
        if (active && info?.version) setVersion(info.version);
      })
      .catch(() => {
        /* keep the build-time fallback */
      });
    return () => {
      active = false;
    };
  }, []);

  // Global Ctrl+K / Cmd+K listener for Command Search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleNavClick = () => {
    if (isMobile) setIsMobileOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (isLanguageMenuOpen && !languageMenuRef.current?.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
      if (isUserMenuOpen && !userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLanguageMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isLanguageMenuOpen, isUserMenuOpen]);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  const currentLang = resolveSupportedLanguage(i18n.resolvedLanguage || i18n.language);
  const languageLabel = languageOptions.find((option) => option.value === currentLang)?.compactLabel ?? 'EN';
  const changeLanguage = (language: SupportedLanguage) => {
    setIsLanguageMenuOpen(false);
    void i18n.changeLanguage(language);
  };
  const isRtl = rtlLanguages.includes(currentLang);

  const roleLabel =
    userRole === 'admin' ? 'Super Admin' : userRole === 'operator' ? 'Operator' : 'Viewer';

  return (
    <div className={`layout-root ${isRtl ? 'rtl' : ''}`}>
      {/* Mobile Backdrop */}
      {isMobile && isMobileOpen && (
        <div className="sr-sidebar-backdrop" onClick={() => setIsMobileOpen(false)} aria-hidden="true" />
      )}

      {/* ==================== Navy Admin Sidebar ==================== */}
      <aside
        className={`sr-sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''} ${
          isMobileOpen ? 'open' : ''
        }`}
      >
        {/* Sidebar Header with Shubham Rathi Signature "शु" Badge */}
        <div className="sr-sidebar-header">
          <div className="sr-logo-circle" title="शुभम राठी">
            <span className="sr-logo-char">शु</span>
          </div>
          {!isCollapsed && (
            <div className="sr-brand-info">
              <div className="sr-brand-name-row">
                <span className="sr-brand-title">शुभम राठी</span>
                <span className="sr-brand-badge">PRO</span>
              </div>
              <span className="sr-brand-subtitle">WhatsApp Automation</span>
            </div>
          )}
          {isMobile && (
            <button className="sr-mobile-close-btn" onClick={() => setIsMobileOpen(false)} aria-label="Close menu">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Grouped Sidebar Navigation */}
        <nav className="sr-sidebar-nav">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => !item.adminOnly || userRole === 'admin');
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.key} className="sr-nav-group">
                {!isCollapsed && (
                  <div className="sr-nav-group-heading">
                    {group.labelEn}
                  </div>
                )}
                <div className="sr-nav-group-items">
                  {visibleItems.map(({ to, icon: Icon, key, labelEn }) => {
                    const label = t(`nav.${key}`, { defaultValue: labelEn });
                    const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

                    return (
                      <NavLink
                        key={to}
                        to={to}
                        className={`sr-nav-link ${isActive ? 'active' : ''}`}
                        end={to === '/'}
                        onClick={handleNavClick}
                        title={isCollapsed ? label : undefined}
                      >
                        <Icon size={18} className="sr-nav-icon" />
                        {!isCollapsed && <span className="sr-nav-text">{label}</span>}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Bottom Status */}
        <div className="sr-sidebar-footer">
          <div className="sr-sidebar-status">
            <span className="sr-live-dot" />
            {!isCollapsed && (
              <div className="sr-status-text-group">
                <span className="sr-status-title">OpenWA Engine Active</span>
                <span className="sr-status-version">v{version}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ==================== Main Wrapper ==================== */}
      <div className={`sr-main-wrapper ${isCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`}>
        {/* ==================== Top Navigation Bar ==================== */}
        <header className="sr-topbar">
          <div className="sr-topbar-left">
            {isMobile ? (
              <button className="sr-topbar-btn" onClick={toggleMobile} aria-label="Open sidebar menu">
                <Menu size={22} />
              </button>
            ) : (
              <button
                className="sr-topbar-btn"
                onClick={toggleCollapse}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
              </button>
            )}

            {/* Quick Command Search Bar (Ctrl+K) */}
            <button
              className="sr-command-trigger"
              onClick={() => setIsCommandOpen(true)}
              aria-label="Search sessions, broadcasts, chats"
            >
              <Search size={16} className="sr-search-icon" />
              <span className="sr-search-placeholder">Search sessions, broadcasts, chats...</span>
              <kbd className="sr-search-kbd">Ctrl K</kbd>
            </button>
          </div>

          <div className="sr-topbar-right">
            {/* Live WhatsApp Status Pill */}
            <div className="sr-engine-pill" title="WhatsApp OpenWA Engine Status">
              <span className="sr-engine-dot" />
              <span className="sr-engine-pill-text">
                {readySessionsCount > 0 ? `${readySessionsCount} Sessions Active` : 'OpenWA Engine Online'}
              </span>
            </div>

            {/* Quick Action Button: New Broadcast */}
            <button
              className="sr-action-btn"
              onClick={() => navigate('/message-tester')}
              title="Launch Campaign Outreach"
            >
              <Plus size={16} />
              <span className="sr-action-btn-text">New Broadcast</span>
            </button>

            {/* Language Switcher Dropdown */}
            <div className="sr-dropdown-wrap" ref={languageMenuRef}>
              <button
                className="sr-topbar-icon-btn sr-lang-btn"
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                title="Change language"
                aria-label="Change language"
              >
                <Languages size={18} />
                <span className="sr-lang-label">{languageLabel}</span>
              </button>
              {isLanguageMenuOpen && (
                <div className="sr-dropdown-panel sr-lang-dropdown">
                  <div className="sr-dropdown-header">Select Language</div>
                  <div className="sr-lang-list">
                    {languageOptions.map((opt) => (
                      <button
                        key={opt.value}
                        className={`sr-dropdown-item ${opt.value === currentLang ? 'active' : ''}`}
                        onClick={() => changeLanguage(opt.value)}
                      >
                        <span className="sr-lang-item-name">{opt.label}</span>
                        <span className="sr-lang-item-badge">{opt.compactLabel}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              className="sr-topbar-icon-btn"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              title={t('theme.toggleTo', { value: themeLabel })}
              aria-label="Toggle theme"
            >
              <ThemeIcon size={18} />
            </button>

            {/* Notification Bell */}
            <button className="sr-topbar-icon-btn sr-bell-btn" aria-label="Notifications">
              <Bell size={18} />
              <span className="sr-bell-dot" />
            </button>

            {/* User Profile Avatar & Dropdown */}
            <div className="sr-dropdown-wrap" ref={userMenuRef}>
              <button
                className="sr-avatar-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-label="User profile options"
              >
                <div className="sr-avatar-circle">
                  <span>SR</span>
                </div>
              </button>
              {isUserMenuOpen && (
                <div className="sr-dropdown-panel sr-user-dropdown">
                  <div className="sr-user-card">
                    <div className="sr-user-name">Shubham Rathi Admin</div>
                    <div className="sr-user-role-badge">{roleLabel}</div>
                  </div>
                  <div className="sr-dropdown-divider" />
                  <div className="sr-dropdown-item-row" onClick={() => navigate('/')}>
                    <UserCircle size={16} />
                    <span>Account Overview</span>
                  </div>
                  <div className="sr-dropdown-divider" />
                  <button className="sr-dropdown-item-row sr-logout-action" onClick={onLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ==================== Main Page Content Area ==================== */}
        <main className="sr-main-content">
          <Outlet />
        </main>
      </div>

      {/* Command Search Dialog (Ctrl+K) */}
      <CommandSearchModal open={isCommandOpen} onClose={() => setIsCommandOpen(false)} userRole={userRole} />
    </div>
  );
}
