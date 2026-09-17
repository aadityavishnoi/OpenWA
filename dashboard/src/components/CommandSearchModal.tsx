import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Smartphone,
  MessageSquare,
  Webhook,
  Key,
  FileText,
  ClipboardList,
  Send,
  Server,
  Puzzle,
  QrCode,
  X,
  ArrowRight,
} from 'lucide-react';
import './CommandSearchModal.css';

interface CommandSearchModalProps {
  open: boolean;
  onClose: () => void;
  userRole: string | null;
}

interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  to?: string;
  action?: () => void;
  adminOnly?: boolean;
}

export function CommandSearchModal({ open, onClose, userRole }: CommandSearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: 'nav-dashboard',
        title: 'Dashboard Overview',
        description: 'View operational WhatsApp metrics, session health & charts',
        category: 'Navigation',
        icon: LayoutDashboard,
        to: '/',
      },
      {
        id: 'nav-broadcast',
        title: 'Broadcast & Outreach (Message Tester)',
        description: 'Send text, media, polls, or bulk CSV messages',
        category: 'Messaging',
        icon: Send,
        to: '/message-tester',
      },
      {
        id: 'nav-chats',
        title: 'Live Chats & Inbox',
        description: 'Real-time two-way messaging, media & voice notes',
        category: 'Messaging',
        icon: MessageSquare,
        to: '/chats',
      },
      {
        id: 'nav-templates',
        title: 'Message Templates',
        description: 'Manage re-usable constituency campaign templates',
        category: 'Messaging',
        icon: ClipboardList,
        to: '/templates',
      },
      {
        id: 'nav-sessions',
        title: 'WhatsApp Sessions & QR Pairing',
        description: 'Manage 20+ active phone numbers, pair QR code or code auth',
        category: 'Connectivity',
        icon: Smartphone,
        to: '/sessions',
      },
      {
        id: 'nav-webhooks',
        title: 'Webhook Integrations',
        description: 'Configure real-time event callbacks for incoming messages',
        category: 'Connectivity',
        icon: Webhook,
        to: '/webhooks',
      },
      {
        id: 'nav-logs',
        title: 'System Audit Logs',
        description: 'Inspect live engine delivery stream and diagnostic logs',
        category: 'System',
        icon: FileText,
        to: '/logs',
      },
      {
        id: 'nav-apikeys',
        title: 'API Keys & Access Control',
        description: 'Manage authentication tokens and RBAC permissions',
        category: 'System',
        icon: Key,
        to: '/api-keys',
        adminOnly: true,
      },
      {
        id: 'nav-infra',
        title: 'Gateway Infrastructure',
        description: 'System memory, CPU usage, engine status & restart',
        category: 'System',
        icon: Server,
        to: '/infrastructure',
        adminOnly: true,
      },
      {
        id: 'nav-plugins',
        title: 'Plugins & Addons',
        description: 'Enterprise WhatsApp extensions and custom integrations',
        category: 'System',
        icon: Puzzle,
        to: '/plugins',
        adminOnly: true,
      },
      {
        id: 'act-qr',
        title: 'Scan QR to Pair WhatsApp',
        description: 'Connect a new WhatsApp phone number to the instance pool',
        category: 'Quick Actions',
        icon: QrCode,
        to: '/sessions',
      },
      {
        id: 'act-new-broadcast',
        title: 'Launch New Broadcast Campaign',
        description: 'Quickly open campaign composer with variables & media',
        category: 'Quick Actions',
        icon: Send,
        to: '/message-tester',
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return commands
      .filter((cmd) => !cmd.adminOnly || userRole === 'admin')
      .filter((cmd) => {
        if (!q) return true;
        return (
          cmd.title.toLowerCase().includes(q) ||
          cmd.description.toLowerCase().includes(q) ||
          cmd.category.toLowerCase().includes(q)
        );
      });
  }, [commands, query, userRole]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item: CommandItem) => {
    if (item.action) {
      item.action();
    } else if (item.to) {
      navigate(item.to);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="sr-cmd-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sr-cmd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sr-cmd-header">
          <Search className="sr-cmd-search-icon" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="sr-cmd-input"
            placeholder="Search sessions, broadcasts, chats, templates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="sr-cmd-close-btn" onClick={onClose} aria-label="Close search">
            <X size={18} />
          </button>
        </div>

        <div className="sr-cmd-body">
          {filtered.length === 0 ? (
            <div className="sr-cmd-empty">
              <p className="sr-cmd-empty-text">No matching commands or navigation found.</p>
              <span className="sr-cmd-empty-hint">Try searching for &quot;broadcast&quot;, &quot;sessions&quot;, or &quot;qr&quot;</span>
            </div>
          ) : (
            <div className="sr-cmd-list" role="listbox">
              {filtered.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    className={`sr-cmd-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="sr-cmd-item-icon">
                      <Icon size={18} />
                    </div>
                    <div className="sr-cmd-item-info">
                      <div className="sr-cmd-item-title-row">
                        <span className="sr-cmd-item-title">{item.title}</span>
                        <span className="sr-cmd-item-badge">{item.category}</span>
                      </div>
                      <span className="sr-cmd-item-desc">{item.description}</span>
                    </div>
                    <ArrowRight className="sr-cmd-item-arrow" size={16} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="sr-cmd-footer">
          <div className="sr-cmd-shortcuts">
            <span>
              <kbd>↑</kbd> <kbd>↓</kbd> to navigate
            </span>
            <span>
              <kbd>↵</kbd> to select
            </span>
            <span>
              <kbd>esc</kbd> to close
            </span>
          </div>
          <span className="sr-cmd-brand">Shubham Rathi WhatsApp Suite</span>
        </div>
      </div>
    </div>
  );
}
