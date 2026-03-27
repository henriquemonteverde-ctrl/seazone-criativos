'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconImage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function HouseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#FC6058">
      <path d="M3 12L12 3l9 9v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9z" />
      <path d="M9 21V12h6v9" fill="#000D26" />
    </svg>
  );
}

const menuItems = [
  { href: '/', label: 'Dashboard', icon: IconGrid },
  { href: '/criativos', label: 'Criativos Estáticos', icon: IconImage },
  { href: '/videos', label: 'Vídeos', icon: IconPlay, disabled: true, badge: 'Em breve' },
  { href: '/assets', label: 'Assets', icon: IconFolder },
  { href: '/configuracoes', label: 'Configurações', icon: IconGear },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex flex-col flex-shrink-0"
      style={{ width: 240, minHeight: '100vh', background: '#000D26', borderRight: '1px solid #0a2a6e' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-6" style={{ borderBottom: '1px solid #0a2a6e' }}>
        <HouseIcon />
        <span className="text-white font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-inter), Helvetica, sans-serif', letterSpacing: '-0.02em' }}>
          seazone
        </span>
      </div>

      {/* Section label */}
      <div className="px-6 pt-6 pb-2">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#3a5a99' }}>
          Menu
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-3 flex-1">
        {menuItems.map(({ href, label, icon: Icon, disabled, badge }) => {
          const isActive = pathname === href;

          if (disabled) {
            return (
              <div
                key={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-not-allowed"
                style={{ opacity: 0.4 }}
              >
                <span style={{ color: '#6593FF' }}>
                  <Icon />
                </span>
                <span className="text-sm flex-1" style={{ color: '#6593FF' }}>{label}</span>
                {badge && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                    style={{ background: '#0a2a6e', color: '#6593FF', fontSize: '10px' }}
                  >
                    {badge}
                  </span>
                )}
              </div>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150"
              style={{
                background: isActive ? '#0055FF' : 'transparent',
                color: isActive ? '#ffffff' : '#6593FF',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = '#0a2a6e';
                  (e.currentTarget as HTMLElement).style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = '#6593FF';
                }
              }}
            >
              <Icon />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5" style={{ borderTop: '1px solid #0a2a6e' }}>
        <p className="text-xs" style={{ color: '#3a5a99' }}>Máquina de Criativos</p>
        <p className="text-xs mt-0.5" style={{ color: '#1e3a7a' }}>v1.0 — Seazone © 2026</p>
      </div>
    </aside>
  );
}
