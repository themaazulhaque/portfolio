'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';
import { logoutAction } from '@/app/actions/auth';

const NAV = [
  {
    label: 'Main',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: '◈' },
      { href: '/admin/dashboard/projects', label: 'Projects', icon: '◰' },
      { href: '/admin/dashboard/experience', label: 'Experience', icon: '◫' },
      { href: '/admin/dashboard/tech', label: 'Tech Stack', icon: '◱' },
      { href: '/admin/dashboard/skills', label: 'Skills', icon: '◎' },
      { href: '/admin/dashboard/services', label: 'Services', icon: '◇' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/dashboard/media', label: 'Media', icon: '◉' },
      { href: '/admin/dashboard/messages', label: 'Messages', icon: '◳' },
      { href: '/admin/dashboard/reviews', label: 'Reviews', icon: '★' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/dashboard/settings', label: 'Settings', icon: '◈' },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {isOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M3 12h18M3 6h18M3 18h18" />
          )}
        </svg>
      </button>
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}
      <aside className={`sidebar${isOpen ? ' is-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-dot" />
          <span className="sidebar-brand-text">CMS</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((section) => (
            <div key={section.label} className="nav-section">
              <div className="nav-section-label">{section.label}</div>
              {section.items.map((item) => {
                const active =
                  item.href === '/admin/dashboard'
                    ? pathname === '/admin/dashboard'
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item${active ? ' active' : ''}`}
                  >
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={handleLogout}
            disabled={pending}
            className="nav-item"
            style={{ width: '100%', color: 'var(--danger)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {pending ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </aside>
    </>
  );
}
